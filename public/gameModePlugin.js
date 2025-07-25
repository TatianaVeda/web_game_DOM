export default class GameModePlugin {
  constructor(game) {
    this.game = game;
    this.socket = game.socket;
    this.currentMode = 'coins';
    this.uiInjected = false;

    this.setupSocket();
  }

  setupSocket() {
    this.socket.on('playerJoined', player => {
      if (player.id === this.socket.id && player.isHost) {
        this.injectUI();
      }
    });

    this.socket.on('newHostAssigned', ({ playerId }) => {
      if (playerId === this.socket.id) {
        this.injectUI();
      }
    });

    this.socket.on('gameModeChanged', mode => {
      this.currentMode = mode;
      console.log('[GameMode] switched to', mode);
      this.configureMode();
    });

    this.socket.on('infected', () => {
      this.markInfected();
    });
    this.socket.on('cured', () => {
      this.clearInfection();
    });

    this.socket.on('gameSpeedUp', newSpeed => {
      this.showSpeedUpNotification(newSpeed);
    });

    this.socket.on('gameStarted', () => {
      this.hideUI();
    });
    this.socket.on('resetGame', () => {
      if (this.game.isHost) this.injectUI();
    });
  }

  injectUI() {
    if (this.uiInjected) return;
    this.uiInjected = true;

    const container = document.getElementById('timerSelector').parentNode;
    container.style.display = 'flex';
    container.style.alignItems = 'center';

    this.sel = document.createElement('select');
    this.sel.id = 'modeSelect';
    ['coins', 'survival',
      // 'infection'
    ].forEach(mode => {
      const opt = document.createElement('option');
      opt.value = mode;
      opt.textContent = {
        coins: 'Coin Collection',
        survival: 'Survival',
        // infection: 'Infection'
      }[mode];
      this.sel.appendChild(opt);
    });

    this.btn = document.createElement('button');
    this.btn.textContent = 'Apply Mode';
    this.btn.onclick = () => {
      const mode = this.sel.value;
      this.socket.emit('changeGameMode', mode);
    };

    container.appendChild(this.sel);
    container.appendChild(this.btn);
  }

  hideUI() {
    if (!this.uiInjected) return;
    this.sel.remove();
    this.btn.remove();
    this.uiInjected = false;
  }

  configureMode() {
    const mode = this.currentMode;

    const coinLayer = document.getElementById('coinLayer');
    if (coinLayer) {
      coinLayer.style.display = mode === 'coins' ? 'block' : 'none';
    }

    const timerEl = document.getElementById('timer');
    if (timerEl) {
      timerEl.style.display = mode === 'coins' ? 'block' : 'none';
    }

    const timerSel = document.getElementById('timerSelector');
    if (timerSel) {
      timerSel.style.display = mode === 'coins' ? 'block' : 'none';
    }

    if (mode === 'coins') {
      console.log('[GameMode] switched to COINS: Standard coin collection mode');
    }
    else if (mode === 'survival') {
      console.log('[GameMode] switched to SURVIVAL: Survive as long as possible');

    }
    else if (mode === 'infection') {
      console.log('[GameMode] switched to INFECTION: Infect others!');
      const mine = this.game.players.get(this.game.socketId);
      if (mine?.infected) {
        this.markInfected();
      }
    }

    this.game.coinManager.updateRanking();
  }


  // ----- Infection helpers -----
  markInfected() {
    const mine = this.game.players.get(this.game.socketId);
    if (!mine) return;
    mine.infected = true;
    mine.element.classList.add('infected');
  }

  clearInfection() {
    const mine = this.game.players.get(this.game.socketId);
    if (!mine) return;
    mine.infected = false;
    mine.element.classList.remove('infected');
  }

  // ----- Survival helper -----
  showSpeedUpNotification(newSpeed) {
    const msg = document.createElement('div');
    msg.textContent = `The speed of the logs has been increased to ${newSpeed.toFixed(1)}`;
    Object.assign(msg.style, {
      position: 'absolute',
      top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '6px',
      zIndex: 2000,
      fontSize: '16px',
    });
    this.game.gameContainer.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
  }
}
