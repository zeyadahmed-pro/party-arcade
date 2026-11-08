// Runs the shared game rules on the server. public/game-runtime.js is loaded into a sandbox
// with a stub Phaser, so the same code that draws on the client also decides outcomes here.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class StubScene { constructor(key) { this.sys = { key }; } }
const sandbox = {
  window: {},
  Phaser: { Scene: StubScene, Game: class {}, AUTO: 0, Scale: { FIT: 0, CENTER_BOTH: 0 } },
  console
};
vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, 'public', 'game-runtime.js'), 'utf8'),
  sandbox,
  { filename: 'game-runtime.js' }
);

const Runtime = sandbox.window.GameRuntime;
if (!Runtime || !Runtime.createHeadless) throw new Error('game-runtime.js did not expose the headless scene');

module.exports = {
  createState: (gameId, players) => Runtime.createState(gameId, players),
  createScene: payload => Runtime.createHeadless(payload),
  characters: Runtime.characters
};
