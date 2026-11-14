// Tests exigés d'un joueur (web/js/validation.js) : un test ajouté après coup (since) ne fait pas
// perdre un niveau déjà validé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requirements, levelProgress } from '../../web/js/validation.js';
import niveau1 from '../../web/niveau-1/niveau.js';

const TESTS = [{ id: 'a' }, { id: 'b' }, { id: 'n', since: '2026-11-14' }];
const ok = (second) => ({ state: 'validated', second });
const run = (states) => requirements(TESTS, (id) => states[id] || { state: 'none' });
const required = (states) => run(states).map((r) => r.required);

test('niveau validé avant l\'ajout : le nouveau test est facultatif, le niveau reste validé', () => {
  const reqs = run({ a: ok('2026-10-01T10:00:00.000Z'), b: ok('2026-11-13T18:00:00.000Z') });
  assert.deepEqual(reqs.map((r) => r.required), [true, true, false]);
  assert.deepEqual(levelProgress(reqs), { done: 2, total: 2, ok: true });
});

test('niveau en cours : le nouveau test est exigé, les réussites acquises restent', () => {
  const reqs = run({ a: ok('2026-10-01T10:00:00.000Z'), b: { state: 'once' } });
  assert.deepEqual(reqs.map((r) => r.required), [true, true, true]);
  assert.deepEqual(levelProgress(reqs), { done: 1, total: 3, ok: false });
});

test('niveau validé après l\'ajout : le nouveau test est exigé', () => {
  assert.deepEqual(required({ a: ok('2026-10-01T10:00:00.000Z'), b: ok('2026-11-20T10:00:00.000Z') }), [true, true, true]);
});

test('nouveau joueur : tout est exigé ; tout validé : niveau validé', () => {
  assert.deepEqual(required({}), [true, true, true]);
  const all = run({ a: ok('2026-12-01T10:00:00.000Z'), b: ok('2026-12-01T10:00:00.000Z'), n: ok('2026-12-04T10:00:00.000Z') });
  assert.deepEqual(levelProgress(all), { done: 3, total: 3, ok: true });
});

test('niveau 1 : seul le test de comparaison porte une date d\'ajout', () => {
  assert.deepEqual(niveau1.tests.filter((t) => t.since).map((t) => t.id), ['comparaison']);
  assert.equal(new Set(niveau1.tests.map((t) => t.id)).size, niveau1.tests.length);
});
