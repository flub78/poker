// Lecture des adversaires (web/simulateur/lecture.js) : statistiques et profils au fil de la partie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReads, playerStats, profileKey, MIN_HANDS } from '../../web/simulateur/lecture.js';
import { newGame, startHand, replayHand, playBot, play, humanToAct } from '../../web/simulateur/partie.js';
import { newHand, act, legalActions } from '../../web/simulateur/moteur/table.js';
import { decider } from '../../web/simulateur/bots.js';
import { rng } from '../../web/js/cards.js';

const X = { type: 'check' };
const C = { type: 'call' };

function finish(g) {
  while (!g.hand.done) {
    if (humanToAct(g)) play(g, legalActions(g.hand).check ? X : C);
    else playBot(g);
  }
}

test('profil exploitable : seulement après 30 mains, et seulement dans un coin de C5.4', () => {
  assert.equal(MIN_HANDS, 30);
  assert.equal(profileKey({ hands: 29, vpip: 45, af: 0.3 }), null);
  assert.equal(profileKey({ hands: 30, vpip: 45, af: 0.3 }), 'station');
  assert.equal(profileKey({ hands: 30, vpip: 45, af: 4 }), 'maniaque');
  assert.equal(profileKey({ hands: 30, vpip: 10, af: 0.5 }), 'rock');
  assert.equal(profileKey({ hands: 30, vpip: 15, af: 3 }), 'tag');
  assert.equal(profileKey({ hands: 30, vpip: 30, af: 3 }), null);            // ni serré ni large
  assert.equal(profileKey({ hands: 30, vpip: 45, af: 2 }), null);            // agressivité moyenne
  assert.equal(profileKey({ hands: 30, vpip: 45, af: null }), null);
});

test('la lecture tenue main après main donne les mêmes chiffres que le calcul d\'un coup', () => {
  const levels = [3, 'rock', 'station', 'maniaque', 2, 4];
  const rand = rng(4);
  const reads = createReads(6);
  const hands = [];
  for (let k = 0; k < 200; k++) {
    const h = newHand({ stacks: Array(6).fill(200), button: k % 6, rand });
    while (!h.done) act(h, decider(h, h.toAct, levels[h.toAct]).action);
    reads.add(h);
    hands.push(h);
  }
  for (let seat = 0; seat < 6; seat++) assert.deepEqual(reads.stats(seat), playerStats(hands, seat));
  assert.equal(reads.profil(1), 'rock');
  assert.equal(reads.profil(2), 'station');
  assert.equal(reads.profil(3), 'maniaque');
});

test('la partie tient sa lecture ; une main rejouée n\'y compte pas', () => {
  const g = newGame({ seed: 9, botLevels: ['station', 'station', 'rock', 'maniaque', 4] });
  for (let i = 0; i < 40; i++) { startHand(g); finish(g); }
  assert.equal(g.hand.reads, g.reads);                                       // les bots y ont accès
  const before = g.reads.stats(1);
  assert.equal(before.hands, 40);
  assert.equal(g.reads.profil(1), 'station');
  replayHand(g, 3);
  finish(g);
  assert.deepEqual(g.reads.stats(1), before);
});
