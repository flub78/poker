// Exercice : comparer deux mains de valeur proche (C1.3), une question à la fois.
// Prépare au test 5 ; même tirage et mêmes explications (../comparaison.js).
import { h } from '../../js/dom.js';
import { cardRow } from '../../js/cards.js';
import { evaluate, describe } from '../evaluator.js';
import { oneQuestion, explanation } from '../comparaison.js';

const CHOICES = [
  { value: 'A', label: 'Main A plus forte' },
  { value: '=', label: 'Égalité' },
  { value: 'B', label: 'Main B plus forte' },
];
const choiceLabel = (v) => CHOICES.find((c) => c.value === v).label;
const lcFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

export default {
  id: 'comparer',
  title: 'Comparer deux mains',
  competences: 'C1.3',
  summary: 'Deux mains proches : laquelle gagne à l\'abattage ? Combinaisons voisines, kicker, seconde paire, égalité.',
  settings: [
    { id: 'type', label: 'Questions', default: 'tout',
      options: [
        { value: 'tout', label: 'Tout mélangé (comme le test)' },
        { value: 'voisines', label: 'Combinaisons voisines' },
        { value: 'meme', label: 'Même combinaison : le départage' },
      ] },
  ],

  create(rand, settings, report) {
    let root;
    let q;
    let answer;

    function next() {
      q = oneQuestion(rand, settings.type);
      answer = null;
      show();
    }

    const hand = (letter, cards, score) => h('div', { class: 'compare-hand' },
      h('span', { class: 'compare-label' }, `Main ${letter}`), cardRow(cards, 'sm'),
      score ? h('span', {}, describe(score)) : null);

    function choose(value) {
      answer = value;
      report(answer === q.answer);
      show();
    }

    function show() {
      const [sa, sb] = answer ? [evaluate(q.a), evaluate(q.b)] : [null, null];
      const hands = h('section', { class: 'block compare-practice' }, hand('A', q.a, sa), hand('B', q.b, sb));
      let bottom;
      if (!answer) {
        const buttons = CHOICES.map((c) => h('button', { type: 'button', class: 'btn', onclick: () => choose(c.value) }, c.label));
        setTimeout(() => buttons[0].focus(), 0);
        bottom = h('div', { class: 'practice-actions' }, buttons);
      } else {
        const ok = answer === q.answer;
        const btn = h('button', { type: 'button', class: 'btn', onclick: next }, 'Question suivante →');
        setTimeout(() => btn.focus(), 0);
        bottom = h('div', {},
          h('div', { class: `feedback ${ok ? 'ok' : 'ko'}` },
            h('p', {}, ok ? `✓ ${choiceLabel(q.answer)}.` : `✗ Vous avez répondu « ${choiceLabel(answer)} » : ${lcFirst(choiceLabel(q.answer))}.`),
            h('p', {}, explanation(sa, sb))),
          h('div', { class: 'practice-actions' }, btn));
      }
      root.replaceChildren(hands, h('section', { class: 'block' }, h('h3', {}, 'Quelle main est la plus forte ?'), bottom));
    }

    return {
      render(el) {
        root = el;
        next();
      },
    };
  },
};
