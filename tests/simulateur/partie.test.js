// Partie (web/simulateur/partie.js) et journal (journal.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, startHand, playBot, play, humanToAct, HUMAN } from '../../web/simulateur/partie.js';
import { handLog } from '../../web/simulateur/journal.js';
import { legalActions } from '../../web/simulateur/moteur/table.js';

// L'humain joue « au plus simple » : il checke ou suit.
function playHand(g) {
  startHand(g);
  while (!g.hand.done) {
    if (humanToAct(g)) play(g, legalActions(g.hand).check ? { type: 'check' } : { type: 'call' });
    else playBot(g);
  }
}

test('le bouton tourne et chaque main repart de 100 BB', () => {
  const g = newGame({ seed: 3 });
  const buttons = [];
  for (let i = 0; i < 7; i++) {
    playHand(g);
    buttons.push(g.hand.button);
    assert.ok(g.hand.seats.every((s) => s.start === 200));
  }
  for (let i = 1; i < 7; i++) assert.equal(buttons[i], (buttons[i - 1] + 1) % 6);
});

test('500 mains entre bots des niveaux 2 et 3 : aucune erreur, jetons conservés', () => {
  const g = newGame({ seed: 11, botLevels: [2, 3, 2, 3, 3] });
  for (let i = 0; i < 500; i++) playHand(g);
  assert.equal(g.totals.reduce((a, b) => a + b, 0), 0);
  assert.equal(g.handNo, 500);
});

test('même graine, même partie', () => {
  const a = newGame({ seed: 8 });
  const b = newGame({ seed: 8 });
  for (let i = 0; i < 20; i++) { playHand(a); playHand(b); }
  assert.deepEqual(a.totals, b.totals);
});

test('journal en français, à la 2e personne pour l\'humain', () => {
  const g = newGame({ seed: 5 });
  playHand(g);
  const lines = handLog(g.hand, g.players.map((p) => p.name), HUMAN).map((l) => l.text);
  assert.ok(lines.some((l) => /^Vous \((BB|SB|BTN|UTG|MP|CO)\) (posez|checkez|suivez|vous couchez|misez|relancez)/.test(l)), lines.join('\n'));
  assert.ok(lines.some((l) => /(gagne|gagnez) \d/.test(l)));
  assert.ok(!lines.some((l) => /undefined|NaN/.test(l)));
});

// Joue des mains jusqu'à trouver un abattage avec le tableau complet.
function showdownHand(seed) {
  const g = newGame({ seed });
  for (let k = 0; k < 200; k++) {
    playHand(g);
    if (g.hand.result.showdown && g.hand.board.length === 5) return g;
  }
  throw new Error('aucun abattage');
}

test('journal : vos cartes après les blinds, le tableau rue par rue, les mains de tous à la fin', () => {
  const g = showdownHand(21);
  const names = g.players.map((p) => p.name);
  const lines = handLog(g.hand, names, HUMAN);
  const kinds = lines.map((l) => l.kind);
  assert.equal(kinds.indexOf('deal'), 2);                           // après les deux blinds
  assert.deepEqual(lines[2].cards, g.hand.seats[HUMAN].hole);
  const streets = lines.filter((l) => l.kind === 'street');
  assert.deepEqual(streets.map((l) => [l.street, l.cards.length, l.newCards]), [['flop', 3, 3], ['turn', 4, 1], ['river', 5, 1]]);
  const hands = lines.filter((l) => l.kind === 'hand');
  assert.equal(hands.length, 5);                                    // les 5 bots, couchés compris
  for (const l of hands) assert.deepEqual(l.cards, g.hand.seats[l.seat].hole);
  assert.ok(hands.some((l) => /\(couché\)$/.test(l.text)));
  assert.ok(lines.some((l) => /^Cartes d'Alix/.test(l.text)) || !hands.some((l) => l.seat === 1));
});

test('journal pendant la main : cartes des bots cachées, sauf réglage « visibles »', () => {
  const g = newGame({ seed: 4 });
  startHand(g);
  const names = g.players.map((p) => p.name);
  assert.equal(handLog(g.hand, names, HUMAN).filter((l) => l.kind === 'hand').length, 0);
  assert.equal(handLog(g.hand, names, HUMAN, { showAll: true }).filter((l) => l.kind === 'hand').length, 5);
});
