let currentRoom=1,maxRooms=10,isDungeonComplete=false;
function isInfiniteMode(){return typeof currentGameMode!=="undefined"&&currentGameMode==="infinite"}
function initializeDungeon(){currentRoom=1;isDungeonComplete=false;updateRoomDisplay()}
function getCurrentRoom(){return currentRoom}
function updateRoomDisplay(){
 const el=document.getElementById("room-number"),limit=document.getElementById("room-limit");
 if(el)el.textContent=currentRoom;
 if(limit)limit.textContent=isInfiniteMode()?"":"/10";
}
function showRoomModal(){
  if(!isInfiniteMode()&&currentRoom>=maxRooms){isDungeonComplete=true;showVictoryModal();return}
  const next=currentRoom+1;document.getElementById("room-summary").textContent=`Enemigo derrotado. Sala ${next} espera.`;
  const container=document.getElementById("relics-container");container.innerHTML="";
  getRandomRelics(3).forEach(key=>{const r=relicDefinitions[key],b=document.createElement("button");b.type="button";b.className="relic-card";b.innerHTML=`<span class="relic-icon">${r.icon}</span><span><strong class="relic-name">${r.name}</strong><span class="relic-description">${r.description}</span></span>`;b.addEventListener("click",()=>selectRelic(key));container.appendChild(b)});
  showModal("room-modal")
}
function selectRelic(key){addRelic(key);hideModals();setTimeout(advanceRoom,350)}
function advanceRoom(){
  currentRoom++;updateRoomDisplay();createEnemy(currentRoom);
  healBetweenRooms();resetBoard();resetState();
  // MUY IMPORTANTE: el MP de inicio se aplica después de todos los resets.
  if(typeof initializeHeroMana==="function")initializeHeroMana();
  else if(typeof currentHeroClass!=="undefined"&&typeof heroClasses!=="undefined"){
    const startingMana=Number(heroClasses[currentHeroClass]?.maxMana)||0;
    player.maxMana=startingMana;player.mana=startingMana;
  }
  if(typeof updateHeroAbilityUI==="function")updateHeroAbilityUI();
  updateCombatUI();setCombatMessage(`Sala ${currentRoom}: ${enemy.maxHealth} HP · ${enemy.attackDamage} daño.`)
}
function healBetweenRooms(){const amount=Math.max(1,Math.round(player.maxHealth*.2));const before=player.currentHealth;player.currentHealth=Math.min(player.maxHealth,player.currentHealth+amount);const healed=player.currentHealth-before;if(healed)showFloatingText(`+${healed} HP`,"heal",25,45);updateCombatUI()}
function resetDungeon(){currentRoom=1;isDungeonComplete=false;updateRoomDisplay()}
Object.assign(window,{currentRoom,maxRooms,isDungeonComplete,isInfiniteMode,initializeDungeon,getCurrentRoom,updateRoomDisplay,showRoomModal,selectRelic,advanceRoom,healBetweenRooms,resetDungeon});
