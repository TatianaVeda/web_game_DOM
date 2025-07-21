import CoinManager from './coinManager.js';
import BonusManager from './bonusManager.js';


class Game {
  constructor() {
    // Core game properties
    this.socket = io();
    this.gameContainer = document.getElementById('gameContainer');
    this.scoreBoard = document.getElementById('scoreBoard');
    this.timerDisplay = document.getElementById('timer');
    this.livesIndicator = document.getElementById('livesIndicator');
    this.playerName = '';
    this.socketId = '';
    this.isHost = false;
    this.gameRunning = false;
    this.isPaused = false;

    // Animation and state management
    this.players = new Map();
    this.floatingTrunk = []; // floating trunks
    this.modelCoins    = [];
    this.modelShields  = [];
    this.modelHearts   = [];
    this.modelTimer    = 0;
    this.modelTimeLimit= 0;
    this.lastRender = 0; // timestamp of last render
    this.keys = new Set(); // keys currently pressed
    this.lastMoveSent = 0; // timestamp of last move sent to server
    this.moveThrottle = 1000 / 60; // player's movement throttle in milliseconds

    this.loopId = null;
    this.isActive = false;

    this.setupSocketListeners();
    this.setupControls();
    this.setupJoinHandlers();
    this.coinManager  = new CoinManager(this);
    this.bonusManager = new BonusManager(this);
  }

   renderScene() {
 
    this.players.forEach(player => {

      player.element.style.transform =
        `translate(${player.x}px, ${player.y}px)`;

      if (player.collisionImmunity) {
        player.element.classList.add('collision-immune');
      } else {
        player.element.classList.remove('collision-immune');
      }

      if (player.id === this.socketId) {
        this.livesIndicator.innerHTML = '❤️'.repeat(player.lives);
      }
    });


    const remaining = Math.max(this.modelTimeLimit - this.modelTimer, 0);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    this.timerDisplay.textContent = `${m}:${s.toString().padStart(2,'0')}`;

  
    this.floatingTrunk.forEach(obj => {
      let el = document.getElementById(obj.id);
      if (!el) {
 
        el = document.createElement('div');
        el.id = obj.id;
        el.className = 'floating-trunk';
        el.innerHTML = '<img src="images/trunk-wood.svg"  width="100%" height="100%"/>';
        this.gameContainer.appendChild(el);
      }

       el.style.width  = `${obj.size}px`;
       el.style.height = `${obj.size}px`;
     
      el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
    });


     this.coinManager.renderCoins();
    this.bonusManager.renderShields();
    this.bonusManager.renderHearts();

   
    this.updateScoreboard();
  }

  setupSocketListeners() {
    this.players = new Map();
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('gameFull', () => {
      alert('Game is full! Please try again later.');
      window.location.reload();
    });

    this.socket.on('playerJoined', (player) => {
       console.log("player joined:", player);
      this.socketId = player.id;
      if (!this.players.has(player.id)) {
        this.players.set(player.id, {
          ...player,
          element: this.createPlayerElement(player)
          
        });
      }
  this.isHost = player.isHost;
  this.updateHostControls();
  this.updateScoreboard();

  if (player.id === this.socketId) {
    document.getElementById('joinScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    this.startGameLoop(); // start game loop only after entering the game
  }


      this.isHost = player.isHost;

      if (this.gameRunning) {
        this.players.get(player.id).element.style.display = 'none';
        this.players.get(player.id).alive = false;
      }

      this.updateHostControls();
      this.updateScoreboard();
    });

this.socket.on('playerMoved', (player) => {
  const existingPlayer = this.players.get(player.id);
  if (!existingPlayer) return;
const oldLives = existing.lives;
  existingPlayer.x = player.x;
  existingPlayer.y = player.y;
  existingPlayer.collisionImmunity = player.collisionImmunity;
  existingPlayer.lives = player.lives;

   if (player.id === this.socketId && player.lives < oldLives) {
    window.SoundManager.playHit();
  }

});


    this.socket.on('currentPlayers', (players) => {
      this.clearAllPlayers(); 
      players.forEach(player => {
        this.players.set(player.id, {
          ...player,
          element: this.createPlayerElement(player)
        });
        if (this.gameRunning) {
          this.players.get(player.id).element.style.display = 'none';
          this.players.get(player.id).alive = false;
        }
        this.updateScoreboard();
      });
    });

    this.socket.on('newHostAssigned', ({ playerId, playerName }) => {
      console.log(`New host assigned: ${playerName} (${playerId})`);
      if (playerId === this.socketId) {
        this.isHost = true;
        const startButton = document.getElementById('startButton');
        startButton.style.display = 'block';
      }
    });

    this.socket.on('playerDisconnected', (playerId) => {
      const player = this.players.get(playerId);
      if (player) {
        this.hidePauseOverlay();
        this.showPauseOverlay(`Player ${player.name} disconnected from the game`, true, player.name)
        if (!this.isPaused) {
          this.isPaused = true;
        }
        player.element.remove();
        setTimeout(() => {
          this.players.delete(playerId);
          this.updateScoreboard();
        }, 4000)
      }
    });

    this.socket.on('playerDied', (playerId) => {

      console.log('Player died:', playerId);
    });

this.socket.on('gameState', (state) => {
  state.players.forEach(sp => {
    const p = this.players.get(sp.id);
    if (!p) return;
    const oldLives = p.lives;
    p.x = sp.x;           p.y = sp.y;
    p.alive = sp.alive;   p.lives = sp.lives;
    if (sp.id === this.socketId && sp.lives < oldLives) {
     window.SoundManager.playHit();
  }
    p.collisionImmunity = sp.collisionImmunity;
    p.coinCount = sp.coinCount || 0;
    
  });

  this.modelTimer     = state.timer;
  this.modelTimeLimit = state.timeLimit || 0;
  this.floatingTrunk  = state.floatingTrunk;
  this.modelCoins     = state.coins;
  this.modelShields   = state.shields;
  this.modelHearts    = state.hearts;

 
});



    this.socket.on('joinError', (message) => {
  const errorDiv = document.getElementById('joinError');
  errorDiv.textContent = message;
  errorDiv.style.color = 'red';
});

    this.socket.on('gameStarted', () => {
      console.log('[gameStarted] before: gameRunning:', this.gameRunning, 'isPaused:', this.isPaused);
      this.gameRunning = true;
      this.isPaused = false;
      window.SoundManager.playStart();

      if (this.isPaused) {
        this.togglePause();
      }
      const startButton = document.getElementById('startButton');
      if (startButton) {
        startButton.style.display = 'none';
      }
      //  Delete resultOverlay when new game starts
      const resultsOverlay = document.getElementById('resultsOverlay');
      if (resultsOverlay) resultsOverlay.remove();
      // Change text of Pause/Continue button
      const pauseBtn = document.getElementById('pauseButton');
      if (pauseBtn) {
        pauseBtn.textContent = this.isPaused ? 'Continue' : 'Pause';
      }
      //Show overlay "Game started by X" to all players
      this.showPauseOverlay(`Game started by ${this.playerName}`, true, this.playerName, false);
      console.log('[gameStarted] after: gameRunning:', this.gameRunning, 'isPaused:', this.isPaused);
      // Update host controls
      this.updateHostControls();
    });


    this.socket.on('timerUpdate', (timeLeft) => {
      if (this.timerDisplay) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        this.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    });

    this.socket.on('pauseStateChanged', ({ isPaused, playerName }) => { // Destructure the object
      console.log('[pauseStateChanged] isPaused:', isPaused, 'by', playerName, 'gameRunning:', this.gameRunning);
      this.isPaused = isPaused;
      if (!this.gameRunning) {
        this.hidePauseOverlay();
        return;
      }
      if (isPaused) {
        window.SoundManager.playPause();
        this.showPauseOverlay(`Game paused by ${playerName}`, false, playerName, true); 
      } else {
        window.SoundManager.playStart();
        this.hidePauseOverlay();
      }
      console.log("Pause state changed by:", playerName);
    });

    this.socket.on('resetGame', (playerToReset) => {
      console.log('[resetGame] isHost:', this.isHost, 'gameRunning:', this.gameRunning, 'isPaused:', this.isPaused);
      this.gameRunning = false;
      this.isPaused = false;
      this.hidePauseOverlay();
      if (this.players.size > 0) {
        this.showPauseOverlay(`Game resetted by: ${playerToReset}`, true, playerToReset, false);
      }
      this.updateHostControls(); 
      if (this.isHost) {
        const startButton = document.getElementById('startButton');
        if (startButton) {
          startButton.style.display = 'block';
        }
      }
      this.players.forEach(player => {
        player.alive = true;
        player.lives = 3;
        player.collisionImmunity = false;
        player.element.style.display = 'block';
        player.timerDisplay = 0;
      });
      this.updateScoreboard();
      this.floatingTrunk.forEach(object => {
        const element = document.getElementById(object.id);
        if (element) {
          element.remove();
        }
      });
      this.floatingTrunk = [];
      // Delete resultOverlay when game is resetted
      const resultsOverlay = document.getElementById('resultsOverlay');
      if (resultsOverlay) resultsOverlay.remove();
      // Change text of Pause/Continue button
      const pauseBtn = document.getElementById('pauseButton');
      if (pauseBtn) {
        pauseBtn.textContent = this.isPaused ? 'Continue' : 'Pause';
      }
    });


this.socket.on('gameOver', (data) => {

      this.gameRunning = false;
      window.SoundManager.playVictory();
      this.showResults(data); 
      if (this.isHost) {
        const startButton = document.getElementById('startButton');
        if (startButton) {
          startButton.style.display = 'block';
        }
      }
      this.players.forEach(player => {
        if (data.winner && player.id === data.winner.id) {
          player.wins = data.winner.wins;
        }
        player.alive = true;
        player.element.style.display = 'block';
      });

      this.updateScoreboard();

  this.floatingTrunk.forEach(object => {
    const el = document.getElementById(object.id);
    if (el) el.remove();
  });
  this.floatingTrunk = [];

});

    this.socket.on('notEnoughPlayers', (data) => {
      this.showSimpleModal(data.message || 'Not enough players to start the game!');
    });
    this.socket.on('playerQuit', (playerName) => {
      this.showPauseOverlay(`Player ${playerName} quit the game`, true, playerName, false);
    });
    this.socket.on('notHost', (data) => {
      this.showSimpleModal(data.message || 'Only the host can restart the game!');
    });
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'Escape') {
          this.togglePause();
          return;
        }
        this.keys.add(e.key);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) {
        e.preventDefault();
        this.keys.delete(e.key);
      }
    });

    // Add Pause button handler
    const pauseBtn = document.getElementById('pauseButton');
    if (pauseBtn) {
      pauseBtn.onclick = () => {
        this.togglePause();
      };
    }
  }

  togglePause() {
    // You can press Pause always when player is in the game
    if (!this.gameRunning && !this.isPaused) return;
    this.isPaused = !this.isPaused;
    // Change text of Pause/Continue button
    const pauseBtn = document.getElementById('pauseButton');
    if (pauseBtn) {
      pauseBtn.textContent = this.isPaused ? 'Continue' : 'Pause';
    }
    if (this.isPaused) {
      this.showPauseOverlay(`Game paused by ${this.playerName}`, false, this.playerName, true); // Меню паузы
    } else {
      this.hidePauseOverlay();
    }
    console.log("[togglePause] paused by ", this.playerName, 'isPaused:', this.isPaused, 'gameRunning:', this.gameRunning);
    this.socket.emit('togglePause', this.isPaused, this.playerName);
  }

  createPlayerElement(player) {
    const element = document.createElement('div');
    element.className = 'player-ball';
    const displayName = player.name + (player.isHost ? '👑(Host)' : '');
    element.innerHTML = `
    <img src="images/${player.icon}.svg" alt="${player.name}" width="100%" height="100%" />
    <span class="player-name">${displayName}</span>
  `;
    element.style.transform = `translate(${player.x}px, ${player.y}px)`;

    this.gameContainer.appendChild(element);
    return element;
  }

  updatePlayerPosition(player) {
    if (player.element) {
      player.element.style.transform = `translate(${player.x}px, ${player.y}px)`;

      // Handle collision immunity effect
      if (player.collisionImmunity) {
        if (!player.element.classList.contains('collision-immune')) {
          console.log("adding collision-immunity")
          player.element.classList.add('collision-immune');
        }
      } else {
        player.element.classList.remove('collision-immune');
        console.log("removing collision immunity")
      }
    }
  }


  handleInput(timestamp) {
    if (timestamp - this.lastMoveSent < this.moveThrottle) return;
    if (this.isPaused) return; // Don't send move events when paused
    let mx = 0, my = 0;
    if (this.keys.has('ArrowUp')) {
      my--;
    }
    if (this.keys.has('ArrowDown')) {
      my++;
    }
    if (this.keys.has('ArrowLeft')) {
      mx--;
    }
    if (this.keys.has('ArrowRight')) {
      mx++;
    }

    if (mx !== 0 || my !== 0) {
      this.socket.emit('move', mx, my);
      this.lastMoveSent = timestamp;
    }
  }

  startGameLoop() {
    if (this.isActive) return;
    this.isActive = true;
    this.loopId = requestAnimationFrame(this.gameLoop.bind(this));
  }

   gameLoop(timestamp) {
    this.handleInput(timestamp);
    this.renderScene();
    this.loopId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  updateScoreboard() {
  }

  updateHostControls() {
    const startButton  = document.getElementById('startButton');
    const pauseBtn     = document.getElementById('pauseButton');
    const timerSelDiv  = document.getElementById('timerSelector');
    console.log('[updateHostControls] isHost:', this.isHost, 'gameRunning:', this.gameRunning);

    if (this.isHost && !this.gameRunning) {
      if (startButton)  startButton.style.display   = 'inline-block';
      if (timerSelDiv)  timerSelDiv.style.display   = 'inline-block';
    } else {
      if (startButton)  startButton.style.display   = 'none';
      if (timerSelDiv)  timerSelDiv.style.display   = 'none';
    }

    if (pauseBtn) {
      console.log('[updateHostControls] pauseBtn.disabled =', !this.gameRunning);
      pauseBtn.disabled = !this.gameRunning;
    }
  }

  joinGame(playerName) {
    if (!playerName || playerName.trim() === '') {
      const errorDiv = document.getElementById('joinError');
      errorDiv.textContent = 'Please enter a valid name!';
      errorDiv.style.color = 'red';
      return;
    }

    const selectedIcon = document.querySelector('.icon-option.selected').dataset.icon;
    this.playerName = playerName.trim();
    this.socket.emit('joinGame', { name: this.playerName, icon: selectedIcon });
  }

  startGame() {
    if (!this.isHost) return;
    if (this.players.size <= 1) {
      this.showSimpleModal('Not enough players to start the game!');
      return;
    }
    // this.socket.emit('startGame');
     const minutes = parseInt(document.getElementById('timerSelect').value, 10);
  this.socket.emit('startGame', { duration: minutes * 60 });
  }

  showPauseOverlay(message, fadeAway, playerName, isPauseMenu = false) {
    // Remove old overlay if exists
    const oldOverlay = document.getElementById('pauseOverlay');
    if (oldOverlay) oldOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'pauseOverlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      color: white; font-size: 24px; z-index: 1000;
    `;

    if (isPauseMenu && playerName) {
      overlay.innerHTML = `
        <div>
          <h2>Game paused by ${playerName}</h2>
          <button id="resumeBtn">Continue</button>
          <button id="restartBtn">Restart</button>
          <button id="quitBtn">Quit</button>
        </div>
      `;
    } else {
      overlay.innerHTML = `
        <div>
          <h2>${message}</h2>
        </div>
      `;
    }

    this.gameContainer.appendChild(overlay);

    // Button handlers for pause menu
    if (isPauseMenu && playerName) {
      document.getElementById('resumeBtn').onclick = () => {
        this.socket.emit('togglePause', false, this.playerName);
        this.hidePauseOverlay();
      };
      document.getElementById('restartBtn').onclick = () => {
        this.hidePauseOverlay();
        if (this.isHost) {
          this.socket.emit('resetGame', this.playerName);
        } else {
          this.showSimpleModal('Only the host can restart the game!');
        }
      };
      document.getElementById('quitBtn').onclick = () => {
        this.hidePauseOverlay();
        this.socket.emit('playerQuit', this.playerName);
        setTimeout(() => window.location.reload(), 500);
      };
    }

    // Fade out overlay for events
    if (fadeAway) {
      setTimeout(() => {
        this.hidePauseOverlay();
        if (this.isPaused) {
          this.isPaused = false;
        }
      }, 1500);
    }
  }

  showSimpleModal(message) {
    // Remove old modal if exists
    let modal = document.getElementById('simpleModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'simpleModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <p>${message}</p>
        <button id="simpleModalOk">OK</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('simpleModalOk').onclick = () => {
      modal.remove();
    };
  }


  hidePauseOverlay() {
    const overlay = document.getElementById('pauseOverlay');
    if (overlay) {
      overlay.remove();
    }
  }

  quit() {
    // Use the custom modal for quit confirmation
    const modal = document.getElementById('customModal');
    modal.style.display = 'flex';

    const okBtn = document.getElementById('modalOk');
    const cancelBtn = document.getElementById('modalCancel');

    okBtn.onclick = () => {
      modal.style.display = 'none';
      this.socket.emit('playerQuit', this.playerName); // Broadcast who quit
      window.location.reload();
    };
    cancelBtn.onclick = () => {
      modal.style.display = 'none';
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
  }


  resetGame() {
    console.log(this.playerName)
    this.socket.emit('resetGame', this.playerName);
      }

showResults() {
  const counts = window.coinManager.playerCounts;
  const arr = Array.from(this.players.values()).map(p => ({
    id: p.id,
    name: p.name + (p.isHost ? ' (Host)' : ''),
    count: counts[p.id] || 0
  }));
  arr.sort((a, b) => b.count - a.count);
  const top4 = arr.slice(0, 4);
  const overlay = document.createElement('div');
  overlay.id = 'resultsOverlay';
  overlay.style.cssText = `
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    font-family: sans-serif;
    z-index: 10000;
  `;
  const fireworks = document.createElement('div');
  fireworks.className = 'fireworks';
  overlay.appendChild(fireworks);
  const board = document.createElement('div');
  board.style.textAlign = 'center';
  board.style.marginTop = '20px';
  const trophies = ['🥇', '🥈', '🥉', '🏅'];
  top4.forEach((p, i) => {
    const row = document.createElement('div');
    row.style.fontSize = '24px';
    row.style.margin = '8px 0';
    row.innerHTML = `
      <span style="font-size:48px">${trophies[i]}</span>
      <strong>${i + 1}.</strong>
      ${p.name} — <strong>${p.count} 💰</strong>
    `;
    board.appendChild(row);
  });
  overlay.appendChild(board);

  this.gameContainer.appendChild(overlay);
  
  const style = document.createElement('style');
  style.textContent = `
    .fireworks {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: url('/images/fireworks.gif') center/cover no-repeat;
      opacity: 0.6;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  // Disable start button during overlay
  const startButton = document.getElementById('startButton');
  if (startButton) startButton.disabled = true;

  setTimeout(() => {
    overlay.remove();
    // Enable start button after overlay disappears
    if (startButton) startButton.disabled = false;
  }, 10000); // 10 seconds (duration of overlay and victory music)
  
}

  setupJoinHandlers() {
    const joinButton = document.getElementById('joinButton');
    const playerNameInput = document.getElementById('playerName');

    joinButton.addEventListener('click', () => {
      this.joinGame(playerNameInput.value);
    });

    playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.joinGame(playerNameInput.value);
      }
    });

    playerNameInput.focus();
    // icon selection handler
    document.querySelectorAll('.icon-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
      });
    });
  }

  updateFloatingTrunk() {
    for (let i = this.floatingTrunk.length - 1; i >= 0; i--) {
      const object = this.floatingTrunk[i];

      if (object.gathered || object.y === 810) {
        const element = document.getElementById(object.id);
        if (element) {
          element.remove();
        }
        this.floatingTrunk.splice(i, 1);
        continue;
      }

      let element = document.getElementById(object.id);
      if (!element) {
        element = document.createElement('div');
        element.id = object.id;
        element.className = 'floating-trunk';
        element.innerHTML = `<img src="images/trunk-wood.svg" width="100%" height="100%"/>`;
        this.gameContainer.appendChild(element);
      }

      element.style.width = `${object.size}px`;
      element.style.height = `${object.size}px`;

      element.style.transform = `translate(${object.x}px, ${object.y}px)`;
    }
  }

  updateLivesIndicator(player) {
    if (player.id === this.socketId) {
      const hearts = Array(player.lives).fill('❤️').join(' ');
      this.livesIndicator.innerHTML = hearts;
    }
  }

  clearAllPlayers() {
    this.players.forEach(player => {
      if (player.element && player.element.parentNode) {
        player.element.parentNode.removeChild(player.element);
      }
    });
    this.players.clear();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
  window.coinManager = new CoinManager(window.game);
});