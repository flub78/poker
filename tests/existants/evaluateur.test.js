// Niveau 1 : classement des mains (web/niveau-1/evaluator.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, compare, classOf, describe } from '../../web/niveau-1/evaluator.js';
import { cartes } from '../aide.js';

const classe = (t) => classOf(evaluate(cartes(t)));
const bat = (a, b) => compare(evaluate(cartes(a)), evaluate(cartes(b)));

test('reconnaît les 10 combinaisons', () => {
  assert.equal(classe('AS KS QS JS TS 2D 3C'), 'royal');
  assert.equal(classe('9H 8H 7H 6H 5H AD KC'), 'sf');
  assert.equal(classe('7S 7H 7D 7C KS 2D 3C'), 'quads');
  assert.equal(classe('7S 7H 7D KC KS 2D 3C'), 'full');
  assert.equal(classe('AH 9H 7H 4H 2H KD QC'), 'flush');
  assert.equal(classe('9S 8H 7D 6C 5S 2D 2C'), 'straight');
  assert.equal(classe('7S 7H 7D KC QS 2D 3C'), 'trips');
  assert.equal(classe('7S 7H KD KC QS 2D 3C'), 'twopair');
  assert.equal(classe('7S 7H KD JC QS 2D 3C'), 'pair');
  assert.equal(classe('AS 7H KD JC QS 2D 3C'), 'high');
});

test("la quinte A-2-3-4-5 est hauteur 5, et perd contre 2-3-4-5-6", () => {
  assert.deepEqual(evaluate(cartes('AS 2H 3D 4C 5S KD 9C')), [4, 5]);
  assert.ok(bat('AS 2H 3D 4C 5S', '6S 2H 3D 4C 5S') < 0);
});

test('pas de quinte « autour » : Q-K-A-2-3', () => {
  assert.equal(classe('QS KH AD 2C 3S'), 'high');
});

test('quinte flush prioritaire sur une couleur plus haute', () => {
  assert.equal(classe('5H 6H 7H 8H 9H AH KH'), 'sf');
});

test('deux brelans font un full', () => {
  assert.equal(classe('7S 7H 7D 5C 5S 5D 2C'), 'full');
  assert.deepEqual(evaluate(cartes('7S 7H 7D 5C 5S 5D 2C')), [6, 7, 5]);
});

test('trois paires : les deux plus hautes, et la meilleure carte restante en kicker', () => {
  assert.deepEqual(evaluate(cartes('KS KH 7D 7C 5S 5D 2C')), [2, 13, 7, 5]);
});

test('le kicker départage les paires, sinon égalité', () => {
  assert.ok(bat('AS AH KD 9C 4S 3D 2C', 'AD AC QD 9H 4C 3H 2S') > 0);
  assert.equal(bat('AS AH KD 9C 7S 3D 2C', 'AD AC KS 9H 7C 4H 2S'), 0); // 4 ne joue pas
});

test('description en français', () => {
  assert.equal(describe(evaluate(cartes('7S 7H 7D KC KS 2D 3C'))), 'Full aux 7 par les rois');
  assert.equal(describe(evaluate(cartes('AS AH 2D 5C 9S'))), "Paire d'As");
});
