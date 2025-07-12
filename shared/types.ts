// Тип игрока
export interface PlayerInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  score: number;
  alive: boolean;
  color: string;
}

// Тип ресурса
export interface ResourceInfo {
  id: string;
  x: number;
  y: number;
  type: 'food' | 'bonus' | 'slow' | 'shield';
}

// Тип power-up
export interface PowerUpInfo {
  id: string;
  x: number;
  y: number;
  effect: 'speed' | 'invisible' | 'freeze' | 'shield';
  duration: number; // ms
  ownerId?: string;
}

// Состояние игры
export interface GameState {
  players: PlayerInfo[];
  resources: ResourceInfo[];
  powerUps: PowerUpInfo[];
  timer: number;
  running: boolean;
} 