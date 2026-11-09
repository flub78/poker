// Les questions du niveau 5 (penser en ranges et s'adapter). Chaque fabrique renvoie
// { make, scene, ask, check, title } pour runSerie (js/serie.js).
import { h } from '../js/dom.js';
import { cardRow, pick, shuffle, int, short, SUITS } from '../js/cards.js';
import { choiceAsk, multiAsk, numberAsk } from '../js/serie.js';
import { evaluate, CAT, describe } from '../niveau-1/evaluator.js';
import { dryBoard } from '../niveau-4/questions.js';
import { parseNumber, num } from '../niveau-3/odds.js';

const card = (r, s) => ({ r, s });
const ALL_RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// ---------- C5.1, C5.2 : la range adverse à la river en 3 catégories ----------

const CATS = {
  forte: { label: 'Forte', why: 'deux paires ou mieux' },
  moyenne: { label: 'Moyenne', why: 'une paire' },
  bluff: { label: 'Bluff', why: 'moins qu\'une paire : seule une mise peut gagner le pot' },
};
const catOf = (score) => (score[0] >= CAT.TWO_PAIR ? 'forte' : score[0] === CAT.PAIR ? 'moyenne' : 'bluff');

// Une main de la catégorie voulue, sans carte déjà utilisée.
function handOf(kind, board, used, rand) {
  const ranks = board.map((c) => c.r);
  const free = (r) => shuffle(SUITS, rand).map((s) => card(r, s)).filter((c) => !used.some((u) => u.r === c.r && u.s === c.s));
  for (let tries = 0; tries < 50; tries++) {
    let want;
    if (kind === 'forte') {
      want = rand() < 0.5 ? shuffle(ranks, rand).slice(0, 2) : (() => { const r = pick(ranks, rand); return [r, r]; })();
    } else if (kind === 'moyenne') {
      if (rand() < 0.6) want = [pick(ranks, rand), pick(ALL_RANKS.filter((r) => !ranks.includes(r)), rand)];
      else { const r = pick(ALL_RANKS.filter((x) => !ranks.includes(x) && x < ranks[0]), rand); want = [r, r]; }
    } else {
      want = shuffle(ALL_RANKS.filter((r) => !ranks.includes(r)), rand).slice(0, 2);
    }
    const a = free(want[0])[0];
    const b = a && free(want[1]).find((c) => !(c.r === a.r && c.s === a.s));
    if (!a || !b) continue;
    const hole = [a, b];
    if (catOf(evaluate([...hole, ...board])) === kind) return hole;
  }
  return null;
}

export function rangeQuestion() {
  return {
    make(rand) {
      for (;;) {
        const board = dryBoard(5, rand);
        const kinds = shuffle(['forte', 'moyenne', 'bluff', pick(['forte', 'moyenne', 'bluff'], rand)], rand);
        const used = [...board];
        const hands = [];
        for (const kind of kinds) {
          const hole = handOf(kind, board, used, rand);
          if (!hole) break;
          used.push(...hole);
          hands.push({ kind, hole, score: evaluate([...hole, ...board]) });
        }
        if (hands.length === 4) return { board, hands };
      }
    },
    scene: (q) => h('div', {},
      h('div', { class: 'board' }, h('div', { class: 'board-label' }, 'Tableau (river)'), cardRow(q.board, 'sm')),
      h('p', { class: 'question' }, 'L\'adversaire mise gros à la river. Voici 4 mains de sa range : classez chacune.'),
      h('p', { class: 'meta' }, 'Forte : deux paires ou mieux · Moyenne : une paire · Bluff : moins qu\'une paire.'),
      h('div', { class: 'range-hands' }, q.hands.map((x, i) => h('div', {},
        h('div', { class: 'board-label quiet' }, `Main ${i + 1}`), cardRow(x.hole, 'xs'))))),
    ask: multiAsk((q) => q.hands.map((x, i) => ({
      name: `m${i}`, label: `Main ${i + 1} (${x.hole.map(short).join(' ')})`,
      options: Object.entries(CATS).map(([value, c]) => ({ value, label: c.label })),
    }))),
    check(q, v) {
      const rows = q.hands.map((x, i) => ({ ...x, ok: v[`m${i}`] === x.kind, answer: v[`m${i}`] }));
      return {
        ok: rows.every((r) => r.ok),
        body: h('ul', {}, rows.map((r, i) => h('li', {}, r.ok ? '✓ ' : '✗ ', `Main ${i + 1}, ${r.hole.map(short).join(' ')} : ${describe(r.score).toLowerCase()} → `,
          h('strong', {}, CATS[r.kind].label.toLowerCase()), ` (${CATS[r.kind].why})`, r.ok ? '' : `, pas ${CATS[r.answer].label.toLowerCase()}`, '.'))),
      };
    },
    title: (q) => `${q.board.map(short).join(' ')} : ${q.hands.map((x) => CATS[x.kind].label.toLowerCase()).join(', ')}`,
  };
}

// ---------- C5.4 : profils adverses ----------

// Repères du cours (C5.4) : serré VPIP < 25 %, large VPIP > 35 % ;
// passif AF < 1,5, agressif AF > 2,5. Les statistiques générées restent loin de ces seuils.
export const PROFILES = {
  rock: { label: 'Serré-passif (rock)', exploit: 'Voler ses blinds ; se coucher quand il relance', vpip: [8, 15], pfr: [3, 8], af: [0.4, 1.2] },
  station: { label: 'Large-passif (calling station)', exploit: 'Ne jamais le bluffer ; miser gros pour la valeur', vpip: [40, 60], pfr: [3, 9], af: [0.3, 1.0] },
  tag: { label: 'Serré-agressif (TAG)', exploit: 'Jouer serré contre lui, chercher d\'autres tables', vpip: [16, 23], pfr: [13, 19], af: [2.8, 4.0] },
  maniac: { label: 'Large-agressif (maniaque)', exploit: 'Le laisser bluffer, payer plus large avec des mains moyennes', vpip: [45, 70], pfr: [30, 50], af: [3.5, 6.0] },
};
export const REPERES = 'Repères du cours (C5.4) : serré = VPIP sous 25 %, large = VPIP au-dessus de 35 % ; passif = AF sous 1,5, agressif = AF au-dessus de 2,5.';

export function profileQuestion() {
  return {
    make(rand) {
      const kind = pick(Object.keys(PROFILES), rand);
      const p = PROFILES[kind];
      const vpip = int(p.vpip[0], p.vpip[1], rand);
      const pfr = Math.min(vpip - 1, int(p.pfr[0], p.pfr[1], rand));
      const af = Math.round((p.af[0] + rand() * (p.af[1] - p.af[0])) * 10) / 10;
      return { kind, vpip, pfr, af, hands: pick([300, 500, 800, 1200], rand) };
    },
    scene: (q) => h('div', {},
      h('p', { class: 'question' }, `Statistiques d'un adversaire sur ${q.hands} mains :`),
      h('p', { class: 'stats' }, h('strong', {}, `VPIP ${q.vpip} %`), ' · ', h('strong', {}, `PFR ${q.pfr} %`), ' · ', h('strong', {}, `AF ${num(q.af)}`)),
      h('p', { class: 'meta' }, 'VPIP : part des mains jouées · PFR : part des mains relancées préflop · AF : agressivité après le flop.')),
    ask: multiAsk([
      { name: 'profile', label: 'Profil', options: Object.entries(PROFILES).map(([value, p]) => ({ value, label: p.label })) },
      // ordre différent de celui des profils, pour que la position ne donne pas la réponse
      { name: 'exploit', label: 'Comment l\'exploiter', options: ['station', 'maniac', 'rock', 'tag'].map((value) => ({ value, label: PROFILES[value].exploit })) },
    ]),
    check(q, v) {
      const p = PROFILES[q.kind];
      const okP = v.profile === q.kind;
      const okE = v.exploit === q.kind;
      return {
        ok: okP && okE,
        body: h('div', {},
          h('p', {}, okP ? '✓ ' : '✗ ', h('strong', {}, p.label), ` : VPIP ${q.vpip} % (${q.vpip < 25 ? 'serré' : 'large'}), AF ${num(q.af)} (${q.af < 1.5 ? 'passif' : 'agressif'}).`),
          h('p', {}, okE ? '✓ ' : '✗ ', 'Exploitation : ', h('strong', {}, p.exploit), '.'),
          h('p', { class: 'meta' }, REPERES)),
      };
    },
    title: (q) => `VPIP ${q.vpip}, PFR ${q.pfr}, AF ${num(q.af)} → ${PROFILES[q.kind].label}`,
  };
}

// ---------- C5.5 : bankroll ----------

const LIMITS = [
  { name: 'NL2', bb: 0.02 }, { name: 'NL5', bb: 0.05 }, { name: 'NL10', bb: 0.1 },
  { name: 'NL25', bb: 0.25 }, { name: 'NL50', bb: 0.5 }, { name: 'NL100', bb: 1 },
];
const need = (l) => Math.round(30 * 100 * l.bb * 100) / 100;   // 30 tapis de 100 BB
const euros = (x) => `${num(Math.round(x * 100) / 100)} €`;

export function bankrollQuestion({ mode = 'mix' } = {}) {
  return {
    make(rand) {
      const kind = mode === 'mix' ? pick(['cash', 'tournoi'], rand) : mode;
      if (kind === 'tournoi') {
        const bankroll = int(4, 100, rand) * 50;
        return { kind, bankroll, answer: bankroll / 100 };
      }
      for (;;) {
        const bankroll = int(4, 400, rand) * 10;
        if (LIMITS.some((l) => Math.abs(bankroll - need(l)) / need(l) < 0.08)) continue;   // trop près d'un seuil
        const ok = LIMITS.filter((l) => need(l) <= bankroll);
        return { kind, bankroll, answer: ok.length ? ok[ok.length - 1].name : 'aucune' };
      }
    },
    scene: (q) => h('p', { class: 'question' }, q.kind === 'cash'
      ? `Votre bankroll : ${euros(q.bankroll)}. Quelle est la plus haute limite de cash-game que vous pouvez jouer ?`
      : `Votre bankroll : ${euros(q.bankroll)}. Quel droit d'entrée maximal pour vos tournois ?`),
    ask: (q, submit) => (q.kind === 'cash'
      ? choiceAsk([...LIMITS.map((l) => ({ value: l.name, label: `${l.name} (BB ${euros(l.bb)})` })), { value: 'aucune', label: 'Aucune' }])(q, submit)
      : numberAsk('Droit d\'entrée maximal', { unit: '€', parse: parseNumber })(q, submit)),
    check(q, v) {
      if (q.kind === 'tournoi') {
        return {
          ok: Math.abs(v - q.answer) < 0.01,
          body: h('p', {}, `Au moins 100 droits d'entrée : ${euros(q.bankroll)} ÷ 100 = `, h('strong', {}, euros(q.answer)), '.'),
        };
      }
      return {
        ok: v === q.answer,
        body: h('div', {},
          h('p', {}, 'Au moins 30 tapis de 100 BB : ', h('strong', {}, q.answer === 'aucune' ? 'aucune limite' : q.answer), '.'),
          h('p', { class: 'meta' }, LIMITS.map((l) => `${l.name} : ${euros(need(l))}`).join(' · '))),
      };
    },
    title: (q) => `${euros(q.bankroll)} → ${q.kind === 'cash' ? q.answer : euros(q.answer)}`,
  };
}
