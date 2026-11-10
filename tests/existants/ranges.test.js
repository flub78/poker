// Niveau 2 : lecture des listes de mains (web/niveau-2/ranges.js) et stratégie préflop (strategy.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { range, has, combos, share, ALL_HANDS, TOTAL_COMBOS, randomHand } from '../../web/niveau-2/ranges.js';
import { UTG, CO, BTN, decide } from '../../web/niveau-2/strategy.js';
import { rng } from '../../web/js/cards.js';

const mains = (t) => [...range('test', t).set].sort();

test('169 mains de départ, 1326 combinaisons', () => {
  assert.equal(ALL_HANDS.length, 169);
  assert.equal(ALL_HANDS.reduce((n, c) => n + combos(c), 0), TOTAL_COMBOS);
});

test('jetons du tutoriel', () => {
  assert.deepEqual(mains('QQ+'), ['AA', 'KK', 'QQ']);
  assert.deepEqual(mains('JJ-99'), ['99', 'JJ', 'TT']);
  assert.deepEqual(mains('AJ+'), ['AJo', 'AJs', 'AKo', 'AKs', 'AQo', 'AQs']);
  assert.deepEqual(mains('ATs+'), ['AJs', 'AKs', 'AQs', 'ATs']);
  assert.deepEqual(mains('KQ'), ['KQo', 'KQs']);
  assert.deepEqual(mains('KQo'), ['KQo']);
});

test('jeton inconnu : erreur explicite', () => {
  assert.throws(() => range('x', 'KA'), /non reconnu/);
});

test('les listes s\'emboîtent : UTG ⊂ CO ⊂ BTN', () => {
  for (const c of UTG.set) assert.ok(has(CO, c), `${c} devrait être dans la liste du CO`);
  for (const c of CO.set) assert.ok(has(BTN, c) || /s$/.test(c), `${c} devrait être au BTN`);
  assert.ok(share(UTG) < share(CO) && share(CO) < share(BTN));
});

test('décisions préflop de la grille complète', () => {
  assert.equal(decide({ type: 'open', pos: 'UTG' }, 'AJo').action, 'raise');
  assert.equal(decide({ type: 'open', pos: 'UTG' }, 'A9o').action, 'fold');
  assert.equal(decide({ type: 'open', pos: 'BTN' }, 'A2o').action, 'raise');
  assert.equal(decide({ type: 'vsRaise', hero: 'BTN' }, 'AKo').action, 'raise');
  assert.equal(decide({ type: 'vsRaise', hero: 'BTN' }, '66').action, 'call');
  assert.equal(decide({ type: 'vsRaise', hero: 'BB' }, '66').action, 'fold');
  assert.equal(decide({ type: 'vs3bet', hero: 'CO' }, 'TT').action, 'call');
  assert.equal(decide({ type: 'squeeze', hero: 'BTN' }, 'JJ').action, 'fold');
  assert.equal(decide({ type: 'bb' }, '72o').action, 'check');
});

test('tirage au hasard pondéré par les combinaisons', () => {
  const rand = rng(42);
  let paires = 0;
  const n = 20000;
  for (let i = 0; i < n; i++) if (randomHand(rand).length === 2) paires++;
  // 78 / 1326 = 5,9 %
  assert.ok(Math.abs(paires / n - 78 / 1326) < 0.01, `part des paires : ${paires / n}`);
});
