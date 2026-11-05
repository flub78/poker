// Test 3 : trouver les nuts (C1.4).
// 20 tableaux de 5 cartes ; pour chacun, choisir parmi 4 mains celle qui fait les nuts.
import { h } from '../dom.js';
import { deck, shuffle, cardRow, short } from '../cards.js';
import { evaluate, compare, describe, scoreKey } from '../evaluator.js';

const BOARDS = 20;
const PASS = 18;

function makeBoard(rand) {
  for (;;) {
    const d = shuffle(deck(), rand);
    const board = d.slice(0, 5);
    const rest = d.slice(5);
    const combos = [];
    for (let i = 0; i < rest.length; i++) {
      for (let j = i + 1; j < rest.length; j++) {
        const hole = [rest[i], rest[j]];
        combos.push({ hole, score: evaluate([...board, ...hole]) });
      }
    }
    combos.sort((a, b) => compare(b.score, a.score));

    // regroupe les mains de même valeur
    const groups = [];
    for (const c of combos) {
      const last = groups[groups.length - 1];
      if (last && scoreKey(last.score) === scoreKey(c.score)) last.items.push(c);
      else groups.push({ score: c.score, items: [c] });
    }
    // on écarte les tableaux où tout le monde partage (le tableau fait les nuts)
    if (groups.length < 4 || groups[0].items.length > combos.length / 2) continue;

    const nuts = groups[0].items[Math.floor(rand() * groups[0].items.length)];
    // 3 leurres plausibles : parmi les meilleures mains qui ne sont pas les nuts
    const pool = shuffle(groups.slice(1, Math.min(groups.length, 10)), rand).slice(0, 3);
    const decoys = pool.map((g) => g.items[Math.floor(rand() * g.items.length)]);
    const options = shuffle([nuts, ...decoys], rand);
    return { board, options, answer: options.indexOf(nuts), nutsScore: groups[0].score };
  }
}

export default {
  id: 'nuts',
  code: 'Test 3',
  title: 'Trouver les nuts',
  competences: 'C1.4',
  rule: `${PASS} tableaux réussis sur ${BOARDS}`,

  create(rand) {
    const boards = Array.from({ length: BOARDS }, () => makeBoard(rand));
    const answers = new Array(BOARDS).fill(null);
    let index = 0;
    let stage;

    function show() {
      const b = boards[index];
      stage.replaceChildren(
        h('div', { class: 'progress-line' },
          h('span', {}, `Tableau ${index + 1} sur ${BOARDS}`),
          h('span', { class: 'progress-bar' }, h('span', { style: `width:${((index + 1) / BOARDS) * 100}%` }))),
        h('div', { class: 'board' }, h('div', { class: 'board-label' }, 'Tableau'), cardRow(b.board)),
        h('p', { class: 'hint' }, 'Quelle main fait les nuts, la meilleure main possible sur ce tableau ?'),
        h('div', { class: 'options', role: 'radiogroup' }, b.options.map((opt, k) => h('button', {
          type: 'button',
          class: `option${answers[index] === k ? ' selected' : ''}`,
          role: 'radio',
          'aria-checked': answers[index] === k ? 'true' : 'false',
          onclick: () => { answers[index] = k; show(); },
        }, h('span', { class: 'option-letter' }, 'ABCD'[k]), cardRow(opt.hole, 'sm')))),
        h('div', { class: 'nav' },
          h('button', { type: 'button', class: 'btn secondary', disabled: index === 0, onclick: () => { index--; show(); } }, '← Précédent'),
          index < BOARDS - 1
            ? h('button', { type: 'button', class: 'btn', disabled: answers[index] === null, onclick: () => { index++; show(); } }, 'Suivant →')
            : h('span', { class: 'hint' }, 'Dernier tableau : validez vos réponses en bas de page.')),
      );
    }

    return {
      render(root) {
        stage = h('section', { class: 'block' });
        root.append(stage);
        show();
      },
      missing() {
        const n = answers.filter((a) => a === null).length;
        return n ? `Il reste ${n} tableau${n > 1 ? 'x' : ''} sans réponse.` : null;
      },
      grade() {
        const items = boards.map((b, i) => {
          const ok = answers[i] === b.answer;
          const mine = b.options[answers[i]];
          const good = b.options[b.answer];
          return {
            ok, title: `Tableau ${i + 1} · nuts : ${describe(b.nutsScore).toLowerCase()}`,
            body: h('div', { class: 'review-hand' },
              cardRow(b.board, 'xs'),
              ok ? h('span', {}, `Votre choix ${good.hole.map(short).join(' ')} fait bien les nuts.`)
                : h('span', {},
                  `Votre choix ${mine.hole.map(short).join(' ')} : ${describe(mine.score).toLowerCase()} · `,
                  h('strong', { class: 'good' }, `Nuts : ${good.hole.map(short).join(' ')}`))),
          };
        });
        const score = items.filter((it) => it.ok).length;
        return { score, total: BOARDS, passed: score >= PASS, items };
      },
    };
  },
};
