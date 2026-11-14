// Point d'entrée unique (index.html). Lit l'adresse, charge le niveau demandé
// depuis son dossier et l'affiche.
//
// Adresses : index.html#niveau-2            onglet Tests du niveau 2
//            index.html#niveau-2/exercices  onglet Exercices
//            index.html#niveau-2/aide       onglet propre au niveau
//            index.html#cours               le cours (tutoriel), accueil et table des matières
//            index.html#cours/niveau-1      une page du cours (voir js/cours.js)
//            index.html#simulateur          le simulateur de table (voir simulateur/simulateur.js)
//            index.html#profil              prénom, résultats, transfert, sauvegarde (voir js/profil.js)
//            index.html#transfert/<code>    lien de transfert reçu : page Profil
// Sans niveau dans l'adresse, on reprend le dernier niveau ouvert (sinon le 1).
import { h, clear } from './dom.js';
import { LEVELS } from './config.js';
import { startApp } from './shell.js';
import { loadCours, coursPage, renderCours, renderPrint } from './cours.js';
import { renderProfil } from './profil.js';
import { getPlayerName } from './storage.js';
import { levelBadge, levelClass, levelLabel, setPageLevel, pageLevel } from './niveau-couleur.js';

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

// Icône du bouton Profil (silhouette), seule visible sur petit écran.
function profileIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'profile-icon');
  svg.innerHTML = '<circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="currentColor"/>';
  return svg;
}

// level : numéro du niveau affiché, ou null pour le cours et le profil (title donne alors le titre).
// current : 'cours', 'simulateur' ou 'profil' marque le bouton correspondant comme page courante.
// work : niveau de travail (code couleur : bandeau, pastille, boutons) ; par défaut level.
// Une page du cours d'un niveau, ou le simulateur (votre niveau), en ont un aussi.
let lastHeader = null;
function renderHeader(level, title, current = level ? null : 'cours', work = level) {
  lastHeader = [level, title, current, work];
  setPageLevel(work);
  const inCours = current === 'cours';
  const name = getPlayerName();
  const info = LEVELS.find((l) => l.n === level);
  document.title = level ? `Poker · Niveau ${level}` : `Poker · ${inCours ? 'Cours' : title}`;
  const profile = h('a', {
    class: `level-link profile-link${current === 'profil' ? ' current' : ''}`, href: '#profil',
    title: 'Profil : prénom, résultats, sauvegarde, changement d\'appareil',
    'aria-label': name ? `Profil de ${name}` : 'Profil', 'aria-current': current === 'profil' ? 'page' : false,
  }, profileIcon(), h('span', { class: 'long' }, name || 'Profil'));
  const label = (l) => [h('span', { class: 'long' }, 'Niveau'), String(l.n)];
  clear(header).append(
    h('p', { class: 'kicker' }, 'Initiation au poker · Texas Hold\'em No-Limit'),
    h('h1', {}, level ? `Niveau ${level} : ${info.title.charAt(0).toLowerCase()}${info.title.slice(1)}` : title),
    ...(work ? [h('p', { class: 'header-level' }, levelBadge(work))] : []),   // append natif : pas de null
    h('nav', { class: 'level-nav', 'aria-label': 'Niveaux' },
      h('span', { class: 'level-nav-title' }, 'Niveaux'),
      h('ul', {},
        // Toujours un lien : depuis une page du cours, il ramène au sommaire.
        h('li', { class: 'cours-li' }, h('a', {
          class: `level-link cours-link${inCours ? ' current' : ''}`, href: '#cours',
          title: 'Le cours complet : sommaire', 'aria-current': inCours ? 'page' : false,
        }, 'Cours')),
        h('li', { class: 'cours-li' }, h('a', {
          class: `level-link cours-link${current === 'simulateur' ? ' current' : ''}`, href: '#simulateur',
          title: 'Simulateur : une table à 6 joueurs contre des bots', 'aria-current': current === 'simulateur' ? 'page' : false,
        }, 'Table')),
        LEVELS.map((l) => h('li', {},
        l.n === level
          ? h('span', { class: `level-link ${levelClass(l.n)} current`, 'aria-current': 'page', title: `${l.title} (${levelLabel(l.n)})`, 'aria-label': `Niveau ${l.n}, ${l.rank.toLowerCase()}` }, label(l))
          : l.ready
            ? h('a', { class: `level-link ${levelClass(l.n)}`, href: `#niveau-${l.n}`, title: `${l.title} (${levelLabel(l.n)})`, 'aria-label': `Niveau ${l.n}, ${l.rank.toLowerCase()} : ${l.title}` }, label(l))
            : h('span', { class: `level-link ${levelClass(l.n)} soon`, title: `${l.title} (à venir)`, 'aria-label': `Niveau ${l.n}, à venir` }, label(l))))),
      profile));
}

// Feuille de style propre au niveau (facultative), chargée à côté de css/style.css.
// href : chemin direct d'une feuille (simulateur), à la place de niveau-N/def.css.
function levelStyle(level, def, href = null) {
  document.getElementById('level-css')?.remove();
  if (!def.css && !href) return;
  document.head.append(h('link', { id: 'level-css', rel: 'stylesheet', href: href || `niveau-${level}/${def.css}` }));
}

async function showSimulateur() {
  renderHeader(null, 'Simulateur de table', 'simulateur');
  levelStyle(0, {}, 'simulateur/simulateur.css');
  try { await loadCours(); } catch { /* cours absent : indices sans lien */ }
  try {
    const { renderSimulateur } = await import('../simulateur/simulateur.js');
    window.scrollTo(0, 0);
    renderSimulateur(main);
  } catch (err) {
    clear(main).append(h('p', { class: 'form-message' }, `Impossible de charger le simulateur : ${err.message}`));
  }
}

async function showCours() {
  const [, pageId, sectionId] = /^#cours(?:\/([\w-]+))?(?:\/([\w-]+))?/.exec(location.hash);
  levelStyle(0, {});
  try {
    await loadCours();
  } catch (err) {
    renderHeader(null, 'Cours');
    clear(main).append(h('p', { class: 'form-message' }, `Impossible de charger le cours : ${err.message}`));
    return;
  }
  if (pageId === 'imprimer') {
    const content = await loadCours();
    renderHeader(null, content.title);
    renderPrint(main);
    return;
  }
  const page = coursPage(pageId);
  renderHeader(null, page.title, 'cours', pageLevel(page.id));
  renderCours(main, page.id, sectionId);
}

async function show() {
  document.onkeydown = null;   // posé par le cours (flèches gauche et droite)
  main.onclick = null;         // posé par la vue imprimable du cours
  if (/^#cours\b/.test(location.hash)) { showCours(); return; }
  if (/^#simulateur\b/.test(location.hash)) { showSimulateur(); return; }
  const profil = /^#(?:profil|transfert)(?:\/(.+))?$/.exec(location.hash);
  if (profil) {
    renderHeader(null, 'Profil', 'profil');
    levelStyle(0, {});
    renderProfil(main, location.hash.startsWith('#transfert/') ? profil[1] : null);
    return;
  }
  const { level, tab } = parse();
  try { localStorage.setItem(LAST_KEY, String(level)); } catch { /* stockage bloqué */ }
  renderHeader(level);
  try {
    if (!cache.has(level)) cache.set(level, (await import(`../niveau-${level}/niveau.js`)).default);
  } catch (err) {
    clear(main).append(h('p', { class: 'form-message' }, `Impossible de charger le niveau ${level} : ${err.message}`));
    return;
  }
  // Le cours est chargé aussi pour les niveaux : liens « Revoir dans le cours » (sans lui, pas de lien).
  try { await loadCours(); } catch { /* cours absent : on continue sans */ }
  const def = cache.get(level);
  levelStyle(level, def);
  window.scrollTo(0, 0);
  startApp(def, tab);
}

window.addEventListener('hashchange', show);
// Le simulateur annonce le niveau du joueur (réglage « Votre niveau ») : en-tête à sa couleur.
window.addEventListener('niveau-travail', (e) => {
  if (lastHeader?.[2] === 'simulateur') renderHeader(lastHeader[0], lastHeader[1], 'simulateur', e.detail);
});
window.addEventListener('profil-change', () => { if (lastHeader) renderHeader(...lastHeader); });   // prénom modifié
show();
