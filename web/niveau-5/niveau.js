// Définition du niveau 5 : penser en ranges et s'adapter (C5.1 à C5.6).
// Chargée par js/app.js quand l'adresse est index.html#niveau-5.
//
// Test de passage du cours :
//   1. « Sur 10 mains revues, je décris la range adverse à la river en 3 catégories » → test 1, sur
//      10 tableaux générés (4 mains de la range à classer : forte, moyenne, bluff).
//   2. « Je classe un adversaire dans un profil après 30 mains, et mes stats le confirment » → test 2 :
//      profil et exploitation à partir de ses statistiques.
//   3. « Ma bankroll respecte les seuils de C5.5 depuis 2 mois » → à cocher.
//   4. « Sur 4 semaines, j'ai respecté ma limite de perte à chaque session » → à cocher.
import { makeTest, makePractice } from '../js/serie.js';
import { rangeQuestion, profileQuestion, bankrollQuestion } from './questions.js';

export default {
  level: 5,
  storageKey: 'poker.niveau5.v1',
  tests: [
    makeTest({
      id: 'range-river', code: 'Test 1', title: 'La range adverse à la river', competences: 'C5.1, C5.2',
      rule: '8 tableaux sur 10, les 4 mains bien classées',
      question: () => rangeQuestion(), count: 10, pass: 8,
    }),
    makeTest({
      id: 'profils', code: 'Test 2', title: 'Profils adverses', competences: 'C5.4',
      rule: '8 adversaires sur 10 : profil et exploitation justes',
      question: () => profileQuestion(), count: 10, pass: 8,
    }),
  ],
  manual: [
    { id: 'bankroll', text: 'Ma bankroll respecte les seuils de C5.5 depuis 2 mois (30 tapis en cash-game, 100 droits d\'entrée en tournoi).' },
    { id: 'limite-perte', text: 'Sur 4 semaines, j\'ai respecté ma limite de perte à chaque session.' },
  ],
  practices: [
    makePractice({
      id: 'range-river', title: 'La range à la river', competences: 'C5.1, C5.2',
      summary: 'Un tableau et 4 mains de la range adverse : forte, moyenne ou bluff ?',
      count: 10,
      goal: 'Le cours le demande sur 10 de vos mains revues : à chaque tour d\'enchères, écrivez la range adverse.',
      question: () => rangeQuestion(),
    }),
    makePractice({
      id: 'profils', title: 'Profils adverses', competences: 'C5.4',
      summary: 'VPIP, PFR, AF : quel profil, et comment l\'exploiter ?',
      count: 10,
      goal: 'À la table : notez le profil de chaque adversaire après 30 mains, puis comparez avec ses statistiques.',
      question: () => profileQuestion(),
    }),
    makePractice({
      id: 'bankroll', title: 'Bankroll : quelle limite ?', competences: 'C5.5',
      summary: 'Une bankroll : quelle limite de cash-game, ou quel droit d\'entrée, sans dépasser les seuils ?',
      settings: [{
        id: 'mode', label: 'Jeu', default: 'mix',
        options: [{ value: 'mix', label: 'Cash-game et tournois' }, { value: 'cash', label: 'Cash-game' }, { value: 'tournoi', label: 'Tournois' }],
      }],
      count: 10,
      goal: 'Tenez aussi un journal de bankroll et de tilt pendant 4 semaines (C5.5, C5.6).',
      question: (s) => bankrollQuestion({ mode: s.mode }),
    }),
  ],
};
