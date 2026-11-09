// Onglet Aide-mémoire : la grille coloriée par position, les listes, la conduite face à une relance
// et les étapes de mémorisation. Imprimable.
import { h } from '../js/dom.js';
import { UTG, CO, BTN, RERAISE, CALL_IP, CALL_OOP, CALL_3BET, minPosition } from './strategy.js';
import { percent } from './ranges.js';
import { grid, legend } from './grid.js';

const table = (head, rows) => h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
  h('thead', {}, h('tr', {}, head.map((c) => h('th', { scope: 'col' }, c)))),
  h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, c)))))));

export function renderAide(root) {
  root.append(
    h('section', { class: 'block' },
      h('h3', {}, 'Personne n\'a relancé : la grille'),
      h('p', { class: 'hint' }, 'Chaque case est coloriée selon la première position où l\'on relance la main. Ce qu\'on joue UTG, on le joue aussi plus loin.'),
      legend([['pos-UTG', `UTG et MP (${percent(UTG)})`], ['pos-CO', `+ CO et SB (${percent(CO)})`], ['pos-BTN', `+ BTN (${percent(BTN)})`], ['', 'Se coucher']]),
      grid({ classFor: (code) => `pos-${minPosition(code)}`, label: 'Grille des mains relancées selon la position' })),
    h('section', { class: 'block' },
      h('h3', {}, 'Les listes'),
      table(['Position', 'Relancer avec', 'Part des mains'], [
        ['UTG / MP', UTG.text, percent(UTG)],
        ['CO', CO.text, percent(CO)],
        ['BTN', BTN.text, percent(BTN)],
        ['SB', 'comme le CO', percent(CO)],
        ['BB (des joueurs ont suivi)', 'comme le CO ; sinon checker', '—'],
      ]),
      h('p', { class: 'hint' }, 'On ne suit jamais quand personne n\'a relancé (pas de limp).')),
    h('section', { class: 'block' },
      h('h3', {}, 'Face à une relance'),
      table(['Situation', 'Sur-relancer', 'Suivre', 'Se coucher'], [
        ['Une relance avant vous, hors des blinds (en position)', RERAISE.text, CALL_IP.text, 'le reste'],
        ['Une relance avant vous, en SB ou BB (hors position)', RERAISE.text, CALL_OOP.text, 'le reste'],
        ['Vous aviez relancé, un joueur sur-relance', `${RERAISE.text} (4-bet)`, CALL_3BET.text, 'le reste, AQ compris'],
        ['Une relance puis une sur-relance avant vous', `${RERAISE.text} (4-bet)`, 'rien', 'le reste, JJ et AJ compris'],
      ])),
    h('section', { class: 'block' },
      h('h3', {}, 'Retenir la grille, étape par étape'),
      h('p', { class: 'hint' }, 'Chaque étape est une stratégie complète, plus serrée que la grille finale. Passez à la suivante après 19 sur 20 à l\'exercice « Quelle décision ? ».'),
      table(['Étape', 'Ce qu\'on retient'], [
        ['0 · Le filet', 'Partout la liste UTG. Jamais de limp. Face à une relance : QQ+ et AK sur-relancent, le reste se couche.'],
        ['1 · Le bouton', '« Toute paire, tout As, deux cartes de 10 ou plus, et K9, T9, 98, 87, 76 assortis. »'],
        ['2 · Paires et As', 'Paires : 7, 5, 2. As dépareillés : J, T, tous. As assortis : T, tous, tous (UTG, CO, BTN). SB = CO.'],
        ['3 · Le reste du CO', 'KJ et QJ ; assortis : KT, QT, JT, K9, T9.'],
        ['4 · Suivre une relance', 'En position : JJ à 66, AQ, AJs, KQs. Aux blinds : JJ à 88, AQ. Sur-relancé : JJ et TT suivent.'],
        ['5 · De mémoire', 'Colorier la grille 13 × 13 sans modèle.'],
      ])),
    h('div', { class: 'practice-actions no-print' },
      h('button', { type: 'button', class: 'btn secondary', onclick: () => window.print() }, 'Imprimer l\'aide-mémoire')),
  );
}
