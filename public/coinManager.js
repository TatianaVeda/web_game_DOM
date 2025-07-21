class CoinManager {
  constructor(game) {
    this.game        = game;
    this.container   = game.gameContainer;
    this.coins       = new Map();  // coinId → DOM-element
    this.modelCoins  = [];         
    this.playerCounts = {};        // playerId → coinCount

    this.setupSocket();
    this.injectCSS();
  }

  setupSocket() {
    const sock = this.game.socket;

    sock.on('gameState', state => {

      this.modelCoins = state.coins;
      this.syncCoins(this.modelCoins);
 
      state.players.forEach(p => {
        this.playerCounts[p.id] = p.coinCount || 0;
      });
      this.updateRanking();
    });

    sock.on('coinCollected', ({ coinId, playerId }) => {
      const el = this.coins.get(coinId);
      if (el) {
        el.classList.add('collected');
        setTimeout(() => el.remove(), 300);
        this.coins.delete(coinId);
      }
      window.SoundManager.playCoin();
    });
  }

  syncCoins(serverCoins) {
    const ids = new Set(serverCoins.map(c => c.id));

    this.coins.forEach((el, id) => {
      if (!ids.has(id)) {
        el.remove();
        this.coins.delete(id);
      }
    });

    serverCoins.forEach(c => {
      if (!this.coins.has(c.id)) {
        const el = document.createElement('div');
        el.id = c.id;
        el.className = 'coin';
        el.style.width  = el.style.height = `${c.size}px`;
    
        this.container.appendChild(el);
        this.coins.set(c.id, el);
      }
    });
  }

  renderCoins() {
    this.modelCoins.forEach(c => {
      const el = this.coins.get(c.id);
      if (el) {
        el.style.transform = `translate(${c.x}px, ${c.y}px)`;
      }
    });
  }

  updateRanking() {
    const arr = Array.from(this.game.players.values())
      .map(p => ({ name: p.name, count: this.playerCounts[p.id] || 0 }));
    arr.sort((a, b) => b.count - a.count);

    const board = document.getElementById('leaderboard');
    board.innerHTML = arr.map((p, i) =>
      `<div class="player-score">
         ${i + 1}. ${p.name}: ${p.count} 💰
       </div>`
    ).join('');
  }

  injectCSS() {
    const css = `
      .coin {
        position: absolute;
        background: url('/images/coin.png') no-repeat center / contain;
        will-change: transform;
      }
      .coin.collected {
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

export default CoinManager;

document.addEventListener('DOMContentLoaded', () => {
  if (window.game) {
    window.coinManager = new CoinManager(window.game);
  }
});
