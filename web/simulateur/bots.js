// Le bot : decider(hand, seat, level) renvoie le coup que jouerait un joueur du niveau donné,
// avec ses raisons et les faits qui les fondent (facts, pour le mentor) ({ code: 'C2.2', texte }) — le code renvoie à la section du cours.
// Sert aux bots, au bouton Indice et (phase 3) au mentor.
// Niveaux disponibles : 2 et 3 (les niveaux 4 à 6 viendront en phase 5 ; ils jouent comme le 3).
import { legalActions } from './moteur/table.js';
import { preflopDecision } from './regles/preflop.js';
import { postflopDecision } from './regles/postflop.js';

export const BOT_LEVELS = [2, 3];
export const playLevel = (level) => Math.min(Math.max(level, 2), 3);

export function decider(hand, seat, level) {
  const legal = legalActions(hand);
  if (!legal || legal.seat !== seat) throw new Error('Ce n\'est pas à ce joueur de parler.');
  const lvl = playLevel(level);
  const d = hand.street === 'preflop'
    ? preflopDecision(hand, seat, lvl, legal)
    : postflopDecision(hand, seat, lvl, legal);
  return { action: makeLegal(d.action, legal), raisons: d.raisons, facts: d.facts, level: lvl };
}

// Ramène une décision à une action permise : on ne se couche jamais quand checker est gratuit.
function makeLegal(action, legal) {
  switch (action.type) {
    case 'fold': return legal.check ? { type: 'check' } : action;
    case 'check': return legal.check ? action : { type: 'fold' };
    case 'call': return legal.call ? action : { type: 'check' };
    case 'raise':
      if (!legal.raise || !Number.isInteger(action.to)) return legal.call ? { type: 'call' } : { type: 'check' };
      return { type: 'raise', to: Math.min(Math.max(action.to, legal.raise.min), legal.raise.max) };
    default: return action;
  }
}
