// Règles des bots (web/simulateur/bots.js, regles/) : un cas par exemple du cours.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newHand, act } from '../../web/simulateur/moteur/table.js';
import { decider } from '../../web/simulateur/bots.js';
import { handClass, outs } from '../../web/simulateur/regles/force.js';
import { handCode, preflopSituation } from '../../web/simulateur/regles/preflop.js';
import { positions } from '../../web/simulateur/positions.js';
import { rng } from '../../web/js/cards.js';
import { cartes } from '../aide.js';

// Table à 6, bouton au siège 0 : SB 1, BB 2, UTG 3, MP 4, CO 5.
const SIX = Array(6).fill(200);
function table(holes = {}, board = []) {
  const h = Array(6).fill(null);
  for (const [seat, t] of Object.entries(holes)) h[seat] = cartes(t);
  return newHand({ stacks: SIX, button: 0, rand: rng(1), preset: { holes: h, board: cartes(board.join(' ')) } });
}
const F = { type: 'fold' };
const C = { type: 'call' };
const X = { type: 'check' };
const R = (to) => ({ type: 'raise', to });
const play = (h, ...a) => { for (const x of a) act(h, x); return h; };
const texte = (d) => d.raisons.map((x) => x.texte).join(' ');

test('positions à 6, à 5 et en tête-à-tête', () => {
  assert.deepEqual(positions(table()), { 0: 'BTN', 1: 'SB', 2: 'BB', 3: 'UTG', 4: 'MP', 5: 'CO' });
  const five = newHand({ stacks: [200, 200, 200, 200, 200], button: 0, rand: rng(1) });
  assert.deepEqual(positions(five), { 0: 'BTN', 1: 'SB', 2: 'BB', 3: 'MP', 4: 'CO' });
  const hu = newHand({ stacks: [200, 200], button: 0, rand: rng(1) });
  assert.deepEqual(positions(hu), { 0: 'BTN', 1: 'BB' });
});

test('notation des mains', () => {
  assert.equal(handCode(cartes('AS KS')), 'AKs');
  assert.equal(handCode(cartes('9D AH')), 'A9o');
  assert.equal(handCode(cartes('7C 7D')), '77');
});

test('UTG : AJ relance à 2,5 BB, A9 se couche (C2.2, C2.3)', () => {
  let d = decider(table({ 3: 'AS JD' }), 3, 2);
  assert.deepEqual(d.action, R(5));
  assert.match(texte(d), /2,5 BB/);
  d = decider(table({ 3: 'AS 9D' }), 3, 2);
  assert.deepEqual(d.action, F);
  assert.equal(d.raisons[0].code, 'C2.2');
});

test('relance après un limper : 2,5 BB + 1 BB', () => {
  const h = play(table({ 0: 'AS 5D' }), C, F, F);   // UTG limpe, MP et CO se couchent
  assert.deepEqual(preflopSituation(h, 0), { type: 'open', pos: 'BTN', limpers: 1 });
  assert.deepEqual(decider(h, 0, 2).action, R(7));
});

test('sur-relance : 3 fois en position, 4 fois aux blinds', () => {
  let h = play(table({ 0: 'AS KD' }), F, F, R(5));       // le CO relance à 2,5 BB
  assert.deepEqual(decider(h, 0, 2).action, R(15));
  h = play(table({ 2: 'AS KD' }), F, F, R(5), F, F);     // le BB face à la relance du CO
  assert.deepEqual(decider(h, 2, 2).action, R(20));
});

test('suivre une relance : 66 en position, pas aux blinds (C2.2)', () => {
  let h = play(table({ 0: '6S 6D' }), F, F, R(5));
  assert.deepEqual(decider(h, 0, 2).action, C);
  h = play(table({ 2: '6S 6D' }), F, F, R(5), F, F);
  assert.deepEqual(decider(h, 2, 2).action, F);
});

test('niveau 3 : une petite paire paie une relance grâce aux cotes implicites (C3.4)', () => {
  const h = play(table({ 0: '4S 4D' }), F, F, R(5));
  assert.deepEqual(decider(h, 0, 2).action, F);
  const d = decider(h, 0, 3);
  assert.deepEqual(d.action, C);
  assert.ok(d.raisons.some((x) => x.code === 'C3.4'));
});

test('la grosse blind checke gratuitement avec une main hors liste', () => {
  const h = play(table({ 2: '7S 2D' }), F, F, F, F, C);  // la SB complète
  assert.deepEqual(decider(h, 2, 2).action, X);
});

test('classe d\'une main après le flop', () => {
  const b = cartes('KH 7D 2C');
  assert.equal(handClass(cartes('KS QD'), b).cls, 'top');
  assert.equal(handClass(cartes('AS AD'), b).cls, 'top');
  assert.equal(handClass(cartes('7S 8D'), b).cls, 'paire');
  assert.equal(handClass(cartes('KS 7S'), b).cls, 'forte');
  assert.equal(handClass(cartes('2S 2D'), b).cls, 'forte');
  assert.equal(handClass(cartes('AS QD'), b).cls, 'rien');
  assert.equal(handClass(cartes('AS KD'), cartes('9H 9D 4C')).cls, 'rien');   // la paire est au tableau
});

test('outs : les exemples du cours (C3.1, C3.2)', () => {
  assert.equal(outs(cartes('AH 8H'), cartes('KH 7H 2C')).n, 9);                // couleur
  assert.equal(outs(cartes('8S 7D'), cartes('6H 5C KD')).n, 8);                // quinte bilatérale
  assert.equal(outs(cartes('9S 8D'), cartes('JH 7C 2D')).n, 4);                // ventrale
  assert.equal(outs(cartes('AS KD'), cartes('9H 6C 2D')).n, 6);                // deux cartes hautes
  assert.equal(outs(cartes('4S 4D'), cartes('KH 9C 7D')).n, 2);                // brelan
  assert.equal(outs(cartes('AH 8H'), cartes('KH 7H 2C 5D 9S')).n, 0);          // river : plus rien à tirer
});

// Flop après une relance du CO (siège 5) suivie par le BB (siège 2) : pot de 11 (5 + 5 + 1).
function flop(holes, board) {
  const h = play(table(holes, board), F, F, R(5), F, F, C);
  assert.equal(h.street, 'flop');
  return h;
}

test('niveau 2 après le flop : top paire mise la moitié du pot, rien checke', () => {
  let h = flop({ 2: 'KS QD' }, ['KH', '7D', '2C']);
  assert.deepEqual(decider(h, 2, 2).action, R(6));
  h = flop({ 2: 'AS QD' }, ['KH', '7D', '2C']);
  assert.deepEqual(decider(h, 2, 2).action, X);
});

test('niveau 2 face à une mise : top paire suit, rien se couche, top paire jette face à une relance', () => {
  let h = play(flop({ 2: 'KS QD' }, ['KH', '7D', '2C']), X, R(6));
  assert.deepEqual(decider(h, 2, 2).action, C);
  h = play(flop({ 2: 'AS QD' }, ['KH', '7D', '2C']), X, R(6));
  assert.deepEqual(decider(h, 2, 2).action, F);
  h = play(flop({ 2: 'KS QD' }, ['KH', '7D', '2C']), R(6), R(18));
  assert.deepEqual(decider(h, 2, 2).action, F);
});

test('main forte face à une mise : relance 3 fois la mise', () => {
  const h = play(flop({ 2: 'KS 7S' }, ['KH', '7D', '2C']), X, R(6));
  assert.deepEqual(decider(h, 2, 2).action, R(18));
});

test('niveau 3 : un tirage couleur suit quand la cote le permet (C3.2, C3.3)', () => {
  // Pot 11, mise de 6 : il faut 6 / 23 = 26 % ; 9 outs au flop ≈ 35 % → suivre.
  const h = play(flop({ 2: 'AH 8H' }, ['KH', '7H', '2C']), X, R(6));
  assert.deepEqual(decider(h, 2, 2).action, F);
  const d = decider(h, 2, 3);
  assert.deepEqual(d.action, C);
  assert.match(texte(d), /9 outs/);
  assert.match(texte(d), /26 %/);
});

test('niveau 3 : une ventrale se couche face à une grosse mise', () => {
  // Mise de 22 (2 pots) : il faut 22 / 55 = 40 % ; 4 outs ≈ 16 %.
  const h = play(flop({ 2: '9S 8D' }, ['JH', '7C', '2D']), X, R(22));
  const d = decider(h, 2, 3);
  assert.deepEqual(d.action, F);
  assert.match(texte(d), /40 %/);
});

test('decider refuse un siège qui n\'a pas la parole', () => {
  assert.throws(() => decider(table(), 0, 2), /pas à ce joueur/);
});
