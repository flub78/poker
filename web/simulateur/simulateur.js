// Écran du simulateur (index.html#simulateur) : la table, les boutons de l'humain, l'indice,
// le journal et les réglages. La logique est dans partie.js, bots.js et moteur/ (testés sous Node).
import { h, clear } from '../js/dom.js';
import { cardImg, backImg } from '../js/cards.js';
import { competenceHref } from '../js/cours.js';
import { evaluate, describe } from '../niveau-1/evaluator.js';
import { legalActions } from './moteur/table.js';
import { newGame, startHand, playBot, play, humanToAct, botToAct, HUMAN } from './partie.js';
import { decider, BOT_LEVELS, playLevel } from './bots.js';
import { handLog } from './journal.js';
import { positions, bbText, potTotal } from './positions.js';

const KEY = 'poker.simulateur.v1';
const SPEEDS = { lente: 1500, normale: 800, rapide: 250 };
const STREET_LABEL = { preflop: 'Préflop', flop: 'Flop', turn: 'Turn', river: 'River', showdown: 'Abattage' };

function loadSettings() {
  let last = 2;
  try { last = Number(localStorage.getItem('poker.dernierNiveau')) || 2; } catch { /* stockage bloqué */ }
  const defaults = { humanLevel: Math.max(1, Math.min(6, last)), botLevels: [2, 3, 2, 3, 2], aide: 'indice', vitesse: 'normale', voirCartes: false };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...defaults, ...saved };
  } catch { return defaults; }
}

function saveSettings(settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* stockage bloqué */ }
}

export function renderSimulateur(main) {
  const settings = loadSettings();
  const root = h('div', { class: 'sim' });
  clear(main).append(root);

  let game = null;
  let timer = null;
  let hint = null;              // décision du bot pour l'humain, affichée par le bouton Indice
  let raiseTo = null;           // montant choisi avec le curseur

  function newGameFromSettings() {
    game = newGame({ botLevels: settings.botLevels, humanLevel: settings.humanLevel });
    nextHand();
  }

  function nextHand() {
    startHand(game);
    hint = null;
    raiseTo = null;
    update();
  }

  // Redessine, puis fait jouer le bot suivant après un délai.
  function update() {
    render();
    clearTimeout(timer);
    if (botToAct(game)) {
      timer = setTimeout(() => {
        if (!root.isConnected) return;          // on a quitté la page
        playBot(game);
        update();
      }, SPEEDS[settings.vitesse] || SPEEDS.normale);
    }
  }

  function humanPlay(action) {
    if (!humanToAct(game)) return;
    play(game, action);
    hint = null;
    raiseTo = null;
    update();
  }

  function showHint() {
    if (!humanToAct(game) || settings.aide === 'sans') return;
    hint = decider(game.hand, HUMAN, settings.humanLevel);
    render();
  }

  // ---------- dessin ----------

  function render() {
    const hand = game.hand;
    const pos = positions(hand);
    const legal = humanToAct(game) ? legalActions(hand) : null;
    // append natif : il écrirait « null » pour un panneau absent, d'où le filtre.
    clear(root).append(...[
      settingsPanel(),
      h('div', { class: 'sim-status-bar' },
        h('span', {}, `Main n° ${game.handNo}`),
        h('span', {}, STREET_LABEL[hand.street]),
        h('span', {}, `Votre niveau : ${settings.humanLevel}`)),
      h('div', { class: 'sim-table', role: 'group', 'aria-label': 'Table de poker' },
        game.players.map((p, i) => seatView(i, pos)),
        hand.seats.map((s, i) => (s.bet > 0 ? h('div', { class: `sim-bet sim-bet-${i}` }, bbText(s.bet, hand.bb)) : null)),
        centerView()),
      actionsPanel(legal),
      hintPanel(),
      journalPanel(),
      totalsPanel()].filter(Boolean));
  }

  function seatView(i, pos) {
    const hand = game.hand;
    const s = hand.seats[i];
    const p = game.players[i];
    const winner = hand.done && hand.result.won[i] > 0 && (hand.result.showdown || hand.result.won[i] > s.committed);
    const showCards = p.human || settings.voirCartes || (hand.done && hand.result.showdown && !s.folded);
    const cards = s.folded && !p.human
      ? []
      : s.hole.map((c) => (showCards ? cardImg(c, 'sm') : backImg('sm')));
    const classes = ['sim-seat', `sim-seat-${i}`];
    if (hand.toAct === i) classes.push('active');
    if (s.folded) classes.push('folded');
    if (winner) classes.push('winner');
    if (p.human) classes.push('human');
    return h('div', { class: classes.join(' '), 'aria-current': hand.toAct === i ? 'true' : false },
      h('div', { class: 'sim-seat-head' },
        h('span', { class: 'sim-name' }, p.name),
        h('span', { class: 'sim-pos', title: 'Position' }, pos[i]),
        hand.button === i ? h('span', { class: 'sim-dealer', title: 'Bouton (donneur)', 'aria-label': 'bouton' }, 'D') : null),
      h('div', { class: 'sim-cards' }, cards),
      h('div', { class: 'sim-stack' },
        h('span', {}, bbText(s.stack, hand.bb)),
        p.human ? null : h('span', { class: 'sim-level', title: `Joue au niveau ${playLevel(p.level)}` }, `niv. ${p.level}`)),
      h('div', { class: 'sim-last' }, lastAction(i)));
  }

  function lastAction(i) {
    const hand = game.hand;
    const s = hand.seats[i];
    if (s.folded) return 'Couché';
    if (s.allIn) return 'Tapis';
    if (hand.done && hand.result.showdown) return describe(evaluate([...s.hole, ...hand.board]));
    const e = [...hand.history].reverse().find((x) => x.seat === i && x.street === hand.street);
    if (!e) return hand.toAct === i ? (game.players[i].human ? 'À vous de parler' : 'Réfléchit…') : '';
    switch (e.type) {
      case 'sb': return 'Petite blind';
      case 'bb': return 'Grosse blind';
      case 'check': return 'Check';
      case 'call': return 'Suit';
      case 'raise': return e.facing ? `Relance à ${bbText(e.to, hand.bb)}` : `Mise ${bbText(e.to, hand.bb)}`;
      default: return '';
    }
  }

  function centerView() {
    const hand = game.hand;
    const slots = [];
    for (let k = 0; k < 5; k++) slots.push(hand.board[k] ? cardImg(hand.board[k], 'sm') : h('span', { class: 'card sm empty', 'aria-hidden': 'true' }));
    return h('div', { class: 'sim-center' },
      h('div', { class: 'sim-board' }, slots),
      h('div', { class: 'sim-pot' }, `Pot : ${bbText(potTotal(hand), hand.bb)}`));
  }

  function actionsPanel(legal) {
    const hand = game.hand;
    if (hand.done) {
      const results = handLog(hand, game.players.map((p) => p.name), HUMAN).filter((l) => l.kind === 'result');
      const net = hand.result.net[HUMAN];
      return h('section', { class: 'sim-actions done', 'aria-live': 'polite' },
        h('div', { class: 'sim-result' },
          results.map((l) => h('p', {}, l.text)),
          h('p', { class: 'meta' }, net === 0 ? 'Main neutre pour vous.' : `Pour vous : ${net > 0 ? '+' : '−'}${bbText(Math.abs(net), hand.bb)}.`)),
        h('button', { class: 'btn primary', id: 'sim-next', onclick: nextHand }, 'Main suivante'));
    }
    if (!legal) {
      return h('section', { class: 'sim-actions waiting', 'aria-live': 'polite' },
        h('p', {}, `À ${game.players[hand.toAct].name} de parler…`));
    }
    const facing = hand.currentBet > 0 && legal.call;
    const s = hand.seats[HUMAN];
    const buttons = [
      h('button', { class: 'btn danger', onclick: () => humanPlay({ type: 'fold' }) }, 'Se coucher', h('kbd', {}, 'F')),
      legal.check
        ? h('button', { class: 'btn secondary', onclick: () => humanPlay({ type: 'check' }) }, 'Checker', h('kbd', {}, 'C'))
        : h('button', { class: 'btn secondary', onclick: () => humanPlay({ type: 'call' }) },
          `Suivre ${bbText(legal.toCall, hand.bb)}${legal.toCall === s.stack ? ' (tapis)' : ''}`, h('kbd', {}, 'C')),
    ];
    let raiseBox = null;
    if (legal.raise) {
      const { min, max } = legal.raise;
      if (raiseTo === null || raiseTo < min || raiseTo > max) raiseTo = min;
      const verb = facing || hand.street === 'preflop' ? 'Relancer à' : 'Miser';
      const raiseBtn = h('button', { class: 'btn', onclick: () => humanPlay({ type: 'raise', to: raiseTo }) },
        `${verb} ${bbText(raiseTo, hand.bb)}${raiseTo === max ? ' (tapis)' : ''}`, h('kbd', {}, 'R'));
      const slider = h('input', {
        type: 'range', min, max, step: 1, value: raiseTo, 'aria-label': 'Montant de la relance',
        oninput: (e) => { raiseTo = Number(e.target.value); raiseBtn.firstChild.textContent = `${verb} ${bbText(raiseTo, hand.bb)}${raiseTo === max ? ' (tapis)' : ''}`; },
      });
      // Tailles usuelles : fraction du pot après votre call, ajoutée à la mise à suivre.
      const pot = potTotal(hand);
      const preset = (label, frac) => {
        const to = frac === 'max' ? max : Math.round(hand.currentBet + frac * (pot + legal.toCall));
        const clamped = Math.min(Math.max(to, min), max);
        return h('button', { class: 'btn secondary sim-preset', onclick: () => { raiseTo = clamped; render(); } }, label);
      };
      raiseBox = h('div', { class: 'sim-raise' },
        h('div', { class: 'sim-presets' }, preset('Min', 0), preset('½ pot', 0.5), preset('⅔ pot', 2 / 3), preset('Pot', 1), preset('Tapis', 'max')),
        slider);
      buttons.push(raiseBtn);
    }
    return h('section', { class: 'sim-actions', 'aria-label': 'Vos actions' },
      h('div', { class: 'sim-buttons' }, buttons,
        settings.aide === 'sans' ? null : h('button', { class: 'btn secondary', onclick: showHint }, 'Indice', h('kbd', {}, 'I'))),
      raiseBox,
      hand.board.length ? h('p', { class: 'meta' }, `Votre main : ${describe(evaluate([...s.hole, ...hand.board]))}.`) : null);
  }

  function actionLabel(action, legal) {
    const bb = game.hand.bb;
    switch (action.type) {
      case 'fold': return 'Se coucher';
      case 'check': return 'Checker';
      case 'call': return `Suivre ${bbText(legal.toCall, bb)}`;
      default: return `${game.hand.currentBet > 0 ? 'Relancer à' : 'Miser'} ${bbText(action.to, bb)}`;
    }
  }

  function hintPanel() {
    if (!hint || !humanToAct(game)) return null;
    const legal = legalActions(game.hand);
    return h('section', { class: 'sim-hint', 'aria-live': 'polite' },
      h('p', { class: 'sim-hint-title' }, `Indice (règles du niveau ${hint.level}) : `, h('strong', {}, actionLabel(hint.action, legal))),
      h('ul', {}, hint.raisons.map((x) => {
        const href = x.code ? competenceHref(x.code) : null;
        return h('li', {}, x.code ? (href ? h('a', { href, class: 'comp-code' }, x.code) : h('span', { class: 'comp-code' }, x.code)) : null, x.code ? ' ' : '', x.texte);
      })),
      settings.humanLevel === 1 ? h('p', { class: 'meta' }, 'Au niveau 1, l\'indice applique déjà les règles du niveau 2.') : null,
      settings.humanLevel > 3 ? h('p', { class: 'meta' }, 'Les règles des niveaux 4 à 6 arrivent bientôt : l\'indice applique celles du niveau 3.') : null);
  }

  function journalPanel() {
    const lines = handLog(game.hand, game.players.map((p) => p.name), HUMAN);
    return h('details', { class: 'sim-journal', open: true },
      h('summary', {}, 'Journal de la main'),
      h('ol', {}, lines.map((l) => h('li', { class: `sim-log-${l.kind}${l.seat === HUMAN ? ' you' : ''}` }, l.text))));
  }

  function totalsPanel() {
    return h('details', { class: 'sim-totals' },
      h('summary', {}, `Bilan de la partie (${game.handNo} main${game.handNo > 1 ? 's' : ''})`),
      h('p', { class: 'meta' }, 'Sur quelques dizaines de mains, les jetons mesurent surtout la chance. Ce sont les décisions qu\'il faut juger.'),
      h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}, 'Joueur'), h('th', {}, 'Niveau'), h('th', {}, 'Gains'))),
        h('tbody', {}, game.players.map((p, i) => h('tr', {},
          h('td', {}, p.name), h('td', {}, p.human ? `${p.level} (vous)` : String(p.level)),
          h('td', {}, `${game.totals[i] > 0 ? '+' : game.totals[i] < 0 ? '−' : ''}${bbText(Math.abs(game.totals[i]), game.bb)}`))))));
  }

  function settingsPanel() {
    const select = (label, value, options, onchange) => h('label', { class: 'setting' }, label,
      h('select', { onchange: (e) => onchange(e.target.value) },
        options.map(([v, text]) => h('option', { value: v, selected: String(v) === String(value) }, text))));
    const levels = [1, 2, 3, 4, 5, 6].map((n) => [n, `Niveau ${n}`]);
    return h('details', { class: 'sim-settings' },
      h('summary', {}, 'Réglages'),
      h('div', { class: 'settings' },
        select('Votre niveau', settings.humanLevel, levels, (v) => { settings.humanLevel = Number(v); game.humanLevel = settings.humanLevel; game.players[HUMAN].level = settings.humanLevel; hint = null; saveSettings(settings); render(); }),
        select('Aide', settings.aide, [['indice', 'Bouton Indice'], ['sans', 'Sans aide']], (v) => { settings.aide = v; hint = null; saveSettings(settings); render(); }),
        select('Vitesse des adversaires', settings.vitesse, [['lente', 'Lente'], ['normale', 'Normale'], ['rapide', 'Rapide']], (v) => { settings.vitesse = v; saveSettings(settings); }),
        select('Cartes des adversaires', settings.voirCartes ? 'oui' : 'non', [['non', 'Cachées'], ['oui', 'Visibles (entraînement)']], (v) => { settings.voirCartes = v === 'oui'; saveSettings(settings); render(); })),
      h('p', { class: 'meta' }, 'Niveau des adversaires (pour l\'instant 2 ou 3 ; les niveaux 4 à 6 viendront ensuite). Appliqué à la prochaine partie.'),
      h('div', { class: 'settings' }, game.players.slice(1).map((p, k) => select(p.name, settings.botLevels[k],
        BOT_LEVELS.map((n) => [n, `Niveau ${n}`]), (v) => { settings.botLevels[k] = Number(v); saveSettings(settings); }))),
      h('button', { class: 'btn secondary', onclick: () => { clearTimeout(timer); newGameFromSettings(); } }, 'Nouvelle partie'));
  }

  // Raccourcis clavier ; js/app.js remet document.onkeydown à zéro en changeant de page.
  document.onkeydown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) && e.target.type !== 'range') return;
    const key = e.key.toLowerCase();
    if (game.hand.done) {
      if (key === 'enter' || key === ' ') { e.preventDefault(); nextHand(); }
      return;
    }
    const legal = humanToAct(game) ? legalActions(game.hand) : null;
    if (!legal) return;
    if (key === 'f') humanPlay({ type: 'fold' });
    else if (key === 'c') humanPlay(legal.check ? { type: 'check' } : { type: 'call' });
    else if (key === 'r' && legal.raise) humanPlay({ type: 'raise', to: raiseTo ?? legal.raise.min });
    else if (key === 'i') showHint();
  };

  newGameFromSettings();
}
