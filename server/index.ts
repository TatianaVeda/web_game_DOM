// Main entry point for the game server
// Sets up Express and Socket.io server

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import type { ClientEvent, ServerEvent } from '../shared/events';
import type { GameState, PlayerInfo } from '../shared/types';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(join(__dirname, '../client')));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../client/index.html'));
});

// HTTP + Socket.IO server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Game state
const gameState: GameState = {
  players: [],
  resources: [],
  powerUps: [],
  timer: 0,
  running: false,
};

io.on('connection', (socket) => {
  console.log(`⚡ New connection: ${socket.id}`);

  // Adding a new player
  socket.on('event', (event: ClientEvent) => {
    switch (event.type) {
      case 'join': {
        const { name, roomId } = event.payload;

      const nameTaken = gameState.players.some((p) => p.name === name);
          if (nameTaken) {
          const errorEvent: ServerEvent = {
          type: 'error',
          payload: { message: 'This name is already taken' },
          };
            socket.emit('event', errorEvent);
              return;
            }

            const newPlayer: PlayerInfo = {
              id: socket.id,
              name,
              x: Math.floor(Math.random() * 500),
              y: 400,
              score: 0,
              alive: true,
              color: getRandomColor(),
            };
    
            gameState.players.push(newPlayer);

        // Send the joined event to the player who joined
        const joinedEvent: ServerEvent = {
          type: 'joined',
          payload: {
            players: gameState.players,
            you: newPlayer,
          },
        };

        socket.emit('event', joinedEvent);
        io.emit('event', { type: 'update', payload: { state: gameState } });
        break;
      }

      case 'collect': {
        const { resourceId } = event.payload;
        const index = gameState.resources.findIndex(r => r.id === resourceId);
        if (index !== -1) {
          gameState.resources.splice(index, 1);
          const player = gameState.players.find(p => p.id === socket.id);
          if (player) {
            player.score += 1;

            io.emit('event', {
              type: 'resource-removed',
              payload: { resourceId },
            });

            io.emit('event', {
              type: 'score',
              //payload: { playerId: player.id, score: player.score },
              payload: {
                scores: gameState.players.map(p => ({
                  id: p.id,
                  name: p.name,
                  score: p.score,
                })),
              },
            });

            io.emit('event', { type: 'update', payload: { state: gameState } });
          }
        }
        break;
      }

      case 'move':
        const player = gameState.players.find(p => p.id === socket.id);
        if (player) {
          switch (event.payload.direction) {
            case 'left':
              player.x -= 10;
              break;
            case 'right':
              player.x += 10;
              break;
            case 'up':
              player.y -= 10;
              break;
            case 'down':
              player.y += 10;
              break;
          }
        }
        io.emit('event', { type: 'update', payload: { state: gameState } });
        break;

      default:
        break;
    }
  });

  // Disconnection
  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    const index = gameState.players.findIndex(p => p.id === socket.id);
    if (index !== -1) {
      gameState.players.splice(index, 1);
    }
    io.emit('event', { type: 'update', payload: { state: gameState } });
  });
});

server.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});

function getRandomColor(): string {
  const colors = ['red', 'blue', 'green', 'orange'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/* 
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  // TODO: Handle game events here
});

socket.on('event', (event: ClientEvent) => {
  switch (event.type) {
    case 'collect':
      const { resourceId } = event.payload;
      removeResource(resourceId); // удаляет из gameState.resources
      io.to(roomId).emit('event', {
        type: 'resource-removed',
        payload: { resourceId },
      });

      // Обновить счёт
      const player = getPlayerBySocket(socket.id);
      player.score += 1;
      io.to(roomId).emit('event', {
        type: 'score',
        payload: { playerId: player.id, score: player.score },
      });
      break;
  }
}); */

