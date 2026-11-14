// Définition du niveau 1 : ses tests et ses exercices.
// Chargée par js/app.js quand l'adresse est index.html#niveau-1.
import deroulement from './exercises/deroulement.js';
import classement from './exercises/classement.js';
import nuts from './exercises/nuts.js';
import potAnnexe from './exercises/pot-annexe.js';
import comparaison from './exercises/comparaison.js';
import annonces from './practice/annonces.js';
import meilleureMain from './practice/meilleure-main.js';
import nommerNuts from './practice/nommer-nuts.js';
import comparer from './practice/comparer.js';

export default {
  level: 1,
  storageKey: 'poker.niveau1.v1',
  tests: [deroulement, classement, nuts, potAnnexe, comparaison],
  practices: [annonces, meilleureMain, comparer, nommerNuts],
};
