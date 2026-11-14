// Réglages de l'application. Tous les chemins sont relatifs à index.html :
// on déploie le dossier web/ tel quel, à n'importe quel endroit d'un site.
export const CONFIG = {
  cardsPath: 'cartes/',
  cardBack: '1B',
  minDaysBetween: 3,              // écart minimal entre les deux réussites d'un test
};

// Les niveaux du programme. ready: true quand le dossier niveau-N/ contient niveau.js.
// Code couleur (rang et couleur) : une seule source pour l'en-tête, les boutons, le cours et le
// simulateur (js/niveau-couleur.js) ; les teintes sont dans css/style.css (--niv-N). Le cours
// présente le même code dans « Mode d'emploi » (tests/existants/couleurs.test.js vérifie l'accord).
export const LEVELS = [
  { n: 1, title: 'Les règles', rank: 'Débutant', color: 'vert', ready: true },
  { n: 2, title: 'Éviter les grosses erreurs', rank: 'Élémentaire', color: 'bleu', ready: true },
  { n: 3, title: 'Les probabilités', rank: 'Intermédiaire', color: 'jaune', ready: true },
  { n: 4, title: 'Après le flop', rank: 'Avancé', color: 'orange', ready: true },
  { n: 5, title: 'Ranges et adaptation', rank: 'Expert', color: 'rouge', ready: true },
  { n: 6, title: 'Vers le GTO', rank: 'Maître', color: 'noir', ready: true },
];
