# Changelog

## 1.7.0
Games:
- **Penalties:** five shots each, and the most goals wins. Before, the match ended as soon as someone reached five goals.
- **Memory:** combo scoring. Each match in a row scores more (up to 3 points), and a miss breaks the streak.
- **King of the Yard:** the zone must be captured by holding it alone for 2.5 seconds. Owners earn double points. A contested zone scores nothing. Owner and capture progress show as rings around the zone.
- **Archery:** wind changes every 12 seconds and pushes arrows sideways. The current wind shows in the status line.

Quality:
- 76 logic checks and 11 server checks. Every game starts for a host and a mobile guest in a headless browser with no page errors.

## 1.6.0
- Question bank: 128 questions.
- Snowball Fight pickups: shield and triple throw.

## 1.5.0
- Mind games: Brain Rush and Mind Games.
- Characters, a new theme, and the Mind filter.

## 1.6.0
- **Question bank:** 128 questions, up from 60. The new ones cover science, geography, history, sport, music and more, plus new riddles and logic puzzles. Every question has four different answers.
- **Snowball Fight pickups:** a shield (blue, "S") blocks the stun for five seconds. A triple throw ("3") fires three snowballs in a spread for the next three throws. Pickups appear every few seconds, up to three at a time.

## 1.5.0
- Mind games: Brain Rush and Mind Games with characters, a new theme, and the Mind filter.

## 1.5.0
New: Mind games
- **Brain Rush:** 10 rounds of trivia and logic puzzles. Tap the answer before the 15-second clock runs out. Faster correct answers score more (up to 160 points).
- **Mind Games:** 10 rounds of riddles and logic puzzles, same rules.
- Answers are revealed together after each round, with the correct answer highlighted and each player's pick shown.
- The answer key never leaves the server, so nobody can read it from the network traffic.

New: Characters
- Eight characters, each with a face that blinks, smiles when you score, and winces when stunned: Pip the Panda, Bolt the Robot, Nova the Fox, Mochi the Cat, Captain Squish, Rex the Dino, Luna the Owl, and Ziggy the Frog.
- Pick your character when you create or join a room. Your choice is remembered on that device.
- Characters appear in the lobby, the player list, and every game.

Redesign
- A new theme: an aurora background, glass panels, a gradient headline, glowing game cards, and a framed game screen.
- A "Mind" filter for the two new games.
- Game text uses a system font fallback, so it still looks right when the web font can't load.

Fixed
- The quiz header sat under the game bar. It has moved down.

## 1.4.0
Netcode (guests were laggy because they waited for snapshots):
- Snapshots now go out 30 times a second, up from 15.
- Other players, the ball, and the keepers are interpolated about 100 ms behind real time, so motion is smooth instead of stepping.
- Your own movement is predicted on your screen the moment you press a key. The server acknowledges each input, and the browser corrects small differences without snapping.
- Input is sent on a steady 20 Hz timer, not once per frame, so slow frames no longer slow down your inputs.
- A player whose input stops for 0.4 seconds stops moving.

Feel (every game):
- Particles, score popups, and camera shake when something happens. Effects are read from the snapshots, so every game gets them.
- Synth sound effects, with a mute button in the game bar. Phones also vibrate on hits and goals.
- A match-over panel shows the winner and standings. The host can start a rematch from it.

Games:
- Pool: real eight-ball rules. Groups (solids and stripes) are assigned on the first legal pot. Pocketing your own group keeps your turn. Scratching is a foul. The eight ball wins only when your group is cleared, and loses if sunk early.
- Chess: a 5-minute clock per side. Running out of time loses.
- Paint Fight: territory scoring. Splatters paint floor cells in your colour, and the floor you hold scores points continuously. Tags still score.
- Car Racing: nitro pads along the lap, cars that bump each other and slow down, and live race positions.
- Fixed: chess left the origin square highlighted after each move.

## 1.3.0
Multiplayer:
- **Everyone can play.** The server now runs every match, not the host's browser. Guests were never blocked by a rule, but every move depended on the host's tab being awake and in front. Now the match keeps running if the host leaves, switches tabs, or loses connection.
- Players who leave are removed from the match. Players whose input stops for 0.4 seconds stop moving.
- Host controls (start, restart, change game) are unchanged, and a new host is chosen automatically when the host leaves.

Football:
- Drag back from the ball to kick. Drag length sets power.
- Walking into the ball dribbles it.
- Two keepers on the goal line block shots.
- The last player to touch the ball scores. First to 5, or the leader when the clock runs out.

Basketball:
- Drag back from the ball to shoot. Drag length sets distance. Aim near a hoop and the shot drops in.
- Shots arc and can bounce off the rim. Shots from far out are worth 3.
- First to 15, or the leader at 2:30.

Phones:
- Full-screen game view (⤢ button), with a hint to turn sideways.
- Larger on-screen controls and a readable score line.
- No sideways scrolling; decorative backgrounds are hidden on small screens.
- Two-finger touch works, so the pad and aiming can be used together.

Fixes:
- Chess left the origin square highlighted after each move.

## 1.2.0
Arena games rebuilt around clear rules:
- **Snowball Fight:** 90 second rounds. A hit stuns the target and knocks them back. Thrown snowballs and keyboard throws share one cooldown clock.
- **Paint Fight:** 90 second rounds. Tagging a rival slows them briefly and scores a point.
- **King of the Yard:** 90 second rounds. The zone jumps to a new spot every 12 seconds. Holding it alone pays double.
- **Mini 2D Football:** Walk into the ball to dribble. Kicks are no longer turn-gated. The last player to touch the ball scores a goal. First to 5, or the leader when the 2:30 clock ends.
- **Mini 2D Basketball:** Two hoops, shot at from anywhere. A slow enough ball that reaches a hoop scores for the last toucher. First to 5, or the leader at 2:30.
- The live clock appears in the score line for timed games.

Fixes:
- Pool crashed on its first frame (missing renderer). It now has a table, numbered balls, and an aim guide.
- The cue ball rendered dark blue.
- Broken Tiles could never end when players stood still. The floor now crumbles at random and speeds up.
- Archery had no end. It is now a 60 second round with a shot cooldown.
- Ties are reported as a draw instead of favouring the first player (Dots, Memory, Golf, Archery).
- Penalties keeper is always the player who is not shooting. A solo keeper tracks the ball.
- The status label no longer shows the previous winner after a restart.

## 1.1.0
- Hardened server: security headers, rate limits, clean shutdown, `/health` details.
- Restructured to `public/`. Added favicon and metadata.
- Added headless logic tests and an end-to-end smoke test (`npm test`).
