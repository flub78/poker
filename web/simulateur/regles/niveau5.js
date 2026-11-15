// Niveau 5 : les « Règles du niveau 5 » du cours, ajustements par profil (C5.4) et avantage de
// range (C5.3). Le reste est le niveau 4, sans changement.
//
//   Profil inconnu (moins de 30 mains, ou entre deux profils) ou serré-agressif : niveau 4.
//   Serré-passif (rock) : quand il est aux blinds, relancer la liste du BTN au CO comme au BTN ;
//     face à sa relance, ou à sa mise au turn ou à la river, se coucher sans deux paires ou mieux.
//   Large-passif (station) : ne jamais le bluffer ; miser pour la valeur dès la top paire,
//     3/4 du pot, à chaque tour.
//   Large-agressif (maniaque) : ne pas le bluffer ; avec top paire ou mieux, faire parole et
//     payer ses mises jusqu'à la river.
//   Avantage de range (C5.3) : relanceur préflop seul contre un adversaire, sur un flop qui
//     favorise sa range (deux cartes de 10 ou plus) : c-bet de 1/3 du pot avec toutes ses mains.
//
//   À la river, une paire face à une mise, seul contre le miseur : range estimée en trois
//     catégories (C5.1, regles/range.js) ; payer si la part de la range que la main bat (les
//     bluffs, et les mains moyennes plus faibles) dépasse l'équité requise. Contre un maniaque,
//     sa règle passe avant : top paire ou mieux paie.
//
// Les profils viennent de la lecture tenue par la partie (hand.reads, lecture.js) ; sans elle,
// les ajustements par profil ne s'appliquent pas.
import { preflopDecision, preflopSituation, handCode } from './preflop.js';
import { postflop4Decision, context } from './postflop4.js';
import { strength } from './force.js';
import { BTN } from '../../niveau-2/strategy.js';
import { has, shortCode } from '../../niveau-2/ranges.js';
import { positions, bbText, potTotal } from '../positions.js';
import { riverRange } from './range.js';

const r = (code, texte) => ({ code, texte });
const NAMES = { rock: 'serré-passif', station: 'large-passif', maniaque: 'large-agressif', tag: 'serré-agressif' };
const inHand = (s) => s.dealt && !s.folded;
const pctText = (x) => `${String(Math.round(x)).replace('.', ',')} %`;

// Profil lu d'un siège : 'rock', 'station', 'maniaque', 'tag' ou null.
const profilOf = (hand, seat) => hand.reads?.profil(seat) ?? null;

export function niveau5Decision(hand, seat, legal) {
  return hand.street === 'preflop' ? preflop(hand, seat, legal) : postflop(hand, seat, legal);
}

function preflop(hand, seat, legal) {
  const d = preflopDecision(hand, seat, 4, legal);
  d.facts.level = 5;
  const sit = preflopSituation(hand, seat);
  if (sit.type !== 'open' || sit.pos !== 'CO' || sit.limpers || d.action.type !== 'fold' || !legal.raise) return d;
  const code = handCode(hand.seats[seat].hole);
  if (!has(BTN, code)) return d;
  const pos = positions(hand);
  const behind = hand.seats.filter((s) => inHand(s) && ['BTN', 'SB', 'BB'].includes(pos[s.seat]));
  const rockBlind = behind.find((s) => pos[s.seat] !== 'BTN' && profilOf(hand, s.seat) === 'rock');
  const loose = behind.some((s) => ['station', 'maniaque'].includes(profilOf(hand, s.seat)));
  if (!rockBlind || loose) return d;
  const to = Math.min(Math.max(Math.round(2.5 * hand.bb), legal.raise.min), legal.raise.max);
  d.facts.ajustement = 'vol';
  d.raisons = [
    r('C5.4', `La ${pos[rockBlind.seat]} est serré-passive (rock) : au CO, on relance la liste du BTN pour lui voler les blinds ; ${shortCode(code)} en fait partie.`),
    r('C2.3', 'Taille standard : 2,5 BB.'),
  ];
  d.action = { type: 'raise', to };
  return d;
}

function postflop(hand, seat, legal) {
  const d = postflop4Decision(hand, seat, legal);
  d.facts.level = 5;
  const s = hand.seats[seat];
  const force = strength(s.hole, hand.board);
  const topOrBetter = ['quinte', 'deux-paires', 'top-bon', 'top'].includes(force);
  const strong = force === 'quinte' || force === 'deux-paires';
  const opps = hand.seats.filter((o) => inHand(o) && o.seat !== seat);
  const profs = opps.map((o) => profilOf(hand, o.seat));
  const headsUp = opps.length === 1;
  const street = hand.history.filter((e) => e.street === hand.street);
  const raises = street.filter((e) => e.type === 'raise');
  const bettor = raises.length ? raises[raises.length - 1].seat : null;
  const bettorProfil = bettor === null ? null : profilOf(hand, bettor);
  const pot = potTotal(hand);
  const adjust = (key, action, ...raisons) => {
    d.facts.ajustement = key;
    d.action = action;
    d.raisons = raisons;
    return d;
  };
  const betTo = (fraction) => Math.min(Math.max(s.bet + Math.round(pot * fraction), legal.raise.min), legal.raise.max);

  if (legal.call) {
    // Face à une mise.
    if (bettorProfil === 'rock' && !strong && d.action.type !== 'fold'
      && (raises.length >= 2 || hand.street !== 'flop')) {
      const what = raises.length >= 2 ? 'sa relance' : `sa mise au ${hand.street === 'turn' ? 'turn' : 'river'}`;
      return adjust('rock', { type: 'fold' },
        r('C5.4', `Le joueur qui mise est serré-passif (rock) : face à ${what}, on se couche sans deux paires ou mieux ; vous avez ${d.facts.text}.`));
    }
    if (bettorProfil === 'maniaque' && topOrBetter) {
      return adjust('maniaque', { type: 'call' },
        r('C5.4', `Le joueur qui mise est large-agressif (maniaque) : avec ${d.facts.text}, on paie ses mises jusqu'à la river, sans relancer.`));
    }
    // À la river, une paire (main moyenne) face à une mise : elle bat surtout les bluffs (C5.1).
    if (hand.street === 'river' && headsUp && ['top', 'paire'].includes(d.facts.cls) && bettor !== null) {
      const rg = riverRange(hand, seat, bettor);
      const needed = (100 * legal.toCall) / (pot + legal.toCall);
      const call = rg.battues > needed;
      Object.assign(d.facts, { range: rg, beaten: rg.battues, needed });
      return adjust('range', { type: call ? 'call' : 'fold' },
        r('C5.1', `Range estimée de ${rg.profil ? `ce joueur ${NAMES[rg.profil]}` : 'ce joueur'} qui mise à la river : forte ${pctText(rg.forte)}, moyenne ${pctText(rg.moyenne)}, bluff ${pctText(rg.bluff)}.`),
        r('C3.3', `Vous avez ${d.facts.text} : elle bat les bluffs${rg.battues > rg.bluff + 0.5 ? ' et les mains moyennes plus faibles' : ''}, soit ${pctText(rg.battues)} de sa range. Équité requise : ${pctText(needed)}. ${call ? 'C\'est assez : on paie.' : 'Pas assez : on se couche.'}`));
    }
    return d;
  }

  // Personne n'a misé.
  if (headsUp && profs[0] === 'maniaque' && topOrBetter) {
    return adjust('maniaque', { type: 'check' },
      r('C5.4', `Contre un large-agressif (maniaque), avec ${d.facts.text} : on fait parole et on le laisse miser.`));
  }
  const noBluff = profs.find((p) => p === 'station' || p === 'maniaque');
  if (profs.length && profs.every((p) => p === 'station') && topOrBetter && legal.raise) {
    return adjust('station', { type: 'raise', to: betTo(3 / 4) },
      r('C5.4', `Contre un large-passif (calling station), on mise pour la valeur dès la top paire, 3/4 du pot, à chaque tour : vous avez ${d.facts.text}.`),
      r(null, `Soit ${bbText(betTo(3 / 4), hand.bb)}.`));
  }
  if (noBluff && d.action.type === 'raise' && ['bluff', 'semi-bluff'].includes(d.facts.motif)) {
    return adjust(noBluff, { type: 'check' },
      r('C5.4', `Un adversaire ${NAMES[noBluff]} est dans le coup : on ne le bluffe pas. Parole.`));
  }
  // Avantage de range (C5.3).
  const ctx = context(hand, seat);
  const high = hand.board.slice(0, 3).filter((c) => c.r >= 10).length;
  if (hand.street === 'flop' && ctx.aggressor === seat && headsUp && !noBluff && high >= 2
    && d.action.type === 'check' && legal.raise) {
    d.facts.motif = topOrBetter ? 'valeur' : 'bluff';
    return adjust('avantage', { type: 'raise', to: betTo(1 / 3) },
      r('C5.3', 'Flop à deux cartes hautes : il favorise la range du relanceur préflop. C-bet de 1/3 du pot avec toutes vos mains.'),
      r(null, `Soit ${bbText(betTo(1 / 3), hand.bb)}.`));
  }
  return d;
}
