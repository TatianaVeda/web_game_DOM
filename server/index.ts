// Main entry point for the game server
// Sets up Express and WebSocket server

import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the client build
app.use(express.static('../dist/client'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  // TODO: Handle game events here
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
}); 