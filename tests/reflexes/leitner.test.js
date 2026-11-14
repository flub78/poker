// Moteur Leitner des Réflexes : mêmes règles que mentor (PRD leitner §7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  boxesDue, move, planSession, startSession, recordAnswer, createRun, resumable, summary, newQuestions, emptySuite, mergeSuites, renameItems,
} from '../../web/reflexes/leitner.js';

const fixed = () => 0;               // tirage « au hasard » reproductible
const bank = (n, extra = {}) => Array.from({ length: n }, (_, i) => ({ id: `q${i + 1}`, difficulte: '', ...extra }));

test('boîtes posées : la boîte 1 et une seule boîte haute, en rotation (PRD leitner §7.1)', () => {
  const table = [1, 2, 3, 4, 5, 6, 7, 8, 16].map((n) => boxesDue(n, 5));
  assert.deepEqual(table, [[1, 2], [1, 3], [1, 2], [1, 4], [1, 2], [1, 3], [1, 2], [1, 5], [1]]);
  assert.deepEqual(boxesDue(48, 5), [1]);       // boîte calculée au-delà de la dernière
  assert.deepEqual(boxesDue(16, 6), [1, 6]);
});

test('boîtes posées : la boîte k revient exactement une séance sur 2^(k−1)', () => {
  for (let k = 2; k <= 5; k++) {
    const sessions = Array.from({ length: 64 }, (_, i) => i + 1).filter((n) => boxesDue(n, 5).includes(k));
    assert.equal(sessions.length, 64 / 2 ** (k - 1), `boîte ${k}`);
    assert.ok(sessions.every((n, i) => i === 0 || n - sessions[i - 1] === 2 ** (k - 1)), `écart boîte ${k}`);
  }
});

test('mouvements : monte si juste, recule si faux, boîte 1 au second échec, maîtrisée au sommet', () => {
  assert.deepEqual(move({ box: 2, fails: 0 }, true, 5, 'T'), { box: 3, fails: 0, mastered: null });
  assert.deepEqual(move({ box: 3, fails: 0 }, false, 5, 'T'), { box: 2, fails: 1, mastered: null });
  assert.deepEqual(move({ box: 1, fails: 0 }, false, 5, 'T'), { box: 1, fails: 1, mastered: null });
  assert.deepEqual(move({ box: 4, fails: 1 }, false, 5, 'T'), { box: 1, fails: 2, mastered: null });
  assert.deepEqual(move({ box: 2, fails: 3 }, true, 5, 'T'), { box: 3, fails: 0, mastered: null });
  assert.deepEqual(move({ box: 5, fails: 0 }, true, 5, 'T'), { box: 5, fails: 0, mastered: 'T' });
});

test('introduction : la boîte 1 est complétée jusqu\'au minimum', () => {
  const questions = bank(25);
  const plan = planSession(emptySuite(), questions, { minBoxOne: 10, rand: fixed });
  assert.equal(plan.number, 1);
  assert.equal(plan.introduced.length, 10);
  assert.equal(plan.queue.length, 10);
  const suite = startSession(emptySuite(), plan, 'T');
  assert.equal(suite.session, 1);
  assert.equal(Object.keys(suite.items).length, 10);
  // 4 questions encore en boîte 1 : on en introduit 6.
  let s = suite;
  plan.introduced.slice(0, 6).forEach((id) => { s = recordAnswer(s, id, true); });
  const next = planSession(s, questions, { minBoxOne: 10, rand: fixed });
  assert.equal(next.introduced.length, 6);
  assert.equal(next.queue.length, 4 + 6);       // séance 2 : boîtes 1 et 3, la boîte 2 attend la séance 3
});

test('introduction par difficulté croissante, sans difficulté = moyenne', () => {
  const questions = [{ id: 'd', difficulte: 'difficile' }, { id: 'm', difficulte: '' }, { id: 'f', difficulte: '1' }, { id: 'm2', difficulte: 'moyen' }];
  assert.deepEqual(newQuestions(emptySuite(), questions, fixed).map((q) => q.id)[0], 'f');
  assert.equal(newQuestions(emptySuite(), questions, fixed).at(-1).id, 'd');
});

test('séance : seules les boîtes échues sont posées ; maîtrisées jamais', () => {
  const questions = bank(4);
  const suite = { ...emptySuite(), session: 2, items: {
    q1: { box: 1, fails: 0, mastered: null }, q2: { box: 2, fails: 0, mastered: null },
    q3: { box: 3, fails: 0, mastered: null }, q4: { box: 5, fails: 0, mastered: 'T' },
  } };
  const plan = planSession(suite, questions, { minBoxOne: 0, rand: fixed });
  assert.equal(plan.number, 3);
  assert.deepEqual([...plan.queue].sort(), ['q1', 'q2']);   // séance 3 : boîtes 1 et 2
  const plan4 = planSession({ ...suite, session: 5 }, questions, { minBoxOne: 0, rand: fixed });
  assert.deepEqual([...plan4.queue].sort(), ['q1', 'q3']);  // séance 6 : boîtes 1 et 3
});

test('reprise des erreurs : reposée en fin de séance, seule la première réponse compte', () => {
  const run = createRun(['a', 'b']);
  assert.equal(run.current(), 'a');
  assert.deepEqual(run.answer(false), { counts: true });
  assert.equal(run.current(), 'b');
  assert.deepEqual(run.answer(true), { counts: true });
  assert.equal(run.current(), 'a');                 // reprise
  assert.deepEqual(run.answer(false), { counts: false });
  assert.deepEqual(run.answer(true), { counts: false });
  assert.equal(run.current(), null);
  assert.deepEqual(run.stats(), { asked: 2, good: 1, retries: 2, left: 0, total: 2 });
});

// Introduite à la séance 1 et toujours juste : boîte 2 après la séance 1, 3 après la 3, 4 après la 6,
// 5 après la 12, maîtrisée à la 24.
test('une question sans faute, introduite à la séance 1, est maîtrisée à la séance 24 avec 5 boîtes', () => {
  const questions = bank(1);
  let suite = emptySuite();
  let mastered = null;
  for (let n = 1; n <= 40 && !mastered; n++) {
    const plan = planSession(suite, questions, { rand: fixed });
    suite = startSession(suite, plan, `S${n}`);
    for (const id of plan.queue) suite = recordAnswer(suite, id, true, 5, `S${n}`);
    mastered = suite.items.q1.mastered;
  }
  assert.equal(mastered, 'S24');
});

test('résumé : nouvelles, boîtes, maîtrisées, suite acquise', () => {
  const questions = bank(3);
  const suite = { ...emptySuite(), session: 4, items: { q1: { box: 2, fails: 0, mastered: null }, q2: { box: 5, fails: 0, mastered: 'T' } } };
  assert.deepEqual(summary(suite, questions), { total: 3, fresh: 1, boxes: [0, 1, 0, 0, 0], mastered: 1, acquired: false, sessions: 4 });
  const all = { ...suite, items: { ...suite.items, q1: { box: 5, mastered: 'T' }, q3: { box: 5, mastered: 'T' } } };
  assert.equal(summary(all, questions).acquired, true);
});

test('fusion de deux sauvegardes : l\'état le plus avancé l\'emporte, sans perdre de question', () => {
  const a = { ...emptySuite(), session: 5, sessions: ['1', '2'], items: { q1: { box: 3 }, q2: { box: 2 } } };
  const b = { ...emptySuite(), session: 2, sessions: ['1', '0'], items: { q1: { box: 1 }, q3: { box: 1 } } };
  const m = mergeSuites(b, a);
  assert.equal(m.session, 5);
  assert.deepEqual(m.items, { q1: { box: 3 }, q2: { box: 2 }, q3: { box: 1 } });
  assert.deepEqual(m.sessions, ['0', '1', '2']);
  assert.equal(mergeSuites(undefined, a), a);
});

test('séance interrompue : l\'instantané reprend les questions restantes, reprises comprises', () => {
  const run = createRun(['a', 'b', 'c']);
  run.answer(false);                         // a : faux, reposée en fin de séance
  run.answer(true);                          // b : juste
  const snap = JSON.parse(JSON.stringify(run.snapshot()));   // passage par le stockage
  assert.deepEqual(snap, { todo: ['c', 'a'], answered: ['a', 'b'], good: 1, retries: 0, total: 3 });
  const again = createRun(null, snap);
  assert.equal(again.current(), 'c');
  assert.equal(again.isRetry('c'), false);
  assert.deepEqual(again.answer(true), { counts: true });
  assert.equal(again.isRetry('a'), true);
  assert.deepEqual(again.answer(true), { counts: false });   // reprise : ne compte pas
  assert.deepEqual(again.stats(), { asked: 3, good: 2, retries: 1, left: 0, total: 3 });
});

test('reprendre : même numéro de séance ; nouvelle séance : numéro suivant, autres boîtes', () => {
  const questions = bank(12);
  let suite = startSession(emptySuite(), planSession(emptySuite(), questions, { rand: fixed }), 'T');
  const run = createRun(planSession(emptySuite(), questions, { rand: fixed }).queue);
  run.answer(true);
  suite = { ...recordAnswer(suite, run.snapshot().answered[0], true), current: { number: suite.session, ...run.snapshot() } };
  const pending = resumable(suite);
  assert.equal(pending.number, 1);
  assert.equal(pending.run.stats().left, 9);
  assert.equal(planSession(suite, questions, { rand: fixed }).number, 2);   // nouvelle séance : la 2
  // Une question retirée de la banque est sautée ; plus rien à poser : rien à reprendre.
  assert.equal(resumable(suite, (id) => id !== pending.run.current()).run.stats().left, 8);
  assert.equal(resumable(suite, () => false), null);
  // Une fois une autre séance commencée, l'ancienne n'est plus reprenable.
  assert.equal(resumable({ ...suite, session: 2 }), null);
  assert.equal(resumable(emptySuite()), null);
});

test('changement d\'identifiants : progression et séance en cours reprises, état existant gardé', () => {
  const suite = { ...emptySuite(), session: 3, items: { h1: { box: 3 }, h2: { box: 2 }, 'ref:B': { box: 5 } },
    current: { number: 3, todo: ['h1', 'x'], answered: ['h2'], good: 1, retries: 0, total: 3 } };
  const { suite: s, moved } = renameItems(suite, new Map([['h1', 'ref:A'], ['h2', 'ref:B'], ['absent', 'ref:C']]));
  assert.equal(moved, 1);
  assert.deepEqual(s.items, { 'ref:A': { box: 3 }, 'ref:B': { box: 5 } });   // ref:B déjà suivie : son état reste
  assert.deepEqual(s.current.todo, ['ref:A', 'x']);
  assert.deepEqual(s.current.answered, ['ref:B']);
  assert.equal(renameItems(emptySuite(), new Map([['a', 'b']])).moved, 0);
});
