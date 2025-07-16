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

    // при каждом фрейме: сервер шлёт список монет и игроков
    sock.on('gameState', state => {
        console.log('Received gameState.coins:', state.coins);
      // обновляем монетки
      this.syncCoins(state.coins);
      // обновляем рейтинг
      state.players.forEach(p => this.playerCounts[p.id] = p.coinCount||0);
      this.updateRanking();
    });

    // когда монета собрана — анимируем исчезновение
    sock.on('coinCollected', ({ coinId, playerId }) => {
      const el = this.coins.get(coinId);
      if (el) {
        el.classList.add('collected');
        setTimeout(() => el.remove(), 300);
        this.coins.delete(coinId);
      }
      // можно тут дополнительно проигрывать звук
    });
  }

  // создаёт/удаляет DOM у монет по списку с сервера
  syncCoins(serverCoins) {
    const ids = new Set(serverCoins.map(c => c.id));

    // удаляем лишние
    this.coins.forEach((el, id) => {
      if (!ids.has(id)) {
        el.remove();
        this.coins.delete(id);
      }
    });

    // добавляем новые
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
        // обновляем позицию
        this.coins.get(c.id).style.transform = `translate(${c.x}px, ${c.y}px)`;
      }
    });
  }

  // строит рейтинг по количеству монет и рисует в scoreBoard
  updateRanking() {
    // собираем массив [name, count]
    const arr = Array.from(this.game.players.values())
      .map(p => ({ name: p.name, count: this.playerCounts[p.id]||0 }));
    // сортируем по убыванию
    arr.sort((a,b) => b.count - a.count);

    // рисуем под табло или вместо него
   const board = document.getElementById('leaderboard');
    board.innerHTML = arr.map((p,i) =>
      `<div class="player-score">
         ${i+1}. ${p.name}: ${p.count} 💰
       </div>`
    ).join('');
  }

  // Внедрим CSS для анимации монет
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

// подключаемся после Game
document.addEventListener('DOMContentLoaded', () => {
  if (window.game) {
    window.coinManager = new CoinManager(window.game);
  }
});
