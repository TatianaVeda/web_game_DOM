// SoundManager module handles loading and playing game sound effects
const SoundManager = (function() {
  // Object mapping sound identifiers to their corresponding file paths
  const paths = {
    start:    '/sounds/game-start.mp3',
    pause:    '/sounds/game-pause.mp3',
    hit:      '/sounds/player-hit.mp3',
    victory:  '/sounds/game-victory.mp3',
    coin:     '/sounds/coin-sound.mp3',
    shields:  '/sounds/shields.mp3',  
    hearts:   '/sounds/hearts.mp3'
  };

  // Container for Audio objects once they are loaded
  const sounds = {};

  /**
   * Preloads all audio files defined in the paths object.
   * Creates an Audio instance for each sound, sets default volume,
   * and stores it in the sounds container.
   */
  function loadAll() {
    Object.entries(paths).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = 0.5;          // Set volume to 50%
      audio.preload = 'auto';      // Hint browser to preload the audio
      sounds[key] = audio;         // Store the Audio object by its key
    });
  }

  /**
   * Plays the sound associated with the given key.
   * If the sound is not found, logs a warning.
   * Clones the audio node to allow overlapping playback of the same sound.
   *
   * @param {string} key - Identifier for the sound to play
   */
  function play(key) {
    const s = sounds[key];
    if (!s) {
      return console.warn(`Sound "${key}" not found`);
    }
    const clone = s.cloneNode();  // Clone to enable multiple instances
    clone.play().catch(e => 
      console.warn('Audio play failed:', e)
    );
  }

  // Public API exposing initialization and specific play methods
  return {
    init: loadAll,
    playStart:   () => play('start'),
    playPause:   () => play('pause'),
    playHit:     () => play('hit'),
    playVictory: () => play('victory'),
    playCoin:    () => play('coin'),
    playShield:  () => play('shields'), 
    playHeart:   () => play('hearts')
  };
})();

// Initialize SoundManager once the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => SoundManager.init());

// Expose the SoundManager globally for debugging or manual calls
window.SoundManager = SoundManager;
