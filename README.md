# web-game "Dodge Trunks"🚤🚤🚤

## Overview

"Dodge Trunks" is as simple multi-player only game. Rules are simple: with you little rowing boat, you must dodge the trunks floating on the river. Each player starts the game with three lives and if they get hit by obstacles they lose a life, if you run out of them you are out! After a collision, you are invincible for 5 seconds.

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

For making the game "multiplayer", you can use for example 'ngrok' **or Cloudflare Tunnel (cloudflared)**.

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
    https://your-tunnel-id.trycloudflare.com
    ```
- Share this URL with your friends so they can join your game from anywhere!

## Play the game

Fill your name in the dedicated field. Choose you boat color. First player to join will be the host of the game. Host can lauch the game when at least two players are in.

Move the boat with ⬆️ `up`, ⬅️ `left`, ⬇️ `down` and ➡️ `right` arrow keys.

`Esc` opens menu, from where players can restart the game or give up.

## New Features

- **Collectible Coins:**
  The game features collectible coins 🪙. Each player can collect coins during the game, and the number of coins is shown in real time on the leaderboard. The winner is determined by the highest coin count (or depending on lives).

- **Sound Effects:**
  The game includes sound effects for game start, pause, player hit, collecting coins and victory🏆. Make sure to have your speakers on for the best experience!

- **Pause Menu:**
  The game features an in-game pause menu (press "Pause" or "Esc"), allowing you to pause, restart, or quit the game at any time. When a player pauses, restarts, or quits, their name is displayed to players.

- **Competitive Interactivity:**
 The game is competitive: players race to collect coins, avoid obstacles, and survive longer than their opponents. All actions (movement, collecting coins, pausing, restarting, quitting) are synchronized in real time for all participants. The winner is determined by skill, speed, and strategy, ensuring a fair and engaging multiplayer experience.

- **Leaderboard:**
  The game features a leaderboard that displays the top players based on coin count. The leaderboard is updated in real time as players collect coins.

- **Overlay Windows:**
  All important game events (pause, restart, player quit/disconnect, game over) are shown to all players via overlay windows.

- **Keyboard Controls:**
  Control your boat with the arrow keys. Keyboard input is smooth and responsive.

- **Game Duration:**
  Each game session is timed. The timer is visible to all players and counts up from the start of the game. The duration of the game is displayed at the end, so you can see how long each round lasted.

- **Visuals and Performance:**
  The game uses only DOM elements (no canvas), with smooth animations and a visually pleasing interface. Designed to run at 60 FPS.

- **Multiplayer:**
  Supports 2-4 players, works in modern browsers, and can be played from anywhere using public tunnels (ngrok, cloudflared).

---
## Team Members

- Jean-Albert Antoine Campello
- Ihor Shaposhnik
- Tatiana Vedishcheva

If you have any questions or suggestions, feel free to contact us on Discord!

---