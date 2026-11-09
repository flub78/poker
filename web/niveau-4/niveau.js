// Définition du niveau 4 : jouer après le flop (C4.1 à C4.6).
// Chargée par js/app.js quand l'adresse est index.html#niveau-4.
//
// Test de passage du cours :
//   1. « Sur 20 mains revues, chaque mise a une raison nommée (valeur ou bluff) » → test 1, sur
//      20 situations générées (2 séries de 10).
//   2. « Je classe 10 flops par texture et je donne la taille de c-bet adaptée » → test 2.
//   3. « Je planifie la turn avant de miser le flop sur 10 mains d'affilée » → à cocher (habitude de jeu).
//   4. « Sur 5 000 mains, mon résultat est au moins à l'équilibre » → à cocher (résultat réel).
import { makeTest, makePractice } from '../js/serie.js';
import { betReasonQuestion, textureQuestion, sprQuestion } from './questions.js';

export default {
  level: 4,
  storageKey: 'poker.niveau4.v1',
  tests: [
    makeTest({
      id: 'raison', code: 'Test 1', title: 'Valeur, bluff ou aucune raison', competences: 'C4.1, C4.6',
      rule: '18 situations sur 20, en 2 séries de 10',
      question: () => betReasonQuestion(), count: 10, series: 2, pass: 18,
    }),
    makeTest({
      id: 'textures', code: 'Test 2', title: 'Texture du flop et taille de c-bet', competences: 'C4.2 à C4.4',
      rule: '9 flops sur 10, texture et taille de c-bet justes',
      question: () => textureQuestion({ withSize: true }), count: 10, pass: 9,
    }),
  ],
  manual: [
    { id: 'plan-turn', text: 'Je planifie la turn avant de miser le flop, sur 10 mains d\'affilée (C4.5).' },
    { id: 'equilibre', text: 'Sur 5 000 mains en micro-limites (ou 30 tournois), mon résultat est au moins à l\'équilibre.' },
  ],
  practices: [
    makePractice({
      id: 'raison', title: 'Valeur, bluff ou aucune raison', competences: 'C4.1, C4.6',
      summary: 'Une main et un tableau : si vous misez, est-ce pour la valeur, en bluff, ou sans raison ?',
      count: 10,
      goal: 'Le cours le demande aussi après chaque session, sur 10 de vos mains jouées.',
      question: () => betReasonQuestion(),
    }),
    makePractice({
      id: 'textures', title: 'Textures de flop', competences: 'C4.2 à C4.4',
      summary: 'Un flop au hasard : sec, humide, apparié ou monotone ? Et quelle c-bet ?',
      settings: [{
        id: 'size', label: 'Questions', default: 'yes',
        options: [{ value: 'yes', label: 'Texture et taille de c-bet' }, { value: 'no', label: 'Texture seulement' }],
      }],
      count: 10,
      goal: 'Objectif du cours : 30 flops, soit 3 séries de 10.',
      question: (s) => textureQuestion({ withSize: s.size === 'yes' }),
    }),
    makePractice({
      id: 'spr', title: 'SPR et engagement du tapis', competences: 'C4.5',
      summary: 'Pot et tapis au flop : calculez le SPR, puis dites si votre main justifie de mettre tout le tapis.',
      count: 10,
      goal: 'Objectif du cours : le SPR de 20 mains, soit 2 séries de 10.',
      question: () => sprQuestion(),
    }),
  ],
};
