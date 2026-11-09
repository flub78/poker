// Exercice : quelle décision ? Une position, une main, une action à choisir.
// Réglé sur une étape de « Pour retenir la grille » (C2.2) : la correction suit la stratégie de cette étape.
import { h } from '../../js/dom.js';
import { pick } from '../../js/cards.js';
import { cardsFor } from '../ranges.js';
import { STEPS, FULL, decide, severity, actionLabel } from '../strategy.js';
import { makeSituation, handFor } from '../situations.js';
import { situationView, actionButtons } from '../hand.js';

const TYPES = {
  all: ['open', 'open', 'open', 'open', 'bb', 'vsRaise', 'vsRaise', 'vsRaise', 'vs3bet', 'squeeze'],
  open: ['open', 'open', 'open', 'bb'],
  raise: ['vsRaise', 'vsRaise', 'vsRaise', 'vs3bet', 'squeeze'],
};

export default {
  id: 'decision',
  title: 'Quelle décision ?',
  competences: 'C2.1 à C2.3',
  summary: 'Une position, deux cartes : relancer, suivre, checker ou se coucher. Réglez l\'étape où vous en êtes ; passez à la suivante après 19 sur 20.',
  settings: [
    { id: 'step', label: 'Étape', default: '0', options: STEPS },
    { id: 'kind', label: 'Situations', default: 'all',
      options: [
        { value: 'all', label: 'Toutes' },
        { value: 'open', label: 'Personne n\'a relancé' },
        { value: 'raise', label: 'Face à une relance' },
      ] },
    { id: 'series', label: 'Série', default: '20',
      options: [
        { value: '20', label: 'Série de 20' },
        { value: '0', label: 'Sans fin' },
      ] },
  ],

  create(rand, settings, report) {
    const step = Number(settings.step);
    const length = Number(settings.series);
    let root;
    let n = 0;
    let good = 0;
    let sit;
    let code;
    let cards;
    let result;

    function next() {
      if (length && n >= length) { end(); return; }
      sit = makeSituation(pick(TYPES[settings.kind], rand), rand);
      code = handFor(sit, rand, step);
      cards = cardsFor(code, rand);
      result = null;
      show();
    }

    function answer(action) {
      if (result) return;
      const d = decide(sit, code, step);
      const ok = action === d.action;
      n++;
      if (ok) good++;
      result = { action, ok, d, grave: ok ? null : severity(sit, code, action) };
      report(ok);
      show();
    }

    function feedback() {
      const r = result;
      const btn = h('button', { type: 'button', class: 'btn', onclick: next },
        length && n >= length ? 'Voir le bilan →' : 'Situation suivante →');
      setTimeout(() => btn.focus(), 0);
      const fullNote = step < FULL && decide(sit, code, FULL).action !== r.d.action
        ? h('p', { class: 'meta' }, `Avec la grille complète, la réponse serait : ${actionLabel(sit, decide(sit, code, FULL).action)}.`)
        : null;
      return h('div', {},
        h('div', { class: `feedback ${r.ok ? 'ok' : 'ko'}` },
          h('p', {}, h('strong', {}, r.ok ? `✓ ${actionLabel(sit, r.d.action)}.` : `✗ Il fallait : ${actionLabel(sit, r.d.action)}.`),
            r.ok ? '' : ` Erreur ${r.grave}.`),
          h('p', {}, r.d.why),
          fullNote),
        h('div', { class: 'practice-actions' }, btn));
    }

    function show() {
      const progress = length ? h('p', { class: 'meta' }, `Situation ${Math.min(n + (result ? 0 : 1), length)} sur ${length} · ${good} juste${good > 1 ? 's' : ''}`) : null;
      root.replaceChildren(
        h('section', { class: 'block' }, progress, situationView(sit, cards)),
        h('section', { class: 'block' }, result ? feedback() : actionButtons(sit, answer).el),
      );
    }

    function end() {
      const passed = good >= length - 1;
      const again = h('button', { type: 'button', class: 'btn', onclick: () => { n = 0; good = 0; next(); } }, 'Nouvelle série');
      setTimeout(() => again.focus(), 0);
      root.replaceChildren(h('section', { class: `result ${passed ? 'ok' : 'ko'}` },
        h('p', { class: 'score' }, `${good} / ${length}`),
        h('p', {}, passed
          ? (step < FULL ? 'Étape réussie : passez à l\'étape suivante.' : 'Grille maîtrisée : vous êtes prêt pour le test 2.')
          : 'Il faut 19 sur 20 : relisez la grille de cette étape et refaites une série.'),
        h('div', { class: 'practice-actions' }, again)));
    }

    return {
      render(el) {
        root = el;
        next();
      },
    };
  },
};
