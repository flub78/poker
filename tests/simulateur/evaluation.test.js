// Évaluation de fin de partie (web/simulateur/evaluation.js) et partie (partie.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, startHand, replayHand, playBot, play, humanToAct, gameOver, HUMAN } from '../../web/simulateur/partie.js';
import { evaluateGame, playerStats, profile, costOf, REFERENCE_LEVEL } from '../../web/simulateur/evaluation.js';
import { newHand, act, legalActions } from '../../web/simulateur/moteur/table.js';
import { decider } from '../../web/simulateur/bots.js';
import { rng } from '../../web/js/cards.js';
import { cartes } from '../aide.js';

// L'humain suit ou checke toujours : il limpe, paie « pour voir »… beaucoup d'erreurs.
function calling(g) { return legalActions(g.hand).check ? { type: 'check' } : { type: 'call' }; }
// L'humain joue exactement comme le mentor de son niveau : aucune erreur.
function mentor(g) { return decider(g.hand, HUMAN, g.humanLevel).action; }

function playGame(g, human, n) {
  for (let i = 0; i < n; i++) {
    startHand(g);
    while (!g.hand.done) { if (humanToAct(g)) play(g, human(g)); else playBot(g); }
  }
  return g;
}

test('chaque décision est enregistrée, humain et bots', () => {
  const g = playGame(newGame({ seed: 7 }), calling, 10);
  const actions = g.finished.reduce((n, f) => n + f.hand.history.filter((e) => e.type !== 'sb' && e.type !== 'bb').length, 0);
  assert.equal(g.decisions.length, actions);
  assert.ok(g.decisions.some((d) => d.seat === HUMAN) && g.decisions.some((d) => d.seat !== HUMAN));
});

test('un joueur qui imite le mentor : 100 % conforme', () => {
  const ev = evaluateGame(playGame(newGame({ seed: 7, humanLevel: 2 }), mentor, 30));
  const you = ev.players[HUMAN];
  assert.equal(you.counts.erreur, 0);
  assert.equal(you.score, 100);
  assert.equal(ev.worst.length, 0);
  assert.match(ev.comments.you[1], /Très bon/);
});

test('un joueur qui suit tout : erreurs, règle d\'or 1 citée, 3 pires erreurs triées par coût', () => {
  const ev = evaluateGame(playGame(newGame({ seed: 7 }), calling, 30));
  const you = ev.players[HUMAN];
  assert.ok(you.counts.erreur > 5);
  assert.ok(you.byRule.some((r) => r.code === 'C2.3'));
  assert.equal(ev.worst.length, 3);
  const cost = (d) => d.ev ?? d.stake;
  assert.ok(cost(ev.worst[0]) >= cost(ev.worst[1]) && cost(ev.worst[1]) >= cost(ev.worst[2]));
  assert.equal(new Set(ev.worst.map((d) => d.hand)).size, 3);      // trois mains différentes
  assert.ok(you.stats.vpip > 50);
  assert.ok(ev.comments.you.some((l) => /entre 12 et 20 %/.test(l)));
});

test('les bots sont jugés avec les règles du niveau de référence ; ceux de ce niveau sont conformes', () => {
  const ev = evaluateGame(playGame(newGame({ seed: 9, botLevels: [2, 3, 2, 3, 2] }), calling, 40));
  for (const p of ev.players.filter((x) => !x.human)) {
    assert.equal(p.judgedAt, REFERENCE_LEVEL);
    if (p.level === REFERENCE_LEVEL) assert.equal(p.counts.erreur, 0, p.name);
  }
  assert.equal(ev.comments.bots.length, 5);
});

test('une main rejouée a les mêmes cartes et ne compte ni dans les gains ni dans l\'évaluation', () => {
  const g = playGame(newGame({ seed: 3 }), calling, 5);
  const before = { totals: [...g.totals], decisions: evaluateGame(g).players[HUMAN].decisions, handNo: g.handNo, button: g.button };
  const original = g.finished.find((f) => f.no === 2).hand;
  replayHand(g, 2);
  assert.deepEqual(g.hand.seats.map((s) => s.hole), original.seats.map((s) => s.hole));
  assert.equal(g.hand.button, original.button);
  while (!g.hand.done) { if (humanToAct(g)) play(g, { type: 'fold' }); else playBot(g); }
  assert.deepEqual(g.totals, before.totals);
  assert.equal(evaluateGame(g).players[HUMAN].decisions, before.decisions);
  assert.equal(g.handNo, before.handNo);
  startHand(g);
  assert.equal(g.hand.button, (before.button + 1) % 6);
});

test('fin de partie après le nombre de mains choisi', () => {
  const g = newGame({ seed: 1, maxHands: 3 });
  playGame(g, calling, 2);
  assert.equal(gameOver(g), false);
  playGame(g, calling, 1);
  assert.equal(gameOver(g), true);
});

test('statistiques VPIP, PFR, AF et profils de C5.4', () => {
  const g = playGame(newGame({ seed: 5 }), calling, 20);
  const st = playerStats(g.finished.map((f) => f.hand), HUMAN);
  assert.equal(st.hands, 20);
  assert.equal(st.pfr, 0);                     // il ne relance jamais
  assert.ok(st.af === 0 || st.af === null);    // jamais de mise après le flop
  assert.equal(profile({ vpip: 18, af: 3 }), 'serré-agressif');
  assert.equal(profile({ vpip: 45, af: 1 }), 'large-passif');
  assert.equal(profile({ vpip: 30, af: 2 }), 'entre les profils');
});

test('coût : espérance perdue quand on jette un tirage qui a la cote (C3.6)', () => {
  // Flop après relance du CO (5) suivie par la BB (2) ; la BB checke, le CO mise 6 : pot 17.
  const holes = Array(6).fill(null);
  holes[2] = cartes('AH 8H');
  const h = newHand({ stacks: Array(6).fill(200), button: 0, rand: rng(1), preset: { holes, board: cartes('KH 7H 2C') } });
  for (const a of [{ type: 'fold' }, { type: 'fold' }, { type: 'raise', to: 5 }, { type: 'fold' }, { type: 'fold' }, { type: 'call' }, { type: 'check' }, { type: 'raise', to: 6 }]) act(h, a);
  const advice = decider(h, 2, 3);
  const c = costOf(h, { type: 'fold' }, advice, legalActions(h));
  // 35 % × 17 − 65 % × 6 = 2,05 jetons
  assert.ok(Math.abs(c.ev - 2.05) < 0.01, String(c.ev));
  assert.equal(c.stake, 17);
});
