let audioCtx=null;
function initAudio(){
  if(!audioCtx){try{audioCtx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}}
  if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
}
function tone(freq,duration=.12,type="sine",volume=.045,slide=0){
  initAudio(); if(!audioCtx)return;
  const now=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,now);if(slide)o.frequency.linearRampToValueAtTime(freq+slide,now+duration);
  g.gain.setValueAtTime(volume,now);g.gain.exponentialRampToValueAtTime(.001,now+duration);
  o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+duration)
}
function playCardFlipSound(){tone(240,.07,"triangle",.035,70)}
function playMatchSound(){tone(520,.1,"sine",.055,180);setTimeout(()=>tone(780,.12,"sine",.04,100),55)}
function playMismatchSound(){tone(150,.16,"sawtooth",.035,-60)}
function playAttackSound(){tone(110,.08,"square",.05,-35);setTimeout(()=>tone(70,.1,"triangle",.035,-20),45)}
function playDamageSound(){tone(95,.12,"square",.055,-45);setTimeout(()=>tone(55,.16,"sawtooth",.035,-20),45)}
function playShieldSound(){tone(320,.14,"sine",.04,140)}
function playHealSound(){tone(430,.12,"sine",.04,160);setTimeout(()=>tone(650,.13,"sine",.03,80),70)}
function playChargeSound(){tone(440,.1,"triangle",.04,220);setTimeout(()=>tone(660,.12,"triangle",.035,260),60)}
function playRevealSound(){tone(700,.12,"sine",.035,-180)}
function playVictorySound(){[0,90,180,270].forEach((d,i)=>setTimeout(()=>tone(420+i*100,.18,"sine",.05,80),d))}
function playGameOverSound(){tone(120,.28,"sawtooth",.045,-60);setTimeout(()=>tone(80,.35,"triangle",.035,-30),180)}
function hapticFeedback(type){
  if(!navigator.vibrate)return;
  const patterns={cardFlip:30,match:[40,40,40],mismatch:[20,30,20],damage:150,heal:[50,30,50],shield:[30,20,30],ultimate:[80,40,80],victory:[200,80,200],gameOver:[300,150,300],dodge:[20,10,20]};
  navigator.vibrate(patterns[type]||25)
}
function showFloatingText(text,type="damage",x=50,y=50){
  const el=document.createElement("div");el.className=`floating-number ${type}`;el.textContent=text;el.style.left=`${x}%`;el.style.top=`${y}%`;document.body.appendChild(el);setTimeout(()=>el.remove(),900)
}
function triggerScreenShake(){
  const el=document.getElementById("game-screen");
  if(!el)return;
  el.classList.remove("screen-shake");void el.offsetWidth;el.classList.add("screen-shake");
  clearTimeout(window.__shakeCleanup);
  window.__shakeCleanup=setTimeout(()=>el.classList.remove("screen-shake"),380);
}
function flashScreen(){const el=document.getElementById("game-screen");el.classList.add("hit-flash");setTimeout(()=>el.classList.remove("hit-flash"),250)}
function initJuiciness(){const once=()=>initAudio();document.addEventListener("pointerdown",once,{once:true})}
Object.assign(window,{initAudio,initJuiciness,playCardFlipSound,playMatchSound,playMismatchSound,playAttackSound,playDamageSound,playShieldSound,playHealSound,playChargeSound,playRevealSound,playVictorySound,playGameOverSound,hapticFeedback,showFloatingText,triggerScreenShake,flashScreen});
