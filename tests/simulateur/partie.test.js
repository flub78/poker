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
