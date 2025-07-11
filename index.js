const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
let ObjectCounter = 0;

class Player {
  constructor(x, y, id, name, icon) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.isHost = false;
    this.alive = true;
    this.wins = 0;
    this.speedMulti = 1;
    this.objectMulti = 1;
    this.lives = 3;
    this.collisionImmunity = false;
  }

  move(x, y) {
    this.x = x;
    this.y = y;
  }
}

const MOVEMENTSPEED = 5;
const OBJECTBASESPEED = 2.5;

const PLAYER_RADIUS = 15;

const GAMEWINDOW_SIZE = { x: 1200, y: 800 };

const gameState = {
  players: new Map(),
  floatingTrunk: [],
  isGameRunning: false,
  timer: 0,
  lastUpdate: Date.now(),
  tickRate: 1000 / 60,
};
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

function generateObjectId() {
  return `object-${Date.now()}-${ObjectCounter++}`;
} 
io.on('connection', (socket) => {

  
  console.log('A user connected:', socket.id);

  socket.on('joinGame', (data) => {
    console.log('A user joined game:', data.name);
    const player = new Player(400, 500, socket.id, data.name, data.icon);

    // just set first player host and make sure set dead if game is running
    if (gameState.players.size === 0) {
      player.isHost = true;
    }
    if (gameState.isGameRunning) {
      player.alive = false;
    }

    gameState.players.set(socket.id, player);

    socket.emit('currentPlayers', Array.from(gameState.players.values()));
    socket.broadcast.emit('currentPlayers', Array.from(gameState.players.values()));
    socket.emit('playerJoined', player);
  });

  socket.on('move', (x, y) => {
    x = Math.min(Math.max(x, -1), 1);
    y = Math.min(Math.max(y, -1), 1);
    const player = gameState.players.get(socket.id);
    // in actual game there would be timedelta calculations here onserver to prevent cheating
    if (player) {
      player.x += x * MOVEMENTSPEED * player.speedMulti;
      player.y += y * MOVEMENTSPEED * player.speedMulti;

      player.x = Math.min(Math.max(player.x, 0), GAMEWINDOW_SIZE.x - PLAYER_RADIUS * 2);
      player.y = Math.min(Math.max(player.y, 0), GAMEWINDOW_SIZE.y - PLAYER_RADIUS * 2);

      // also could just use the gameState socket instead of having separate
      io.emit('playerMoved', player);
    }
  });
 
  socket.on('resetGame', (playerToReset) => {
    console.log('Game reseted by: ', playerToReset);
    resetGame();
    io.emit('resetGame', playerToReset);
});

socket.on('disconnect', () => {
  console.log('A user disconnected:', socket.id);

  const player = gameState.players.get(socket.id);
  if (!player) {
      console.warn(`Player with ID ${socket.id} not found in gameState.players`);
      return;
  }

  const wasHost = player.isHost;
  console.log('Disconnected player:', player);
  console.log('Was host:', wasHost);

  
  gameState.players.delete(socket.id);

  
  io.emit('playerDisconnected', socket.id);

  if (wasHost && gameState.players.size > 0) {
      const newHost = gameState.players.values().next().value;
      if (newHost) {
          newHost.isHost = true;
          console.log(`New host assigned: ${newHost.name || newHost.id}`);
          io.emit('newHostAssigned', { playerId: newHost.id, playerName: newHost.name || 'Unknown' });
      }
  }

  // If none of the players are alive, game is resetted
  const noPlayersAlive = Array.from(gameState.players.values()).every(player => !player.alive);
  if (noPlayersAlive) {
      console.log('No players are alive. Resetting the game...');
      io.emit('resetGame', 'the system.')
      resetGame();
      return; 
  }

  // pauses the game automatically on disconnect, also unpauses it after 4 seconds
  if (!gameState.isPaused) {
      gameState.isPaused = true;
      setTimeout(() => {
          if (gameState.isPaused) {
              gameState.isPaused = false;
              console.log('Game unpaused automatically after disconnect pause timeout');
          }
      }, 4000);
  }

  

  // If no players are left, reset the game
  if (gameState.players.size === 0) {
      resetGame();
      // probably needed
      io.emit('resetGame', 'Everyone');
  }
});

  socket.on('startGame', () => {
    if (!gameState.isGameRunning) {
      gameState.isGameRunning = true;
      gameState.startTime = Date.now();
      io.emit('gameStarted', gameState);

      // add one floatingTrunk at the start . so poeple know it started
      gameState.floatingTrunk.push({
        id: generateObjectId(),
        x: Math.random() * GAMEWINDOW_SIZE.x,
        y: 0,
        size: 20 * (+(1 + Math.random() * 3.5).toFixed(1)),
        speed: OBJECTBASESPEED + (+(1 + Math.random() * 2.5).toFixed(1)),
        gathered: false,
      });

    }
  });

  socket.on('togglePause', (isPaused, playerName) => {
    gameState.isPaused = isPaused;
    console.log("Paused by:", playerName);
    io.emit('pauseStateChanged', { isPaused, playerName }); 
});

});


function gameLoop() {
  const now = Date.now();
  const delta = now - gameState.lastUpdate;

  if (delta >= gameState.tickRate) {
    if (gameState.isGameRunning && !gameState.isPaused && gameState.players.size > 0) {
      updateFloatingTrunk();
      checkForCollisions();
      io.emit('gameState', {
        //players: Array.from(gameState.players.values()),
        floatingTrunk: gameState.floatingTrunk,
        timer: Math.floor(gameState.timer / 1000),
      });
      //gameState.timer = Math.floor((Date.now() - gameState.startTime) / 1000);
      gameState.timer += delta;
    }
    gameState.lastUpdate = now;
  }

  setImmediate(gameLoop);
}

function checkForCollisions() {
  gameState.floatingTrunk.forEach(object => {
    gameState.players.forEach(player => {
      if (!player.alive) {
        return;
      }

      const dx = (object.x) - (player.x);
      const dy = (object.y) - (player.y);

      //these are used if objects are rendered from top left x/y coordinate
      //const dx = (object.x + (object.size / 2)) - (player.x + PLAYER_RADIUS);
      //const dy = (object.y + (object.size / 2)) - (player.y + PLAYER_RADIUS);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < (object.size / 2) + PLAYER_RADIUS) {
        if (!player.collisionImmunity && !object.gathered) {
          player.collisionImmunity = true;
          object.gathered = true;
          setTimeout(() => {
            player.collisionImmunity = false;
            console.log(`Player immunity changed to ${player.collisionImmunity}`);
          }, 3000);
          console.log("TRUE DISTANCE ON HIT:", distance - (object.size / 2 + PLAYER_RADIUS));
          player.lives--;
          io.emit('playerMoved', player); // Emit playerMoved event to update lives on client
          if (player.lives <= 0) {
            player.alive = false;
            io.emit('playerDied', { playerId: player.id });

            if (Array.from(gameState.players.values()).filter(p => p.alive).length <= 1) {
              gameState.isGameRunning = false;
              let w = Array.from(gameState.players.values()).find(p => p.alive);
              if (w) {
                w.wins++;
              }
              io.emit('gameOver', { winner: w });
              resetGame();
            }
          }
        }
      }
    });
  });
}

function updateFloatingTrunk() {
  gameState.floatingTrunk.forEach((object, index) => {
    object.y += object.speed;
    if (object.y > GAMEWINDOW_SIZE.y +50) {
      gameState.floatingTrunk.splice(index, 1);
      if (1 === getRandomInt(7)) {
        gameState.floatingTrunk.push({
          id: generateObjectId(),
          x: Math.random() * GAMEWINDOW_SIZE.x,
          y: 0,
          size: 30,
          speed: OBJECTBASESPEED + (+(1 + Math.random() * 2.5).toFixed(1)),
          gathered: false,
        });
      } else {
        gameState.floatingTrunk.push({
          id: generateObjectId(),
          x: Math.random() * GAMEWINDOW_SIZE.x,
          y: 0,
          size: 20 * (+(1 + Math.random() * 3.5).toFixed(1)),
          speed: OBJECTBASESPEED + (+(1 + Math.random() * 2.5).toFixed(1)),
          gathered: false,
        });
      }
    }
  });

  

  const elapsedTime = gameState.timer / 1000;
  const numberOfObjects = Math.floor(elapsedTime / 5);

  while (gameState.floatingTrunk.length < numberOfObjects) {
    gameState.floatingTrunk.push({
      id: `object-${Date.now()}`,
      x: Math.random() * GAMEWINDOW_SIZE.x,
      y: 0,
      size: 20 * (+(1 + Math.random() * 3.5).toFixed(1)),
      speed: OBJECTBASESPEED + (+(1 + Math.random() * 2.5).toFixed(1)),
      gathered: false,
    });
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
function resetGame() {
  gameState.isGameRunning = false;
  gameState.isPaused = false;
  gameState.timer = 0;
  gameState.floatingTrunk = [];
  gameState.players.forEach(player => {
    player.alive = true;
    player.wins = 0;
    player.speedMulti = 1;
    player.objectMulti = 1;
    player.lives = 3;
    player.collisionImmunity = false;
  });
}

gameLoop();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});