const player={maxHealth:100,currentHealth:100,shield:0,baseAttack:15,ultimateCharge:0,maxUltimateCharge:100,mana:0,maxMana:0};
const enemy={maxHealth:70,currentHealth:70,attackDamage:10};
let gameStats={roomsCleared:0,pairsMatched:0,totalDamageDealt:0,totalDamageTaken:0};
let enemyAttackTimer=null;
let enemyAttackSequence=0;
let enemyFrozenTurns=0;
const runeEffects={
  sword:{name:"Espada",damage:15},shield:{name:"Escudo",shield:14},potion:{name:"Poción",healing:18},
  trap:{name:"Trampa",damage:12},ultimate:{name:"Carga Suprema",charge:25}
};
function initializeCombat(){resetPlayer();updateCombatUI()}
function resetPlayer(){if(enemyAttackTimer)clearTimeout(enemyAttackTimer);enemyAttackTimer=null;Object.assign(player,{maxHealth:100,currentHealth:100,shield:0,baseAttack:15,ultimateCharge:0,maxUltimateCharge:100,mana:0,maxMana:0});gameStats={roomsCleared:0,pairsMatched:0,totalDamageDealt:0,totalDamageTaken:0}}
function createEnemy(room){
  const s=1+(room-1)*.15;enemy.maxHealth=Math.round(70*s);enemy.currentHealth=enemy.maxHealth;enemy.attackDamage=Math.round(10*s);updateCombatUI()
}
function applyRelicBonuses(type,effect){
  const out={...effect};
  (window.activeRelics||[]).forEach(key=>{const r=window.relicDefinitions?.[key];if(!r)return;
    if(type==="sword"&&r.effect==="swordDamage")out.damage+=r.value;
    if(type==="shield"&&r.effect==="shieldBonus")out.shield+=r.value;
    if(type==="potion"&&r.effect==="healBonus")out.healing+=r.value;
    if(type==="trap"&&r.effect==="trapReduction")out.damage=Math.max(1,Math.round(out.damage*(1-r.value)));
    if(type==="ultimate"&&r.effect==="chargeBonus")out.charge+=r.value;
  });return out
}
function resolveRuneEffect(type){
  const effect=runeEffects[type];if(!effect)return;
  gameStats.pairsMatched++;
  if(typeof restoreMana==="function")restoreMana(5);
  else if(player.maxMana>0)player.mana=Math.min(player.maxMana,player.mana+5);
  const e=applyRelicBonuses(type,effect);
  if(type==="sword"){
    let dmg=player.baseAttack+e.damage;
    let critical=false;
    if(currentHeroClass==="warrior"&&player.ultimateCharge>=100){
      dmg=Math.round(dmg*heroClasses.warrior.criticalMultiplier);
      player.ultimateCharge=0;
      critical=true;
    }
    dealDamageToEnemy(dmg);
    showFloatingText(critical?`⚡ CRÍTICO -${dmg}`:`-${dmg}`,"damage",70,45);
    if(critical)setCombatMessage(`⚡ ¡Golpe Crítico del Guerrero! ${dmg} de daño.`);
  }
  if(type==="shield"){addShield(e.shield);showFloatingText(`+${e.shield}`,"shield",25,55)}
  if(type==="potion"){healPlayer(e.healing);showFloatingText(`+${e.healing} HP`,"heal",25,45)}
  if(type==="trap"){takeDamage(e.damage);showFloatingText(`-${e.damage}`,"enemy",28,45)}
  if(type==="ultimate"){chargeUltimate(e.charge);showFloatingText(`+${e.charge}%`,"charge",50,40)}
  updateCombatUI();
  document.dispatchEvent(new CustomEvent("runeResolved",{detail:{type}}))
}
function dealDamageToEnemy(damage){const actual=Math.min(enemy.currentHealth,Math.max(0,damage));enemy.currentHealth=Math.max(0,enemy.currentHealth-damage);gameStats.totalDamageDealt+=actual;playAttackSound();hapticFeedback("damage");flashScreen();updateCombatUI()}
function addShield(amount){player.shield+=amount;playShieldSound();hapticFeedback("shield")}
function healPlayer(amount){
  const before=player.currentHealth;player.currentHealth=Math.min(player.maxHealth,player.currentHealth+amount);const healed=player.currentHealth-before;
  const excess=Math.max(0,amount-healed);
  if(currentHeroClass==="warrior"&&excess){player.shield+=excess;showFloatingText(`+${excess} escudo`,"shield",30,55)}
  playHealSound();hapticFeedback("heal")
}
function takeDamage(amount){
  let remaining=Math.max(0,amount),blocked=0;
  if(player.shield){blocked=Math.min(player.shield,remaining);player.shield-=blocked;remaining-=blocked}
  if(remaining){player.currentHealth=Math.max(0,player.currentHealth-remaining);gameStats.totalDamageTaken+=remaining}
  if(typeof playDamageSound==="function")playDamageSound();hapticFeedback("damage");triggerScreenShake();flashScreen();updateCombatUI()
}
function chargeUltimate(amount){player.ultimateCharge=Math.min(player.maxUltimateCharge,player.ultimateCharge+amount);playChargeSound();hapticFeedback("ultimate");updateAbilityButton()}
function enemyAttack(){
  // El turno enemigo siempre debe resolverse: si por cualquier motivo la
  // transición no quedó aplicada, la forzamos aquí y evitamos dejar el juego bloqueado.
  if(getCurrentState()!==GameState.ENEMY_TURN && !setState(GameState.ENEMY_TURN))return false;
  if(enemyAttackTimer)clearTimeout(enemyAttackTimer);
  const sequence=++enemyAttackSequence;
  boardInputLock(true);
  setCombatMessage("👹 TURNO DEL ENEMIGO");
  updateCombatUI();
  enemyAttackTimer=setTimeout(()=>{
    enemyAttackTimer=null;
    if(sequence!==enemyAttackSequence)return;
    if(getCurrentState()!==GameState.ENEMY_TURN){
      // Recuperación de seguridad: nunca dejamos al jugador sin turno.
      setState(GameState.ENEMY_TURN);
    }
    if(enemyFrozenTurns>0){
      enemyFrozenTurns--;
      setState(GameState.PLAYER_TURN_IDLE);
      boardLocked=false;
      boardInputLock(false);
      setCombatMessage("❄️ ¡El enemigo está congelado! Pierde este turno.");
      updateCombatUI();
      return;
    }
    const damage=enemy.attackDamage;
    const hpBefore=player.currentHealth;
    const shieldBefore=player.shield;
    takeDamage(damage);
    const received=Math.max(0,(shieldBefore-player.shield)+(hpBefore-player.currentHealth));
    showFloatingText(`-${damage}`,"enemy",73,35);
    if(currentHeroClass==="warrior" && received>0 && player.mana>=5 && player.currentHealth>0){
      const reflected=Math.max(1,Math.round(received*.20));
      player.mana-=5;
      dealDamageToEnemy(reflected);
      showFloatingText(`↩️ -${reflected}`,"damage",72,55);
      setCombatMessage(`↩️ ¡Contraataque! Devuelves ${reflected} de daño.`);
    }
    if(enemy.currentHealth<=0){
      checkCombatEnd();
      boardLocked=true;
      boardInputLock(true);
      return;
    }
    if(player.currentHealth<=0){
      setState(GameState.GAME_OVER);
      boardLocked=true;
      boardInputLock(true);
      showGameOverModal();
    }else{
      setState(GameState.PLAYER_TURN_IDLE);
      boardLocked=false;
      boardInputLock(false);
      setCombatMessage("⚔️ Tu turno: encuentra una pareja.");
    }
    updateCombatUI();
  },600);
  return true;
}
function boardInputLock(locked){
  document.querySelectorAll("#board .card").forEach(card=>card.classList.toggle("locked",locked));
}
function checkCombatEnd(){
  if(enemy.currentHealth<=0){
    player.mana=player.maxMana;
    showFloatingText("✨ MP COMPLETO","charge",50,30);
    setCombatMessage("¡Enemigo derrotado! Recuperas todo tu maná.");
    updateCombatUI();
    setState(GameState.VICTORY);handleRoomComplete()
  } else if(player.currentHealth<=0){setState(GameState.GAME_OVER);showGameOverModal()}
}
function updateCombatUI(){
  const hp=Math.max(0,player.currentHealth/player.maxHealth*100),sh=Math.min(100,player.shield/player.maxHealth*100),eh=Math.max(0,enemy.currentHealth/enemy.maxHealth*100);
  setWidth("player-hp-fill",hp);setWidth("player-shield-fill",sh);setWidth("enemy-hp-fill",eh);setWidth("ultimate-fill",player.ultimateCharge);
  text("player-hp-text",`${player.currentHealth}/${player.maxHealth}`);text("player-shield-text",player.shield);text("enemy-hp-text",`${enemy.currentHealth}/${enemy.maxHealth}`);text("enemy-attack-text",enemy.attackDamage);text("ultimate-text",`${player.ultimateCharge}%`);text("mana-text",`${player.mana}/${player.maxMana} MP`);const activeCost=(currentHeroClass&&heroClasses[currentHeroClass]?.abilityCost)||0;text("mana-cost-hint",activeCost?`Habilidad: ${activeCost} MP`:"—");
  setWidth("mana-fill",player.maxMana?player.mana/player.maxMana*100:0);
  text("pairs-text",`${window.matchedPairs||0}/${window.requiredPairs||7} parejas`);text("enemy-status-text",enemyFrozenTurns>0?"❄️ CONGELADO":"");text("relics-text",`💎 ${(window.activeRelics||[]).length}`);
  updateAbilityButton()
}
function setWidth(id,v){const el=document.getElementById(id);if(el)el.style.width=`${Math.max(0,Math.min(100,v))}%`}
function text(id,v){const el=document.getElementById(id);if(el)el.textContent=v}
function updateAbilityButton(){const b=document.getElementById("hero-ability-btn");if(!b)return;const ready=typeof canUseHeroAbility==="function"&&canUseHeroAbility();b.disabled=!ready;b.classList.toggle("ready",ready);if(typeof updateHeroAbilityUI==="function")updateHeroAbilityUI()}
function setCombatMessage(msg){
  const el=document.getElementById("combat-message");
  if(!el)return;
  el.textContent=msg;
  el.classList.toggle("enemy-turn-message",String(msg).includes("TURNO DEL ENEMIGO"));
}
function handleRoomComplete(){gameStats.roomsCleared=Math.max(gameStats.roomsCleared,getCurrentRoom());if(getCurrentRoom()>=10){setTimeout(showVictoryModal,450);playVictorySound();hapticFeedback("victory")}else setTimeout(showRoomModal,450)}
function showGameOverModal(){text("final-rooms",gameStats.roomsCleared);text("final-pairs",gameStats.pairsMatched);text("final-damage",gameStats.totalDamageDealt);showModal("game-over-modal");playGameOverSound();hapticFeedback("gameOver")}
function showVictoryModal(){text("victory-rooms",gameStats.roomsCleared);text("victory-pairs",gameStats.pairsMatched);text("victory-damage",gameStats.totalDamageDealt);showModal("victory-modal")}
function showModal(id){document.getElementById("modal-overlay").classList.remove("hidden");document.querySelectorAll("#modal-overlay .modal").forEach(m=>m.classList.add("hidden"));document.getElementById(id).classList.remove("hidden")}
function hideModals(){document.getElementById("modal-overlay").classList.add("hidden");document.querySelectorAll("#modal-overlay .modal").forEach(m=>m.classList.add("hidden"))}
Object.assign(window,{player,enemy,gameStats,enemyFrozenTurns,runeEffects,initializeCombat,resetPlayer,createEnemy,resolveRuneEffect,dealDamageToEnemy,addShield,healPlayer,takeDamage,chargeUltimate,enemyAttack,checkCombatEnd,updateCombatUI,setCombatMessage,updateAbilityButton,showGameOverModal,showVictoryModal,showModal,hideModals});
