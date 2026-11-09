// Série de questions posées une à une (10 au plus), commune aux tests et aux exercices des niveaux 3 à 6.
//
//   mode 'test'     : pas de correction pendant la série ; missing() et items() pour le shell.
//   mode 'practice' : correction après chaque réponse, compteur (report), puis « Nouvelle série »
//                     avec d'autres données.
//
// runSerie(root, {
//   mode, count, rand,
//   make(rand, i)          → question (données)
//   scene(q)               → nœud affiché au-dessus de la question (cartes, situation), facultatif
//   ask(q, submit)         → nœud de saisie ; appelle submit(réponse)
//   check(q, réponse)      → { ok, body } : juste ou non, explication
//   title(q, i)            → titre de la question dans la correction
//   limit                  → secondes par question (0 : sans limite) ; au-delà, la réponse est fausse
//   report(ok)             → exercice : compteur du shell
//   goal                   → exercice : objectif du cours (« 50 cartes-flash, soit 5 séries »)
// })
import { h, clear } from './dom.js';
import { cardRow } from './cards.js';

export const MAX_QUESTIONS = 10;
const fmt = (s) => `${s.toFixed(1).replace('.', ',')} s`;

export function runSerie(root, opts) {
  const { mode, rand, make, scene, ask, check, title, limit = 0, report, goal } = opts;
  const count = Math.min(opts.count, MAX_QUESTIONS);
  let serie = 1;
  let questions;
  let answers;
  let index;
  let tick;

  function start() {
    questions = Array.from({ length: count }, (_, i) => make(rand, i));
    answers = new Array(count).fill(null);
    index = 0;
    show();
  }

  const judge = (i) => {
    const a = answers[i];
    const res = check(questions[i], a.value);
    const late = limit > 0 && a.seconds > limit;
    return { ...res, right: res.ok, ok: res.ok && !late, late, seconds: a.seconds };
  };

  function progress() {
    return h('div', { class: 'progress-line' },
      h('span', {}, `${mode === 'practice' && serie > 1 ? `Série ${serie} · ` : ''}Question ${Math.min(index + 1, count)} sur ${count}`),
      h('div', { class: 'progress-bar', 'aria-hidden': 'true' }, h('span', { style: `width: ${(100 * index) / count}%` })));
  }

  function timerView(started) {
    const el = h('span', { class: 'timer', 'aria-live': 'off' }, limit ? `${limit} s` : fmt(0));
    clearInterval(tick);
    tick = setInterval(() => {
      if (!el.isConnected) { clearInterval(tick); return; }
      const s = (performance.now() - started) / 1000;
      el.textContent = limit ? (s <= limit ? `${Math.ceil(limit - s)} s` : `+${fmt(s - limit)}`) : fmt(s);
      el.classList.toggle('late', limit > 0 && s > limit);
    }, 100);
    return h('span', { class: 'setting' }, limit ? `Temps restant (${limit} s)` : 'Temps', el);
  }

  function questionView() {
    const q = questions[index];
    const started = performance.now();
    const submit = (value) => {
      clearInterval(tick);
      answers[index] = { value, seconds: (performance.now() - started) / 1000 };
      if (mode === 'practice') {
        const r = judge(index);
        report?.(r.ok);
        feedbackView(r);
      } else {
        index++;
        show();
      }
    };
    return [
      scene ? h('section', { class: 'block' }, scene(q)) : null,
      h('section', { class: 'block' }, h('div', { class: 'announce' }, ask(q, submit), timerView(started))),
    ];
  }

  function feedbackView(r) {
    const nextBtn = h('button', {
      type: 'button', class: 'btn',
      onclick: () => { index++; show(); },
    }, index + 1 < count ? 'Question suivante →' : 'Voir le bilan de la série');
    setTimeout(() => nextBtn.focus(), 0);
    const answerBox = root.querySelector('.announce');
    answerBox.replaceChildren(
      h('div', { class: `feedback ${r.ok ? 'ok' : 'ko'}` },
        h('p', {}, h('strong', {}, r.ok ? '✓ Juste.' : r.right ? '✗ Juste, mais trop lent.' : '✗ Faux.'),
          r.late ? ` Répondu en ${fmt(r.seconds)}, au-delà des ${limit} secondes.` : ''),
        r.body),
      h('div', { class: 'practice-actions' }, nextBtn));
  }

  function summaryView() {
    const results = questions.map((_, i) => judge(i));
    const good = results.filter((r) => r.ok).length;
    const again = h('button', { type: 'button', class: 'btn', onclick: () => { serie++; start(); } }, 'Nouvelle série (autres données) →');
    setTimeout(() => again.focus(), 0);
    return h('section', { class: 'block' },
      h('h3', {}, `Série ${serie} terminée : ${good} sur ${count}`),
      goal ? h('p', { class: 'meta' }, goal) : null,
      h('ol', { class: 'review' }, results.map((r, i) => h('li', { class: r.ok ? 'ok' : 'ko' },
        h('div', { class: 'review-title' }, h('span', { class: 'mark' }, r.ok ? '✓' : '✗'), title(questions[i], i))))),
      h('div', { class: 'practice-actions' }, again));
  }

  function show() {
    clearInterval(tick);
    clear(root);
    if (index < count) {
      root.append(progress(), ...questionView().filter(Boolean));
    } else if (mode === 'practice') {
      root.append(summaryView());
    } else {
      root.append(h('section', { class: 'block' },
        h('p', {}, h('strong', {}, 'Série terminée.'), ' Validez vos réponses ci-dessous.')));
    }
  }

  start();
  return {
    missing() {
      const n = answers.filter((a) => !a).length;
      return n ? `Il reste ${n} question${n > 1 ? 's' : ''} dans cette série.` : null;
    },
    items() {
      return questions.map((q, i) => {
        const r = judge(i);
        return {
          ok: r.ok,
          title: title(q, i),
          body: h('div', {}, r.late ? h('p', { class: 'bad' }, `${r.right ? 'Juste, mais répondu' : 'Répondu'} en ${fmt(r.seconds)} : au-delà des ${limit} secondes.`) : null, r.body),
        };
      });
    },
  };
}

// ---------- briques de saisie ----------

// Champ numérique + bouton Valider (touche Entrée aussi).
export function numberAsk(label, { unit = '', parse }) {
  return (q, submit) => {
    const message = h('p', { class: 'form-message', role: 'alert' });
    const input = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': label, class: 'num-input' });
    const go = () => {
      const v = parse(input.value);
      if (v === null) { message.textContent = 'Entrez un nombre.'; input.focus(); return; }
      submit(v);
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    setTimeout(() => input.focus(), 0);
    return h('div', { class: 'num-ask' },
      h('label', { class: 'setting' }, label, h('span', { class: 'num-field-inline' }, input, unit ? h('span', { class: 'unit' }, unit) : null)),
      h('button', { type: 'button', class: 'btn', onclick: go }, 'Valider'),
      message);
  };
}

// Boutons de choix : [{ value, label }].
export function choiceAsk(choices) {
  return (q, submit) => {
    const list = typeof choices === 'function' ? choices(q) : choices;
    const buttons = list.map((c) => h('button', { type: 'button', class: 'btn secondary choice-btn', onclick: () => submit(c.value) }, c.label));
    setTimeout(() => buttons[0]?.focus(), 0);
    return h('div', { class: 'choice-ask' }, buttons);
  };
}

// Plusieurs réponses à donner ensemble : groupes de boutons ({ name, label, options: [{ value, label }] })
// ou champs numériques ({ name, label, type: 'number', unit, parse }). submit({ name: valeur, … }).
export function multiAsk(fields) {
  return (q, submit) => {
    const list = typeof fields === 'function' ? fields(q) : fields;
    const values = {};
    const message = h('p', { class: 'form-message', role: 'alert' });
    const groups = list.map((f) => {
      if (f.type === 'number') {
        const input = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', class: 'num-input', 'aria-label': f.label });
        input.addEventListener('input', () => { values[f.name] = f.parse(input.value); });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
        return h('label', { class: 'setting' }, f.label, h('span', { class: 'num-field-inline' }, input, f.unit ? h('span', { class: 'unit' }, f.unit) : null));
      }
      const buttons = f.options.map((o) => h('button', {
        type: 'button', class: 'btn secondary toggle-btn', 'aria-pressed': 'false',
        onclick: (e) => {
          values[f.name] = o.value;
          for (const b of e.currentTarget.parentElement.children) b.setAttribute('aria-pressed', String(b === e.currentTarget));
        },
      }, o.label));
      return h('div', { class: 'multi-group', role: 'group', 'aria-label': f.label },
        h('span', { class: 'multi-label' }, f.label), h('div', { class: 'choice-ask' }, buttons));
    });
    function go() {
      const missing = list.filter((f) => values[f.name] === undefined || values[f.name] === null);
      if (missing.length) { message.textContent = `Répondez aussi : ${missing.map((f) => f.label.toLowerCase()).join(', ')}.`; return; }
      submit({ ...values });
    }
    return h('div', { class: 'multi-ask' }, groups,
      h('div', { class: 'practice-actions' }, h('button', { type: 'button', class: 'btn', onclick: go }, 'Valider')), message);
  };
}

// Vos cartes et le tableau.
export function tableView(hole, board, street) {
  return h('div', { class: 'split-hand' },
    h('div', {}, h('div', { class: 'board-label quiet' }, 'Vos cartes'), cardRow(hole, 'sm')),
    h('div', { class: 'board' }, h('div', { class: 'board-label' }, street === 'turn' ? 'Tableau (turn)' : 'Tableau (flop)'), cardRow(board, 'sm')));
}

// ---------- tests et exercices à partir d'une question ----------

// Un test : une série (le shell en enchaîne plusieurs si series > 1).
export function makeTest({ question, count, pass, limit = 0, series = 1, ...meta }) {
  return {
    ...meta,
    series,
    pass,
    create(rand) {
      let serie;
      return {
        render(root) {
          serie = runSerie(root, { mode: 'test', count, rand, limit, ...question() });
        },
        missing: () => serie.missing(),
        grade() {
          const items = serie.items();
          const score = items.filter((it) => it.ok).length;
          return { score, total: items.length, passed: score >= (series > 1 ? 0 : pass), items };
        },
      };
    },
  };
}

// Un exercice : séries de `count` questions, autant qu'on veut, avec d'autres données à chaque fois.
export function makePractice({ question, count, goal, settings = [], limit, ...meta }) {
  return {
    ...meta,
    settings,
    create(rand, chosen, report) {
      return {
        render(root) {
          const time = chosen.time !== undefined ? Number(chosen.time) : (limit || 0);
          runSerie(root, { mode: 'practice', count, rand, limit: time, report, goal, ...question(chosen) });
        },
      };
    },
  };
}

