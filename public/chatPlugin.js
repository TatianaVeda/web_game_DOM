const { Picker } = window.EmojiMart;


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
    this.setupEmotePicker();
    this.setupMentionClicks();
    this.setupChatMessageClicks();
  }

  


  injectStyles() {
    const css = `
      #chatToggleBtn { position: absolute; bottom: 10px; right: 10px; z-index:1000; padding:8px 12px; background:#333; color:#fff; border:none; border-radius:4px; cursor:pointer; }
      #chatWindow { position:absolute; bottom:50px; right:10px; width:300px; height:400px; background:rgba(0,0,0,0.8); color:#fff; display:none; flex-direction:column; z-index:1000; border-radius:4px; }
      #chatMessages { flex:1; overflow-y:auto; padding:8px; }
      #chatForm { display:flex; border-top:1px solid #555; align-items:center; }
      #emojiBtn { background:none; border:none; font-size:1.2em; margin-right:4px; cursor:pointer; }
      #emojiPicker { position:absolute; bottom:60px; right:10px; display:none; z-index:2000; }
      #chatInput { flex:1; padding:8px; border:none; outline:none; background:#222; color:#fff; }
      #chatSend { padding:8px 12px; border:none; background:#444; color:#fff; cursor:pointer; }
      .chat-entry { margin-bottom:6px; }
      .chat-entry .name { font-weight:bold; margin-right:4px; }
      .chat-entry .time { font-size:0.8em; color:#ccc; }
      .mention { color:#FFD700; font-weight:bold; cursor:pointer; }
      .mention-me { background:rgba(255,215,0,0.2); border-radius:3px; padding:0 2px; }
      .mention-highlight { animation:highlightPulse 2s ease-in-out; }
      @keyframes highlightPulse { 0%,100% { box-shadow:0 0 0 rgba(255,215,0,0); } 50% { box-shadow:0 0 10px rgba(255,215,0,0.8); } }
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
        <button type="button" id="emojiBtn">😀</button>
        <textarea id="chatInput" rows="2" autocomplete="off" placeholder="Type message…"></textarea>
        <button id="chatSend" type="submit">Send</button>
      </form>
    `;
    this.container.appendChild(this.window);

    this.messagesDiv = this.window.querySelector('#chatMessages');
    this.input       = this.window.querySelector('#chatInput');
    this.form        = this.window.querySelector('#chatForm');
    this.emojiBtn    = this.window.querySelector('#emojiBtn');

    this.form.addEventListener('submit', e => {
      e.preventDefault();
      const text = this.input.value.trim();
      if (!text) return;
      this.socket.emit('chatMessage', text);
      this.input.value = '';
    });
  }

  setupChatMessageClicks() {
  
    this.messagesDiv.addEventListener('click', e => {
 
      const el = e.target.closest('.mention');
      if (!el) return;

      const name = el.textContent.slice(1);
      if (!name) return;

      if (!this.isOpen) this.toggle();

      this.input.value += `@${name} `;
      this.input.focus();
    });
  }

  setupSocket() {
    this.socket.on('chatHistory', history => {
      this.history = history;
      this.history.forEach(e => this.addEntry(e));
    });
    this.socket.on('chatMessage', entry => {
      this.history.push(entry);
      this.addEntry(entry);
    });
    this.socket.on('gameStarted', () => this.clear());
    this.socket.on('gameOver',    () => this.clear());
  }

  setupEmotePicker() {
    // Container
    this.pickerContainer = document.createElement('div');
    this.pickerContainer.id = 'emojiPicker';
     this.pickerContainer.style.display = 'none';
    this.container.appendChild(this.pickerContainer);

    // Emoji-mart Picker
    this.picker = new Picker({ onSelect: emoji => {
      this.input.value += emoji.native;
      this.input.focus();
    }});
    this.pickerContainer.appendChild(this.picker);

    // Toggle display
    this.emojiBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.pickerContainer.style.display = this.pickerContainer.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', e => {
      if (!this.pickerContainer.contains(e.target) && e.target !== this.emojiBtn) {
        this.pickerContainer.style.display = 'none';
      }
    });
  }

  
   setupMentionClicks() {
    const board = document.getElementById('leaderboard');
    if (!board) return;
    board.addEventListener('click', e => {
      const el = e.target.closest('.player-score');
      if (!el) return;
      const name = el.dataset.name;
      if (!name) return;
      const chat = this.game.chatPlugin || window.game.chatPlugin;
      if (!chat.isOpen) chat.toggle();
      chat.input.value += `@${name} `;
      chat.input.focus();
    });
  }

  addEntry({ name, text, time }) {
    const div = document.createElement('div');
    div.className = 'chat-entry';
    const hhmm = new Date(time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

    const escapeHtml = str => str.replace(/[&<>"']+/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'' :'&#39;'}[tag]||tag));
    let displayText = text.startsWith('@') ? text.slice(1) : text;
    const players = Array.from(this.game.players.values()).map(p=>p.name);

    const formatted = escapeHtml(displayText).replace(/@([\w-]+)/g, (match, p1) => {
      if (players.includes(p1)){
        const isMe = p1===this.game.playerName;
        if (isMe){
          this.window.classList.add('mention-highlight');
          setTimeout(()=>this.window.classList.remove('mention-highlight'),2000);
        }
        return `<span class="${isMe?'mention mention-me':'mention'}">@${p1}</span>`;
      }
      return match;
    });

    div.innerHTML = `
      <span class="time">[${hhmm}]</span>
      <span class="name">${escapeHtml(name)}:</span>
      <span class="text">${formatted}</span>
    `;
    this.messagesDiv.appendChild(div);
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
  }

  clear() {
    this.history=[];
    this.messagesDiv.innerHTML='';
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.window.style.display = this.isOpen?'flex':'none';
  }
}
