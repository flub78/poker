// Exercice : seuils éclair. Des questions courtes sur les limites de la grille,
// pour retenir les suites de chiffres (paires 7, 5, 2 ; As dépareillés J, T, tous…).
import { h } from '../../js/dom.js';
import { shuffle } from '../../js/cards.js';

const Q = [
  { q: 'UTG : plus petite paire qu\'on relance ?', a: '77', o: ['99', '88', '77', '55'] },
  { q: 'CO : plus petite paire qu\'on relance ?', a: '55', o: ['77', '66', '55', '22'] },
  { q: 'BTN : plus petite paire qu\'on relance ?', a: '22', o: ['66', '55', '44', '22'] },
  { q: 'UTG : plus petit As dépareillé qu\'on relance ?', a: 'AJ', o: ['AQ', 'AJ', 'AT', 'A9'] },
  { q: 'CO : plus petit As dépareillé qu\'on relance ?', a: 'AT', o: ['AJ', 'AT', 'A9', 'A2'] },
  { q: 'BTN : plus petit As dépareillé qu\'on relance ?', a: 'A2', o: ['AT', 'A8', 'A5', 'A2'] },
  { q: 'UTG : plus petit As assorti qu\'on relance ?', a: 'ATs', o: ['AJs', 'ATs', 'A9s', 'A2s'] },
  { q: 'CO : plus petit As assorti qu\'on relance ?', a: 'A2s', o: ['ATs', 'A9s', 'A5s', 'A2s'] },
  { q: 'UTG : quelle main sans As relance-t-on dépareillée ?', a: 'KQ', o: ['KQ', 'KJ', 'QJ', 'Aucune'] },
  { q: 'CO : quelle main n\'est PAS relancée dépareillée ?', a: 'KT', o: ['KQ', 'KJ', 'QJ', 'KT'] },
  { q: 'BTN : laquelle de ces assorties ne relance-t-on PAS ?', a: '65s', o: ['T9s', '87s', '76s', '65s'] },
  { q: 'BTN : laquelle de ces mains relance-t-on ?', a: 'K9s', o: ['K9s', 'K9', 'Q9', 'J9'] },
  { q: 'La SB relance la même liste que…', a: 'le CO', o: ['UTG', 'le CO', 'le BTN', 'personne : elle complète'] },
  { q: 'Face à une relance : quelles mains sur-relancent ?', a: 'QQ+, AK', o: ['TT+, AQ+', 'QQ+, AK', 'KK+', 'JJ+, AK'] },
  { q: 'Face à une relance, en position : plus petite paire qu\'on suit ?', a: '66', o: ['88', '77', '66', '22'] },
  { q: 'Face à une relance, aux blinds : plus petite paire qu\'on suit ?', a: '88', o: ['TT', '88', '66', '22'] },
  { q: 'Face à une relance, en position : lequel de ces As dépareillés suit ?', a: 'AQ', o: ['AQ', 'AJ', 'AT', 'Aucun'] },
  { q: 'Vous aviez relancé, on vous sur-relance : que fait AQ ?', a: 'Se coucher', o: ['Relancer encore', 'Suivre', 'Se coucher'] },
  { q: 'Vous aviez relancé, on vous sur-relance : que fait JJ ?', a: 'Suivre', o: ['Relancer encore', 'Suivre', 'Se coucher'] },
  { q: 'Relance puis sur-relance avant vous : que fait JJ ?', a: 'Se coucher', o: ['Relancer encore', 'Suivre', 'Se coucher'] },
  { q: 'Personne n\'a relancé, vous n\'êtes pas en BB : quand suit-on (limp) ?', a: 'Jamais', o: ['Avec les petites paires', 'Avec les assorties', 'Au bouton', 'Jamais'] },
];

export default {
  id: 'seuils',
  title: 'Seuils éclair',
  competences: 'C2.2, C2.3',
  summary: 'Questions courtes sur les limites de la grille : plus petite paire, plus petit As, mains à suivre face à une relance.',
  settings: [],

  create(rand, settings, report) {
    let root;
    let deck = [];
    let item;
    let answer = null;

    function next() {
      if (!deck.length) deck = shuffle(Q, rand);
      item = deck.pop();
      answer = null;
      show();
    }

    function show() {
      const options = item.o.map((o) => h('button', {
        type: 'button',
        class: `option action ${answer && o === item.a ? 'right' : ''} ${answer === o && o !== item.a ? 'wrong' : ''}`.trim(),
        disabled: answer !== null,
        onclick: () => { answer = o; report(o === item.a); show(); },
      }, o));
      const btn = answer ? h('button', { type: 'button', class: 'btn', onclick: next }, 'Question suivante →') : null;
      if (btn) setTimeout(() => btn.focus(), 0);
      root.replaceChildren(h('section', { class: 'block' },
        h('h3', {}, item.q),
        h('div', { class: 'action-row' }, options),
        answer ? h('div', { class: `feedback ${answer === item.a ? 'ok' : 'ko'}` },
          h('p', {}, answer === item.a ? '✓ Juste.' : `✗ Réponse : ${item.a}.`)) : null,
        btn ? h('div', { class: 'practice-actions' }, btn) : null));
    }

    return {
      render(el) {
        root = el;
        next();
      },
    };
  },
};
