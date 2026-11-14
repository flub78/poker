// Fabrique de mains de 5 cartes d'une combinaison donnée (tests 2 et 5 du niveau 1).
// JavaScript pur, testé sous Node (tests/existants/comparaison.test.js).
import { card, SUITS, shuffle, pick, int } from '../js/cards.js';
import { evaluate, classOf } from './evaluator.js';

const distinctRanks = (n, rand, exclude = []) => {
  const pool = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].filter((r) => !exclude.includes(r)), rand);
  return pool.slice(0, n);
};
const suitsFor = (n, rand) => shuffle(SUITS, rand).slice(0, n);

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

// Une main de 5 cartes de la combinaison id (identifiants de CLASSES), dans le désordre.
export function build(id, rand) {
  for (;;) {
    const hand = BUILDERS[id](rand);
    if (classOf(evaluate(hand)) === id) return shuffle(hand, rand);
  }
}
