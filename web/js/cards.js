// Cartes, paquet, générateur aléatoire reproductible et affichage.
import { CONFIG } from './config.js';
import { h } from './dom.js';

export const SUITS = ['S', 'H', 'D', 'C'];               // pique, cœur, carreau, trèfle
export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const RANK_CHAR = { 10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
const RANK_NAME = { 11: 'valet', 12: 'dame', 13: 'roi', 14: 'as' };
const SUIT_NAME = { S: 'pique', H: 'cœur', D: 'carreau', C: 'trèfle' };
const SUIT_SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' };

export const card = (r, s) => ({ r, s });
export const code = (c) => (RANK_CHAR[c.r] || String(c.r)) + c.s;
export const sameCard = (a, b) => a.r === b.r && a.s === b.s;

export function label(c) {
  return `${RANK_NAME[c.r] || c.r} de ${SUIT_NAME[c.s]}`;
}

export function short(c) {
  return `${c.r === 14 ? 'A' : c.r === 13 ? 'R' : c.r === 12 ? 'D' : c.r === 11 ? 'V' : c.r}${SUIT_SYMBOL[c.s]}`;
}

export function deck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push(card(r, s));
  return d;
}

// Générateur pseudo-aléatoire mulberry32 : une graine donne toujours le même tirage.
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newSeed() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}

export const pick = (arr, rand) => arr[Math.floor(rand() * arr.length)];
export const int = (min, max, rand) => min + Math.floor(rand() * (max - min + 1));

export function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- affichage ----------

export function cardImg(c, size = '') {
  return h('img', {
    class: `card ${size}`.trim(),
    src: `${CONFIG.cardsPath}${code(c)}.svg`,
    alt: label(c),
    title: label(c),
    draggable: 'false',
  });
}

export function backImg(size = '') {
  return h('img', {
    class: `card ${size}`.trim(),
    src: `${CONFIG.cardsPath}${CONFIG.cardBack}.svg`,
    alt: 'carte face cachée',
    draggable: 'false',
  });
}

export function cardRow(cards, size = '') {
  return h('div', { class: 'card-row' }, cards.map((c) => cardImg(c, size)));
}
