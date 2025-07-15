import { io, Socket } from 'socket.io-client';
import type { ClientEvent, ServerEvent } from 'shared/events';
import type { GameState } from '../shared/types';

let socket: Socket;
/**
 * Connect to the server and register event handlers
 */

export function setupSocket(
  onGameStateUpdate: (state: GameState) => void,
  onResourceRemoved: (resourceId: string) => void,
  onScoreUpdate: (playerId: string, score: number) => void,
  onJoined: (playerId: string) => void
) {
  socket = io();
  socket.on('connect', () => {
    console.log(`🔌 Connected to server: ${socket.id}`);
  });

  socket.on('event', (event: ServerEvent) => {
    switch (event.type) {
        case 'joined':
            console.log('🧑‍🤝‍🧑 Player joined:', event.payload.you.id);
            onJoined(event.payload.you.id);
            break;
      case 'update':
        onGameStateUpdate(event.payload.state);
        break;
      case 'resource-removed':
        onResourceRemoved(event.payload.resourceId);
        break;
      case 'score':
        event.payload.scores.forEach(({ id, score }) => {
            onScoreUpdate(id, score);
          });
        //onScoreUpdate(event.payload.playerId, event.payload.score);
        break;

        case 'error':
              console.error('❗Error from server:', event.payload.message);
                const errorBox = document.querySelector('.error-msg'); 
                  if (errorBox) { 
                    errorBox.textContent = event.payload.message;
                    (errorBox as HTMLElement).style.display = 'block';
                 }
                 break;
        default:
        console.warn('Unknown event from server:', event);

    }
  });
}

export function sendEvent(event: ClientEvent) {
  socket.emit('event', event);
}