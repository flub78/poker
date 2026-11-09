// Test 1 : la grille de mémoire (C2.2).
// Colorier de mémoire les mains relancées à UTG, puis au BTN ; 2 cases fausses au plus par grille.
import { h } from '../../js/dom.js';
import { handName } from '../ranges.js';
import { UTG, BTN } from '../strategy.js';
import { paintableGrid, compare, correctionGrid, correctionLegend } from '../grid.js';

const TOLERANCE = 2;
const GRIDS = [['UTG', UTG], ['BTN', BTN]];

export default {
  id: 'grille',
  code: 'Test 1',
  title: 'La grille de mémoire',
  competences: 'C2.2',
  rule: `grilles UTG et BTN coloriées à ${TOLERANCE} cases près au plus, chacune`,

  create() {
    const paints = GRIDS.map(([pos]) => paintableGrid(`Grille ${pos}`));

    return {
      render(root) {
        root.append(h('p', { class: 'hint' },
          'Coloriez les mains qu\'on relance quand personne n\'a relancé avant vous. Paires sur la diagonale, assorties au-dessus, dépareillées en dessous. Touchez une case pour la colorier ou l\'effacer.'));
        GRIDS.forEach(([pos], i) => {
          root.append(h('section', { class: 'block' },
            h('h3', {}, pos === 'UTG' ? 'Grille 1 · UTG' : 'Grille 2 · BTN (bouton)'),
            paints[i].el,
            h('div', { class: 'practice-actions' },
              h('button', { type: 'button', class: 'btn secondary', onclick: paints[i].reset }, 'Tout effacer'))));
        });
      },
      missing() {
        const empty = paints.filter((p) => p.selected.size === 0).length;
        return empty ? 'Coloriez les deux grilles avant de valider.' : null;
      },
      grade() {
        const items = GRIDS.map(([pos, target], i) => {
          const c = compare(paints[i].selected, target);
          const names = (list) => list.map(handName).join(', ');
          return {
            ok: c.errors <= TOLERANCE,
            title: `Grille ${pos} : ${c.errors} case${c.errors > 1 ? 's' : ''} fausse${c.errors > 1 ? 's' : ''} (${TOLERANCE} au plus)`,
            body: h('div', {},
              c.missing.length ? h('p', {}, `Oubliées : ${names(c.missing)}.`) : null,
              c.extra.length ? h('p', {}, `En trop : ${names(c.extra)}.`) : null,
              h('p', {}, `${target.name} : ${target.text}.`),
              correctionLegend(),
              correctionGrid(paints[i].selected, target)),
            errors: c.errors,
          };
        });
        const score = 2 * 169 - items.reduce((n, it) => n + it.errors, 0);
        return { score, total: 2 * 169, passed: items.every((it) => it.ok), items };
      },
    };
  },
};
