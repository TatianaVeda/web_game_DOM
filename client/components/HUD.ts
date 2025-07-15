import type { PlayerInfo } from '../../shared/types';

export class HUD {
  private element: HTMLDivElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'hud';
    document.body.appendChild(this.element);
  }

  update(players: PlayerInfo[]) {
    this.element.innerHTML = `<h3>Players</h3>`;
    players.forEach((p) => {
      const line = document.createElement('div');
      line.textContent = `${p.name}: ${p.score}`;
      this.element.appendChild(line);
    });
  }
}