// Tests de propriétés du moteur : des milliers de mains jouées au hasard, avec des tapis de
// tailles variées. À chaque étape, les règles qui doivent toujours tenir sont vérifiées.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newHand, legalActions, act } from '../../web/simulateur/moteur/table.js';
import { evaluate, compare } from '../../web/niveau-1/evaluator.js';
import { rng, int } from '../../web/js/cards.js';

const MAINS = 10000;

// Un joueur au hasard : toutes les actions légales, montants de relance variés (min, max, entre).
function randomAction(legal, rand) {
  const options = [];
  if (legal.check) options.push({ type: 'check' }, { type: 'check' });
  if (legal.call) options.push({ type: 'call' }, { type: 'call' });
  options.push({ type: 'fold' });
  if (legal.raise) {
    const { min, max } = legal.raise;
    options.push({ type: 'raise', to: min }, { type: 'raise', to: max }, { type: 'raise', to: int(min, max, rand) });
  }
  return options[Math.floor(rand() * options.length)];
}

// Une action probablement illégale, pour vérifier qu'elle est refusée sans rien changer.
function badAction(legal, rand) {
  const bad = [];
  if (!legal.check) bad.push({ type: 'check' });
  if (!legal.call) bad.push({ type: 'call' });
  if (!legal.raise) bad.push({ type: 'raise', to: 1000000 });
  else bad.push({ type: 'raise', to: legal.raise.max + 1 }, { type: 'raise', to: legal.raise.min - 1 });
  return bad[Math.floor(rand() * bad.length)];
}

test(`${MAINS} mains au hasard : jetons conservés, règles respectées, partage correct`, () => {
  const rand = rng(2026);
  const stats = { showdown: 0, sidePots: 0, splits: 0, illegal: 0 };
  for (let m = 0; m < MAINS; m++) {
    const n = int(2, 6, rand);
    const stacks = Array.from({ length: n }, () => (rand() < 0.3 ? int(1, 30, rand) : int(31, 400, rand)));
    const total = stacks.reduce((a, b) => a + b, 0);
    const button = int(0, n - 1, rand);
    const h = newHand({ stacks, button, rand });
    const where = () => `main ${m}, tapis ${stacks}, bouton ${button}`;

    let steps = 0;
    while (!h.done) {
      assert.ok(++steps < 200, `${where()} : la main ne se termine pas`);
      const legal = legalActions(h);
      const s = h.seats[h.toAct];
      assert.ok(!s.folded && !s.allIn && s.dealt, `${where()} : parole à un joueur qui ne peut pas jouer`);
      assert.ok(legal.check !== legal.call, `${where()} : checker et suivre ne s'excluent pas`);
      if (legal.raise) assert.ok(legal.raise.min <= legal.raise.max && legal.raise.min > h.currentBet);

      if (rand() < 0.05) {
        const before = JSON.stringify(h);
        const bad = badAction(legal, rand);
        assert.throws(() => act(h, bad), undefined, `${where()} : action illégale acceptée ${JSON.stringify(bad)}`);
        assert.equal(JSON.stringify(h), before, `${where()} : une action refusée a modifié la main`);
        stats.illegal++;
      }
      act(h, randomAction(legal, rand));

      const inPlay = h.seats.reduce((a, x) => a + x.stack + (h.done ? 0 : x.committed), 0);
      assert.equal(inPlay, total, `${where()} : jetons créés ou perdus en cours de main`);
      assert.ok(h.seats.every((x) => x.stack >= 0), `${where()} : tapis négatif`);
    }

    // Fin de main
    assert.equal(h.seats.reduce((a, x) => a + x.stack, 0), total, `${where()} : jetons non conservés`);
    assert.equal(h.result.net.reduce((a, b) => a + b, 0), 0);
    const potTotal = h.result.pots.reduce((a, p) => a + p.amount, 0);
    assert.equal(potTotal, h.seats.reduce((a, x) => a + x.committed, 0), `${where()} : pots ≠ mises`);
    for (const x of h.seats) assert.ok(x.start - x.committed >= 0, `${where()} : mise au-delà du tapis`);

    if (h.result.showdown) {
      stats.showdown++;
      assert.equal(h.board.length, 5);
      if (h.result.pots.length > 1) stats.sidePots++;
      for (const pot of h.result.pots) {
        assert.ok(pot.winners.every((w) => pot.eligible.includes(w)), `${where()} : gagnant non éligible`);
        assert.equal(Object.values(pot.shares).reduce((a, b) => a + b, 0), pot.amount);
        if (pot.eligible.length > 1) {
          // Aucun joueur éligible n'a une main meilleure que celle des gagnants.
          const score = (i) => evaluate([...h.seats[i].hole, ...h.board]);
          for (const i of pot.eligible) assert.ok(compare(score(i), pot.score) <= 0, `${where()} : mauvais gagnant`);
          if (pot.winners.length > 1) stats.splits++;
        }
      }
    } else {
      assert.equal(h.seats.filter((x) => x.dealt && !x.folded).length, 1);
    }
    // Aucune carte en double.
    const cards = [...h.seats.flatMap((x) => x.hole), ...h.board, ...h.deck].map((c) => `${c.r}${c.s}`);
    assert.equal(new Set(cards).size, cards.length);
  }
  // Les cas délicats ont bien été rencontrés.
  assert.ok(stats.showdown > 1000 && stats.sidePots > 100 && stats.splits > 10 && stats.illegal > 1000,
    JSON.stringify(stats));
});
