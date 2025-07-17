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
    this.lastRender = 0; // timestamp of last render
    this.keys = new Set(); // keys currently pressed
    this.lastMoveSent = 0; // timestamp of last move sent to server
    this.moveThrottle = 1000 / 60; // player's movement throttle in milliseconds

    this.setupSocketListeners();
    this.setupControls();
    this.startGameLoop();
    this.setupJoinHandlers();
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
      console.log("player");
      console.log(player);
      this.socketId = player.id;
      if (!this.players.has(player.id)) {
        this.players.set(player.id, {
          ...player,
          element: this.createPlayerElement(player)
        });
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
      if (existingPlayer && player.alive) {
        existingPlayer.x = player.x;
        existingPlayer.y = player.y;
        existingPlayer.collisionImmunity = player.collisionImmunity;
        existingPlayer.lives = player.lives; // Update lives
        this.updatePlayerPosition(existingPlayer);
        this.updateLivesIndicator(existingPlayer); // Update lives indicator
      }
    });

    this.socket.on('currentPlayers', (players) => {
      players.forEach(player => {
        if (!this.players.has(player.id)) {
          this.players.set(player.id, {
            ...player,
            element: this.createPlayerElement(player)
          });
          if (this.gameRunning) {
            this.players.get(player.id).element.style.display = 'none';
            this.players.get(player.id).alive = false;
          }
          this.updateScoreboard();
        }
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
      /*state.players.forEach(serverPlayer => {
        const player = this.players.get(serverPlayer.name);
        if (player) {
          player.alive = serverPlayer.alive;
          this.updatePlayerPosition(player);
        }
      });*/

      const minutes = Math.floor(state.timer / 60);
      const seconds = state.timer % 60;
      this.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      this.floatingTrunk = state.floatingTrunk;
      this.updateFloatingTrunk();
      this.updateScoreboard();
    });

    this.socket.on('gameStarted', () => {
      this.gameRunning = true;
      if (this.isPaused) {
        this.togglePause();
      }
      const startButton = document.getElementById('startButton');
      if (startButton) {
        startButton.style.display = 'none';
      }
    });

    this.socket.on('timerUpdate', (timeLeft) => {
      if (this.timerDisplay) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        this.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    });

    this.socket.on('pauseStateChanged', ({ isPaused, playerName }) => { // Destructure the object
      this.isPaused = isPaused;
      console.log("Pause state changed by:", playerName);

      const overlay = document.getElementById('pauseOverlay');

      if (!isPaused && overlay) {
        overlay.remove();
      }
      if (isPaused && overlay) {
        return;
      }
      if (isPaused && !overlay) {
        this.showPauseOverlay(`Game is paused by ${playerName}`);
      }
    });

    this.socket.on('resetGame', (playerToReset) => {

      this.gameRunning = false;
      if (this.showPauseOverlay) {
        this.hidePauseOverlay()
      }
      if (this.players.size > 0) {
        this.showPauseOverlay(`Game resetted by: ${playerToReset}`, true, playerToReset);
      }

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
    });


    this.socket.on('gameOver', (data) => {

      this.gameRunning = false;
      this.showPauseOverlay(`Game Over!\n Winner: ${data.winner ? data.winner.name : "No one :)"}`, true, data.winner ? data.winner.name : "No one");
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
        const element = document.getElementById(object.id);
        if (element) {
          element.remove();
        }
      });
      this.floatingTrunk = [];
    });

    this.socket.on('nameTaken', (data) => {
      const errorDiv = document.getElementById('joinError');
      errorDiv.textContent = data.message || 'Name is already taken!';
      errorDiv.style.color = 'red';
      // Return to the name input screen
      document.getElementById('joinScreen').style.display = 'block';
      document.getElementById('gameScreen').style.display = 'none';
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
    if (!this.gameRunning && !this.isPaused) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.showPauseOverlay(`Game Paused by ${this.playerName}`);
    } else {
      this.hidePauseOverlay();
    }
    console.log("paused by ", this.playerName)
    this.socket.emit('togglePause', this.isPaused, this.playerName);
  }

  createPlayerElement(player) {
    const element = document.createElement('div');
    element.className = 'player-ball';
    element.innerHTML = `
    <img src="${player.icon}.svg" alt="${player.name}" width="100%" height="100%" />
    <span class="player-name">${player.name}</span>
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

  gameLoop(timestamp) {
    if (!this.lastRender) this.lastRender = timestamp;
    const delta = timestamp - this.lastRender;

    this.handleInput(timestamp);

    if (delta >= 1000) {
      //const fps = Math.round(1000 / (timestamp - this.lastRender));
      //console.log(`FPS: ${fps}`);
      this.lastRender = timestamp;
    }

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  startGameLoop() {
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  updateScoreboard() {
    this.scoreBoard.innerHTML = Array.from(this.players.values())
      .map(player => `
        <div class="player-score">
          ${player.name}: ${player.wins} wins
          ${player.isHost ? '(Host)' : ''}
        </div>
      `).join('');
  }

  updateHostControls() {
    const startButton = document.getElementById('startButton');
    if (startButton) {
      startButton.style.display = this.isHost ? 'block' : 'none';
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

    document.getElementById('joinScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
  }

  startGame() {
    if (!this.isHost) return;
    if (this.players.size <= 1) {
      this.showSimpleModal('Not enough players to start the game!');
      return;
    }
    this.socket.emit('startGame');
  }

  showPauseOverlay(message, fadeAway, playerName) {
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

    // Always show pause menu with buttons and player name if provided
    if (playerName) {
      overlay.innerHTML = `
        <div>
          <h2>${message}</h2>
          <p>By: <b>${playerName}</b></p>
          <button id="resumeBtn">Continue</button>
          <button id="restartBtn">Restart</button>
          <button id="quitBtn">Quit</button>
        </div>
      `;
    } else {
      // Fallback: just show message (for fadeAway overlays)
      overlay.innerHTML = `
        <div>
          <h2>${message}</h2>
        </div>
      `;
    }

    this.gameContainer.appendChild(overlay);

    // Button handlers for pause menu
    if (playerName) {
      document.getElementById('resumeBtn').onclick = () => {
        this.togglePause();
      };
      document.getElementById('restartBtn').onclick = () => {
        this.socket.emit('resetGame', this.playerName); // Broadcast who restarted
      };
      document.getElementById('quitBtn').onclick = () => {
        this.socket.emit('playerQuit', this.playerName); // Broadcast who quit
        window.location.reload();
      };
    }

    // If fadeAway is true, auto-hide overlay after 4 seconds
    if (fadeAway) {
      setTimeout(() => {
        this.hidePauseOverlay();
        if (this.isPaused) {
          this.isPaused = false;
        }
      }, 4000);
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
        element.innerHTML = `<img src="trunk-wood.svg" width="100%" height="100%"/>`;
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
}

document.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});