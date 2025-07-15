import type { GameState, PlayerInfo } from '../../shared/types';
import { PlayerElement } from './player';
import { ResourceManager } from './resourceManager'; 
import { sendEvent } from '../socket';


export class GameManager {
  private container: HTMLElement;
  private players: Map<string, PlayerElement> = new Map();
  private lastUpdate: number = 0;
  private resourceManager: ResourceManager;

  private myPlayerId = '';

setMyPlayerId(id: string) {
  this.myPlayerId = id;
}

removeResource(resourceId: string) {
    const el = document.querySelector(`.resource[data-id="${resourceId}"]`);
    if (el) el.remove();
  }
  
  updateScore(playerId: string, newScore: number) {
    const player = this.players.get(playerId);
    if (player) {
      player.info.score = newScore;
      // TODO: если есть HUD — обновить его здесь
    }
  }

  constructor(containerId: string, private myPlayerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);
    this.container = container;
    this.resourceManager = new ResourceManager(containerId);
  }

  // вызывается, когда пришёл новый GameState от сервера
  syncFromServer(state: GameState) {
    for (const playerInfo of state.players) {
      const existing = this.players.get(playerInfo.id);
      if (existing) {
        existing.update(playerInfo); // обновляем позицию и анимацию
      } else {
        const player = new PlayerElement(playerInfo);
        player.initAnimations(1); // пока всегда 1, можно позже — по цвету/id
        this.players.set(playerInfo.id, player);
        this.resourceManager.syncResources(state.resources);
      }
    }
  }

  // основной игровой цикл (60 FPS)
  startGameLoop() {
   const tick = (timestamp: number) => {
      const delta = timestamp - this.lastUpdate;
      this.lastUpdate = timestamp;

      for (const [id, player] of this.players.entries()) {
        player.updateAnimation(delta);

       /*// обновляем анимации всех игроков
       for (const player of this.players.values()) {
        player.updateAnimation(delta);
      } 
      requestAnimationFrame(tick);
    };*/

    // Сбор ресурсов только своим игроком
          
          // Сбор ресурсов только своим игроком
          if (id === this.myPlayerId) {
            const resourceEls = Array.from(document.querySelectorAll('.resource')) as HTMLDivElement[];
            const collected = player.collectNearbyResources(resourceEls);
      
            collected.forEach((id) => {
              // временно — удалим вручную
              //document.querySelector(`.resource[data-id="${id}"]`)?.remove();
              //console.log(`Player ${player.name} collected resource ${id}`);
              sendEvent({ type: 'collect', payload: { resourceId: id } });
              // TODO: socket.emit('resourceCollected', { id, playerId: player.id });
            });
          }
        }
        requestAnimationFrame(tick);
      };      
  requestAnimationFrame(tick);
   }
}
