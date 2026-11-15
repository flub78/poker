// Le bot : decider(hand, seat, level, step) renvoie le coup que jouerait un joueur du niveau donné,
// avec ses raisons et les faits qui les fondent (facts, pour le mentor) ({ code: 'C2.2', texte }) — le code renvoie à la section du cours.
// Sert aux bots, au bouton Indice et (phase 3) au mentor.
// Niveaux disponibles : 2, 3 et 4 (les niveaux 5 et 6 viendront ensuite ; ils jouent comme le 4).
import { legalActions } from './moteur/table.js';
import { preflopDecision } from './regles/preflop.js';
import { postflopDecision } from './regles/postflop.js';
import { STEPS, FULL } from '../niveau-2/strategy.js';

export const BOT_LEVELS = [2, 3, 4];
export const playLevel = (level) => Math.min(Math.max(level, 2), 4);

// step : sous-niveau 2.N du joueur humain (étape N de la grille, js/sous-niveaux.js), appliqué avant
// le flop quand il joue aux règles du niveau 2 ; null : la grille complète.
// rules : le niveau des règles appliquées, en texte (« 3 », « 2.3 » ; un joueur du niveau 1 joue le sous-niveau 2.0).
export function decider(hand, seat, level, step = null) {
  const legal = legalActions(hand);
  if (!legal || legal.seat !== seat) throw new Error('Ce n\'est pas à ce joueur de parler.');
  const lvl = playLevel(level);
  const st = lvl === 2 && step !== null && step < FULL ? step : null;
  const d = hand.street === 'preflop'
    ? preflopDecision(hand, seat, lvl, legal, st ?? FULL)
    : postflopDecision(hand, seat, lvl, legal);
  const rules = level < 2 ? STEPS[0].code : st === null ? String(lvl) : STEPS[st].code;
  return { action: makeLegal(d.action, legal), raisons: d.raisons, facts: d.facts, level: lvl, rules };
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
