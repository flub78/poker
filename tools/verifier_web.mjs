// Test de fumée de l'application web, dans Chrome headless, en thème clair puis sombre.
//
// Parcourt : chaque page du cours et la vue imprimable, le simulateur, chaque niveau prêt et tous ses onglets
//   (dont une séance entière de Réflexes),
// l'intérieur de chaque exercice et de chaque test. Signale :
//   - les erreurs JavaScript et les messages d'erreur de la console ;
//   - les fichiers introuvables (réponse HTTP 400 ou plus, image non chargée) ;
//   - les boutons et liens dont le contraste texte/fond est insuffisant (WCAG AA : 4,5,
//     ou 3 pour un grand texte) ;
//   - les liens internes du cours qui ne mènent à aucune page ou section ;
//   - les textes « null », « undefined » ou « NaN » affichés (valeur vide écrite telle quelle) ;
//   - le code de transfert (page Profil) : aller-retour entre deux navigateurs (profils distincts),
//     fusion sans doublon, prénom repris, lien rouvert sans effet, code abîmé signalé.
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
  // « null » ou « undefined » affichés : une valeur vide passée à append (natif) au lieu de h()
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (/\\b(null|undefined|NaN)\\b/.test(n.textContent) && n.parentElement?.offsetParent) out.push('texte suspect : « ' + n.textContent.trim().slice(0, 60) + ' »');
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
    await open('#profil');
    await page.eval(`[...document.querySelectorAll('button')].find((b) => b.textContent === 'Créer le lien')?.click()`);
    await wait(400);
    await check(t('#profil'));

    // Simulateur : la table au tour de l'humain, l'indice, puis la fin d'une main.
    await open('#simulateur');
    await page.eval(`localStorage.setItem('poker.simulateur.v1', JSON.stringify({ vitesse: 'rapide', aide: 'indice' }))`);
    await open('#simulateur');
    await page.waitFor(`!!document.querySelector('.sim-buttons, #sim-next')`, 20000);
    await check(t('#simulateur'));
    await page.eval(`[...document.querySelectorAll('.sim-buttons .btn')].find((b) => b.textContent.startsWith('Indice'))?.click()`);
    await wait(200);
    await check(t('#simulateur indice'));
    for (let i = 0; i < 60 && !(await page.eval(`!!document.getElementById('sim-next')`)); i++) {
      await page.eval(`[...document.querySelectorAll('.sim-buttons .btn')].find((b) => b.textContent.startsWith('Se coucher'))?.click()`);
      await wait(300);
    }
    await check(t('#simulateur fin de main'));
    await page.eval(`[...document.querySelectorAll('.link-btn')].find((b) => b.textContent.startsWith('Évaluer'))?.click()`);
    await wait(200);
    await check(t('#simulateur évaluation'));
    // Mode Mentor : un coup hors des règles (suivre plutôt que relancer ou se coucher) ouvre la fenêtre d'analyse.
    await page.eval(`localStorage.setItem('poker.simulateur.v1', JSON.stringify({ vitesse: 'rapide', aide: 'mentor' }))`);
    await open('#simulateur');
    let mentor = false;
    for (let i = 0; i < 200 && !mentor; i++) {
      mentor = await page.eval(`(() => { if (document.querySelector('dialog[open]')) return true;
        const n = document.getElementById('sim-next'); if (n) { n.click(); return false; }
        const b = [...document.querySelectorAll('.sim-buttons .btn')];
        (b.find((x) => x.textContent.startsWith('Suivre')) || b.find((x) => x.textContent.startsWith('Checker')))?.click();
        return !!document.querySelector('dialog[open]'); })()`);
      await wait(200);
    }
    if (mentor) await check(t('#simulateur mentor'));
    else report(t('#simulateur mentor'), 'la fenêtre du mentor ne s\'est pas ouverte');

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
      // Réflexes : une séance entière (question, correction, reprise, bilan), puis on efface.
      await open(`${base}/reflexes`, 800);
      if (await page.eval(`[...document.querySelectorAll('button')].some((b) => b.textContent === 'Commencer la séance')`)) {
        await page.eval(`[...document.querySelectorAll('button')].find((b) => b.textContent === 'Commencer la séance').click()`);
        // Faux une fois sur deux au premier passage (reprise des erreurs) ; en reprise, la bonne
        // réponse lue dans la correction précédente. Contrôle complet des 3 premières questions.
        await page.eval('window.__bonnes = {}');
        let k = 0;
        for (; k < 80 && await page.eval(`!!document.querySelector('.leitner-question')`); k++) {
          await wait(120);
          if (k < 3) await check(t(`${base}/reflexes question ${k + 1}`));
          await page.eval(`(() => {
            // énoncé + image : des questions différentes peuvent avoir le même énoncé
            const q = document.querySelector('.leitner-question').textContent + (document.querySelector('.leitner-figure img')?.getAttribute('src') || '');
            const known = (window.__bonnes ??= {})[q];   // vidé par le rechargement (interruption)
            const zone = document.querySelector('.leitner-answer');
            const see = [...zone.querySelectorAll('button')].find((b) => b.textContent === 'Voir la réponse');
            if (see) see.click();
            const num = zone.querySelector('.leitner-number');
            if (num) { num.value = known ?? (${k % 2} ? '123456' : '1'); zone.querySelector('.btn').click(); }
            else {
              const c = [...zone.querySelectorAll('.choice-btn')];
              (c.find((b) => b.textContent === known) || c[${k % 2} ? c.length - 1 : 0]).click();
            }
            const right = zone.querySelector('.choice-btn.right')?.textContent
              ?? /Réponse : ([−\\d,]+)/.exec(document.querySelector('.leitner-stage .feedback')?.textContent || '')?.[1]?.replace('−', '-');
            if (right) window.__bonnes[q] = right;
          })()`);
          await wait(80);
          if (k < 3) await check(t(`${base}/reflexes correction ${k + 1}`));
          if (k === 2) {
            // Interruption : on recharge la page, la séance doit se reprendre là où elle en était.
            const before = await page.eval(`JSON.parse(localStorage.getItem('poker.reflexes.v1')).suites['${lvl.n}'].current.todo.length`);
            await open(`${base}/reflexes`, 800);
            await check(t(`${base}/reflexes séance interrompue`));
            const resume = await page.eval(`(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent === 'Reprendre la séance');
              if (b) b.click(); return !!b; })()`);
            if (!resume) { report(t(`${base}/reflexes`), 'pas de bouton « Reprendre la séance » après une interruption'); break; }
            await wait(150);
            const left = await page.eval(`JSON.parse(localStorage.getItem('poker.reflexes.v1')).suites['${lvl.n}'].current.todo.length`);
            if (left !== before) report(t(`${base}/reflexes`), `reprise : ${before} questions restantes avant, ${left} après`);
            continue;
          }
          await page.eval(`[...document.querySelectorAll('.btn.primary')].find((b) => /Suivant|Terminer/.test(b.textContent)).click()`);
        }
        await wait(150);
        if (!await page.eval(`/terminée/.test(document.querySelector('.exercise-head h2')?.textContent || '')`)) {
          report(t(`${base}/reflexes`), `séance non terminée après ${k} réponses`);
        }
        await check(t(`${base}/reflexes bilan`));
        await page.eval(`localStorage.removeItem('poker.reflexes.v1')`);
      }
    }
  }
  await checkTransfer();
} finally {
  chrome.stop();
  site.stop();
}

// Aller-retour du code de transfert entre deux profils de navigateur.
async function checkTransfer() {
  views++;
  current = 'transfert';
  const at = (days, seed, passed) => ({ date: new Date(Date.now() - days * 86400000).toISOString(), seed, score: 9, total: 10, passed, seconds: 42 });
  const KEY = 'poker.niveau1.v1';
  const count = (pg) => pg.eval(`Object.values(JSON.parse(localStorage.getItem('${KEY}') || '{"tests":{}}').tests).reduce((s, t) => s + t.attempts.length, 0)`);
  // A : 3 tentatives ; B : 1 tentative propre + 1 commune avec A
  const common = at(5, 111, true);
  await open('#niveau-1');
  await page.eval(`localStorage.setItem('${KEY}', JSON.stringify({ version: 1, player: 'Alice', tests: {
    deroulement: { attempts: ${JSON.stringify([at(10, 100, true), common])} }, nuts: { attempts: ${JSON.stringify([at(1, 222, false)])} } } }))`);
  const link = await page.eval(`import('./js/profil.js').then(async (m) => m.transferLink((await m.createCode()).code))`);

  const other = await startChrome();
  try {
    const b = other.page;
    await b.goto(`${site.url}index.html#niveau-1`);
    await b.eval(`localStorage.setItem('${KEY}', JSON.stringify({ version: 1, player: '', tests: {
      deroulement: { attempts: ${JSON.stringify([common])} }, classement: { attempts: ${JSON.stringify([at(2, 333, true)])} } } }))`);
    await b.goto('about:blank', 100);
    await b.goto(link.replace(/^https?:\/\/[^/]+\//, site.url), 800);
    const button = await b.waitFor(`[...document.querySelectorAll('.transfer-receive button')].map((x) => x.textContent).join('|')`, 5000).catch(() => '');
    if (!/Ajouter 2 résultats/.test(button)) report('transfert', `bouton attendu « Ajouter 2 résultats », trouvé « ${button} »`);
    await b.eval(`document.querySelector('.transfer-receive button').click()`);
    await wait(500);
    const n = await count(b);
    if (n !== 4) report('transfert', `4 tentatives attendues après fusion, ${n} trouvées`);
    const player = await b.eval(`localStorage.getItem('poker.joueur')`);
    if (player !== 'Alice') report('transfert', `prénom non repris (« ${player} »)`);
    const profileBtn = await b.eval(`document.querySelector('.profile-link')?.textContent`);
    if (profileBtn !== 'Alice') report('transfert', `bouton Profil : « Alice » attendu, « ${profileBtn} » trouvé`);
    if (/transfert\/./.test(await b.eval('location.hash'))) report('transfert', 'le code reste dans la barre d\'adresse');
    // rouvrir le même lien : rien de nouveau
    await b.goto('about:blank', 100);
    await b.goto(link.replace(/^https?:\/\/[^/]+\//, site.url), 800);
    const again = await b.waitFor(`document.querySelector('.transfer-receive')?.textContent.includes('Rien de nouveau')`, 5000).catch(() => false);
    if (!again) report('transfert', 'un lien rouvert devrait annoncer « Rien de nouveau »');
    if (await count(b) !== 4) report('transfert', 'un lien rouvert a modifié les résultats');
    // code abîmé
    await b.goto('about:blank', 100);
    await b.goto(`${site.url}index.html#transfert/1.abc`, 600);
    if (!await b.eval(`document.querySelector('.transfer-receive.ko') !== null`)) report('transfert', 'un code abîmé devrait être signalé');
  } finally {
    other.stop();
  }
  await open('#niveau-1');
  await page.eval(`localStorage.clear()`);
}

const unique = [...new Set(problems)];
if (unique.length) {
  console.log(`${unique.length} problème(s) sur ${views} vues :`);
  for (const p of unique) console.log(`  - ${p}`);
  process.exit(1);
}
console.log(`Aucun problème : ${views} vues vérifiées (cours, simulateur, niveaux, onglets, exercices, tests ; thèmes clair et sombre).`);
