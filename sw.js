const VERSION = "18";
const CACHE_NAME = `rune-clash-v${VERSION}`;
const ASSETS = [
  "./", "./index.html", "./manifest.json",
  "./css/theme.css?v=18", "./css/board.css?v=18", "./css/effects.css?v=18",
  "./js/state.js?v=18", "./js/juiciness.js?v=18", "./js/combat.js?v=18", "./js/hero.js?v=18",
  "./js/board.js?v=18", "./js/dungeon.js?v=18", "./js/main.js?v=18",
  "./icon-192.png", "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Do not let one missing/temporarily unavailable file abort the entire SW install.
    await Promise.all(ASSETS.map(async asset => {
      try { await cache.add(asset); } catch (err) { console.warn("No se pudo precachear", asset, err); }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isAppCode = /\\.(html?|css|js)$/.test(url.pathname) || request.mode === "navigate";

  event.respondWith((async () => {
    if (isAppCode) {
      // Always ask the network first for app code. This is the important part:
      // GitHub Pages/CDN/browser caches cannot trap the PWA on an old JS/CSS build.
      try {
        const fresh = await fetch(request, { cache: "reload" });
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, fresh.clone());
        }
        return fresh;
      } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          return (await caches.match("./index.html")) || new Response("Sin conexión.", {status:503});
        }
        return new Response("Recurso no disponible sin conexión.", {status:503});
      }
    }

    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const network = await fetch(request);
      if (network && network.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, network.clone());
      }
      return network;
    } catch (err) {
      return new Response("Recurso no disponible sin conexión.", {status:503});
    }
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))));
  }
});
