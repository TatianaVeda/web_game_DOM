export class JoinForm {
    private element: HTMLDivElement;
    private input: HTMLInputElement;
    private error: HTMLDivElement;
  
    constructor(onJoin: (name: string) => void) {
      this.element = document.createElement('div');
      this.element.className = 'join-form';
  
      this.element.innerHTML = `
        <h2>Enter your name</h2>
        <input type="text" id="player-name" placeholder="Your name..." />
        <button id="join-btn">Join Game</button>
        <div class="error-msg" style="color: red; display: none;"></div>
      `;
  
      this.input = this.element.querySelector('#player-name')!;
      this.error = this.element.querySelector('.error-msg')!;
  
      const button = this.element.querySelector('#join-btn')!;
      button.addEventListener('click', () => {
        const name = this.input.value.trim();
        if (name.length > 0) {
          onJoin(name);
        }
      });
  
      document.body.appendChild(this.element);
    }
  
    showError(message: string) {
      this.error.textContent = message;
      this.error.style.display = 'block';
    }
  
    remove() {
      this.element.remove();
    }
  }