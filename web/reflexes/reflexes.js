// Onglet « Réflexes » d'un niveau (index.html#niveau-N/reflexes) : questions courtes à réponse
// immédiate, souvent sur une image de main ou de tableau, revues par répétition espacée
// (méthode Leitner, voir leitner.js).
//
// La banque vient de mentor, déposée telle quelle dans reflexes/banque/ (questions.csv, images/) ;
// on ne l'édite jamais ici. Les questions du niveau N sont celles dont le thème commence par
// « Niveau N ». Une suite par niveau, enregistrée dans le navigateur (stockage.js).
import { h, clear } from '../js/dom.js';
import { competenceHref } from '../js/cours.js';
import { readBank, levelOfTheme, verdict, expected, legacyIds } from './banque.js';
import { DEFAULTS, planSession, startSession, recordAnswer, createRun, resumable, summary, boxesDue, renameItems } from './leitner.js';
import { loadSuite, saveSuite } from './stockage.js';

const BANK = 'reflexes/banque/';
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

let bankPromise = null;
export function loadBank() {
  bankPromise ??= fetch(`${BANK}questions.csv`, { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(`banque introuvable (${r.status})`); return r.text(); })
    .then(readBank)
    .catch((err) => { bankPromise = null; throw err; });
  return bankPromise;
}

// Séance suivante qui a des questions : une séance sans rien à poser (boîtes hautes seulement,
// pas encore échues) compte comme faite, comme si l'on était passé sans rien revoir.
function nextPlan(suite, questions) {
  let s = suite;
  for (let i = 0; i < 2 ** DEFAULTS.boxCount; i++) {
    const plan = planSession(s, questions);
    if (plan.queue.length) return { suite: s, plan };
    s = { ...s, session: s.session + 1 };
  }
  return { suite, plan: null };            // tout est maîtrisé
}

// « Cours : C1.3. » à la fin de l'explication → lien vers la section du cours.
function explanation(text) {
  const m = /\s*Cours\s*:\s*(C\d+\.\d+)\.?\s*$/.exec(text || '');
  const body = m ? text.slice(0, m.index) : text;
  const href = m ? competenceHref(m[1]) : null;
  return [
    body ? h('p', {}, body) : null,
    m ? h('p', { class: 'meta' }, 'Revoir dans le cours : ', href ? h('a', { href }, m[1]) : m[1]) : null,
  ];
}

function boxesView(sum) {
  return h('div', { class: 'leitner-boxes', role: 'list', 'aria-label': 'Répartition des questions' },
    h('div', { class: 'leitner-box fresh', role: 'listitem' }, h('span', { class: 'n' }, String(sum.fresh)), h('span', {}, 'nouvelles')),
    sum.boxes.map((n, i) => h('div', { class: 'leitner-box', role: 'listitem' },
      h('span', { class: 'n' }, String(n)), h('span', {}, `boîte ${i + 1}`))),
    h('div', { class: 'leitner-box mastered', role: 'listitem' }, h('span', { class: 'n' }, String(sum.mastered)), h('span', {}, 'maîtrisées')));
}

export async function renderReflexes(root, level) {
  clear(root).append(h('p', { class: 'meta' }, 'Chargement des questions…'));
  let bank;
  try {
    bank = await loadBank();
  } catch (err) {
    clear(root).append(h('p', { class: 'form-message' }, `Impossible de charger les questions : ${err.message}`));
    return;
  }
  const questions = bank.questions.filter((q) => levelOfTheme(q.theme) === level);
  migrate();
  home();

  // Progression enregistrée avant les références (identifiant = empreinte de l'énoncé) :
  // rattachée une fois pour toutes à la référence de la question.
  function migrate() {
    const map = new Map();
    for (const q of questions) for (const old of legacyIds(q)) map.set(old, q.id);
    if (!map.size) return;
    const { suite, moved } = renameItems(loadSuite(level), map);
    if (moved) saveSuite(level, suite);
  }

  function home() {
    document.onkeydown = null;
    clear(root);
    const suite = loadSuite(level);
    const sum = summary(suite, questions);
    root.append(h('section', { class: 'intro' },
      h('p', {}, 'Des questions courtes, à répondre ', h('strong', {}, 'du tac au tac'),
        ' : une main, un tableau, une situation, et la bonne décision tout de suite.'),
      h('p', { class: 'meta' }, 'Répétition espacée : une question réussie monte d\'une boîte et revient de plus en plus rarement ',
        '(boîte 1 à chaque séance, boîte 2 une séance sur deux, boîte 3 une sur quatre…). Une erreur la fait redescendre. ',
        'Réussie dans la dernière boîte, elle est maîtrisée. Rythme conseillé : une séance par jour.')));
    if (!questions.length) {
      root.append(h('section', { class: 'block' }, h('p', {}, `Pas encore de questions pour le niveau ${level}.`)));
      return;
    }
    const { suite: ready, plan } = nextPlan(suite, questions);
    const known = new Set(questions.map((q) => q.id));
    const pending = resumable(suite, (id) => known.has(id));
    const left = pending?.run.stats().left;
    root.append(h('section', { class: `block leitner-state${sum.acquired ? ' ok' : ''}` },
      h('h2', {}, sum.acquired ? 'Toutes les questions sont maîtrisées' : 'Où vous en êtes'),
      boxesView(sum),
      h('p', { class: 'meta' }, `${plural(sum.total, 'question')} · `, pending
        ? `${plural(sum.sessions - 1, 'séance')} terminée${sum.sessions > 2 ? 's' : ''}, 1 interrompue`
        : `${plural(sum.sessions, 'séance')} terminée${sum.sessions > 1 ? 's' : ''}`),
      pending
        ? h('div', { class: 'submit-bar leitner-resume' },
          h('p', {}, h('strong', {}, `Séance ${pending.number} interrompue`), ` : encore ${plural(left, 'question')}.`),
          h('button', { type: 'button', class: 'btn primary', onclick: () => session(suite, pending.run, pending.number) }, 'Reprendre la séance'),
          plan ? h('button', {
            type: 'button', class: 'btn secondary',
            title: 'Abandonne les questions restantes ; le numéro de séance avance, donc les boîtes posées changent.',
            onclick: () => { const s = startSession(ready, plan); session(s, createRun(plan.queue), plan.number); },
          }, `Nouvelle séance (${plan.number})`) : null)
        : plan
        ? h('div', { class: 'submit-bar' },
          h('p', {}, `Séance ${plan.number} : ${plural(plan.queue.length, 'question')}`,
            plan.introduced.length ? `, dont ${plural(plan.introduced.length, 'nouvelle')}` : '',
            ` (boîte${boxesDue(plan.number).length > 1 ? 's' : ''} ${boxesDue(plan.number).join(', ')}).`),
          h('button', { type: 'button', class: 'btn primary', onclick: () => { const s = startSession(ready, plan); session(s, createRun(plan.queue), plan.number); } }, 'Commencer la séance'))
        : null));
  }

  // Séance number, nouvelle (suite déjà ouverte par startSession) ou reprise (run restauré).
  // La séance en cours est enregistrée après chaque réponse (suite.current), effacée à la fin.
  function session(suiteStart, run, number) {
    let suite = { ...suiteStart, current: { number, ...run.snapshot() } };
    let saved = saveSuite(level, suite);
    const byId = new Map(questions.map((q) => [q.id, q]));
    const plan = { number };

    const progress = h('p', { class: 'meta', 'aria-live': 'polite' });
    const stage = h('div', { class: 'leitner-stage' });
    clear(root).append(
      h('div', { class: 'exercise-head' },
        h('button', { type: 'button', class: 'link-btn', onclick: home }, '← Réflexes'),
        h('h2', {}, `Séance ${plan.number}`),
        progress),
      stage);
    ask();

    function ask() {
      const id = run.current();
      if (id === null) { end(); return; }
      const q = byId.get(id);
      const st = run.stats();
      const retry = run.isRetry(id);
      progress.textContent = retry
        ? `Reprise d'une erreur · encore ${plural(st.left, 'question')}`
        : `Question ${st.asked + 1} sur ${st.total}`;
      const answerZone = h('div', { class: 'leitner-answer' });
      const feedback = h('div', { 'aria-live': 'polite' });
      clear(stage).append(...[            // append natif : un null s'écrirait en texte
        q.image ? h('figure', { class: 'leitner-figure' }, h('img', { src: `${BANK}images/${q.image}`, alt: q.alt })) : null,
        h('p', { class: 'leitner-question' }, q.enonce),
        answerZone,
        feedback].filter(Boolean));
      inputs(q, answerZone, (answer, shown) => {
        const ok = verdict(q, answer);
        const { counts } = run.answer(ok);
        if (counts) suite = recordAnswer(suite, id, ok);
        suite = { ...suite, current: { number, ...run.snapshot() } };
        saved = saveSuite(level, suite) && saved;
        answerZone.querySelectorAll('button, input').forEach((el) => { el.disabled = true; });
        // Choix fait (juste ou faux) et bonne réponse, marqués sur les boutons.
        const right = q.type === 'qcm' ? q.bonne : q.type === 'vrai_faux' ? String(q.reponse) : null;
        answerZone.querySelectorAll('.choice-btn').forEach((b) => {
          if (right !== null && b.dataset.value === right) b.classList.add('right');
          else if (b.classList.contains('chosen')) b.classList.add('wrong');
        });
        const next = h('button', { type: 'button', class: 'btn primary', onclick: ask }, run.current() === null ? 'Terminer' : 'Suivant');
        clear(feedback).append(h('div', { class: `feedback ${ok ? 'ok' : 'ko'}` },
          h('p', {}, h('strong', {}, ok ? 'Juste.' : 'Faux.'),
            q.type === 'auto_evaluation' || (ok && q.type !== 'valeur_numerique') ? '' : ` Réponse : ${expected(q)}.`,
            shown && q.type === 'valeur_numerique' && !ok ? ` (vous : ${shown})` : ''),
          ...explanation(q.explication),
          !counts ? h('p', { class: 'meta' }, 'Reprise : cette réponse ne change pas la boîte de la question.') : null),
        h('div', { class: 'submit-bar' }, next));
        next.focus();
        document.onkeydown = (e) => { if (e.key === 'Enter' && document.activeElement !== next && next.isConnected) { e.preventDefault(); ask(); } };
      });
    }

    function end() {
      document.onkeydown = null;
      const { current, ...done } = suite;
      suite = done;
      saved = saveSuite(level, suite) && saved;
      const st = run.stats();
      const sum = summary(suite, questions);
      clear(root).append(
        h('div', { class: 'exercise-head' }, h('h2', {}, `Séance ${plan.number} terminée`)),
        h('section', { class: `result ${st.good === st.asked ? 'ok' : ''}` },
          h('p', { class: 'score' }, `${st.good} / ${st.asked}`),
          h('p', {}, 'Justes du premier coup.', st.retries ? ` ${plural(st.retries, 'reprise')} pour corriger les erreurs.` : ''),
          saved ? null : h('p', { class: 'meta' }, 'Attention : votre navigateur bloque l\'enregistrement, cette séance ne sera pas conservée.')),
        h('section', { class: 'block' }, h('h2', {}, 'Vos boîtes'), boxesView(sum)),
        h('div', { class: 'submit-bar' }, h('button', { type: 'button', class: 'btn primary', onclick: home }, 'Retour aux Réflexes')));
    }
  }
}

// Zone de réponse selon le type ; done(réponse, texte saisi) à la validation.
// Clavier : chiffres 1 à 9 (et 0 pour le dixième) pour les choix, V / F pour vrai ou faux, Entrée pour valider.
function inputs(q, zone, done) {
  let answered = false;
  const once = (answer, shown) => { if (!answered) { answered = true; done(answer, shown); } };
  const buttons = (choices) => {
    const pick = (i) => { if (answered) return; list.children[i].classList.add('chosen'); once(choices[i][1]); };
    const list = h('div', { class: 'choice-ask' }, choices.map(([label, value], i) => h('button', {
      type: 'button', class: 'btn secondary choice-btn', onclick: () => pick(i),
      'aria-keyshortcuts': i < 9 ? String(i + 1) : i === 9 ? '0' : false, dataset: { value: String(value) },
    }, label)));
    zone.append(list);               // pas de focus sur un choix : Entrée y répondrait par mégarde
    document.activeElement?.blur?.();
    document.onkeydown = (e) => {
      if (answered || !zone.isConnected || e.ctrlKey || e.metaKey || e.altKey) return;   // onglet quitté
      const k = e.key === '0' ? 10 : Number(e.key);                 // 0 : dixième choix
      if (k >= 1 && k <= choices.length) { e.preventDefault(); pick(k - 1); }
      if (q.type === 'vrai_faux' && /^[vf]$/i.test(e.key)) { e.preventDefault(); pick(e.key.toLowerCase() === 'v' ? 0 : 1); }
    };
  };

  if (q.type === 'qcm') {
    // Sans mélange : l'ordre fixé dans mentor (colonne ordre), toujours le même pour l'étudiant.
    const all = q.melange ? [q.bonne, ...q.mauvaises] : q.ordre.slice();
    if (q.melange) for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    buttons(all.map((c) => [c, c]));
  } else if (q.type === 'vrai_faux') {
    buttons([['Vrai', true], ['Faux', false]]);
  } else if (q.type === 'valeur_numerique') {
    const input = h('input', { type: 'text', inputmode: 'decimal', class: 'leitner-number', 'aria-label': 'Votre réponse', autocomplete: 'off' });
    const go = () => { if (input.value.trim()) once(input.value, input.value.trim()); };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); go(); } });
    zone.append(h('div', { class: 'leitner-number-row' }, input, q.unite ? h('span', {}, q.unite) : null,
      h('button', { type: 'button', class: 'btn', onclick: go }, 'Valider')));
    document.onkeydown = null;
    input.focus();
  } else {
    const show = h('button', {
      type: 'button', class: 'btn',
      onclick: () => {
        show.remove();
        zone.append(h('div', { class: 'feedback' }, h('p', {}, h('strong', {}, 'Réponse : '), q.reponse)));
        buttons([['Je savais', true], ['Je ne savais pas', false]]);
      },
    }, 'Voir la réponse');
    zone.append(h('p', { class: 'meta' }, 'Répondez de tête, puis vérifiez : vous direz vous-même si vous saviez.'), show);
    document.onkeydown = null;
    show.focus();
  }
}
