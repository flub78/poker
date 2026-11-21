// Partie (web/simulateur/partie.js) et journal (journal.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, startHand, replayHand, playBot, play, humanToAct, HUMAN, carry, carriedStacks } from '../../web/simulateur/partie.js';
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

// ---------- tapis conservés (réglage « Tapis », décision D9) ----------

test('tapis conservés : chaque main repart des tapis de la précédente', () => {
  const g = newGame({ seed: 3, keepStacks: true });
  playHand(g);
  for (let i = 0; i < 30; i++) {
    const before = g.stacks.slice();
    playHand(g);
    g.hand.seats.forEach((s, k) => assert.equal(s.start, before[k] > 0 ? before[k] : 200));
  }
  assert.ok(g.stacks.some((x) => x !== 200), 'les tapis devraient avoir bougé en 31 mains');
});

test('tapis conservés : recave de 100 BB à zéro, comptée et écrite au journal', () => {
  const g = newGame({ seed: 4, keepStacks: true });
  g.stacks = [200, 0, 200, 200, 200, 400];              // Alix est à zéro
  startHand(g);
  assert.equal(g.hand.seats[1].start, 200);
  assert.deepEqual(g.hand.rebuys, [1]);
  assert.deepEqual(g.rebuys, [0, 1, 0, 0, 0, 0]);
  assert.equal(g.hand.seats[5].start, 400);
  const lines = handLog(g.hand, g.players.map((p) => p.name), HUMAN).map((l) => l.text);
  assert.ok(lines.includes('Alix se recave de 100 BB'), lines.join('\n'));
});

test('tapis conservés : 300 mains sans erreur, jetons conservés aux recaves près', () => {
  const g = newGame({ seed: 12, keepStacks: true, botLevels: [2, 3, 4, 3, 2] });
  for (let i = 0; i < 300; i++) playHand(g);
  const rebought = g.rebuys.reduce((a, b) => a + b, 0) * 200;
  assert.equal(g.stacks.reduce((a, b) => a + b, 0), 6 * 200 + rebought);
  assert.equal(g.totals.reduce((a, b) => a + b, 0), 0);
  assert.ok(g.stacks.every((x) => x >= 0));
});

test('tapis conservés : une main rejouée repart des mêmes tapis et ne les change pas', () => {
  const g = newGame({ seed: 6, keepStacks: true });
  for (let i = 0; i < 5; i++) playHand(g);
  const no = 3;
  const starts = g.finished.find((f) => f.no === no).hand.seats.map((s) => s.start);
  const after = g.stacks.slice();
  replayHand(g, no);
  assert.deepEqual(g.hand.seats.map((s) => s.start), starts);
  while (!g.hand.done) {
    if (humanToAct(g)) play(g, legalActions(g.hand).check ? { type: 'check' } : { type: 'call' });
    else playBot(g);
  }
  assert.deepEqual(g.stacks, after);
});

test('par défaut, pas de recave et 100 BB à chaque main', () => {
  const g = newGame({ seed: 4 });
  g.stacks = [200, 0, 200, 200, 200, 400];
  startHand(g);
  assert.ok(g.hand.seats.every((s) => s.start === 200));
  assert.deepEqual(g.hand.rebuys, []);
});

// ---------- tapis conservés d'une partie à l'autre ----------

test('entre les parties : la partie suivante repart des tapis et recaves de la précédente', () => {
  const g = newGame({ seed: 21, keepStacks: true, botLevels: [2, 3, 2, 3, 2] });
  for (let i = 0; i < 40; i++) playHand(g);
  const saved = JSON.parse(JSON.stringify(carry(g)));     // passage par le stockage
  const next = carriedStacks(saved, g.players.map((p) => p.level), 200);
  const g2 = newGame({ seed: 22, keepStacks: true, botLevels: [2, 3, 2, 3, 2], ...next });
  assert.deepEqual(g2.stacks, g.stacks);
  assert.deepEqual(g2.rebuys, g.rebuys);
  startHand(g2);
  g2.hand.seats.forEach((s, k) => assert.equal(s.start, g.stacks[k] > 0 ? g.stacks[k] : 200));
  assert.deepEqual(g2.totals, [0, 0, 0, 0, 0, 0], 'les gains se comptent par partie');
});

test('entre les parties : un bot changé de niveau repart à 100 BB, votre siège garde son tapis', () => {
  const saved = { stacks: [350, 120, 0, 410, 200, 90], rebuys: [1, 0, 2, 0, 0, 3], levels: [2, 2, 3, 2, 3, 2] };
  const { stacks, rebuys } = carriedStacks(saved, [4, 2, 3, 'rock', 3, 2], 200);
  assert.deepEqual(stacks, [350, 120, 0, 200, 200, 90]);
  assert.deepEqual(rebuys, [1, 0, 2, 0, 0, 3]);
});

test('entre les parties : rien d\'enregistré ou données abîmées → 100 BB pour tous', () => {
  const fresh = { stacks: Array(6).fill(200), rebuys: Array(6).fill(0) };
  const levels = [2, 2, 3, 2, 3, 2];
  assert.deepEqual(carriedStacks(null, levels, 200), fresh);
  assert.deepEqual(carriedStacks({ stacks: [1, 2] }, levels, 200), fresh);
  const bad = carriedStacks({ stacks: [-5, 'x', 200, 200, 200, 200], rebuys: Array(6).fill(0), levels }, levels, 200);
  assert.deepEqual(bad.stacks, [200, 200, 200, 200, 200, 200]);
});

test('sans keepStacks, les tapis fournis sont ignorés', () => {
  const g = newGame({ seed: 4, stacks: [10, 20, 30, 40, 50, 60], rebuys: [1, 1, 1, 1, 1, 1] });
  assert.deepEqual(g.stacks, Array(6).fill(200));
  assert.deepEqual(g.rebuys, Array(6).fill(0));
});
