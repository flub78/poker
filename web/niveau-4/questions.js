// Les questions du niveau 4 (jouer après le flop). Chaque fabrique renvoie
// { make, scene, ask, check, title } pour runSerie (js/serie.js).
//
// Les situations sont construites pour un cas précis du cours, puis vérifiées avec l'évaluateur du
// niveau 1. Les tableaux sont « secs » (jamais appariés, jamais trois cartes d'une couleur, jamais
// trois rangs dans une fenêtre de cinq) : pas de quinte ni de couleur possible qui changerait la réponse.
import { h } from '../js/dom.js';
import { cardRow, pick, shuffle, int, SUITS, short } from '../js/cards.js';
import { choiceAsk, multiAsk, tableView } from '../js/serie.js';
import { evaluate, CAT, describe } from '../niveau-1/evaluator.js';
import { makeDraw, countOuts } from '../niveau-3/draws.js';
import { parseNumber, num } from '../niveau-3/odds.js';

const card = (r, s) => ({ r, s });
const STREETS = { 3: 'flop', 4: 'turn', 5: 'river' };
const STREET_NAME = { flop: 'au flop', turn: 'au turn', river: 'à la river' };
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// Trois rangs dans une fenêtre de cinq (l'As compte aussi pour 1) : une quinte devient possible.
function connected(ranks) {
  const all = [...ranks, ...ranks.filter((r) => r === 14).map(() => 1)];
  for (let low = 1; low <= 10; low++) {
    if (new Set(all.filter((r) => r >= low && r <= low + 4)).size >= 3) return true;
  }
  return false;
}

// Tableau sec de n cartes : rangs distincts, entre minRank et maxRank, au plus 2 cartes par couleur.
export function dryBoard(n, rand, { minRank = 2, maxRank = 14 } = {}) {
  for (;;) {
    const ranks = shuffle([...Array(maxRank - minRank + 1).keys()].map((x) => x + minRank), rand).slice(0, n);
    if (ranks.length < n || connected(ranks)) continue;
    const suits = shuffle([...SUITS, ...SUITS], rand).slice(0, n);
    return ranks.sort((a, b) => b - a).map((r, i) => card(r, suits[i]));
  }
}

// Une carte d'un rang donné, d'une couleur pas encore utilisée pour ce rang.
function cardOf(r, rand, used) {
  const free = shuffle(SUITS, rand).filter((s) => !used.some((c) => c.r === r && c.s === s));
  return free.length ? card(r, free[0]) : null;
}

// ---------- C4.1, C4.6 : valeur, bluff ou aucune raison ----------

const REASONS = [
  { value: 'valeur', label: 'Valeur' },
  { value: 'bluff', label: 'Bluff ou semi-bluff' },
  { value: 'aucune', label: 'Aucune raison : parole' },
];

function valueHand(board, rand) {
  const ranks = board.map((c) => c.r);
  const top = ranks[0];
  const kind = pick(['overpair', 'toppair', 'twopair', 'set'], rand);
  if (kind === 'overpair') {
    if (top >= 14) return null;
    const r = int(top + 1, 14, rand);
    return { kind, hole: [cardOf(r, rand, board), cardOf(r, rand, [...board, card(r, 'x')])] };
  }
  if (kind === 'toppair') {
    const kickers = [14, 13, 12].filter((k) => k !== top && !ranks.includes(k));
    if (!kickers.length) return null;
    return { kind, hole: [cardOf(top, rand, board), cardOf(pick(kickers, rand), rand, board)] };
  }
  if (kind === 'twopair') return { kind, hole: [cardOf(top, rand, board), cardOf(pick(ranks.slice(1), rand), rand, board)] };
  const r = pick(ranks, rand);
  const a = cardOf(r, rand, board);
  return { kind, hole: [a, cardOf(r, rand, [...board, a])] };
}

function mediumHand(board, rand) {
  const ranks = board.map((c) => c.r);
  if (rand() < 0.5) {
    // deuxième ou troisième paire, petit kicker
    const r = pick(ranks.slice(1), rand);
    const kick = shuffle([2, 3, 4, 5, 6, 7, 8, 9].filter((k) => !ranks.includes(k) && k < ranks[0] && k !== r), rand)[0];
    if (!kick) return null;
    return { kind: 'secondpair', hole: [cardOf(r, rand, board), cardOf(kick, rand, board)] };
  }
  // petite paire servie, sous la carte haute du tableau
  const options = [2, 3, 4, 5, 6, 7, 8, 9, 10].filter((r) => r < ranks[0] && !ranks.includes(r) && r > ranks[ranks.length - 1]);
  if (!options.length) return null;
  const r = pick(options, rand);
  const a = cardOf(r, rand, board);
  return { kind: 'underpair', hole: [a, cardOf(r, rand, [...board, a])] };
}

function airHand(board, rand) {
  const ranks = board.map((c) => c.r);
  const low = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((r) => !ranks.includes(r) && r < ranks[0]), rand).slice(0, 2);
  if (low.length < 2) return null;
  return { kind: 'air', hole: low.map((r) => cardOf(r, rand, board)) };
}

export function makeBetSituation(rand) {
  for (;;) {
    const kind = pick(['valeur', 'valeur', 'bluff', 'aucune', 'aucune'], rand);
    const street = pick(['flop', 'turn', 'river'], rand);
    let hole;
    let board;
    let sub;
    let outs = 0;
    if (kind === 'bluff' && street !== 'river') {
      const d = makeDraw(rand, { types: ['flush', 'oesd', 'combo'], street });
      ({ hole, board } = d);
      if (connected(board.map((c) => c.r))) continue;   // tableau déjà très lié : situation trouble
      sub = d.name;
      outs = d.outs.length;
    } else {
      board = dryBoard(street === 'flop' ? 3 : street === 'turn' ? 4 : 5, rand, { maxRank: kind === 'valeur' ? 14 : 13 });
      const made = kind === 'valeur' ? valueHand(board, rand) : kind === 'aucune' ? mediumHand(board, rand) : airHand(board, rand);
      if (!made || made.hole.some((c) => !c)) continue;
      hole = made.hole;
      sub = made.kind;
    }
    const score = evaluate([...hole, ...board]);
    if (kind === 'valeur' && score[0] < CAT.PAIR) continue;
    if (kind === 'aucune' && score[0] !== CAT.PAIR) continue;
    if (kind === 'bluff' && score[0] !== CAT.HIGH) continue;
    // une main moyenne ou faite sans tirage : sinon le semi-bluff deviendrait une bonne réponse aussi
    if (kind !== 'bluff' && street !== 'river' && countOuts('flush', hole, board).length) continue;
    if (kind === 'bluff' && street === 'river' && hole.some((c) => c.r === 14)) continue;
    return { kind, sub, street, hole, board, score, outs };
  }
}

function reasonWhy(q) {
  const hand = lc(describe(q.score));
  if (q.kind === 'valeur') {
    return `${describe(q.score)} : vous êtes probablement devant, et des mains moins bonnes (paires inférieures, tirages) peuvent payer. Mise de valeur.`;
  }
  if (q.kind === 'bluff' && q.street !== 'river') {
    return `${q.sub}, sans paire : vous êtes derrière, mais des mains meilleures peuvent se coucher, et vous avez ${q.outs} outs si l'on vous paie. Semi-bluff.`;
  }
  if (q.kind === 'bluff') {
    return `À la river, ${hand} ne gagne presque jamais à l'abattage : seule une mise peut faire coucher les mains meilleures. Bluff (C4.6).`;
  }
  return `Main moyenne (${hand}) : une mise ne fait coucher que des mains plus faibles et ne fait payer que des plus fortes. C'est le piège des mains moyennes : parole (et payez une petite mise).`;
}

export function betReasonQuestion() {
  return {
    make: (rand) => makeBetSituation(rand),
    scene: (q) => h('div', {}, tableView(q.hole, q.board, q.street === 'river' ? 'river' : q.street),
      h('p', { class: 'question' }, `Vous êtes seul contre un adversaire, ${STREET_NAME[q.street]}. Vous pensez miser : pour quelle raison ?`)),
    ask: choiceAsk(REASONS),
    check: (q, v) => ({ ok: v === q.kind, body: h('p', {}, h('strong', {}, `${REASONS.find((r) => r.value === q.kind).label}. `), reasonWhy(q)) }),
    title: (q) => `${q.hole.map(short).join(' ')} sur ${q.board.map(short).join(' ')} → ${REASONS.find((r) => r.value === q.kind).label.toLowerCase()}`,
  };
}

// ---------- C4.2 à C4.4 : texture du flop et taille de c-bet ----------

const TEXTURES = {
  sec: { label: 'Sec', size: 'petite', why: 'peu de tirages, le relanceur préflop est favorisé : petite c-bet, souvent.' },
  humide: { label: 'Humide', size: 'grosse', why: 'beaucoup de tirages : c-bet plus rare et plus grosse, pour faire payer les tirages.' },
  apparie: { label: 'Apparié', size: 'petite', why: 'peu de mains l\'ont touché, l\'adversaire l\'a souvent raté : une petite mise suffit.' },
  monotone: { label: 'Monotone', size: 'petite', why: 'prudence : une couleur est peut-être faite ; petite mise, ou parole sans carte de la couleur.' },
};
const SIZES = { petite: 'Petite (1/3 de pot)', grosse: 'Grosse (2/3 de pot)' };

export function makeFlop(rand, texture) {
  for (;;) {
    if (texture === 'sec') {
      const top = pick([13, 14], rand);
      const [a, b] = shuffle([...Array(top - 2).keys()].map((x) => x + 2), rand).slice(0, 2);
      const ranks = [top, a, b];
      const all = [...ranks, ...(top === 14 ? [1] : [])];
      if (all.some((x, i) => all.some((y, j) => i !== j && x !== y && Math.abs(x - y) < 4))) continue;
      const suits = shuffle(SUITS, rand);
      return ranks.sort((x, y) => y - x).map((r, i) => card(r, suits[i]));
    }
    if (texture === 'humide') {
      const low = int(4, 8, rand);
      const ranks = shuffle([0, 1, 2, 3, 4].map((x) => low + x), rand).slice(0, 3);
      if (Math.max(...ranks) - Math.min(...ranks) > 4 || Math.max(...ranks) > 11) continue;
      const [s, t] = shuffle(SUITS, rand);
      const suits = shuffle([s, s, t], rand);
      return ranks.sort((x, y) => y - x).map((r, i) => card(r, suits[i]));
    }
    if (texture === 'apparie') {
      const [p, x] = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], rand).slice(0, 2);
      const suits = shuffle(SUITS, rand);
      return [card(p, suits[0]), card(p, suits[1]), card(x, suits[2])];
    }
    const ranks = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], rand).slice(0, 3);
    if (Math.max(...ranks) - Math.min(...ranks) < 5) continue;
    const s = pick(SUITS, rand);
    return ranks.sort((x, y) => y - x).map((r) => card(r, s));
  }
}

export function textureQuestion({ withSize = true } = {}) {
  return {
    make(rand) {
      const texture = pick(Object.keys(TEXTURES), rand);
      return { texture, flop: makeFlop(rand, texture) };
    },
    scene: (q) => h('div', {},
      h('div', { class: 'board' }, h('div', { class: 'board-label' }, 'Flop'), cardRow(q.flop, 'sm')),
      h('p', { class: 'question' }, withSize
        ? 'Vous avez relancé préflop, un adversaire a payé. Texture de ce flop, et taille de votre c-bet ?'
        : 'Texture de ce flop ?')),
    ask: multiAsk([
      { name: 'texture', label: 'Texture', options: Object.entries(TEXTURES).map(([value, t]) => ({ value, label: t.label })) },
      ...(withSize ? [{ name: 'size', label: 'C-bet', options: Object.entries(SIZES).map(([value, label]) => ({ value, label })) }] : []),
    ]),
    check(q, v) {
      const t = TEXTURES[q.texture];
      const okTexture = v.texture === q.texture;
      const okSize = !withSize || v.size === t.size;
      return {
        ok: okTexture && okSize,
        body: h('div', {},
          h('p', {}, okTexture ? '✓ ' : '✗ ', h('strong', {}, `${t.label}`), okTexture ? '' : ` (votre réponse : ${TEXTURES[v.texture].label.toLowerCase()})`, ` : ${t.why}`),
          withSize ? h('p', {}, okSize ? '✓ ' : '✗ ', `C-bet : `, h('strong', {}, SIZES[t.size].toLowerCase()), '.') : null),
      };
    },
    title: (q) => `${q.flop.map(short).join(' ')} → ${TEXTURES[q.texture].label.toLowerCase()}${withSize ? `, c-bet ${TEXTURES[q.texture].size}` : ''}`,
  };
}

// ---------- C4.5 : SPR et engagement du tapis ----------

const HANDS = {
  moyenne: { label: 'une paire moyenne', rank: 0 },
  toppaire: { label: 'top paire, bon kicker', rank: 1 },
  deuxpaires: { label: 'deux paires', rank: 2 },
  brelan: { label: 'un brelan', rank: 3 },
};
// Engager tout son tapis ? SPR < 3 : top paire ou mieux. 3 à 8 : deux paires ou mieux. > 8 : très grosse main (brelan ou mieux).
const commit = (spr, hand) => HANDS[hand].rank >= (spr < 3 ? 1 : spr <= 8 ? 2 : 3);

export function sprQuestion() {
  return {
    make(rand) {
      for (;;) {
        const pot = pick([6, 8, 10, 12, 15, 20, 25, 30, 40], rand);
        const mine = int(20, 250, rand);
        const his = int(20, 250, rand);
        const spr = Math.min(mine, his) / pot;
        if (Math.abs(spr - 3) < 0.4 || Math.abs(spr - 8) < 0.6 || spr > 20) continue;
        const hand = pick(Object.keys(HANDS), rand);
        return { pot, mine, his, spr, hand, commit: commit(spr, hand) };
      }
    },
    scene: (q) => h('p', { class: 'question' },
      `Pot au flop : ${q.pot} BB. Votre tapis : ${q.mine} BB ; celui de l'adversaire : ${q.his} BB. Vous avez ${HANDS[q.hand].label}.`),
    ask: multiAsk([
      { name: 'spr', label: 'SPR', type: 'number', parse: parseNumber },
      { name: 'commit', label: 'Prêt à mettre tout le tapis ?', options: [{ value: true, label: 'Oui' }, { value: false, label: 'Non' }] },
    ]),
    check(q, v) {
      const eff = Math.min(q.mine, q.his);
      const okSpr = Math.abs(v.spr - q.spr) <= Math.max(0.3, q.spr * 0.1);
      const okCommit = v.commit === q.commit;
      const zone = q.spr < 3 ? 'SPR inférieur à 3 : top paire ou mieux suffit pour le tapis'
        : q.spr <= 8 ? 'SPR entre 3 et 8 : deux paires ou mieux pour le tapis, top paire reste une valeur prudente'
          : 'SPR supérieur à 8 : il faut une très grosse main (brelan ou mieux) pour engager le tapis';
      return {
        ok: okSpr && okCommit,
        body: h('div', {},
          h('p', {}, okSpr ? '✓ ' : '✗ ', `Tapis effectif : le plus petit, ${eff} BB. SPR = ${eff} ÷ ${q.pot} = `, h('strong', {}, num(Math.round(q.spr * 10) / 10)), '.'),
          h('p', {}, okCommit ? '✓ ' : '✗ ', `${zone}. Avec ${HANDS[q.hand].label} : `, h('strong', {}, q.commit ? 'oui' : 'non'), '.')),
      };
    },
    title: (q) => `SPR ${num(Math.round(q.spr * 10) / 10)}, ${HANDS[q.hand].label} → ${q.commit ? 'tapis' : 'pas de tapis'}`,
  };
}
