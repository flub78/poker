// Définition du niveau 6 : vers le GTO (C6.1 à C6.5). Niveau continu : le cours parle de
// « repères de maîtrise » plutôt que de test de passage.
// Chargée par js/app.js quand l'adresse est index.html#niveau-6.
//
//   1. « Je connais et applique la MDF face à 3 tailles de mise » → test 1.
//   2 à 5. Études au solveur, score en mode entraîneur (outil externe), revue de mains sur 3 mois,
//      résultats sur 30 000 mains ou 300 tournois → à cocher.
import { makeTest, makePractice } from '../js/serie.js';
import { mdfQuestion, bluffShareQuestion, exploitQuestion, resultsQuestion } from './questions.js';

export default {
  level: 6,
  storageKey: 'poker.niveau6.v1',
  tests: [
    makeTest({
      id: 'mdf', code: 'Test 1', title: 'La MDF face à 3 tailles de mise', competences: 'C6.1',
      rule: '5 réponses sur 6 : MDF à 1/2 pot, pot et 2 pots, puis appliquée à une range',
      question: () => mdfQuestion({ mode: 'test' }), count: 6, pass: 5,
    }),
  ],
  manual: [
    { id: 'solveur', text: 'J\'ai étudié au solveur les 5 situations les plus fréquentes de mon jeu (C6.2).' },
    { id: 'entraineur', text: 'Mon score en mode entraîneur (GTO Wizard ou équivalent) dépasse 85 % sur les situations préflop.' },
    { id: 'revue', text: 'Je tiens ma revue de mains chaque semaine depuis 3 mois (C6.3).' },
    { id: 'gagnant', text: 'Je suis gagnant sur 30 000 mains ou 300 tournois à ma limite (C6.5).' },
  ],
  testsNote: 'Niveau continu : le cours parle de repères de maîtrise. Le premier se vérifie ici, les autres à la table.',
  practices: [
    makePractice({
      id: 'mdf', title: 'Défense minimale (MDF)', competences: 'C6.1',
      summary: 'Une mise adverse : quelle part de votre range devez-vous continuer ?',
      count: 10,
      goal: 'Le test porte sur les 3 tailles du cours ; ici, toutes les tailles.',
      question: () => mdfQuestion({ mode: 'free' }),
    }),
    makePractice({
      id: 'bluffs', title: 'Part de bluffs équilibrée', competences: 'C6.1',
      summary: 'Votre mise à la river : quelle part de bluffs rend l\'adversaire indifférent ?',
      count: 10,
      question: () => bluffShareQuestion(),
    }),
    makePractice({
      id: 'exploiter', title: 'Exploiter plutôt que copier', competences: 'C6.1, C6.4',
      summary: 'Un adversaire qui défend trop, pas assez ou juste ce qu\'il faut : comment vous adapter ?',
      count: 10,
      question: () => exploitQuestion(),
    }),
    makePractice({
      id: 'resultats', title: 'Mesurer ses résultats', competences: 'C6.5',
      summary: 'BB/100 en cash-game, ROI en tournoi : calculez-les, et dites si l\'échantillon suffit.',
      count: 10,
      goal: 'Pas de conclusion avant 30 000 mains ou 300 tournois.',
      question: () => resultsQuestion(),
    }),
  ],
};
