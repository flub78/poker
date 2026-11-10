// Pot principal et pots annexes, puis partage des pots à l'abattage.
// Fonctions pures : elles ne modifient pas les sièges reçus.
import { evaluate, compare } from '../../niveau-1/evaluator.js';

// Découpe ce que chaque siège a misé pendant la main en pots successifs.
// seats : [{ committed, folded }] ; renvoie [{ amount, eligible: [indices] }], pot principal d'abord.
// Un joueur couché alimente les pots mais ne peut en gagner aucun. Un pot dont un seul joueur est
// éligible est une mise que personne n'a suivie : elle lui revient.
export function computePots(seats) {
  const levels = [...new Set(seats.filter((s) => !s.folded && s.committed > 0).map((s) => s.committed))]
    .sort((a, b) => a - b);
  const pots = [];
  let prev = 0;
  for (const level of levels) {
    let amount = 0;
    seats.forEach((s) => { amount += Math.min(s.committed, level) - Math.min(s.committed, prev); });
    const eligible = seats.map((s, i) => i).filter((i) => !seats[i].folded && seats[i].committed >= level);
    const last = pots[pots.length - 1];
    if (last && same(last.eligible, eligible)) last.amount += amount;
    else pots.push({ amount, eligible });
    prev = level;
  }
  // Jetons d'un joueur couché au-delà du plus haut niveau encore en jeu (cas limite) : au dernier pot.
  let rest = 0;
  seats.forEach((s) => { rest += Math.max(0, s.committed - prev); });
  if (rest && pots.length) pots[pots.length - 1].amount += rest;
  return pots;
}

const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// Partage les pots. hands[i] : les 2 cartes du siège i ; board : les 5 cartes du tableau.
// order : indices des sièges à partir de la gauche du bouton, pour les jetons indivisibles.
// Renvoie [{ amount, eligible, winners, score }] et ne touche pas aux tapis.
export function awardPots(pots, hands, board, order) {
  return pots.map((pot) => {
    if (pot.eligible.length === 1) return { ...pot, winners: [...pot.eligible], shares: { [pot.eligible[0]]: pot.amount } };
    const scores = Object.fromEntries(pot.eligible.map((i) => [i, evaluate([...hands[i], ...board])]));
    let best = null;
    for (const i of pot.eligible) if (!best || compare(scores[i], best) > 0) best = scores[i];
    const winners = order.filter((i) => pot.eligible.includes(i) && compare(scores[i], best) === 0);
    const part = Math.floor(pot.amount / winners.length);
    let odd = pot.amount - part * winners.length;
    const shares = {};
    for (const i of winners) { shares[i] = part + (odd > 0 ? 1 : 0); odd--; }
    return { ...pot, winners, shares, score: best };
  });
}
