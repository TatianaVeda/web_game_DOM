
export default class BonusManager {
  /**
   * @param {Object} game - The main game instance
   */
  constructor(game) {
    this.game = game;
    this.container = game.gameContainer;
    this.shields = new Map();   // id → DOM element
    this.hearts = new Map();   // id → DOM element
    this.modelShields = [];          // shield data from server
    this.modelHearts = [];          // heart data from server

    this.setupSocket();
    this.injectCSS();
  }

  /**
   * Sets up socket event handlers
   */
  setupSocket() {
    const sock = this.game.socket;

    // On each gameState update, refresh the model and sync DOM elements
    sock.on('gameState', state => {
      // 1) Update internal model arrays
      this.modelShields = state.shields;
      this.modelHearts = state.hearts;

      // 2) Create/delete DOM elements (but don't position them here)
      this.syncShields(this.modelShields);
      this.syncHearts(this.modelHearts);
    });

    // When a shield is collected
    sock.on('shieldCollected', ({ bonusId, playerId }) => {
      const el = this.shields.get(bonusId);
      if (el) {
        el.classList.add('collected');
        setTimeout(() => el.remove(), 300);
        this.shields.delete(bonusId);
      }
      window.SoundManager.playShield();

      // Grant immunity if collected by this client
      if (playerId === this.game.socketId) {
        const p = this.game.players.get(playerId);
        p.collisionImmunity = true;
        setTimeout(() => { p.collisionImmunity = false; }, 15000);
        // Floating hint on the avatar
        if (p && p.element) {
          this.game.showFloatingPlus(p.x, p.y, '🛡️ 15 seconds of immunity');
        }
      }
    });

    // When a heart is collected
    sock.on('heartCollected', ({ bonusId, playerId }) => {
      const el = this.hearts.get(bonusId);
      if (el) {
        el.classList.add('collected');
        setTimeout(() => el.remove(), 300);
        this.hearts.delete(bonusId);
      }
      window.SoundManager.playHeart();

      // Increase life if collected by this client
      if (playerId === this.game.socketId) {
        const p = this.game.players.get(playerId);
        if (p.lives < 3) {
          p.lives++;
          this.game.updateLivesIndicator(p);
          // Floating plus +1
          if (p.element) {
            this.game.showFloatingPlus(p.x, p.y, '+1');
          }
        }
      }
    });
  }

  /**
   * Create or remove shield elements based on the model
   * (does NOT update their position)
   */
  syncShields(serverShields) {
    const ids = new Set(serverShields.map(b => b.id));

    // Remove obsolete shields
    this.shields.forEach((el, id) => {
      if (!ids.has(id)) {
        el.remove();
        this.shields.delete(id);
      }
    });

    // Add new shields
    serverShields.forEach(b => {
      if (!this.shields.has(b.id)) {
        const el = document.createElement('div');
        el.id = b.id;
        el.className = 'bonus shield';
        el.style.width = el.style.height = `${b.size}px`;
        // Position will be set later in renderShields()
        this.container.appendChild(el);
        this.shields.set(b.id, el);
      }
    });
  }

  /**
   * Create or remove heart elements based on the model
   * (does NOT update their position)
   */
  syncHearts(serverHearts) {
    const ids = new Set(serverHearts.map(b => b.id));

    // Remove obsolete hearts
    this.hearts.forEach((el, id) => {
      if (!ids.has(id)) {
        el.remove();
        this.hearts.delete(id);
      }
    });

    // Add new hearts
    serverHearts.forEach(b => {
      if (!this.hearts.has(b.id)) {
        const el = document.createElement('div');
        el.id = b.id;
        el.className = 'bonus heart';
        el.style.width = el.style.height = `${b.size}px`;
        // Position will be set later in renderHearts()
        this.container.appendChild(el);
        this.hearts.set(b.id, el);
      }
    });
  }

  /**
   * Called from the game's RAF loop to update shield positions
   */
  renderShields(delta) {
    this.modelShields.forEach(b => {
      b.y += b.speed * (delta / 1000);
      const el = this.shields.get(b.id);
      if (el) {
        el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      }
    });
  }

  /**
   * Called from the game's RAF loop to update heart positions
   */
  renderHearts(delta) {
    this.modelHearts.forEach(b => {
      b.y += b.speed * (delta / 1000);
      const el = this.hearts.get(b.id);
      if (el) {
        el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      }
    });
  }

  /**
   * Inject CSS styles for bonus elements
   */
  injectCSS() {
    const css = `
      .bonus {
        position: absolute;
        will-change: transform;
        transition: transform 16ms linear;
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

// Initialize when Game is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.game) {
    window.bonusManager = new BonusManager(window.game);
  }
});
