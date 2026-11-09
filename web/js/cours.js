// Le cours : le tutoriel complet, découpé en pages (cours/contenu.js, généré par tools/cours_html.py).
//
// Adresses : #cours                              accueil et table des matières
//            #cours/niveau-2                     une page
//            #cours/niveau-3/c3-7-compter-…      une section dans une page
//
// Chaque page a une barre de navigation en haut et en bas : Sommaire, page précédente, page suivante.
// Les flèches gauche et droite du clavier changent aussi de page.
import { h, clear } from './dom.js';
import { LEVELS } from './config.js';

const HOME = { id: 'accueil', short: 'Sommaire', title: 'Sommaire' };
let content = null;

export async function loadCours() {
  if (!content) content = (await import('../cours/contenu.js')).default;
  return content;
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
    h('p', {}, 'Le programme complet, du simple apprentissage des règles jusqu\'au travail avec un solveur. ',
      'Chaque niveau a ses compétences (C1.1 à C6.5) et ses tests de passage, que vous passez dans l\'onglet du niveau.'),
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

export function renderCours(main, pageId, sectionId) {
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
