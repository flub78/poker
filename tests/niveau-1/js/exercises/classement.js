// Test 2 : classement des mains (C1.3).
// 10 mains, une de chaque combinaison, à nommer sans erreur.
import { h } from '../dom.js';
import { card, SUITS, shuffle, pick, int, cardRow } from '../cards.js';
import { evaluate, classOf, CLASSES, className } from '../evaluator.js';

const distinctRanks = (n, rand, exclude = []) => {
  const pool = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].filter((r) => !exclude.includes(r)), rand);
  return pool.slice(0, n);
};
const suitsFor = (n, rand) => shuffle(SUITS, rand).slice(0, n);

// Fabrique une main de 5 cartes de la combinaison demandée.
const BUILDERS = {
  royal: (rand) => { const s = pick(SUITS, rand); return [14, 13, 12, 11, 10].map((r) => card(r, s)); },
  sf: (rand) => { const s = pick(SUITS, rand); const hi = int(6, 13, rand); return [0, 1, 2, 3, 4].map((k) => card(hi - k, s)); },
  quads: (rand) => { const [q, k] = distinctRanks(2, rand); return [...SUITS.map((s) => card(q, s)), card(k, pick(SUITS, rand))]; },
  full: (rand) => { const [t, p] = distinctRanks(2, rand); return [...suitsFor(3, rand).map((s) => card(t, s)), ...suitsFor(2, rand).map((s) => card(p, s))]; },
  flush: (rand) => { const s = pick(SUITS, rand); return distinctRanks(5, rand).map((r) => card(r, s)); },
  straight: (rand) => { const hi = int(5, 14, rand); return [0, 1, 2, 3, 4].map((k) => card(hi - k === 1 ? 14 : hi - k, pick(SUITS, rand))); },
  trips: (rand) => { const [t, a, b] = distinctRanks(3, rand); return [...suitsFor(3, rand).map((s) => card(t, s)), card(a, pick(SUITS, rand)), card(b, pick(SUITS, rand))]; },
  twopair: (rand) => { const [p, q, k] = distinctRanks(3, rand); return [...suitsFor(2, rand).map((s) => card(p, s)), ...suitsFor(2, rand).map((s) => card(q, s)), card(k, pick(SUITS, rand))]; },
  pair: (rand) => { const [p, ...ks] = distinctRanks(4, rand); return [...suitsFor(2, rand).map((s) => card(p, s)), ...ks.map((r) => card(r, pick(SUITS, rand)))]; },
  high: (rand) => distinctRanks(5, rand).map((r) => card(r, pick(SUITS, rand))),
};

function build(id, rand) {
  for (;;) {
    const hand = BUILDERS[id](rand);
    if (classOf(evaluate(hand)) === id) return shuffle(hand, rand);
  }
}

export default {
  id: 'classement',
  code: 'Test 2',
  title: 'Classement des mains',
  competences: 'C1.3',
  rule: '10 mains nommées sans erreur',

  create(rand) {
    const hands = shuffle(CLASSES.map((c) => c.id), rand).map((id) => ({ id, cards: build(id, rand) }));
    const answers = new Array(hands.length).fill('');

    return {
      render(root) {
        root.append(h('section', { class: 'block' },
          h('h3', {}, 'Nommez la combinaison de chaque main'),
          h('p', { class: 'hint' }, 'Chaque combinaison apparaît une seule fois. Le numéro indique son rang, de la plus forte (1) à la plus faible (10).'),
          h('ol', { class: 'hand-list' }, hands.map((hand, i) => h('li', { class: 'hand-item' },
            cardRow(hand.cards, 'sm'),
            h('select', { 'aria-label': `Combinaison de la main ${i + 1}`, onchange: (e) => { answers[i] = e.target.value; } },
              h('option', { value: '' }, 'Choisir…'),
              CLASSES.map((c, k) => h('option', { value: c.id }, `${k + 1} · ${c.name}`)))))),
        ));
      },
      missing() {
        const n = answers.filter((a) => !a).length;
        return n ? `Il reste ${n} main${n > 1 ? 's' : ''} sans réponse.` : null;
      },
      grade() {
        const items = hands.map((hand, i) => {
          const ok = answers[i] === hand.id;
          return {
            ok, title: `Main ${i + 1}`,
            body: h('div', { class: 'review-hand' }, cardRow(hand.cards, 'xs'),
              ok ? h('span', {}, className(hand.id))
                : h('span', {}, `Votre réponse : ${className(answers[i])} · `, h('strong', { class: 'good' }, `Bonne réponse : ${className(hand.id)}`))),
          };
        });
        const score = items.filter((it) => it.ok).length;
        return { score, total: hands.length, passed: score === hands.length, items };
      },
    };
  },
};
