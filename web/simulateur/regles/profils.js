// Bots à profil (C5.4) : des adversaires typés, à exploiter, en caricatures simples.
//   rock      serré-passif   : joue peu, mise rarement ;
//   station   large-passif   : paie tout, bluffe peu (calling station) ;
//   maniaque  large-agressif : mise et relance tout.
// Ils ne suivent pas les règles du cours : ils servent de cible aux ajustements du niveau 5
// (doc/plan-simulateur.md, phase 5). Leurs statistiques tombent dans le profil de C5.4
// (tests/regles/profils.test.js).
import { range, has } from '../../niveau-2/ranges.js';
import { handCode, preflopSituation } from './preflop.js';
import { handClass, outs } from './force.js';
import { bbText, potTotal } from '../positions.js';

export const PROFILS = {
  rock: { nom: 'Rock', profil: 'serré-passif', resume: 'joue peu, mise rarement' },
  station: { nom: 'Calling station', profil: 'large-passif', resume: 'paie tout, bluffe peu' },
  maniaque: { nom: 'Maniaque', profil: 'large-agressif', resume: 'mise et relance tout' },
};
export const isProfil = (level) => Object.hasOwn(PROFILS, level);

// Mains jouées avant le flop.
const ROCK = range('mains du rock', '77+, AJ+, KQ, ATs+, KJs+');          // la liste UTG, partout
const ROCK_RAISE = range('relances du rock', 'KK+');
const LARGE = range('mains larges', '22+, A2+, K7+, Q8+, J8+, T8+, 98, K2s+, Q5s+, J7s+, T7s+, 96s+, 85s+, 75s+, 64s+, 54s');
const PREMIUM = range('mains fortes', 'TT+, AQ+');
const MANIAC_3BET = range('sur-relances du maniaque', '88+, AT+, KQ, A2s+, KJs+');
const SHOVE = range('tapis', 'QQ+, AK');

const r = (texte) => ({ code: 'C5.4', texte });
const clamp = (to, legal) => Math.min(Math.max(Math.round(to), legal.raise.min), legal.raise.max);

export function profilDecision(hand, seat, profil, legal) {
  return hand.street === 'preflop' ? preflop(hand, seat, profil, legal) : postflop(hand, seat, profil, legal);
}

function preflop(hand, seat, profil, legal) {
  const code = handCode(hand.seats[seat].hole);
  const sit = preflopSituation(hand, seat);
  const { nom } = PROFILS[profil];
  const facts = { street: 'preflop', sit, code, profil };
  const unopened = sit.type === 'open' || sit.type === 'bb';
  const bb = hand.bb;
  const out = (action, texte) => ({ facts, action, raisons: [r(`${nom} : ${texte}`)] });
  const raise = (to, texte) => (legal.raise ? out({ type: 'raise', to: clamp(to, legal) }, texte) : out({ type: 'call' }, texte));
  const callOrCheck = (texte) => out(legal.call ? { type: 'call' } : { type: 'check' }, texte);
  const fold = (texte) => out({ type: 'fold' }, texte);

  if (profil === 'rock') {
    if (!has(ROCK, code)) return fold(`${code} ne fait pas partie de ses mains, il se couche.`);
    if (has(ROCK_RAISE, code) && legal.raise) return raise(unopened ? (2.5 + sit.limpers) * bb : hand.currentBet * 3, `avec ${code}, il relance.`);
    if (!unopened && legal.toCall > 12 * bb && !has(PREMIUM, code)) return fold('trop cher pour lui, il se couche.');
    return callOrCheck(unopened ? `avec ${code}, il entre en suivant, sans relancer.` : `avec ${code}, il suit.`);
  }
  if (profil === 'station') {
    if (has(ROCK_RAISE, code) && unopened && legal.raise) return raise((2.5 + sit.limpers) * bb, `avec ${code}, il relance.`);
    if (has(PREMIUM, code)) return callOrCheck(`avec ${code}, il suit.`);
    if (!has(LARGE, code)) return fold(`même lui ne joue pas ${code}.`);
    if (legal.toCall > 15 * bb) return fold('trop cher, même pour lui.');
    return callOrCheck(`avec ${code}, il suit : il aime voir le flop.`);
  }
  // maniaque
  if (sit.type === 'vs3bet' || sit.type === 'vs4bet') {
    if (has(SHOVE, code)) return out({ type: 'raise', to: legal.raise?.max }, `avec ${code}, il part à tapis.`);
    return has(PREMIUM, code) || has(MANIAC_3BET, code) ? callOrCheck(`avec ${code}, il suit la sur-relance.`) : fold('il lâche enfin.');
  }
  if (!has(LARGE, code)) return legal.call ? fold(`${code} : il se couche, une fois n'est pas coutume.`) : out({ type: 'check' }, 'il checke.');
  if (unopened) return raise((3 + sit.limpers) * bb, `avec ${code}, il relance, comme presque toujours.`);
  if (has(MANIAC_3BET, code)) return raise(hand.currentBet * 3, `avec ${code}, il sur-relance.`);
  return callOrCheck(`avec ${code}, il suit.`);
}

function postflop(hand, seat, profil, legal) {
  const s = hand.seats[seat];
  const { cls, text } = handClass(s.hole, hand.board);
  const o = hand.street === 'river' ? 0 : outs(s.hole, hand.board).n;
  const pot = potTotal(hand);
  const raises = hand.history.filter((e) => e.street === hand.street && e.type === 'raise').length;
  const { nom } = PROFILS[profil];
  const facts = { street: hand.street, cls, text, outs: o, profil };
  const out = (action, texte) => ({ facts, action, raisons: [r(`${nom} : ${texte}`)] });
  const bet = (to, texte) => (legal.raise ? out({ type: 'raise', to: clamp(to, legal) }, `${texte} (${bbText(clamp(to, legal), hand.bb)}).`) : out({ type: legal.call ? 'call' : 'check' }, `${texte}.`));
  const made = cls !== 'rien';                       // une paire au moins, avec ses cartes

  if (!legal.call) {                                  // personne n'a misé
    if (profil === 'maniaque') {
      // Sans paire ni tirage, il bluffe au flop, et plus tard seulement en tête-à-tête.
      const inPlay = hand.seats.filter((x) => x.dealt && !x.folded).length;
      if (made || o >= 4 || hand.street === 'flop' || inPlay === 2) return bet(pot * 2 / 3, `${text} : il mise`);
      return out({ type: 'check' }, `${text} : contre plusieurs joueurs, il checke.`);
    }
    if (cls === 'forte') return bet(pot / 2, `${text} : il mise, pour une fois`);
    return out({ type: 'check' }, `${text} : il checke.`);
  }
  // face à une mise
  if (profil === 'rock') {
    if (cls === 'forte' || (cls === 'top' && raises < 2)) return out({ type: 'call' }, `${text} : il suit.`);
    return out({ type: 'fold' }, `${text} : il se couche.`);
  }
  if (profil === 'station') {
    if (made || o >= 4) return out({ type: 'call' }, `${text} : il paie, « pour voir ».`);
    return out({ type: 'fold' }, `${text} : même lui se couche.`);
  }
  // maniaque
  if ((cls === 'forte' || cls === 'top' || o >= 8) && raises < 3) return bet(hand.currentBet * 3, `${text} : il relance`);
  if (made || o >= 4) return out({ type: 'call' }, `${text} : il suit.`);
  return out({ type: 'fold' }, `${text} : il se couche.`);
}
