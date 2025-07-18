// public/coinManager.js
class CoinManager {
  constructor(game) {
    this.game       = game;
    this.container  = game.gameContainer;
    this.coins      = new Map(); // coinId → DOM-element
    this.playerCounts = {};      // playerId → coinCount

    this.setupSocket();
    this.injectCSS();
  }

  setupSocket() {
    const sock = this.game.socket;

    // for each frame: server sends list of coins and players )
    sock.on('gameState', state => {
        console.log('Received gameState.coins:', state.coins);
      // update coins
      this.syncCoins(state.coins);
      // update ranking
      state.players.forEach(p => this.playerCounts[p.id] = p.coinCount||0);
      this.updateRanking();
    });

    // when coin is collected — animate disappearance
    sock.on('coinCollected', ({ coinId, playerId }) => {
      const el = this.coins.get(coinId);
      if (el) {
        el.classList.add('collected');
        setTimeout(() => el.remove(), 300);
        this.coins.delete(coinId);
      }
      // you can play sound here
    });
  }

  // creates/deletes DOM of coins by the list from the server
  syncCoins(serverCoins) {
    const ids = new Set(serverCoins.map(c => c.id));

    // delete extra
    this.coins.forEach((el, id) => {
      if (!ids.has(id)) {
        el.remove();
        this.coins.delete(id);
      }
    });

    // add new
    serverCoins.forEach(c => {
      if (!this.coins.has(c.id)) {
        const el = document.createElement('div');
        el.id = c.id;
        el.className = 'coin';
        el.style.width  = el.style.height = `${c.size}px`;
        // el.style.transform = `translate(${c.x}px, ${c.y}px)`;
        el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;

        this.container.appendChild(el);
        this.coins.set(c.id, el);
      } else {
        // update position
        this.coins.get(c.id).style.transform = `translate(${c.x}px, ${c.y}px)`;
      }
    });
  }

  // builds ranking by the number of coins and draws in scoreBoard
  updateRanking() {
    // collect array [name, count]
    const arr = Array.from(this.game.players.values())
      .map(p => ({ name: p.name, count: this.playerCounts[p.id]||0 }));
    // sort by descending
    arr.sort((a,b) => b.count - a.count);

    // draw under the board or instead of it
   const board = document.getElementById('leaderboard');
    board.innerHTML = arr.map((p,i) =>
      `<div class="player-score">
         ${i+1}. ${p.name}: ${p.count} 💰
       </div>`
    ).join('');
  }

  // Inject CSS for coin animation
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
    @keyframes spin {
      from { transform: rotateY(0deg); }
      to   { transform: rotateY(360deg); }
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

// connect after Game
document.addEventListener('DOMContentLoaded', () => {
  if (window.game) {
    window.coinManager = new CoinManager(window.game);
  }
});
