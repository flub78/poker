// Exercice : trouver la meilleure combinaison dans 7 cartes tirées au hasard (C1.3).
// Objectif du tutoriel : la nommer en moins de 10 secondes.
import { h } from '../../js/dom.js';

const lcFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
import { deck, shuffle, cardImg, cardRow, sameCard } from '../../js/cards.js';
import { CLASSES, classOf, className, describe } from '../evaluator.js';
import { bestFive } from '../analysis.js';

const fmt = (s) => `${s.toFixed(1).replace('.', ',')} s`;

export default {
  id: 'meilleure-main',
  title: 'Meilleure main en 7 cartes',
  competences: 'C1.3',
  summary: 'Sept cartes au hasard : trouvez la meilleure combinaison de 5 cartes, en moins de 10 secondes.',
  settings: [
    { id: 'time', label: 'Temps limite', default: '10',
      options: [
        { value: '10', label: '10 secondes' },
        { value: '20', label: '20 secondes' },
        { value: '0', label: 'Sans limite' },
      ] },
    { id: 'layout', label: 'Présentation', default: 'mixed',
      options: [
        { value: 'mixed', label: '7 cartes en vrac' },
        { value: 'split', label: '2 en main + 5 au tableau' },
      ] },
  ],

  create(rand, settings, report) {
    const limit = Number(settings.time);
    let root;
    let cards;
    let started;
    let result;

    function next() {
      cards = shuffle(deck(), rand).slice(0, 7);
      started = performance.now();
      result = null;
      show();
    }

    function cardsView() {
      const used = result ? result.best.cards : null;
      const img = (c) => {
        const el = cardImg(c);
        if (used && !used.some((u) => sameCard(u, c))) el.classList.add('dim');
        return el;
      };
      if (settings.layout === 'split') {
        return h('div', { class: 'split-hand' },
          h('div', {}, h('div', { class: 'board-label quiet' }, 'Vos cartes'), h('div', { class: 'card-row' }, cards.slice(0, 2).map(img))),
          h('div', { class: 'board' }, h('div', { class: 'board-label' }, 'Tableau'), h('div', { class: 'card-row' }, cards.slice(2).map(img))));
      }
      return h('div', { class: 'card-row' }, cards.map(img));
    }

    function formView() {
      const timer = h('span', { class: 'timer', 'aria-live': 'off' }, fmt(0));
      const tick = setInterval(() => {
        if (!timer.isConnected) { clearInterval(tick); return; }
        const s = (performance.now() - started) / 1000;
        timer.textContent = fmt(s);
        timer.classList.toggle('late', limit > 0 && s > limit);
      }, 100);

      const message = h('p', { class: 'form-message', role: 'alert' });
      const select = h('select', { 'aria-label': 'Meilleure combinaison' },
        h('option', { value: '' }, 'Choisir…'),
        CLASSES.map((c, k) => h('option', { value: c.id }, `${k + 1} · ${c.name}`)));
      const validate = () => {
        if (!select.value) { message.textContent = 'Choisissez une combinaison.'; return; }
        clearInterval(tick);
        const seconds = (performance.now() - started) / 1000;
        const best = bestFive(cards);
        const okClass = classOf(best.score) === select.value;
        const okTime = limit === 0 || seconds <= limit;
        result = { best, okClass, okTime, ok: okClass && okTime, seconds, answer: select.value };
        report(result.ok);
        show();
      };
      setTimeout(() => select.focus(), 0);
      return h('div', { class: 'announce' },
        h('label', { class: 'setting' }, 'Meilleure combinaison', select),
        h('button', { type: 'button', class: 'btn', onclick: validate }, 'Valider'),
        h('span', { class: 'setting' }, limit ? `Temps (limite ${limit} s)` : 'Temps', timer),
        message);
    }

    function resultView() {
      const r = result;
      const lines = [
        r.okClass
          ? `✓ ${describe(r.best.score)}.`
          : `✗ Vous avez répondu « ${className(r.answer)} » : la meilleure main est ${lcFirst(describe(r.best.score))}.`,
        r.okTime
          ? `✓ Trouvé en ${fmt(r.seconds)}.`
          : `✗ Trouvé en ${fmt(r.seconds)} : au-delà des ${limit} secondes.`,
      ];
      const btn = h('button', { type: 'button', class: 'btn', onclick: next }, 'Main suivante →');
      setTimeout(() => btn.focus(), 0);
      return h('div', {},
        h('div', { class: `feedback ${r.ok ? 'ok' : 'ko'}` },
          lines.map((l) => h('p', {}, l)),
          h('p', {}, 'Les 5 cartes retenues :'),
          cardRow(r.best.cards, 'xs')),
        h('div', { class: 'practice-actions' }, btn));
    }

    function show() {
      root.replaceChildren(
        h('section', { class: 'block' }, cardsView()),
        h('section', { class: 'block' }, result ? resultView() : formView()),
      );
    }

    return {
      render(el) {
        root = el;
        next();
      },
    };
  },
};
