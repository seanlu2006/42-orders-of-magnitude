// Renders the images in docs/ with headless Chrome, driven over the DevTools protocol.
//
//   node tools/build.mjs && node tools/capture.mjs
//
// Writes .capture/ (raw PNGs, git-ignored). tools/make-media.sh turns them into docs/.
// Uses the page's ?shot mode, which hides the interface except the stop title and the 10ⁿ readout.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.capture');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const profile = fs.mkdtempSync(path.join(os.tmpdir(), '42-capture-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });

async function pageSocket() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome did not start');
}

const ws = new WebSocket(await pageSocket());
await new Promise(r => (ws.onopen = r));
let nextId = 0;
const pending = new Map(), listeners = new Set();
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
  else if (m.method) for (const l of listeners) l(m);
};
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++nextId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const once = name => new Promise(r => { const l = m => { if (m.method === name) { listeners.delete(l); r(m.params); } }; listeners.add(l); });
async function js(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function open(query, width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: pathToFileURL(path.join(root, 'index.html')).href + query });
  await loaded;
  for (let i = 0; i < 150; i++) { if (await js('window.__ready === true')) return; await sleep(100); }
  throw new Error('page never became ready');
}
async function shot(file) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(out, file), Buffer.from(data, 'base64'));
}
// z is the page's camera: log10 of the view width in metres
const setZ = v => js(`(z = zT = ${v}, flight = null, tour = null, new Promise(r => setTimeout(r, 380)))`);

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'frames'), { recursive: true });
await send('Page.enable');
await send('Runtime.enable');

// Link preview card: the English title screen over the cosmic web (captured large, scaled to 1200×630 later)
await open('?lang=en', 1600, 840);
await sleep(1500);
await shot('og.png');

// Stills for the README grid
const stills = [27.05, 21.1, 12.75, 7.3, 0.45, -1.75, -4.75, -8.25, -14.8];
await open('?lang=en&shot', 960, 600);
for (const [i, v] of stills.entries()) { await setZ(v); await shot(`still-${i}.png`); }

// Animation: ease from stop to stop, pausing briefly at each one
const stops = await js('STOPS.map(s => s.z)');
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const zs = [];
stops.forEach((v, i) => {
  zs.push(v, v);
  if (i < stops.length - 1) for (let k = 1; k <= 4; k++) zs.push(v + (stops[i + 1] - v) * ease(k / 5));
});
await open('?lang=en&shot', 640, 400);
for (const [i, v] of zs.entries()) { await setZ(v); await shot(`frames/f${String(i).padStart(3, '0')}.png`); }

console.log(`og.png, ${stills.length} stills, ${zs.length} frames → ${path.relative(root, out)}/`);
ws.close();
const exited = new Promise(r => chrome.once('exit', r));
chrome.kill();
await exited;
fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
