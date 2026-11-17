// Correction « en avance » du niveau 2 (web/niveau-2/strategy.js, grade) : une réponse fausse au
// sous-niveau choisi mais juste à un sous-niveau plus avancé est acceptée.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, minPosition, openRange, grade, FULL } from '../../web/niveau-2/strategy.js';
import { compare } from '../../web/niveau-2/grid.js';

const action = (sit, code, answer, step) => grade((s) => decide(sit, code, s).action === answer, step);

test('juste au sous-niveau : ok, pas en avance', () => {
  assert.deepEqual(action({ type: 'open', pos: 'UTG' }, 'AKo', 'raise', 0), { ok: true, ahead: null });
  assert.deepEqual(action({ type: 'open', pos: 'BTN' }, '22', 'fold', 0), { ok: true, ahead: null });
});

test('réponse d\'un sous-niveau plus avancé : ok, en avance, avec la première étape où elle est juste', () => {
  // 22 au bouton : couché à l'étape 0 (liste UTG partout), relancé dès l'étape 1 (le bouton).
  assert.deepEqual(action({ type: 'open', pos: 'BTN' }, '22', 'raise', 0), { ok: true, ahead: 1 });
  // 66 face à une relance, en position : couché avant l'étape 4, suivi ensuite.
  assert.deepEqual(action({ type: 'vsRaise', hero: 'BTN' }, '66', 'call', 1), { ok: true, ahead: 4 });
  // A2s au CO : relancé dès l'étape 2 (paires et As du CO).
  assert.deepEqual(action({ type: 'open', pos: 'CO' }, 'A2s', 'raise', 1), { ok: true, ahead: 2 });
});

test('réponse fausse à toutes les étapes : refusée', () => {
  assert.deepEqual(action({ type: 'open', pos: 'BTN' }, '22', 'call', 0), { ok: false, ahead: null });   // le limp
  assert.deepEqual(action({ type: 'open', pos: 'UTG' }, '72o', 'raise', 0), { ok: false, ahead: null });
  // Ce qui se couche à la grille complète reste faux : on n'accepte pas « plus large que le cours ».
  assert.deepEqual(action({ type: 'vsRaise', hero: 'BB' }, '66', 'call', 1), { ok: false, ahead: null });
});

test('à la grille complète, rien n\'est en avance', () => {
  assert.deepEqual(action({ type: 'open', pos: 'CO' }, 'K2s', 'raise', FULL), { ok: false, ahead: null });
});

test('position minimum : la réponse d\'un sous-niveau plus avancé est en avance', () => {
  // 55 : BTN à l'étape 1, CO dès l'étape 2.
  assert.equal(minPosition('55', 1), 'BTN');
  assert.deepEqual(grade((s) => minPosition('55', s) === 'CO', 1), { ok: true, ahead: 2 });
  assert.deepEqual(grade((s) => minPosition('55', s) === 'UTG', 1), { ok: false, ahead: null });
});

test('colorier : la grille exacte d\'un sous-niveau plus avancé est en avance', () => {
  const coloriee = new Set(openRange('BTN', FULL).set);
  assert.deepEqual(grade((s) => compare(coloriee, openRange('BTN', s)).errors === 0, 0), { ok: true, ahead: 1 });
});
