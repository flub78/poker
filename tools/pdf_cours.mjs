// Fabrique le PDF du tutoriel en imprimant le cours de l'application (#cours/imprimer).
//
// Le site est la seule version de référence ; le PDF n'en est qu'une impression :
//   - A4, en-tête (titre du cours) et pied de page « Page X sur N » ;
//   - chaque grande partie commence sur une nouvelle page (feuille d'impression, css/style.css) ;
//   - table des matières en page 2 avec liens cliquables et numéros de page ;
//   - signets PDF tirés des titres (generateDocumentOutline).
// Les numéros de page s'obtiennent en deux passes : une première impression, lue avec pdftotext
// pour trouver la page de chaque titre, puis l'impression finale avec ces numéros.
//
// Usage : node tools/pdf_cours.mjs [sortie.pdf]      (défaut : doc/initiation-poker-tutoriel.pdf)
// Dépendances : Node 22+, Chrome ou Chromium, python3, pdftotext (poppler-utils).
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { ROOT, startChrome, startServer } from './chrome.mjs';

const OUT = resolve(process.argv[2] || join(ROOT, 'doc', 'initiation-poker-tutoriel.pdf'));
const norm = (s) => s.normalize('NFC').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

const site = await startServer('web');
const chrome = await startChrome();
const tmp = mkdtempSync(join(tmpdir(), 'poker-pdf-'));
try {
  const { page } = chrome;
  await page.goto(`${site.url}index.html#cours/imprimer`);
  await page.waitFor('document.body.dataset.coursPret === "1"', 30000);

  const title = await page.eval('document.querySelector(".print-title").textContent');
  // Titres dans l'ordre du document : parties (h2) et sections (h3).
  const heads = await page.eval(`[...document.querySelectorAll('.print-part > h2, .print-part h3')]
    .map((e) => ({ id: e.id, level: e.tagName === 'H2' ? 2 : 3, text: e.textContent }))`);

  const print = async () => {
    const r = await page.send('Page.printToPDF', {
      paperWidth: 8.27, paperHeight: 11.69,                 // A4, en pouces
      marginTop: 0.75, marginBottom: 0.7, marginLeft: 0.75, marginRight: 0.75,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font: 8px sans-serif; color: #6b6b6b; width: 100%; padding: 0 0.75in;">${esc(title)}</div>`,
      footerTemplate: '<div style="font: 8px sans-serif; color: #6b6b6b; width: 100%; padding: 0 0.75in; text-align: right;">'
        + 'Page <span class="pageNumber"></span> sur <span class="totalPages"></span></div>',
      generateDocumentOutline: true,
    });
    return Buffer.from(r.data, 'base64');
  };

  // --- passe 1 : où tombe chaque titre ? ---
  const draft = join(tmp, 'brouillon.pdf');
  writeFileSync(draft, await print());
  const txt = spawnSync('pdftotext', ['-enc', 'UTF-8', draft, '-'], { encoding: 'utf8' });
  if (txt.status !== 0) throw new Error(`pdftotext : ${txt.stderr || 'introuvable (paquet poppler-utils)'}`);
  const pages = txt.stdout.split('\f').map((p) => p.split('\n').map(norm)
    .filter((l) => l && l !== norm(title) && !/^Page \d+ sur \d+$/.test(l)));

  const numbers = {};
  let from = 1;          // la page 1 est la couverture
  let partEnd = pages.length;
  heads.forEach((hd, i) => {
    const text = norm(hd.text);
    let found = -1;
    if (hd.level === 2) {
      // une partie commence en haut d'une page : ses premières lignes commencent par son titre
      for (let p = from; p < pages.length && found < 0; p++) {
        if (norm(pages[p].slice(0, 3).join(' ')).startsWith(text)) found = p;
      }
      const next = heads.slice(i + 1).find((x) => x.level === 2);
      partEnd = pages.length;
      if (found >= 0 && next) {
        for (let p = found + 1; p < pages.length; p++) {
          if (norm(pages[p].slice(0, 3).join(' ')).startsWith(norm(next.text))) { partEnd = p + 1; break; }
        }
      }
    } else {
      for (let p = from; p < partEnd && found < 0; p++) if (pages[p].includes(text)) found = p;
    }
    if (found < 0) throw new Error(`titre introuvable dans le PDF : « ${text} »`);
    numbers[hd.id] = found + 1;
    from = found;
  });
  await page.eval(`window.coursNumeros(${JSON.stringify(numbers)})`);

  // --- passe 2 : PDF final ---
  const pdf = await print();
  writeFileSync(OUT, pdf);
  const info = spawnSync('pdfinfo', [OUT], { encoding: 'utf8' }).stdout || '';
  const total = /Pages:\s+(\d+)/.exec(info)?.[1] ?? '?';
  console.log(`${relative(ROOT, OUT)} : ${total} pages, ${heads.length} titres numérotés dans la table des matières.`);
} finally {
  chrome.stop();
  site.stop();
  rmSync(tmp, { recursive: true, force: true });
}
