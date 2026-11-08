# Party Arcade

A browser multiplayer party arcade built with Node.js, Express, Socket.IO, and Phaser 3. It includes 15 games, private three-digit rooms, live room chat, and touch controls for movement games on phones.

## Project layout

```
server.js            Express + Socket.IO server, room lifecycle, chat, rate limits
launcher.js          Windows/desktop launcher (finds a free port, starts the server, opens the browser)
public/
  index.html         Lobby, room view, and modal markup
  app.js             Catalog, lobby, chat, and room flow
  game-runtime.js    Phaser scenes, game rules, input, simulation, and rendering
  styles.css         Main styles
  touch.css          On-screen controls for phones
  favicon.svg
test/
  logic.js           Headless tests: runs every game with the real runtime
  smoke.js           End-to-end tests: boots the server and checks rooms, auth, and rate limits
```

## Run locally

Requirements: Node.js 18 or newer.

New in 1.5: pick a character when you join, and play Brain Rush or Mind Games for trivia and riddles.

On a phone, open the room, tap the ⤢ button to play full screen, and turn the phone sideways for the largest view. Walk with the on-screen pad. Football and basketball use drag-to-aim: touch the ball and drag back, and a longer drag gives more power.

On Windows, double-click **Start Party Arcade.bat**. It installs dependencies on first run, starts the server, and opens the game on a free port between 3000 and 3010.

For a terminal launch on any platform:

```sh
npm install
npm start
```

Open the URL printed in the terminal (normally http://localhost:3000). Open a second tab to test multiplayer. Devices on the same Wi-Fi can join using the host computer's local network address and port.

Run the test suite with:

```sh
npm test
```

## Deploy publicly

`render.yaml` describes a free Render web service. Push this folder to a GitHub repository, create a **Blueprint Instance** in Render, and connect the repository. Render runs `npm ci`, starts with `npm start`, and checks `/health`.

Free Render services sleep after 15 minutes without traffic, and waking can take about a minute. Keep one instance: room and game state live in that server process. Restarts and redeploys clear active rooms.

## Operations

- `GET /health` returns status, room count, player count, and uptime.
- The server handles SIGTERM and SIGINT by closing connections cleanly.
- Chat is limited to 6 messages per 4 seconds per player. Game actions are limited to 30 per second.
- Security headers are set on every response.

## Known limits

- Room state is in memory. Use one instance only.
- If a player's connection drops, they leave the room and must rejoin with the code.
- The host's browser runs the game simulation. If the host disconnects, the match stops and a new host can restart it.

## Games

Arcade: Snowball Fight, Paint Fight, King of the Yard, Mini 2D Football, Mini 2D Basketball, Car Racing, Archery Target, Soccer Penalties.

Strategy and puzzles: Chess, Dots and Boxes, Memory, Pool (eight-ball rules), Broken Tiles, Golf, Mini Golf.

Mind: Brain Rush (trivia and logic, 128 questions in the bank), Mind Games (riddles and logic).

## Testing

- `npm test` runs 76 logic checks against the real game rules and 11 server checks.
- The logic checks cover every game's rules, client prediction and interpolation, and the answer-key protection.
- A headless browser run (Playwright with Chromium) starts every game for a host and a mobile guest. Run it again after any client change.
