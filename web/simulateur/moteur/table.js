// Une main de Texas Hold'em sans limite, de la pose des blinds au partage des pots.
// JavaScript pur, sans DOM : testé sous Node (tests/moteur/).
//
//   const main = newHand({ stacks: [200, 200, …], button: 0, sb: 1, bb: 2, rand });
//   while (!main.done) act(main, choix(legalActions(main)));
//
// Actions : { type: 'fold' } · { type: 'check' } · { type: 'call' } · { type: 'raise', to }
// « to » est le total misé par le joueur dans le tour d'enchères (une mise d'ouverture est une
// relance à partir de 0). Une action illégale lève une erreur et ne change rien.
// act() modifie la main reçue ; structuredClone(main) en fait une copie.
import { deck, shuffle } from '../../js/cards.js';
import { computePots, awardPots } from './pots.js';

export const STREETS = ['preflop', 'flop', 'turn', 'river'];

// Sièges suivants dans le sens du jeu, à partir de celui qui suit « from ».
function after(n, from) {
  const out = [];
  for (let k = 1; k <= n; k++) out.push((from + k) % n);
  return out;
}

const inHand = (s) => s.dealt && !s.folded;
const canAct = (s) => inHand(s) && !s.allIn;

// preset (facultatif) : cartes imposées, pour les tests ou pour rejouer une situation :
//   { holes: [[c, c], …] (un élément par siège, null pour une main au hasard), board: [c, …] }
// Les cartes non imposées sont tirées au hasard parmi les autres.
export function newHand({ stacks, button, sb = 1, bb = 2, rand = Math.random, preset = null }) {
  const n = stacks.length;
  const seats = stacks.map((stack, i) => ({
    seat: i, stack, start: stack, hole: [], bet: 0, committed: 0,
    dealt: stack > 0, folded: false, allIn: false, acted: false,
  }));
  const dealt = seats.filter((s) => s.dealt);
  if (dealt.length < 2) throw new Error('Il faut au moins 2 joueurs avec des jetons.');
  if (!seats[button].dealt) throw new Error('Le bouton doit être devant un joueur en jeu.');

  const order = after(n, button).filter((i) => seats[i].dealt);       // à partir de la gauche du bouton
  const headsUp = dealt.length === 2;
  // En tête-à-tête, le bouton pose la petite blind et parle le premier avant le flop.
  const sbSeat = headsUp ? button : order[0];
  const bbSeat = headsUp ? order[0] : order[1];

  const hand = {
    seats, button, sb, bb, sbSeat, bbSeat, order,
    deck: shuffle(deck(), rand),
    board: [], street: 'preflop', currentBet: 0, lastRaise: bb,
    toAct: null, history: [], done: false, result: null,
  };
  // Deux cartes par joueur, une à la fois, en commençant par la petite blind.
  const dealOrder = [sbSeat, ...after(n, sbSeat).filter((i) => i !== sbSeat && seats[i].dealt)];
  if (preset) applyPreset(hand, preset, dealOrder);
  for (let round = 0; round < 2; round++) for (const i of dealOrder) seats[i].hole.push(hand.deck.shift());

  post(hand, sbSeat, sb, 'sb');
  post(hand, bbSeat, bb, 'bb');
  hand.currentBet = bb;                    // même si la grosse blind est à tapis pour moins
  hand.toAct = nextToAct(hand, bbSeat);
  if (hand.toAct === null) finishStreet(hand);
  return hand;
}

// Range le paquet pour que la distribution donne les cartes imposées.
function applyPreset(hand, { holes = [], board = [] }, dealOrder) {
  const key = (c) => `${c.r}${c.s}`;
  const fixed = [...holes.flat().filter(Boolean), ...board];
  const used = new Set(fixed.map(key));
  if (used.size !== fixed.length) throw new Error('Une carte imposée apparaît deux fois.');
  const rest = hand.deck.filter((c) => !used.has(key(c)));
  const deckOut = [];
  for (let round = 0; round < 2; round++) {
    for (const i of dealOrder) deckOut.push(holes[i] ? holes[i][round] : rest.shift());
  }
  hand.deck = [...deckOut, ...board, ...rest];
}

function post(hand, i, amount, type) {
  const s = hand.seats[i];
  const paid = Math.min(amount, s.stack);
  pay(s, paid);
  hand.history.push({ street: 'preflop', seat: i, type, amount: paid, to: s.bet });
}

function pay(s, amount) {
  s.stack -= amount;
  s.bet += amount;
  s.committed += amount;
  if (s.stack === 0) s.allIn = true;
}

// Le prochain siège qui doit parler après « from », ou null si le tour d'enchères est fini.
function nextToAct(hand, from) {
  const n = hand.seats.length;
  const able = hand.seats.filter(canAct);
  if (hand.seats.filter(inHand).length < 2) return null;
  for (const i of after(n, from)) {
    const s = hand.seats[i];
    if (!canAct(s)) continue;
    if (!s.acted || s.bet < hand.currentBet) {
      // Seul joueur encore libre, déjà à hauteur de la mise : rien à décider.
      if (able.length === 1 && s.bet >= hand.currentBet) return null;
      return i;
    }
  }
  return null;
}

// Ce que le joueur qui a la parole peut faire.
// { seat, toCall, fold, check, call, raise: { min, max } | null }
//   toCall : jetons à ajouter pour suivre (limités au tapis : suivre à tapis pour moins est permis).
export function legalActions(hand) {
  if (hand.done || hand.toAct === null) return null;
  const s = hand.seats[hand.toAct];
  const owed = hand.currentBet - s.bet;
  const toCall = Math.min(owed, s.stack);
  const others = hand.seats.filter((o) => o !== s && canAct(o));
  // Relancer : pas après une relance incomplète (à tapis pour moins) quand on a déjà parlé,
  // ni s'il ne reste personne pour répondre, ni sans jetons au-delà du call.
  const maxTo = s.bet + s.stack;
  const canRaise = !s.acted && others.length > 0 && maxTo > hand.currentBet;
  const minTo = Math.min(hand.currentBet + hand.lastRaise, maxTo);
  return {
    seat: s.seat, toCall,
    fold: true,
    check: owed === 0,
    call: owed > 0,
    raise: canRaise ? { min: minTo, max: maxTo } : null,
  };
}

export function act(hand, action) {
  const legal = legalActions(hand);
  if (!legal) throw new Error('La main est terminée.');
  const s = hand.seats[hand.toAct];
  // facing : la mise à hauteur de laquelle il fallait se mettre (0 : personne n'avait misé).
  const entry = { street: hand.street, seat: s.seat, type: action.type, facing: hand.currentBet };
  switch (action.type) {
    case 'fold':
      s.folded = true;
      break;
    case 'check':
      if (!legal.check) throw new Error('Impossible de checker : il y a une mise à suivre.');
      break;
    case 'call':
      if (!legal.call) throw new Error('Rien à suivre : checker.');
      pay(s, legal.toCall);
      entry.amount = legal.toCall;
      break;
    case 'raise': {
      if (!legal.raise) throw new Error('Relance impossible ici.');
      const to = action.to;
      if (!Number.isInteger(to) || to < legal.raise.min || to > legal.raise.max) {
        throw new Error(`Relance à ${to} : il faut entre ${legal.raise.min} et ${legal.raise.max}.`);
      }
      const size = to - hand.currentBet;
      entry.amount = to - s.bet;
      pay(s, entry.amount);
      // Relance complète : elle rouvre la parole à tous ; incomplète (tapis pour moins) : non.
      if (size >= hand.lastRaise) {
        hand.lastRaise = size;
        for (const o of hand.seats) if (o !== s) o.acted = false;
      }
      hand.currentBet = to;
      break;
    }
    default:
      throw new Error(`Action inconnue : ${action.type}`);
  }
  s.acted = true;
  entry.to = s.bet;
  entry.allIn = s.allIn;
  hand.history.push(entry);

  if (hand.seats.filter(inHand).length === 1) return finish(hand);
  hand.toAct = nextToAct(hand, s.seat);
  if (hand.toAct === null) finishStreet(hand);
  return hand;
}

// Fin d'un tour d'enchères : rue suivante, ou abattage.
function finishStreet(hand) {
  for (;;) {
    for (const s of hand.seats) { s.bet = 0; s.acted = false; }
    hand.currentBet = 0;
    hand.lastRaise = hand.bb;
    if (hand.street === 'river') return finish(hand);
    hand.street = STREETS[STREETS.indexOf(hand.street) + 1];
    hand.board.push(...hand.deck.splice(0, hand.street === 'flop' ? 3 : 1));
    // Après le flop, le premier à parler est le premier joueur libre à gauche du bouton.
    hand.toAct = nextToAct(hand, hand.button);
    if (hand.toAct !== null) return hand;
    // Tout le monde (ou tout le monde sauf un) est à tapis : on déroule le tableau.
  }
}

function finish(hand) {
  const live = hand.seats.filter(inHand);
  const showdown = live.length > 1;
  if (showdown) while (hand.board.length < 5) hand.board.push(hand.deck.shift());
  const pots = computePots(hand.seats);
  const awarded = awardPots(pots, hand.seats.map((s) => s.hole), hand.board, hand.order);
  const won = hand.seats.map(() => 0);
  for (const pot of awarded) for (const [i, amount] of Object.entries(pot.shares)) won[i] += amount;
  hand.seats.forEach((s, i) => { s.stack += won[i]; s.bet = 0; });
  hand.toAct = null;
  hand.done = true;
  hand.street = showdown ? 'showdown' : hand.street;
  hand.result = { showdown, pots: awarded, won, net: hand.seats.map((s) => s.stack - s.start) };
  return hand;
}
