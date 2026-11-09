// Les questions du niveau 3, communes aux tests et aux exercices. Chaque fabrique renvoie
// { make, scene?, ask, check, title } pour runSerie (serie.js).
import { h } from '../js/dom.js';
import { cardRow, pick, shuffle, deck, int } from '../js/cards.js';
import { makeDraw, WHY } from './draws.js';
import { ruleOf24, exactHit, required, evCall, pct, num, parseNumber, TABLE } from './odds.js';
import { numberAsk, choiceAsk, tableView } from '../js/serie.js';

const parseInt10 = (t) => { const v = parseNumber(t); return v === null || !Number.isInteger(v) ? null : v; };
const streetLabel = (st) => (st === 'turn' ? 'turn' : 'flop');

// ---------- C3.1 : compter ses outs ----------

export function outsQuestion({ street = 'mix' } = {}) {
  return {
    make: (rand) => makeDraw(rand, { street }),
    scene: (d) => h('div', {}, tableView(d.hole, d.board, d.street),
      h('p', { class: 'question' }, `Combien d'outs pour ${d.target} ?`)),
    ask: numberAsk('Nombre d\'outs', { parse: parseInt10 }),
    check: (d, v) => ({
      ok: v === d.outs.length,
      body: h('div', {},
        h('p', {}, `${d.name} : `, h('strong', {}, `${d.outs.length} outs`), v === d.outs.length ? '.' : ` (votre réponse : ${v}). `, WHY[d.type]),
        h('p', { class: 'meta' }, `Règle du ${d.street === 'turn' ? '2' : '4'} : environ ${ruleOf24(d.outs.length, d.street)} % de toucher ${d.street === 'turn' ? 'à la river' : 'd\'ici la river'}.`),
        cardRow(d.outs, 'xs')),
    }),
    title: (d) => `${d.name}, au ${streetLabel(d.street)}`,
  };
}

// ---------- C3.3 : équité requise ----------

// table : les 6 repères du cours, chacun une fois, dans le désordre. libre : mises quelconques.
export function requiredQuestion({ mode = 'table' } = {}) {
  let order = [];
  return {
    make(rand, i) {
      if (mode === 'table') {
        if (i === 0) order = shuffle(TABLE, rand);
        const row = order[i % order.length];
        return { label: row.label, pot: 100, bet: 100 * row.bet, need: row.need, tol: 1 };
      }
      const pot = pick([40, 60, 80, 100, 120, 150, 180, 200, 240, 300], rand);
      const bet = Math.max(10, Math.round((pot * pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 1, 1.25, 1.5], rand)) / 10) * 10);
      return { label: null, pot, bet, need: required(pot, bet), tol: 2 };
    },
    scene: (q) => h('p', { class: 'question' }, q.label
      ? `L'adversaire mise ${q.label.toLowerCase()}. Quelle équité vous faut-il pour suivre ?`
      : `Pot : ${q.pot}. L'adversaire mise ${q.bet}. Quelle équité vous faut-il pour suivre ?`),
    ask: numberAsk('Équité requise', { unit: '%', parse: parseNumber }),
    check(q, v) {
      const exact = required(q.pot, q.bet);
      const bet = Math.round(q.bet * 10) / 10;
      return {
        ok: Math.abs(v - q.need) <= q.tol,
        body: h('p', {},
          q.label ? `Avec un pot de 100 et une mise de ${num(bet)} : ` : '',
          `vous payez ${num(bet)} pour un pot final de ${num(Math.round((q.pot + 2 * q.bet) * 10) / 10)}, soit ${pct(exact, 1)}. `,
          h('strong', {}, q.label ? `Repère du cours : ${q.need} %.` : `Réponse attendue : ${pct(exact)} (à ${q.tol} points près).`)),
      };
    },
    title: (q) => (q.label ? `Mise de ${q.label.toLowerCase()} → ${q.need} %` : `Pot ${q.pot}, mise ${q.bet} → ${pct(q.need)}`),
  };
}

// ---------- C3.2 + C3.3 : call ou fold ----------

// Au flop, l'adversaire est à tapis : on voit turn et river (règle du 4). Au turn : règle du 2.
// La décision est nette : la règle du 2 et du 4 et la valeur exacte sont du même côté, à 4 points au moins.
export function callFoldQuestion({ street = 'mix' } = {}) {
  return {
    make(rand) {
      for (;;) {
        const d = makeDraw(rand, { street });
        const pot = pick([60, 80, 100, 120, 150, 200, 240, 300], rand);
        const bet = Math.round((pot * pick([0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.5, 2], rand)) / 5) * 5;
        const approx = ruleOf24(d.outs.length, d.street);
        const exact = exactHit(d.outs.length, d.street);
        const need = required(pot, bet);
        if ((approx > need) !== (exact > need) || Math.min(Math.abs(approx - need), Math.abs(exact - need)) < 4) continue;
        return { d, pot, bet, approx, exact, need, action: approx > need ? 'call' : 'fold' };
      }
    },
    scene: (q) => h('div', {}, tableView(q.d.hole, q.d.board, q.d.street),
      h('p', { class: 'question' }, q.d.street === 'turn'
        ? `Pot : ${q.pot}. L'adversaire mise ${q.bet}. Il reste la river ; il ne paiera rien de plus si vous touchez.`
        : `Pot : ${q.pot}. L'adversaire part à tapis : ${q.bet} à payer. Vous verrez le turn et la river.`),
      h('p', { class: 'meta' }, 'Il a une paire : si vous touchez votre tirage, vous gagnez ; sinon, vous perdez.')),
    ask: choiceAsk([{ value: 'call', label: 'Suivre (call)' }, { value: 'fold', label: 'Se coucher (fold)' }]),
    check: (q, v) => ({
      ok: v === q.action,
      body: h('div', {},
        h('p', {}, `${q.d.name} : ${q.d.outs.length} outs → environ ${q.approx} % (règle du ${q.d.street === 'turn' ? '2' : '4'} ; exactement ${pct(q.exact, 1)}).`),
        h('p', {}, `Équité requise : ${q.bet} ÷ ${q.pot + 2 * q.bet} = ${pct(q.need, 1)}. `,
          h('strong', {}, q.action === 'call' ? 'Vous avez assez d\'équité : suivre est rentable.' : 'Pas assez d\'équité : se coucher.'))),
    }),
    title: (q) => `${q.d.name} au ${streetLabel(q.d.street)}, pot ${q.pot}, mise ${q.bet} → ${q.action === 'call' ? 'call' : 'fold'}`,
  };
}

// ---------- C3.6 : espérance de gain ----------

export function evQuestion() {
  return {
    make(rand) {
      const equity = pick([20, 25, 30, 35, 40, 45, 50, 60], rand);
      const call = pick([10, 20, 30, 40, 50, 60, 80, 100], rand);
      const gain = call * pick([1.5, 2, 2.5, 3, 4], rand);
      return { equity, call, gain, ev: evCall(equity, gain, call) };
    },
    scene: (q) => h('p', { class: 'question' },
      `Vous payez ${q.call} pour gagner ${q.gain} (ce qu'il y a déjà au milieu). Votre équité : ${q.equity} %. `,
      'Quelle est l\'EV de ce call ?'),
    ask: numberAsk('EV du call', { unit: 'jetons', parse: parseNumber }),
    check(q, v) {
      const p = q.equity / 100;
      const ev = Math.round(q.ev * 10) / 10;
      return {
        ok: Math.abs(v - q.ev) <= 1,
        body: h('p', {},
          `EV = ${num(p)} × ${q.gain} − ${num(Math.round((1 - p) * 100) / 100)} × ${q.call} = ${num(Math.round(p * q.gain * 10) / 10)} − ${num(Math.round((1 - p) * q.call * 10) / 10)} = `,
          h('strong', {}, `${ev > 0 ? '+' : ''}${num(ev)}`),
          ev > 0 ? ' : le call rapporte en moyenne.' : ev < 0 ? ' : le call coûte en moyenne.' : ' : le call ne rapporte rien en moyenne.',
          ' (Réponse acceptée à 1 jeton près.)'),
      };
    },
    title: (q) => `Call ${q.call} pour ${q.gain}, équité ${q.equity} % → EV ${num(Math.round(q.ev * 10) / 10)}`,
  };
}

// ---------- C3.5 : duels préflop ----------

const DUELS = {
  pair: { label: 'Paire contre paire inférieure', equity: 82 },
  dominated: { label: 'Main dominée (même carte, kicker inférieur)', equity: 74 },
  overs: { label: 'Paire contre deux cartes plus hautes', equity: 55 },
  highLow: { label: 'Deux hautes contre deux basses', equity: 60 },
};
const RANK = { 14: 'A', 13: 'R', 12: 'D', 11: 'V', 10: '10' };
const rk = (r) => RANK[r] || String(r);

function duelHands(kind, rand) {
  const take = (ranks) => {
    const d = shuffle(deck(), rand);
    return ranks.map((r) => { const i = d.findIndex((c) => c.r === r); return d.splice(i, 1)[0]; });
  };
  if (kind === 'pair') {
    const [lo, hi] = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], rand).slice(0, 2).sort((a, b) => a - b);
    const c = take([hi, hi, lo, lo]);
    return { fav: c.slice(0, 2), dog: c.slice(2) };
  }
  if (kind === 'dominated') {
    // kickers de 9 au moins : avec des kickers bas, le coup se partage souvent et l'écart fond
    const top = int(13, 14, rand);
    const [k2, k1] = shuffle([...Array(top - 9).keys()].map((x) => x + 9), rand).slice(0, 2).sort((a, b) => a - b);
    const c = take([top, k1, top, k2]);
    return { fav: c.slice(0, 2), dog: c.slice(2) };
  }
  if (kind === 'overs') {
    // paire moyenne contre deux figures, comme 88 contre AK
    const p = int(2, 9, rand);
    const [o1, o2] = shuffle([10, 11, 12, 13, 14], rand).slice(0, 2);
    const c = take([p, p, o1, o2]);
    return { fav: c.slice(0, 2), dog: c.slice(2) };
  }
  // deux figures contre deux petites cartes qui se suivent, comme AK contre 87 : ces dernières
  // gardent des chances de quinte, d'où « seulement » 60 % environ
  const [a, b] = shuffle([10, 11, 12, 13, 14], rand).slice(0, 2);
  const low = int(4, 8, rand);
  let c;
  do c = take([a, b, low + 1, low]); while (c[2].s === c[3].s);   // petites cartes assorties : 57 % seulement
  return { fav: c.slice(0, 2), dog: c.slice(2) };
}

const handName = (cards) => cards.map((c) => rk(c.r)).join('');

export function duelQuestion() {
  return {
    make(rand) {
      const kind = pick(Object.keys(DUELS), rand);
      const { fav, dog } = duelHands(kind, rand);
      const favFirst = rand() < 0.5;
      return { kind, fav, dog, left: favFirst ? fav : dog, right: favFirst ? dog : fav };
    },
    scene: (q) => h('div', {},
      h('div', { class: 'split-hand' },
        h('div', {}, h('div', { class: 'board-label quiet' }, 'Main A'), cardRow(q.left, 'sm')),
        h('div', {}, h('div', { class: 'board-label quiet' }, 'Main B'), cardRow(q.right, 'sm'))),
      h('p', { class: 'question' }, 'Avant le flop, quelle est l\'équité du favori ?')),
    ask: choiceAsk([82, 74, 60, 55].map((v) => ({ value: v, label: `environ ${v} %` }))),
    check: (q, v) => ({
      ok: v === DUELS[q.kind].equity,
      body: h('p', {}, `${DUELS[q.kind].label} : ${handName(q.fav)} est favori à `,
        h('strong', {}, `environ ${DUELS[q.kind].equity} %`), ` contre ${handName(q.dog)}. `,
        'Les couleurs changent un peu ces chiffres : vérifiez dans Equilab ceux qui vous surprennent.'),
    }),
    title: (q) => `${handName(q.fav)} contre ${handName(q.dog)} → environ ${DUELS[q.kind].equity} %`,
  };
}
