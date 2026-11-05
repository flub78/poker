// Test 4 : pot annexe à 3 joueurs (C1.2).
// Un joueur est à tapis ; calculer les pots et ce que reçoit chacun à l'abattage.
import { h } from '../dom.js';
import { pick, shuffle } from '../cards.js';

const NAMES = ['Alice', 'Bruno', 'Chloé', 'David', 'Emma', 'Farid', 'Gaëlle', 'Hugo'];

function scenario(rand) {
  const [short, p2, p3] = shuffle(NAMES, rand).slice(0, 3);
  const allIn = pick([40, 60, 80, 100, 120], rand);       // tapis du joueur court
  const extra = pick([50, 80, 100, 150, 200], rand);       // mise jouée ensuite entre les deux autres
  const ranking = shuffle([short, p2, p3], rand);          // ordre des mains à l'abattage, meilleure d'abord
  const main = 3 * allIn;
  const side = 2 * extra;
  const won = { [short]: 0, [p2]: 0, [p3]: 0 };
  won[ranking[0]] += main;                                  // tout le monde dispute le pot principal
  const sideWinner = ranking.find((p) => p !== short);      // seuls p2 et p3 disputent le pot annexe
  won[sideWinner] += side;
  return { short, p2, p3, allIn, extra, ranking, main, side, won };
}

export default {
  id: 'pot-annexe',
  code: 'Test 4',
  title: 'Pot annexe à 3 joueurs',
  competences: 'C1.2',
  rule: '5 bonnes réponses sur 5 (la répartition finale compte pour une)',

  create(rand) {
    const s = scenario(rand);
    const players = [s.short, s.p2, s.p3];
    const choicesWho = [`${s.short} seulement`, `${s.p2} et ${s.p3}`, `${s.short}, ${s.p2} et ${s.p3}`];
    const questions = [
      { id: 'main', kind: 'num', q: 'Montant du pot principal ?', a: s.main },
      { id: 'side', kind: 'num', q: 'Montant du pot annexe ?', a: s.side },
      { id: 'whoMain', kind: 'choice', q: 'Qui peut gagner le pot principal ?', options: choicesWho, a: choicesWho[2] },
      { id: 'whoSide', kind: 'choice', q: 'Qui peut gagner le pot annexe ?', options: choicesWho, a: choicesWho[1] },
      ...players.map((p) => ({ id: `won-${p}`, kind: 'num', q: `À l'abattage, combien de jetons reçoit ${p} ?`, a: s.won[p] })),
    ];
    // 4 questions simples + la répartition finale (3 montants), notée juste seulement si les 3 le sont
    const answers = {};

    return {
      render(root) {
        root.append(
          h('section', { class: 'block scenario' },
            h('h3', {}, 'La situation'),
            h('p', {}, `Trois joueurs sont dans le coup. Pour simplifier, on ignore les blinds.`),
            h('ol', {},
              h('li', {}, `${s.short} met tout son tapis : ${s.allIn} jetons. ${s.p2} et ${s.p3} suivent.`),
              h('li', {}, `Au tour suivant, ${s.p2} mise ${s.extra} jetons et ${s.p3} suit. ${s.short}, à tapis, ne peut plus miser.`),
              h('li', {}, `À l'abattage, la meilleure main est celle de ${s.ranking[0]}, puis ${s.ranking[1]}, puis ${s.ranking[2]}.`))),
          h('section', { class: 'block' },
            h('h3', {}, 'Vos réponses'),
            questions.map((q, qi) => q.kind === 'num'
              ? h('label', { class: 'num-field' },
                h('span', {}, `${qi + 1}. ${q.q}`),
                h('input', { type: 'number', inputmode: 'numeric', min: '0', step: '10',
                  oninput: (e) => { answers[q.id] = e.target.value === '' ? null : Number(e.target.value); } }),
                h('span', { class: 'unit' }, 'jetons'))
              : h('fieldset', { class: 'qcm' },
                h('legend', {}, `${qi + 1}. ${q.q}`),
                q.options.map((opt) => h('label', { class: 'choice' },
                  h('input', { type: 'radio', name: q.id, value: opt, onchange: () => { answers[q.id] = opt; } }),
                  h('span', {}, opt)))))),
        );
      },
      missing() {
        const n = questions.filter((q) => answers[q.id] === undefined || answers[q.id] === null).length;
        return n ? `Il reste ${n} réponse${n > 1 ? 's' : ''} à donner.` : null;
      },
      grade() {
        const check = (q) => answers[q.id] === q.a;
        const basics = questions.slice(0, 4).map((q) => ({
          ok: check(q), title: q.q,
          body: check(q) ? String(q.a) : h('div', {}, `Votre réponse : ${answers[q.id]} · `, h('strong', { class: 'good' }, `Bonne réponse : ${q.a}`)),
        }));
        const finals = questions.slice(4);
        const finalsOk = finals.every(check);
        const explain = `Pot principal ${s.main} = 3 × ${s.allIn}. Pot annexe ${s.side} = 2 × ${s.extra}. `
          + `${s.ranking[0]} gagne le pot principal ; le pot annexe va au meilleur des deux autres joueurs.`;
        const items = [
          ...basics,
          { ok: finalsOk, title: 'Répartition à l\'abattage (3 montants)',
            body: h('div', {},
              h('ul', {}, finals.map((q) => h('li', {}, `${q.q.replace('À l\'abattage, combien de jetons reçoit ', '').replace(' ?', '')} : `,
                check(q) ? `${q.a} ✓` : h('span', {}, `${answers[q.id]} → `, h('strong', { class: 'good' }, q.a))))),
              h('p', { class: 'hint' }, explain)) },
        ];
        const score = items.filter((it) => it.ok).length;
        return { score, total: items.length, passed: score === items.length, items };
      },
    };
  },
};
