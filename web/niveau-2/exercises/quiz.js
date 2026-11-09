// Test 2 : quiz préflop (C2.1 à C2.3).
// 20 situations, dont 10 face à une relance ou une sur-relance ; 18 bonnes réponses au moins.
import { h } from '../../js/dom.js';
import { shuffle, cardRow } from '../../js/cards.js';
import { cardsFor, handName } from '../ranges.js';
import { decide, actionLabel } from '../strategy.js';
import { makeSituation, handFor, describe } from '../situations.js';
import { situationView, actionButtons } from '../hand.js';

const PLAN = [
  ...Array(9).fill('open'), 'bb',
  ...Array(6).fill('vsRaise'), 'vs3bet', 'vs3bet', 'squeeze', 'squeeze',
];
const PASS = 18;

export default {
  id: 'quiz',
  code: 'Test 2',
  title: 'Quiz préflop',
  competences: 'C2.1 à C2.3',
  rule: `${PASS} situations sur ${PLAN.length}, dont la moitié face à une relance`,

  create(rand) {
    const items = shuffle(PLAN, rand).map((type) => {
      const sit = makeSituation(type, rand);
      const code = handFor(sit, rand);
      return { sit, code, cards: cardsFor(code, rand) };
    });
    const answers = new Array(items.length).fill('');

    return {
      render(root) {
        root.append(h('p', { class: 'hint' }, 'Pour chaque situation, choisissez votre décision. Relance standard : 2,5 BB ; sur-relance : environ 3 fois la relance.'),
          h('ol', { class: 'quiz-list' }, items.map((it, i) => h('li', { class: 'block quiz-item' },
            h('p', { class: 'meta' }, `Situation ${i + 1}`),
            situationView(it.sit, it.cards, 'sm'),
            actionButtons(it.sit, (a) => { answers[i] = a; }).el))));
      },
      missing() {
        const n = answers.filter((a) => !a).length;
        return n ? `Il reste ${n} situation${n > 1 ? 's' : ''} sans réponse.` : null;
      },
      grade() {
        const review = items.map((it, i) => {
          const d = decide(it.sit, it.code);
          const ok = answers[i] === d.action;
          return {
            ok,
            title: `Situation ${i + 1} · ${handName(it.code)}`,
            body: h('div', {},
              h('div', { class: 'review-hand' }, cardRow(it.cards, 'xs'), h('span', {}, describe(it.sit))),
              h('p', {}, ok
                ? `${actionLabel(it.sit, d.action)}. ${d.why}`
                : h('span', {}, `Votre réponse : ${actionLabel(it.sit, answers[i])} · `,
                  h('strong', { class: 'good' }, `Bonne réponse : ${actionLabel(it.sit, d.action)}`), `. ${d.why}`))),
          };
        });
        const score = review.filter((it) => it.ok).length;
        return { score, total: items.length, passed: score >= PASS, items: review };
      },
    };
  },
};
