// Règles du niveau 6 (web/simulateur/regles/niveau6.js) : défense minimale (C6.1) et bluffs de
// river équilibrés, contre un adversaire sans profil marqué ; ajustements du niveau 5 sinon.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newHand, act } from '../../web/simulateur/moteur/table.js';
import { decider } from '../../web/simulateur/bots.js';
import { preflopRange, ownRange, rankInRange } from '../../web/simulateur/regles/niveau6.js';
import { CO, CALL_OOP } from '../../web/niveau-2/strategy.js';
import { has } from '../../web/niveau-2/ranges.js';
import { rng } from '../../web/js/cards.js';
import { cartes } from '../aide.js';

// Table à 6, bouton au siège 0 : SB 1, BB 2, UTG 3, MP 4, CO 5.
function table(holes = {}, board = [], profils = null) {
  const h = Array(6).fill(null);
  for (const [seat, t] of Object.entries(holes)) h[seat] = cartes(t);
  const hand = newHand({ stacks: Array(6).fill(200), button: 0, rand: rng(1), preset: { holes: h, board: cartes(board.join(' ')) } });
  if (profils) hand.reads = { profil: (seat) => profils[seat] ?? null, stats: () => ({ hands: 0, vpip: 0, pfr: 0, af: null }) };
  return hand;
}
const F = { type: 'fold' };
const C = { type: 'call' };
const X = { type: 'check' };
const R = (to) => ({ type: 'raise', to });
const play = (h, ...a) => { for (const x of a) act(h, x); return h; };
const BOARD = ['KH', '7D', '2C', '4S', '9H'];
// Le CO (5) relance à 5, la BB (2) paie : flop, pot 11, la BB parle la première.
const coVsBB = (hole, profils, board = BOARD) => play(table({ 5: hole }, board, profils), F, F, R(5), F, F, C);

test('range du joueur avant le flop, d\'après son action (listes du niveau 2)', () => {
  const h = coVsBB('AS QD');
  const co = preflopRange(h, 5);
  assert.equal(co.size, CO.set.size);
  assert.ok([...CO.set].every((c) => co.has(c)));
  const bb = preflopRange(h, 2);
  assert.ok(CALL_OOP.set.has('AQo') && bb.has('AQo') && bb.has('22') && !bb.has('AA'));   // AA aurait sur-relancé
  const checked = play(table({}, BOARD), F, F, F, F, C, X);                                 // la SB complète, la BB checke
  assert.ok(!preflopRange(checked, 2).has('AA') && preflopRange(checked, 2).has('72o'));
  assert.ok(ownRange(h, 5).every((hole) => !hole.some((c) => cartes('KH 7D 2C').some((b) => b.r === c.r && b.s === c.s))));   // sans les cartes du flop
});

test('défense minimale (C6.1) : face à 1/3 du pot, on continue avec 73 % de sa range', () => {
  const h = play(coVsBB('AS QD'), R(4));                         // la BB mise 4 dans 11
  assert.equal(decider(h, 5, 5).action.type, 'fold');            // niveau 5 : sans paire ni tirage, on jette
  const d = decider(h, 5, 6);
  assert.equal(d.action.type, 'call');
  assert.equal(d.raisons[0].code, 'C6.1');
  assert.equal(Math.round(d.facts.mdf), 73);                     // 11 ÷ 15
  assert.ok(d.facts.better < d.facts.mdf);
  // Meilleures mains d'abord, puis tirages, puis le reste : une petite carte sans paire est en queue.
  const weak = rankInRange(play(coVsBB('5S 3S'), R(4)), 5).better;
  const pair = rankInRange(play(coVsBB('KS QS'), R(4)), 5).better;
  assert.ok(pair < 20 && weak > 90, `${pair} ${weak}`);
  assert.equal(decider(play(coVsBB('5S 3S'), R(11)), 5, 6).action.type, 'fold');              // mise pot : MDF 50 %
});

test('contre un profil marqué, serré-agressif compris, le niveau 6 joue comme le 5 (C6.4)', () => {
  for (const p of ['rock', 'station', 'maniaque', 'tag']) {
    const h = play(coVsBB('AS QD', { 2: p }), R(4));
    assert.deepEqual(decider(h, 5, 6).action, decider(h, 5, 5).action, p);
  }
});

test('river : autant de bluffs que l\'équité requise de l\'adversaire (2 pour 5 à 2/3 du pot)', () => {
  const river = (hole) => play(coVsBB(hole), X, X, X, X, X);    // parole partout ; la BB checke la river
  const d = decider(river('KS 7S'), 5, 6);                        // deux paires : mise de valeur
  assert.equal(d.action.type, 'raise');
  const f = decider(river('QS JS'), 5, 6).facts;                  // sans paire
  assert.ok(f.valueCombos > 0);
  assert.equal(f.bluffCombos, Math.round(f.valueCombos * 0.4));   // q = (2/3) ÷ (1 + 4/3) = 2/7 ; q ÷ (1 − q) = 0,4
});
