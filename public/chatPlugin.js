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
        position: absolute; bottom: 10px; right: 10px;
        z-index: 1000;
        padding: 8px 12px;
        background: #333; color: #fff; border: none; border-radius: 4px;
        cursor: pointer;
      }
      #chatWindow {
        position: absolute;
        bottom: 50px; right: 10px;
        width: 300px; height: 400px;
        background: rgba(0,0,0,0.8); color: #fff;
        display: none; flex-direction: column;
        z-index: 1000; border-radius: 4px;
      }
      #chatMessages {
        flex: 1; overflow-y: auto; padding: 8px;
      }
      #chatForm {
        display: flex; border-top: 1px solid #555;
      }
      #chatInput {
        flex: 1; padding: 8px; border: none; outline: none;
        background: #222; color: #fff;
      }
      #chatSend {
        padding: 8px 12px; border: none;
        background: #444; color: #fff; cursor: pointer;
      }
      .chat-entry { margin-bottom: 6px; }
      .chat-entry .name { font-weight: bold; margin-right: 4px; }
      .chat-entry .time { font-size: 0.8em; color: #ccc; }
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
    this.container.appendChild(this.toggleBtn);

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
    this.container.appendChild(this.window);

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
    // Получаем историю при подключении
    this.socket.on('chatHistory', history => {
      this.history = history;
      this.history.forEach(e => this.addEntry(e));
    });

    // Новые сообщения
    this.socket.on('chatMessage', entry => {
      this.history.push(entry);
      this.addEntry(entry);
    });

    // Очищаем чат при начале/конце матча
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
