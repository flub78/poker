// Outils communs aux scripts qui pilotent l'application web dans Chrome headless
// (tools/pdf_cours.mjs, tools/verifier_web.mjs). Sans dépendance : Node 22+ (fetch, WebSocket).
//
//   const site = await startServer('web');        site.url = 'http://127.0.0.1:<port>/'
//   const chrome = await startChrome();           chrome.page : session DevTools de l'onglet
//   await chrome.page.goto(site.url + 'index.html#cours');
//   await chrome.page.eval('document.title');
//   chrome.stop(); site.stop();
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '..');
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function freePort() {
  return new Promise((ok, ko) => {
    const s = createServer();
    s.once('error', ko);
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => ok(port)); });
  });
}

async function until(test, ms, what) {
  const end = Date.now() + ms;
  for (;;) {
    try { const v = await test(); if (v) return v; } catch { /* pas encore prêt */ }
    if (Date.now() > end) throw new Error(`délai dépassé : ${what}`);
    await wait(100);
  }
}

// Serveur HTTP statique (python3 -m http.server) sur le dossier dir du dépôt.
export async function startServer(dir = 'web') {
  const port = await freePort();
  const proc = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', join(ROOT, dir)],
    { stdio: 'ignore' });
  const url = `http://127.0.0.1:${port}/`;
  await until(() => fetch(url).then((r) => r.ok), 10000, 'serveur HTTP');
  return { url, stop: () => proc.kill() };
}

const CHROMES = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];

// Chrome headless avec un profil neuf (pas de cache) ; renvoie une session DevTools sur l'onglet.
export async function startChrome() {
  const port = await freePort();
  const profile = mkdtempSync(join(tmpdir(), 'poker-chrome-'));
  let proc;
  for (const bin of [process.env.CHROME, ...CHROMES].filter(Boolean)) {
    proc = spawn(bin, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
    const failed = await Promise.race([new Promise((r) => proc.once('error', () => r(true))), wait(300).then(() => false)]);
    if (!failed) break;
    proc = null;
  }
  if (!proc) throw new Error('Chrome introuvable (variable CHROME pour indiquer le programme).');
  const list = await until(() => fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()), 15000, 'Chrome');
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, e) => { ws.addEventListener('open', r); ws.addEventListener('error', e); });

  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const { ok, ko } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) ko(new Error(`${m.error.message} ${m.error.data || ''}`)); else ok(m.result);
    } else if (m.method) listeners.forEach((f) => f(m));
  });
  const send = (method, params = {}) => new Promise((ok, ko) => {
    const i = ++id;
    pending.set(i, { ok, ko });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  await send('Runtime.enable');
  await send('Page.enable');

  const page = {
    send,
    on: (f) => listeners.push(f),
    async eval(expression) {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async goto(url, settle = 600) {
      await send('Page.navigate', { url });
      await until(() => this.eval('document.readyState === "complete"'), 15000, url);
      await wait(settle);
    },
    waitFor: (expression, ms = 15000) => until(() => page.eval(expression), ms, expression),
  };
  return {
    page,
    stop() { try { ws.close(); } catch { /* déjà fermé */ } proc.kill(); setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500); },
  };
}
