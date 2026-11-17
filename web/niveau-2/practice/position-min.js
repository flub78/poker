// Exercice : position minimum. Une main : à partir de quelle position la relance-t-on
// quand personne n'a relancé ? UTG (et MP), CO (et SB), BTN, ou jamais. Les listes sont celles du
// sous-niveau choisi (settings.step) ; la réponse d'un sous-niveau plus avancé est acceptée « en avance ».
import { h } from '../../js/dom.js';
import { pick, cardRow } from '../../js/cards.js';
import { cardsFor, handName, coveringToken, frontier, randomHand } from '../ranges.js';
import { FULL, STEPS, openRange, minPosition, grade } from '../strategy.js';

const CHOICES = [
  ['UTG', 'UTG (et MP)'],
  ['CO', 'CO (et SB)'],
  ['BTN', 'BTN seulement'],
  ['jamais', 'Jamais'],
];

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
    const step = settings.step ?? FULL;
    const list = (pos) => openRange(pos, step);
    const edges = [...new Set(['UTG', 'CO', 'BTN'].flatMap((pos) => frontier(list(pos).set)))];
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
      report(grade((s) => minPosition(code, s) === value, step).ok);
      show();
    }

    // Pourquoi la position minimum est « want » à l'étape s.
    const reason = (want, s) => (want === 'jamais'
      ? `${handName(code)} n'est dans aucune liste, même pas celle du BTN.`
      : `${handName(code)} entre dans la ${openRange(want, s).name} par ${coveringToken(openRange(want, s), code)}.`);
    const choice = (v) => CHOICES.find(([x]) => x === v)[1];

    function feedback() {
      const want = minPosition(code, step);
      const { ok, ahead } = grade((s) => minPosition(code, s) === answer, step);
      const btn = h('button', { type: 'button', class: 'btn', onclick: next }, 'Main suivante →');
      setTimeout(() => btn.focus(), 0);
      const body = ahead !== null
        ? [h('p', {}, h('strong', {}, `✓ ${choice(answer)} : juste, en avance.`)),
          h('p', {}, `C'est la réponse à partir du sous-niveau ${STEPS[ahead].code}. ${reason(answer, ahead)}`),
          h('p', { class: 'meta' }, `À votre sous-niveau (${STEPS[step].code}), la réponse est : ${choice(want)}. ${reason(want, step)}`)]
        : [h('p', {}, h('strong', {}, ok ? '✓ Juste.' : `✗ Réponse : ${choice(want)}.`)),
          h('p', {}, reason(want, step))];
      return h('div', {},
        h('div', { class: `feedback ${ok ? 'ok' : 'ko'}` }, ...body),
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
