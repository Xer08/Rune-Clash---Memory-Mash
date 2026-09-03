let currentTurn=1;
let previewTimer=null;

function startGame(){
  if(previewTimer){clearTimeout(previewTimer);previewTimer=null}
  // Reinicializamos la sala y, al FINAL de todos los resets, aplicamos los
  // valores de la clase. Así ninguna rutina de arranque puede borrar el MP.
  initializeDungeon();
  resetPlayer();
  applyHeroStats();
  createEnemy(1);
  initializeBoard(true);
  resetState();
  initializeHeroMana();
  currentTurn=1;
  updateTurnDisplay();
  updateCombatUI();
}

function startBoardPreview(){
  const board=document.getElementById("board");
  if(!board)return;
  boardLocked=true;
  board.classList.add("memory-preview");
  document.querySelectorAll("#board .card").forEach(card=>{
    card.classList.add("flipped");
    card.dataset.state="preview";
  });
  setCombatMessage("🧠 Memoriza las runas…");
  previewTimer=setTimeout(()=>{
    document.querySelectorAll("#board .card").forEach(card=>{
      card.classList.remove("flipped");
      card.dataset.state="hidden";
    });
    board.classList.remove("memory-preview");
    boardLocked=false;
    previewTimer=null;
    setCombatMessage("¡Tu turno! Encuentra una pareja.");
  },500);
}

function updateTurnDisplay(){const el=document.getElementById("turn-number");if(el)el.textContent=currentTurn}
function incrementTurn(){currentTurn++;updateTurnDisplay()}
function resetRun(){
  hideModals();
  resetPlayer();
  applyHeroStats();
  initializeDungeon();
  createEnemy(1);
  initializeBoard(true);
  resetState();
  initializeHeroMana();
  currentTurn=1;
  updateTurnDisplay();
  updateCombatUI();
}
function exitToHeroSelection(){
  if(previewTimer){clearTimeout(previewTimer);previewTimer=null}
  hideModals();
  const gameScreen=document.getElementById("game-screen");
  if(gameScreen){gameScreen.classList.remove("screen-shake","hit-flash");void gameScreen.offsetWidth}
  const board=document.getElementById("board");
  if(board)board.classList.remove("memory-preview");
  resetPlayer();
  resetHero();
  initializeDungeon();
  resetState();
  currentTurn=1;
  updateTurnDisplay();
  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("hero-screen").classList.remove("hidden");
  document.getElementById("board").innerHTML="";
  boardLocked=false;
}
function setupMainEvents(){
  initializeHeroSelection();
  document.getElementById("hero-ability-btn").addEventListener("click",useHeroAbility);
  document.getElementById("charged-ability-btn").addEventListener("click",useChargedAbility);
  document.getElementById("restart-btn").addEventListener("click",resetRun);
  document.getElementById("victory-restart-btn").addEventListener("click",resetRun);
  document.getElementById("quit-btn").addEventListener("click",()=>showModal("confirm-modal"));
  document.getElementById("cancel-quit").addEventListener("click",hideModals);
  document.getElementById("confirm-quit").addEventListener("click",exitToHeroSelection);
  document.addEventListener("cardMatch",()=>incrementTurn());
  document.addEventListener("stateChange",e=>{if(e.detail.state===GameState.GAME_OVER||e.detail.state===GameState.VICTORY)boardLocked=true});
}
function preventMobileGestures(){
  document.addEventListener("contextmenu",e=>{if(e.target.closest("#board"))e.preventDefault()});
  document.addEventListener("touchmove",e=>{if(e.target.closest("#board"))e.preventDefault()},{passive:false});
  document.addEventListener("gesturestart",e=>e.preventDefault());
  document.addEventListener("dblclick",e=>e.preventDefault());
}
function registerServiceWorker(){
  if(!("serviceWorker"in navigator))return;
  window.addEventListener("load",()=>{
    navigator.serviceWorker.addEventListener("controllerchange",()=>{
      if(window.__swReloaded)return;
      window.__swReloaded=true;
      window.location.reload();
    });
    navigator.serviceWorker.register("./sw.js?v=18",{updateViaCache:"none"})
      .then(r=>{
        r.update();
        setTimeout(()=>r.update(),1500);
        console.log("SW v18 listo",r.scope);
      })
      .catch(console.warn);
  });
}
document.addEventListener("DOMContentLoaded",()=>{initJuiciness();setupMainEvents();preventMobileGestures();registerServiceWorker()});
Object.assign(window,{startGame,resetRun,exitToHeroSelection,updateTurnDisplay,incrementTurn,startBoardPreview});
