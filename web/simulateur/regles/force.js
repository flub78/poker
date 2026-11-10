// Force d'une main après le flop, telle que le cours la décrit, et outs d'un tirage (C3.1).
import { evaluate, compare, describe, CAT } from '../../niveau-1/evaluator.js';
import { deck, sameCard } from '../../js/cards.js';

// Classe d'une main : 'forte' (deux paires avec ses deux cartes, brelan ou mieux grâce à ses
// cartes), 'top' (top paire ou paire servie au-dessus du tableau), 'paire' (une autre paire
// avec au moins une de ses cartes), 'rien'. Une paire du tableau seul ne compte pas.
export function handClass(hole, board) {
  const all = evaluate([...hole, ...board]);
  const onBoard = evaluate(board);
  const name = describe(all);
  const ranks = board.map((c) => c.r);
  const top = Math.max(...ranks);
  const pocket = hole[0].r === hole[1].r;
  const paired = hole.filter((c) => ranks.includes(c.r));
  if (all[0] >= CAT.TRIPS && compare(all, onBoard) > 0 && all[0] > onBoard[0]) {
    return { cls: 'forte', text: `${name} : une main forte` };
  }
  if (!pocket && paired.length === 2 && paired[0].r !== paired[1].r) {
    return { cls: 'forte', text: `${name} avec vos deux cartes : une main forte` };
  }
  if (pocket && hole[0].r > top) return { cls: 'top', text: `paire servie au-dessus du tableau (${name.toLowerCase()})` };
  if (paired.some((c) => c.r === top)) return { cls: 'top', text: `top paire (${name.toLowerCase()})` };
  if (pocket || paired.length) return { cls: 'paire', text: `une paire moyenne ou basse (${name.toLowerCase()})` };
  return { cls: 'rien', text: 'aucune paire avec vos cartes' };
}

// Outs : cartes qui donnent une quinte ou mieux grâce à vos cartes (tirages couleur et quinte),
// plus, si vous n'avez rien, les cartes qui apparient une carte haute (au-dessus du tableau),
// et pour une paire servie sous le tableau, les 2 cartes du brelan. Renvoie { n, kinds }.
export function outs(hole, board) {
  if (board.length >= 5) return { n: 0, kinds: [] };
  const seen = [...hole, ...board];
  const rest = deck().filter((c) => !seen.some((u) => sameCard(u, c)));
  const now = evaluate(seen);
  const found = new Set();
  const kinds = new Set();
  const key = (c) => `${c.r}${c.s}`;
  if (now[0] < CAT.STRAIGHT) {
    for (const c of rest) {
      const mine = evaluate([...seen, c]);
      if (mine[0] >= CAT.STRAIGHT && compare(mine, evaluate([...board, c])) > 0) {
        found.add(key(c));
        kinds.add(mine[0] === CAT.FLUSH || mine[0] === CAT.STRAIGHT_FLUSH ? 'couleur' : 'quinte');
      }
    }
  }
  const { cls } = handClass(hole, board);
  const top = Math.max(...board.map((c) => c.r));
  const pocket = hole[0].r === hole[1].r;
  if (cls === 'rien' && !pocket && hole.every((c) => c.r > top)) {
    for (const c of rest) if (hole.some((x) => x.r === c.r)) { found.add(key(c)); kinds.add('cartes hautes'); }
  }
  if (cls === 'paire' && pocket) {
    for (const c of rest) if (c.r === hole[0].r) { found.add(key(c)); kinds.add('brelan'); }
  }
  return { n: found.size, kinds: [...kinds] };
}
