// Pots principal et annexes (web/simulateur/moteur/pots.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computePots, awardPots } from '../../web/simulateur/moteur/pots.js';
import { cartes } from '../aide.js';

const seats = (...list) => list.map(([committed, folded = false]) => ({ committed, folded }));

test('un seul pot quand tout le monde a misé autant', () => {
  assert.deepEqual(computePots(seats([10], [10], [10])), [{ amount: 30, eligible: [0, 1, 2] }]);
});

test('les jetons d\'un joueur couché restent dans le pot, sans droit de le gagner', () => {
  assert.deepEqual(computePots(seats([10], [4, true], [10])), [{ amount: 24, eligible: [0, 2] }]);
});

test('trois tapis différents : pot principal et deux pots annexes', () => {
  // 0 à tapis pour 50, 1 à tapis pour 100, 2 et 3 misent 200, 4 s'est couché après 20.
  const pots = computePots(seats([50], [100], [200], [200], [20, true]));
  assert.deepEqual(pots, [
    { amount: 50 * 4 + 20, eligible: [0, 1, 2, 3] },
    { amount: 50 * 3, eligible: [1, 2, 3] },
    { amount: 100 * 2, eligible: [2, 3] },
  ]);
});

test('une mise que personne ne suit revient à son auteur', () => {
  const pots = computePots(seats([30], [100]));
  assert.deepEqual(pots, [{ amount: 60, eligible: [0, 1] }, { amount: 70, eligible: [1] }]);
  const [, side] = awardPots(pots, [cartes('2S 3H'), cartes('7D 8C')], cartes('AS KD QH JC 9S'), [0, 1]);
  assert.deepEqual(side.shares, { 1: 70 });
});

test('pot partagé : le jeton indivisible va au premier joueur à gauche du bouton', () => {
  const pots = [{ amount: 25, eligible: [0, 2, 4] }];
  const hands = [cartes('2S 3H'), null, cartes('4D 5C'), null, cartes('2D 3C')];
  // Le tableau joue (quinte flush royale) : égalité entre les trois.
  const [pot] = awardPots(pots, hands, cartes('AH KH QH JH TH'), [2, 3, 4, 0, 1]);
  assert.deepEqual(pot.winners, [2, 4, 0]);
  assert.deepEqual(pot.shares, { 2: 9, 4: 8, 0: 8 });
});
