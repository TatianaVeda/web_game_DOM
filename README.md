# web-game

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

Move the boat with `up`, `left`, `down` and `right` arrow keys.

`Esc` opens menu, from where players can restart the game or give up.