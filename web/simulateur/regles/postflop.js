// Décisions après le flop, niveaux 2 et 3.
//
// Niveau 2 — RÈGLE PROVISOIRE, à écrire dans le cours (décision D8 du plan) : le cours ne donne
// que des principes (C2.3 : « une paire au flop n'est pas une grosse main », « une main moyenne
// contre une grosse action est souvent battue », « on ne paie pas pour voir »). Le simulateur
// les traduit ainsi :
//   personne n'a misé : top paire ou mieux → miser la moitié du pot ; sinon checker ;
//   face à une mise  : main forte → relancer (3 fois la mise) ; top paire → suivre une mise,
//                      se coucher face à une relance ; sinon se coucher.
// Niveau 3 : en plus, un tirage suit si son équité (règle du 2 et du 4, C3.2) dépasse
// l'équité requise (C3.3).
import { handClass, outs } from './force.js';
import { ruleOf24 } from '../../niveau-3/odds.js';
import { bbText, potTotal } from '../positions.js';

const r = (code, texte) => ({ code, texte });
const PROVISOIRE = r(null, 'Règle provisoire du niveau 2 : à confirmer dans le cours.');
const pctText = (x) => `${String(Math.round(x)).replace('.', ',')} %`;

export function postflopDecision(hand, seat, level, legal) {
  const s = hand.seats[seat];
  const { cls, text } = handClass(s.hole, hand.board);
  const pot = potTotal(hand);
  const raisesThisStreet = hand.history.filter((e) => e.street === hand.street && e.type === 'raise').length;
  const raisons = [];

  if (!legal.call) {
    // Personne n'a misé.
    if (cls === 'forte' || cls === 'top') {
      const to = Math.min(Math.max(Math.round(pot / 2), legal.raise?.min ?? 0), legal.raise?.max ?? 0);
      raisons.push(r('C4.1', `Vous avez ${text} : des mains moins bonnes peuvent payer, on mise pour la valeur.`));
      raisons.push(r('C4.4', `Taille : la moitié du pot, soit ${bbText(to, hand.bb)}.`));
      raisons.push(PROVISOIRE);
      return { action: legal.raise ? { type: 'raise', to } : { type: 'check' }, raisons };
    }
    raisons.push(r('C2.3', `Vous avez ${text} : pas de raison de miser, on checke.`));
    raisons.push(PROVISOIRE);
    return { action: { type: 'check' }, raisons };
  }

  // Face à une mise.
  const facingRaise = raisesThisStreet >= 2;
  if (cls === 'forte') {
    if (legal.raise && raisesThisStreet < 3) {
      const to = Math.min(Math.max(hand.currentBet * 3, legal.raise.min), legal.raise.max);
      raisons.push(r('C4.1', `Vous avez ${text} : on relance pour la valeur, à ${bbText(to, hand.bb)} (3 fois la mise).`));
      raisons.push(PROVISOIRE);
      return { action: { type: 'raise', to }, raisons };
    }
    raisons.push(r('C4.1', `Vous avez ${text} : on suit.`));
    return { action: { type: 'call' }, raisons };
  }
  if (cls === 'top' && !facingRaise) {
    raisons.push(r('C2.3', `Vous avez ${text} : assez pour suivre une mise, pas pour relancer.`));
    raisons.push(PROVISOIRE);
    return { action: { type: 'call' }, raisons };
  }
  if (cls === 'top') raisons.push(r('C2.3', `Vous avez ${text}, face à une relance : une main moyenne contre une grosse action est souvent battue.`));
  else raisons.push(r('C2.3', `Vous avez ${text} : on ne paie pas « pour voir ».`));

  if (level >= 3 && hand.street !== 'river') {
    const o = outs(s.hole, hand.board);
    if (o.n > 0) {
      const street = hand.street === 'flop' ? 'flop' : 'turn';
      const equity = ruleOf24(o.n, street);
      // Équité requise = à payer ÷ pot total après votre call (C3.3) ; « pot » contient déjà la mise.
      const needed = (100 * legal.toCall) / (pot + legal.toCall);
      raisons.length = 0;
      raisons.push(r('C3.2', `${o.n} outs (${o.kinds.join(', ')}) au ${street} : environ ${pctText(equity)} de toucher (règle du ${street === 'flop' ? '4' : '2'}).`));
      raisons.push(r('C3.3', `Équité requise : ${bbText(legal.toCall, hand.bb)} à payer pour un pot de ${bbText(pot + legal.toCall, hand.bb)}, soit ${pctText(needed)}.`));
      if (equity >= needed) {
        raisons.push(r('C3.3', 'Assez d\'équité : suivre est rentable.'));
        return { action: { type: 'call' }, raisons };
      }
      raisons.push(r('C3.3', 'Pas assez d\'équité : on se couche.'));
      return { action: { type: 'fold' }, raisons };
    }
  }
  if (cls !== 'top') raisons.push(PROVISOIRE);
  return { action: { type: 'fold' }, raisons };
}
