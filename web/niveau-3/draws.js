// Situations de tirage du niveau 3 (C3.1) : vos 2 cartes, le flop ou le turn, et la liste exacte
// des outs. Chaque situation est construite pour un type de tirage du cours, puis recomptée avec
// l'évaluateur de mains du niveau 1 : si le compte ne correspond pas au type (out en trop ou en
// moins), la situation est rejetée et retirée. Les tableaux sont « propres » : jamais appariés,
// jamais trois cartes d'une même couleur adverse, pour qu'aucun out ne soit « sale » (C3.1).
import { deck, shuffle, pick, int, SUITS, sameCard } from '../js/cards.js';
import { evaluate, CAT } from '../niveau-1/evaluator.js';

export const TYPES = {
  flush: { name: 'Tirage couleur', target: 'votre couleur', outs: 9 },
  oesd: { name: 'Quinte bilatérale', target: 'votre quinte', outs: 8 },
  gutshot: { name: 'Quinte ventrale', target: 'votre quinte', outs: 4 },
  combo: { name: 'Couleur + quinte bilatérale', target: 'votre couleur ou votre quinte', outs: 15 },
  flushGut: { name: 'Couleur + quinte ventrale', target: 'votre couleur ou votre quinte', outs: 12 },
  overcards: { name: 'Deux cartes hautes', target: 'une paire avec l\'une de vos cartes', outs: 6 },
  set: { name: 'Paire servie → brelan', target: 'votre brelan', outs: 2 },
};

// Explication courte de chaque type, pour la correction.
export const WHY = {
  flush: '13 cartes de la couleur, moins les 4 visibles : 9.',
  oesd: 'Quatre cartes qui se suivent, ouvertes des deux côtés : 2 rangs × 4 cartes = 8.',
  gutshot: 'Une seule carte manque au milieu de la quinte : 1 rang × 4 cartes = 4.',
  combo: '9 cartes pour la couleur + 8 pour la quinte, moins les 2 qui font les deux : 15.',
  flushGut: '9 cartes pour la couleur + 4 pour la quinte, moins celle qui fait les deux : 12.',
  overcards: '3 cartes restantes de chacun de vos deux rangs : 6.',
  set: 'Il reste 2 cartes de votre rang : 2.',
};

const card = (r, s) => ({ r, s });
const otherSuits = (s) => SUITS.filter((x) => x !== s);

// Cartes du tableau en plus, « neutres » : rangs absents, couleurs pas encore au tableau.
function fill(board, used, n, rand, forbidSuit) {
  const out = [...board];
  const pool = shuffle(deck(), rand);
  for (const c of pool) {
    if (out.length >= board.length + n) break;
    if ([...used, ...out].some((u) => u.r === c.r)) continue;                 // pas de paire
    if (c.s === forbidSuit) continue;
    if (out.some((u) => u.s === c.s && u.s !== forbidSuit)) continue;        // une seule carte par couleur adverse
    out.push(c);
  }
  return out;
}

// Ranges d'une quinte : low..low+3 (bilatérale) ou low..low+4 sans une carte du milieu (ventrale).
function straightRanks(kind, rand) {
  if (kind === 'oesd') { const low = int(2, 10, rand); return [low, low + 1, low + 2, low + 3]; }
  const low = int(2, 10, rand);
  const gap = int(1, 3, rand);
  return [0, 1, 2, 3, 4].filter((i) => i !== gap).map((i) => low + i);
}

function build(type, street, rand) {
  const nBoard = street === 'turn' ? 4 : 3;
  const s = pick(SUITS, rand);
  let hole;
  let board;
  if (type === 'flush') {
    const ranks = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], rand).slice(0, 4);
    hole = [card(ranks[0], s), card(ranks[1], s)];
    board = fill([card(ranks[2], s), card(ranks[3], s)], hole, nBoard - 2, rand, s);
  } else if (type === 'oesd' || type === 'gutshot' || type === 'combo' || type === 'flushGut') {
    const ranks = shuffle(straightRanks(type === 'oesd' || type === 'combo' ? 'oesd' : 'gut', rand), rand);
    const suited = type === 'combo' || type === 'flushGut';
    const suits = suited ? [s, s, s, s] : shuffle(SUITS, rand);     // sans couleur : 4 couleurs différentes
    const cards = ranks.map((r, i) => card(r, suits[i]));
    hole = cards.slice(0, 2);
    board = fill(cards.slice(2), hole, nBoard - 2, rand, suited ? s : null);
  } else if (type === 'overcards') {
    const top = shuffle([11, 12, 13, 14], rand).slice(0, 2);
    const [a, b] = shuffle(SUITS, rand);
    hole = [card(top[0], a), card(top[1], b)];
    const low = shuffle([2, 3, 4, 5, 6, 7, 8, 9], rand).slice(0, nBoard);
    const bs = shuffle(SUITS, rand);
    board = low.map((r, i) => card(r, bs[i]));
  } else {   // set
    const r = int(2, 10, rand);
    const [a, b] = shuffle(SUITS, rand);
    hole = [card(r, a), card(r, b)];
    const bs = shuffle(SUITS, rand);
    const ranks = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].filter((x) => x !== r), rand).slice(0, nBoard);
    board = ranks.map((x, i) => card(x, bs[i]));
  }
  return { hole, board };
}

// Les outs exacts, selon l'objectif du type.
export function countOuts(type, hole, board) {
  const seen = [...hole, ...board];
  const rest = deck().filter((c) => !seen.some((u) => sameCard(u, c)));
  if (type === 'overcards') return rest.filter((c) => hole.some((x) => x.r === c.r));
  if (type === 'set') return rest.filter((c) => c.r === hole[0].r);
  return rest.filter((c) => evaluate([...seen, c])[0] >= CAT.STRAIGHT);
}

function clean(type, hole, board) {
  const all = [...hole, ...board];
  const boardRanks = new Set(board.map((c) => c.r));
  if (boardRanks.size !== board.length) return false;                       // tableau apparié
  if (type !== 'set' && hole.some((c) => boardRanks.has(c.r))) return false; // paire déjà faite
  if (evaluate(all)[0] >= CAT.STRAIGHT) return false;                        // déjà fait
  if (type === 'overcards' && Math.max(...board.map((c) => c.r)) >= Math.min(...hole.map((c) => c.r))) return false;
  if (type === 'set' && hole.some((c) => boardRanks.has(c.r))) return false;
  if (type === 'overcards' || type === 'set') {
    // ni tirage couleur ni tirage quinte en plus : vérifié par l'évaluateur
    if (countOuts('flush', hole, board).length) return false;
  }
  return true;
}

// Une situation : { type, name, target, street, hole, board, outs: [cartes] }.
export function makeDraw(rand, { types = Object.keys(TYPES), street = 'mix' } = {}) {
  for (let tries = 0; tries < 2000; tries++) {
    const type = pick(types, rand);
    const st = street === 'mix' ? (rand() < 0.6 ? 'flop' : 'turn') : street;
    const { hole, board } = build(type, st, rand);
    if (board.length !== (st === 'turn' ? 4 : 3)) continue;
    if (!clean(type, hole, board)) continue;
    const outs = countOuts(type, hole, board);
    if (outs.length !== TYPES[type].outs) continue;
    return { type, ...TYPES[type], street: st, hole, board, outs };
  }
  throw new Error('aucune situation de tirage trouvée');
}
