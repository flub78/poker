// Génération des situations préflop du niveau 2 et de leur description.
import { pick, int, shuffle } from '../js/cards.js';
import { POSITIONS, POSITION_NAME, decide, openRange, RERAISE, CALL_IP, CALL_OOP, CALL_3BET, BTN, isBlind } from './strategy.js';
import { union, frontier, randomHand, ALL_HANDS } from './ranges.js';

const OPENERS = ['UTG', 'MP', 'CO', 'BTN', 'SB'];
const after = (pos) => POSITIONS.slice(POSITIONS.indexOf(pos) + 1);
const before = (pos) => POSITIONS.slice(0, POSITIONS.indexOf(pos));
const list = (names) => (names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`);

export const KINDS = {
  open: 'Personne n\'a relancé',
  vsRaise: 'Face à une relance',
};

export function makeSituation(type, rand) {
  switch (type) {
    case 'open': {
      const pos = pick(OPENERS, rand);
      const others = before(pos).filter((p) => p !== 'SB' && p !== 'BB');
      const limpers = others.length && rand() < 0.25 ? shuffle(others, rand).slice(0, 1) : [];
      return { type, pos, limpers };
    }
    case 'bb': {
      const limpers = shuffle(['UTG', 'MP', 'CO', 'BTN', 'SB'], rand).slice(0, int(1, 2, rand))
        .sort((a, b) => POSITIONS.indexOf(a) - POSITIONS.indexOf(b));
      return { type, limpers };
    }
    case 'vsRaise': {
      const hero = pick(['MP', 'CO', 'BTN', 'SB', 'BB'], rand);
      return { type, raiser: pick(before(hero).filter((p) => p !== 'SB'), rand), hero };
    }
    case 'vs3bet': {
      const hero = pick(['UTG', 'MP', 'CO', 'BTN'], rand);
      return { type, hero, threeBettor: pick(after(hero), rand) };
    }
    case 'squeeze': {
      const hero = pick(['CO', 'BTN', 'SB', 'BB'], rand);
      const raiser = pick(before(hero).filter((p) => !isBlind(p) && before(hero).indexOf(p) < before(hero).length - 1), rand);
      const threeBettor = pick(POSITIONS.slice(POSITIONS.indexOf(raiser) + 1, POSITIONS.indexOf(hero)), rand);
      return { type, raiser, threeBettor, hero };
    }
    default:
      throw new Error(`Type inconnu : ${type}`);
  }
}

export function describe(sit) {
  switch (sit.type) {
    case 'open': {
      if (sit.pos === 'UTG') return 'Vous êtes UTG : vous parlez le premier.';
      const where = `Vous êtes ${POSITION_NAME[sit.pos]}.`;
      if (sit.limpers.length) return `${list(sit.limpers)} a seulement suivi (limp), les autres se sont couchés. ${where}`;
      return `Tout le monde s'est couché avant vous. ${where}`;
    }
    case 'bb':
      return `${list(sit.limpers)} ${sit.limpers.length > 1 ? 'ont' : 'a'} seulement suivi (limp), les autres se sont couchés. Vous êtes ${POSITION_NAME.BB}.`;
    case 'vsRaise':
      return `${sit.raiser} relance à 2,5 BB, les autres se couchent jusqu'à vous. Vous êtes ${POSITION_NAME[sit.hero]}.`;
    case 'vs3bet':
      return `Vous avez relancé depuis ${{ BTN: 'le bouton', CO: 'le CO' }[sit.hero] || sit.hero}. ${sit.threeBettor} sur-relance à 8 BB, les autres se couchent.`;
    case 'squeeze':
      return `${sit.raiser} relance à 2,5 BB, ${sit.threeBettor} sur-relance à 8 BB. Vous êtes ${POSITION_NAME[sit.hero]}.`;
    default:
      return '';
  }
}

// Les mains qui comptent dans une situation : celles qu'on joue à la grille complète.
function relevant(sit) {
  switch (sit.type) {
    case 'open': return openRange(sit.pos);
    case 'bb': return openRange('BB');
    case 'vsRaise': return union('', '', RERAISE, isBlind(sit.hero) ? CALL_OOP : CALL_IP);
    case 'vs3bet': return union('', '', RERAISE, CALL_3BET);
    default: return RERAISE;
  }
}

// Main tirée pour une situation : souvent près d'une frontière de la grille,
// sinon au hasard comme dans une vraie donne.
export function handFor(sit, rand, step) {
  if (rand() < 0.35) return randomHand(rand);
  const sets = [relevant(sit).set];
  if (step !== undefined && sit.type === 'open') sets.push(openRange(sit.pos, step).set);
  if (sit.type === 'open') sets.push(BTN.set);
  const pool = [...new Set(sets.flatMap((s) => frontier(s)))];
  return pick(pool.length ? pool : ALL_HANDS, rand);
}

export { decide };
