// Le cours : le tutoriel complet, découpé en pages (cours/contenu.js, généré par tools/cours_html.py).
//
// Adresses : #cours                              accueil et table des matières
//            #cours/niveau-2                     une page
//            #cours/niveau-3/c3-7-compter-…      une section dans une page
//            #cours/imprimer                     tout le cours sur une page, pour l'impression et le PDF
//
// Chaque page a une barre de navigation en haut et en bas : Sommaire, page précédente, page suivante.
// Les flèches gauche et droite du clavier changent aussi de page.
import { h, clear, formatDate } from './dom.js';
import { LEVELS } from './config.js';
import { createStore } from './storage.js';

const HOME = { id: 'accueil', short: 'Sommaire', title: 'Sommaire' };
let content = null;

export async function loadCours() {
  if (!content) content = (await import('../cours/contenu.js')).default;
  return content;
}

// Codes de compétences d'un texte : 'C1.1, C1.2' ou 'C2.1 à C2.3' → ['C2.1', 'C2.2', 'C2.3'].
export function competenceCodes(text = '') {
  const codes = [];
  for (const m of text.matchAll(/C(\d)\.(\d)(?:\s*à\s*C\1\.(\d))?/g)) {
    const [, lvl, from, to] = m;
    for (let i = Number(from); i <= Number(to || from); i++) codes.push(`C${lvl}.${i}`);
  }
  return codes;
}

// Adresse de la section du cours qui traite une compétence (null si le cours n'est pas chargé).
export function competenceHref(code) {
  if (!content) return null;
  for (const p of content.pages) {
    const s = p.sections.find((x) => x.title.startsWith(`${code} `));
    if (s) return `#cours/${p.id}/${s.id}`;
  }
  return null;
}

// « Revoir dans le cours : C1.1 · C1.2 », pour les cartes d'exercice et la correction des tests.
export function reviewLinks(competences) {
  const links = competenceCodes(competences)
    .map((code) => [code, competenceHref(code)])
    .filter(([, href]) => href);
  if (!links.length) return null;
  return h('p', { class: 'review-links' }, 'Revoir dans le cours : ',
    links.map(([code, href], i) => [i ? ' · ' : '', h('a', { href }, code)]));
}

// Toutes les pages, accueil compris, dans l'ordre de lecture.
function allPages() {
  return [{ ...HOME, title: content.title }, ...content.pages];
}

export function coursPage(pageId) {
  const pages = allPages();
  return pages.find((p) => p.id === pageId) || pages[0];
}

const href = (p, section) => (p.id === HOME.id ? '#cours' : `#cours/${p.id}${section ? `/${section}` : ''}`);

function navBar(pages, i, where) {
  const prev = pages[i - 1];
  const next = pages[i + 1];
  const step = (p, dir) => {
    if (!p) return h('span', { class: `cours-step ${dir} empty`, 'aria-hidden': 'true' });
    return h('a', { class: `cours-step ${dir}`, href: href(p), rel: dir },
      h('span', { class: 'cours-step-label' }, dir === 'prev' ? '← Précédent' : 'Suivant →'),
      h('span', { class: 'cours-step-title' }, p.short));
  };
  return h('nav', { class: `cours-nav ${where}`, 'aria-label': where === 'top' ? 'Pages du cours' : 'Pages du cours (bas)' },
    step(prev, 'prev'),
    h('div', { class: 'cours-nav-mid' },
      i > 0 ? h('a', { class: 'btn secondary cours-toc-btn', href: '#cours' }, 'Sommaire') : null,
      h('span', { class: 'cours-count' }, `Page ${i + 1} sur ${pages.length}`)),
    step(next, 'next'));
}

function tocView() {
  const levelPart = (p) => !p.annex;
  const entry = (p) => h('li', {},
    h('a', { class: 'toc-page', href: href(p) },
      p.subtitle ? [h('span', { class: 'toc-num' }, p.short), ' ', p.subtitle] : p.title),
    p.sections.length
      ? h('ul', { class: 'toc-sections' }, p.sections.map((s) => h('li', {}, h('a', { href: href(p, s.id) }, s.title))))
      : null);
  const cover = h('div', { class: 'cours-cover' });
  cover.innerHTML = content.cover || '';   // photo d'ouverture du doc et son crédit (généré)
  return h('div', { class: 'cours-home' },
    h('p', { class: 'meta' }, content.byline),
    content.cover ? cover : null,
    h('p', { class: 'cours-print-link' }, h('a', { class: 'btn secondary', href: '#cours/imprimer' }, 'Tout le cours sur une page (impression, PDF)')),
    h('p', {}, 'Le programme d\'apprentissage complet, de l\'apprentissage des règles jusqu\'au travail avec un solveur. ',
      'Chaque niveau a ses compétences (C1.1 à C6.5) et des tests d\'évaluation.'),
    h('h2', {}, 'Table des matières'),
    h('ol', { class: 'toc' }, content.pages.filter(levelPart).map(entry)),
    h('h3', { class: 'toc-annex-title' }, 'Annexes'),
    h('ol', { class: 'toc annexes' }, content.pages.filter((p) => p.annex).map(entry)));
}

// Lien vers l'application d'entraînement du niveau, quand elle existe.
function practiceLink(p) {
  const m = /^niveau-(\d+)$/.exec(p.id);
  if (!m) return null;
  const n = Number(m[1]);
  const lvl = LEVELS.find((l) => l.n === n);
  if (!lvl?.ready) return null;
  return h('p', { class: 'cours-practice' },
    h('a', { class: 'btn', href: `#niveau-${n}/exercices` }, `S'entraîner au niveau ${n}`),
    h('a', { class: 'btn secondary', href: `#niveau-${n}` }, 'Passer les tests'));
}

// Grille d'auto-évaluation : statut et date de chaque compétence d'après les tests passés dans
// l'application (ce navigateur). Les compétences sans test dans l'application ne changent pas.
async function fillGrid(body) {
  const tests = [];   // { level, code, competences: [...], status }
  for (const lvl of LEVELS.filter((l) => l.ready)) {
    try {
      const def = (await import(`../niveau-${lvl.n}/niveau.js`)).default;
      const store = createStore(def.storageKey);
      for (const ex of def.tests) tests.push({ level: lvl.n, code: ex.code, competences: competenceCodes(ex.competences), status: store.status(ex.id) });
    } catch { /* niveau illisible : sa partie de la grille reste telle quelle */ }
  }
  const table = [...body.querySelectorAll('table')].find((t) => /Statut/.test(t.tHead?.textContent || ''));
  if (!table || !tests.length) return;
  const LABEL = { none: 'Non commencé', progress: 'En cours', once: 'Validé une fois', validated: 'Validé' };
  let filled = 0;
  for (const row of table.tBodies[0].rows) {
    const code = row.cells[0]?.textContent.trim();
    const mine = tests.filter((x) => x.competences.includes(code));
    if (!mine.length) continue;
    const states = mine.map((x) => x.status.state);
    const state = states.every((s) => s === 'validated') ? 'validated'
      : states.every((s) => s === 'validated' || s === 'once') ? 'once'
        : states.some((s) => s !== 'none') ? 'progress' : 'none';
    const [, , , statusCell, dateCell, noteCell] = row.cells;
    clear(statusCell).append(h('span', { class: `chip ${state}` }, LABEL[state]));
    if (state === 'validated') {
      const last = mine.map((x) => x.status.second).sort().pop();
      clear(dateCell).append(formatDate(last));
    }
    clear(noteCell).append(`D'après : ${mine.map((x) => `niveau ${x.level}, ${x.code.toLowerCase()}`).join(' ; ')}`);
    filled++;
  }
  if (filled) {
    table.closest('.table-wrap').before(h('p', { class: 'grid-note' },
      `Statuts de ${filled} compétences remplis d'après vos tests dans l'application (ce navigateur). `,
      'Les autres se valident à la table : notez-les dans votre carnet.'));
  }
}

// Tout le cours sur une page : couverture, table des matières, puis chaque partie sur une nouvelle
// page à l'impression. Les liens internes pointent vers des ancres de cette page (#c3-7-…), ce qui
// donne des liens cliquables dans le PDF. tools/pdf_cours.mjs imprime cette page et remplit les
// numéros de page de la table des matières (window.coursNumeros).
export function renderPrint(main) {
  const anchor = (p, s) => (s ? s : `partie-${p.id}`);
  const tocEntry = (p) => h('li', {},
    h('a', { class: 'toc-page', href: `#${anchor(p)}` },
      h('span', { class: 'toc-text' }, p.title), h('span', { class: 'toc-pageno', 'data-for': anchor(p) })),
    p.sections.length ? h('ul', { class: 'toc-sections' }, p.sections.map((s) => h('li', {},
      h('a', { href: `#${s.id}` }, h('span', { class: 'toc-text' }, s.title), h('span', { class: 'toc-pageno', 'data-for': s.id }))))) : null);

  const cover = h('div', { class: 'cours-cover' });
  cover.innerHTML = content.cover || '';
  const parts = content.pages.map((p) => {
    const body = h('div', { class: 'cours-body' });
    // #cours/<page>/<section> → #<section> ; #cours/<page> → #partie-<page>
    body.innerHTML = p.html.replace(/href="#cours\/([\w-]+)(?:\/([\w-]+))?"/g,
      (m, page, sec) => `href="#${sec || `partie-${page}`}"`);
    return h('section', { class: 'print-part' }, h('h2', { id: anchor(p) }, p.title), body);
  });

  clear(main).append(h('div', { class: 'cours-print' },
    h('p', { class: 'print-only print-title' }, content.title),
    h('p', { class: 'meta' }, content.byline),
    content.cover ? cover : null,
    h('p', { class: 'no-print' }, h('a', { class: 'btn secondary', href: '#cours' }, '← Retour au sommaire'),
      ' ', h('button', { type: 'button', class: 'btn', onclick: () => window.print() }, 'Imprimer ou enregistrer en PDF')),
    h('section', { class: 'print-toc' },
      h('h2', {}, 'Table des matières'),
      h('ol', { class: 'toc' }, content.pages.map(tocEntry))),
    parts));

  // Liens internes : défilement dans la page, sans changer l'adresse (elle choisit la vue).
  main.onclick = (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').startsWith('#cours')) return;
    const target = document.getElementById(a.getAttribute('href').slice(1));
    if (target) { e.preventDefault(); target.scrollIntoView(); }
  };
  window.coursNumeros = (map) => {
    for (const el of main.querySelectorAll('.toc-pageno')) el.textContent = map[el.dataset.for] ?? '';
  };
  document.title = content.title;   // titre du PDF enregistré
  window.scrollTo(0, 0);
  // Prêt quand toutes les images sont chargées (impression headless).
  const imgs = [...main.querySelectorAll('img')];
  imgs.forEach((i) => i.removeAttribute('loading'));
  Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; }))))
    .then(() => { document.body.dataset.coursPret = '1'; });
}

export function renderCours(main, pageId, sectionId) {
  main.onclick = null;
  delete document.body.dataset.coursPret;
  const pages = allPages();
  const i = Math.max(0, pages.findIndex((p) => p.id === pageId));
  const page = pages[i];

  let body;
  if (i === 0) {
    body = tocView();
  } else {
    body = h('article', { class: 'cours-body' });
    body.innerHTML = page.html;   // contenu généré à partir du doc, pas de saisie utilisateur
    if (page.sections.length > 1) {
      body.prepend(h('nav', { class: 'page-toc', 'aria-label': 'Dans cette page' },
        h('span', { class: 'page-toc-title' }, 'Dans cette page'),
        h('ul', {}, page.sections.map((s) => h('li', {}, h('a', { href: href(page, s.id) }, s.title))))));
    }
    const link = practiceLink(page);
    if (link) body.append(link);
    if (page.id === 'grille') fillGrid(body);
  }

  clear(main).append(navBar(pages, i, 'top'), body, navBar(pages, i, 'bottom'));

  const target = sectionId && document.getElementById(sectionId);
  if (target) target.scrollIntoView();
  else window.scrollTo(0, 0);

  document.onkeydown = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    const to = e.key === 'ArrowLeft' ? pages[i - 1] : e.key === 'ArrowRight' ? pages[i + 1] : null;
    if (to) location.hash = href(to);
  };
}
