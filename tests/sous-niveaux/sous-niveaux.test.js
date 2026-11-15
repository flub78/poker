// Sous-niveaux du niveau 2 (web/js/sous-niveaux.js) : thèmes de la banque, choix cumulatif, fusion
// des choix enregistrés ; stratégie, exercices et simulateur réglés sur une étape de la grille.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTheme, questionsFor, chosen, mergeChoices, subLevelsOf } from '../../web/js/sous-niveaux.js';
import { STEPS, FULL, minPosition, openRange, decide } from '../../web/niveau-2/strategy.js';
import { has } from '../../web/niveau-2/ranges.js';
import { questionsUpTo, Q as SEUILS } from '../../web/niveau-2/practice/seuils.js';
import { readBank } from '../../web/reflexes/banque.js';
import { newHand, act, legalActions } from '../../web/simulateur/moteur/table.js';
import { decider } from '../../web/simulateur/bots.js';
import { judge } from '../../web/simulateur/mentor.js';
import { judgeStep, judgeRules } from '../../web/simulateur/evaluation.js';
import { rng } from '../../web/js/cards.js';
import { cartes } from '../aide.js';

test('les étapes de la grille sont les sous-niveaux 2.0 à 2.5', () => {
  assert.deepEqual(STEPS.map((s) => s.code), ['2.0', '2.1', '2.2', '2.3', '2.4', '2.5']);
  assert.equal(STEPS[FULL].step, FULL);
  assert.equal(subLevelsOf(2), STEPS);
  assert.equal(subLevelsOf(1), null);
});

test('thème : niveau et sous-niveau', () => {
  assert.deepEqual(parseTheme('Niveau 2.3 — Le reste du CO'), { level: 2, step: 3 });
  assert.deepEqual(parseTheme('Niveau 2 — Éviter les grosses erreurs'), { level: 2, step: null });
  assert.deepEqual(parseTheme('niveau 10'), { level: 10, step: null });
  assert.deepEqual(parseTheme('Europe'), { level: null, step: null });
  assert.deepEqual(parseTheme(''), { level: null, step: null });
});

test('questions d\'un sous-niveau : cumulatif ; sans sous-niveau, posée partout', () => {
  const qs = [
    { id: 'a', theme: 'Niveau 2.0 — Le filet' },
    { id: 'b', theme: 'Niveau 2.3 — Le reste du CO' },
    { id: 'c', theme: 'Niveau 2 — ancien thème' },
    { id: 'd', theme: 'Niveau 3 — Les probabilités' },
  ];
  const ids = (list) => list.map((q) => q.id);
  assert.deepEqual(ids(questionsFor(qs, 2, 0)), ['a', 'c']);
  assert.deepEqual(ids(questionsFor(qs, 2, 2)), ['a', 'c']);
  assert.deepEqual(ids(questionsFor(qs, 2, 3)), ['a', 'b', 'c']);
  assert.deepEqual(ids(questionsFor(qs, 2)), ['a', 'b', 'c']);
  assert.deepEqual(ids(questionsFor(qs, 3, 0)), ['d']);
});

test('choix enregistré : première étape par défaut, code inconnu ignoré', () => {
  assert.equal(chosen({}, 2).code, '2.0');
  assert.equal(chosen({ 2: { code: '2.3', date: '2026-11-15' } }, 2).step, 3);
  assert.equal(chosen({ 2: { code: '2.9', date: '2026-11-15' } }, 2).code, '2.0');
  assert.equal(chosen({}, 1), null);
});

test('fusion des choix : le plus récent l\'emporte, entrées illisibles ignorées', () => {
  const base = { 2: { code: '2.1', date: '2026-11-10T00:00:00Z' } };
  assert.deepEqual(mergeChoices(base, { 2: { code: '2.3', date: '2026-11-12T00:00:00Z' } }),
    { data: { 2: { code: '2.3', date: '2026-11-12T00:00:00Z' } }, changed: 1 });
  assert.equal(mergeChoices(base, { 2: { code: '2.3', date: '2026-11-01T00:00:00Z' } }).changed, 0);
  assert.equal(mergeChoices(base, { 2: { code: 3 }, 4: null }).changed, 0);
  assert.equal(mergeChoices(null, null).changed, 0);
});

test('position minimum selon l\'étape', () => {
  assert.equal(minPosition('22', 0), 'jamais');       // étape 0 : la liste UTG partout
  assert.equal(minPosition('AA', 0), 'UTG');
  assert.equal(minPosition('22', 1), 'BTN');          // étape 1 : la liste du bouton
  assert.equal(minPosition('55', 1), 'BTN');
  assert.equal(minPosition('55', 2), 'CO');           // étape 2 : paires et As du CO
  assert.equal(minPosition('KJo', 2), 'BTN');
  assert.equal(minPosition('KJo', 3), 'CO');          // étape 3 : le reste du CO
  assert.equal(minPosition('KJo'), 'CO');
  assert.equal(minPosition('72o'), 'jamais');
});

test('chaque étape est plus serrée que la suivante (listes d\'ouverture emboîtées)', () => {
  for (const pos of ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB']) {
    for (let s = 0; s < FULL; s++) {
      for (const code of openRange(pos, s).set) assert.ok(has(openRange(pos, s + 1), code), `${pos} ${code} étape ${s}`);
    }
  }
  assert.equal(decide({ type: 'vsRaise', hero: 'BTN' }, '99', 3).action, 'fold');   // on suit à partir de l'étape 4
  assert.equal(decide({ type: 'vsRaise', hero: 'BTN' }, '99', 4).action, 'call');
});

test('seuils éclair : questions cumulées par étape, réponses parmi les choix', () => {
  assert.equal(questionsUpTo(FULL).length, SEUILS.length);
  assert.equal(questionsUpTo(0).length, 6);
  for (let s = 0; s < FULL; s++) assert.ok(questionsUpTo(s).length <= questionsUpTo(s + 1).length);
  for (const q of SEUILS) {
    assert.ok(q.o.includes(q.a), q.q);
    assert.ok(Number.isInteger(q.step) && q.step >= 0 && q.step <= FULL, q.q);
  }
});

test('banque des Réflexes : chaque question du niveau 2 a un sous-niveau, chaque sous-niveau a des questions', () => {
  const { questions } = readBank(readFileSync(new URL('../../web/reflexes/banque/questions.csv', import.meta.url), 'utf8'));
  const n2 = questions.filter((q) => parseTheme(q.theme).level === 2);
  assert.ok(n2.length > 0);
  for (const q of n2) assert.notEqual(parseTheme(q.theme).step, null, `${q.reference} : ${q.theme}`);
  for (const s of STEPS) {
    assert.ok(n2.some((q) => parseTheme(q.theme).step === s.step), `aucune question en ${s.code}`);
    assert.ok(n2.filter((q) => parseTheme(q.theme).step === s.step).every((q) => q.theme.startsWith(`Niveau ${s.code} — ${s.name}`)), s.code);
  }
});

// Simulateur. Table à 6, bouton au siège 0 : SB 1, BB 2, UTG 3, MP 4, CO 5.
function table(holes) {
  const h = Array(6).fill(null);
  for (const [seat, t] of Object.entries(holes)) h[seat] = cartes(t);
  return newHand({ stacks: Array(6).fill(200), button: 0, rand: rng(1), preset: { holes: h, board: [] } });
}

test('simulateur : l\'humain au niveau 2 est conseillé et jugé selon son sous-niveau', () => {
  const h = table({ 5: 'AS 7S' });                       // CO, A7s : dans la liste du CO à partir de l'étape 2
  act(h, { type: 'fold' });                              // UTG
  act(h, { type: 'fold' });                              // MP
  assert.equal(h.toAct, 5);
  assert.equal(decider(h, 5, 2, 0).action.type, 'fold');
  assert.equal(decider(h, 5, 2, 0).rules, '2.0');
  assert.equal(decider(h, 5, 2, 2).action.type, 'raise');
  assert.equal(decider(h, 5, 2).action.type, 'raise');
  assert.equal(decider(h, 5, 2).rules, '2');
  assert.equal(decider(h, 5, 2, FULL).rules, '2');       // la dernière étape est la grille complète
  assert.equal(decider(h, 5, 3, 0).rules, '3');          // le sous-niveau ne vaut qu'au niveau 2
  assert.equal(decider(h, 5, 1, 0).action.type, 'fold'); // niveau 1 : la liste UTG partout
  assert.equal(decider(h, 5, 1, 0).rules, '1');
  const raise = { type: 'raise', to: 5 };
  const j0 = judge(h, raise, decider(h, 5, 2, 0), legalActions(h));
  assert.notEqual(j0.verdict, 'conforme');
  assert.equal(j0.level, '2.0');
  assert.equal(judge(h, raise, decider(h, 5, 2, 2), legalActions(h)).verdict, 'conforme');
});

test('évaluation : sous-niveau de l\'humain seulement, aux règles du niveau 2', () => {
  assert.equal(judgeStep({ human: true, level: 2, step: 3 }), 3);
  assert.equal(judgeRules({ human: true, level: 2, step: 3 }), '2.3');
  assert.equal(judgeStep({ human: true, level: 2, step: FULL }), null);
  assert.equal(judgeStep({ human: true, level: 3, step: 3 }), null);
  assert.equal(judgeStep({ human: false, level: 2, step: 3 }), null);
  assert.equal(judgeRules({ human: true, level: 2, step: null }), '2');
  // Niveau 1 : les règles du niveau 1 sont l'étape 0 de la grille (le filet).
  assert.equal(judgeStep({ human: true, level: 1, step: 0 }), 0);
  assert.equal(judgeRules({ human: true, level: 1, step: 0 }), '1');
});
