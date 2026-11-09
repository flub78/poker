// La stratégie préflop du niveau 2 (tutoriel, C2.2), et ses étapes d'apprentissage.
// Chaque étape est une stratégie complète, plus serrée que la grille finale.
import { range, union, has, coveringToken, shortCode } from './ranges.js';

// ---------- les listes du tutoriel ----------

export const UTG = range('liste UTG', '77+, AJ+, KQ, ATs+, KJs+');
export const CO = range('liste du CO', '55+, AT+, KJ+, QJ, A2s+, K9s+, QTs+, JTs, T9s');
export const BTN = range('liste du BTN', '22+, A2+, KT+, QT+, JT, K9s, T9s, 98s, 87s, 76s');

export const RERAISE = range('sur-relance', 'QQ+, AK');
export const CALL_IP = range('suivre en position', 'JJ-66, AQ, AJs, KQs');
export const CALL_OOP = range('suivre aux blinds', 'JJ-88, AQ');
export const CALL_3BET = range('suivre une sur-relance', 'JJ-TT');

// Étape 2 : la liste UTG, plus les paires et les As du CO.
const PAIRS_ACES_CO = range('paires et As du CO', '55+, AT+, A2s+');
const STEP2_CO = union('liste UTG + paires et As du CO', '77+, AJ+, KQ, ATs+, KJs+ + 55+, AT+, A2s+', UTG, PAIRS_ACES_CO);

export const POSITIONS = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
export const POSITION_NAME = {
  UTG: 'UTG', MP: 'en MP', CO: 'au CO', BTN: 'au bouton (BTN)', SB: 'en petite blind (SB)', BB: 'en grosse blind (BB)',
};
export const isBlind = (pos) => pos === 'SB' || pos === 'BB';

export const STEPS = [
  { value: '0', label: 'Étape 0 · Le filet' },
  { value: '1', label: 'Étape 1 · Le bouton' },
  { value: '2', label: 'Étape 2 · Paires et As' },
  { value: '3', label: 'Étape 3 · Le reste du CO' },
  { value: '4', label: 'Étape 4 · Suivre une relance' },
  { value: '5', label: 'Étape 5 · Grille complète' },
];
export const FULL = 5;

// Liste d'ouverture (personne n'a relancé) selon la position et l'étape.
export function openRange(pos, step = FULL) {
  if (step === 0) return UTG;
  if (pos === 'BTN') return BTN;
  if (pos === 'UTG' || pos === 'MP' || step === 1) return UTG;
  return step === 2 ? STEP2_CO : CO;            // CO, SB, et BB face à des limps
}

// Position la plus précoce où l'on relance la main (grille complète).
export function minPosition(code) {
  if (has(UTG, code)) return 'UTG';
  if (has(CO, code)) return 'CO';
  if (has(BTN, code)) return 'BTN';
  return 'jamais';
}

// ---------- décision ----------
// Situations :
//   open    { pos, limpers }          personne n'a relancé ; pos ∈ UTG…SB
//   bb      { limpers }               des joueurs ont seulement suivi ; vous êtes en BB
//   vsRaise { raiser, hero }          une relance avant vous
//   vs3bet  { hero, threeBettor }     vous aviez relancé, un joueur sur-relance
//   squeeze { raiser, threeBettor, hero }  une relance puis une sur-relance avant vous

export const ACTIONS = {
  open: [['raise', 'Relancer'], ['call', 'Suivre (limp)'], ['fold', 'Se coucher']],
  bb: [['raise', 'Relancer'], ['check', 'Checker'], ['fold', 'Se coucher']],
  vsRaise: [['raise', 'Sur-relancer (3-bet)'], ['call', 'Suivre'], ['fold', 'Se coucher']],
  vs3bet: [['raise', 'Relancer encore (4-bet)'], ['call', 'Suivre'], ['fold', 'Se coucher']],
  squeeze: [['raise', 'Relancer encore (4-bet)'], ['call', 'Suivre'], ['fold', 'Se coucher']],
};

export const actionLabel = (sit, action) => ACTIONS[sit.type].find(([a]) => a === action)[1];

const covers = (r, code) => {
  const tok = coveringToken(r, code);
  return tok && tok !== shortCode(code) ? ` (couverte par ${tok})` : '';
};

// Renvoie { action, why } : la bonne réponse à l'étape donnée et sa raison.
export function decide(sit, code, step = FULL) {
  const hand = shortCode(code);
  const calls = step >= 4;
  switch (sit.type) {
    case 'open': {
      const r = openRange(sit.pos, step);
      return has(r, code)
        ? { action: 'raise', why: `${hand} est dans la ${r.name}${covers(r, code)} : on relance.` }
        : { action: 'fold', why: `${hand} n'est pas dans la ${r.name} (${r.text}) : on se couche. On ne suit jamais.` };
    }
    case 'bb': {
      const r = openRange('BB', step);
      return has(r, code)
        ? { action: 'raise', why: `En BB face à des limps, on relance la ${r.name} : ${hand} y est${covers(r, code)}.` }
        : { action: 'check', why: `${hand} n'est pas dans la ${r.name} : on checke, c'est gratuit.` };
    }
    case 'vsRaise': {
      if (has(RERAISE, code)) return { action: 'raise', why: `${hand} fait partie de QQ+, AK : on sur-relance.` };
      const r = isBlind(sit.hero) ? CALL_OOP : CALL_IP;
      const where = isBlind(sit.hero) ? 'aux blinds (hors position)' : 'en position';
      if (calls && has(r, code)) return { action: 'call', why: `${where}, on suit avec ${r.text} : ${hand} y est${covers(r, code)}.` };
      return {
        action: 'fold',
        why: calls
          ? `Face à une relance ${where}, on suit seulement ${r.text} et on sur-relance QQ+, AK : ${hand} se couche.`
          : `À cette étape, face à une relance, seuls QQ+ et AK continuent : ${hand} se couche.`,
      };
    }
    case 'vs3bet': {
      if (has(RERAISE, code)) return { action: 'raise', why: `${hand} fait partie de QQ+, AK : on relance encore (4-bet).` };
      if (calls && has(CALL_3BET, code)) return { action: 'call', why: `Face à une sur-relance, JJ et TT suivent.` };
      return { action: 'fold', why: `Face à une sur-relance, seuls QQ+, AK${calls ? ', JJ et TT' : ''} continuent : ${hand} se couche.` };
    }
    case 'squeeze': {
      if (has(RERAISE, code)) return { action: 'raise', why: `${hand} fait partie de QQ+, AK : on relance encore (4-bet).` };
      return { action: 'fold', why: `Une relance puis une sur-relance : seuls QQ+ et AK continuent, JJ et AJ compris se couchent.` };
    }
    default:
      throw new Error(`Situation inconnue : ${sit.type}`);
  }
}

// Gravité d'une erreur : 'grave' si la réponse s'écarte beaucoup de la grille complète.
export function severity(sit, code, answer) {
  if (sit.type === 'open' && answer === 'call') return 'grave';          // le limp
  const plays = answer === 'raise' || answer === 'call';
  if (sit.type === 'open' || sit.type === 'bb') {
    if (plays && !has(BTN, code)) return 'grave';
    if (!plays && has(UTG, code)) return 'grave';
    return 'légère';
  }
  if (!plays && has(RERAISE, code)) return 'grave';
  if (plays && !has(RERAISE, code) && !has(CALL_IP, code)) return 'grave';
  return 'légère';
}
