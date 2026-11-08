// Définition du niveau 2 : ses tests, ses exercices, l'aide-mémoire et sa feuille de style.
// Chargée par js/app.js quand l'adresse est index.html#niveau-2.
import grille from './exercises/grille.js';
import quiz from './exercises/quiz.js';
import decision from './practice/decision.js';
import positionMin from './practice/position-min.js';
import colorier from './practice/colorier.js';
import seuils from './practice/seuils.js';
import { renderAide } from './aide.js';

export default {
  level: 2,
  storageKey: 'poker.niveau2.v1',
  css: 'style.css',                 // relatif au dossier du niveau
  tests: [grille, quiz],
  practices: [decision, positionMin, colorier, seuils],
  extraTabs: [{ id: 'aide', label: 'Aide-mémoire', render: renderAide }],
  testsNote: 'Deux critères du test de passage se vérifient à la table, pas ici : sur 500 mains, un VPIP entre 12 et 20 % et aucun limp. Notez-les dans votre carnet.',
};
