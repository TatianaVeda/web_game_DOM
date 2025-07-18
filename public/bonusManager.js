export default class BonusManager {
  constructor(game) {
    this.game = game;
    this.container = game.gameContainer;
    this.shields = new Map();
    this.hearts = new Map();
    this.setupSocket();
    this.injectCSS();
  }

  setupSocket() {
    const sock = this.game.socket;

    sock.on('gameState', state => {
      this.syncShields(state.shields);
      this.syncHearts(state.hearts);
    });

    sock.on('shieldCollected', ({ bonusId, playerId }) => {
      const el = this.shields.get(bonusId);
      if (el) {
        el.classList.add('collected');
        setTimeout(() => el.remove(), 300);
        this.shields.delete(bonusId);
      }
      if (playerId === this.game.socketId) {
        this.game.players.get(playerId).collisionImmunity = true;
        setTimeout(() => {
          this.game.players.get(playerId).collisionImmunity = false;
        }, 15000);
      }
    });

    sock.on('heartCollected', ({ bonusId, playerId }) => {
      const el = this.hearts.get(bonusId);
      if (el) {
        el.classList.add('collected');
        setTimeout(() => el.remove(), 300);
        this.hearts.delete(bonusId);
      }
      if (playerId === this.game.socketId) {
        const player = this.game.players.get(playerId);
        if (player.lives < 3) {
          player.lives++;
          this.game.updateLivesIndicator(player);
        }
      }
    });
  }

  syncShields(serverShields) {
    const ids = new Set(serverShields.map(b => b.id));
    this.shields.forEach((el, id) => {
      if (!ids.has(id)) { el.remove(); this.shields.delete(id); }
    });
    serverShields.forEach(b => {
      if (!this.shields.has(b.id)) {
        const el = document.createElement('div');
        el.id = b.id;
        el.className = 'bonus shield';
        el.style.width = el.style.height = `${b.size}px`;
        el.style.transform = `translate(${b.x}px, ${b.y}px)`;
        this.container.appendChild(el);
        this.shields.set(b.id, el);
      } else {
        this.shields.get(b.id).style.transform = `translate(${b.x}px, ${b.y}px)`;
      }
    });
  }

  syncHearts(serverHearts) {
    const ids = new Set(serverHearts.map(b => b.id));
    this.hearts.forEach((el, id) => {
      if (!ids.has(id)) { el.remove(); this.hearts.delete(id); }
    });
    serverHearts.forEach(b => {
      if (!this.hearts.has(b.id)) {
        const el = document.createElement('div');
        el.id = b.id;
        el.className = 'bonus heart';
        el.style.width = el.style.height = `${b.size}px`;
        el.style.transform = `translate(${b.x}px, ${b.y}px)`;
        this.container.appendChild(el);
        this.hearts.set(b.id, el);
      } else {
        this.hearts.get(b.id).style.transform = `translate(${b.x}px, ${b.y}px)`;
      }
    });
  }

  injectCSS() {
    const css = `
      .bonus {
        position: absolute;
        will-change: transform;
      }
      .bonus.shield {
        background: url('/images/shield.png') center/contain no-repeat;
      }
      .bonus.heart {
        background: url('/images/heart.png') center/contain no-repeat;
      }
      .bonus.collected {
        animation: pop 0.3s forwards;
      }
      @keyframes pop {
        to { transform: scale(1.5); opacity: 0; }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.game) {
    window.bonusManager = new BonusManager(window.game);
  }
});
