// Exercice : nommer les nuts d'un tableau de 5 cartes (C1.4).
// Le tutoriel propose une série de 20 tableaux.
import { h } from '../dom.js';

const lcFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
import { deck, shuffle, cardRow } from '../cards.js';
import { CLASSES, classOf, className, describe } from '../evaluator.js';
import { nutsOf } from '../analysis.js';

const RANK_LABELS = [
  [14, 'As'], [13, 'Roi'], [12, 'Dame'], [11, 'Valet'],
  [10, '10'], [9, '9'], [8, '8'], [7, '7'], [6, '6'], [5, '5'], [4, '4'], [3, '3'], [2, '2'],
];
const rankLabel = (r) => RANK_LABELS.find(([v]) => v === r)[1];
const nf = (x) => x.toLocaleString('fr-FR');

export default {
  id: 'nommer-nuts',
  title: 'Nommer les nuts',
  competences: 'C1.4',
  summary: 'Un tableau de 5 cartes : nommez la meilleure main qu\'un joueur pourrait avoir, quelles que soient ses cartes.',
  settings: [
    { id: 'series', label: 'Série', default: '20',
      options: [
        { value: '20', label: '20 tableaux' },
        { value: '10', label: '10 tableaux' },
        { value: '0', label: 'Sans fin' },
      ] },
    { id: 'detail', label: 'Précision', default: 'class',
      options: [
        { value: 'class', label: 'Combinaison seulement' },
        { value: 'rank', label: 'Combinaison et hauteur' },
      ] },
  ],

  create(rand, settings, report) {
    const series = Number(settings.series);
    const withRank = settings.detail === 'rank';
    let root;
    let index = 0;
    let good = 0;
    let board;
    let nuts;
    let result;

    function next() {
      if (series && index >= series) { index = 0; good = 0; }
      board = shuffle(deck(), rand).slice(0, 5);
      nuts = nutsOf(board);
      result = null;
      show();
    }

    function formView() {
      const message = h('p', { class: 'form-message', role: 'alert' });
      const classSelect = h('select', { 'aria-label': 'Combinaison des nuts' },
        h('option', { value: '' }, 'Choisir…'),
        CLASSES.map((c, k) => h('option', { value: c.id }, `${k + 1} · ${c.name}`)));
      const rankSelect = withRank ? h('select', { 'aria-label': 'Hauteur' },
        h('option', { value: '' }, 'Choisir…'),
        RANK_LABELS.map(([v, l]) => h('option', { value: String(v) }, l))) : null;

      const validate = () => {
        if (!classSelect.value || (rankSelect && !rankSelect.value)) {
          message.textContent = 'Répondez avant de valider.';
          return;
        }
        const okClass = classOf(nuts.score) === classSelect.value;
        const okRank = rankSelect ? Number(rankSelect.value) === nuts.score[1] : true;
        result = { ok: okClass && okRank, okClass, okRank, cls: classSelect.value, rank: rankSelect && Number(rankSelect.value) };
        index++;
        if (result.ok) good++;
        report(result.ok);
        show();
      };
      setTimeout(() => classSelect.focus(), 0);
      return h('div', { class: 'announce' },
        h('label', { class: 'setting' }, 'Les nuts sont…', classSelect),
        rankSelect ? h('label', { class: 'setting' }, 'Hauteur', rankSelect) : null,
        h('button', { type: 'button', class: 'btn', onclick: validate }, 'Valider'),
        message);
    }

    function resultView() {
      const r = result;
      const answer = describe(nuts.score);
      const mine = r.rank ? `${className(r.cls)}, hauteur ${rankLabel(r.rank)}` : className(r.cls);
      const example = nuts.holes[Math.floor(rand() * nuts.holes.length)];
      const allShare = nuts.holes.length === nuts.total;
      const done = series && index >= series;
      const btn = h('button', { type: 'button', class: 'btn', onclick: next },
        done ? 'Nouvelle série' : 'Tableau suivant →');
      setTimeout(() => btn.focus(), 0);
      return h('div', {},
        h('div', { class: `feedback ${r.ok ? 'ok' : 'ko'}` },
          h('p', {}, r.ok ? `✓ Les nuts : ${lcFirst(answer)}.` : `✗ Vous avez répondu « ${mine} » : les nuts sont ${lcFirst(answer)}.`),
          allShare
            ? h('p', {}, 'Le tableau fait lui-même les nuts : tous les joueurs partagent.')
            : h('div', { class: 'review-hand' },
              h('span', {}, 'Par exemple avec'), cardRow(example, 'xs'),
              h('span', {}, nuts.holes.length > 1
                ? `· ${nf(nuts.holes.length)} combos sur ${nf(nuts.total)} font les nuts.`
                : `· c'est le seul combo sur ${nf(nuts.total)} qui fait les nuts.`))),
        done ? h('p', { class: 'series-end' }, `Série terminée : ${good} sur ${series}.`) : null,
        h('div', { class: 'practice-actions' }, btn));
    }

    function show() {
      const position = series ? `Tableau ${Math.min(index + (result ? 0 : 1), series)} sur ${series}` : null;
      root.replaceChildren(
        h('section', { class: 'block' },
          position ? h('div', { class: 'progress-line' },
            h('span', {}, position),
            h('span', { class: 'progress-bar' }, h('span', { style: `width:${(Math.min(index + (result ? 0 : 1), series) / series) * 100}%` }))) : null,
          h('div', { class: 'board' }, h('div', { class: 'board-label' }, 'Tableau'), cardRow(board))),
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
