export default class ChatPlugin {
  constructor(game) {
    this.game       = game;
    this.socket     = game.socket;
    this.container  = document.getElementById('gameContainer');
    this.isOpen     = false;
    this.history    = [];

    this.injectStyles();
    this.buildUI();
    this.setupSocket();
  }

  injectStyles() {
    const css = `
      #chatToggleBtn {
        position: fixed; bottom: 36px; right: 36px;
        z-index: 2100;
        padding: 12px 20px;
        font-size: 18px;
        background: #333; color: #fff; border: none; border-radius: 6px;
        cursor: pointer;
      }
      #chatWindow {
        position: fixed;
        bottom: 84px; right: 36px;
        width: 380px;
        min-height: 60px;
        max-height: 60vh;
        height: auto;
        background: rgba(0,0,0,0.8); color: #fff;
        display: none; flex-direction: column;
        z-index: 2100; border-radius: 6px;
        transition: height 0.2s;
      }
      #chatMessages {
        flex: 1; overflow-y: auto; padding: 11px;
      }
      #chatForm {
        display: flex; border-top: 1px solid #555;
      }
      #chatInput {
        flex: 1; padding: 10px; border: none; outline: none;
        background: #222; color: #fff;
      }
      #chatSend {
        padding: 10px 16px; border: none;
        background: #444; color: #fff; cursor: pointer;
      }
      .chat-entry { margin-bottom: 8px; }
      .chat-entry .name { font-weight: bold; margin-right: 6px; }
      .chat-entry .time { font-size: 0.9em; color: #ccc; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  buildUI() {
    // Toggle button
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.id = 'chatToggleBtn';
    this.toggleBtn.textContent = 'Chat';
    this.toggleBtn.onclick = () => this.toggle();
    document.body.appendChild(this.toggleBtn);

    // Chat window
    this.window = document.createElement('div');
    this.window.id = 'chatWindow';
    this.window.innerHTML = `
      <div id="chatMessages"></div>
      <form id="chatForm">
        <input id="chatInput" autocomplete="off" placeholder="Type message…" />
        <button id="chatSend" type="submit">Send</button>
      </form>
    `;
    document.body.appendChild(this.window);

    this.messagesDiv = this.window.querySelector('#chatMessages');
    this.input       = this.window.querySelector('#chatInput');
    this.form        = this.window.querySelector('#chatForm');

    this.form.addEventListener('submit', e => {
      e.preventDefault();
      const text = this.input.value.trim();
      if (!text) return;
      this.socket.emit('chatMessage', text);
      this.input.value = '';
    });
  }

  setupSocket() {
    // Get history when connecting
    this.socket.on('chatHistory', history => {
      this.history = history;
      this.history.forEach(e => this.addEntry(e));
    });

    // New messages
    this.socket.on('chatMessage', entry => {
      this.history.push(entry);
      this.addEntry(entry);
    });

    // Clear chat when game starts/ends
    this.socket.on('gameStarted', () => this.clear());
    this.socket.on('gameOver',    () => this.clear());
  }

  addEntry({ name, text, time }) {
    const div = document.createElement('div');
    div.className = 'chat-entry';
    const hhmm = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `<span class="time">[${hhmm}]</span>
                     <span class="name">${name}:</span>
                     <span class="text">${text}</span>`;
    this.messagesDiv.appendChild(div);
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
  }

  clear() {
    this.history = [];
    this.messagesDiv.innerHTML = '';
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.window.style.display = this.isOpen ? 'flex' : 'none';
  }
}
