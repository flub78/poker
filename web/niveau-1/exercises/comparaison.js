// Test 5 : comparer deux mains de valeur proche (C1.3). Ajouté le 14 novembre 2026 (since) :
// facultatif pour un joueur qui avait déjà validé le niveau 1 (js/validation.js).
// Logique (tirage, explication) : ../comparaison.js.
import { h } from '../../js/dom.js';
import { cardRow } from '../../js/cards.js';
import { evaluate, describe } from '../evaluator.js';
import { questions, explanation } from '../comparaison.js';

const CHOICES = [
  { value: 'A', label: 'La main A est plus forte' },
  { value: 'B', label: 'La main B est plus forte' },
  { value: '=', label: 'Égalité' },
];
const choiceLabel = (v) => CHOICES.find((c) => c.value === v).label;

export default {
  id: 'comparaison',
  code: 'Test 5',
  title: 'Comparer deux mains',
  competences: 'C1.3',
  rule: '10 comparaisons justes sur 10',
  since: '2026-11-14',

  create(rand) {
    const items = questions(rand, 10);
    const answers = new Array(items.length).fill('');

    const hand = (letter, cards) => h('div', { class: 'compare-hand' },
      h('span', { class: 'compare-label' }, `Main ${letter}`), cardRow(cards, 'sm'));

    return {
      render(root) {
        root.append(h('section', { class: 'block' },
          h('h3', {}, 'Quelle main est la plus forte ?'),
          h('p', { class: 'hint' }, 'Les deux mains sont proches : même combinaison ou combinaisons voisines. Une égalité est possible.'),
          h('ol', { class: 'hand-list' }, items.map((q, i) => h('li', { class: 'hand-item compare-item' },
            hand('A', q.a), hand('B', q.b),
            h('select', { 'aria-label': `Réponse à la question ${i + 1}`, onchange: (e) => { answers[i] = e.target.value; } },
              h('option', { value: '' }, 'Choisir…'),
              CHOICES.map((c) => h('option', { value: c.value }, c.label)))))),
        ));
      },
      missing() {
        const n = answers.filter((a) => !a).length;
        return n ? `Il reste ${n} question${n > 1 ? 's' : ''} sans réponse.` : null;
      },
      grade() {
        const graded = items.map((q, i) => {
          const ok = answers[i] === q.answer;
          const [sa, sb] = [evaluate(q.a), evaluate(q.b)];
          return {
            ok, title: `Question ${i + 1}`,
            body: h('div', { class: 'review-compare' },
              h('div', { class: 'review-hand' }, h('strong', {}, 'A'), cardRow(q.a, 'xs'), h('span', {}, describe(sa))),
              h('div', { class: 'review-hand' }, h('strong', {}, 'B'), cardRow(q.b, 'xs'), h('span', {}, describe(sb))),
              h('p', {}, ok ? null : h('span', {}, `Votre réponse : ${choiceLabel(answers[i])} · `),
                h('strong', { class: ok ? '' : 'good' }, `${choiceLabel(q.answer)}. `), explanation(sa, sb))),
          };
        });
        const score = graded.filter((it) => it.ok).length;
        return { score, total: items.length, passed: score === items.length, items: graded };
      },
    };
  },
};
