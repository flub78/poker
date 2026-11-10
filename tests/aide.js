// Aides communes aux tests : écrire des cartes comme dans le cours ('AS', 'TD', '9H').
import { card } from '../web/js/cards.js';

const VALUE = { A: 14, K: 13, Q: 12, J: 11, T: 10 };

// cartes('AS KS QS') → [{ r: 14, s: 'S' }, …]
export const cartes = (texte) => texte.trim().split(/\s+/)
  .map((c) => card(VALUE[c[0]] || Number(c[0]), c[1]));
