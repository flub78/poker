// Notation des mains de départ et listes de mains (« ranges »).
// Une main de départ s'écrit 'AA' (paire), 'AKs' (assortie) ou 'AKo' (dépareillée).
// La grille 13 × 13 : ligne i, colonne j, rangs de A (0) à 2 (12).
//   i == j : paire ; i < j : assortie (au-dessus de la diagonale) ; i > j : dépareillée.
import { card, SUITS, shuffle } from '../js/cards.js';

export const ORDER = 'AKQJT98765432';
const VALUE = { A: 14, K: 13, Q: 12, J: 11, T: 10 };
const rankValue = (ch) => VALUE[ch] || Number(ch);
const idx = (ch) => ORDER.indexOf(ch);

export function cellCode(i, j) {
  if (i === j) return ORDER[i] + ORDER[i];
  return i < j ? `${ORDER[i]}${ORDER[j]}s` : `${ORDER[j]}${ORDER[i]}o`;
}

export function cellOf(code) {
  const a = idx(code[0]);
  const b = idx(code[1]);
  if (a === b) return [a, a];
  return code[2] === 's' ? [a, b] : [b, a];
}

export const ALL_HANDS = [];
for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) ALL_HANDS.push(cellCode(i, j));

export const combos = (code) => (code.length === 2 ? 6 : code[2] === 's' ? 4 : 12);
export const TOTAL_COMBOS = 1326;

// Nom lisible : 'AKs' → 'AKs', 'AKo' → 'AK dépareillé', 'AA' → 'AA'.
export function handName(code) {
  if (code.length === 2) return code;
  return code[2] === 's' ? code : `${code.slice(0, 2)} dépareillé`;
}

// Écriture courte du tutoriel : 'AKo' s'écrit 'AK'.
export const shortCode = (code) => (code[2] === 'o' ? code.slice(0, 2) : code);

// ---------- lecture d'une liste écrite comme dans le tutoriel ----------
// Jetons acceptés : 77+  JJ-66  AJ+  ATs+  AJo+  KQ  KQs  KQo

function expandToken(tok) {
  const t = tok.trim();
  const out = [];
  const pair = /^([AKQJT2-9])\1(\+)?$/.exec(t);
  if (pair) {
    const top = pair[2] ? 0 : idx(pair[1]);
    for (let i = top; i <= idx(pair[1]); i++) out.push(ORDER[i] + ORDER[i]);
    return out;
  }
  const pairRange = /^([AKQJT2-9])\1-([AKQJT2-9])\2$/.exec(t);
  if (pairRange) {
    const [hi, lo] = [idx(pairRange[1]), idx(pairRange[2])].sort((x, y) => x - y);
    for (let i = hi; i <= lo; i++) out.push(ORDER[i] + ORDER[i]);
    return out;
  }
  const two = /^([AKQJT2-9])([AKQJT2-9])([so])?(\+)?$/.exec(t);
  if (two && idx(two[1]) < idx(two[2])) {
    const kinds = two[3] ? [two[3]] : ['s', 'o'];
    const from = two[4] ? idx(two[1]) + 1 : idx(two[2]);
    for (let k = from; k <= idx(two[2]); k++) for (const s of kinds) out.push(`${two[1]}${ORDER[k]}${s}`);
    return out;
  }
  throw new Error(`Jeton de main non reconnu : « ${tok} »`);
}

// « JJ-66 » s'écrit « JJ à 66 » dans le tutoriel.
const readable = (text) => text.replace(/([AKQJT2-9])\1-([AKQJT2-9])\2/g, '$1$1 à $2$2');

// Une liste nommée : { name, text, tokens: [{ text, set }], set }
export function range(name, text) {
  const tokens = text.split(',').map((s) => s.trim()).filter(Boolean)
    .map((tok) => ({ text: tok, set: new Set(expandToken(tok)) }));
  const set = new Set(tokens.flatMap((tk) => [...tk.set]));
  return { name, text: readable(text), tokens: tokens.map((tk) => ({ ...tk, text: readable(tk.text) })), set };
}

// Réunion de plusieurs listes, en gardant les jetons de chacune pour les explications.
export function union(name, text, ...ranges) {
  const tokens = ranges.flatMap((r) => r.tokens);
  return { name, text, tokens, set: new Set(tokens.flatMap((tk) => [...tk.set])) };
}

export const has = (r, code) => r.set.has(code);
export const coveringToken = (r, code) => r.tokens.find((tk) => tk.set.has(code))?.text || null;

export function share(r) {
  let n = 0;
  for (const code of r.set) n += combos(code);
  return n / TOTAL_COMBOS;
}

export const percent = (r) => `${Math.round(share(r) * 100)} %`;

// ---------- cartes concrètes ----------

export function cardsFor(code, rand) {
  const a = rankValue(code[0]);
  const b = rankValue(code[1]);
  const suits = shuffle(SUITS, rand);
  if (code.length === 2) return [card(a, suits[0]), card(a, suits[1])];
  if (code[2] === 's') return [card(a, suits[0]), card(b, suits[0])];
  return [card(a, suits[0]), card(b, suits[1])];
}

// Tirage d'une main au hasard, pondéré par le nombre de combinaisons (comme une vraie donne).
export function randomHand(rand) {
  let x = Math.floor(rand() * TOTAL_COMBOS);
  for (const code of ALL_HANDS) {
    x -= combos(code);
    if (x < 0) return code;
  }
  return ALL_HANDS[ALL_HANDS.length - 1];
}

// Cases à la frontière d'un ensemble : une voisine (8 directions) n'a pas le même statut.
export function frontier(set) {
  const out = [];
  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 13; j++) {
      const inside = set.has(cellCode(i, j));
      let edge = false;
      for (let di = -1; di <= 1 && !edge; di++) {
        for (let dj = -1; dj <= 1 && !edge; dj++) {
          const x = i + di;
          const y = j + dj;
          if ((di || dj) && x >= 0 && x < 13 && y >= 0 && y < 13 && set.has(cellCode(x, y)) !== inside) edge = true;
        }
      }
      if (edge) out.push(cellCode(i, j));
    }
  }
  return out;
}
