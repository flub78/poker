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
  manual: [
    { id: 'vpip', text: 'Sur 500 mains, mon VPIP est entre 12 et 20 %.' },
    { id: 'limp', text: 'Sur ces 500 mains, je n\'ai fait aucun limp.' },
  ],
};
