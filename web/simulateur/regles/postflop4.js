// Décisions après le flop, niveau 4 : les « Règles du niveau 4 » du cours (en tête du niveau 4).
//
//   Vous avez relancé avant le flop, un seul adversaire : c-bet au flop selon la texture (C4.3) :
//     sec ou apparié → 1/3 du pot toujours ; coordonné ou bas → 2/3 avec top paire ou mieux ou un
//     tirage de 8 outs ou plus, sinon parole ; monotone → 1/3 avec top paire ou mieux ou une carte
//     de la couleur, sinon parole.
//   Plusieurs adversaires : mise (1/2 pot) seulement avec top paire bon kicker ou mieux.
//   Vous avez suivi avant le flop : parole tant que le relanceur parle après vous ; s'il a fait
//     parole, misez 1/2 pot avec top paire ou mieux ou un tirage de 8 outs ou plus.
//   Turn : 2/3 du pot avec top paire bon kicker ou mieux, ou un tirage de 8 outs ou plus.
//   River (C4.6) : main forte → 2/3 du pot ; une paire → parole ; tirage raté → bluff 2/3 du pot
//     si vous avez misé flop et turn contre un seul adversaire.
//   Face à une mise : deux paires ou mieux relancent à 3 fois la mise ; top paire suit (à la river,
//     une paire paie une mise d'au plus 1/2 pot) ; un tirage suit selon les cotes (C3.3) ; le reste
//     se couche.
//   Face à une relance, selon le SPR (C4.5) : top paire → tapis si SPR < 3, sinon se coucher ;
//     deux paires ou brelan → tapis si SPR ≤ 8, sinon suivre ; quinte ou mieux → tapis.
//
// « Bon kicker » = valet ou mieux. Un tirage = couleur ou quinte (drawOuts). Pur, testé sous Node.
import { handClass, outs, drawOuts, strength } from './force.js';
import { ruleOf24 } from '../../niveau-3/odds.js';
import { bbText, potTotal } from '../positions.js';

const r = (code, texte) => ({ code, texte });
const pctText = (x) => `${String(Math.round(x)).replace('.', ',')} %`;
const inHand = (s) => s.dealt && !s.folded;

// Texture du flop (C4.2) : 'monotone', 'apparie', 'humide' (coordonné : trois rangs dans une
// fenêtre de cinq, ou bas : rien au-dessus du 9), 'sec' sinon.
export function texture(flop) {
  const ranks = flop.map((c) => c.r);
  if (flop.every((c) => c.s === flop[0].s)) return 'monotone';
  if (new Set(ranks).size < 3) return 'apparie';
  const all = [...ranks, ...ranks.filter((x) => x === 14).map(() => 1)];
  for (let low = 1; low <= 10; low++) {
    if (new Set(all.filter((x) => x >= low && x <= low + 4)).size >= 3) return 'humide';
  }
  return Math.max(...ranks) <= 9 ? 'humide' : 'sec';
}
const TEXTURE_TEXT = { monotone: 'monotone', apparie: 'apparié', humide: 'coordonné ou bas', sec: 'sec' };

// Ce qui s'est passé avant la décision : relanceur préflop, adversaires restants, mises du joueur,
// SPR (tapis effectif au flop ÷ pot au flop).
export function context(hand, seat) {
  const pre = hand.history.filter((e) => e.street === 'preflop');
  const raises = pre.filter((e) => e.type === 'raise');
  const aggressor = raises.length ? raises[raises.length - 1].seat : null;
  const opponents = hand.seats.filter((s) => inHand(s) && s.seat !== seat);
  const paidPre = (i) => pre.filter((e) => e.seat === i).reduce((a, e) => a + (e.amount || 0), 0);
  const potFlop = hand.seats.reduce((a, s) => a + paidPre(s.seat), 0);
  const stackFlop = (i) => hand.seats[i].start - paidPre(i);
  const effective = Math.min(stackFlop(seat), Math.max(0, ...opponents.map((o) => stackFlop(o.seat))));
  const street = hand.history.filter((e) => e.street === hand.street);
  const bet = (st, who) => hand.history.some((e) => e.street === st && e.seat === who && e.type === 'raise');
  return {
    aggressor, opponents: opponents.length, spr: potFlop ? effective / potFlop : Infinity,
    // Le relanceur préflop, encore en jeu, n'a pas encore parlé à ce tour : il parle après vous.
    aggressorToAct: aggressor !== null && aggressor !== seat && inHand(hand.seats[aggressor])
      && !street.some((e) => e.seat === aggressor),
    betFlop: bet('flop', seat), betTurn: bet('turn', seat),
    raisesThisStreet: street.filter((e) => e.type === 'raise').length,
  };
}

const sprText = (spr) => (Number.isFinite(spr) ? String(Math.round(spr * 10) / 10).replace('.', ',') : '∞');

export function postflop4Decision(hand, seat, legal) {
  const s = hand.seats[seat];
  const board = hand.board;
  const { cls, text } = handClass(s.hole, board);
  const force = strength(s.hole, board);
  const draw = drawOuts(s.hole, board);
  const ctx = context(hand, seat);
  const pot = potTotal(hand);
  const raisons = [];
  const facts = { street: hand.street, cls, text, force, draw, level: 4, facingRaise: ctx.raisesThisStreet >= 2 };
  const topOrBetter = ['quinte', 'deux-paires', 'top-bon', 'top'].includes(force);
  const goodTop = ['quinte', 'deux-paires', 'top-bon'].includes(force);
  const strong = force === 'quinte' || force === 'deux-paires';
  const bet = (fraction, label, motif) => {
    facts.motif = motif;
    if (!legal.raise) return { facts, action: { type: 'check' }, raisons };
    const to = Math.min(Math.max(s.bet + Math.round(pot * fraction), legal.raise.min), legal.raise.max);
    raisons.push(r(null, `Taille : ${label} du pot, soit ${bbText(to, hand.bb)}.`));
    return { facts, action: { type: 'raise', to }, raisons };
  };
  const check = () => { facts.motif = 'aucune'; return { facts, action: { type: 'check' }, raisons }; };
  const allIn = () => (legal.raise ? { facts, action: { type: 'raise', to: legal.raise.max }, raisons } : { facts, action: { type: 'call' }, raisons });

  // ---------- personne n'a misé ----------
  if (!legal.call) {
    if (hand.street === 'river') {
      if (strong) {
        raisons.push(r('C4.6', `Vous avez ${text} : à la river, on mise gros pour la valeur.`));
        return bet(2 / 3, '2/3', 'valeur');
      }
      const missed = cls === 'rien' && drawOuts(s.hole, board.slice(0, 4)) > 0;
      if (missed && ctx.betFlop && ctx.betTurn && ctx.opponents === 1) {
        raisons.push(r('C4.6', 'Tirage raté, après avoir misé au flop et au turn contre un seul adversaire : seule une mise peut gagner ce pot. On bluffe.'));
        return bet(2 / 3, '2/3', 'bluff');
      }
      raisons.push(r('C4.6', missed
        ? 'Tirage raté : on ne bluffe qu\'un seul adversaire, après avoir misé au flop et au turn. Parole.'
        : `Vous avez ${text} : à la river, une main moyenne fait parole.`));
      return check();
    }
    if (ctx.aggressorToAct) {
      raisons.push(r('C4.3', 'Vous avez suivi avant le flop : faites parole et laissez miser le relanceur.'));
      return check();
    }
    if (hand.street === 'turn') {
      if (goodTop || draw >= 8) {
        raisons.push(r('C4.5', goodTop
          ? `Vous avez ${text} : au turn, on mise encore pour la valeur.`
          : `Tirage de ${draw} outs : au turn, on mise encore (semi-bluff).`));
        return bet(2 / 3, '2/3', goodTop ? 'valeur' : 'semi-bluff');
      }
      raisons.push(r('C4.5', `Vous avez ${text} : au turn, sans top paire bon kicker ni tirage de 8 outs, parole.`));
      return check();
    }
    // Flop.
    if (ctx.aggressor === seat) {
      if (ctx.opponents > 1) {
        if (goodTop) {
          raisons.push(r('C4.3', `Plusieurs adversaires : on mise seulement pour la valeur ; ${text}.`));
          return bet(1 / 2, '1/2', 'valeur');
        }
        raisons.push(r('C4.3', 'Plusieurs adversaires : sans top paire bon kicker, pas de c-bet.'));
        return check();
      }
      const t = texture(board.slice(0, 3));
      const flop = `Flop ${TEXTURE_TEXT[t]}`;
      if (t === 'sec' || t === 'apparie') {
        raisons.push(r('C4.3', `${flop} : c-bet toujours, petite.`));
        return bet(1 / 3, '1/3', topOrBetter ? 'valeur' : 'bluff');
      }
      if (t === 'humide') {
        if (topOrBetter || draw >= 8) {
          raisons.push(r('C4.3', `${flop} : c-bet grosse, ${topOrBetter ? `pour la valeur (${text})` : `semi-bluff avec ${draw} outs`}.`));
          return bet(2 / 3, '2/3', topOrBetter ? 'valeur' : 'semi-bluff');
        }
        raisons.push(r('C4.3', `${flop} : sans top paire ni tirage de 8 outs, parole.`));
        return check();
      }
      const suit = board[0].s;
      if (topOrBetter || s.hole.some((c) => c.s === suit)) {
        raisons.push(r('C4.3', `${flop} : petite c-bet, ${topOrBetter ? `avec ${text}` : 'avec une carte de la couleur'}.`));
        return bet(1 / 3, '1/3', topOrBetter ? 'valeur' : 'semi-bluff');
      }
      raisons.push(r('C4.3', `${flop}, sans carte de la couleur : parole.`));
      return check();
    }
    // Le relanceur a fait parole (ou personne n'a relancé avant le flop).
    if (topOrBetter || draw >= 8) {
      raisons.push(r('C4.3', `Personne n'a misé : ${topOrBetter ? `avec ${text}, on mise pour la valeur` : `tirage de ${draw} outs, semi-bluff`}.`));
      return bet(1 / 2, '1/2', topOrBetter ? 'valeur' : 'semi-bluff');
    }
    raisons.push(r('C4.3', `Vous avez ${text} : sans top paire ni tirage de 8 outs, parole.`));
    return check();
  }

  // ---------- face à une mise ----------
  if (facts.facingRaise) {
    const spr = `SPR ${sprText(ctx.spr)}`;
    if (force === 'quinte') {
      raisons.push(r('C4.5', `Face à une relance, avec ${text} : tapis.`));
      return allIn();
    }
    if (force === 'deux-paires') {
      if (ctx.spr <= 8) {
        raisons.push(r('C4.5', `Face à une relance, ${spr} : deux paires ou un brelan engagent le tapis jusqu'à un SPR de 8.`));
        return allIn();
      }
      raisons.push(r('C4.5', `Face à une relance, ${spr} : au-dessus de 8, deux paires ou un brelan suivent sans engager le tapis.`));
      return { facts, action: { type: 'call' }, raisons };
    }
    if (force === 'top-bon' || force === 'top') {
      if (ctx.spr < 3) {
        raisons.push(r('C4.5', `Face à une relance, ${spr} : sous 3, top paire engage le tapis.`));
        return allIn();
      }
      raisons.push(r('C4.5', `Face à une relance, ${spr} : top paire se couche (tapis seulement sous un SPR de 3).`));
    }
  } else {
    if (strong) {
      raisons.push(r('C4.1', `Vous avez ${text} : on relance pour la valeur, 3 fois la mise.`));
      facts.motif = 'valeur';
      if (!legal.raise) return { facts, action: { type: 'call' }, raisons };
      const to = Math.min(Math.max(hand.currentBet * 3, legal.raise.min), legal.raise.max);
      raisons.push(r(null, `Soit ${bbText(to, hand.bb)}.`));
      return { facts, action: { type: 'raise', to }, raisons };
    }
    if (hand.street === 'river' && (cls === 'top' || cls === 'paire')) {
      const half = legal.toCall <= (pot - legal.toCall) / 2;
      raisons.push(r('C4.6', half
        ? `Vous avez ${text} : une main moyenne paie une mise d'au plus la moitié du pot.`
        : `Vous avez ${text} : une main moyenne ne paie pas une mise de plus de la moitié du pot.`));
      return { facts, action: { type: half ? 'call' : 'fold' }, raisons };
    }
    if (topOrBetter) {
      raisons.push(r('C4.3', `Vous avez ${text} : top paire suit une mise.`));
      return { facts, action: { type: 'call' }, raisons };
    }
  }

  // Un tirage suit selon les cotes (C3.2, C3.3) ; sinon on se couche.
  if (hand.street !== 'river') {
    const o = outs(s.hole, board);
    if (o.n > 0) {
      const street = hand.street === 'flop' ? 'flop' : 'turn';
      const equity = ruleOf24(o.n, street);
      const needed = (100 * legal.toCall) / (pot + legal.toCall);
      Object.assign(facts, { outs: o.n, equity, needed });
      raisons.push(r('C3.2', `${o.n} outs (${o.kinds.join(', ')}) au ${street} : environ ${pctText(equity)} de toucher.`));
      raisons.push(r('C3.3', `Équité requise : ${pctText(needed)}. ${equity >= needed ? 'Assez : on suit.' : 'Pas assez : on se couche.'}`));
      return { facts, action: { type: equity >= needed ? 'call' : 'fold' }, raisons };
    }
  }
  if (!raisons.length) raisons.push(r('C2.3', `Vous avez ${text} : on ne paie pas « pour voir ».`));
  return { facts, action: { type: 'fold' }, raisons };
}
