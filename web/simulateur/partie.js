// Une partie : suite de mains à 6, le bouton tourne, chaque main repart de 100 BB (décision D9).
// Le siège 0 est l'humain (en bas de l'écran) ; les sièges suivent le sens du jeu.
import { newHand, act } from './moteur/table.js';
import { decider } from './bots.js';
import { rng, int } from '../js/cards.js';

export const NAMES = ['Vous', 'Alix', 'Camille', 'Sacha', 'Dominique', 'Charlie'];
export const HUMAN = 0;

// botLevels : niveaux des 5 bots (sièges 1 à 5). seed : graine de la partie (au hasard si absente).
export function newGame({ botLevels = [2, 3, 2, 3, 2], humanLevel = 2, seed = null, bb = 2, stackBB = 100 } = {}) {
  const s = seed ?? Math.floor(Math.random() * 2 ** 31);
  const rand = rng(s);
  return {
    seed: s, rand, bb, stack: stackBB * bb, humanLevel,
    players: NAMES.map((name, i) => ({ name, human: i === HUMAN, level: i === HUMAN ? humanLevel : botLevels[i - 1] })),
    button: int(0, 5, rand) - 1,          // le premier startHand avance le bouton d'un siège
    handNo: 0, hand: null, totals: Array(6).fill(0),
  };
}

export function startHand(game) {
  game.button = (game.button + 1) % game.players.length;
  game.handNo++;
  game.hand = newHand({ stacks: game.players.map(() => game.stack), button: game.button, sb: game.bb / 2, bb: game.bb, rand: game.rand });
  return game.hand;
}

export const humanToAct = (game) => !!game.hand && !game.hand.done && game.hand.toAct === HUMAN;
export const botToAct = (game) => !!game.hand && !game.hand.done && game.hand.toAct !== HUMAN;

// Fait jouer le bot qui a la parole. Renvoie { seat, decision }.
export function playBot(game) {
  const seat = game.hand.toAct;
  const decision = decider(game.hand, seat, game.players[seat].level);
  play(game, decision.action);
  return { seat, decision };
}

// Joue une action pour le siège qui a la parole ; à la fin de la main, met à jour les totaux.
export function play(game, action) {
  act(game.hand, action);
  if (game.hand.done) game.hand.result.net.forEach((x, i) => { game.totals[i] += x; });
  return game.hand;
}
