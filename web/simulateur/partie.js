// Une partie : suite de mains à 6, le bouton tourne, chaque main repart de 100 BB (décision D9).
// Le siège 0 est l'humain (en bas de l'écran) ; les sièges suivent le sens du jeu.
//
// Chaque décision (humain et bots) est jugée au moment où elle est jouée et rangée dans
// game.decisions, pour l'évaluation de fin de partie (evaluation.js). Chaque main a sa graine :
// replayHand() la redonne à l'identique (mêmes cartes, même bouton) ; une main rejouée ne compte
// ni dans les gains ni dans l'évaluation.
import { newHand, act, legalActions } from './moteur/table.js';
import { decider } from './bots.js';
import { judge } from './mentor.js';
import { costOf, judgeLevel } from './evaluation.js';
import { positions } from './positions.js';
import { rng, int } from '../js/cards.js';

export const NAMES = ['Vous', 'Alix', 'Camille', 'Sacha', 'Dominique', 'Charlie'];
export const HUMAN = 0;

// botLevels : niveaux des 5 bots (sièges 1 à 5). seed : graine de la partie (au hasard si absente).
// maxHands : nombre de mains de la partie (0 : sans limite).
export function newGame({ botLevels = [2, 3, 2, 3, 2], humanLevel = 2, seed = null, maxHands = 0, bb = 2, stackBB = 100 } = {}) {
  const s = seed ?? Math.floor(Math.random() * 2 ** 31);
  const rand = rng(s);
  return {
    seed: s, rand, bb, stack: stackBB * bb, humanLevel, maxHands,
    players: NAMES.map((name, i) => ({ name, human: i === HUMAN, level: i === HUMAN ? humanLevel : botLevels[i - 1] })),
    button: int(0, 5, rand) - 1,          // le premier startHand avance le bouton d'un siège
    handNo: 0, hand: null, totals: Array(6).fill(0),
    deals: [],                            // { no, seed, button } de chaque main, pour la rejouer
    finished: [],                         // { no, replay, hand } des mains terminées
    decisions: [],
  };
}

function deal(game, { no, seed, button }, replay) {
  game.hand = newHand({ stacks: game.players.map(() => game.stack), button, sb: game.bb / 2, bb: game.bb, rand: rng(seed) });
  game.hand.no = no;
  game.hand.replay = replay;
  return game.hand;
}

export function startHand(game) {
  game.button = (game.button + 1) % game.players.length;
  game.handNo++;
  const d = { no: game.handNo, seed: Math.floor(game.rand() * 2 ** 31), button: game.button };
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
    if (!hand.replay) hand.result.net.forEach((x, i) => { game.totals[i] += x; });
  }
  return hand;
}

function record(game, action, meta) {
  const hand = game.hand;
  const seat = hand.toAct;
  const legal = legalActions(hand);
  const advice = decider(hand, seat, judgeLevel(game.players[seat]));
  const j = judge(hand, action, advice, legal);
  game.decisions.push({
    hand: hand.no, replay: hand.replay, seat, street: hand.street, pos: positions(hand)[seat],
    hole: hand.seats[seat].hole.slice(), board: hand.board.slice(),
    human: j.human, advised: j.advised, verdict: j.verdict, why: j.why, raisons: j.raisons, level: j.level,
    ...costOf(hand, action, advice, legal), ...meta,
  });
}
