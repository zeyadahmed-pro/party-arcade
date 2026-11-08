const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const engine = require('./engine');

const PORT = Number(process.env.PORT) || 3000;
const MAX_PLAYERS = 8;
const MAX_CHAT_HISTORY = 80;
const MAX_CHAT_LENGTH = 220;
const TICK_HZ = 30;            // simulation rate
const BROADCAST_EVERY = 1;     // a snapshot every tick, at 30 Hz
const PLAYER_COLORS = ['#8b7bff', '#ff7395', '#61d7ac', '#ffc765', '#66baff', '#f187e6', '#b6e46a', '#ff976e'];
const GAME_IDS = new Set([
  'golf', 'snowball', 'football', 'basketball', 'chess', 'pool', 'broken-tiles', 'racing',
  'dots-boxes', 'king-yard', 'memory', 'paint-fight', 'mini-golf', 'penalties', 'archery',
  'brain-rush', 'mind-games'
]);
// Characters come from the shared runtime, so the lobby and the games always agree.
const safeCharacter = value => (Object.prototype.hasOwnProperty.call(engine.characters, value) ? value : 'panda');
// The quiz answer key never leaves the server.
const publicState = state => { if (!state) return state; const { qSecret, ...rest } = state; return rest; };
const ACTION_NUMBERS = ['x', 'y', 'dx', 'dy', 'power', 'angle', 'value', 'index'];

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e6, pingInterval: 20000, pingTimeout: 25000 });
const rooms = new Map();

app.use('/vendor/phaser', express.static(path.join(__dirname, 'node_modules/phaser/dist'), { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));
app.get('/health', (_req, res) => {
  res.json({ ok: true, app: 'party-arcade', rooms: rooms.size, players: countPlayers(), playing: countPlaying(), uptime: Math.round(process.uptime()) });
});
app.use((_req, res) => res.status(404).type('text/plain').send('Not found'));

function createLimiter(max, windowMs) {
  let hits = [];
  return () => {
    const now = Date.now();
    hits = hits.filter(t => now - t < windowMs);
    if (hits.length >= max) return false;
    hits.push(now);
    return true;
  };
}

const safeName = value => String(value || 'Player').trim().replace(/[<>\u0000-\u001f]/g, '').slice(0, 18) || 'Player';
const safeGame = value => (GAME_IDS.has(String(value)) ? String(value) : 'golf');

function roomCode() {
  for (let i = 0; i < 200; i++) {
    const code = String(100 + Math.floor(Math.random() * 900));
    if (!rooms.has(code)) return code;
  }
  return null;
}
function countPlayers() { let n = 0; for (const r of rooms.values()) n += r.players.size; return n; }
function countPlaying() { let n = 0; for (const r of rooms.values()) if (r.started) n++; return n; }

// Only known fields with finite numbers pass through to the rules.
function cleanAction(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.type !== 'string') return null;
  const out = { type: raw.type.slice(0, 16) };
  for (const key of ACTION_NUMBERS) {
    if (raw[key] === undefined) continue;
    const n = Number(raw[key]);
    if (!Number.isFinite(n)) return null;
    out[key] = n;
  }
  return out;
}
function cleanInput(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const aim = raw.aim && Number.isFinite(raw.aim.x) && Number.isFinite(raw.aim.y) ? { x: raw.aim.x, y: raw.aim.y } : null;
  const seq = Number.isFinite(raw.seq) ? Math.max(0, Math.floor(raw.seq)) : 0;
  return { keys: raw.keys && typeof raw.keys === 'object' ? raw.keys : {}, aim, fire: !!raw.fire, seq, at: Date.now() };
}

const publicRoom = room => ({
  code: room.code,
  game: room.game,
  hostId: room.hostId,
  started: room.started,
  players: [...room.players.values()]
});
const broadcastRoom = room => io.to(room.code).emit('room:update', publicRoom(room));

io.on('connection', socket => {
  const limits = {
    chat: createLimiter(6, 4000),
    action: createLimiter(40, 1000),
    control: createLimiter(10, 2000)
  };

  socket.on('room:create', (payload = {}, reply = () => {}) => {
    if (!limits.control()) return reply({ error: 'Slow down a little and try again.' });
    const code = roomCode();
    if (!code) return reply({ error: 'All room codes are in use right now. Try again in a moment.' });
    leaveRoom(socket);
    const player = { id: socket.id, name: safeName(payload.name), character: safeCharacter(payload.character), color: PLAYER_COLORS[0], joinedAt: Date.now() };
    const room = { code, game: safeGame(payload.game), hostId: socket.id, started: false, players: new Map([[socket.id, player]]), state: null, sim: null, chat: [] };
    rooms.set(code, room);
    socket.join(code);
    socket.data.room = code;
    reply({ room: publicRoom(room), chat: room.chat, state: publicState(room.state) });
    broadcastRoom(room);
  });

  socket.on('room:join', (payload = {}, reply = () => {}) => {
    if (!limits.control()) return reply({ error: 'Slow down a little and try again.' });
    const code = String(payload.code || '').replace(/\D/g, '').slice(0, 3);
    const room = rooms.get(code);
    if (!room) return reply({ error: 'That room code was not found. Check the code and try again.' });
    if (room.started) return reply({ error: 'This game is already in progress. Ask the host to restart the room.' });
    if (room.game === 'chess' && room.players.size >= 2) return reply({ error: 'Chess is a two player game, and this room already has both seats.' });
    if (room.players.size >= MAX_PLAYERS) return reply({ error: `This room is full (${MAX_PLAYERS} players max).` });
    leaveRoom(socket);
    const taken = new Set([...room.players.values()].map(p => p.color));
    const color = PLAYER_COLORS.find(c => !taken.has(c)) || PLAYER_COLORS[room.players.size % PLAYER_COLORS.length];
    const player = { id: socket.id, name: safeName(payload.name), character: safeCharacter(payload.character), color, joinedAt: Date.now() };
    room.players.set(socket.id, player);
    socket.join(code);
    socket.data.room = code;
    reply({ room: publicRoom(room), chat: room.chat, state: publicState(room.state) });
    broadcastRoom(room);
    io.to(code).emit('system:message', `${player.name} joined the room`);
  });

  socket.on('room:leave', () => leaveRoom(socket));

  socket.on('room:game', (gameId, reply = () => {}) => {
    const room = rooms.get(socket.data.room);
    if (!room || room.hostId !== socket.id) return reply({ error: 'Only the host can change the game.' });
    room.game = safeGame(gameId);
    room.started = false;
    room.state = null;
    room.sim = null;
    broadcastRoom(room);
    reply({ ok: true });
  });

  // The server builds the match, so the host cannot send a fake state.
  socket.on('game:start', (_payload, reply = () => {}) => {
    const room = rooms.get(socket.data.room);
    if (!room || room.hostId !== socket.id) return reply({ error: 'Only the host can start the game.' });
    if (room.game === 'chess' && room.players.size !== 2) return reply({ error: 'Chess needs exactly two players. Invite one friend before starting.' });
    const state = engine.createState(room.game, [...room.players.values()]);
    room.sim = engine.createScene({ room: publicRoom(room), state });
    room.started = true;
    room.state = room.sim.state;
    io.to(room.code).emit('game:started', publicState(room.state));
    broadcastRoom(room);
    reply({ ok: true });
  });

  socket.on('game:input', input => {
    const room = rooms.get(socket.data.room);
    if (!room || !room.sim) return;
    const clean = cleanInput(input);
    if (clean) room.sim.inputMap[socket.id] = clean;
  });

  socket.on('game:action', raw => {
    const room = rooms.get(socket.data.room);
    if (!room || !room.sim) return;
    const action = cleanAction(raw);
    if (!action || !limits.action()) return;
    room.sim.applyAction(socket.id, action);
  });

  socket.on('chat:send', raw => {
    const room = rooms.get(socket.data.room);
    if (!room) return;
    if (!limits.chat()) return socket.emit('system:message', 'You are sending messages too fast.');
    const text = String(raw || '').trim().slice(0, MAX_CHAT_LENGTH);
    if (!text) return;
    const item = { id: `${Date.now()}-${socket.id}`, player: room.players.get(socket.id)?.name || 'Player', text, time: Date.now() };
    room.chat.push(item);
    if (room.chat.length > MAX_CHAT_HISTORY) room.chat.shift();
    io.to(room.code).emit('chat:message', item);
  });

  socket.on('disconnect', () => leaveRoom(socket));
});

// The match keeps running no matter who is connected. Players who leave are removed from it.
function leaveRoom(socket) {
  const code = socket.data.room;
  if (!code) return;
  const room = rooms.get(code);
  socket.data.room = null;
  socket.leave(code);
  if (!room) return;
  const player = room.players.get(socket.id);
  room.players.delete(socket.id);
  if (!room.players.size) { rooms.delete(code); return; }
  if (room.sim) {
    room.sim.inputMap[socket.id] = undefined;
    room.sim.setRoom(publicRoom(room));
  }
  if (room.hostId === socket.id) {
    room.hostId = room.players.keys().next().value;
    io.to(code).emit('system:message', 'A new host has been chosen. Only the host can change or restart the game.');
  }
  if (player) io.to(code).emit('system:message', `${player.name} left the room`);
  broadcastRoom(room);
}

// Simulation loop: each started room advances at a fixed rate, and snapshots go out at 15 Hz.
let lastTick = Date.now();
let tickCount = 0;
const loop = setInterval(() => {
  const now = Date.now();
  const dt = Math.min(0.05, (now - lastTick) / 1000);
  lastTick = now;
  tickCount++;
  for (const room of rooms.values()) {
    if (!room.started || !room.sim) continue;
    // A player whose client has gone quiet (tab asleep, connection lost) stops moving.
    for (const [id, input] of Object.entries(room.sim.inputMap)) {
      if (!input || now - (input.at || 0) > 400) room.sim.inputMap[id] = input ? { keys: {}, aim: input.aim, fire: false, seq: input.seq, at: input.at } : input;
    }
    room.sim.simulate(dt, now);
    if (tickCount % BROADCAST_EVERY === 0) {
      // ack: the last input sequence the server has applied for each player, so the client can reconcile its prediction
      const ack = {};
      for (const [id, input] of Object.entries(room.sim.inputMap)) if (input) ack[id] = input.seq || 0;
      io.to(room.code).emit('game:snap', { s: publicState(room.sim.state), ack, t: now });
    }
  }
}, 1000 / TICK_HZ);

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${PORT} is already in use. Close the other app or set a different PORT.` : error);
  process.exit(1);
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => console.log(`Party Arcade listening on port ${PORT}`));
  const shutdown = signal => {
    console.log(`${signal} received. Closing connections.`);
    clearInterval(loop);
    setTimeout(() => process.exit(0), 5000).unref();
    io.close(() => server.close(() => process.exit(0)));
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { app, server, io, rooms };
