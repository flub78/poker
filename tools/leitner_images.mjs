// Images des questions Leitner : une image PNG par question qui a des cartes.
//
//   node tools/leitner_images.mjs [fichier.md …]      (défaut : doc/leitner/questions*.md)
//
// Lit la colonne « Cartes » des tableaux de questions (voir les conventions en tête du fichier
// Markdown) et compose l'image avec les cartes de web/cartes/, dans Chrome headless.
// Sortie : doc/leitner/images/<ID>.png, plus index.html pour relire la banque d'un coup d'œil.
// Poids : capture à l'échelle 1,5, puis palette de 128 couleurs (PNG8) par ImageMagick
// (`convert`), environ 3 fois plus léger ; sans ImageMagick, les PNG restent en couleurs pleines.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { ROOT, startChrome, startServer } from './chrome.mjs';

const DIR = join(ROOT, 'doc/leitner');
const OUT = join(DIR, 'images');
const SCALE = 1.5;
const COLORS = 128;
const STREET = { 3: 'flop', 4: 'turn', 5: 'river' };

// ---------- lecture du Markdown ----------

const cells = (line) => line.split('|').slice(1, -1).map((c) => c.trim());

export function questions(markdown) {
  const out = [];
  let head = null;
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('|')) { head = null; continue; }
    const c = cells(line);
    if (c[0] === 'ID') { head = c; continue; }
    if (!head || /^-+$/.test(c[0])) continue;
    const row = Object.fromEntries(head.map((h, i) => [h, c[i] ?? '']));
    if (row.Cartes) out.push({ id: row.ID, cartes: row.Cartes, question: row.Question });
  }
  return out;
}

// « UTG · Main `AS JD` · Tableau `KH 8C 3S` » → { banner: ['UTG'], rows: [{ label, cards }] }
export function scene(cartes) {
  const banner = [];
  const rows = [];
  for (const part of cartes.split('·').map((p) => p.trim())) {
    const m = part.match(/^(Main|Tableau|A|B|Vous|Adversaire|Carte)?\s*`([^`]+)`$/);
    if (!m) { banner.push(part); continue; }
    const cards = m[2].split(/\s+/);
    if (!cards.every((c) => /^[2-9TJQKA][SHDC]$/.test(c))) throw new Error(`carte inconnue : ${m[2]}`);
    const who = m[1];
    const label = who === 'Tableau' ? `Tableau — ${STREET[cards.length] ?? `${cards.length} cartes`}`
      : who === 'Main' || who === 'Vous' ? 'Vos cartes'
      : who === 'Adversaire' ? 'Adversaire'
      : who === 'Carte' ? (cards.length > 1 ? 'Cartes candidates' : 'Carte candidate')
      : who ? `Main ${who}` : '';
    rows.push({ who: who || 'Main', label, cards });
  }
  // Ordre d'affichage : bandeau, adversaire, tableau, vos cartes (comme à la table).
  const rank = { Adversaire: 0, Tableau: 1, Carte: 2, A: 3, B: 4, Main: 5, Vous: 5 };
  rows.sort((a, b) => rank[a.who] - rank[b.who]);
  return { banner, rows };
}

// ---------- composition ----------

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function html({ banner, rows }) {
  const body = rows.map((r) => `
    <div class="row${r.who === 'Carte' ? ' candidate' : ''}">
      ${r.label ? `<div class="label">${esc(r.label)}</div>` : ''}
      <div class="cards">${r.cards.map((c) => `<img src="cartes/${c}.svg" alt="${c}">`).join('')}</div>
    </div>`).join('');
  return `<div id="scene">${banner.length ? `<div class="banner">${esc(banner.join(' · '))}</div>` : ''}${body}</div>`;
}

const STYLE = `
  html, body { margin: 0; background: #fff; }
  #scene { display: inline-flex; flex-direction: column; align-items: center; gap: 14px;
    padding: 18px 24px 22px; background: #1f6b45; border-radius: 14px;
    font: 600 17px/1.2 system-ui, 'DejaVu Sans', sans-serif; color: #fff; }
  .banner { background: #fff; color: #173d2a; padding: 6px 14px; border-radius: 999px; }
  .row { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .label { font-size: 14px; letter-spacing: .04em; text-transform: uppercase; opacity: .9; }
  .cards { display: flex; gap: 8px; }
  .cards img { width: 80px; height: 112px; filter: drop-shadow(0 2px 2px rgba(0,0,0,.35)); }
  .candidate .label { color: #ffd54a; }
  .candidate img { outline: 3px dashed #ffd54a; outline-offset: 4px; border-radius: 6px; }
`;

// Palette réduite, sur place ; renvoie false si ImageMagick manque.
function shrink(file) {
  try {
    execFileSync('convert', [file, '-dither', 'None', '-colors', String(COLORS), `PNG8:${file}`]);
    return true;
  } catch { return false; }
}

// ---------- programme ----------

const files = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync(DIR).filter((f) => /^questions.*\.md$/.test(f)).map((f) => join(DIR, f));
const list = files.flatMap((f) => questions(readFileSync(f, 'utf8')).map((q) => ({ ...q, file: basename(f) })));
mkdirSync(OUT, { recursive: true });

const site = await startServer('web');
const chrome = await startChrome();
try {
  const { page } = chrome;
  await page.send('Emulation.setDeviceMetricsOverride', { width: 900, height: 900, deviceScaleFactor: SCALE, mobile: false });
  await page.goto(site.url);
  await page.eval(`document.head.innerHTML = ${JSON.stringify(`<style>${STYLE}</style>`)}; true`);
  for (const q of list) {
    await page.eval(`document.body.innerHTML = ${JSON.stringify(html(scene(q.cartes)))};
      Promise.all([...document.images].map((i) => i.decode())).then(() => true)`);
    const r = await page.eval(`(() => { const b = document.getElementById('scene').getBoundingClientRect();
      return { x: b.x, y: b.y, width: b.width, height: b.height }; })()`);
    const shot = await page.send('Page.captureScreenshot', { format: 'png', clip: { ...r, scale: 1 } });
    const file = join(OUT, `${q.id}.png`);
    writeFileSync(file, Buffer.from(shot.data, 'base64'));
    if (!shrink(file) && q === list[0]) console.warn('ImageMagick (convert) absent : PNG non réduits.');
  }
} finally {
  chrome.stop();
  site.stop();
}

// Planche de relecture.
const index = `<!doctype html><meta charset="utf-8"><title>Images Leitner</title>
<style>body{font:15px system-ui,sans-serif;margin:24px;background:#f4f4f2}figure{display:inline-block;margin:0 16px 24px 0;vertical-align:top;max-width:420px}
img{max-width:420px;display:block}figcaption{margin-top:6px}</style>
${list.map((q) => `<figure><img src="${q.id}.png" alt="${q.id}"><figcaption><b>${q.id}</b> — ${esc(q.question.replace(/`/g, ''))}</figcaption></figure>`).join('\n')}`;
writeFileSync(join(OUT, 'index.html'), index);
console.log(`${list.length} images écrites dans ${OUT.replace(ROOT + '/', '')}/`);
