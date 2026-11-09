// Évaluateur de mains de poker (5 à 7 cartes).
// evaluate(cartes) renvoie un score : un tableau [catégorie, départages...]
// que compare() ordonne. Plus le score est grand, meilleure est la main.

export const CAT = {
  HIGH: 0, PAIR: 1, TWO_PAIR: 2, TRIPS: 3, STRAIGHT: 4,
  FLUSH: 5, FULL: 6, QUADS: 7, STRAIGHT_FLUSH: 8,
};

// Les 10 combinaisons telles qu'enseignées au niveau 1 (la royale à part).
export const CLASSES = [
  { id: 'royal', name: 'Quinte flush royale' },
  { id: 'sf', name: 'Quinte flush' },
  { id: 'quads', name: 'Carré' },
  { id: 'full', name: 'Full' },
  { id: 'flush', name: 'Couleur' },
  { id: 'straight', name: 'Quinte' },
  { id: 'trips', name: 'Brelan' },
  { id: 'twopair', name: 'Double paire' },
  { id: 'pair', name: 'Paire' },
  { id: 'high', name: 'Carte haute' },
];

const CAT_TO_CLASS = {
  [CAT.QUADS]: 'quads', [CAT.FULL]: 'full', [CAT.FLUSH]: 'flush', [CAT.STRAIGHT]: 'straight',
  [CAT.TRIPS]: 'trips', [CAT.TWO_PAIR]: 'twopair', [CAT.PAIR]: 'pair', [CAT.HIGH]: 'high',
};

export function classOf(score) {
  if (score[0] === CAT.STRAIGHT_FLUSH) return score[1] === 14 ? 'royal' : 'sf';
  return CAT_TO_CLASS[score[0]];
}

export function className(id) {
  return CLASSES.find((c) => c.id === id).name;
}

export function compare(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? -1) - (b[i] ?? -1);
    if (d !== 0) return d;
  }
  return 0;
}

export const scoreKey = (score) => score.join(',');

// Plus haute carte d'une quinte dans une liste de rangs distincts triés décroissants, 0 sinon.
function straightHigh(ranks) {
  const set = new Set(ranks);
  if (set.has(14)) set.add(1);                    // l'As compte aussi pour 1 (quinte A-2-3-4-5)
  for (let high = 14; high >= 5; high--) {
    let ok = true;
    for (let k = 0; k < 5; k++) if (!set.has(high - k)) { ok = false; break; }
    if (ok) return high;
  }
  return 0;
}

export function evaluate(cards) {
  const counts = new Map();
  const bySuit = { S: [], H: [], D: [], C: [] };
  for (const c of cards) {
    counts.set(c.r, (counts.get(c.r) || 0) + 1);
    bySuit[c.s].push(c.r);
  }
  const distinct = [...counts.keys()].sort((a, b) => b - a);

  const flushSuit = Object.keys(bySuit).find((s) => bySuit[s].length >= 5);
  if (flushSuit) {
    const fr = bySuit[flushSuit].sort((a, b) => b - a);
    const sf = straightHigh(fr);
    if (sf) return [CAT.STRAIGHT_FLUSH, sf];
  }

  // groupes triés par nombre de cartes puis par rang
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const kickers = (exclude, n) => distinct.filter((r) => !exclude.includes(r)).slice(0, n);

  if (groups[0][1] === 4) {
    return [CAT.QUADS, groups[0][0], ...kickers([groups[0][0]], 1)];
  }
  if (groups[0][1] === 3) {
    const pairRank = groups.slice(1).filter((g) => g[1] >= 2).map((g) => g[0]).sort((a, b) => b - a)[0];
    if (pairRank) return [CAT.FULL, groups[0][0], pairRank];
  }
  if (flushSuit) {
    return [CAT.FLUSH, ...bySuit[flushSuit].slice(0, 5)];
  }
  const st = straightHigh(distinct);
  if (st) return [CAT.STRAIGHT, st];
  if (groups[0][1] === 3) {
    return [CAT.TRIPS, groups[0][0], ...kickers([groups[0][0]], 2)];
  }
  if (groups[0][1] === 2 && groups[1] && groups[1][1] === 2) {
    const pairs = groups.filter((g) => g[1] === 2).map((g) => g[0]).sort((a, b) => b - a);
    const [p1, p2] = pairs;
    return [CAT.TWO_PAIR, p1, p2, ...kickers([p1, p2], 1)];
  }
  if (groups[0][1] === 2) {
    return [CAT.PAIR, groups[0][0], ...kickers([groups[0][0]], 3)];
  }
  return [CAT.HIGH, ...distinct.slice(0, 5)];
}

// ---------- description en français ----------

const PLURAL = { 11: 'valets', 12: 'dames', 13: 'rois', 14: 'As' };
const SINGULAR = { 11: 'valet', 12: 'dame', 13: 'roi', 14: 'As' };
const pl = (r) => PLURAL[r] || String(r);
const sg = (r) => SINGULAR[r] || String(r);
const de = (word) => (/^[AEIOUYaeiouy]/.test(word) ? `d'${word}` : `de ${word}`);

export function describe(score) {
  const [cat, a, b] = score;
  switch (cat) {
    case CAT.STRAIGHT_FLUSH: return a === 14 ? 'Quinte flush royale' : `Quinte flush hauteur ${sg(a)}`;
    case CAT.QUADS: return `Carré ${de(pl(a))}`;
    case CAT.FULL: return `Full aux ${pl(a)} par les ${pl(b)}`;
    case CAT.FLUSH: return `Couleur hauteur ${sg(a)}`;
    case CAT.STRAIGHT: return `Quinte hauteur ${sg(a)}`;
    case CAT.TRIPS: return `Brelan ${de(pl(a))}`;
    case CAT.TWO_PAIR: return `Double paire ${pl(a)} et ${pl(b)}`;
    case CAT.PAIR: return `Paire ${de(pl(a))}`;
    default: return `Hauteur ${sg(a)}`;
  }
}
