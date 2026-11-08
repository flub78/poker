// Exercice : annoncer les étapes pendant la distribution (C1.1, C1.2).
// Le donneur distribue une main complète. Avant chaque étape, le joueur l'annonce
// et, selon les options, dit qui pose la petite blind, qui parle en premier et qui gagne.
import { h } from '../dom.js';

const lcFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
import { deck, shuffle, cardRow, cardImg } from '../cards.js';
import { evaluate, compare, describe } from '../evaluator.js';

const STEPS = [
  { id: 'blinds', name: 'Blinds', done: 'La petite et la grosse blind sont posées.' },
  { id: 'preflop', name: 'Préflop', done: 'Chaque joueur reçoit 2 cartes, puis premier tour d\'enchères.' },
  { id: 'flop', name: 'Flop', done: '3 cartes communes, puis tour d\'enchères.' },
  { id: 'turn', name: 'Turn', done: '1 carte commune, puis tour d\'enchères.' },
  { id: 'river', name: 'River', done: '1 dernière carte commune, puis dernier tour d\'enchères.' },
  { id: 'showdown', name: 'Abattage', done: 'Les joueurs montrent leurs cartes : la meilleure main gagne le pot.' },
];

const seatName = (i) => `Joueur ${i + 1}`;

export default {
  id: 'annonces',
  title: 'Annoncer les étapes',
  competences: 'C1.1, C1.2',
  summary: 'Le donneur distribue une main. Avant chaque étape, annoncez-la et répondez à la question qui l\'accompagne.',
  settings: [
    { id: 'players', label: 'Joueurs', default: '6',
      options: [3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} joueurs` })) },
    { id: 'mode', label: 'Questions', default: 'full',
      options: [
        { value: 'step', label: 'Nom de l\'étape seulement' },
        { value: 'speak', label: 'Étape et qui parle' },
        { value: 'full', label: 'Étape, qui parle et qui gagne' },
      ] },
  ],

  create(rand, settings, report) {
    const n = Number(settings.players);
    const mode = settings.mode;
    let root;
    let hand;

    function newHand() {
      const d = shuffle(deck(), rand);
      const button = Math.floor(rand() * n);
      // une carte à la fois, en faisant deux fois le tour de la table
      const hole = Array.from({ length: n }, (_, i) => [d[i], d[i + n]]);
      const board = d.slice(2 * n, 2 * n + 5);
      const scores = hole.map((hc) => evaluate([...board, ...hc]));
      const top = scores.reduce((a, b) => (compare(a, b) >= 0 ? a : b));
      hand = {
        button, hole, board, scores,
        winners: scores.map((s, i) => (compare(s, top) === 0 ? i : -1)).filter((i) => i >= 0),
        sb: (button + 1) % n,
        bb: (button + 2) % n,
        utg: (button + 3) % n,
        step: 0,
        shown: { blinds: false, hole: false, board: 0, showdown: false },
        menu: shuffle(STEPS, rand),
        result: null,
      };
      show();
    }

    // Question qui accompagne l'annonce de l'étape, ou null.
    function question(stepId) {
      if (mode === 'step') return null;
      const seats = Array.from({ length: n }, (_, i) => ({ value: String(i), label: seatName(i) }));
      if (stepId === 'blinds') {
        return { label: 'Qui pose la petite blind ?', options: seats, answer: String(hand.sb),
          why: `la petite blind est le joueur à gauche du bouton : ${seatName(hand.sb)}` };
      }
      if (stepId === 'preflop') {
        return { label: 'Qui parle en premier ?', options: seats, answer: String(hand.utg),
          why: `avant le flop, le joueur à gauche de la grosse blind parle en premier : ${seatName(hand.utg)}` };
      }
      if (stepId === 'showdown') {
        if (mode !== 'full') return null;
        const split = hand.winners.length > 1;
        return { label: 'Qui gagne le pot ?', options: [...seats, { value: 'split', label: 'Partage du pot' }],
          answer: split ? 'split' : String(hand.winners[0]),
          why: split
            ? `${hand.winners.map(seatName).join(' et ')} ont la même main (${lcFirst(describe(hand.scores[hand.winners[0]]))}) : ils partagent le pot`
            : `${seatName(hand.winners[0])} gagne avec ${lcFirst(describe(hand.scores[hand.winners[0]]))}` };
      }
      return { label: 'Qui parle en premier ?', options: seats, answer: String(hand.sb),
        why: `après le flop, le premier joueur encore en jeu à gauche du bouton parle : la petite blind, ${seatName(hand.sb)}` };
    }

    function apply(stepId) {
      const s = hand.shown;
      if (stepId === 'blinds') s.blinds = true;
      else if (stepId === 'preflop') s.hole = true;
      else if (stepId === 'flop') s.board = 3;
      else if (stepId === 'turn') s.board = 4;
      else if (stepId === 'river') s.board = 5;
      else s.showdown = true;
    }

    function seatView(i) {
      const s = hand.shown;
      const badges = [];
      if (i === hand.button) badges.push(h('span', { class: 'badge dealer' }, 'BTN'));
      if (s.blinds && i === hand.sb) badges.push(h('span', { class: 'badge' }, 'SB'));
      if (s.blinds && i === hand.bb) badges.push(h('span', { class: 'badge' }, 'BB'));
      const winner = s.showdown && hand.winners.includes(i);
      return h('li', { class: `seat${winner ? ' winner' : ''}` },
        h('div', { class: 'seat-name' }, seatName(i), badges),
        s.hole ? cardRow(hand.hole[i], 'sm') : h('div', { class: 'seat-empty' }, 'Pas encore de cartes'),
        s.showdown ? h('div', { class: 'seat-hand' }, describe(hand.scores[i])) : null);
    }

    function boardView() {
      const shown = hand.board.slice(0, hand.shown.board);
      const empty = Array.from({ length: 5 - shown.length }, () => h('span', { class: 'card empty', 'aria-hidden': 'true' }));
      return h('div', { class: 'board' },
        h('div', { class: 'board-label' }, 'Tableau'),
        h('div', { class: 'card-row' }, shown.map((c) => cardImg(c)), empty));
    }

    function formView() {
      const step = STEPS[hand.step];
      const q = question(step.id);
      const message = h('p', { class: 'form-message', role: 'alert' });
      const stepSelect = h('select', { 'aria-label': 'Étape à annoncer' },
        h('option', { value: '' }, 'Choisir…'),
        hand.menu.map((st) => h('option', { value: st.id }, st.name)));
      const qSelect = q ? h('select', { 'aria-label': q.label },
        h('option', { value: '' }, 'Choisir…'),
        q.options.map((o) => h('option', { value: o.value }, o.label))) : null;

      const announce = () => {
        if (!stepSelect.value || (qSelect && !qSelect.value)) {
          message.textContent = 'Répondez à toutes les questions avant d\'annoncer.';
          return;
        }
        const okStep = stepSelect.value === step.id;
        const okQ = q ? qSelect.value === q.answer : true;
        const said = STEPS.find((st) => st.id === stepSelect.value).name;
        const lines = [
          okStep ? `✓ ${step.name} : ${step.done}` : `✗ Vous avez annoncé « ${said} » : c'était « ${step.name} ». ${step.done}`,
        ];
        if (q) {
          const mine = q.options.find((o) => o.value === qSelect.value).label;
          lines.push(okQ ? `✓ ${q.label} ${mine} : ${q.why}.` : `✗ ${q.label} Vous avez répondu ${mine} ; ${q.why}.`);
        }
        hand.result = { ok: okStep && okQ, lines };
        apply(step.id);
        report(okStep && okQ);
        show();
      };

      return h('div', { class: 'announce' },
        h('label', { class: 'setting' }, `Étape ${hand.step + 1} sur ${STEPS.length} · qu'annoncez-vous ?`, stepSelect),
        q ? h('label', { class: 'setting' }, q.label, qSelect) : null,
        h('button', { type: 'button', class: 'btn', onclick: announce }, 'Annoncer'),
        message);
    }

    function resultView() {
      const last = hand.step === STEPS.length - 1;
      const next = h('button', { type: 'button', class: 'btn', onclick: () => {
        if (last) { newHand(); return; }
        hand.step++;
        hand.result = null;
        show();
      } }, last ? 'Nouvelle main' : 'Étape suivante →');
      setTimeout(() => next.focus(), 0);
      return h('div', {},
        h('div', { class: `feedback ${hand.result.ok ? 'ok' : 'ko'}` }, hand.result.lines.map((l) => h('p', {}, l))),
        h('div', { class: 'practice-actions' }, next));
    }

    function show() {
      root.replaceChildren(
        h('section', { class: 'block' },
          h('p', { class: 'hint' }, `Le jeu tourne vers la gauche : Joueur 1 → Joueur 2 → … → ${seatName(n - 1)} → Joueur 1. Le bouton (BTN) est chez ${seatName(hand.button)}.`),
          h('ul', { class: 'seats' }, Array.from({ length: n }, (_, i) => seatView(i))),
          boardView()),
        h('section', { class: 'block' }, hand.result ? resultView() : formView()),
      );
    }

    return {
      render(el) {
        root = el;
        newHand();
      },
    };
  },
};
