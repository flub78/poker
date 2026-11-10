// Niveau 3 : cotes, équités requises, espérance (web/niveau-3/odds.js) et outs (draws.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ruleOf24, exactHit, required, evCall, parseNumber, TABLE } from '../../web/niveau-3/odds.js';
import { makeDraw, countOuts, TYPES } from '../../web/niveau-3/draws.js';
import { rng } from '../../web/js/cards.js';
import { cartes } from '../aide.js';

test('règle du 2 et du 4', () => {
  assert.equal(ruleOf24(9, 'flop'), 35);
  assert.equal(ruleOf24(8, 'flop'), 32);
  assert.equal(ruleOf24(15, 'flop'), 53);
  assert.equal(ruleOf24(9, 'turn'), 18);
});

test('chances exactes', () => {
  assert.equal(exactHit(9, 'flop').toFixed(1), '35.0');
  assert.equal(exactHit(9, 'turn').toFixed(1), '19.6');
});

test('le tableau des repères de C3.3 correspond au calcul', () => {
  for (const { label, bet, need } of TABLE) {
    assert.equal(Math.round(required(1, bet)), need, label);
  }
});

test('espérance d\'un call', () => {
  assert.equal(evCall(50, 100, 100), 0);
  assert.equal(evCall(25, 150, 50), 0);
  assert.ok(evCall(20, 150, 50) < 0);
});

test('lecture des nombres saisis', () => {
  assert.equal(parseNumber('28,6'), 28.6);
  assert.equal(parseNumber(' 29 % '), 29);
  assert.equal(parseNumber('−12'), -12);
  assert.equal(parseNumber('abc'), null);
});

test('outs d\'un tirage couleur au flop', () => {
  assert.equal(countOuts('flush', cartes('AH KH'), cartes('7H 2H 9C')).length, 9);
});

test('chaque situation générée a le nombre d\'outs de son type', () => {
  const rand = rng(7);
  for (let i = 0; i < 300; i++) {
    const d = makeDraw(rand);
    assert.equal(d.outs.length, TYPES[d.type].outs, `${d.type} ${JSON.stringify(d.hole)} ${JSON.stringify(d.board)}`);
  }
});
