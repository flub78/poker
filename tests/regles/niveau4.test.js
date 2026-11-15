// Règles du niveau 4 après le flop (web/simulateur/regles/postflop4.js) : une règle par test,
// telles que le cours les donne en tête du niveau 4.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newHand, act, legalActions } from '../../web/simulateur/moteur/table.js';
import { decider, playLevel, BOT_LEVELS } from '../../web/simulateur/bots.js';
import { judge } from '../../web/simulateur/mentor.js';
import { texture, context } from '../../web/simulateur/regles/postflop4.js';
import { strength, drawOuts } from '../../web/simulateur/regles/force.js';
import { rng } from '../../web/js/cards.js';
import { cartes } from '../aide.js';

// Table à 6, bouton au siège 0 : SB 1, BB 2, UTG 3, MP 4, CO 5.
function table(holes = {}, board = [], stack = 200) {
  const h = Array(6).fill(null);
  for (const [seat, t] of Object.entries(holes)) h[seat] = cartes(t);
  return newHand({ stacks: Array(6).fill(stack), button: 0, rand: rng(1), preset: { holes: h, board: cartes(board.join(' ')) } });
}
const F = { type: 'fold' };
const C = { type: 'call' };
const X = { type: 'check' };
const R = (to) => ({ type: 'raise', to });
const play = (h, ...a) => { for (const x of a) act(h, x); return h; };
const texte = (d) => d.raisons.map((x) => x.texte).join(' ');
// Le CO (5) relance à 5, la BB (2) paie : flop, pot 11, la BB parle la première.
const coVsBB = (holes, board, stack) => play(table(holes, board, stack), F, F, R(5), F, F, C);

test('niveaux 2 à 6 disponibles pour les bots', () => {
  assert.deepEqual(BOT_LEVELS, [2, 3, 4, 5, 6]);
  assert.equal(playLevel(7), 6);
  assert.equal(playLevel(1), 2);
});

test('texture du flop (C4.2)', () => {
  assert.equal(texture(cartes('KS 7D 2C')), 'sec');
  assert.equal(texture(cartes('AS 9D 5C')), 'sec');
  assert.equal(texture(cartes('9S 9D 4C')), 'apparie');
  assert.equal(texture(cartes('JH TH 8C')), 'humide');
  assert.equal(texture(cartes('7S 5D 2C')), 'humide');            // bas
  assert.equal(texture(cartes('QH 8H 3H')), 'monotone');
});

test('force : top paire bon kicker (valet ou mieux), paire servie au-dessus, deux paires, quinte', () => {
  const b = cartes('KH 7D 2C');
  assert.equal(strength(cartes('KS QD'), b), 'top-bon');
  assert.equal(strength(cartes('KS 9D'), b), 'top');
  assert.equal(strength(cartes('AS AD'), b), 'top-bon');
  assert.equal(strength(cartes('KS 7S'), b), 'deux-paires');
  assert.equal(strength(cartes('6S 5S'), cartes('4H 3D 2C')), 'quinte');
  assert.equal(drawOuts(cartes('AH 8H'), cartes('KH 7H 2C')), 9);
  assert.equal(drawOuts(cartes('AS KD'), cartes('9H 6C 2S')), 0);      // deux cartes hautes : pas un tirage
});

test('vous avez suivi avant le flop : parole, le relanceur parle après vous', () => {
  const h = coVsBB({ 2: 'KS QD' }, ['KH', '7D', '2C']);
  const d = decider(h, 2, 4);
  assert.deepEqual(d.action, X);
  assert.match(texte(d), /laissez miser le relanceur/);
  assert.equal(context(h, 2).aggressor, 5);
});

test('c-bet sur flop sec : toujours, 1/3 du pot, même sans rien', () => {
  const h = play(coVsBB({ 5: '6S 5D' }, ['KH', '7D', '2C']), X);
  assert.deepEqual(decider(h, 5, 4).action, R(4));                    // 11 / 3 ≈ 4
  assert.equal(decider(h, 5, 4).facts.motif, 'bluff');
});

test('flop coordonné : 2/3 du pot avec top paire ou un tirage de 8 outs, sinon parole', () => {
  let h = play(coVsBB({ 5: 'QS JD' }, ['JH', 'TH', '8C']), X);
  assert.deepEqual(decider(h, 5, 4).action, R(7));                    // 2/3 de 11
  h = play(coVsBB({ 5: 'AS 5D' }, ['JH', 'TH', '8C']), X);
  assert.deepEqual(decider(h, 5, 4).action, X);
  h = play(coVsBB({ 5: 'TS 9S' }, ['8H', '7C', '2D']), X);             // flop bas, quinte bilatérale
  const d = decider(h, 5, 4);
  assert.deepEqual(d.action, R(7));
  assert.equal(d.facts.motif, 'semi-bluff');
});

test('flop monotone : 1/3 avec une carte de la couleur, parole sans', () => {
  let h = play(coVsBB({ 5: 'AS KD' }, ['QH', '8H', '3H']), X);
  assert.deepEqual(decider(h, 5, 4).action, X);
  h = play(coVsBB({ 5: 'AH KD' }, ['QH', '8H', '3H']), X);
  assert.deepEqual(decider(h, 5, 4).action, R(4));
});

test('plusieurs adversaires : mise seulement avec top paire bon kicker ou mieux, 1/2 pot', () => {
  // CO relance, BTN et BB paient : pot 16.
  const multi = (hole) => play(table({ 5: hole }, ['KH', '7D', '2C']), F, F, R(5), C, F, C, X);
  assert.deepEqual(decider(multi('6S 5D'), 5, 4).action, X);
  assert.deepEqual(decider(multi('AS KD'), 5, 4).action, R(8));
});

test('le relanceur fait parole, vous parlez après lui : 1/2 pot avec top paire ou mieux', () => {
  // CO relance, le BTN (0) paie, les blinds se couchent : pot 13 ; le CO checke.
  const h = play(table({ 0: 'KS 9D' }, ['KH', '7D', '2C']), F, F, R(5), C, F, F, X);
  assert.deepEqual(decider(h, 0, 4).action, R(7));
});

test('turn : 2/3 du pot avec top paire bon kicker, parole avec un kicker faible', () => {
  const turn = (hole) => play(coVsBB({ 5: hole }, ['KH', '7D', '2C', '4S']), X, R(4), C, X);
  assert.deepEqual(decider(turn('KS QD'), 5, 4).action, R(13));       // pot 19
  assert.deepEqual(decider(turn('KS 9D'), 5, 4).action, X);
});

test('river : main forte mise 2/3 ; tirage raté bluffe après avoir misé flop et turn', () => {
  const river = (hole, board) => play(coVsBB({ 5: hole }, board), X, R(4), C, X, R(13), C, X);
  let d = decider(river('AH 8H', ['KH', '7H', '2C', '4S', '9D']), 5, 4);   // pot 45
  assert.deepEqual(d.action, R(30));
  assert.equal(d.facts.motif, 'bluff');
  d = decider(river('KS 7S', ['KH', '7D', '2C', '4S', '9D']), 5, 4);
  assert.deepEqual(d.action, R(30));
  assert.equal(d.facts.motif, 'valeur');
  d = decider(river('KS QD', ['KH', '7D', '2C', '4S', '9D']), 5, 4);       // une paire : parole
  assert.deepEqual(d.action, X);
});

test('river, face à une mise : une paire paie au plus 1/2 pot', () => {
  const base = () => play(coVsBB({ 2: 'KS 9D' }, ['KH', '7D', '2C', '4S', '8C']), X, X, X, X, X);
  assert.deepEqual(decider(play(base(), R(5)), 2, 4).action, C);       // 5 dans 11 : moins de la moitié
  assert.deepEqual(decider(play(base(), R(11)), 2, 4).action, F);      // le pot
});

test('face à une mise : main forte relance 3 fois, top paire suit, un tirage suit selon les cotes', () => {
  assert.deepEqual(decider(play(coVsBB({ 2: 'KS 7S' }, ['KH', '7D', '2C']), X, R(6)), 2, 4).action, R(18));
  assert.deepEqual(decider(play(coVsBB({ 2: 'KS 9D' }, ['KH', '7D', '2C']), X, R(6)), 2, 4).action, C);
  const d = decider(play(coVsBB({ 2: 'AH 8H' }, ['KH', '7H', '2C']), X, R(6)), 2, 4);
  assert.deepEqual(d.action, C);
  assert.match(texte(d), /9 outs/);
  assert.deepEqual(decider(play(coVsBB({ 2: 'QS JD' }, ['KH', '7D', '2C']), X, R(6)), 2, 4).action, F);
});

test('face à une relance, selon le SPR (C4.5)', () => {
  // Tapis de 200 : SPR au flop = 195 / 11 ≈ 18 ; tapis = les 195 restants au flop.
  const raised = (hole, board, stack) => play(coVsBB({ 2: hole }, board, stack), R(6), R(18));
  assert.deepEqual(decider(raised('KS QD', ['KH', '7D', '2C']), 2, 4).action, F);
  assert.deepEqual(decider(raised('KS 7S', ['KH', '7D', '2C']), 2, 4).action, C);
  assert.deepEqual(decider(raised('6S 5S', ['4H', '3D', '2C']), 2, 4).action, R(195));
  // Tapis de 30 : SPR = 25 / 11 ≈ 2,3 → top paire à tapis.
  assert.deepEqual(decider(raised('KS QD', ['KH', '7D', '2C'], 30), 2, 4).action, R(25));
  assert.equal(Math.round(context(raised('KS QD', ['KH', '7D', '2C'], 30), 2).spr * 10) / 10, 2.3);
});

test('mentor au niveau 4 : checker une c-bet est défendable, miser sans raison est une erreur', () => {
  let h = play(coVsBB({ 5: '6S 5D' }, ['KH', '7D', '2C']), X);
  let v = judge(h, X, decider(h, 5, 4), legalActions(h));
  assert.equal(v.verdict, 'défendable');
  assert.match(v.why[0].texte, /Le cours mise ici/);
  h = play(coVsBB({ 5: 'AS 5D' }, ['JH', 'TH', '8C']), X);
  v = judge(h, R(7), decider(h, 5, 4), legalActions(h));
  assert.equal(v.verdict, 'erreur');
  assert.equal(v.level, '4');
});
