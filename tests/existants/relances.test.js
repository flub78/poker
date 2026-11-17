// Tableau des relances du cours (C2.2) : les lignes « votre sur-relance est relancée » (tapis)
// et « relance puis sur-relance, même si vous aviez suivi ».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, severity, actionLabel, RERAISE, CALL_IP, FULL } from '../../web/niveau-2/strategy.js';
import { makeSituation, handFor, describe } from '../../web/niveau-2/situations.js';
import { ALL_HANDS, has } from '../../web/niveau-2/ranges.js';

const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

test('votre sur-relance est relancée : QQ+ et AK à tapis, tout le reste se couche, à tous les sous-niveaux', () => {
  for (let step = 0; step <= FULL; step++) {
    for (const code of ALL_HANDS) {
      const expected = has(RERAISE, code) ? 'allin' : 'fold';
      assert.equal(decide({ type: 'vs4bet', hero: 'BTN' }, code, step).action, expected, `${code} à l'étape ${step}`);
    }
  }
  assert.equal(actionLabel({ type: 'vs4bet' }, 'allin'), 'Tapis');
});

test('erreur grave : coucher QQ+ ou AK face à un 4-bet, ou partir à tapis avec 72', () => {
  assert.equal(severity({ type: 'vs4bet' }, 'KK', 'fold'), 'grave');
  assert.equal(severity({ type: 'vs4bet' }, '72o', 'allin'), 'grave');
});

test('vous aviez suivi, puis sur-relance : les mains qui suivent se couchent (exemple du cours : 99)', () => {
  for (const code of CALL_IP.set) {
    assert.equal(decide({ type: 'squeeze', hero: 'BTN', called: true }, code).action, 'fold', code);
  }
  assert.match(decide({ type: 'squeeze', hero: 'BTN', called: true }, '99').why, /même si vous aviez suivi/);
});

test('la variante « vous aviez suivi » n\'apparaît qu\'à partir du sous-niveau 2.4, avec une main qui suit', () => {
  const rand = seeded(7);
  let called = 0;
  for (let i = 0; i < 400; i++) {
    const early = makeSituation('squeeze', rand, 3);
    assert.ok(!early.called);
    const sit = makeSituation('squeeze', rand, 4);
    if (!sit.called) continue;
    called++;
    assert.ok(has(CALL_IP, handFor(sit, rand, 4)));
    assert.match(describe(sit), /vous suivez/);
    assert.ok(['CO', 'BTN'].includes(sit.hero));
  }
  assert.ok(called > 50);
});

test('situation de 4-bet : le relanceur parle avant vous, tailles du cours', () => {
  const rand = seeded(3);
  for (let i = 0; i < 100; i++) {
    const sit = makeSituation('vs4bet', rand);
    assert.notEqual(sit.raiser, sit.hero);
    assert.match(describe(sit), /relance encore/);
  }
  assert.match(describe({ type: 'vs4bet', raiser: 'UTG', hero: 'BTN' }), /7,5 BB.*22,5 BB/);
  assert.match(describe({ type: 'vs4bet', raiser: 'UTG', hero: 'BB' }), /10 BB.*30 BB/);
});
