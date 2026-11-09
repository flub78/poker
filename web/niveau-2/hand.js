// Affichage d'une situation : la main (deux cartes) et le récit de la donne.
import { h } from '../js/dom.js';
import { cardRow } from '../js/cards.js';
import { ACTIONS } from './strategy.js';
import { describe } from './situations.js';

export function situationView(sit, cards, size = '') {
  return h('div', { class: 'situation' },
    cardRow(cards, size),
    h('p', { class: 'situation-text' }, describe(sit)));
}

// Boutons de réponse ; onPick(action) à chaque choix. Renvoie { el, select(action) }.
export function actionButtons(sit, onPick, current = '') {
  const buttons = ACTIONS[sit.type].map(([action, text]) => h('button', {
    type: 'button', class: 'option action', 'aria-pressed': current === action ? 'true' : 'false', dataset: { action },
    onclick: () => { select(action); onPick(action); },
  }, text));
  function select(action) {
    for (const b of buttons) {
      const on = b.dataset.action === action;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }
  if (current) select(current);
  return { el: h('div', { class: 'action-row', role: 'group', 'aria-label': 'Votre décision' }, buttons), select };
}
