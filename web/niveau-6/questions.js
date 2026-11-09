// Les questions du niveau 6 (vers le GTO). Chaque fabrique renvoie
// { make, scene, ask, check, title } pour runSerie (js/serie.js).
import { h } from '../js/dom.js';
import { pick, shuffle, int } from '../js/cards.js';
import { choiceAsk, multiAsk, numberAsk } from '../js/serie.js';
import { parseNumber, pct, num } from '../niveau-3/odds.js';

const mdf = (pot, bet) => (100 * pot) / (pot + bet);
const round1 = (x) => Math.round(x * 10) / 10;

// ---------- C6.1 : défense minimale (MDF) ----------

// test : les 3 tailles du cours (1/2 pot, pot, 2 pots), chacune en % puis appliquée à une range.
const TEST_SIZES = [{ label: '1/2 pot', f: 0.5 }, { label: 'pot', f: 1 }, { label: '2 pots', f: 2 }];

export function mdfQuestion({ mode = 'test' } = {}) {
  let order = [];
  return {
    make(rand, i) {
      if (mode === 'test') {
        if (i === 0) order = shuffle(TEST_SIZES, rand);
        const size = order[i % 3];
        const pot = pick([60, 80, 100, 120, 150, 200], rand);
        return { pot, bet: pot * size.f, size: size.label, kind: i < 3 ? 'pct' : 'combos', combos: pick([30, 36, 42, 48, 60, 90, 120], rand) };
      }
      const pot = pick([40, 60, 80, 100, 120, 150, 200, 300], rand);
      const bet = Math.round((pot * pick([0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.5, 2], rand)) / 5) * 5;
      return { pot, bet, size: null, kind: pick(['pct', 'combos'], rand), combos: pick([30, 36, 42, 48, 60, 90, 120], rand) };
    },
    scene: (q) => h('p', { class: 'question' },
      `Pot : ${q.pot}. L'adversaire mise ${q.bet}${q.size ? ` (${q.size})` : ''}. `,
      q.kind === 'pct'
        ? 'Quelle part de votre range devez-vous au moins continuer (MDF) ?'
        : `Votre range compte ${q.combos} combos : combien devez-vous au moins en continuer (payer ou relancer) ?`),
    ask: (q, submit) => numberAsk(q.kind === 'pct' ? 'MDF' : 'Combos à continuer', { unit: q.kind === 'pct' ? '%' : 'combos', parse: parseNumber })(q, submit),
    check(q, v) {
      const m = mdf(q.pot, q.bet);
      const want = q.kind === 'pct' ? m : (q.combos * m) / 100;
      return {
        ok: Math.abs(v - want) <= 1,
        body: h('p', {}, `MDF = pot ÷ (pot + mise) = ${q.pot} ÷ ${q.pot + q.bet} = ${pct(m, 1)}`,
          q.kind === 'combos' ? [`, soit ${q.combos} × ${pct(m, 1)} = `, h('strong', {}, `${num(round1(want))} combos`)] : '',
          '. Sinon, l\'adversaire bluffe à coup sûr de façon rentable. (À 1 près.)'),
      };
    },
    title: (q) => `Mise de ${q.bet} dans ${q.pot} → ${q.kind === 'pct' ? `MDF ${pct(mdf(q.pot, q.bet))}` : `${num(round1((q.combos * mdf(q.pot, q.bet)) / 100))} combos sur ${q.combos}`}`,
  };
}

// ---------- C6.1 : part de bluffs équilibrée ----------

export function bluffShareQuestion() {
  return {
    make(rand) {
      const pot = pick([40, 60, 80, 100, 120, 150, 200], rand);
      const bet = Math.round((pot * pick([0.33, 0.5, 0.66, 0.75, 1, 1.5, 2], rand)) / 5) * 5;
      return { pot, bet, share: (100 * bet) / (pot + 2 * bet) };
    },
    scene: (q) => h('p', { class: 'question' },
      `River. Pot : ${q.pot}. Vous misez ${q.bet}. Pour être équilibré, quelle part de vos mises doivent être des bluffs ?`),
    ask: numberAsk('Part de bluffs', { unit: '%', parse: parseNumber }),
    check: (q, v) => ({
      ok: Math.abs(v - q.share) <= 2,
      body: h('p', {}, `L'adversaire paie ${q.bet} pour gagner ${q.pot + q.bet} : il lui faut ${q.bet} ÷ ${q.pot + 2 * q.bet} = `,
        h('strong', {}, pct(q.share, 1)), ' d\'équité. Avec cette part de bluffs, payer ou se coucher lui rapporte autant : il n\'a aucun intérêt à changer. ',
        'Mise pot : 1 bluff sur 3. (À 2 points près.)'),
    }),
    title: (q) => `Mise ${q.bet} dans ${q.pot} → ${pct(q.share)} de bluffs`,
  };
}

// ---------- C6.4 : exploiter plutôt que copier ----------

const ADJUST = [
  { value: 'plus', label: 'Bluffer plus' },
  { value: 'moins', label: 'Bluffer moins, miser plus gros pour la valeur' },
  { value: 'gto', label: 'Rester proche de l\'équilibre' },
];

export function exploitQuestion() {
  return {
    make(rand) {
      for (;;) {
        const size = pick(TEST_SIZES, rand);
        const m = 100 * (1 / (1 + size.f));
        const defend = int(15, 90, rand);
        const gap = defend - m;
        if (Math.abs(gap) > 4 && Math.abs(gap) < 10) continue;   // ni nettement trop, ni à l'équilibre
        const answer = gap <= -10 ? 'plus' : gap >= 10 ? 'moins' : 'gto';
        return { size, m, defend, answer };
      }
    },
    scene: (q) => h('p', { class: 'question' },
      `Face à vos mises de ${q.size.label} à la river, cet adversaire continue (paie ou relance) ${q.defend} % du temps. Comment vous adapter ?`),
    ask: choiceAsk(ADJUST),
    check: (q, v) => ({
      ok: v === q.answer,
      body: h('p', {}, `MDF face à une mise de ${q.size.label} : ${pct(q.m)}. Il continue ${q.defend} % du temps : `,
        q.answer === 'plus' ? 'il se couche trop, vos bluffs rapportent. '
          : q.answer === 'moins' ? 'il paie trop, vos bluffs perdent et vos mains fortes sont payées. '
            : 'il défend à peu près ce qu\'il faut. ',
        h('strong', {}, `${ADJUST.find((a) => a.value === q.answer).label}.`)),
    }),
    title: (q) => `Continue ${q.defend} % face à ${q.size.label} (MDF ${pct(q.m)}) → ${ADJUST.find((a) => a.value === q.answer).label.toLowerCase()}`,
  };
}

// ---------- C6.5 : mesurer ses résultats ----------

const euros = (x) => `${num(Math.round(x * 100) / 100)} €`;

export function resultsQuestion() {
  return {
    make(rand) {
      if (rand() < 0.5) {
        const bb = pick([0.02, 0.05, 0.1, 0.25], rand);
        const hands = pick([3000, 5000, 8000, 12000, 20000, 35000, 50000, 80000], rand);
        const bb100 = round1((rand() * 12) - 3);
        const gain = Math.round(((bb100 * hands) / 100) * bb * 100) / 100;
        return { kind: 'cash', bb, hands, gain, value: ((gain / bb) * 100) / hands, enough: hands >= 30000 };
      }
      const n = pick([40, 80, 150, 250, 320, 500, 800], rand);
      const fee = pick([2, 5, 10, 20], rand);
      const spent = n * fee;
      const won = Math.round(spent * (0.6 + rand() * 0.9));
      return { kind: 'mtt', n, fee, spent, won, value: (100 * (won - spent)) / spent, enough: n >= 300 };
    },
    scene: (q) => h('p', { class: 'question' }, q.kind === 'cash'
      ? `Cash-game, grosse blind à ${euros(q.bb)}. Sur ${q.hands.toLocaleString('fr-FR')} mains, résultat : ${euros(q.gain)}. Quel est votre BB/100 ? Peut-on conclure ?`
      : `${q.n} tournois à ${euros(q.fee)} : ${euros(q.spent)} de droits d'entrée, ${euros(q.won)} de gains. Quel est votre ROI ? Peut-on conclure ?`),
    ask: (q, submit) => multiAsk([
      { name: 'value', label: q.kind === 'cash' ? 'BB/100' : 'ROI', type: 'number', unit: q.kind === 'cash' ? 'BB/100' : '%', parse: parseNumber },
      { name: 'enough', label: 'Peut-on conclure ?', options: [{ value: true, label: 'Oui' }, { value: false, label: 'Non, échantillon trop petit' }] },
    ])(q, submit),
    check(q, v) {
      const tol = q.kind === 'cash' ? 0.2 : 1;
      const okV = Math.abs(v.value - q.value) <= tol;
      const okE = v.enough === q.enough;
      return {
        ok: okV && okE,
        body: h('div', {},
          h('p', {}, okV ? '✓ ' : '✗ ', q.kind === 'cash'
            ? [`${euros(q.gain)} ÷ ${euros(q.bb)} = ${num(round1(q.gain / q.bb))} BB, sur ${q.hands.toLocaleString('fr-FR')} mains : `, h('strong', {}, `${num(round1(q.value))} BB/100`), ` (à ${num(tol)} près).`]
            : [`(${euros(q.won)} − ${euros(q.spent)}) ÷ ${euros(q.spent)} = `, h('strong', {}, pct(q.value, 1)), ` (à ${tol} point près).`]),
          h('p', {}, okE ? '✓ ' : '✗ ', q.kind === 'cash' ? 'Pas de conclusion avant 30 000 mains : ' : 'Pas de conclusion avant 300 tournois : ',
            h('strong', {}, q.enough ? 'on peut conclure' : 'trop tôt pour conclure, la variance domine'), '.')),
      };
    },
    title: (q) => (q.kind === 'cash' ? `${q.hands} mains → ${num(round1(q.value))} BB/100` : `${q.n} tournois → ROI ${pct(q.value)}`),
  };
}
