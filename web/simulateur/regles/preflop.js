// Décisions avant le flop : la grille du niveau 2 (C2.2), les tailles de C2.2 et C2.3,
// les cotes implicites des petites paires au niveau 3 (C3.4).
import { decide, RERAISE } from '../../niveau-2/strategy.js';
import { has, shortCode } from '../../niveau-2/ranges.js';
import { positions, isBlind, bbText } from '../positions.js';

const RANK_CHAR = { 10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
const ch = (r) => RANK_CHAR[r] || String(r);

// 'AKs', 'AKo' ou 'AA' à partir de deux cartes.
export function handCode([a, b]) {
  const [hi, lo] = a.r >= b.r ? [a, b] : [b, a];
  if (hi.r === lo.r) return ch(hi.r) + ch(lo.r);
  return ch(hi.r) + ch(lo.r) + (hi.s === lo.s ? 's' : 'o');
}

// La situation du cours (strategy.js) pour le siège qui a la parole, d'après les actions.
export function preflopSituation(hand, seat) {
  const pos = positions(hand);
  const acts = hand.history.filter((e) => e.street === 'preflop' && e.type !== 'sb' && e.type !== 'bb');
  const raises = acts.filter((e) => e.type === 'raise');
  const mine = raises.filter((e) => e.seat === seat);
  const limpers = acts.filter((e) => e.type === 'call' && raises.every((r) => hand.history.indexOf(r) > hand.history.indexOf(e))).length;
  const hero = pos[seat];
  if (raises.length === 0) return hero === 'BB' ? { type: 'bb', limpers } : { type: 'open', pos: hero, limpers };
  if (mine.length === 0 && raises.length === 1) return { type: 'vsRaise', raiser: pos[raises[0].seat], hero };
  if (mine.length === 0) return { type: 'squeeze', hero };
  const after = raises.slice(raises.indexOf(mine[mine.length - 1]) + 1).length;
  if (mine.length === 1 && raises.indexOf(mine[0]) === 0 && after === 1) return { type: 'vs3bet', hero };
  return { type: 'vs4bet', hero };       // vous aviez sur-relancé (ou relancé deux fois) et on relance encore
}

const r = (code, texte) => ({ code, texte });

// Montant d'une relance selon le cours. legal : legalActions(hand).
function raiseTo(hand, sit, legal, raisons) {
  const { bb } = hand;
  let to;
  if (sit.type === 'open' || sit.type === 'bb') {
    to = Math.round((2.5 + sit.limpers) * bb);
    raisons.push(r('C2.3', `Taille standard : 2,5 BB${sit.limpers ? `, plus 1 BB par joueur qui a suivi (${sit.limpers})` : ''}, soit ${bbText(to, bb)}.`));
  } else {
    const oop = isBlind(sit.hero);
    to = hand.currentBet * (oop ? 4 : 3);
    raisons.push(r('C2.2', `Sur-relance : ${oop ? '4' : '3'} fois la relance adverse${oop ? ' (hors position)' : ''}, soit ${bbText(to, bb)}.`));
    // Convention du simulateur : quand la relance engagerait plus de la moitié du tapis, on part à tapis.
    if (to > legal.raise.max / 2) {
      to = legal.raise.max;
      raisons.push(r(null, 'Cette relance engagerait plus de la moitié du tapis : on le met en entier.'));
    }
  }
  return Math.min(Math.max(to, legal.raise.min), legal.raise.max);
}

// Décision avant le flop. Renvoie { action, raisons } ; l'action peut être retouchée par bots.js
// si elle n'est pas permise (par exemple relancer après une relance incomplète).
export function preflopDecision(hand, seat, level, legal) {
  const s = hand.seats[seat];
  const code = handCode(s.hole);
  const sit = preflopSituation(hand, seat);
  const raisons = [];
  let type;
  if (sit.type === 'vs4bet') {
    // Le cours s'arrête au 4-bet : on continue avec QQ+ et AK, à tapis (règle provisoire).
    type = has(RERAISE, code) ? 'allin' : 'fold';
    raisons.push(r('C2.2', has(RERAISE, code)
      ? `${shortCode(code)} fait partie de QQ+, AK : on continue, à tapis.`
      : `Face à une relance de plus, seules QQ+ et AK continuent : ${shortCode(code)} se couche.`));
    raisons.push(r(null, 'Règle provisoire : le cours ne traite pas encore la relance d\'un 4-bet.'));
  } else {
    const d = decide(sit, code);
    type = d.action;
    raisons.push(r('C2.2', d.why));
    // Niveau 3 : une petite paire paie une relance si les tapis valent 15 fois le prix (C3.4).
    if (level >= 3 && sit.type === 'vsRaise' && type === 'fold' && code.length === 2 && '23456'.includes(code[0])) {
      const others = hand.seats.filter((o) => o !== s && o.dealt && !o.folded);
      const effective = Math.min(s.stack, Math.max(...others.map((o) => o.stack + o.bet)) - s.bet);
      if (effective >= 15 * legal.toCall) {
        type = 'call';
        raisons.push(r('C3.4', `Cotes implicites : ${code} touche le brelan environ 1 fois sur 8 ; les tapis (${bbText(effective, hand.bb)}) valent au moins 15 fois le prix du call (${bbText(legal.toCall, hand.bb)}) : on paie.`));
      }
    }
  }
  if (type === 'allin') return { action: { type: 'raise', to: legal.raise?.max }, raisons };
  if (type === 'raise') {
    if (!legal.raise) return { action: { type: 'call' }, raisons };
    return { action: { type: 'raise', to: raiseTo(hand, sit, legal, raisons) }, raisons };
  }
  return { action: { type }, raisons };
}
