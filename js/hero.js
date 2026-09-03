let currentHeroClass=null;
let activeRelics=[];
const heroClasses={
  warrior:{name:"Guerrero",icon:"⚔️",maxHealth:140,attack:22,maxMana:40,ability:"Contraataque",abilityIcon:"↩️",abilityCost:5,
    chargedAbility:"Golpe Crítico",chargedAbilityIcon:"⚡",criticalMultiplier:2.5,
    description:"El más resistente y poderoso. Su pasiva Contraataque consume 5 MP al recibir daño y devuelve el 20% del daño recibido. Su Carga al 100% permite ejecutar un Golpe Crítico."},
  mage:{name:"Mago",icon:"🔮",maxHealth:90,attack:18,maxMana:100,ability:"Visión Arcana",abilityIcon:"👁️",abilityCost:20,
    chargedAbility:"Congelación Arcana",chargedAbilityIcon:"❄️",chargedDamage:30,
    description:"Controla el campo. Gasta 20 MP para revelar 2 cartas durante 1 segundo. Su Carga al 100% lanza Congelación Arcana: daña y hace perder un turno al enemigo."},
  rogue:{name:"Pícaro",icon:"🗡️",maxHealth:100,attack:17,maxMana:60,ability:"Cuchilla",abilityIcon:"🗡️",abilityCost:10,abilityDamage:10,
    chargedAbility:"Asalto Triple",chargedAbilityIcon:"⚔️",
    description:"Especialista en velocidad. Cuchilla cuesta 10 MP y hace 10 de daño fijo. Su Carga al 100% ejecuta 3 ataques básicos. Pasiva: 20% de repetir turno tras una pareja incorrecta."}
};

// Fuente única de verdad para el maná inicial de cada clase.
// Se ejecuta al comenzar una sala DESPUÉS de cualquier reset para evitar que
// una rutina de inicio vuelva a dejar al héroe en 0/0 MP.
function initializeHeroMana(){
  if(!currentHeroClass || !heroClasses[currentHeroClass])return;
  const startingMana=Number(heroClasses[currentHeroClass].maxMana)||0;
  player.maxMana=startingMana;
  player.mana=startingMana;
  updateCombatUI();
}
const relicDefinitions={
 fireRing:{name:"Anillo de Fuego",description:"+5 daño extra con Espadas.",icon:"🔥",effect:"swordDamage",value:5},
 spiritShield:{name:"Escudo Espiritual",description:"+4 Escudo al encontrar esta runa.",icon:"🛡️",effect:"shieldBonus",value:4},
 lifeGem:{name:"Gema de Vida",description:"+6 curación extra con Pociones.",icon:"💎",effect:"healBonus",value:6},
 trapDisarm:{name:"Desarmador de Trampas",description:"Reduce 40% el daño de Trampas.",icon:"🔧",effect:"trapReduction",value:.4},
 chargeAmulet:{name:"Amuleto de Carga",description:"+10% carga con runas Ultimate.",icon:"⚡",effect:"chargeBonus",value:10},
 vitalityTome:{name:"Tomo de Vitalidad",description:"+20 vida máxima y recupera esa vida.",icon:"📖",effect:"maxHealth",value:20},
 battleCharm:{name:"Talismán de Batalla",description:"+3 ataque base permanente.",icon:"🗡️",effect:"attackBonus",value:3}
};
function initializeHeroSelection(){document.querySelectorAll(".hero-card").forEach(c=>c.addEventListener("click",()=>selectHero(c.dataset.hero)))}
function selectHero(hero){if(!heroClasses[hero])return;currentHeroClass=hero;window.currentHeroClass=currentHeroClass;applyHeroStats();document.getElementById("hero-screen").classList.add("hidden");document.getElementById("game-screen").classList.remove("hidden");startGame()}
function applyHeroStats(){
 const h=heroClasses[currentHeroClass];
 Object.assign(player,{maxHealth:h.maxHealth,currentHealth:h.maxHealth,shield:0,baseAttack:h.attack,ultimateCharge:0,maxUltimateCharge:100,mana:h.maxMana||0,maxMana:h.maxMana||0});
 if(typeof enemyFrozenTurns!=="undefined")enemyFrozenTurns=0;
 activeRelics=[];window.activeRelics=activeRelics;window.currentHeroClass=currentHeroClass;
 const avatar=document.getElementById("player-avatar"),name=document.getElementById("player-name");
 if(avatar)avatar.textContent=h.icon;if(name)name.textContent=h.name;
 initializeHeroMana();
 updateHeroAbilityUI();updateCombatUI();
}
function resetHero(){currentHeroClass=null;activeRelics=[];window.currentHeroClass=null;window.activeRelics=activeRelics}
function canUseHeroAbility(){
 const playerTurn=getCurrentState()===GameState.PLAYER_TURN_IDLE;
 if(!playerTurn || !currentHeroClass)return false;
 const h=heroClasses[currentHeroClass];
 // Guerrero: Contraataque es una pasiva automática, no un botón.
 if(currentHeroClass==="warrior")return false;
 return player.mana>=h.abilityCost;
}
function canUseChargedAbility(){
 return !!currentHeroClass && getCurrentState()===GameState.PLAYER_TURN_IDLE && player.ultimateCharge>=100;
}
function updateHeroAbilityUI(){
 const h=heroClasses[currentHeroClass||"warrior"],b=document.getElementById("hero-ability-btn");if(!b)return;
 const isWarrior=currentHeroClass==="warrior";
 const hasActiveManaAbility=!isWarrior && !!h.ability && Number(h.abilityCost)>0;
 b.classList.toggle("hidden",!hasActiveManaAbility);
 b.style.display=hasActiveManaAbility?"flex":"none";
 document.getElementById("ability-icon").textContent=h.abilityIcon||"✨";
 document.getElementById("ability-label").textContent=h.ability;
 document.getElementById("ability-cost").textContent=isWarrior?"5 MP":`${h.abilityCost} MP`;
 b.disabled=!hasActiveManaAbility||!canUseHeroAbility();b.classList.toggle("ready",!b.disabled);
 const cb=document.getElementById("charged-ability-btn");
 if(cb){
   cb.classList.remove("hidden");cb.disabled=!canUseChargedAbility();cb.classList.toggle("ready",!cb.disabled);
   const ci=document.getElementById("charged-ability-icon"),cl=document.getElementById("charged-ability-label"),cc=document.getElementById("charged-ability-cost");
   if(ci)ci.textContent=h.chargedAbilityIcon||"⚡";if(cl)cl.textContent=h.chargedAbility||"Cargada";if(cc)cc.textContent="100%";
 }
}

function restoreMana(amount=5){
 const gain=Math.max(0,Number(amount)||0);
 if(!player.maxMana || !gain)return 0;
 const before=player.mana;
 player.mana=Math.min(player.maxMana,player.mana+gain);
 const restored=player.mana-before;
 if(restored>0){showFloatingText(`+${restored} MP`,"charge",25,62);}
 updateCombatUI();
 return restored;
}

function endPlayerAction(){
 if(enemy.currentHealth<=0){checkCombatEnd();return}
 boardLocked=false;
 if(setState(GameState.ENEMY_TURN)){setCombatMessage("👹 El enemigo ataca…");enemyAttack()}
}
function revealRandomCards(count=2,duration=1000){
 const available=[...document.querySelectorAll("#board .card")].filter(c=>!c.classList.contains("matched"));
 if(!available.length)return;
 const chosen=[];
 while(chosen.length<Math.min(count,available.length)){const c=available[Math.floor(Math.random()*available.length)];if(!chosen.includes(c))chosen.push(c)}
 boardLocked=true;chosen.forEach(c=>{c.classList.add("temporarily-revealed");c.dataset.state="preview"});
 playRevealSound();showFloatingText("👁️ 2 RUNAS REVELADAS","charge",50,34);
 setTimeout(()=>{chosen.forEach(c=>{c.classList.remove("temporarily-revealed");if(!c.classList.contains("flipped")&&!c.classList.contains("matched"))c.dataset.state="hidden"});boardLocked=false;endPlayerAction()},duration);
}
function useHeroAbility(){
 if(!canUseHeroAbility())return;
 if(currentHeroClass==="mage"){
   player.mana-=heroClasses.mage.abilityCost;
   updateCombatUI();
   setCombatMessage("👁️ Visión Arcana: observa 2 runas durante un instante.");
   updateCombatUI();revealRandomCards(2,1000);return;
 }
 if(currentHeroClass==="rogue"){
   player.mana-=heroClasses.rogue.abilityCost;
   updateCombatUI();
   const dmg=heroClasses.rogue.abilityDamage;dealDamageToEnemy(dmg);
   showFloatingText(`🗡️ -${dmg}`,"damage",70,45);hapticFeedback("attack");
   setCombatMessage(`🗡️ ¡Cuchilla! ${dmg} de daño directo.`);updateCombatUI();endPlayerAction();
 }
}
function useChargedAbility(){
 if(!canUseChargedAbility())return;
 if(currentHeroClass==="warrior"){
   player.ultimateCharge=0;
   const dmg=Math.round((player.baseAttack+runeEffects.sword.damage)*heroClasses.warrior.criticalMultiplier);
   dealDamageToEnemy(dmg);showFloatingText(`⚡ CRÍTICO -${dmg}`,"damage",70,45);hapticFeedback("ultimate");
   setCombatMessage(`⚡ ¡Golpe Crítico! ${dmg} de daño.`);updateCombatUI();endPlayerAction();return;
 }
 if(currentHeroClass==="mage"){
   player.ultimateCharge=0;const dmg=heroClasses.mage.chargedDamage;
   dealDamageToEnemy(dmg);enemyFrozenTurns=1;
   showFloatingText(`❄️ -${dmg}`,"damage",70,42);showFloatingText("CONGELADO","charge",70,32);
   hapticFeedback("ultimate");setCombatMessage(`❄️ ¡Congelación Arcana! ${dmg} de daño. El enemigo pierde su próximo turno.`);updateCombatUI();
   if(enemy.currentHealth<=0)checkCombatEnd();else endPlayerAction();return;
 }
 if(currentHeroClass==="rogue"){
   player.ultimateCharge=0;const dmg=player.baseAttack;let hits=0;
   const hit=()=>{
     if(enemy.currentHealth<=0){checkCombatEnd();return}
     hits++;dealDamageToEnemy(dmg);showFloatingText(`-${dmg}`,"damage",70,40);
     if(hits<3&&enemy.currentHealth>0)setTimeout(hit,140);
     else {setCombatMessage(`🗡️ ¡Asalto Triple! ${hits} golpes consecutivos.`);updateCombatUI();endPlayerAction()}
   };hit();
 }
}
function useMageChargedAbility(){useChargedAbility()}
function checkRogueDodge(){
 if(currentHeroClass!=="rogue"||Math.random()>=.20)return false;
 showFloatingText("¡OTRO TURNO!","dodge",50,38);hapticFeedback("dodge");setCombatMessage("🗡️ ¡Pasiva del Pícaro! Repite el turno.");return true
}
function addRelic(key){if(!relicDefinitions[key])return;activeRelics.push(key);window.activeRelics=activeRelics;const r=relicDefinitions[key];if(r.effect==="maxHealth"){player.maxHealth+=r.value;player.currentHealth+=r.value}if(r.effect==="attackBonus")player.baseAttack+=r.value;showFloatingText(`${r.icon} ${r.name}`,"charge",50,45);updateCombatUI()}
function getRandomRelics(n=3){let pool=Object.keys(relicDefinitions).filter(k=>!activeRelics.includes(k));if(pool.length<n)pool=Object.keys(relicDefinitions);pool=[...pool];for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}return pool.slice(0,n)}
Object.assign(window,{currentHeroClass,heroClasses,relicDefinitions,activeRelics,initializeHeroSelection,selectHero,resetHero,canUseHeroAbility,canUseChargedAbility,updateHeroAbilityUI,useHeroAbility,useMageChargedAbility,checkRogueDodge,addRelic,getRandomRelics,restoreMana,initializeHeroMana});
