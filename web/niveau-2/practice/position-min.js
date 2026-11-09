// Exercice : position minimum. Une main : à partir de quelle position la relance-t-on
// quand personne n'a relancé ? UTG (et MP), CO (et SB), BTN, ou jamais.
import { h } from '../../js/dom.js';
import { pick, cardRow } from '../../js/cards.js';
import { cardsFor, handName, coveringToken, frontier, randomHand } from '../ranges.js';
import { UTG, CO, BTN, minPosition } from '../strategy.js';

const CHOICES = [
  ['UTG', 'UTG (et MP)'],
  ['CO', 'CO (et SB)'],
  ['BTN', 'BTN seulement'],
  ['jamais', 'Jamais'],
];
const LIST = { UTG, CO, BTN };

export default {
  id: 'position-min',
  title: 'Position minimum',
  competences: 'C2.2',
  summary: 'Deux cartes : à partir de quelle position les relancez-vous quand personne n\'a relancé ?',
  settings: [
    { id: 'pool', label: 'Mains', default: 'edge',
      options: [
        { value: 'edge', label: 'Surtout les mains limites' },
        { value: 'all', label: 'Au hasard, comme une vraie donne' },
      ] },
  ],

  create(rand, settings, report) {
    const edges = [...new Set([...frontier(UTG.set), ...frontier(CO.set), ...frontier(BTN.set)])];
    let root;
    let code;
    let cards;
    let answer = null;

    function next() {
      code = settings.pool === 'edge' && rand() < 0.8 ? pick(edges, rand) : randomHand(rand);
      cards = cardsFor(code, rand);
      answer = null;
      show();
    }

    function choose(value) {
      if (answer) return;
      answer = value;
      report(value === minPosition(code));
      show();
    }

    function feedback() {
      const want = minPosition(code);
      const ok = answer === want;
      const why = want === 'jamais'
        ? `${handName(code)} n'est dans aucune liste, même pas celle du BTN.`
        : `${handName(code)} entre dans la liste ${want === 'UTG' ? 'UTG' : want === 'CO' ? 'du CO' : 'du BTN'} par ${coveringToken(LIST[want], code)}.`;
      const btn = h('button', { type: 'button', class: 'btn', onclick: next }, 'Main suivante →');
      setTimeout(() => btn.focus(), 0);
      return h('div', {},
        h('div', { class: `feedback ${ok ? 'ok' : 'ko'}` },
          h('p', {}, h('strong', {}, ok ? '✓ Juste.' : `✗ Réponse : ${CHOICES.find(([v]) => v === want)[1]}.`)),
          h('p', {}, why)),
        h('div', { class: 'practice-actions' }, btn));
    }

    function show() {
      root.replaceChildren(
        h('section', { class: 'block' }, cardRow(cards)),
        h('section', { class: 'block' }, answer
          ? feedback()
          : h('div', { class: 'action-row' }, CHOICES.map(([v, text]) => h('button', {
            type: 'button', class: 'option action', onclick: () => choose(v),
          }, text)))),
      );
    }

    return {
      render(el) {
        root = el;
        next();
      },
    };
  },
};
