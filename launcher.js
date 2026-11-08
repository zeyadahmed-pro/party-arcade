const http = require('http');
const net = require('net');
const { spawn } = require('child_process');
const path = require('path');

const root = __dirname;
const ports = Array.from({ length: 11 }, (_, i) => 3000 + i);

function getHealth(port) {
  return new Promise(resolve => {
    const req = http.get({ hostname: '127.0.0.1', port, path: '/health', timeout: 800 }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

function findFreePort(port) {
  return new Promise(resolve => {
    const probe = net.createServer();
    probe.once('error', () => resolve(null));
    probe.listen(port, '0.0.0.0', () => probe.close(() => resolve(port)));
  });
}

function openBrowser(url) {
  const command = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
}

async function main() {
  let port;
  for (const candidate of ports) {
    const health = await getHealth(candidate);
    if (health?.app === 'party-arcade') { port = candidate; break; }
  }

  if (!port) {
    for (const candidate of ports) {
      port = await findFreePort(candidate);
      if (port) break;
    }
  }
  if (!port) throw new Error('Ports 3000–3010 are busy. Close an app using one of them, then launch again.');

  if (!(await getHealth(port))?.app) {
    const server = spawn(process.execPath, [path.join(root, 'server.js')], {
      cwd: root,
      env: { ...process.env, PORT: String(port) },
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    server.unref();
    let ready = false;
    for (let i = 0; i < 40; i++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      if ((await getHealth(port))?.app === 'party-arcade') { ready = true; break; }
    }
    if (!ready) throw new Error('The game server did not start. Run npm install, then launch again.');
  }

  const url = `http://localhost:${port}`;
  console.log(`Party Arcade is ready: ${url}`);
  openBrowser(url);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
