// Lecture d'une banque au format d'échange de mentor (PRD banques §8) et verdicts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseCsv, readBank, parseNumber, normalize, verdict, expected, levelOfTheme, questionId, parseList, legacyIds } from '../../web/reflexes/banque.js';

const BANQUE = new URL('../../web/reflexes/banque/', import.meta.url);

test('CSV : guillemets, guillemets doublés, retour à la ligne dans un champ, BOM, fin CRLF', () => {
  const rows = parseCsv('﻿a;b;c\r\n"x;y";"il dit ""oui""";"deux\nlignes"\r\n\r\n1;2;3');
  assert.deepEqual(rows, [['a', 'b', 'c'], ['x;y', 'il dit "oui"', 'deux\nlignes'], ['1', '2', '3']]);
});

test('CSV : séparateur virgule deviné sur l\'en-tête', () => {
  assert.deepEqual(parseCsv('enonce,reponse\nQ,"a, b"'), [['enonce', 'reponse'], ['Q', 'a, b']]);
});

test('en-têtes et types normalisés (majuscules, accents, espaces, tirets)', () => {
  assert.equal(normalize('Bonne réponse'), 'bonne_reponse');
  assert.equal(normalize('Vrai-faux'), 'vrai_faux');
  assert.equal(normalize(' Énoncé '), 'enonce');
});

test('nombres : virgule, point, espaces des milliers, moins typographique', () => {
  assert.equal(parseNumber('4 806'), 4806);
  assert.equal(parseNumber('1,225'), 1.225);
  assert.equal(parseNumber('2.5'), 2.5);
  assert.equal(parseNumber('−25'), -25);
  assert.equal(parseNumber('abc'), null);
  assert.equal(parseNumber(''), null);
});

// L'exemple du PRD banques §8.6, réduit aux types lus ici, plus deux types écartés.
const EXEMPLE = `type;enonce;theme;difficulte;reponse;variantes;valeur;type_tolerance;tolerance;unite;elements;bonne_reponse;mauvaise_reponse_1;mauvaise_reponse_2;melange
qcm;Capitale de la Suisse ?;Europe;1;;;;;;;;Berne;Zurich;Genève;non
vrai_faux;Le Danube traverse Vienne.;Europe;1;vrai;;;;;;;;;;
auto_evaluation;Comment démontrer le théorème de Pythagore ?;Géométrie;2;Par les aires.;;;;;;;;;;
valeur_numerique;Altitude du mont Blanc ?;Relief;2;;;4806;absolue;10;m;;;;;
reponse_courte;Capitale de la Belgique ?;Europe;1;Bruxelles;Brussel;;;;;;;;;
enumeration;Citez trois capitales scandinaves.;Europe;2;;;;;;;Oslo|Stockholm;;;;
;Sans type : QCM par défaut ?;;;;;;;;;;Oui;Non;;`;

test('banque d\'exemple : quatre types lus, deux écartés avec leur motif', () => {
  const { questions, ignored } = readBank(EXEMPLE);
  assert.deepEqual(questions.map((q) => q.type), ['qcm', 'vrai_faux', 'auto_evaluation', 'valeur_numerique', 'qcm']);
  assert.deepEqual(ignored.map((x) => [x.line, x.type]), [[6, 'reponse_courte'], [7, 'enumeration']]);
  const [qcm, vf, , num, defaut] = questions;
  assert.deepEqual([qcm.bonne, qcm.mauvaises, qcm.melange], ['Berne', ['Zurich', 'Genève'], false]);
  assert.equal(defaut.melange, true);
  assert.equal(vf.reponse, true);
  assert.deepEqual([num.valeur, num.typeTolerance, num.tolerance, num.unite], [4806, 'absolue', 10, 'm']);
});

test('lignes invalides écartées : QCM sans mauvaise réponse, tolérance inconnue, énoncé vide', () => {
  const { questions, ignored } = readBank(`type;enonce;bonne_reponse;valeur;type_tolerance;tolerance
qcm;Q1;A;;;
valeur_numerique;Q2;;3;environ;1
valeur_numerique;Q3;;3;absolue;
qcm;;A;;;`);
  assert.equal(questions.length, 0);
  assert.deepEqual(ignored.map((x) => x.line), [2, 3, 4, 5]);
});

test('verdicts : QCM, vrai / faux, auto-évaluation', () => {
  const { questions: [qcm, vf, auto] } = readBank(EXEMPLE);
  assert.equal(verdict(qcm, 'Berne'), true);
  assert.equal(verdict(qcm, 'Zurich'), false);
  assert.equal(verdict(vf, true), true);
  assert.equal(verdict(vf, false), false);
  assert.equal(verdict(auto, true), true);
  assert.equal(verdict(auto, false), false);
});

test('verdicts : valeur numérique et tolérances', () => {
  const q = (valeur, typeTolerance, tolerance) => ({ type: 'valeur_numerique', valeur, typeTolerance, tolerance });
  assert.equal(verdict(q(35, 'absolue', 2), '36'), true);
  assert.equal(verdict(q(35, 'absolue', 2), '37'), true);
  assert.equal(verdict(q(35, 'absolue', 2), '37,5'), false);
  assert.equal(verdict(q(2.5, 'aucune', 0), '2,5'), true);
  assert.equal(verdict(q(2.5, 'aucune', 0), '2.50'), true);
  assert.equal(verdict(q(2.5, 'aucune', 0), '3'), false);
  assert.equal(verdict(q(-25, 'aucune', 0), '-25'), true);
  assert.equal(verdict(q(200, 'pourcentage', 10), '219'), true);
  assert.equal(verdict(q(200, 'pourcentage', 10), '221'), false);
  assert.equal(verdict(q(10, 'aucune', 0), 'dix'), false);
  assert.equal(expected({ ...q(35, 'absolue', 2), unite: '%' }), '35 % (± 2)');
  assert.equal(expected(q(-25, 'aucune', 0)), '−25');
});

test('niveau du cours tiré du thème', () => {
  assert.equal(levelOfTheme('Niveau 3 — Les probabilités'), 3);
  assert.equal(levelOfTheme('niveau 12'), 12);
  assert.equal(levelOfTheme('Europe'), null);
});

test('identifiant : stable, dépend du type et de l\'énoncé', () => {
  assert.equal(questionId('qcm', 'Q ?'), questionId('qcm', ' Q ? '));
  assert.notEqual(questionId('qcm', 'Q ?'), questionId('vrai_faux', 'Q ?'));
  assert.notEqual(questionId('qcm', 'Q ?'), questionId('qcm', 'Q !'));
});

// La banque livrée avec l'application (export mentor déposé dans web/reflexes/banque/).
test('banque livrée : lisible en entier, identifiants uniques, images présentes, niveaux 1 à 6', () => {
  const { questions, ignored } = readBank(readFileSync(new URL('questions.csv', BANQUE), 'utf8'));
  assert.deepEqual(ignored, []);
  assert.ok(questions.length >= 150, `${questions.length} questions`);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length, 'deux questions ont le même identifiant');
  for (const q of questions.filter((x) => x.image)) {
    assert.ok(existsSync(new URL(`images/${q.image}`, BANQUE)), `image manquante : ${q.image}`);
    assert.ok(q.alt, `texte alternatif manquant : ${q.image}`);
  }
  for (const n of [1, 2, 3, 4, 5, 6]) assert.ok(questions.some((q) => levelOfTheme(q.theme) === n), `niveau ${n} vide`);
  for (const q of questions.filter((x) => x.type === 'qcm')) {
    assert.ok(!q.mauvaises.includes(q.bonne), `bonne réponse aussi parmi les mauvaises : ${q.enonce}`);
    // Ordre fixe : toutes les propositions, une fois chacune (colonne ordre).
    if (!q.melange) assert.deepEqual([...q.ordre].sort(), [q.bonne, ...q.mauvaises].sort(), `ordre incomplet : ${q.reference}`);
  }
  // Chaque question a sa référence (l'ID du brouillon Markdown), unique.
  assert.ok(questions.every((q) => q.reference), 'question sans référence');
  assert.equal(new Set(questions.map((q) => q.reference)).size, questions.length);
  for (const q of questions) {
  }
});

// Exemples du cours : la banque et le cours disent la même chose (CLAUDE.md, tests).
test('banque livrée : quelques réponses du cours', () => {
  const { questions } = readBank(readFileSync(new URL('questions.csv', BANQUE), 'utf8'));
  const find = (start) => questions.find((q) => q.enonce.startsWith(start));
  assert.equal(verdict(find('Le pot fait 100, l\'adversaire mise 50'), '25'), true);                                    // C3.3
  assert.equal(verdict(find('Vous payez 50 pour gagner 150'), '10'), true);                          // C3.6
  assert.equal(verdict(find('Avec un tirage couleur au flop'), '35'), true);                        // C3.2
  assert.equal(verdict(find('Un carré bat un full'), true), true);                                // C1.3
  assert.equal(verdict(find('Pot au flop : 10 BB. Votre tapis : 150 BB'), '6'), true);              // C4.5
  assert.equal(verdict(find('Face à une mise d\'un demi-pot'), '66,7'), true);                        // C6.1
  assert.equal(verdict(find('Vous avez payé 1 000 € de droits d\'entrée'), '20'), true);                        // C6.5
});

test('listes d\'une cellule : séparateur, caractères réservés, éléments vides', () => {
  assert.deepEqual(parseList('A | B |  | Partage'), ['A', 'B', 'Partage']);
  assert.deepEqual(parseList('1/2 \\| 2/3 | x\\=y | a\\\\b'), ['1/2 | 2/3', 'x=y', 'a\\b']);
  assert.deepEqual(parseList(''), []);
});

test('référence : identifiant de la question, unique dans le fichier', () => {
  const { questions, ignored } = readBank(`type;reference;enonce;reponse
vrai_faux;N1-01;Un carré bat un full.;vrai
vrai_faux;N1-01;Autre énoncé.;faux
vrai_faux;;Sans référence.;vrai`);
  assert.deepEqual(questions.map((q) => [q.reference, q.id]), [['N1-01', 'ref:N1-01'], [null, questionId('vrai_faux', 'Sans référence.')]]);
  assert.deepEqual(ignored.map((x) => x.line), [3]);
  // L'énoncé peut changer, l'identifiant reste.
  assert.equal(readBank('type;reference;enonce;reponse\nvrai_faux;N1-01;Énoncé corrigé.;vrai').questions[0].id, 'ref:N1-01');
});

test('anciens identifiants d\'une question à référence (reprise de la progression)', () => {
  const q = { type: 'qcm', enonce: 'Qui gagne ?', reference: 'N1-23' };
  assert.deepEqual(legacyIds(q), [questionId('qcm', 'Qui gagne ?'), questionId('qcm', 'Qui gagne ? (N1-23)')]);
  assert.deepEqual(legacyIds({ ...q, reference: null }), []);
});

test('ordre des propositions : sans mélange, ordre du fichier ; erreurs signalées', () => {
  const head = 'type;enonce;bonne_reponse;mauvaise_reponse_1;mauvaise_reponse_2;melange;ordre';
  const { questions, ignored } = readBank(`${head}
qcm;Q1;Partage;A;B;non;A | B | Partage
qcm;Q2;Partage;A;B;non;
qcm;Q3;Partage;A;B;oui;A | B | Partage
qcm;Q4;Partage;A;B;non;A | B
qcm;Q5;Partage;A;B;non;A | B | C | Partage
qcm;Q6;Partage;A;B;non;A | A | Partage`);
  assert.deepEqual(questions.map((q) => q.ordre), [['A', 'B', 'Partage'], ['Partage', 'A', 'B'], null]);
  assert.deepEqual(ignored.map((x) => x.line), [5, 6, 7]);
});
