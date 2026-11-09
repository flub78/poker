// Définition du niveau 3 : les probabilités (C3.1 à C3.6).
// Chargée par js/app.js quand l'adresse est index.html#niveau-3.
//
// Chaque série pose 10 questions au plus. Les nombres du cours restent les objectifs : un test de
// 20 situations se passe en 2 séries de 10, avec des données différentes, et le score est
// additionné ; un exercice se refait par séries (« 50 cartes-flash » = 5 séries).
import { makeTest, makePractice } from '../js/serie.js';
import {
  outsQuestion, requiredQuestion, callFoldQuestion, evQuestion, duelQuestion,
} from './questions.js';

const STREET = {
  id: 'street', label: 'Moment', default: 'mix',
  options: [
    { value: 'mix', label: 'Flop et turn' },
    { value: 'flop', label: 'Flop seulement' },
    { value: 'turn', label: 'Turn seulement' },
  ],
};

const tests = [
  makeTest({
    id: 'outs', code: 'Test 1', title: 'Compter les outs', competences: 'C3.1',
    rule: '20 situations de tirage sans erreur, en 2 séries de 10',
    question: () => outsQuestion(), count: 10, series: 2, pass: 20,
  }),
  makeTest({
    id: 'equites', code: 'Test 2', title: 'Tableau des équités requises', competences: 'C3.3',
    rule: 'les 6 repères du tableau de C3.3, sans erreur (à 1 point près)',
    question: () => requiredQuestion({ mode: 'table' }), count: 6, pass: 6,
  }),
  makeTest({
    id: 'call-fold', code: 'Test 3', title: 'Call ou fold en 10 secondes', competences: 'C3.2, C3.3',
    rule: '18 décisions sur 20, chacune en moins de 10 secondes, en 2 séries de 10',
    question: () => callFoldQuestion(), count: 10, series: 2, pass: 18, limit: 10,
  }),
  makeTest({
    id: 'ev', code: 'Test 4', title: 'Espérance de gain d\'un call', competences: 'C3.6',
    rule: '4 calculs sur 5, à 1 jeton près',
    question: () => evQuestion(), count: 5, pass: 4,
  }),
];

const practices = [
  makePractice({
    id: 'outs', title: 'Compter les outs', competences: 'C3.1, C3.2',
    summary: 'Vos cartes et le tableau : combien d\'outs ? La correction montre les cartes et la règle du 2 et du 4.',
    settings: [STREET], count: 10,
    goal: 'Le test demande 20 situations sans erreur : deux séries de 10 parfaites.',
    question: (s) => outsQuestion({ street: s.street }),
  }),
  makePractice({
    id: 'cartes-flash', title: 'Cartes-flash : call ou fold', competences: 'C3.2, C3.3',
    summary: 'Un tirage et une mise : suivre ou se coucher, en moins de 10 secondes.',
    settings: [STREET, {
      id: 'time', label: 'Temps limite', default: '10',
      options: [{ value: '10', label: '10 secondes' }, { value: '20', label: '20 secondes' }, { value: '0', label: 'Sans limite' }],
    }],
    count: 10,
    goal: 'Objectif du cours : 50 cartes-flash, soit 5 séries de 10.',
    question: (s) => callFoldQuestion({ street: s.street }),
  }),
  makePractice({
    id: 'equites', title: 'Équités requises', competences: 'C3.3',
    summary: 'Une mise adverse : quelle équité faut-il pour suivre ?',
    settings: [{
      id: 'mode', label: 'Mises', default: 'table',
      options: [{ value: 'table', label: 'Repères du cours (1/4 de pot à 2 pots)' }, { value: 'free', label: 'Montants quelconques' }],
    }],
    count: 10,
    goal: 'Le test demande les 6 repères du tableau sans erreur.',
    question: (s) => requiredQuestion({ mode: s.mode }),
  }),
  makePractice({
    id: 'duels', title: 'Duels préflop', competences: 'C3.5',
    summary: 'Deux mains face à face avant le flop : quelle est l\'équité du favori ?',
    count: 10,
    goal: 'Objectif du cours : 20 duels, soit 2 séries de 10. Vérifiez dans Equilab ceux qui vous surprennent.',
    question: () => duelQuestion(),
  }),
  makePractice({
    id: 'ev', title: 'Espérance de gain', competences: 'C3.6',
    summary: 'Un call, un gain possible, une équité : calculez l\'EV.',
    count: 5,
    goal: 'Le test demande 4 calculs justes sur 5.',
    question: () => evQuestion(),
  }),
];

export default {
  level: 3,
  storageKey: 'poker.niveau3.v1',
  tests,
  practices,
  testsNote: 'Une série pose 10 questions au plus. Les tests de 20 situations se passent en 2 séries de 10, '
    + 'avec des situations différentes ; le score des deux séries est additionné.',
};
