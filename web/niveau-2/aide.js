// Onglet Aide-mémoire : les quatre règles du niveau 2 (cours, « Règles du niveau 2 »), dans l'ordre
// des niveaux de relance : la grille coloriée et la grille par famille, le tableau des relances,
// l'après-flop, puis les étapes de mémorisation. Imprimable.
import { h } from '../js/dom.js';
import {
  UTG, CO, BTN, RERAISE, CALL_IP, CALL_OOP, CALL_3BET, minPosition, FAMILIES, FAMILY_COLUMNS, STEPS,
} from './strategy.js';
import { percent } from './ranges.js';
import { grid, legend } from './grid.js';

const table = (head, rows) => h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
  h('thead', {}, h('tr', {}, head.map((c) => h('th', { scope: 'col' }, c)))),
  h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c, i) => (i === 0 ? h('th', { scope: 'row' }, c) : h('td', {}, c))))))));

// Ce que chaque sous-niveau ajoute (cours, « Pour retenir la grille », C2.2).
const STEP_ADDS = [
  'La colonne UTG à toutes les places. Face à une relance : QQ+ et AK seulement. Jamais de limp.',
  'Au BTN, sa colonne : « toute paire, tout As, deux cartes de 10 ou plus, et K9, T9, 98, 87, 76 assortis ».',
  'Au CO, en SB et en BB face à des limps, les lignes Paires et As de leur colonne : 55+, AT+, A2s+.',
  'Le reste de la colonne CO : KJ, QJ ; assortis : KT, K9, QT, JT, T9.',
  'La colonne « Suivre » du tableau des relances.',
  'Colorier la grille 13 × 13 sans modèle.',
];

export function renderAide(root) {
  root.append(
    h('section', { class: 'block' },
      h('h3', {}, '1. Personne n\'a relancé : la grille'),
      h('p', { class: 'hint' }, 'Chaque case est coloriée selon la première position où l\'on relance la main. Ce qu\'on joue UTG, on le joue aussi plus loin.'),
      legend([['pos-UTG', `UTG et MP (${percent(UTG)})`], ['pos-CO', `+ CO, SB et BB (${percent(CO)})`], ['pos-BTN', `+ BTN (${percent(BTN)})`], ['', 'Se coucher']]),
      grid({ classFor: (code) => `pos-${minPosition(code)}`, label: 'Grille des mains relancées selon la position' })),
    h('section', { class: 'block' },
      h('h3', {}, 'La même grille, une borne par famille'),
      table(['Famille', ...FAMILY_COLUMNS.map((c) => c.title)], [
        ...FAMILIES.map((f) => [f.name, ...f.cells.map((c) => c.text)]),
        ['Part des mains jouées', ...FAMILY_COLUMNS.map((c) => `environ ${percent(c.range)}`)],
      ]),
      h('p', { class: 'hint' }, 'De gauche à droite, les bornes ne font que descendre. La BB ne joue la colonne CO que si des joueurs ont seulement suivi ; sinon elle checke. Taille : 2,5 BB, plus 1 BB par joueur qui a seulement suivi. Jamais de limp.')),
    h('section', { class: 'block' },
      h('h3', {}, '2 et 3. Les relances'),
      table(['Situation', 'Relancer', 'Suivre', 'Se coucher'], [
        ['Une relance avant vous, hors des blinds (en position)', `${RERAISE.text} : 3-bet à 3 fois la relance`, CALL_IP.text, 'le reste'],
        ['Une relance avant vous, en SB ou BB (hors position)', `${RERAISE.text} : 3-bet à 4 fois la relance`, CALL_OOP.text, 'le reste'],
        ['Vous aviez relancé, un joueur sur-relance', `${RERAISE.text} : 4-bet à 3 fois (4 fois aux blinds)`, CALL_3BET.text, 'le reste, AQ compris'],
        ['Une relance puis une sur-relance avant vous, même si vous aviez suivi', `${RERAISE.text} : 4-bet`, 'rien', 'le reste, JJ et AJ compris'],
        ['Votre sur-relance ou votre 4-bet est relancé', `${RERAISE.text} : tapis`, 'rien', 'le reste'],
      ]),
      h('p', { class: 'hint' }, 'QQ+ et AK ne se couchent jamais avant le flop. Toute autre main se couche dès la deuxième relance, sauf JJ et TT quand c\'est votre relance qui est sur-relancée. Une relance qui engagerait plus de la moitié de votre tapis devient un tapis.')),
    h('section', { class: 'block' },
      h('h3', {}, '4. Après le flop : flop, turn et river'),
      table(['Votre main avec le tableau', 'Personne n\'a misé', 'Face à une mise', 'Face à une relance'], [
        ['Main forte : deux paires formées avec vos deux cartes, brelan ou mieux', 'Misez la moitié du pot', 'Relancez à 3 fois la mise', 'Relancez encore une fois, puis suivez jusqu\'au bout'],
        ['Top paire, ou paire servie plus haute que le tableau', 'Misez la moitié du pot', 'Suivez', 'Couchez-vous'],
        ['Moins bien', 'Checkez', 'Couchez-vous', 'Couchez-vous'],
      ]),
      h('p', { class: 'hint' }, 'Vos cartes doivent participer à la main : une paire ou un brelan formés par le tableau seul ne comptent pas.')),
    h('section', { class: 'block' },
      h('h3', {}, 'Retenir la grille, sous-niveau par sous-niveau'),
      h('p', { class: 'hint' }, 'Chaque sous-niveau est une stratégie complète, plus serrée que la grille finale. Passez au suivant après 19 sur 20 à l\'exercice « Quelle décision ? ».'),
      table(['Sous-niveau', 'Ce qu\'on ajoute'], STEPS.map((s) => [`${s.code} · ${s.name}`, STEP_ADDS[s.step]]))),
    h('div', { class: 'practice-actions no-print' },
      h('button', { type: 'button', class: 'btn secondary', onclick: () => window.print() }, 'Imprimer l\'aide-mémoire')),
  );
}
