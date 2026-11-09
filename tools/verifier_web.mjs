// Test de fumée de l'application web, dans Chrome headless, en thème clair puis sombre.
//
// Parcourt : chaque page du cours et la vue imprimable, chaque niveau prêt et tous ses onglets,
// l'intérieur de chaque exercice et de chaque test. Signale :
//   - les erreurs JavaScript et les messages d'erreur de la console ;
//   - les fichiers introuvables (réponse HTTP 400 ou plus, image non chargée) ;
//   - les boutons et liens dont le contraste texte/fond est insuffisant (WCAG AA : 4,5,
//     ou 3 pour un grand texte) ;
//   - les liens internes du cours qui ne mènent à aucune page ou section.
//
// Usage : node tools/verifier_web.mjs        code de sortie 1 s'il y a un problème
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { ROOT, startChrome, startServer, wait } from './chrome.mjs';

const cours = (await import(pathToFileURL(join(ROOT, 'web', 'cours', 'contenu.js')))).default;
const { LEVELS } = await import(pathToFileURL(join(ROOT, 'web', 'js', 'config.js')));

const problems = [];
const report = (where, what) => problems.push(`${where} : ${what}`);

// --- liens internes du cours (sans navigateur) ---
const targets = new Set(['#cours', '#cours/imprimer', ...cours.pages.flatMap((p) => [`#cours/${p.id}`,
  ...p.sections.map((s) => `#cours/${p.id}/${s.id}`)])]);
for (const p of cours.pages) {
  for (const [, href] of p.html.matchAll(/href="(#[^"]*)"/g)) {
    if (!targets.has(href)) report(`cours/${p.id}`, `lien interne sans cible ${href}`);
  }
}

// Contraste des boutons et liens visibles ; fichiers non chargés. Exécuté dans la page.
const CHECK = `(async () => {
  const rgb = (s) => (s.match(/[\\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bg = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.length === 3 || c[3] > 0.5) return c.slice(0, 3); } return [255, 255, 255]; };
  const out = [];
  for (const el of document.querySelectorAll('button, a, .btn, .tab, .chip')) {
    if (!el.offsetParent) continue;
    const label = (el.textContent || '').trim() || el.getAttribute('aria-label') || el.getAttribute('title');
    if (!label) { out.push('élément sans texte ni aria-label : ' + el.outerHTML.slice(0, 80)); continue; }
    const cs = getComputedStyle(el);
    if (Number(cs.opacity) < 1 || el.disabled || el.classList.contains('soon')) continue;   // désactivé, volontairement estompé
    const fg = rgb(cs.color).slice(0, 3), b = bg(el);
    const [L1, L2] = [lum(fg), lum(b)].sort((x, y) => y - x);
    const ratio = (L1 + 0.05) / (L2 + 0.05);
    const size = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700;
    const min = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
    if (ratio < min) out.push('contraste ' + ratio.toFixed(2) + ' < ' + min + ' : « ' + label.slice(0, 40) + ' » (' + el.className + ')');
  }
  for (const img of document.images) {
    img.loading = 'eager';
    const ok = await fetch(img.src, { method: 'HEAD' }).then((r) => r.ok, () => false);
    if (!ok) out.push('image introuvable : ' + img.getAttribute('src'));
  }
  return out;
})()`;

const site = await startServer('web');
const chrome = await startChrome();
const { page } = chrome;
let current = '';
page.on((m) => {
  if (m.method === 'Runtime.exceptionThrown') report(current, `erreur JavaScript : ${m.params.exceptionDetails.exception?.description?.split('\n')[0] || m.params.exceptionDetails.text}`);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') report(current, `console : ${m.params.args.map((a) => a.value ?? a.description).join(' ')}`);
  if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) report(current, `HTTP ${m.params.response.status} ${m.params.response.url.replace(site.url, '')}`);
});
await page.send('Network.enable');
await page.send('Page.setLifecycleEventsEnabled', { enabled: true });
await page.send('Runtime.evaluate', { expression: 'window.confirm = () => true' });

let views = 0;
async function check(where) {
  views++;
  current = where;
  for (const p of await page.eval(CHECK)) report(where, p);
}
async function open(hash, settle = 500) {
  current = hash;
  // Même adresse à l'ancre près : pas de rechargement. On repart donc d'une page vide.
  await page.send('Page.navigate', { url: 'about:blank' });
  await page.goto(`${site.url}index.html${hash}`, settle);
  await page.eval('window.confirm = () => true; window.alert = () => {}');
}

try {
  for (const scheme of ['light', 'dark']) {
    await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
    const t = (h) => `${scheme} ${h}`;

    for (const h of ['#cours', ...cours.pages.map((p) => `#cours/${p.id}`)]) { await open(h); await check(t(h)); }
    await open('#cours/imprimer');
    await page.waitFor('document.body.dataset.coursPret === "1"', 30000);
    await check(t('#cours/imprimer'));

    for (const lvl of LEVELS.filter((l) => l.ready)) {
      const base = `#niveau-${lvl.n}`;
      await open(base);
      const tabs = await page.eval(`[...document.querySelectorAll('.tab')].map((b) => b.id.replace(/^tab-/, ''))`);
      for (const tab of tabs) {
        const hash = tab === 'tests' ? base : `${base}/${tab}`;
        await open(hash);
        await check(t(hash));
      }
      // intérieur de chaque test et de chaque exercice
      for (const [hash, what] of [[base, 'test'], [`${base}/exercices`, 'exercice']]) {
        await open(hash);
        const n = await page.eval(`document.querySelectorAll('.test-card .btn').length`);
        for (let i = 0; i < n; i++) {
          await open(hash, 300);
          await page.eval(`document.querySelectorAll('.test-card .btn')[${i}].click()`);
          await wait(400);
          await check(t(`${hash} ${what} ${i + 1}`));
        }
      }
    }
  }
} finally {
  chrome.stop();
  site.stop();
}

const unique = [...new Set(problems)];
if (unique.length) {
  console.log(`${unique.length} problème(s) sur ${views} vues :`);
  for (const p of unique) console.log(`  - ${p}`);
  process.exit(1);
}
console.log(`Aucun problème : ${views} vues vérifiées (cours, niveaux, onglets, exercices, tests ; thèmes clair et sombre).`);
