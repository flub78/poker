// Niveau 1, test 5 : comparer deux mains proches (web/niveau-1/comparaison.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, sameCard } from '../../web/js/cards.js';
import { evaluate, compare, classOf, CAT } from '../../web/niveau-1/evaluator.js';
import { questions, oneQuestion, explanation, VOISINES, PROCHES } from '../../web/niveau-1/comparaison.js';
import { build } from '../../web/niveau-1/mains.js';
import { cartes } from '../aide.js';

const score = (t) => evaluate(cartes(t));
const RANG = ['royal', 'sf', 'quads', 'full', 'flush', 'straight', 'trips', 'twopair', 'pair', 'high'];

test('build fabrique la combinaison demandée', () => {
  const rand = rng(7);
  for (const id of RANG) for (let k = 0; k < 20; k++) assert.equal(classOf(evaluate(build(id, rand))), id);
});

test('100 essais : 10 questions justes, proches et variées', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const qs = questions(rng(seed));
    assert.equal(qs.length, 10);
    const ties = qs.filter((q) => q.kind === 'egalite').length;
    assert.ok(ties <= 2, `graine ${seed}`);
    for (const q of qs) {
      assert.equal(q.a.length, 5); assert.equal(q.b.length, 5);
      assert.ok(!q.a.some((x) => q.b.some((y) => sameCard(x, y))), `cartes communes, graine ${seed}`);
      const [sa, sb] = [evaluate(q.a), evaluate(q.b)];
      const d = compare(sa, sb);
      assert.equal(q.answer, d > 0 ? 'A' : d < 0 ? 'B' : '=');
      const [ia, ib] = [RANG.indexOf(classOf(sa)), RANG.indexOf(classOf(sb))];
      if (q.kind === 'voisines') assert.equal(Math.abs(ia - ib), 1, `graine ${seed}`);
      if (q.kind === 'meme') { assert.equal(ia, ib); assert.notEqual(d, 0); assert.ok(PROCHES[classOf(sa)](sa, sb)); }
      if (q.kind === 'egalite') assert.equal(d, 0);
    }
    // jamais deux fois le même couple voisin ni la même combinaison
    const keys = qs.filter((q) => q.kind !== 'egalite').map((q) => [classOf(evaluate(q.a)), classOf(evaluate(q.b))].sort().join('/') + q.kind);
    assert.equal(new Set(keys).size, keys.length, `graine ${seed}`);
  }
});

test('la main gagnante est tantôt A, tantôt B', () => {
  const answers = Array.from({ length: 20 }, (_, s) => questions(rng(s))).flat().map((q) => q.answer);
  assert.ok(answers.filter((a) => a === 'A').length > 50);
  assert.ok(answers.filter((a) => a === 'B').length > 50);
});

test('couples voisins : la première combinaison bat la seconde', () => {
  const rand = rng(3);
  for (const [hi, lo] of VOISINES) assert.ok(compare(evaluate(build(hi, rand)), evaluate(build(lo, rand))) > 0, `${hi} > ${lo}`);
});

test('explications de la correction', () => {
  assert.equal(explanation(score('AH 9H 7H 4H 2H'), score('9S 8H 7D 6C 5S')), 'Une couleur bat toujours une quinte.');
  assert.equal(explanation(score('7S 7H 7D 7C KS'), score('KH KD KC 2S 2H')), 'Un carré bat toujours un full.');
  assert.equal(explanation(score('8S 8H 8D 2C 2S'), score('7S 7H 7D KC KS')), "Dans un full, c'est le brelan qui décide (8 contre 7), pas la paire.");
  assert.match(explanation(score('AS 2H 3D 4C 5S'), score('6S 2C 3H 4D 5H')), /hauteur 6 contre 5\) : dans A-2-3-4-5, l'As compte pour 1/);
  assert.equal(explanation(score('KS KH AD 9C 4S'), score('KD KC QH JS 9D')), 'Même paire : les autres cartes (kickers) départagent, la première décide (As contre dame).');
  assert.equal(explanation(score('KS KH 9D 9C 4S'), score('KD KC 8H 8S AD')), 'Même paire haute : la seconde paire décide (9 contre 8).');
  assert.equal(explanation(score('AH KH 9H 4H 2H'), score('AS KS 8S 7S 6S')), 'On compare les cartes une à une, de la plus haute à la plus basse : la troisième décide (9 contre 8).');
  assert.match(explanation(score('9S 8H 7D 6C 5S'), score('9H 8D 7C 6S 5H')), /^Mêmes valeurs : la couleur/);
  assert.equal(score('9S 8H 7D 6C 5S')[0], CAT.STRAIGHT);
});

test('exercice : une question du type choisi, réponse juste', () => {
  const rand = rng(11);
  for (const type of ['tout', 'voisines', 'meme']) {
    const kinds = new Set();
    for (let k = 0; k < 200; k++) {
      const q = oneQuestion(rand, type);
      kinds.add(q.kind);
      const d = compare(evaluate(q.a), evaluate(q.b));
      assert.equal(q.answer, d > 0 ? 'A' : d < 0 ? 'B' : '=');
      assert.ok(!q.a.some((x) => q.b.some((y) => sameCard(x, y))));
    }
    const attendu = { tout: ['egalite', 'meme', 'voisines'], voisines: ['voisines'], meme: ['egalite', 'meme'] }[type];
    assert.deepEqual([...kinds].sort(), attendu, type);
  }
});
