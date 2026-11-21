// Une partie : suite de mains à 6, le bouton tourne. Tapis (décision D9) : par défaut, chaque main
// repart de 100 BB ; avec keepStacks, chacun garde son tapis d'une main à l'autre, et un joueur
// à zéro se recave de 100 BB au début de la main suivante (personne n'est éliminé). Pour garder
// les tapis d'une partie à l'autre, newGame reçoit ceux de la partie précédente (carriedStacks).
// Le siège 0 est l'humain (en bas de l'écran) ; les sièges suivent le sens du jeu.
//
// Chaque décision (humain et bots) est jugée au moment où elle est jouée et rangée dans
// game.decisions, pour l'évaluation de fin de partie (evaluation.js). Chaque main a sa graine :
// replayHand() la redonne à l'identique (mêmes cartes, même bouton) ; une main rejouée ne compte
// ni dans les gains, ni dans l'évaluation, ni dans la lecture des joueurs (game.reads).
import { newHand, act, legalActions } from './moteur/table.js';
import { decider } from './bots.js';
import { judgeMove } from './mentor.js';
import { costOf, judgeLevel, judgeStep } from './evaluation.js';
import { positions } from './positions.js';
import { createReads } from './lecture.js';
import { rng, int } from '../js/cards.js';

export const NAMES = ['Vous', 'Alix', 'Camille', 'Sacha', 'Dominique', 'Charlie'];
export const HUMAN = 0;

// botLevels : niveaux des 5 bots (sièges 1 à 5). seed : graine de la partie (au hasard si absente).
// maxHands : nombre de mains de la partie (0 : sans limite).
// humanStep : sous-niveau 2.N de l'humain (étape N de la grille) quand il joue au niveau 2 ; null sinon.
// keepStacks : tapis conservés d'une main à l'autre, recave à zéro (false : 100 BB à chaque main).
// stacks, rebuys : tapis (en jetons) et recaves de départ, repris d'une partie précédente
// (carriedStacks) ; seulement avec keepStacks.
export function newGame({ botLevels = [2, 3, 2, 3, 2], humanLevel = 2, humanStep = null, seed = null, maxHands = 0, bb = 2, stackBB = 100, keepStacks = false, stacks = null, rebuys = null } = {}) {
  const s = seed ?? Math.floor(Math.random() * 2 ** 31);
  const rand = rng(s);
  return {
    seed: s, rand, bb, stack: stackBB * bb, humanLevel, maxHands, keepStacks,
    stacks: keepStacks && stacks ? stacks.slice() : Array(6).fill(stackBB * bb), // tapis en fin de dernière main jouée (keepStacks)
    rebuys: keepStacks && rebuys ? rebuys.slice() : Array(6).fill(0),             // nombre de recaves de chaque joueur
    players: NAMES.map((name, i) => ({ name, human: i === HUMAN, level: i === HUMAN ? humanLevel : botLevels[i - 1], step: i === HUMAN ? humanStep : null })),
    button: int(0, 5, rand) - 1,          // le premier startHand avance le bouton d'un siège
    handNo: 0, hand: null, totals: Array(6).fill(0),
    deals: [],                            // { no, seed, button, stacks, rebuys } de chaque main, pour la rejouer
    finished: [],                         // { no, replay, hand } des mains terminées
    decisions: [],
    reads: createReads(6),                // statistiques de chaque joueur au fil des mains (lecture.js)
  };
}

// Tapis conservés d'une partie à l'autre. carry(game) : ce qu'on enregistre en fin de main
// (tapis, recaves et niveau de chaque siège). carriedStacks(saved, levels, stackChips) : les tapis
// et recaves de départ de la partie suivante ; levels : niveaux des 6 sièges (humain en 0). Un
// siège dont le bot a changé de niveau accueille un nouveau joueur : 100 BB, aucune recave. Votre
// siège garde son tapis même si vous changez de niveau. saved absent ou abîmé : tout le monde à 100 BB.
export const carry = (game) => ({ stacks: game.stacks.slice(), rebuys: game.rebuys.slice(), levels: game.players.map((p) => p.level) });

export function carriedStacks(saved, levels, stackChips) {
  const ok = (a) => Array.isArray(a) && a.length === levels.length;
  if (!saved || !ok(saved.stacks) || !ok(saved.rebuys) || !ok(saved.levels)) {
    return { stacks: levels.map(() => stackChips), rebuys: levels.map(() => 0) };
  }
  const same = (i) => i === HUMAN || saved.levels[i] === levels[i];
  const valid = (x) => Number.isFinite(x) && x >= 0;
  return {
    stacks: levels.map((_, i) => (same(i) && valid(saved.stacks[i]) ? saved.stacks[i] : stackChips)),
    rebuys: levels.map((_, i) => (same(i) && valid(saved.rebuys[i]) ? saved.rebuys[i] : 0)),
  };
}

function deal(game, { no, seed, button, stacks, rebuys }, replay) {
  game.hand = newHand({ stacks: stacks.slice(), button, sb: game.bb / 2, bb: game.bb, rand: rng(seed) });
  game.hand.no = no;
  game.hand.rebuys = rebuys;              // sièges recavés au début de cette main
  game.hand.replay = replay;
  game.hand.reads = game.reads;           // ce que les bots savent des autres joueurs (niveau 5)
  return game.hand;
}

export function startHand(game) {
  game.button = (game.button + 1) % game.players.length;
  game.handNo++;
  const rebuys = game.keepStacks ? game.stacks.flatMap((x, i) => (x > 0 ? [] : [i])) : [];
  rebuys.forEach((i) => { game.rebuys[i]++; });
  const stacks = game.keepStacks ? game.stacks.map((x) => (x > 0 ? x : game.stack)) : game.players.map(() => game.stack);
  const d = { no: game.handNo, seed: Math.floor(game.rand() * 2 ** 31), button: game.button, stacks, rebuys };
  game.deals.push(d);
  return deal(game, d, false);
}

// Redonne la main n° no (mêmes cartes, même bouton) sans avancer la partie.
export function replayHand(game, no) {
  const d = game.deals.find((x) => x.no === no);
  if (!d) throw new Error(`Main ${no} inconnue.`);
  return deal(game, d, true);
}

export const humanToAct = (game) => !!game.hand && !game.hand.done && game.hand.toAct === HUMAN;
export const botToAct = (game) => !!game.hand && !game.hand.done && game.hand.toAct !== HUMAN;
// La partie est finie quand sa dernière main est jouée (une main rejouée ne compte pas).
export const gameOver = (game) => game.maxHands > 0 && game.handNo >= game.maxHands && !!game.hand?.done;

// Fait jouer le bot qui a la parole. Renvoie { seat, decision }.
export function playBot(game) {
  const seat = game.hand.toAct;
  const decision = decider(game.hand, seat, game.players[seat].level);
  play(game, decision.action);
  return { seat, decision };
}

// Juge puis joue une action pour le siège qui a la parole. meta : { mentor: 'confirmé' | 'repris' }.
export function play(game, action, meta = {}) {
  record(game, action, meta);
  act(game.hand, action);
  const hand = game.hand;
  if (hand.done) {
    game.finished.push({ no: hand.no, replay: hand.replay, hand });
    if (!hand.replay) {
      hand.result.net.forEach((x, i) => { game.totals[i] += x; });
      game.stacks = hand.seats.map((x) => x.stack);
      game.reads.add(hand);
    }
  }
  return hand;
}

function record(game, action, meta) {
  const hand = game.hand;
  const seat = hand.toAct;
  const legal = legalActions(hand);
  const { j, advice } = judgeMove(hand, action, judgeLevel(game.players[seat]), judgeStep(game.players[seat]));
  game.decisions.push({
    hand: hand.no, replay: hand.replay, seat, street: hand.street, pos: positions(hand)[seat],
    hole: hand.seats[seat].hole.slice(), board: hand.board.slice(),
    human: j.human, advised: j.advised, verdict: j.verdict, why: j.why, raisons: j.raisons, level: j.level,
    avance: j.avance?.rules ?? null,
    ...costOf(hand, action, advice, legal), ...meta,
  });
}
