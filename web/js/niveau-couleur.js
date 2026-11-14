// Code couleur des niveaux : vert débutant, bleu élémentaire, jaune intermédiaire, orange avancé,
// rouge expert, noir maître (rang et couleur dans js/config.js, teintes dans css/style.css).
//
// La classe niv-N pose les variables --niv (fond) et --niv-ink (texte posé dessus) ; tout élément
// qui en dépend (pastille, bordure, bouton) les lit. Le niveau « en cours » de la page est posé
// sur <body data-niveau="N"> : bandeau de l'en-tête et boutons pleins prennent sa couleur.
import { h } from './dom.js';
import { LEVELS } from './config.js';

export const levelOf = (n) => LEVELS.find((l) => l.n === Number(n)) || null;

export const levelClass = (n) => (levelOf(n) ? `niv-${Number(n)}` : '');

// « Débutant · vert » : pour les title et aria-label.
export function levelLabel(n) {
  const l = levelOf(n);
  return l ? `${l.rank} · ${l.color}` : '';
}

// Pastille « Niveau 3 · Intermédiaire » (short : « Intermédiaire »).
export function levelBadge(n, { short = false } = {}) {
  const l = levelOf(n);
  if (!l) return null;
  return h('span', { class: `lvl-badge ${levelClass(n)}`, title: `Niveau ${l.n} : ${l.rank.toLowerCase()} (${l.color})` },
    short ? l.rank : `Niveau ${l.n} · ${l.rank}`);
}

// Niveau de travail de la page (null : aucun, pages générales).
export function setPageLevel(n) {
  if (levelOf(n)) document.body.dataset.niveau = String(Number(n));
  else delete document.body.dataset.niveau;
}

// Numéro du niveau d'une page du cours (« niveau-3 » → 3), sinon null.
export function pageLevel(pageId) {
  const m = /^niveau-(\d+)$/.exec(pageId || '');
  return m && levelOf(m[1]) ? Number(m[1]) : null;
}

// Point de couleur seul (sommaire, listes).
export function levelDot(n) {
  return levelOf(n) ? h('span', { class: `lvl-dot ${levelClass(n)}`, 'aria-hidden': 'true' }) : null;
}
