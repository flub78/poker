// Range adverse à la river (C5.1), pour le niveau 5 : « classez sa range en trois catégories
// (forte, moyenne, bluff). Payez si la part de bluffs dépasse l'équité requise (C3.3) ».
//
// La range est construite en trois temps, comme le cours le décrit :
//   1. avant le flop : les meilleures mains, en proportion de ce que le joueur joue — son PFR
//      s'il a relancé, son VPIP s'il a suivi (lecture.js) ; sans lecture, 15 % et 20 % ;
//   2. au flop et au turn : un call d'une mise suppose une paire, un tirage ou deux cartes hautes ;
//   3. à la river, il mise : chaque main restante est classée forte (deux paires ou mieux avec
//      ses cartes), moyenne (une paire) ou bluff (moins), puis pondérée par la chance qu'il la
//      mise, selon son profil (un rock et une calling station ne bluffent pas ; un maniaque mise
//      tout ; un joueur serré-agressif ou inconnu bluffe ses tirages ratés).
// Les mains de départ sont rangées par la formule de Chen (Bill Chen), un classement simple et
// connu des forces avant le flop.
import { handClass } from './force.js';
import { evaluate, compare } from '../../niveau-1/evaluator.js';
import { handCode } from './preflop.js';
import { deck, sameCard } from '../../js/cards.js';
import { ALL_HANDS, combos } from '../../niveau-2/ranges.js';
import { MIN_HANDS } from '../lecture.js';

const VALUE = { A: 14, K: 13, Q: 12, J: 11, T: 10 };
const rv = (ch) => VALUE[ch] || Number(ch);

// Formule de Chen : points de la plus haute carte, doublés pour une paire, +2 assorties, moins
// l'écart entre les cartes, +1 pour les petites mains connectées.
export function chen(code) {
  const [a, b] = [rv(code[0]), rv(code[1])];
  const base = { 14: 10, 13: 8, 12: 7, 11: 6 }[a] ?? a / 2;
  if (a === b) return Math.max(5, base * 2);
  let s = base + (code[2] === 's' ? 2 : 0);
  const gap = a - b - 1;
  s -= [0, 1, 2, 4][gap] ?? 5;
  if (gap <= 1 && a < 12) s += 1;
  return s;
}
const RANKED = ALL_HANDS.slice().sort((x, y) => chen(y) - chen(x) || combos(y) - combos(x));

// Les meilleures mains de départ couvrant `pct` % des 1 326 combinaisons.
export function topRange(pct) {
  const set = new Set();
  let n = 0;
  for (const code of RANKED) {
    if (n >= (1326 * pct) / 100) break;
    set.add(code);
    n += combos(code);
  }
  return set;
}

// Tirage couleur ou quinte (quatre cartes), avec au moins une carte du joueur. Rapide, sans
// énumération : sert à filtrer des centaines de mains.
export function hasDraw(hole, board) {
  const all = [...hole, ...board];
  for (const suit of 'SHDC') {
    if (all.filter((c) => c.s === suit).length >= 4 && hole.some((c) => c.s === suit)) return true;
  }
  const ranks = new Set(all.flatMap((c) => (c.r === 14 ? [14, 1] : [c.r])));
  const mine = new Set(hole.flatMap((c) => (c.r === 14 ? [14, 1] : [c.r])));
  for (let low = 1; low <= 10; low++) {
    const w = [0, 1, 2, 3, 4].map((k) => low + k);
    if (w.filter((x) => ranks.has(x)).length >= 4 && w.some((x) => mine.has(x))) return true;
  }
  return false;
}

// Poids d'une main misée à la river selon sa catégorie et le profil du joueur.
function betWeight(cat, profil, missedDraw) {
  if (cat === 'forte') return 1;
  if (profil === 'maniaque') return 1;
  if (cat === 'moyenne') return 0;
  if (profil === 'rock') return 0;
  if (profil === 'station') return 0.02;
  return missedDraw ? 1 : 0.1;                       // serré-agressif ou inconnu
}

// Range du joueur `villain` qui mise à la river, vue par `hero`.
// Renvoie { forte, moyenne, bluff } (parts en %), battues (part de la range que la main de `hero`
// bat : les bluffs et les mains moyennes plus faibles ; une égalité compte pour moitié),
// combos (nombre de mains restantes), profil.
export function riverRange(hand, hero, villain) {
  const reads = hand.reads;
  const st = reads?.stats(villain);
  const known = st && st.hands >= MIN_HANDS;
  const profil = reads?.profil(villain) ?? null;
  const pre = hand.history.filter((e) => e.street === 'preflop' && e.seat === villain);
  const raised = pre.some((e) => e.type === 'raise');
  const pct = known ? (raised ? st.pfr : st.vpip) : (raised ? 15 : 20);
  const start = topRange(Math.max(pct, 3));
  const callStreets = ['flop', 'turn'].filter((s) => hand.history.some((e) => e.street === s && e.seat === villain && e.type === 'call'));
  const boardAt = { flop: hand.board.slice(0, 3), turn: hand.board.slice(0, 4) };

  const seen = [...hand.seats[hero].hole, ...hand.board];
  const rest = deck().filter((c) => !seen.some((u) => sameCard(u, c)));
  const w = { forte: 0, moyenne: 0, bluff: 0 };
  const mine = evaluate([...hand.seats[hero].hole, ...hand.board]);
  let beaten = 0;
  let n = 0;
  for (let i = 0; i < rest.length; i++) {
    for (let j = i + 1; j < rest.length; j++) {
      const hole = [rest[i], rest[j]];
      if (!start.has(handCode(hole))) continue;
      // Un call au flop ou au turn suppose une paire, un tirage ou deux cartes hautes.
      const kept = callStreets.every((s) => {
        const b = boardAt[s];
        return handClass(hole, b).cls !== 'rien' || hasDraw(hole, b) || (s === 'flop' && hole.every((c) => c.r > Math.max(...b.map((x) => x.r))));
      });
      if (!kept) continue;
      n++;
      const cls = handClass(hole, hand.board).cls;
      const cat = cls === 'forte' ? 'forte' : cls === 'rien' ? 'bluff' : 'moyenne';
      const weight = betWeight(cat, profil, cat === 'bluff' && hasDraw(hole, boardAt.turn));
      w[cat] += weight;
      if (weight) {
        const c = compare(mine, evaluate([...hole, ...hand.board]));
        beaten += c > 0 ? weight : c === 0 ? weight / 2 : 0;
      }
    }
  }
  const total = w.forte + w.moyenne + w.bluff;
  const pctOf = (x) => (total ? (100 * x) / total : 0);
  return { forte: pctOf(w.forte), moyenne: pctOf(w.moyenne), bluff: pctOf(w.bluff), battues: pctOf(beaten), combos: n, profil };
}
