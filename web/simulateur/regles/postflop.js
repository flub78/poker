// Décisions après le flop, niveaux 2 et 3.
//
// Niveau 2 — le schéma de C2.3 « Après le flop, en attendant le niveau 4 » :
//   personne n'a misé : top paire ou mieux → miser la moitié du pot ; sinon checker ;
//   face à une mise  : main forte → relancer (3 fois la mise) ; top paire → suivre une mise,
//                      se coucher face à une relance ; sinon se coucher.
// Niveau 3 : en plus, un tirage suit si son équité (règle du 2 et du 4, C3.2) dépasse
// l'équité requise (C3.3).
import { handClass, outs } from './force.js';
import { ruleOf24 } from '../../niveau-3/odds.js';
import { bbText, potTotal } from '../positions.js';

const r = (code, texte) => ({ code, texte });
const pctText = (x) => `${String(Math.round(x)).replace('.', ',')} %`;

export function postflopDecision(hand, seat, level, legal) {
  const s = hand.seats[seat];
  const { cls, text } = handClass(s.hole, hand.board);
  const pot = potTotal(hand);
  const raisesThisStreet = hand.history.filter((e) => e.street === hand.street && e.type === 'raise').length;
  const raisons = [];
  // Pour le mentor (mentor.js) : classe de la main ; au niveau 3, outs, équité et équité requise.
  const facts = { street: hand.street, cls, text, facingRaise: raisesThisStreet >= 2 };

  if (!legal.call) {
    // Personne n'a misé.
    if (cls === 'forte' || cls === 'top') {
      const to = Math.min(Math.max(Math.round(pot / 2), legal.raise?.min ?? 0), legal.raise?.max ?? 0);
      raisons.push(r('C2.3', `Vous avez ${text} : top paire ou mieux, on mise pour la valeur.`));
      raisons.push(r('C2.3', `Taille : la moitié du pot, soit ${bbText(to, hand.bb)}.`));
      return { facts, action: legal.raise ? { type: 'raise', to } : { type: 'check' }, raisons };
    }
    raisons.push(r('C2.3', `Vous avez ${text} : sans top paire, on checke.`));
    return { facts, action: { type: 'check' }, raisons };
  }

  // Face à une mise.
  const facingRaise = raisesThisStreet >= 2;
  if (cls === 'forte') {
    if (legal.raise && raisesThisStreet < 3) {
      const to = Math.min(Math.max(hand.currentBet * 3, legal.raise.min), legal.raise.max);
      raisons.push(r('C2.3', `Vous avez ${text} : on relance à 3 fois la mise, soit ${bbText(to, hand.bb)}.`));
      return { facts, action: { type: 'raise', to }, raisons };
    }
    raisons.push(r('C2.3', `Vous avez ${text} : on suit.`));
    return { facts, action: { type: 'call' }, raisons };
  }
  if (cls === 'top' && !facingRaise) {
    raisons.push(r('C2.3', `Vous avez ${text} : assez pour suivre une mise, pas pour relancer.`));
    return { facts, action: { type: 'call' }, raisons };
  }
  if (cls === 'top') raisons.push(r('C2.3', `Vous avez ${text}, face à une relance : une main moyenne contre une grosse action est souvent battue.`));
  else raisons.push(r('C2.3', `Vous avez ${text} : sans top paire, on se couche ; on ne paie pas « pour voir ».`));

  if (level >= 3 && hand.street !== 'river') {
    const o = outs(s.hole, hand.board);
    if (o.n > 0) {
      const street = hand.street === 'flop' ? 'flop' : 'turn';
      const equity = ruleOf24(o.n, street);
      // Équité requise = à payer ÷ pot total après votre call (C3.3) ; « pot » contient déjà la mise.
      const needed = (100 * legal.toCall) / (pot + legal.toCall);
      Object.assign(facts, { outs: o.n, equity, needed });
      raisons.length = 0;
      raisons.push(r('C3.2', `${o.n} outs (${o.kinds.join(', ')}) au ${street} : environ ${pctText(equity)} de toucher (règle du ${street === 'flop' ? '4' : '2'}).`));
      raisons.push(r('C3.3', `Équité requise : ${bbText(legal.toCall, hand.bb)} à payer pour un pot de ${bbText(pot + legal.toCall, hand.bb)}, soit ${pctText(needed)}.`));
      if (equity >= needed) {
        raisons.push(r('C3.3', 'Assez d\'équité : suivre est rentable.'));
        return { facts, action: { type: 'call' }, raisons };
      }
      raisons.push(r('C3.3', 'Pas assez d\'équité : on se couche.'));
      return { facts, action: { type: 'fold' }, raisons };
    }
  }
  return { facts, action: { type: 'fold' }, raisons };
}
