// Réglages de l'application. Tous les chemins sont relatifs à index.html :
// on déploie le dossier web/ tel quel, à n'importe quel endroit d'un site.
export const CONFIG = {
  cardsPath: 'cartes/',
  cardBack: '1B',
  minDaysBetween: 3,              // écart minimal entre les deux réussites d'un test
};

// Les niveaux du programme. ready: true quand le dossier niveau-N/ contient niveau.js.
export const LEVELS = [
  { n: 1, title: 'Les règles', ready: true },
  { n: 2, title: 'Éviter les grosses erreurs', ready: true },
  { n: 3, title: 'Les probabilités', ready: true },
  { n: 4, title: 'Après le flop', ready: true },
  { n: 5, title: 'Ranges et adaptation', ready: true },
  { n: 6, title: 'Vers le GTO', ready: true },
];
