// Outils d'analyse partagés par les exercices : meilleure main de 5 cartes, nuts d'un tableau.
import { deck, sameCard } from './cards.js';
import { evaluate, compare } from './evaluator.js';

// Toutes les façons de choisir k éléments dans arr.
function* choose(arr, k, start = 0, acc = []) {
  if (acc.length === k) { yield acc.slice(); return; }
  for (let i = start; i <= arr.length - (k - acc.length); i++) {
    acc.push(arr[i]);
    yield* choose(arr, k, i + 1, acc);
    acc.pop();
  }
}

// Meilleure main de 5 cartes parmi 5 à 7 : { score, cards }.
export function bestFive(cards) {
  let best = null;
  for (const five of choose(cards, 5)) {
    const score = evaluate(five);
    if (!best || compare(score, best.score) > 0) best = { score, cards: five };
  }
  return best;
}

// Nuts d'un tableau de 5 cartes : meilleure main possible et toutes les paires de cartes qui la font.
export function nutsOf(board) {
  const rest = deck().filter((c) => !board.some((b) => sameCard(b, c)));
  let score = null;
  let holes = [];
  let total = 0;
  for (const hole of choose(rest, 2)) {
    total++;
    const s = evaluate([...board, ...hole]);
    const d = score ? compare(s, score) : 1;
    if (d > 0) { score = s; holes = [hole]; } else if (d === 0) holes.push(hole);
  }
  return { score, holes, total };
}
