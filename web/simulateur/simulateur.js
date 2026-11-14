// Écran du simulateur (index.html#simulateur) : la table, les boutons de l'humain, l'indice,
// le journal et les réglages. La logique est dans partie.js, bots.js et moteur/ (testés sous Node).
import { h, clear } from '../js/dom.js';
import { cardImg, backImg } from '../js/cards.js';
import { competenceHref } from '../js/cours.js';
import { levelBadge, levelClass, levelLabel } from '../js/niveau-couleur.js';
import { evaluate, describe } from '../niveau-1/evaluator.js';
import { legalActions } from './moteur/table.js';
import { newGame, startHand, replayHand, playBot, play, humanToAct, botToAct, gameOver, HUMAN } from './partie.js';
import { evaluateGame, afText, pctText } from './evaluation.js';
import { summarize, saveParty } from './historique.js';
import { decider, BOT_LEVELS, playLevel } from './bots.js';
import { handLog } from './journal.js';
import { judge, actionLabel, VERDICTS } from './mentor.js';
import { positions, bbText, potTotal } from './positions.js';

const KEY = 'poker.simulateur.v1';
const SPEEDS = { lente: 1500, normale: 800, rapide: 250 };
const STREET_LABEL = { preflop: 'Préflop', flop: 'Flop', turn: 'Turn', river: 'River', showdown: 'Abattage' };

function loadSettings() {
  let last = 2;
  try { last = Number(localStorage.getItem('poker.dernierNiveau')) || 2; } catch { /* stockage bloqué */ }
  const defaults = { humanLevel: Math.max(1, Math.min(6, last)), botLevels: [2, 3, 2, 3, 2], aide: 'indice', vitesse: 'normale', voirCartes: false, mains: 30, graine: '' };
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
  let mentorNote = null;        // dernier avis du mentor, affiché dans la colonne des actions
  let mentorStats = null;       // décompte des verdicts de la partie (bilan)
  let view = 'table';           // 'table' ou 'evaluation'

  function newGameFromSettings() {
    const seed = /^\d+$/.test(String(settings.graine).trim()) ? Number(settings.graine) : null;
    game = newGame({ botLevels: settings.botLevels, humanLevel: settings.humanLevel, maxHands: Number(settings.mains) || 0, seed });
    view = 'table';
    mentorStats = { conforme: 0, défendable: 0, erreur: 0, repris: 0 };
    nextHand();
  }

  function nextHand() {
    if (gameOver(game)) { showEvaluation(); return; }
    startHand(game);
    view = 'table';
    hint = null;
    raiseTo = null;
    mentorNote = null;
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

  // Coup du joueur. En mode Mentor, il est d'abord analysé : conforme, il est joué aussitôt ;
  // sinon une fenêtre explique l'écart et propose de confirmer, de jouer le coup du mentor ou
  // d'annuler.
  function humanPlay(action) {
    if (!humanToAct(game) || root.querySelector('dialog[open]')) return;
    if (settings.aide === 'mentor') {
      const legal = legalActions(game.hand);
      const advice = decider(game.hand, HUMAN, settings.humanLevel);
      const j = judge(game.hand, action, advice, legal);
      if (j.verdict !== 'conforme') { mentorDialog(j, action, advice.action); return; }
      mentorStats.conforme++;
      mentorNote = j;
    }
    commit(action);
  }

  function commit(action, meta) {
    play(game, action, meta);
    hint = null;
    raiseTo = null;
    update();
  }

  function mentorDialog(j, action, advised) {
    const close = (then) => { dialog.close(); dialog.remove(); then?.(); };
    const dialog = h('dialog', { class: 'sim-mentor', 'aria-labelledby': 'sim-mentor-title' },
      h('h2', { id: 'sim-mentor-title' }, h('span', { class: `sim-verdict ${j.verdict}` }, VERDICTS[j.verdict]), ' Le mentor analyse votre coup'),
      h('dl', {},
        h('dt', {}, 'Votre coup'), h('dd', {}, j.human),
        h('dt', {}, `Le mentor (règles du niveau ${j.level})`), h('dd', {}, j.advised)),
      j.why.length ? h('div', {}, h('h3', {}, 'Pourquoi votre coup est moins bon'), reasonList(j.why)) : null,
      h('h3', {}, 'Le raisonnement du mentor'), reasonList(j.raisons),
      h('div', { class: 'sim-mentor-buttons' },
        h('button', { class: 'btn secondary', onclick: () => close() }, 'Annuler'),
        h('button', { class: 'btn secondary', onclick: () => { mentorStats[j.verdict]++; mentorStats.repris++; close(() => { mentorNote = { ...j, repris: true }; commit(advised, { mentor: 'repris' }); }); } }, `Jouer : ${j.advised}`),
        h('button', { class: 'btn', onclick: () => close(() => { mentorStats[j.verdict]++; mentorNote = { ...j, confirme: true }; commit(action, { mentor: 'confirmé' }); }) }, 'Confirmer mon coup')));
    dialog.addEventListener('cancel', () => dialog.remove());       // Échap = annuler
    root.append(dialog);
    dialog.showModal();
  }

  // Liste de raisons, chacune avec le lien vers sa section du cours.
  function reasonList(list) {
    return h('ul', { class: 'sim-reasons' }, list.map((x) => {
      const href = x.code ? competenceHref(x.code) : null;
      return h('li', {}, x.code ? (href ? h('a', { href, class: 'comp-code' }, x.code) : h('span', { class: 'comp-code' }, x.code)) : null, x.code ? ' ' : '', x.texte);
    }));
  }

  function showHint() {
    if (!humanToAct(game) || settings.aide === 'sans') return;
    hint = decider(game.hand, HUMAN, settings.humanLevel);
    render();
  }

  // ---------- dessin ----------

  // Niveau du joueur → en-tête à sa couleur (js/app.js écoute « niveau-travail »).
  let announced = null;
  function announceLevel() {
    if (announced === settings.humanLevel) return;
    announced = settings.humanLevel;
    window.dispatchEvent(new CustomEvent('niveau-travail', { detail: settings.humanLevel }));
  }

  function render() {
    announceLevel();
    if (view === 'evaluation') { renderEvaluation(); return; }
    const hand = game.hand;
    const pos = positions(hand);
    const legal = humanToAct(game) ? legalActions(hand) : null;
    // append natif : il écrirait « null » pour un panneau absent, d'où le filtre.
    // Deux colonnes sur grand écran (simulateur.css) : la table à gauche ; actions, indice,
    // journal et bilan à droite. Sur petit écran, l'une sous l'autre.
    const side = h('div', { class: 'sim-side' }, ...[actionsPanel(legal), mentorPanel(), hintPanel(), journalPanel(), totalsPanel()].filter(Boolean));
    clear(root).append(
      settingsPanel(),
      h('div', { class: 'sim-layout' },
        h('div', { class: 'sim-main' },
          h('div', { class: 'sim-status-bar' },
            hand.replay ? h('span', { class: 'sim-replay' }, `Main n° ${hand.no} rejouée : elle ne compte pas`)
              : h('span', {}, `Main n° ${game.handNo}${game.maxHands ? ` sur ${game.maxHands}` : ''}`),
            h('span', {}, STREET_LABEL[hand.street]),
            h('span', {}, 'Votre niveau : ', levelBadge(settings.humanLevel))),
          h('div', { class: 'sim-table', role: 'group', 'aria-label': 'Table de poker' },
            game.players.map((p, i) => seatView(i, pos)),
            hand.seats.map((s, i) => (s.bet > 0 ? h('div', { class: `sim-bet sim-bet-${i}` }, bbText(s.bet, hand.bb)) : null)),
            centerView())),
        side));
    // Sur grand écran, le journal défile seul dans la colonne de droite : on montre sa fin.
    const log = side.querySelector('.sim-journal ol');
    if (log) log.scrollTop = log.scrollHeight;
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
        p.human ? null : h('span', { class: `sim-level ${levelClass(p.level)}`, title: `Joue au niveau ${playLevel(p.level)} (${levelLabel(p.level)})` }, `niv. ${p.level}`)),
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
        gameOver(game)
          ? h('button', { class: 'btn primary', id: 'sim-next', onclick: showEvaluation }, hand.replay ? 'Retour à l\'évaluation' : 'Fin de partie : voir l\'évaluation')
          : h('button', { class: 'btn primary', id: 'sim-next', onclick: nextHand }, 'Main suivante'));
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
      const raiseBtn = h('button', { class: 'btn sim-raise-btn', onclick: () => humanPlay({ type: 'raise', to: raiseTo }) },
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

  // Dernier avis du mentor sur votre coup.
  function mentorPanel() {
    if (!mentorNote || settings.aide !== 'mentor') return null;
    const n = mentorNote;
    const low = (t) => t.charAt(0).toLowerCase() + t.slice(1);       // « Suivre 1 BB » → « suivre 1 BB »
    const text = n.verdict === 'conforme' ? `${n.human} : conforme aux règles du niveau ${n.level}.`
      : n.repris ? `Vous avez repris le coup du mentor : ${low(n.advised)}.`
        : `Vous avez confirmé « ${low(n.human)} » (${low(VERDICTS[n.verdict])} ; le mentor : ${low(n.advised)}).`;
    return h('p', { class: `sim-mentor-note ${n.verdict}`, 'aria-live': 'polite' }, h('strong', {}, 'Mentor : '), text);
  }

  function hintPanel() {
    if (!hint || !humanToAct(game)) return null;
    const legal = legalActions(game.hand);
    return h('section', { class: 'sim-hint', 'aria-live': 'polite' },
      h('p', { class: 'sim-hint-title' }, `Indice (règles du niveau ${hint.level}) : `, h('strong', {}, actionLabel(hint.action, game.hand, legal))),
      reasonList(hint.raisons),
      settings.humanLevel === 1 ? h('p', { class: 'meta' }, 'Au niveau 1, l\'indice applique déjà les règles du niveau 2.') : null,
      settings.humanLevel > 3 ? h('p', { class: 'meta' }, 'Les règles des niveaux 4 à 6 arrivent bientôt : l\'indice applique celles du niveau 3.') : null);
  }

  function journalPanel() {
    const lines = handLog(game.hand, game.players.map((p) => p.name), HUMAN, { showAll: settings.voirCartes });
    // Une ligne avec cartes : son libellé (avant « : »), puis les cartes en miniature ; sur le
    // tableau, les cartes de la rue en cours sont mises en avant. Le texte complet reste pour les
    // lecteurs d'écran (aria-label).
    const item = (l) => {
      const cls = `sim-log-${l.kind}${l.seat === HUMAN ? ' you' : ''}`;
      if (!l.cards) return h('li', { class: cls }, l.text);
      const label = l.text.slice(0, l.text.indexOf(' : '));
      const after = /\(([^)]*)\)$/.exec(l.text);
      const old = l.kind === 'street' ? l.cards.length - l.newCards : 0;
      return h('li', { class: `${cls} sim-log-cards`, 'aria-label': l.text },
        h('span', { 'aria-hidden': 'true' }, `${label} :`),
        h('span', { class: 'sim-log-row', 'aria-hidden': 'true' },
          l.cards.map((c, k) => { const img = cardImg(c, 'xs'); if (k < old) img.classList.add('dim'); return img; })),
        l.kind === 'hand' && after ? h('span', { class: 'sim-log-note', 'aria-hidden': 'true' }, after[1]) : null);
    };
    return h('section', { class: 'sim-journal', 'aria-label': 'Journal de la main' },
      h('h2', {}, 'Journal de la main'),
      h('ol', {}, lines.map(item)));
  }

  function totalsPanel() {
    return h('details', { class: 'sim-totals' },
      h('summary', {}, `Bilan de la partie (${game.handNo} main${game.handNo > 1 ? 's' : ''})`),
      h('button', { class: 'link-btn', onclick: showEvaluation }, 'Évaluer la partie maintenant'),
      h('p', { class: 'meta' }, 'Sur quelques dizaines de mains, les jetons mesurent surtout la chance. Ce sont les décisions qu\'il faut juger.'),
      mentorStats && mentorStats.conforme + mentorStats.défendable + mentorStats.erreur > 0
        ? h('p', {}, h('strong', {}, 'Vos décisions jugées par le mentor : '),
          `${mentorStats.conforme} conforme${mentorStats.conforme > 1 ? 's' : ''}, ${mentorStats.défendable} défendable${mentorStats.défendable > 1 ? 's' : ''}, ${mentorStats.erreur} erreur${mentorStats.erreur > 1 ? 's' : ''}`,
          mentorStats.repris ? ` (coup du mentor repris ${mentorStats.repris} fois).` : '.')
        : null,
      h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}, 'Joueur'), h('th', {}, 'Niveau'), h('th', {}, 'Gains'))),
        h('tbody', {}, game.players.map((p, i) => h('tr', {},
          h('td', {}, p.name), h('td', {}, p.human ? `${p.level} (vous)` : String(p.level)),
          h('td', {}, `${game.totals[i] > 0 ? '+' : game.totals[i] < 0 ? '−' : ''}${bbText(Math.abs(game.totals[i]), game.bb)}`))))));
  }

  // ---------- évaluation de la partie ----------

  function showEvaluation() {
    clearTimeout(timer);
    view = 'evaluation';
    // Une partie terminée est enregistrée une fois (page Profil).
    if (gameOver(game) && !game.saved) {
      game.saved = true;
      saveParty(summarize(evaluateGame(game), game));
    }
    render();
    window.scrollTo(0, 0);
  }

  function replay(no) {
    replayHand(game, no);
    view = 'table';
    hint = null;
    raiseTo = null;
    mentorNote = null;
    update();
    window.scrollTo(0, 0);
  }

  function renderEvaluation() {
    const ev = evaluateGame(game);
    const bb = (chips) => bbText(chips, game.bb);
    const signed = (chips) => `${chips > 0 ? '+' : chips < 0 ? '−' : ''}${bb(Math.abs(chips))}`;
    const over = gameOver(game);
    const STREETS = { preflop: 'avant le flop', flop: 'au flop', turn: 'au turn', river: 'à la river' };
    const worst = ev.worst.map((d) => h('li', { class: 'sim-worst' },
      h('p', { class: 'sim-worst-head' }, h('strong', {}, `Main n° ${d.hand}`), ` · ${STREETS[d.street]} · ${d.pos} · `,
        d.ev !== null ? `espérance perdue ≈ ${bb(d.ev)}` : `${bb(d.stake)} en jeu`),
      h('div', { class: 'sim-worst-cards' },
        h('span', { class: 'sim-worst-label' }, 'Vos cartes'), h('span', { class: 'sim-log-row' }, d.hole.map((c) => cardImg(c, 'xs'))),
        d.board.length ? [h('span', { class: 'sim-worst-label' }, 'Tableau'), h('span', { class: 'sim-log-row' }, d.board.map((c) => cardImg(c, 'xs')))] : null),
      h('p', {}, `Vous : ${d.human}. Le mentor : ${d.advised}.${d.mentor === 'confirmé' ? ' (Coup confirmé malgré l\'avis du mentor.)' : ''}`),
      reasonList(d.why),
      h('button', { class: 'btn secondary', onclick: () => replay(d.hand) }, 'Rejouer cette main')));
    const rows = ev.players.map((p) => h('tr', { class: p.human ? 'you' : '' },
      h('td', {}, p.name), h('td', {}, p.human ? `${p.level} (jugé au ${p.judgedAt})` : `${p.level} (jugé au ${p.judgedAt})`),
      h('td', {}, String(p.decisions)), h('td', {}, p.score === null ? '—' : pctText(p.score)),
      h('td', {}, String(p.counts.défendable)), h('td', {}, String(p.counts.erreur)),
      h('td', {}, pctText(p.stats.vpip)), h('td', {}, pctText(p.stats.pfr)), h('td', {}, afText(p.stats.af)),
      h('td', {}, p.profile), h('td', {}, signed(p.gains))));
    const coursLink = (code, text) => { const href = competenceHref(code); return href ? h('a', { href }, text) : text; };
    clear(root).append(
      h('section', { class: 'sim-eval', 'aria-labelledby': 'sim-eval-title' },
        h('h2', { id: 'sim-eval-title' }, over ? 'Évaluation de la partie' : 'Évaluation provisoire de la partie'),
        h('p', { class: 'meta' }, `${ev.hands} main${ev.hands > 1 ? 's' : ''} jouée${ev.hands > 1 ? 's' : ''} · graine ${ev.seed} (la reprendre dans les réglages redonne les mêmes cartes)`
          + (over ? ' · partie enregistrée dans votre Profil.' : '.')),
        h('div', { class: 'sim-eval-text' },
          h('h3', {}, 'Vos décisions'),
          ev.comments.you.map((t) => h('p', {}, t)),
          h('p', { class: 'meta' }, 'Vos décisions sont jugées avec les règles de votre niveau, comme le fait le mentor. Celles des bots avec les règles du niveau ',
            String(ev.players.find((p) => !p.human)?.judgedAt), ', le plus haut disponible. Les jetons gagnés mesurent surtout la chance sur si peu de mains.')),
        h('h3', {}, 'Vos erreurs les plus coûteuses'),
        ev.worst.length ? h('ol', { class: 'sim-worst-list' }, worst) : h('p', {}, 'Aucune erreur : bravo.'),
        ev.worst.some((d) => d.ev === null) ? h('p', { class: 'meta' }, 'L\'espérance perdue ne se calcule que pour suivre ou jeter un tirage (C3.6) ; sinon, le montant indiqué est celui qui était en jeu.') : null,
        h('h3', {}, 'Tous les joueurs'),
        h('div', { class: 'table-wrap' }, h('table', { class: 'summary sim-eval-table' },
          h('thead', {}, h('tr', {}, ['Joueur', 'Niveau', 'Décisions', 'Conformes', 'Défendables', 'Erreurs', 'VPIP', 'PFR', 'AF', 'Profil', 'Gains'].map((t) => h('th', {}, t)))),
          h('tbody', {}, rows))),
        h('p', { class: 'meta' }, 'VPIP, PFR, AF et profils : ', coursLink('C5.4', 'C5.4'), '. Serré = VPIP sous 25 %, large = au-dessus de 35 % ; passif = AF sous 1,5, agressif = au-dessus de 2,5.'),
        h('h3', {}, 'Les bots'),
        h('ul', {}, ev.comments.bots.map((t) => h('li', {}, t))),
        h('div', { class: 'practice-actions' },
          over ? null : h('button', { class: 'btn secondary', onclick: () => { view = 'table'; update(); } }, 'Retour à la table'),
          h('button', { class: 'btn', onclick: () => { clearTimeout(timer); newGameFromSettings(); } }, 'Nouvelle partie'))));
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
        select('Aide', settings.aide, [['indice', 'Bouton Indice'], ['mentor', 'Mentor (analyse de chaque coup)'], ['sans', 'Sans aide']], (v) => { settings.aide = v; hint = null; saveSettings(settings); render(); }),
        select('Vitesse des adversaires', settings.vitesse, [['lente', 'Lente'], ['normale', 'Normale'], ['rapide', 'Rapide']], (v) => { settings.vitesse = v; saveSettings(settings); }),
        select('Cartes des adversaires', settings.voirCartes ? 'oui' : 'non', [['non', 'Cachées'], ['oui', 'Visibles (entraînement)']], (v) => { settings.voirCartes = v === 'oui'; saveSettings(settings); render(); }),
        select('Mains par partie', settings.mains, [[10, '10'], [20, '20'], [30, '30'], [50, '50'], [100, '100'], [0, 'Sans limite']], (v) => { settings.mains = Number(v); saveSettings(settings); }),
        h('label', { class: 'setting' }, 'Graine (facultatif)',
          h('input', { type: 'text', inputmode: 'numeric', value: settings.graine, placeholder: 'au hasard', size: 12,
            onchange: (e) => { settings.graine = e.target.value.trim(); saveSettings(settings); } }))),
      h('p', { class: 'meta' }, 'Nombre de mains et graine : appliqués à la prochaine partie. Une même graine redonne les mêmes cartes.'),
      h('p', { class: 'meta' }, 'Niveau des adversaires (pour l\'instant 2 ou 3 ; les niveaux 4 à 6 viendront ensuite). Appliqué à la prochaine partie.'),
      h('div', { class: 'settings' }, game.players.slice(1).map((p, k) => select(p.name, settings.botLevels[k],
        BOT_LEVELS.map((n) => [n, `Niveau ${n}`]), (v) => { settings.botLevels[k] = Number(v); saveSettings(settings); }))),
      h('button', { class: 'btn secondary', onclick: () => { clearTimeout(timer); newGameFromSettings(); } }, 'Nouvelle partie'));
  }

  // Raccourcis clavier ; js/app.js remet document.onkeydown à zéro en changeant de page.
  document.onkeydown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) && e.target.type !== 'range') return;
    if (root.querySelector('dialog[open]')) return;          // la fenêtre du mentor a ses propres touches
    if (view === 'evaluation') return;
    const key = e.key.toLowerCase();
    if (game.hand.done) {
      if (key === 'enter' || key === ' ') { e.preventDefault(); if (gameOver(game)) showEvaluation(); else nextHand(); }
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
