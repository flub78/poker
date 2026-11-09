// La grille 13 × 13 des mains de départ : paires sur la diagonale,
// assorties au-dessus, dépareillées en dessous.
import { h } from '../js/dom.js';
import { cellCode } from './ranges.js';

// classFor(code) → classes CSS de la case ; onToggle(code, el) rend la grille cliquable.
export function grid({ classFor = () => '', onToggle = null, label = 'Grille des mains de départ', small = false } = {}) {
  const cells = [];
  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 13; j++) {
      const code = cellCode(i, j);
      const kind = i === j ? 'pair' : i < j ? 'suited' : 'offsuit';
      const cls = `cell ${kind} ${classFor(code)}`.trim();
      const el = onToggle
        ? h('button', { type: 'button', class: cls, 'aria-pressed': 'false', title: code, dataset: { code } }, code)
        : h('span', { class: cls, title: code, role: 'cell', dataset: { code } }, code);
      if (onToggle) {
        el.addEventListener('click', () => onToggle(code, el));
      }
      cells.push(el);
    }
  }
  return h('div', { class: `hand-grid ${small ? 'small' : ''}`.trim(), role: onToggle ? 'group' : 'table', 'aria-label': label }, cells);
}

export function legend(items) {
  return h('ul', { class: 'grid-legend' }, items.map(([cls, text]) => h('li', {}, h('span', { class: `swatch ${cls}` }), text)));
}

// Grille à colorier : renvoie { el, selected (Set), reset() }.
export function paintableGrid(label) {
  const selected = new Set();
  let painting = null;                              // glisser pour colorier plusieurs cases
  const set = (code, el, on) => {
    if (on) selected.add(code); else selected.delete(code);
    el.classList.toggle('on', on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  };
  const el = grid({
    label,
    onToggle: (code, cell) => { if (painting === null) set(code, cell, !selected.has(code)); },
  });
  el.addEventListener('pointerdown', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell || e.pointerType !== 'mouse') return;
    painting = !selected.has(cell.dataset.code);
    set(cell.dataset.code, cell, painting);
    e.preventDefault();
  });
  el.addEventListener('pointerover', (e) => {
    const cell = e.target.closest('.cell');
    if (painting !== null && cell) set(cell.dataset.code, cell, painting);
  });
  const stop = () => { setTimeout(() => { painting = null; }, 0); };
  window.addEventListener('pointerup', stop);
  return {
    el,
    selected,
    reset() {
      for (const cell of el.querySelectorAll('.cell')) set(cell.dataset.code, cell, false);
    },
  };
}

// Comparaison d'une grille coloriée avec une liste : cases oubliées et cases en trop.
export function compare(selected, target) {
  const missing = [...target.set].filter((c) => !selected.has(c));
  const extra = [...selected].filter((c) => !target.set.has(c));
  return { missing, extra, errors: missing.length + extra.length };
}

export function correctionGrid(selected, target) {
  return grid({
    small: true,
    label: 'Correction',
    classFor: (code) => {
      const want = target.set.has(code);
      const got = selected.has(code);
      if (want && got) return 'on';
      if (want) return 'missing';
      if (got) return 'extra';
      return '';
    },
  });
}

export const correctionLegend = () => legend([['on', 'juste'], ['missing', 'oubliée'], ['extra', 'en trop']]);
