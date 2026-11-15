// Règles du niveau 5 (web/simulateur/regles/niveau5.js) : ajustements par profil (C5.4) et
// avantage de range (C5.3), telles que le cours les donne en tête du niveau 5.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newHand, act } from '../../web/simulateur/moteur/table.js';
import { decider } from '../../web/simulateur/bots.js';
import { rng } from '../../web/js/cards.js';
import { cartes } from '../aide.js';

// Table à 6, bouton au siège 0 : SB 1, BB 2, UTG 3, MP 4, CO 5.
// profils : { siège: 'rock' | 'station' | 'maniaque' | 'tag' }, lus comme ceux de la partie (hand.reads).
function table(holes = {}, board = [], profils = null) {
  const h = Array(6).fill(null);
  for (const [seat, t] of Object.entries(holes)) h[seat] = cartes(t);
  const hand = newHand({ stacks: Array(6).fill(200), button: 0, rand: rng(1), preset: { holes: h, board: cartes(board.join(' ')) } });
  if (profils) hand.reads = { profil: (seat) => profils[seat] ?? null };
  return hand;
}
const F = { type: 'fold' };
const C = { type: 'call' };
const X = { type: 'check' };
const R = (to) => ({ type: 'raise', to });
const play = (h, ...a) => { for (const x of a) act(h, x); return h; };
const texte = (d) => d.raisons.map((x) => x.texte).join(' ');
// Le CO (5) relance à 5, la BB (2) paie : flop, pot 11, la BB parle la première.
const coVsBB = (hole, board, profilBB) => play(table({ 5: hole }, board, profilBB ? { 2: profilBB } : null), F, F, R(5), F, F, C);
const BOARD = ['KH', '7D', '2C', '4S', '9H'];

test('sans profil connu, le niveau 5 joue comme le 4', () => {
  for (const hole of ['KS 9D', 'QS JD', '8S 8C']) {
    const h = play(coVsBB(hole, BOARD), X);
    assert.deepEqual(decider(h, 5, 5).action, decider(h, 5, 4).action, hole);
    const t = play(coVsBB(hole, BOARD, 'tag'), X);
    assert.deepEqual(decider(t, 5, 5).action, decider(t, 5, 4).action, hole);
  }
});

test('serré-passif aux blinds : au CO, on relance la liste du BTN', () => {
  const steal = (profils) => play(table({ 5: 'QS TD' }, [], profils), F, F);      // UTG et MP se couchent
  assert.equal(decider(steal(null), 5, 5).action.type, 'fold');                   // QT dépareillé : pas dans la liste du CO
  const d = decider(steal({ 2: 'rock' }), 5, 5);
  assert.deepEqual(d.action, R(5));
  assert.match(texte(d), /voler les blinds/);
  assert.equal(decider(steal({ 2: 'rock', 0: 'station' }), 5, 5).action.type, 'fold');   // un large derrière : non
  assert.equal(decider(steal({ 2: 'rock' }), 5, 4).action.type, 'fold');                  // le niveau 4 ne le fait pas
});

test('serré-passif : face à sa mise au turn, se coucher sans deux paires', () => {
  const turnBet = (hole) => play(coVsBB(hole, BOARD, 'rock'), X, X, R(6));        // flop parole-parole, mise au turn
  const top = turnBet('KS 9D');
  assert.equal(decider(top, 5, 4).action.type, 'call');                           // niveau 4 : top paire suit
  const d = decider(top, 5, 5);
  assert.equal(d.action.type, 'fold');
  assert.match(texte(d), /serré-passif/);
  assert.equal(decider(turnBet('KS 7S'), 5, 5).action.type, 'raise');             // deux paires : on continue
});

test('large-agressif : ne pas le bluffer, faire parole et payer avec top paire', () => {
  const flop = (hole) => play(coVsBB(hole, BOARD, 'maniaque'), X);
  assert.equal(decider(flop('KS 9D'), 5, 4).action.type, 'raise');               // niveau 4 : c-bet
  assert.equal(decider(flop('KS 9D'), 5, 5).action.type, 'check');               // niveau 5 : parole
  assert.equal(decider(flop('QS JD'), 5, 5).action.type, 'check');               // pas de bluff
  const raised = play(coVsBB('KS 9D', BOARD, 'maniaque'), X, R(4), R(12));        // c-bet, il relance
  assert.equal(decider(raised, 5, 4).action.type, 'fold');                        // niveau 4 : top paire se couche (SPR)
  assert.equal(decider(raised, 5, 5).action.type, 'call');
});

test('large-passif : jamais de bluff, valeur dès la top paire à 3/4 du pot', () => {
  const flop = (hole) => play(coVsBB(hole, BOARD, 'station'), X);
  const d = decider(flop('KS 9D'), 5, 5);
  assert.deepEqual(d.action, R(8));                                               // 3/4 de 11
  assert.match(texte(d), /3\/4 du pot/);
  assert.equal(decider(flop('QS JD'), 5, 4).action.type, 'raise');                // niveau 4 : c-bet de bluff
  assert.equal(decider(flop('QS JD'), 5, 5).action.type, 'check');
});

test('avantage de range (C5.3) : flop à deux cartes hautes, c-bet de 1/3 avec toutes les mains', () => {
  const board = ['KH', 'QD', 'JC', '4S', '2H'];                                   // coordonné : le niveau 4 checke sans rien
  const h = play(coVsBB('5S 4D', board), X);
  assert.equal(decider(h, 5, 4).action.type, 'check');
  const d = decider(h, 5, 5);
  assert.deepEqual(d.action, R(4));
  assert.equal(d.raisons[0].code, 'C5.3');
  assert.equal(decider(play(coVsBB('5S 4D', board, 'station'), X), 5, 5).action.type, 'check');   // pas contre une station
});

// ---------- range adverse à la river (C5.1, regles/range.js) ----------
import { chen, topRange, hasDraw, riverRange } from '../../web/simulateur/regles/range.js';
import { judge } from '../../web/simulateur/mentor.js';
import { legalActions } from '../../web/simulateur/moteur/table.js';

// Lecture fictive : un profil et ses statistiques, après 100 mains.
const STATS = { rock: { vpip: 9, pfr: 2, af: 0.6 }, station: { vpip: 42, pfr: 2, af: 0.2 }, maniaque: { vpip: 44, pfr: 40, af: 20 }, tag: { vpip: 14, pfr: 12, af: 3 } };
const reading = (seat, p) => ({ profil: (x) => (x === seat ? p : null), stats: (x) => ({ hands: x === seat ? 100 : 0, vpip: 0, pfr: 0, af: null, ...(x === seat ? STATS[p] : {}) }) });
// Le CO (5) relance, la BB (2) paie ; parole à chaque tour jusqu'à la river, où la BB mise `bet`.
function riverBet(hole, profil, bet = 6, board = ['KH', '7D', '2C', '4S', '9H']) {
  const h = table({ 5: hole }, board);
  if (profil) h.reads = reading(2, profil);
  return play(h, F, F, R(5), F, F, C, X, X, X, X, R(bet));
}

test('mains de départ rangées par la formule de Chen ; range des meilleures mains', () => {
  assert.equal(chen('AA'), 20);
  assert.equal(chen('AKs'), 12);
  assert.equal(chen('22'), 5);
  assert.ok(chen('72o') < chen('T9s'));
  const top = topRange(5);
  assert.ok(top.has('AA') && top.has('KK') && top.has('AKs') && !top.has('72o') && !top.has('T9s'));
});

test('tirage couleur ou quinte, rapide', () => {
  assert.ok(hasDraw(cartes('AH 8H'), cartes('KH 7H 2C')));
  assert.ok(hasDraw(cartes('9S 8D'), cartes('7H 6C 2D')));
  assert.ok(!hasDraw(cartes('QS JD'), cartes('KH 7D 2C')));
  assert.ok(!hasDraw(cartes('AS KD'), cartes('7H 7C 7S')));
});

test('range estimée selon le profil : le rock ne bluffe pas, le maniaque si', () => {
  const rock = riverRange(riverBet('8S 8C', 'rock'), 5, 2);
  const station = riverRange(riverBet('8S 8C', 'station'), 5, 2);
  const maniaque = riverRange(riverBet('8S 8C', 'maniaque'), 5, 2);
  const inconnu = riverRange(riverBet('8S 8C', null), 5, 2);
  assert.equal(rock.bluff, 0);
  assert.ok(maniaque.bluff > 30, `maniaque ${maniaque.bluff}`);
  assert.ok(station.bluff < maniaque.bluff / 2, `station ${station.bluff}`);   // il bluffe peu, mais ses mains fortes sont rares
  for (const rg of [rock, station, maniaque, inconnu]) {
    assert.ok(Math.abs(rg.forte + rg.moyenne + rg.bluff - 100) < 1e-9);
    assert.ok(rg.battues >= rg.bluff - 1e-9);                 // une paire bat au moins les bluffs
  }
  assert.equal(inconnu.profil, null);
});

test('à la river, une paire face à une mise : payer si elle bat assez de la range', () => {
  const vsManiac = riverBet('8S 8C', 'maniaque');
  const d = decider(vsManiac, 5, 5);
  assert.equal(d.action.type, 'call');
  assert.equal(d.raisons[0].code, 'C5.1');
  assert.match(texte(d), /forte .* moyenne .* bluff/);
  assert.equal(decider(riverBet('8S 8C', 'station'), 5, 5).action.type, 'fold');
  // Sans profil : la décision suit l'estimation, quelle qu'elle soit.
  const u = decider(riverBet('8S 8C', null, 10), 5, 5);
  assert.equal(u.action.type, u.facts.beaten > u.facts.needed ? 'call' : 'fold');
  // Le maniaque passe avant : top paire paie toujours.
  assert.equal(decider(riverBet('KS 3D', 'maniaque', 20), 5, 5).facts.ajustement, 'maniaque');
});

test('mentor : se coucher à la river quand la range est pleine de bluffs est une erreur', () => {
  const h = riverBet('8S 8C', 'maniaque');
  const advice = decider(h, 5, 5);
  const j = judge(h, F, advice, legalActions(h));
  assert.equal(j.verdict, 'erreur');
  assert.equal(j.why[0].code, 'C5.1');
  assert.match(j.why[0].texte, /payer est rentable/);
});
