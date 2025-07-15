// События от клиента к серверу
export type ClientEvent =
  | { type: 'join'; payload: { name: string; roomId: string } }
  | { type: 'start'; payload: {} }
  | { type: 'move'; payload: { direction: 'up' | 'down' | 'left' | 'right' } }
  | { type: 'pause'; payload: {} }
  | { type: 'resume'; payload: {} }
  | { type: 'quit'; payload: {} }
  | { type: 'collect'; payload: { resourceId: string } }
  | { type: 'chat'; payload: { message: string } };


// События от сервера к клиенту
export type ServerEvent =
  | { type: 'joined'; payload: { players: import('./types').PlayerInfo[]; you: import('./types').PlayerInfo } }
  | { type: 'start'; payload: { state: import('./types').GameState } }
  | { type: 'update'; payload: { state: import('./types').GameState } }
  | { type: 'pause'; payload: { by: string } }
  | { type: 'resume'; payload: { by: string } }
  | { type: 'quit'; payload: { by: string } }
  | { type: 'score'; payload: { scores: Array<{ id: string; name: string; score: number }> } }
  | { type: 'timer'; payload: { time: number } }
  | { type: 'end'; payload: { winner: string } }
  | { type: 'chat'; payload: { from: string; message: string } }
  | { type: 'resource-removed'; payload: { resourceId: string } }
  | { type: 'score'; payload: { scores: Array<{ id: string; name: string; score: number }> }} //playerId: string; score: number } 
  | { type: 'error'; payload: { message: string } }; 