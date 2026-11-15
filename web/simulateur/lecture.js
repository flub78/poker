// Lecture des adversaires (C5.4) : VPIP, PFR, AF de chaque joueur, et son profil une fois assez
// de mains observées. Sert à l'évaluation de fin de partie (evaluation.js) et, pendant la partie,
// aux bots du niveau 5 (game.reads, posé sur chaque main : hand.reads).
//
// Comptes, par main où le joueur a reçu des cartes :
//   VPIP : il a suivi ou relancé avant le flop (les blinds forcées ne comptent pas) ;
//   PFR  : il a relancé avant le flop ;
//   AF   : mises et relances ÷ calls, après le flop.

// C5.4 : « on ajuste dès qu'un adversaire a un profil, après 30 mains environ ».
export const MIN_HANDS = 30;

const empty = () => ({ dealt: 0, vpip: 0, pfr: 0, aggr: 0, calls: 0 });

function count(acc, hand, seat) {
  if (!hand.seats[seat]?.dealt) return;
  acc.dealt++;
  const mine = hand.history.filter((e) => e.seat === seat);
  const pre = mine.filter((e) => e.street === 'preflop');
  if (pre.some((e) => e.type === 'call' || e.type === 'raise')) acc.vpip++;
  if (pre.some((e) => e.type === 'raise')) acc.pfr++;
  for (const e of mine) {
    if (e.street === 'preflop') continue;
    if (e.type === 'raise') acc.aggr++;
    if (e.type === 'call') acc.calls++;
  }
}

// { hands, vpip, pfr, af } : pourcentages ; af = null sans aucun call ni mise après le flop,
// Infinity sans call.
function statsOf(acc) {
  const pct = (n) => (acc.dealt ? (100 * n) / acc.dealt : 0);
  const af = acc.calls ? acc.aggr / acc.calls : acc.aggr ? Infinity : null;
  return { hands: acc.dealt, vpip: pct(acc.vpip), pfr: pct(acc.pfr), af };
}

// Statistiques d'un joueur sur une liste de mains terminées.
export function playerStats(hands, seat) {
  const acc = empty();
  for (const hand of hands) count(acc, hand, seat);
  return statsOf(acc);
}

// Repères de C5.4 : serré VPIP < 25 %, large > 35 % ; passif AF < 1,5, agressif > 2,5.
function axes({ vpip, af }) {
  const width = vpip < 25 ? 'serré' : vpip > 35 ? 'large' : null;
  const style = af === null ? null : af < 1.5 ? 'passif' : af > 2.5 ? 'agressif' : null;
  return { width, style };
}

// Profil en texte, pour l'évaluation : « serré-agressif », « large, agressivité moyenne »…
export function profile(stats) {
  const { width, style } = axes(stats);
  if (width && style) return `${width}-${style}`;
  if (width) return `${width}, agressivité moyenne`;
  if (style) return `${style}, nombre de mains moyen`;
  return 'entre les profils';
}

// Profil exploitable, pour les règles du niveau 5 : 'rock' (serré-passif), 'station'
// (large-passif), 'maniaque' (large-agressif), 'tag' (serré-agressif) ; null tant que le joueur
// n'a pas MIN_HANDS mains, ou s'il est entre deux profils (« profil inconnu »).
const KEYS = { 'serré-passif': 'rock', 'large-passif': 'station', 'large-agressif': 'maniaque', 'serré-agressif': 'tag' };
export function profileKey(stats) {
  if (stats.hands < MIN_HANDS) return null;
  const { width, style } = axes(stats);
  return width && style ? KEYS[`${width}-${style}`] : null;
}

// Lecture tenue au fil de la partie : add(main terminée), puis stats(siège) et profil(siège).
export function createReads(seats = 6) {
  const acc = Array.from({ length: seats }, empty);
  return {
    add(hand) { acc.forEach((a, seat) => count(a, hand, seat)); },
    stats: (seat) => statsOf(acc[seat]),
    profil: (seat) => profileKey(statsOf(acc[seat])),
  };
}
