// Exercice : colorier de mémoire la grille 13 × 13 d'une position, puis comparer.
// La liste attendue est celle du sous-niveau choisi (settings.step) : à l'étape 0, UTG partout.
// La liste exacte d'un sous-niveau plus avancé est acceptée « en avance » (grade, strategy.js).
import { h } from '../../js/dom.js';
import { handName } from '../ranges.js';
import { FULL, STEPS, openRange, grade } from '../strategy.js';
import { paintableGrid, compare, correctionGrid, correctionLegend } from '../grid.js';

export default {
  id: 'colorier',
  title: 'Colorier la grille',
  competences: 'C2.2',
  summary: 'Coloriez de mémoire, sur la grille 13 × 13, les mains qu\'on relance à une position. Paires sur la diagonale, assorties au-dessus, dépareillées en dessous.',
  settings: [
    { id: 'pos', label: 'Position', default: 'UTG',
      options: [
        { value: 'UTG', label: 'UTG et MP' },
        { value: 'CO', label: 'CO et SB' },
        { value: 'BTN', label: 'BTN' },
      ] },
  ],

  create(rand, settings, report) {
    const step = settings.step ?? FULL;
    const target = openRange(settings.pos, step);
    let root;

    function start() {
      const paint = paintableGrid(`Grille à colorier : ${settings.pos}`);
      const check = h('button', { type: 'button', class: 'btn', onclick: () => correct(paint.selected) }, 'Corriger');
      root.replaceChildren(h('section', { class: 'block' },
        h('h3', {}, `Les mains qu'on relance : ${target.name}`),
        h('p', { class: 'hint' }, 'Touchez une case pour la colorier ou l\'effacer. À la souris, vous pouvez glisser sur plusieurs cases.'),
        paint.el,
        h('div', { class: 'practice-actions' }, check,
          h('button', { type: 'button', class: 'btn secondary', onclick: paint.reset }, 'Tout effacer'))));
    }

    function correct(selected) {
      const { ok, ahead } = grade((s) => compare(selected, openRange(settings.pos, s)).errors === 0, step);
      report(ok);
      if (ahead !== null) { correctAhead(selected, ahead); return; }
      const c = compare(selected, target);
      const names = (list) => list.map(handName).join(', ');
      const again = h('button', { type: 'button', class: 'btn', onclick: start }, 'Recommencer');
      setTimeout(() => again.focus(), 0);
      root.replaceChildren(h('section', { class: 'block' },
        h('div', { class: `feedback ${ok ? 'ok' : 'ko'}` },
          h('p', {}, h('strong', {}, ok ? '✓ Grille parfaite.' : `✗ ${c.errors} case${c.errors > 1 ? 's' : ''} fausse${c.errors > 1 ? 's' : ''}.`)),
          c.missing.length ? h('p', {}, `Oubliées : ${names(c.missing)}.`) : null,
          c.extra.length ? h('p', {}, `En trop : ${names(c.extra)}.`) : null,
          h('p', {}, `${target.name} : ${target.text}.`)),
        correctionLegend(),
        correctionGrid(selected, target),
        h('div', { class: 'practice-actions' }, again)));
    }

    // Grille exacte d'un sous-niveau plus avancé : juste, en avance ; la correction montre l'écart
    // avec la liste du sous-niveau choisi.
    function correctAhead(selected, ahead) {
      const r = openRange(settings.pos, ahead);
      const again = h('button', { type: 'button', class: 'btn', onclick: start }, 'Recommencer');
      setTimeout(() => again.focus(), 0);
      root.replaceChildren(h('section', { class: 'block' },
        h('div', { class: 'feedback ok' },
          h('p', {}, h('strong', {}, '✓ Grille juste, en avance.')),
          h('p', {}, `Vous avez colorié la ${r.name}, celle du sous-niveau ${STEPS[ahead].code} : ${r.text}.`),
          h('p', { class: 'meta' }, `À votre sous-niveau (${STEPS[step].code}), la ${target.name} : ${target.text}.`)),
        correctionLegend(),
        correctionGrid(selected, target),
        h('div', { class: 'practice-actions' }, again)));
    }

    return {
      render(el) {
        root = el;
        start();
      },
    };
  },
};
