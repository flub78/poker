// Point d'entrée : tableau de bord, passage d'une épreuve, correction.
import { h, clear, formatDate } from './dom.js';
import { rng, newSeed } from './cards.js';
import { CONFIG } from './config.js';
import * as store from './storage.js';
import deroulement from './exercises/deroulement.js';
import classement from './exercises/classement.js';
import nuts from './exercises/nuts.js';
import potAnnexe from './exercises/pot-annexe.js';
import annonces from './practice/annonces.js';
import meilleureMain from './practice/meilleure-main.js';
import nommerNuts from './practice/nommer-nuts.js';

const EXERCISES = [deroulement, classement, nuts, potAnnexe];
const PRACTICES = [annonces, meilleureMain, nommerNuts];
const main = document.getElementById('app');

const STATE_LABEL = {
  none: 'Non tenté',
  progress: 'En cours',
  once: 'Validé une fois',
  validated: 'Validé',
};

function statusLine(st) {
  if (st.state === 'validated') return `Validé le ${formatDate(st.second)}`;
  if (st.state === 'once') {
    const ready = new Date() >= new Date(st.nextFrom);
    return ready
      ? `1re réussite le ${formatDate(st.first)} · 2e validation possible dès maintenant`
      : `1re réussite le ${formatDate(st.first)} · 2e validation possible à partir du ${formatDate(st.nextFrom)}`;
  }
  if (st.state === 'progress') return `${st.count} tentative${st.count > 1 ? 's' : ''}, pas encore réussi`;
  return 'Pas encore de tentative';
}

// ---------- onglets ----------

function tabs(active) {
  const tab = (id, text, view) => h('button', {
    type: 'button', class: 'tab', role: 'tab', id: `tab-${id}`,
    'aria-selected': active === id ? 'true' : 'false',
    onclick: () => { if (active !== id) view(); },
  }, text);
  return h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Rubriques' },
    tab('tests', 'Tests', dashboard),
    tab('exercices', 'Exercices', exercisesHome));
}

function setHash(hash) {
  if (location.hash !== hash) history.replaceState(null, '', hash || location.pathname + location.search);
}

// ---------- tableau de bord ----------

function dashboard() {
  clear(main);
  setHash('');
  const statuses = EXERCISES.map((ex) => store.status(ex.id));
  const done = statuses.filter((s) => s.state === 'validated').length;
  const levelOk = done === EXERCISES.length;

  const nameInput = h('input', {
    type: 'text', id: 'player', value: store.getPlayer(), placeholder: 'Votre prénom', autocomplete: 'given-name',
    onchange: (e) => store.setPlayer(e.target.value),
  });

  main.append(
    tabs('tests'),
    h('section', { class: 'intro' },
      h('p', {}, 'Ce test vérifie les 4 compétences du niveau 1. Chaque test est validé après ',
        h('strong', {}, `deux réussites à au moins ${CONFIG.minDaysBetween} jours d'écart`),
        '. Les questions changent à chaque essai.'),
      h('label', { class: 'player', for: 'player' }, 'Joueur ', nameInput)),
    h('section', { class: `level-status ${levelOk ? 'ok' : ''}` },
      levelOk
        ? h('p', {}, h('strong', {}, 'Niveau 1 validé.'), ' Vous pouvez passer au niveau 2 et reporter la date dans votre carnet.')
        : h('p', {}, h('strong', {}, `${done} test${done > 1 ? 's' : ''} validé${done > 1 ? 's' : ''} sur ${EXERCISES.length}.`),
          ' Le niveau est validé quand les 4 le sont.')),
    h('ul', { class: 'test-list' }, EXERCISES.map((ex, i) => {
      const st = statuses[i];
      return h('li', { class: 'test-card' },
        h('div', { class: 'test-head' },
          h('span', { class: 'test-code' }, ex.code),
          h('span', { class: `chip ${st.state}` }, STATE_LABEL[st.state])),
        h('h2', {}, ex.title),
        h('p', { class: 'meta' }, `Compétences ${ex.competences} · Réussite : ${ex.rule}`),
        h('p', { class: 'meta' }, statusLine(st)),
        h('button', { type: 'button', class: 'btn', onclick: () => run(ex) },
          st.state === 'none' ? 'Commencer' : 'Refaire le test'));
    })),
    h('section', { class: 'tools' },
      h('button', { type: 'button', class: 'btn secondary', onclick: exportData }, 'Exporter mes résultats'),
      h('label', { class: 'btn secondary file-btn' }, 'Importer des résultats',
        h('input', { type: 'file', accept: 'application/json', onchange: importData })),
      h('button', { type: 'button', class: 'btn danger', onclick: resetData }, 'Effacer mes résultats')),
  );
}

// ---------- exercices d'entraînement ----------

function exercisesHome() {
  clear(main);
  setHash('#exercices');
  main.append(
    tabs('exercices'),
    h('section', { class: 'intro' },
      h('p', {}, 'Entraînez-vous autant que vous voulez avant de passer les tests. ',
        'La correction est immédiate et ', h('strong', {}, 'rien n\'est enregistré'), '.')),
    h('ul', { class: 'test-list' }, PRACTICES.map((px) => h('li', { class: 'test-card' },
      h('div', { class: 'test-head' }, h('span', { class: 'test-code' }, `Compétences ${px.competences}`)),
      h('h2', {}, px.title),
      h('p', { class: 'meta' }, px.summary),
      h('button', { type: 'button', class: 'btn', onclick: () => practice(px) }, 'S\'entraîner')))),
  );
}

function practice(px, settings = Object.fromEntries(px.settings.map((s) => [s.id, s.default]))) {
  clear(main);
  window.scrollTo(0, 0);
  let done = 0;
  let good = 0;
  const counter = h('p', { class: 'counter', 'aria-live': 'polite' });
  const update = () => {
    counter.textContent = done
      ? `Depuis le début : ${good} réussite${good > 1 ? 's' : ''} sur ${done}.`
      : 'Aucune réponse pour l\'instant.';
  };
  update();

  const body = h('div', { class: 'exercise-body' });
  main.append(
    h('div', { class: 'exercise-head' },
      h('button', { type: 'button', class: 'link-btn', onclick: exercisesHome }, '← Exercices'),
      h('h2', {}, px.title),
      h('p', { class: 'meta' }, `Compétences ${px.competences} · ${px.summary}`)),
    h('div', { class: 'settings' }, px.settings.map((s) => h('label', { class: 'setting' }, s.label,
      h('select', { onchange: (e) => practice(px, { ...settings, [s.id]: e.target.value }) },
        s.options.map((o) => h('option', { value: o.value, selected: settings[s.id] === o.value }, o.label)))))),
    counter,
    body,
  );
  const instance = px.create(rng(newSeed()), settings, (ok) => {
    done++;
    if (ok) good++;
    update();
  });
  instance.render(body);
}

// ---------- passage d'un test ----------

function run(ex) {
  const seed = newSeed();
  const instance = ex.create(rng(seed));
  const started = Date.now();
  clear(main);
  window.scrollTo(0, 0);

  const message = h('p', { class: 'form-message', role: 'alert' });
  const body = h('div', { class: 'exercise-body' });

  main.append(
    h('div', { class: 'exercise-head' },
      h('button', { type: 'button', class: 'link-btn', onclick: () => { if (confirm('Abandonner ce test ? Il ne sera pas enregistré.')) dashboard(); } }, '← Retour'),
      h('h2', {}, `${ex.code} · ${ex.title}`),
      h('p', { class: 'meta' }, `Réussite : ${ex.rule}`)),
    body,
    h('div', { class: 'submit-bar' },
      message,
      h('button', {
        type: 'button', class: 'btn primary',
        onclick: () => {
          const missing = instance.missing();
          if (missing) { message.textContent = missing; return; }
          finish(ex, instance, seed, started);
        },
      }, 'Valider mes réponses')),
  );
  instance.render(body);
}

function finish(ex, instance, seed, started) {
  const result = instance.grade();
  const attempt = {
    date: new Date().toISOString(),
    seed,
    score: result.score,
    total: result.total,
    passed: result.passed,
    seconds: Math.round((Date.now() - started) / 1000),
  };
  const saved = store.addAttempt(ex.id, attempt);
  const st = store.status(ex.id);

  clear(main);
  window.scrollTo(0, 0);
  const verdict = result.passed
    ? (st.state === 'validated' ? 'Réussi : ce test est maintenant validé.' : `Réussi. Repassez-le à partir du ${formatDate(st.nextFrom)} pour le valider définitivement.`)
    : 'Pas encore : relisez la correction, refaites les exercices de la compétence, puis retentez.';

  main.append(
    h('div', { class: 'exercise-head' },
      h('h2', {}, `${ex.code} · ${ex.title}`)),
    h('section', { class: `result ${result.passed ? 'ok' : 'ko'}` },
      h('p', { class: 'score' }, `${result.score} / ${result.total}`),
      h('p', {}, verdict),
      h('p', { class: 'meta' }, `Durée : ${Math.floor(attempt.seconds / 60)} min ${attempt.seconds % 60} s`),
      saved ? null : h('p', { class: 'meta' }, 'Attention : votre navigateur bloque l\'enregistrement, ce résultat ne sera pas conservé.')),
    h('section', { class: 'block' },
      h('h3', {}, 'Correction'),
      h('ol', { class: 'review' }, result.items.map((it) => h('li', { class: it.ok ? 'ok' : 'ko' },
        h('div', { class: 'review-title' }, h('span', { class: 'mark', 'aria-label': it.ok ? 'juste' : 'faux' }, it.ok ? '✓' : '✗'), it.title),
        h('div', { class: 'review-body' }, it.body))))),
    h('div', { class: 'submit-bar' },
      h('button', { type: 'button', class: 'btn secondary', onclick: () => run(ex) }, 'Refaire ce test'),
      h('button', { type: 'button', class: 'btn primary', onclick: dashboard }, 'Retour au tableau de bord')),
  );
}

// ---------- outils ----------

function exportData() {
  const blob = new Blob([store.exportJSON()], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `poker-niveau1-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  file.text().then((text) => {
    try {
      store.importJSON(text);
      dashboard();
    } catch (err) {
      alert(`Import impossible : ${err.message}`);
    }
  });
}

function resetData() {
  if (confirm('Effacer tous vos résultats du niveau 1 ? Cette action est définitive.')) {
    store.reset();
    dashboard();
  }
}

if (location.hash === '#exercices') exercisesHome();
else dashboard();
