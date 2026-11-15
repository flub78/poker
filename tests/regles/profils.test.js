// Bots à profil (web/simulateur/regles/profils.js) : rock, calling station, maniaque (C5.4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newHand, act } from '../../web/simulateur/moteur/table.js';
import { decider, BOT_CHOICES, botLabel, isProfil } from '../../web/simulateur/bots.js';
import { playerStats, profile, evaluateGame } from '../../web/simulateur/evaluation.js';
import { newGame, startHand, playBot, play, humanToAct } from '../../web/simulateur/partie.js';
import { legalActions } from '../../web/simulateur/moteur/table.js';
import { rng } from '../../web/js/cards.js';
import { cartes } from '../aide.js';

// Table à 6, bouton au siège 0 : SB 1, BB 2, UTG 3, MP 4, CO 5.
function table(holes = {}, board = []) {
  const h = Array(6).fill(null);
  for (const [seat, t] of Object.entries(holes)) h[seat] = cartes(t);
  return newHand({ stacks: Array(6).fill(200), button: 0, rand: rng(1), preset: { holes: h, board: cartes(board.join(' ')) } });
}
const F = { type: 'fold' };
const C = { type: 'call' };
const X = { type: 'check' };
const R = (to) => ({ type: 'raise', to });
const play2 = (h, ...a) => { for (const x of a) act(h, x); return h; };
const kind = (h, seat, p) => decider(h, seat, p).action.type;

test('choix des adversaires : niveaux puis profils', () => {
  assert.deepEqual(BOT_CHOICES, [2, 3, 4, 5, 6, 'rock', 'station', 'maniaque']);
  assert.equal(botLabel('station'), 'Calling station (large-passif)');
  assert.equal(botLabel(3), 'Niveau 3');
  assert.ok(isProfil('rock') && !isProfil(4) && !isProfil('toString'));
  assert.equal(decider(table({ 3: 'AS AD' }), 3, 'rock').rules, 'Rock');
});

test('avant le flop, personne n\'a relancé (UTG parle)', () => {
  // Rock : la liste UTG, en suivant ; il relance seulement KK+.
  assert.equal(kind(table({ 3: '9S 9D' }), 3, 'rock'), 'call');
  assert.equal(kind(table({ 3: 'KS 7D' }), 3, 'rock'), 'fold');
  assert.deepEqual(decider(table({ 3: 'AS AD' }), 3, 'rock').action, R(5));
  // Calling station : large, en suivant.
  assert.equal(kind(table({ 3: 'KS 7D' }), 3, 'station'), 'call');
  assert.equal(kind(table({ 3: '7S 2D' }), 3, 'station'), 'fold');
  // Maniaque : relance large, 3 BB.
  assert.deepEqual(decider(table({ 3: '8S 7S' }), 3, 'maniaque').action, R(6));
  assert.equal(kind(table({ 3: '7S 2D' }), 3, 'maniaque'), 'fold');
});

test('avant le flop, face à une relance', () => {
  const h = play2(table({ 4: 'KS 7D' }), R(5));                 // UTG relance, MP parle
  assert.equal(kind(h, 4, 'station'), 'call');
  assert.equal(kind(h, 4, 'rock'), 'fold');
  assert.equal(kind(h, 4, 'maniaque'), 'call');
  const h2 = play2(table({ 4: 'AS TD' }), R(5));
  assert.deepEqual(decider(h2, 4, 'maniaque').action, R(15));   // sur-relance à 3 fois
});

// UTG (3) relance à 5, la BB (2) paie : flop, pot 11, la BB parle la première.
const utgVsBB = (holes, board) => play2(table(holes, board), R(5), F, F, F, F, C);

test('après le flop : chacun son style', () => {
  const board = ['KH', '7D', '2C'];
  // Personne n'a misé : le maniaque mise même sans rien ; les passifs checkent sans main forte.
  assert.equal(kind(utgVsBB({ 2: '9S 8S' }, board), 2, 'maniaque'), 'raise');
  assert.equal(kind(utgVsBB({ 2: 'KS QD' }, board), 2, 'station'), 'check');
  assert.equal(kind(utgVsBB({ 2: 'KS 7S' }, board), 2, 'rock'), 'raise');      // deux paires : il mise
  // Face à une mise : la station paie une petite paire, le rock la jette.
  const bet = (hole) => play2(utgVsBB({ 2: hole }, board), X, R(6));
  assert.equal(kind(bet('7S 6S'), 2, 'station'), 'call');
  assert.equal(kind(bet('7S 6S'), 2, 'rock'), 'fold');
  assert.equal(kind(bet('KS 9D'), 2, 'rock'), 'call');
  assert.equal(kind(bet('KS 9D'), 2, 'maniaque'), 'raise');
  assert.equal(kind(bet('QS JD'), 2, 'station'), 'fold');                      // ni paire ni tirage
});

test('sur une longue partie, chaque bot tombe dans son profil de C5.4', () => {
  const levels = [4, 'rock', 'station', 'maniaque', 'rock', 'station'];
  const rand = rng(7);
  const hands = [];
  for (let k = 0; k < 3000; k++) {
    const h = newHand({ stacks: Array(6).fill(200), button: k % 6, rand });
    while (!h.done) act(h, decider(h, h.toAct, levels[h.toAct]).action);
    hands.push(h);
  }
  const prof = (seat) => profile(playerStats(hands, seat));
  assert.equal(prof(0), 'serré-agressif');
  assert.equal(prof(1), 'serré-passif');
  assert.equal(prof(2), 'large-passif');
  assert.equal(prof(3), 'large-agressif');
});

test('une partie avec des bots à profil se joue et s\'évalue', () => {
  const g = newGame({ seed: 5, botLevels: ['rock', 'station', 'maniaque', 3, 4], maxHands: 40 });
  for (let i = 0; i < 40; i++) {
    startHand(g);
    while (!g.hand.done) {
      if (humanToAct(g)) play(g, legalActions(g.hand).check ? X : C);
      else playBot(g);
    }
  }
  assert.equal(g.totals.reduce((a, b) => a + b, 0), 0);
  const ev = evaluateGame(g);
  assert.match(ev.comments.bots[0], /Rock, profil voulu serré-passif/);
});
