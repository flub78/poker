// Test 1 : déroulement d'une main (C1.1, C1.2).
// Remettre les étapes dans l'ordre, puis répondre à 5 questions tirées d'une banque.
import { h } from '../dom.js';
import { shuffle } from '../cards.js';

const STEPS = [
  'Blinds : la petite et la grosse blind sont posées',
  'Préflop : 2 cartes à chaque joueur, premier tour d\'enchères',
  'Flop : 3 cartes communes, tour d\'enchères',
  'Turn : 1 carte commune, tour d\'enchères',
  'River : 1 dernière carte commune, dernier tour d\'enchères',
  'Abattage : les joueurs restants montrent leurs cartes',
];

const BANK = [
  { q: 'Qui pose la petite blind ?', a: 'Le joueur à gauche du bouton',
    wrong: ['Le joueur qui a le bouton', 'Le joueur à droite du bouton', 'Le dernier gagnant'] },
  { q: 'Qui pose la grosse blind ?', a: 'Le deuxième joueur à gauche du bouton',
    wrong: ['Le joueur qui a le bouton', 'Le joueur à gauche du bouton', 'Le joueur à droite du bouton'] },
  { q: 'Qui parle en premier avant le flop ?', a: 'Le joueur à gauche de la grosse blind',
    wrong: ['La petite blind', 'Le bouton', 'La grosse blind'] },
  { q: 'Qui parle en premier au flop, au turn et à la river ?', a: 'Le premier joueur encore en jeu à gauche du bouton',
    wrong: ['Le joueur à gauche de la grosse blind', 'Le bouton', 'Le joueur qui a misé en dernier'] },
  { q: 'Combien de cartes communes sont retournées au flop ?', a: '3', wrong: ['1', '2', '5'] },
  { q: 'Avec combien de cartes forme-t-on sa main finale ?', a: 'Les 5 meilleures parmi ses 2 cartes et les 5 cartes communes',
    wrong: ['Ses 2 cartes et les 3 cartes du flop uniquement', 'Les 7 cartes', 'Au moins une de ses 2 cartes et 4 cartes communes'] },
  { q: 'Que se passe-t-il si tous les adversaires se couchent après votre mise ?', a: 'Vous gagnez le pot sans montrer vos cartes',
    wrong: ['On retourne quand même toutes les cartes communes', 'Vous devez montrer vos cartes pour gagner', 'Le pot est reporté à la main suivante'] },
  { q: 'Après chaque main, que devient le bouton ?', a: 'Il se déplace d\'une place vers la gauche',
    wrong: ['Il reste au même joueur', 'Il va au gagnant de la main', 'Il se déplace d\'une place vers la droite'] },
  { q: 'Peut-on faire parole (check) si un adversaire a déjà misé dans ce tour ?', a: 'Non : il faut suivre, relancer ou se coucher',
    wrong: ['Oui, toujours', 'Oui, seulement au flop', 'Oui, si on a la grosse blind'] },
  { q: 'En No-Limit, combien peut-on miser au maximum ?', a: 'Tous les jetons qu\'on a devant soi (son tapis)',
    wrong: ['Le montant du pot', 'Deux fois la grosse blind', 'La mise précédente'] },
];

export default {
  id: 'deroulement',
  code: 'Test 1',
  title: 'Déroulement d\'une main',
  competences: 'C1.1, C1.2',
  rule: 'Ordre des étapes correct et 5 bonnes réponses sur 5',

  create(rand) {
    const order = shuffle(STEPS.map((_, i) => i), rand);
    const questions = shuffle(BANK, rand).slice(0, 5).map((item) => ({
      ...item, options: shuffle([item.a, ...item.wrong], rand),
    }));
    const answers = new Array(questions.length).fill(null);
    let listEl;

    function renderList() {
      listEl.replaceChildren(...order.map((stepIdx, pos) => h('li', { class: 'order-item' },
        h('span', { class: 'order-num' }, pos + 1),
        h('span', { class: 'order-text' }, STEPS[stepIdx]),
        h('span', { class: 'order-buttons' },
          h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Monter', disabled: pos === 0,
            onclick: () => { [order[pos - 1], order[pos]] = [order[pos], order[pos - 1]]; renderList(); } }, '↑'),
          h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Descendre', disabled: pos === order.length - 1,
            onclick: () => { [order[pos + 1], order[pos]] = [order[pos], order[pos + 1]]; renderList(); } }, '↓')),
      )));
    }

    return {
      seedInfo: null,
      render(root) {
        listEl = h('ol', { class: 'order-list' });
        renderList();
        root.append(
          h('section', { class: 'block' },
            h('h3', {}, '1. Remettez les étapes d\'une main dans l\'ordre'),
            h('p', { class: 'hint' }, 'Utilisez les flèches pour déplacer chaque étape.'),
            listEl),
          h('section', { class: 'block' },
            h('h3', {}, '2. Répondez aux questions'),
            questions.map((q, qi) => h('fieldset', { class: 'qcm' },
              h('legend', {}, `${qi + 1}. ${q.q}`),
              q.options.map((opt) => h('label', { class: 'choice' },
                h('input', { type: 'radio', name: `q${qi}`, value: opt, onchange: () => { answers[qi] = opt; } }),
                h('span', {}, opt))))),
          ),
        );
      },
      missing() {
        const n = answers.filter((a) => a === null).length;
        return n ? `Il reste ${n} question${n > 1 ? 's' : ''} sans réponse.` : null;
      },
      grade() {
        const orderOk = order.every((stepIdx, pos) => stepIdx === pos);
        const qOk = questions.map((q, qi) => answers[qi] === q.a);
        const score = (orderOk ? 1 : 0) + qOk.filter(Boolean).length;
        const items = [
          { ok: orderOk, title: 'Ordre des étapes',
            body: orderOk ? 'Correct.' : h('div', {}, 'L\'ordre correct est :', h('ol', {}, STEPS.map((s) => h('li', {}, s)))) },
          ...questions.map((q, qi) => ({
            ok: qOk[qi], title: q.q,
            body: qOk[qi] ? q.a : h('div', {}, h('div', {}, `Votre réponse : ${answers[qi]}`), h('div', { class: 'good' }, `Bonne réponse : ${q.a}`)),
          })),
        ];
        return { score, total: 1 + questions.length, passed: score === 1 + questions.length, items };
      },
    };
  },
};
