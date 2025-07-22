class CoinManager {
  constructor(game) {
    this.game         = game;
    this.container    = document.createElement('div');
   this.container.id = 'coinLayer';
   this.container.style.position = 'absolute';
   this.container.style.top      = '0';
   this.container.style.left     = '0';
   this.game.gameContainer.appendChild(this.container);
    this.coins        = new Map();  
    this.modelCoins   = [];         
    this.playerCounts = {};         

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
        el.id        = c.id;
        el.className = 'coin';
        el.style.width  = el.style.height = `${c.size}px`;
        el.style.transform = `translate(${c.x}px, ${c.y - c.size}px)`;
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
     const mode = this.game.modePlugin?.currentMode || 'coins';
    
    const playersArr = Array.from(this.game.players.values());
    let sorted;

    if (mode === 'coins') {
      sorted = playersArr
        .map(p => ({ id: p.id, name: p.name, count: this.playerCounts[p.id] || 0, lives: p.lives }))
        .sort((a, b) => b.count - a.count);
    } else if (mode === 'survival') {
      sorted = playersArr
        .map(p => ({ id: p.id, name: p.name, lives: p.lives, alive: p.alive }))
        .sort((a, b) => {
          if (a.alive !== b.alive) return a.alive ? -1 : 1;
          return b.lives - a.lives;
        });
    } else { 
      sorted = playersArr
        .map(p => ({
          id:       p.id,
          name:     p.name,
          lives:    p.lives,
          infected: !!p.infected
        }))
        .sort((a, b) => {
          if (a.infected !== b.infected) return a.infected ? 1 : -1;
          return b.lives - a.lives;
        });
    }

    const board = document.getElementById('leaderboard');
    board.innerHTML = sorted.map((p, i) => {
 
      if (mode === 'coins') {
        const coinsHtml = `${p.count} 💰`;
        const livesHtml = '❤️'.repeat(p.lives);
        return `
          <div class="player-score">
            ${i + 1}. ${p.name}: ${coinsHtml}, Lives: ${livesHtml}
          </div>
        `;
      }
      else {
        const status = mode === 'infection'
          ? (p.infected ? '🦠 ' : '🙂 ')
          : '';
        const livesHtml = '❤️'.repeat(p.lives);
        return `
          <div class="player-score">
            ${i + 1}. ${status}${p.name}: ${livesHtml}
          </div>
        `;
      }
    }).join('');
  }

  injectCSS() {
    const css = `
      .coin {
        position: absolute;
        background: url('/images/coin.png') no-repeat center / contain;
        will-change: transform;
        transition: transform 16ms linear;
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
