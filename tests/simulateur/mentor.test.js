// Le mentor (web/simulateur/mentor.js) : un cas par verdict et par règle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newHand, act, legalActions } from '../../web/simulateur/moteur/table.js';
import { decider } from '../../web/simulateur/bots.js';
import { judge } from '../../web/simulateur/mentor.js';
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
const play = (h, ...a) => { for (const x of a) act(h, x); return h; };
// Verdict du mentor pour le coup « action » du siège qui a la parole, au niveau donné.
const verdict = (h, action, level = 2) => judge(h, action, decider(h, h.toAct, level), legalActions(h));

test('même coup : conforme ; relance de taille proche : conforme ; taille éloignée : défendable', () => {
  const h = table({ 3: 'AS JD' });                      // UTG, AJ : relance à 2,5 BB (5)
  assert.equal(verdict(h, R(5)).verdict, 'conforme');
  assert.equal(verdict(h, R(6)).verdict, 'conforme');
  const v = verdict(h, R(12));
  assert.equal(v.verdict, 'défendable');
  assert.match(v.why[0].texte, /taille/);
});

test('limper : erreur (règle d\'or 1)', () => {
  const v = verdict(table({ 3: 'AS JD' }), C);
  assert.equal(v.verdict, 'erreur');
  assert.equal(v.why[0].code, 'C2.3');
  assert.match(v.why[0].texte, /jamais en suivant/);
});

test('main loin de la liste : erreur ; à la limite : défendable', () => {
  assert.equal(verdict(table({ 3: '7S 2D' }), R(5)).verdict, 'erreur');
  const v = verdict(table({ 3: 'AS TD' }), R(5));       // AT dépareillé UTG : juste sous AJ+
  assert.equal(v.verdict, 'défendable');
  assert.match(v.why[0].texte, /limite/);
});

test('jeter une main de la liste : erreur', () => {
  const v = verdict(table({ 3: 'AS AD' }), F);
  assert.equal(v.verdict, 'erreur');
  assert.match(v.why[0].texte, /rentable/);
});

test('se coucher quand checker est gratuit : erreur', () => {
  const h = play(table({ 2: '7S 2D' }), F, F, F, F, C);  // la SB complète, la BB peut checker
  assert.equal(verdict(h, F).verdict, 'erreur');
  assert.equal(verdict(h, X).verdict, 'conforme');
});

// Flop : le CO (5) relance, la BB (2) suit ; pot 11.
function flop(holes, board) { return play(table(holes, board), F, F, R(5), F, F, C); }

test('après le flop : payer « pour voir » est une erreur', () => {
  const h = play(flop({ 2: 'AS QD' }, ['KH', '7D', '2C']), X, R(6));
  const v = verdict(h, C);
  assert.equal(v.verdict, 'erreur');
  assert.match(v.why[0].texte, /pour voir/);
});

test('après le flop : top paire face à une relance qui suit, erreur (règle 3)', () => {
  const h = play(flop({ 2: 'KS QD' }, ['KH', '7D', '2C']), R(6), R(18));
  assert.match(verdict(h, C).why[0].texte, /Règle 3/);
});

test('après le flop : checker une top paire, défendable (valeur manquée)', () => {
  const v = verdict(flop({ 2: 'KS QD' }, ['KH', '7D', '2C']), X);
  assert.equal(v.verdict, 'défendable');
  assert.match(v.why[0].texte, /valeur/);
});

test('après le flop : miser sans paire, erreur', () => {
  assert.equal(verdict(flop({ 2: 'AS QD' }, ['KH', '7D', '2C']), R(6)).verdict, 'erreur');
});

test('niveau 3 : jeter un tirage couleur qui a la cote, erreur chiffrée', () => {
  const h = play(flop({ 2: 'AH 8H' }, ['KH', '7H', '2C']), X, R(6));   // 35 % pour 26 % requis
  const v = verdict(h, F, 3);
  assert.equal(v.verdict, 'erreur');
  assert.match(v.why[0].texte, /9 outs/);
  assert.match(v.why[0].texte, /suivre est rentable/);
});

test('niveau 3 : équité proche de l\'équité requise, défendable', () => {
  // Ventrale + 2 cartes hautes ? Plus simple : 8 outs (quinte bilatérale) au flop ≈ 32 % ;
  // mise de 11 dans un pot de 11 : il faut 11 / 33 = 33 % → écart d'un point.
  const h = play(flop({ 2: '9S 8D' }, ['TH', '7C', '2D']), X, R(11));
  const v = verdict(h, C, 3);
  assert.equal(v.verdict, 'défendable');
  assert.match(v.why[0].texte, /se valent/);
});
