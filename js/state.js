const GameState = Object.freeze({
  PLAYER_TURN_IDLE:"PLAYER_TURN_IDLE", PLAYER_TURN_CARD1:"PLAYER_TURN_CARD1",
  EVALUATING_MATCH:"EVALUATING_MATCH", RESOLVING_EFFECT:"RESOLVING_EFFECT",
  ENEMY_TURN:"ENEMY_TURN", VICTORY:"VICTORY", GAME_OVER:"GAME_OVER"
});
let currentState=GameState.PLAYER_TURN_IDLE;
const validTransitions={
  PLAYER_TURN_IDLE:[GameState.PLAYER_TURN_CARD1,GameState.GAME_OVER],
  PLAYER_TURN_CARD1:[GameState.EVALUATING_MATCH,GameState.GAME_OVER],
  EVALUATING_MATCH:[GameState.RESOLVING_EFFECT,GameState.ENEMY_TURN,GameState.PLAYER_TURN_IDLE,GameState.GAME_OVER],
  RESOLVING_EFFECT:[GameState.PLAYER_TURN_IDLE,GameState.VICTORY,GameState.GAME_OVER],
  ENEMY_TURN:[GameState.PLAYER_TURN_IDLE,GameState.GAME_OVER],
  VICTORY:[GameState.PLAYER_TURN_IDLE], GAME_OVER:[GameState.PLAYER_TURN_IDLE]
};
function getCurrentState(){return currentState}
function canTransition(next){return (validTransitions[currentState]||[]).includes(next)}
function setState(next){
  if(next===currentState)return true;
  if(!canTransition(next)){console.warn("Transición bloqueada",currentState,"→",next);return false}
  const previous=currentState; currentState=next;
  document.dispatchEvent(new CustomEvent("stateChange",{detail:{state:next,previous}}));
  return true
}
function resetState(){currentState=GameState.PLAYER_TURN_IDLE;document.dispatchEvent(new CustomEvent("stateChange",{detail:{state:currentState,previous:null}}))}
function canInteractWithCards(){return currentState===GameState.PLAYER_TURN_IDLE||currentState===GameState.PLAYER_TURN_CARD1}
function isPlayerTurn(){return canInteractWithCards()}
window.GameState=GameState;window.getCurrentState=getCurrentState;window.setState=setState;window.resetState=resetState;window.canInteractWithCards=canInteractWithCards;window.isPlayerTurn=isPlayerTurn;
