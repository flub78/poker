// Niveau 6 : les « Règles du niveau 6 » du cours. Celles du niveau 5, plus, contre un adversaire
// sans profil marqué (moins de 30 mains observées, ou entre deux profils), un jeu équilibré :
//   Face à une mise (après le flop, seul contre le miseur) : continuer avec au moins la MDF de
//     sa range (C6.1) : MDF = pot ÷ (pot + mise), soit 75 % contre 1/3 du pot, 67 % contre 1/2,
//     60 % contre 2/3, 50 % contre le pot. On garde d'abord ses meilleures mains, puis ses tirages.
//   Mises à la river (seul contre un adversaire) : autant de bluffs que l'équité requise de
//     l'adversaire (C3.3) : à 2/3 du pot, 2 bluffs pour 5 mises de valeur. Les bluffs sont les
//     mains sans paire de sa range, tirages ratés d'abord.
// Contre un profil marqué (rock, station, maniaque, serré-agressif) : le niveau 5 (C6.4).
//
// « Sa range » : les mains que le joueur a pu jouer ainsi. Avant le flop, les listes du niveau 2
// selon son action ; ensuite, un call suppose une paire, un tirage ou deux cartes hautes.
// Choix déterministe (pas de tirage au sort) : chaque main de la range a une décision fixe, et
// la proportion est respectée sur l'ensemble de la range.
import { niveau5Decision } from './niveau5.js';
import { handClass } from './force.js';
import { handCode } from './preflop.js';
import { hasDraw } from './range.js';
import { openRange, RERAISE, CALL_IP, CALL_OOP } from '../../niveau-2/strategy.js';
import { range, has, ALL_HANDS } from '../../niveau-2/ranges.js';
import { evaluate, compare } from '../../niveau-1/evaluator.js';
import { deck, sameCard } from '../../js/cards.js';
import { positions, isBlind, bbText, potTotal } from '../positions.js';

const r = (code, texte) => ({ code, texte });
const pctText = (x) => `${String(Math.round(x)).replace('.', ',')} %`;
const inHand = (s) => s.dealt && !s.folded;
// Profil marqué : les quatre coins de C5.4, serré-agressif compris (choix du 2026-11-15 : contre un
// joueur serré-agressif, qui bluffe peu, la défense minimale perd de l'argent).
const MARKED = ['rock', 'station', 'maniaque', 'tag'];
const SMALL_PAIRS = range('petites paires', '66-22');

// Mains de départ que le joueur a pu jouer ainsi avant le flop (listes du niveau 2).
export function preflopRange(hand, seat) {
  const pre = hand.history.filter((e) => e.street === 'preflop' && e.type !== 'sb' && e.type !== 'bb');
  const mine = pre.filter((e) => e.seat === seat);
  const pos = positions(hand)[seat];
  const firstRaise = pre.findIndex((e) => e.type === 'raise');
  const myRaise = pre.findIndex((e) => e.seat === seat && e.type === 'raise');
  if (myRaise >= 0) return myRaise === firstRaise ? openRange(pos).set : RERAISE.set;
  if (mine.some((e) => e.type === 'call') && firstRaise >= 0) {
    return new Set([...(isBlind(pos) ? CALL_OOP : CALL_IP).set, ...SMALL_PAIRS.set]);
  }
  // BB qui checke : toutes les mains qu'elle n'a pas relancées.
  return new Set(ALL_HANDS.filter((c) => !has(openRange('BB'), c)));
}

// Combinaisons de la range du joueur, vues de ses propres yeux (ses cartes sont dans le paquet,
// le tableau non) : filtrées par ses calls au flop et au turn.
export function ownRange(hand, seat) {
  const start = preflopRange(hand, seat);
  const calls = ['flop', 'turn'].filter((st) => hand.history.some((e) => e.street === st && e.seat === seat && e.type === 'call'));
  const boardAt = { flop: hand.board.slice(0, 3), turn: hand.board.slice(0, 4) };
  const rest = deck().filter((c) => !hand.board.some((u) => sameCard(u, c)));
  const out = [];
  for (let i = 0; i < rest.length; i++) {
    for (let j = i + 1; j < rest.length; j++) {
      const hole = [rest[i], rest[j]];
      if (!start.has(handCode(hole))) continue;
      const kept = calls.every((st) => {
        const b = boardAt[st];
        return handClass(hole, b).cls !== 'rien' || hasDraw(hole, b) || (st === 'flop' && hole.every((c) => c.r > Math.max(...b.map((x) => x.r))));
      });
      if (kept) out.push(hole);
    }
  }
  return out;
}

// Rang d'une main pour la défense : d'abord les mains faites (une paire au moins avec ses
// cartes), par force ; puis les tirages ; puis le reste, par la plus haute carte.
function key(hole, board) {
  const made = handClass(hole, board).cls !== 'rien';
  const tier = made ? 2 : board.length < 5 && hasDraw(hole, board) ? 1 : 0;
  const high = hole.map((c) => c.r).sort((a, b) => b - a);
  return { tier, ev: made ? evaluate([...hole, ...board]) : null, high };
}
function cmp(a, b) {
  if (a.tier !== b.tier) return a.tier - b.tier;
  if (a.ev) { const c = compare(a.ev, b.ev); if (c) return c; }
  return a.high[0] - b.high[0] || a.high[1] - b.high[1];
}

// Part de la range qui fait mieux que la main du joueur (0 : sa meilleure main).
export function rankInRange(hand, seat) {
  const rg = ownRange(hand, seat);
  const mine = key(hand.seats[seat].hole, hand.board);
  let better = 0;
  for (const hole of rg) {
    const c = cmp(key(hole, hand.board), mine);
    if (c > 0) better++;
  }
  return { better: rg.length ? (100 * better) / rg.length : 0, size: rg.length };
}

export function niveau6Decision(hand, seat, legal) {
  const d = niveau5Decision(hand, seat, legal);
  d.facts.level = 6;
  if (hand.street === 'preflop' || d.facts.ajustement) return d;   // préflop, ou ajustement à un profil
  const opps = hand.seats.filter((o) => inHand(o) && o.seat !== seat);
  if (opps.length !== 1) return d;
  const villain = opps[0].seat;
  if (MARKED.includes(hand.reads?.profil(villain))) return d;      // profil marqué : niveau 5 (C6.4)
  const pot = potTotal(hand);
  const s = hand.seats[seat];
  const adjust = (key2, action, ...raisons) => {
    d.facts.ajustement = key2;
    d.action = action;
    d.raisons = raisons;
    return d;
  };

  if (legal.call) {
    // Face à une mise : MDF (C6.1). On ne jette jamais une main que le niveau 5 joue.
    if (d.action.type !== 'fold') return d;
    const mdf = (100 * (pot - legal.toCall)) / pot;
    const { better, size } = rankInRange(hand, seat);
    Object.assign(d.facts, { mdf, better });
    if (better < mdf && size) {
      return adjust('mdf', { type: 'call' },
        r('C6.1', `Défense minimale : face à cette mise, il faut continuer avec ${pctText(mdf)} de sa range ; ${d.facts.text}, votre main est dans les ${pctText(Math.max(better, 1))} meilleures (meilleures mains d'abord, puis tirages). On paie.`));
    }
    return d;
  }

  // À la river, personne n'a misé : mises équilibrées (C6.1, C3.3).
  if (hand.street !== 'river' || !legal.raise) return d;
  const board = hand.board;
  const rg = ownRange(hand, seat);
  const strong = (hole) => handClass(hole, board).cls === 'forte';
  const value = rg.filter(strong).length;
  const fraction = 2 / 3;
  const q = fraction / (1 + 2 * fraction);                   // équité requise de l'adversaire
  const nBluffs = Math.round((value * q) / (1 - q));
  const air = rg.filter((hole) => handClass(hole, board).cls === 'rien')
    .map((hole) => ({ hole, missed: hasDraw(hole, board.slice(0, 4)), high: Math.max(...hole.map((c) => c.r)) }))
    .sort((a, b) => (b.missed - a.missed) || (a.high - b.high));
  const isMine = (hole) => hole.every((c) => s.hole.some((u) => sameCard(u, c)));
  const bluffing = air.slice(0, nBluffs).some((x) => isMine(x.hole));
  const to = Math.min(Math.max(s.bet + Math.round(pot * fraction), legal.raise.min), legal.raise.max);
  Object.assign(d.facts, { valueCombos: value, bluffCombos: nBluffs });
  if (bluffing) {
    d.facts.motif = 'bluff';
    return adjust('equilibre', { type: 'raise', to },
      r('C6.1', `Mises équilibrées à la river : à 2/3 du pot, l'adversaire doit gagner ${pctText(100 * q)} du temps pour payer ; votre range mise ${value} mains de valeur, donc environ ${nBluffs} bluffs. Votre main en fait partie (sans paire${air.find((x) => isMine(x.hole))?.missed ? ', tirage raté' : ''}) : on bluffe.`),
      r(null, `Soit ${bbText(to, hand.bb)}.`));
  }
  if (d.action.type === 'raise' && d.facts.motif === 'bluff') {
    return adjust('equilibre', { type: 'check' },
      r('C6.1', `Mises équilibrées à la river : votre range a déjà assez de bluffs (${nBluffs} pour ${value} mises de valeur). Parole.`));
  }
  return d;
}
