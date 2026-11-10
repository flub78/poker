// Le journal d'une main en français, ligne par ligne, à partir de hand.history.
import { short } from '../js/cards.js';
import { describe, evaluate } from '../niveau-1/evaluator.js';
import { positions, bbText } from './positions.js';

const STREET_NAME = { flop: 'Flop', turn: 'Turn', river: 'River' };
const BOARD_SLICE = { flop: [0, 3], turn: [3, 4], river: [4, 5] };

// Verbes à la 3e personne et à la 2e personne du pluriel (« Vous suivez »).
const VERBS = {
  pose: ['pose', 'posez'], couche: ['se couche', 'vous couchez'], checke: ['checke', 'checkez'],
  suit: ['suit', 'suivez'], relance: ['relance', 'relancez'], mise: ['mise', 'misez'],
  gagne: ['gagne', 'gagnez'], récupère: ['récupère', 'récupérez'],
};
const verb = (v, you) => VERBS[v][you ? 1 : 0];

// you : true pour le joueur humain.
export function actionText(e, bb, you = false) {
  const tapis = e.allIn ? ' (tapis)' : '';
  switch (e.type) {
    case 'sb': return `${verb('pose', you)} la petite blind (${bbText(e.amount, bb)})${tapis}`;
    case 'bb': return `${verb('pose', you)} la grosse blind (${bbText(e.amount, bb)})${tapis}`;
    case 'fold': return verb('couche', you);
    case 'check': return verb('checke', you);
    case 'call': return `${verb('suit', you)} (${bbText(e.amount, bb)})${tapis}`;
    case 'raise': return `${e.facing ? `${verb('relance', you)} à` : verb('mise', you)} ${bbText(e.to, bb)}${tapis}`;
    default: return e.type;
  }
}

// Lignes : { kind: 'deal' | 'street' | 'action' | 'result' | 'hand', text, seat?, cards? }.
// cards : les cartes à dessiner (donne, tableau, mains). human : siège de l'humain.
// showAll : cartes des bots visibles dès la donne (réglage d'entraînement) ; en fin de main, les
// cartes de tous les joueurs sont montrées, couchés compris.
export function handLog(hand, names, human = 0, { showAll = false } = {}) {
  const pos = positions(hand);
  const lines = [];
  const holeLine = (seat, extra = '') => ({
    kind: seat === human ? 'deal' : 'hand', seat, cards: hand.seats[seat].hole,
    text: `${seat === human ? 'Vos cartes' : `Cartes ${/^[AEIOUYÉÈ]/i.test(names[seat]) ? 'd\'' : 'de '}${names[seat]}`} (${pos[seat]}) : ${hand.seats[seat].hole.map(short).join(' ')}${extra}`,
  });
  let street = 'preflop';
  let dealt = false;
  const deal = () => {
    if (dealt) return;
    dealt = true;
    lines.push(holeLine(human));
    if (showAll && !hand.done) for (const seat of hand.order) if (seat !== human) lines.push(holeLine(seat));
  };
  for (const e of hand.history) {
    if (e.type !== 'sb' && e.type !== 'bb') deal();
    if (e.street !== street) {
      street = e.street;
      lines.push(streetLine(hand, street));
    }
    lines.push({ kind: 'action', seat: e.seat, text: `${names[e.seat]} (${pos[e.seat]}) ${actionText(e, hand.bb, e.seat === human)}.` });
  }
  deal();
  if (hand.done) {
    // Rues déroulées sans action (tout le monde à tapis).
    for (const st of ['flop', 'turn', 'river']) {
      if (hand.board.length >= BOARD_SLICE[st][1] && !lines.some((l) => l.kind === 'street' && l.street === st)) {
        lines.push(streetLine(hand, st));
      }
    }
    for (const pot of hand.result.pots) {
      for (const [seat, amount] of Object.entries(pot.shares)) {
        const how = hand.result.showdown && pot.eligible.length > 1 ? ` avec ${describe(pot.score).toLowerCase()}` : '';
        const what = verb(pot.eligible.length === 1 && hand.result.pots.length > 1 ? 'récupère' : 'gagne', Number(seat) === human);
        lines.push({ kind: 'result', seat: Number(seat), text: `${names[seat]} ${what} ${bbText(amount, hand.bb)}${how}.` });
      }
    }
    // Les mains de tous les joueurs, pour juger les décisions après coup.
    for (const seat of hand.order) {
      if (seat === human) continue;
      const s = hand.seats[seat];
      const extra = s.folded ? ' (couché)'
        : hand.result.showdown ? ` (${describe(evaluate([...s.hole, ...hand.board])).toLowerCase()})` : '';
      lines.push(holeLine(seat, extra));
    }
  } else if (hand.street !== street && STREET_NAME[hand.street]) {
    lines.push(streetLine(hand, hand.street));
  }
  return lines;
}

function streetLine(hand, street) {
  const [a, b] = BOARD_SLICE[street];
  const cards = hand.board.slice(0, b);
  return { kind: 'street', street, cards, newCards: b - a, text: `${STREET_NAME[street]} : ${cards.map(short).join(' ')}` };
}
