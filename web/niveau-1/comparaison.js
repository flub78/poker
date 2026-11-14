// Test 5 : comparer deux mains de valeur proche (C1.3). Partie logique, sans DOM.
// JavaScript pur, testé sous Node (tests/existants/comparaison.test.js).
//
// Les questions portent là où un débutant hésite :
//   - « voisines » : deux combinaisons qui se suivent dans le classement (quinte ou couleur ?) ;
//   - « même combinaison » : le départage (kicker, seconde paire, brelan du full, quinte A-2-3-4-5) ;
//   - « égalité » : mêmes valeurs dans d'autres couleurs, le pot est partagé.
import { card, sameCard, shuffle, int, pick } from '../js/cards.js';
import { evaluate, compare, classOf, className, CAT } from './evaluator.js';
import { build } from './mains.js';

// Combinaisons voisines (de la plus forte à la plus faible), comparées entre elles.
export const VOISINES = [
  ['sf', 'quads'], ['quads', 'full'], ['full', 'flush'], ['flush', 'straight'],
  ['straight', 'trips'], ['trips', 'twopair'], ['twopair', 'pair'], ['pair', 'high'],
];

// Même combinaison : condition pour que le départage soit serré (sa, sb : scores de evaluate).
export const PROCHES = {
  pair: (a, b) => a[1] === b[1],                         // même paire : les kickers décident
  twopair: (a, b) => a[1] === b[1],                      // même paire haute
  trips: (a, b) => Math.abs(a[1] - b[1]) <= 2,
  straight: (a, b) => Math.abs(a[1] - b[1]) === 1,       // dont 5 contre 6 : la quinte A-2-3-4-5
  flush: (a, b) => a[1] === b[1],                        // même carte haute
  full: (a, b) => Math.sign(a[1] - b[1]) === -Math.sign(a[2] - b[2]),   // la paire « dit » l'inverse du brelan
  high: (a, b) => a[1] === b[1],
};

const disjoint = (a, b) => !a.some((x) => b.some((y) => sameCard(x, y)));
const NEXT_SUIT = { S: 'H', H: 'D', D: 'C', C: 'S' };

// Deux mains de 5 cartes sans carte commune, dont la première est de la combinaison idA.
function pairOf(idA, idB, rand, close = () => true) {
  for (;;) {
    const a = build(idA, rand);
    const b = build(idB, rand);
    if (disjoint(a, b) && close(evaluate(a), evaluate(b))) return [a, b];
  }
}

// Égalité : une quinte ou une carte haute, recopiée dans d'autres couleurs (rangs tous différents,
// donc aucune carte commune). Le décalage des couleurs ne crée pas de couleur.
function tie(rand) {
  const a = build(rand() < 0.5 ? 'straight' : 'high', rand);
  return [a, shuffle(a.map((c) => card(c.r, NEXT_SUIT[c.s])), rand)];
}

// Une question : { kind, a, b, answer } ; answer vaut 'A', 'B' ou '='.
function question(kind, arg, rand) {
  let hands;
  if (kind === 'voisines') hands = pairOf(arg[0], arg[1], rand);
  else if (kind === 'meme') hands = pairOf(arg, arg, rand, (x, y) => compare(x, y) !== 0 && PROCHES[arg](x, y));
  else hands = tie(rand);
  const [a, b] = rand() < 0.5 ? hands : [hands[1], hands[0]];
  const d = compare(evaluate(a), evaluate(b));
  return { kind, a, b, answer: d > 0 ? 'A' : d < 0 ? 'B' : '=' };
}

// Les questions d'un essai : 0 à 2 égalités, 4 ou 5 paires voisines, le reste dans la même
// combinaison ; jamais deux fois le même couple voisin ni la même combinaison.
export function questions(rand, n = 10) {
  const ties = int(0, 2, rand);
  const voisines = Math.min(int(4, 5, rand), n - ties);
  const memes = n - ties - voisines;
  const plan = [
    ...shuffle(VOISINES, rand).slice(0, voisines).map((p) => ['voisines', p]),
    ...shuffle(Object.keys(PROCHES), rand).slice(0, memes).map((id) => ['meme', id]),
    ...Array.from({ length: ties }, () => ['egalite', null]),
  ];
  return shuffle(plan, rand).map(([kind, arg]) => question(kind, arg, rand));
}

// Une question seule, pour l'exercice d'entraînement. type : 'tout' (mélange proche de celui du
// test), 'voisines' (combinaisons voisines) ou 'meme' (même combinaison, égalités comprises).
export const TYPES = ['tout', 'voisines', 'meme'];

export function oneQuestion(rand, type = 'tout') {
  const r = rand();
  if (type === 'voisines') return question('voisines', pick(VOISINES, rand), rand);
  if (type === 'meme') return r < 0.15 ? question('egalite', null, rand) : question('meme', pick(Object.keys(PROCHES), rand), rand);
  if (r < 0.1) return question('egalite', null, rand);
  return r < 0.55 ? question('voisines', pick(VOISINES, rand), rand) : question('meme', pick(Object.keys(PROCHES), rand), rand);
}

// ---------- explication de la correction ----------

const NOM = { 11: 'valet', 12: 'dame', 13: 'roi', 14: 'As' };
const nom = (r) => NOM[r] || String(r);
const RANG = ['', 'première', 'deuxième', 'troisième', 'quatrième', 'cinquième'];
const MASCULIN = ['quads', 'full', 'trips'];
const article = (id) => `${MASCULIN.includes(id) ? 'un' : 'une'} ${className(id).toLowerCase()}`;

// Pourquoi une main bat l'autre (ou pourquoi elles sont à égalité), en une phrase.
export function explanation(sa, sb) {
  const d = compare(sa, sb);
  if (d === 0) return 'Mêmes valeurs : la couleur (pique, cœur…) ne départage jamais, le pot est partagé.';
  const [hi, lo] = d > 0 ? [sa, sb] : [sb, sa];
  if (hi[0] !== lo[0]) {
    const phrase = `${article(classOf(hi))} bat toujours ${article(classOf(lo))}.`;
    return phrase[0].toUpperCase() + phrase.slice(1);
  }
  const i = hi.findIndex((x, k) => x !== lo[k]);
  const duel = `${nom(hi[i])} contre ${nom(lo[i])}`;
  switch (hi[0]) {
    case CAT.STRAIGHT_FLUSH: return `La quinte flush la plus haute gagne (${duel}).`;
    case CAT.QUADS: return i === 1 ? `Le carré le plus haut gagne (${duel}).` : `Même carré : la cinquième carte décide (${duel}).`;
    case CAT.FULL: return i === 1 ? `Dans un full, c'est le brelan qui décide (${duel}), pas la paire.` : `Même brelan : la paire décide (${duel}).`;
    case CAT.STRAIGHT: return `La quinte la plus haute gagne (hauteur ${duel})${lo[1] === 5 ? ' : dans A-2-3-4-5, l\'As compte pour 1, c\'est la plus petite quinte' : ''}.`;
    case CAT.TRIPS: return i === 1 ? `Le brelan le plus haut gagne (${duel}).` : `Même brelan : les cartes restantes décident (${duel}).`;
    case CAT.TWO_PAIR:
      if (i === 1) return `La paire la plus haute décide (${duel}).`;
      if (i === 2) return `Même paire haute : la seconde paire décide (${duel}).`;
      return `Mêmes paires : la cinquième carte (kicker) décide (${duel}).`;
    case CAT.PAIR: return i === 1 ? `La paire la plus haute gagne (${duel}).` : `Même paire : les autres cartes (kickers) départagent, la ${RANG[i - 1]} décide (${duel}).`;
    default: return `On compare les cartes une à une, de la plus haute à la plus basse : la ${RANG[i]} décide (${duel}).`;
  }
}
