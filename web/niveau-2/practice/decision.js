// Exercice : quelle décision ? Une position, une main, une action à choisir.
// Réglé sur le sous-niveau choisi (étape de « Pour retenir la grille », C2.2 ; settings.step, donné par
// js/shell.js) : la correction suit la stratégie de cette étape ; une réponse juste à une étape
// suivante est acceptée « en avance » (grade, strategy.js).
import { h } from '../../js/dom.js';
import { pick } from '../../js/cards.js';
import { cardsFor } from '../ranges.js';
import { FULL, STEPS, decide, grade, severity, actionLabel } from '../strategy.js';
import { makeSituation, handFor } from '../situations.js';
import { situationView, actionButtons } from '../hand.js';

const TYPES = {
  all: ['open', 'open', 'open', 'open', 'bb', 'vsRaise', 'vsRaise', 'vsRaise', 'vs3bet', 'squeeze', 'vs4bet'],
  open: ['open', 'open', 'open', 'bb'],
  raise: ['vsRaise', 'vsRaise', 'vsRaise', 'vs3bet', 'squeeze', 'squeeze', 'vs4bet'],
};

export default {
  id: 'decision',
  title: 'Quelle décision ?',
  competences: 'C2.1 à C2.3',
  summary: 'Une position, deux cartes : relancer, suivre, checker, tapis ou se coucher, selon la stratégie de votre sous-niveau. Passez au suivant après 19 sur 20.',
  settings: [
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
    const step = settings.step ?? FULL;
    const length = Number(settings.series);
    let root;
    let n = 0;
    let good = 0;
    let early = 0;                // réponses justes « en avance » (grade, strategy.js)
    let sit;
    let code;
    let cards;
    let result;

    function next() {
      if (length && n >= length) { end(); return; }
      sit = makeSituation(pick(TYPES[settings.kind], rand), rand, step);
      code = handFor(sit, rand, step);
      cards = cardsFor(code, rand);
      result = null;
      show();
    }

    function answer(action) {
      if (result) return;
      const d = decide(sit, code, step);
      // Juste au sous-niveau, ou juste plus tard (« en avance ») : les deux comptent.
      const { ok, ahead } = grade((s) => decide(sit, code, s).action === action, step);
      n++;
      if (ok) good++;
      if (ahead !== null) early++;
      result = { action, ok, ahead, d, grave: ok ? null : severity(sit, code, action) };
      report(ok);
      show();
    }

    function feedback() {
      const r = result;
      const btn = h('button', { type: 'button', class: 'btn', onclick: next },
        length && n >= length ? 'Voir le bilan →' : 'Situation suivante →');
      setTimeout(() => btn.focus(), 0);
      if (r.ahead !== null) {
        return h('div', {},
          h('div', { class: 'feedback ok' },
            h('p', {}, h('strong', {}, `✓ ${actionLabel(sit, r.action)} : juste, en avance.`)),
            h('p', {}, `C'est la réponse à partir du sous-niveau ${STEPS[r.ahead].code}. ${decide(sit, code, r.ahead).why}`),
            h('p', { class: 'meta' }, `À votre sous-niveau (${STEPS[step].code}), la grille dit : ${actionLabel(sit, r.d.action)}. ${r.d.why}`)),
          h('div', { class: 'practice-actions' }, btn));
      }
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
      const again = h('button', { type: 'button', class: 'btn', onclick: () => { n = 0; good = 0; early = 0; next(); } }, 'Nouvelle série');
      setTimeout(() => again.focus(), 0);
      root.replaceChildren(h('section', { class: `result ${passed ? 'ok' : 'ko'}` },
        h('p', { class: 'score' }, `${good} / ${length}`),
        early ? h('p', { class: 'meta' }, `Dont ${early} réponse${early > 1 ? 's' : ''} en avance, justes à un sous-niveau plus avancé.`) : null,
        h('p', {}, passed
          ? (step < FULL ? 'Sous-niveau réussi : passez au suivant.' : 'Grille maîtrisée : vous êtes prêt pour le test 2.')
          : 'Il faut 19 sur 20 : relisez la grille de ce sous-niveau et refaites une série.'),
        early >= 3 && step < FULL ? h('p', {}, 'Vous connaissez déjà une partie de la suite : essayez un sous-niveau plus avancé.') : null,
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
