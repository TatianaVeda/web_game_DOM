// public/soundManager.js

const SoundManager = (function() {
  const paths = {
    start:    '/sounds/game-start.mp3',
    pause:    '/sounds/game-pause.mp3',
    hit:      '/sounds/player-hit.mp3',
    victory:  '/sounds/game-victory.mp3',
    coin:     '/sounds/coin-sound.mp3'
  };

  const sounds = {};

  function loadAll() {
    Object.entries(paths).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.preload = 'auto';
      sounds[key] = audio;
    });
  }

  function play(key) {
    const s = sounds[key];
    if (!s) return console.warn(`Sound "${key}" not found`);
    const clone = s.cloneNode();
    clone.play().catch(e => console.warn('Audio play failed:', e));
  }

  return {
    init: loadAll,
    playStart:   () => play('start'),
    playPause:   () => play('pause'),
    playHit:     () => play('hit'),
    playVictory: () => play('victory'),
    playCoin:    () => play('coin')
  };
})();


document.addEventListener('DOMContentLoaded', () => SoundManager.init());

window.SoundManager = SoundManager;
