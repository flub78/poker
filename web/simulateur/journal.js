// Le journal d'une main en français, ligne par ligne, à partir de hand.history.
import { short } from '../js/cards.js';
import { describe } from '../niveau-1/evaluator.js';
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

// Lignes : { kind: 'street' | 'action' | 'result', text, seat? }. human : siège de l'humain.
export function handLog(hand, names, human = 0) {
  const pos = positions(hand);
  const lines = [];
  let street = 'preflop';
  for (const e of hand.history) {
    if (e.street !== street) {
      street = e.street;
      lines.push(streetLine(hand, street));
    }
    lines.push({ kind: 'action', seat: e.seat, text: `${names[e.seat]} (${pos[e.seat]}) ${actionText(e, hand.bb, e.seat === human)}.` });
  }
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
  } else if (hand.street !== street && STREET_NAME[hand.street]) {
    lines.push(streetLine(hand, hand.street));
  }
  return lines;
}

function streetLine(hand, street) {
  const [a, b] = BOARD_SLICE[street];
  return { kind: 'street', street, text: `${STREET_NAME[street]} : ${hand.board.slice(street === 'flop' ? a : 0, b).map(short).join(' ')}` };
}
