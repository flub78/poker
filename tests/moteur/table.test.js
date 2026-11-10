// Déroulement d'une main (web/simulateur/moteur/table.js) : scénarios écrits à la main.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newHand, legalActions, act } from '../../web/simulateur/moteur/table.js';
import { rng } from '../../web/js/cards.js';
import { cartes } from '../aide.js';

const F = { type: 'fold' };
const X = { type: 'check' };
const C = { type: 'call' };
const R = (to) => ({ type: 'raise', to });
const six = (extra = {}) => newHand({ stacks: Array(6).fill(200), button: 0, rand: rng(1), ...extra });
const play = (hand, ...actions) => { for (const a of actions) act(hand, a); return hand; };

test('blinds et premier à parler à 6 joueurs', () => {
  const h = six();
  assert.equal(h.sbSeat, 1);
  assert.equal(h.bbSeat, 2);
  assert.deepEqual([h.seats[1].bet, h.seats[2].bet], [1, 2]);
  assert.equal(h.toAct, 3);
  assert.deepEqual(h.seats.map((s) => s.hole.length), [2, 2, 2, 2, 2, 2]);
});

test('tout le monde se couche : la grosse blind gagne les blinds, sans abattage', () => {
  const h = play(six(), F, F, F, F, F);
  assert.ok(h.done);
  assert.equal(h.result.showdown, false);
  assert.deepEqual(h.result.net, [0, -1, 1, 0, 0, 0]);
  assert.equal(h.board.length, 0);
});

test('tout le monde suit : la grosse blind a encore le choix (check ou relance)', () => {
  const h = play(six(), C, C, C, C);           // UTG, MP, CO, BTN suivent ; SB complète
  play(h, C);
  assert.equal(h.toAct, 2);
  const legal = legalActions(h);
  assert.ok(legal.check);
  assert.deepEqual(legal.raise, { min: 4, max: 200 });
  play(h, X);
  assert.equal(h.street, 'flop');
  assert.equal(h.board.length, 3);
  assert.equal(h.toAct, 1);                    // après le flop : premier joueur à gauche du bouton
});

test('relance minimale : au moins la taille de la relance précédente', () => {
  const h = six();
  assert.equal(legalActions(h).raise.min, 4);  // relance de 2 au-dessus de la grosse blind
  play(h, R(7));                                // relance de 5
  assert.equal(legalActions(h).raise.min, 12);
  assert.throws(() => act(h, R(11)), /entre 12 et 200/);
  play(h, R(20));                               // relance de 13
  assert.equal(legalActions(h).raise.min, 33);
});

test('après le flop, le premier à parler saute les joueurs couchés', () => {
  const h = play(six(), C, F, F, C, F, X);      // UTG et BTN suivent, SB se couche, BB checke
  assert.equal(h.street, 'flop');
  assert.equal(h.toAct, 2);
  play(h, X, X);
  assert.equal(h.toAct, 0);
  play(h, R(10), F, C);
  assert.equal(h.street, 'turn');
  assert.equal(h.toAct, 3);
});

test('un tapis pour moins que la relance minimale ne rouvre pas la parole', () => {
  const h = newHand({ stacks: [200, 200, 200, 9], button: 0, rand: rng(2) });
  // SB 1, BB 2, UTG (3) puis le bouton (0).
  play(h, R(6));                     // siège 3 (9 jetons) relance à 6
  assert.equal(h.toAct, 0);
  play(h, C);                        // le bouton suit 6
  play(h, R(16));                    // SB relance à 16 (relance de 10)
  assert.equal(h.toAct, 2);
  play(h, F);                        // BB se couche
  assert.equal(h.toAct, 3);
  play(h, C);                        // siège 3 suit à tapis pour 9 (moins que 16)
  assert.ok(h.seats[3].allIn);
  assert.equal(h.toAct, 0);
  assert.ok(legalActions(h).raise);  // le bouton n'a pas encore répondu à la relance complète
});

test('relance incomplète : ceux qui ont déjà parlé peuvent seulement suivre ou se coucher', () => {
  const h = newHand({ stacks: [200, 200, 200, 200, 9], button: 0, rand: rng(3) });
  // SB = 1, BB = 2 ; parlent ensuite 3, 4 (9 jetons), 0.
  play(h, R(6));                     // 3 relance à 6
  play(h, R(9));                     // 4 à tapis à 9 : relance de 3 < 4, incomplète
  play(h, C, C, C);                  // 0, SB, BB suivent 9
  assert.equal(h.toAct, 3);
  const legal = legalActions(h);
  assert.equal(legal.raise, null);
  assert.equal(legal.toCall, 3);
  play(h, C);
  assert.equal(h.street, 'flop');
});

test('tête-à-tête : le bouton pose la petite blind, parle le premier avant le flop, le dernier après', () => {
  const h = newHand({ stacks: [100, 100], button: 1, rand: rng(4) });
  assert.equal(h.sbSeat, 1);
  assert.equal(h.bbSeat, 0);
  assert.equal(h.toAct, 1);
  play(h, C, X);
  assert.equal(h.street, 'flop');
  assert.equal(h.toAct, 0);
});

test('grosse blind à tapis pour moins que la blind', () => {
  const h = newHand({ stacks: [100, 100, 1], button: 0, rand: rng(5) });
  assert.ok(h.seats[2].allIn);
  assert.equal(h.currentBet, 2);
  assert.equal(h.toAct, 0);
  play(h, C, C);                     // le bouton suit 2, SB complète
  assert.equal(h.street, 'flop');
});

test('tous à tapis avant le flop : le tableau est déroulé jusqu\'à l\'abattage', () => {
  const h = newHand({ stacks: [50, 100, 200], button: 0, rand: rng(6) });
  play(h, R(50), R(100), C);
  assert.ok(h.done);
  assert.equal(h.result.showdown, true);
  assert.equal(h.board.length, 5);
  assert.equal(h.result.pots.length, 2);
  assert.equal(h.seats.reduce((n, s) => n + s.stack, 0), 350);
});

test('pots annexes : chacun gagne ce à quoi il a droit', () => {
  // 0 (50) a la meilleure main, 1 (100) la deuxième, 2 (200) la moins bonne.
  const h = newHand({
    stacks: [50, 100, 200], button: 0, rand: rng(7),
    preset: { holes: [cartes('AS AH'), cartes('KS KH'), cartes('QS QH')], board: cartes('2C 5D 8C 9D JS') },
  });
  play(h, R(50), R(100), C);          // 2 suit seulement 100 : il garde 100 hors du pot
  assert.deepEqual(h.result.pots.map((p) => [p.amount, p.winners]), [[150, [0]], [100, [1]]]);
  assert.deepEqual(h.seats.map((s) => s.stack), [150, 100, 100]);
});

test('mise non suivie au river : elle revient à son auteur', () => {
  const h = newHand({ stacks: [100, 100, 100], button: 0, rand: rng(8) });
  play(h, C, C, X);                  // limps, flop
  play(h, X, X, X, X, X, X);         // flop et turn checkés
  play(h, R(40), F, F);              // mise au river, tout le monde se couche
  assert.ok(h.done);
  assert.equal(h.result.showdown, false);
  assert.deepEqual(h.result.net, [-2, 4, -2]);
});

test('une action illégale lève une erreur et ne change rien', () => {
  const h = six();
  const before = JSON.stringify(h);
  assert.throws(() => act(h, X), /Impossible de checker/);
  assert.throws(() => act(h, R(3)), /entre 4 et 200/);
  assert.throws(() => act(h, R(201)), /entre 4 et 200/);
  assert.throws(() => act(h, R(5.5)), /entre/);
  assert.throws(() => act(h, { type: 'bluff' }), /inconnue/);
  assert.equal(JSON.stringify(h), before);
  play(h, F, F, F, F, F);
  assert.throws(() => act(h, F), /terminée/);
});

test('même graine, même donne', () => {
  const a = newHand({ stacks: Array(6).fill(200), button: 3, rand: rng(99) });
  const b = newHand({ stacks: Array(6).fill(200), button: 3, rand: rng(99) });
  assert.deepEqual(a.seats.map((s) => s.hole), b.seats.map((s) => s.hole));
  assert.deepEqual(a.deck, b.deck);
});

test('cartes imposées : les mains et le tableau voulus, sans doublon', () => {
  const h = newHand({
    stacks: [100, 100, 100], button: 0, rand: rng(10),
    preset: { holes: [null, cartes('AS AH'), null], board: cartes('KD QD JD') },
  });
  assert.deepEqual(h.seats[1].hole, cartes('AS AH'));
  play(h, C, C, X);
  assert.deepEqual(h.board, cartes('KD QD JD'));
  const all = [...h.seats.flatMap((s) => s.hole), ...h.board, ...h.deck].map((c) => `${c.r}${c.s}`);
  assert.equal(new Set(all).size, 52);
});
