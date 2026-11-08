// Point d'entrée unique (index.html). Lit l'adresse, charge le niveau demandé
// depuis son dossier et l'affiche.
//
// Adresses : index.html#niveau-2            onglet Tests du niveau 2
//            index.html#niveau-2/exercices  onglet Exercices
//            index.html#niveau-2/aide       onglet propre au niveau
// Sans niveau dans l'adresse, on reprend le dernier niveau ouvert (sinon le 1).
import { h, clear } from './dom.js';
import { LEVELS } from './config.js';
import { startApp } from './shell.js';

const LAST_KEY = 'poker.dernierNiveau';
const header = document.querySelector('.site-header .wrap');
const main = document.getElementById('app');
const cache = new Map();

const ready = (n) => LEVELS.some((l) => l.n === n && l.ready);

function parse() {
  const m = /^#niveau-(\d+)(?:\/([\w-]+))?/.exec(location.hash);
  if (m && ready(Number(m[1]))) return { level: Number(m[1]), tab: m[2] || 'tests' };
  let last = 1;
  try { last = Number(localStorage.getItem(LAST_KEY)) || 1; } catch { /* stockage bloqué */ }
  return { level: ready(last) ? last : 1, tab: 'tests' };
}

function renderHeader(level) {
  const info = LEVELS.find((l) => l.n === level);
  document.title = `Poker · Niveau ${level}`;
  const label = (l) => [h('span', { class: 'long' }, 'Niveau'), String(l.n)];
  clear(header).append(
    h('p', { class: 'kicker' }, 'Initiation au poker · Texas Hold\'em No-Limit'),
    h('h1', {}, `Niveau ${level} : ${info.title.charAt(0).toLowerCase()}${info.title.slice(1)}`),
    h('nav', { class: 'level-nav', 'aria-label': 'Niveaux' },
      h('span', { class: 'level-nav-title' }, 'Niveaux'),
      h('ul', {}, LEVELS.map((l) => h('li', {},
        l.n === level
          ? h('span', { class: 'level-link current', 'aria-current': 'page', title: l.title, 'aria-label': `Niveau ${l.n}` }, label(l))
          : l.ready
            ? h('a', { class: 'level-link', href: `#niveau-${l.n}`, title: l.title, 'aria-label': `Niveau ${l.n} : ${l.title}` }, label(l))
            : h('span', { class: 'level-link soon', title: `${l.title} (à venir)`, 'aria-label': `Niveau ${l.n}, à venir` }, label(l)))))));
}

// Feuille de style propre au niveau (facultative), chargée à côté de css/style.css.
function levelStyle(level, def) {
  document.getElementById('level-css')?.remove();
  if (!def.css) return;
  document.head.append(h('link', { id: 'level-css', rel: 'stylesheet', href: `niveau-${level}/${def.css}` }));
}

async function show() {
  const { level, tab } = parse();
  try { localStorage.setItem(LAST_KEY, String(level)); } catch { /* stockage bloqué */ }
  renderHeader(level);
  try {
    if (!cache.has(level)) cache.set(level, (await import(`../niveau-${level}/niveau.js`)).default);
  } catch (err) {
    clear(main).append(h('p', { class: 'form-message' }, `Impossible de charger le niveau ${level} : ${err.message}`));
    return;
  }
  const def = cache.get(level);
  levelStyle(level, def);
  window.scrollTo(0, 0);
  startApp(def, tab);
}

window.addEventListener('hashchange', show);
show();
