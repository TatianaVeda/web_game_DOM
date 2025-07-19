// BonusManager handles the creation, synchronization, and collection of bonus items (shields and hearts) in the game
export default class BonusManager {
  /**
   * @param {Object} game - The main game instance
   */
  constructor(game) {
    this.game = game;                              // Reference to the main game object
    this.container = game.gameContainer;           // DOM container for rendering bonuses
    this.shields = new Map();                      // Map of shield bonus elements by ID
    this.hearts = new Map();                       // Map of heart bonus elements by ID
    this.setupSocket();                            // Initialize socket event listeners
    this.injectCSS();                              // Inject necessary CSS for bonuses
  }

  /** 
   * Sets up socket event handlers for receiving game updates and bonus collection events
   */
  setupSocket() {
    const sock = this.game.socket;

    // Update shields and hearts positions when game state changes
    sock.on('gameState', state => {
      this.syncShields(state.shields);
      this.syncHearts(state.hearts);
    });

    // Handle shield collection by any player
    sock.on('shieldCollected', ({ bonusId, playerId }) => {
      const el = this.shields.get(bonusId);
      if (el) {
        el.classList.add('collected');              // Trigger collect animation
        setTimeout(() => el.remove(), 300);         // Remove element after animation
        this.shields.delete(bonusId);               // Remove from internal map
      }
      window.SoundManager.playShield();             // Play shield sound effect

      // If the current player collected the shield, grant temporary immunity
      if (playerId === this.game.socketId) {
        this.game.players.get(playerId).collisionImmunity = true;
        setTimeout(() => {
          this.game.players.get(playerId).collisionImmunity = false;
        }, 15000);                                  // Immunity lasts 15 seconds
      }
    });

    // Handle heart collection by any player
    sock.on('heartCollected', ({ bonusId, playerId }) => {
      const el = this.hearts.get(bonusId);
      if (el) {
        el.classList.add('collected');              // Trigger collect animation
        setTimeout(() => el.remove(), 300);         // Remove element after animation
        this.hearts.delete(bonusId);                // Remove from internal map
      }
      window.SoundManager.playHeart();              // Play heart sound effect

      // If the current player collected the heart, increase life count (max 3)
      if (playerId === this.game.socketId) {
        const player = this.game.players.get(playerId);
        if (player.lives < 3) {
          player.lives++;
          this.game.updateLivesIndicator(player);   // Update UI to show new life count
        }
      }
    });
  }

  /**
   * Synchronizes shield bonuses with the server state.
   * Creates new shield elements or updates existing ones, and removes obsolete ones.
   * 
   * @param {Array} serverShields - Array of shield objects from the server
   */
  syncShields(serverShields) {
    const ids = new Set(serverShields.map(b => b.id));
    // Remove any shields that are no longer present on the server
    this.shields.forEach((el, id) => {
      if (!ids.has(id)) { el.remove(); this.shields.delete(id); }
    });
    // Create or update shield elements
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

  /**
   * Synchronizes heart bonuses with the server state.
   * Creates new heart elements or updates existing ones, and removes obsolete ones.
   * 
   * @param {Array} serverHearts - Array of heart objects from the server
   */
  syncHearts(serverHearts) {
    const ids = new Set(serverHearts.map(b => b.id));
    // Remove any hearts that are no longer present on the server
    this.hearts.forEach((el, id) => {
      if (!ids.has(id)) { el.remove(); this.hearts.delete(id); }
    });
    // Create or update heart elements
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

  /**
   * Injects CSS styles for bonus elements directly into the document head.
   * Defines basic positioning, background images, and collect animation.
   */
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

// Initialize BonusManager when the DOM is ready and the global game object exists
document.addEventListener('DOMContentLoaded', () => {
  if (window.game) {
    window.bonusManager = new BonusManager(window.game);
  }
});
