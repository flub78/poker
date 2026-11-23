// La grille par famille du cours (C2.2) redonne exactement les listes d'ouverture.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FAMILIES, FAMILY_COLUMNS, familyColumn, UTG, CO, BTN } from '../../web/niveau-2/strategy.js';
import { has, ALL_HANDS } from '../../web/niveau-2/ranges.js';

const sorted = (set) => [...set].sort();

test('chaque colonne de la grille par famille est la liste de sa position', () => {
  for (const [col, r] of [[0, UTG], [1, CO], [2, BTN]]) {
    assert.deepEqual(sorted(familyColumn(col).set), sorted(r.set), FAMILY_COLUMNS[col].title);
  }
});

test('les colonnes s\'emboîtent : UTG dans CO, CO dans BTN', () => {
  for (const code of ALL_HANDS) {
    if (has(UTG, code)) assert.ok(has(CO, code), `${code} UTG mais pas CO`);
    if (has(CO, code)) assert.ok(has(BTN, code), `${code} CO mais pas BTN`);
  }
});

test('exemples du cours : A7s et 66 au CO, pas A7', () => {
  const co = familyColumn(1);
  assert.ok(has(co, 'A7s'));
  assert.ok(has(co, '66'));
  assert.ok(!has(co, 'A7o'));
});

test('six familles, une case par colonne', () => {
  assert.equal(FAMILIES.length, 6);
  for (const f of FAMILIES) assert.equal(f.cells.length, FAMILY_COLUMNS.length, f.name);
});
