// Entry point for the client application
// Here you can initialize the game, connect to the server, and render the UI

console.log('Client started');
//
//  TODO: Connect to WebSocket server and initialize game logic 

import { PlayerElement } from './core/player';
import { JoinForm } from './components/JoinForm';
import { GameManager } from './core/gameManager';
import { setupSocket, sendEvent } from './socket'; // 
import { HUD } from './components/HUD';

//const manager = new GameManager('game-container', 'p1');
//const myPlayerId = 'your-socket-id-or-uuid'; //
const manager = new GameManager('game-container', '');
manager.startGameLoop();

setupSocket(
    (state) => {
        manager.syncFromServer(state);
        hud.update(state.players);
    },
    (resourceId) => manager.removeResource(resourceId),
    (playerId, score) => manager.updateScore(playerId, score),
    (myId) => manager.setMyPlayerId(myId) // 
  );

  const joinUI = new JoinForm((name) => {
    sendEvent({ type: 'join', payload: { name, roomId: 'default' } });
  });

  const hud = new HUD();

// test call
/* manager.syncFromServer({
  running: true,
  timer: 0,
  powerUps: [],
  resources: [],
  players: [
    {
      id: 'p1',
      name: 'Alice',
      x: 100,
      y: 400,
      alive: true,
      score: 0,
      color: 'blue',
    },
    {
      id: 'p2',
      name: 'Bob',
      x: 300,
      y: 400,
      alive: true,
      score: 0,
      color: 'red',
    },
  ],
}); */

/* await players.initAnimations(1);

// простейший цикл отрисовки
function loop() {
    players.update(players.info); // обновляет позицию и анимацию
    requestAnimationFrame(loop);
  }
  loop(); */