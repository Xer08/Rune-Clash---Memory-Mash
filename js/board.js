const CardTypes=Object.freeze({SWORD:"sword",SHIELD:"shield",POTION:"potion",TRAP:"trap",ULTIMATE:"ultimate"});
const CardIcons={sword:"⚔️",shield:"🛡️",potion:"🧪",trap:"☠️",ultimate:"⚡"};
let cards=[],flippedCards=[],matchedPairs=0,totalPairs=8,requiredPairs=7,boardLocked=false,lastTouchTime=0;
function fisherYates(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function generateDeck(){const types=["sword","sword","sword","sword","shield","shield","shield","shield","potion","potion","potion","potion","trap","trap","ultimate","ultimate"];const deck=[];types.forEach((type,i)=>deck.push({id:i,type,icon:CardIcons[type],pairId:`${type}-${Math.floor(i/(type==="sword"||type==="shield"||type==="potion"?2:2))}`}));return fisherYates(deck)}
function initializeBoard(withPreview=true){
  const board=document.getElementById("board");
  if(!board)return;
  if(typeof previewTimer!=="undefined" && previewTimer){clearTimeout(previewTimer);previewTimer=null}
  cards=generateDeck();flippedCards=[];matchedPairs=0;window.matchedPairs=0;boardLocked=false;board.innerHTML="";
  cards.forEach(c=>board.appendChild(createCardElement(c)));
  if(withPreview && typeof startBoardPreview==="function")startBoardPreview();
  updateCombatUI();
}
function createCardElement(card){const el=document.createElement("button");el.type="button";el.className="card";el.dataset.id=card.id;el.dataset.type=card.type;el.dataset.state="hidden";el.setAttribute("aria-label","Runa oculta");
  el.innerHTML=`<span class="card-face card-back"></span><span class="card-face card-front">${card.icon}</span>`;
  const activate=e=>{if(e.type==="click"&&Date.now()-lastTouchTime<450)return;if(e.type==="touchstart")lastTouchTime=Date.now();handleCardClick(el)};
  el.addEventListener("touchstart",activate,{passive:true});el.addEventListener("click",activate);return el
}
function handleCardClick(el){
  initAudio();if(boardLocked||!canInteractWithCards()||el.classList.contains("flipped")||el.classList.contains("matched"))return;
  el.classList.add("flipped");el.dataset.state="flipped";flippedCards.push(el);playCardFlipSound();hapticFeedback("cardFlip");
  if(flippedCards.length===1){setState(GameState.PLAYER_TURN_CARD1);setCombatMessage("Segunda runa…");return}
  if(flippedCards.length===2){boardLocked=true;setState(GameState.EVALUATING_MATCH);evaluateMatch()}
}
function evaluateMatch(){
  const [a,b]=flippedCards;const match=a.dataset.type===b.dataset.type;
  if(match){
    setTimeout(()=>{
      setState(GameState.RESOLVING_EFFECT);a.classList.add("matched","match-pop");b.classList.add("matched","match-pop");a.dataset.state=b.dataset.state="matched";playMatchSound();hapticFeedback("match");if(a.dataset.type!==CardTypes.TRAP){matchedPairs++;window.matchedPairs=matchedPairs;}document.dispatchEvent(new CustomEvent("cardMatch",{detail:{cardType:a.dataset.type}}));
      if(typeof updateHeroAbilityUI==="function")updateHeroAbilityUI();},180)
  }else{
    a.classList.add("fail-pop");b.classList.add("fail-pop");playMismatchSound();hapticFeedback("mismatch");setCombatMessage("No coinciden…");
    setTimeout(()=>{a.classList.remove("flipped","fail-pop");b.classList.remove("flipped","fail-pop");a.dataset.state=b.dataset.state="hidden";flippedCards=[];boardLocked=false;
      const dodge=typeof checkRogueDodge==="function"&&checkRogueDodge();
      if(dodge){
        setState(GameState.PLAYER_TURN_IDLE);
        boardLocked=false;
        setCombatMessage("¡Esquiva! Sigue buscando.");
      }else{
        // enemyAttack() controla el bloqueo visual durante el turno enemigo.
        // No dejamos el bloqueo local del tablero activado, porque ese bloqueo
        // impediría todas las jugadas del siguiente turno aunque el estado
        // global ya haya vuelto a PLAYER_TURN_IDLE.
        boardLocked=false;
        if(setState(GameState.ENEMY_TURN)){
          setCombatMessage("👹 TURNO DEL ENEMIGO");
          enemyAttack();
        }else{
          // Recuperación de seguridad ante cualquier estado inesperado.
          boardLocked=false;
          setState(GameState.PLAYER_TURN_IDLE);
          setCombatMessage("Tu turno: encuentra una pareja.");
        }
      }
    },800)
  }
}
function resetBoard(){initializeBoard(true)}
function onRuneResolved(){
  flippedCards=[];boardLocked=false;
  if(enemy.currentHealth<=0){checkCombatEnd();return}
  setState(GameState.PLAYER_TURN_IDLE);setCombatMessage("¡Pareja acertada! Encuentra la siguiente.");updateCombatUI();
  if(matchedPairs>=requiredPairs){setCombatMessage("¡Tablero despejado! La trampa no era necesaria. Nueva oleada…");setTimeout(()=>initializeBoard(true),700)}
}
document.addEventListener("cardMatch",onCardMatch);
function onCardMatch(e){resolveRuneEffect(e.detail.cardType)}
document.addEventListener("runeResolved",onRuneResolved);
window.addEventListener("error",e=>console.error("Rune Clash:",e.error||e.message));
Object.assign(window,{CardTypes,CardIcons,cards,flippedCards,matchedPairs,totalPairs,requiredPairs,initializeBoard,createCardElement,resetBoard});
