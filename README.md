# web-game "Dodge Trunks" 🪵🚤🪙🚤❤️🚤

## Overview

"Dodge Trunks" is as simple multi-player only game. Rules are simple: with you little rowing boat, you must dodge the trunks floating on the river. You can collect coins during the game, and the number of coins is shown in real time on the leaderboard. The winner is determined by the highest coin count. Each player starts the game with three lives and if they get hit by obstacles they lose a life, if you run out of them you are out! Gather coins to increase your score and climb the leaderboard.

## Run the game
1. Install dependencies

```
npm install
```

2. Start the game server

```
npm start
```

The game can be accessed from http://localhost:3000

## Opening the game for multiplayer

For making the game "multiplayer", you can use for example 'ngrok' **or Cloudflare Tunnel (cloudflared)**. Simply split your terminal window and run the tunnel tool (ngrok or cloudflared) in parallel with your game server, as described below, to obtain a public URL.

### Option 1: ngrok
- Navigate to https://ngrok.com
Sign up and follow instructions to install the client based on your operating system: https://ngrok.com/download or use:

  ```
  npm install -g ngrok
  ```
  
- Continue the setup as instructed at https://dashboard.ngrok.com/get-started/setup

- Because your server is launched at http://localhost:3000, use the command: 

  ```
  ngrok http 3000
  ```
That will give you an URL of the type: 'https://************.ngrok-free.app'

- Give this URL to your friends for them to join the game.

### Option 2: Cloudflare Tunnel (cloudflared)

- Install cloudflared:
  - [Download from official site](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
  - Or via npm:
    ```
    npm install -g cloudflared
    ```
- Start a tunnel to your local server:
    ```
    npx cloudflared tunnel --url http://localhost:3000
    ```
- After a few seconds, you will see a public URL like:
    ```
    https://your-tunnel-id.trycloudflare.com (eg. https://identical-thailand-choir-architecture.trycloudflare.com)
    ```
- Share this URL with your friends so they can join your game from anywhere!

## Play the game

Fill your name in the dedicated field. Choose you boat color. First player to join will be the host of the game. Host can lauch the game when at least two players are in. 

Move the boat with ⬆️ `up`, ⬅️ `left`, ⬇️ `down` and ➡️ `right` arrow keys.

`Esc` also opens menu, from where players can restart the game or give up.

## Game Rules

- **Goal:**  
  Dodge the floating trunks **🪵** and collect as many coins **🪙** as possible! The player with the most coins at the end wins. 

- **Obstacles (Trunks 🪵):**  
  Floating trunks **🪵** are the main danger. If your boat collides with a trunk, you lose one life **❤️** and become temporarily invincible.

- **Lives ❤️:**  
  Each player starts with **3 lives** (❤️❤️❤️). Colliding with a trunk **🪵** or obstacle costs one life. If you lose all your lives, you can no longer collect coins or interact. If only one player remains alive, the game ends immediately. This behavior is implemented in accordance with the requirements: "Your game must be playable by between 2 and 4 players." and "The game supports multiplayer with 2, 3 or 4 players."

- **Bonuses:**  
  - **Shield 🛡️:** Grants 15 seconds of immunity to collisions.
  - **Heart ❤️:** Pick up hearts to restore lost lives (up to 3).
  - **Coin 🪙:** Increase your score and leaderboard position.

- **Collision Immunity 🛡️:**  
  After each collision with a trunk **🪵**, your boat becomes invincible for **5 seconds** (visual effect).  
  You can also gain **15 seconds of immunity** by collecting a **shield bonus** 🛡️.

- **Host 👑:**  
  The first player to join is the host and can start or restart the game. If the host leaves, a new host is assigned automatically. **The host can choose the duration of the round before starting the game.**

- **Pause & Menu:**  
  Press `Esc` or the **Pause** button to open the menu. You can pause, restart, or quit the game. The name of the player who initiates these actions is shown to all.

## Features

- 🌐 **Real-Time Synchronization:** Floating trunks move across the river, and all players must dodge them in real time. All players see each other's positions, actions, and scores/lives.
- 🚤 **Playable Characters:** Each player controls their own boat, visible to all participants. Each player selects a unique name before joining.
- 👥 **Equal Opportunity:** All boats have identical abilities and movement speed; every player has an equal chance to win.
- 🧑‍🤝‍🧑 **Multiplayer (2-4 players):** Supports 2, 3, or 4 players per session. Each player can join from their own computer/browser via a provided URL or IP address.  
- 🎵 **Sound Effects:** The game includes sound effects for game start, pause, player hit, collecting coins and victory🏆. Make sure to have your speakers on for the best experience!
- ⏳ **Game Duration:** Each game session is timed. The timer is visible to all players and counts up from the start of the game. The duration of the game is displayed at the end, so you can see how long each round lasted. The host can choose the duration of the round before starting the game. 
- 🏆 **Leaderboard:** Real-time leaderboard shows players' coin counts and lives of all players.
- 💬 **In-game Chat:** Players can chat with each other in real time during the game.
- 🕹️ **Game Modes:** Multiple game modes available (e.g. coins, survival, infection) — host can select the mode.
- 🚫 **No Canvas:** The game uses only DOM elements for rendering and animation. Designed to run at 60 FPS.
- ⏸️ **Pause Menu:** The game features an in-game pause menu (press "Pause" or "Esc"), allowing you to pause, restart, or quit the game. The initiator's name is shown to all.
- 🪄 **Overlay Windows:** All important events (pause, restart, player quit/disconnect, game over) are shown via overlays.
- 🎮 **Keyboard Controls:** Control your boat with the arrow keys. Keyboard input is smooth and responsive.
- 🎯 **Movement Constraints:** Player movement is intelligently bounded to prevent going off-screen, ensuring all players remain visible and playable.
- ⚠️ **Smart Warnings:** Helpful notifications appear when the browser window is too small, with automatic dismissal for better UX.
- ✨ **Extra Features:** Power-ups (shields, hearts), sound effects, real-time overlays, and a competitive, enjoyable gameplay experience: the winner is determined by skill, speed, and strategy.

## Visual Design & Responsiveness

- **Player movement constraints:** Player movement is limited within the actual game container bounds, preventing avatars from going off-screen or disappearing beyond browser edges.
- **Window size warnings:** The game shows helpful warnings when the browser window is too small for comfortable gameplay, with automatic dismissal after 10 seconds.
- **Visibility monitoring:** Active monitoring ensures players stay within the visible game area, with automatic repositioning if they go out of bounds.
- **Fixed HUD & controls:** All HUD elements (lives, score, timer) and controls remain fixed and visible regardless of window scaling.
- **Responsive design:** Interface elements adapt to different screen sizes while maintaining usability.
- **No scrollbars:** All content fits within the available space without creating scrollbars.

- **Floating Visual Hints for Key Events:**
  - When a player collects a coin, a floating '+1' appears above their avatar, providing instant feedback.
  - When a player collects a heart (extra life), a floating '+1' appears above their avatar.
  - When a player collects a shield, a floating hint '🛡️ 15 seconds of immunity' appears above their avatar, making the bonus effect clear and visually engaging.
  - When a player loses a life (e.g., collides with a trunk), a floating '💔' appears above their avatar, and the avatar briefly shakes for extra feedback.
- **Smooth Animations:** All floating hints and key events are accompanied by smooth CSS animations for a modern, responsive feel.

---
## Team Members

- Jean-Albert Antoine Campello
- Ihor Shaposhnik
- Tatiana Vedishcheva

If you have any questions or suggestions, feel free to contact us on Discord!

---