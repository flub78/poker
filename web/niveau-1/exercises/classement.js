// Test 2 : classement des mains (C1.3).
// 10 mains, une de chaque combinaison, à nommer sans erreur.
import { h } from '../../js/dom.js';
import { shuffle, cardRow } from '../../js/cards.js';
import { CLASSES, className } from '../evaluator.js';
import { build } from '../mains.js';

export default {
  id: 'classement',
  code: 'Test 2',
  title: 'Classement des mains',
  competences: 'C1.3',
  rule: '10 mains nommées sans erreur',

  create(rand) {
    const hands = shuffle(CLASSES.map((c) => c.id), rand).map((id) => ({ id, cards: build(id, rand) }));
    const answers = new Array(hands.length).fill('');

    return {
      render(root) {
        root.append(h('section', { class: 'block' },
          h('h3', {}, 'Nommez la combinaison de chaque main'),
          h('p', { class: 'hint' }, 'Chaque combinaison apparaît une seule fois. Le numéro indique son rang, de la plus forte (1) à la plus faible (10).'),
          h('ol', { class: 'hand-list' }, hands.map((hand, i) => h('li', { class: 'hand-item' },
            cardRow(hand.cards, 'sm'),
            h('select', { 'aria-label': `Combinaison de la main ${i + 1}`, onchange: (e) => { answers[i] = e.target.value; } },
              h('option', { value: '' }, 'Choisir…'),
              CLASSES.map((c, k) => h('option', { value: c.id }, `${k + 1} · ${c.name}`)))))),
        ));
      },
      missing() {
        const n = answers.filter((a) => !a).length;
        return n ? `Il reste ${n} main${n > 1 ? 's' : ''} sans réponse.` : null;
      },
      grade() {
        const items = hands.map((hand, i) => {
          const ok = answers[i] === hand.id;
          return {
            ok, title: `Main ${i + 1}`,
            body: h('div', { class: 'review-hand' }, cardRow(hand.cards, 'xs'),
              ok ? h('span', {}, className(hand.id))
                : h('span', {}, `Votre réponse : ${className(answers[i])} · `, h('strong', { class: 'good' }, `Bonne réponse : ${className(hand.id)}`))),
          };
        });
        const score = items.filter((it) => it.ok).length;
        return { score, total: hands.length, passed: score === hands.length, items };
      },
    };
  },
};
