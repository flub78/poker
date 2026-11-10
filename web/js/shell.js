// Squelette commun des niveaux : onglets, tableau de bord des tests,
// passage d'une épreuve, correction, exercices d'entraînement, outils.
// Appelé par js/app.js avec la définition du niveau (niveau-N/niveau.js) et l'onglet demandé.
//
// startApp({
//   level: 2,                          numéro du niveau
//   storageKey: 'poker.niveau2.v1',    clé localStorage du niveau
//   tests: [...],                      épreuves (modules { id, code, title, competences, rule, create,
//                                        series?, pass? } : plusieurs séries, score additionné jugé sur pass)
//   practices: [...],                  exercices (modules { id, title, competences, summary, settings, create })
//   manual: [{ id, text }],            critères vérifiés à la table (moyennes, durées, volume de jeu) :
//                                        cases à cocher, enregistrées avec leur date
//   extraTabs: [{ id, label, render(main) }],   onglets en plus, après « Exercices »
//   testsNote: nœud ou texte affiché sous l'introduction des tests (facultatif)
//   css: 'style.css'                   feuille de style du niveau (facultatif, lue par app.js)
// }, 'exercices')
import { h, clear, formatDate } from './dom.js';
import { rng, newSeed } from './cards.js';
import { CONFIG } from './config.js';
import { createStore } from './storage.js';
import { reviewLinks, levelCompetences, competenceNames } from './cours.js';

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

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

export function startApp({ level, storageKey, tests, practices, manual = [], extraTabs = [], testsNote = null }, startTab = 'tests') {
  const store = createStore(storageKey);
  const base = `#niveau-${level}`;
  const main = document.getElementById('app');

  // ---------- onglets ----------

  const TABS = [
    { id: 'tests', label: 'Tests', hash: base, view: dashboard },
    { id: 'exercices', label: 'Exercices', hash: `${base}/exercices`, view: exercisesHome },
    ...extraTabs.map((t) => ({ id: t.id, label: t.label, hash: `${base}/${t.id}`, view: () => extraView(t) })),
  ];

  function tabs(active) {
    return h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Rubriques' },
      TABS.map((t) => h('button', {
        type: 'button', class: 'tab', role: 'tab', id: `tab-${t.id}`,
        'aria-selected': active === t.id ? 'true' : 'false',
        onclick: () => { if (active !== t.id) t.view(); },
      }, t.label)));
  }

  // replaceState ne déclenche pas hashchange : on change d'onglet sans recharger le niveau.
  function setHash(hash) {
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }

  function extraView(t) {
    clear(main);
    setHash(`${base}/${t.id}`);
    main.append(tabs(t.id));
    const body = h('div', {});
    main.append(body);
    t.render(body);
  }

  // Bouton vers le simulateur (index.html#simulateur), en tête des onglets Tests et Exercices.
  function simInvite() {
    return h('section', { class: 'sim-invite' },
      h('p', {}, h('strong', {}, 'Mettre le cours en pratique : '),
        'une table à 6 contre des bots qui appliquent les règles du cours, avec un indice à la demande.'),
      h('a', { class: 'btn', href: '#simulateur' }, 'Jouer à la table'));
  }

  // ---------- tableau de bord ----------

  function dashboard() {
    clear(main);
    setHash(base);
    const statuses = tests.map((ex) => store.status(ex.id));
    const done = statuses.filter((s) => s.state === 'validated').length;
    const checked = manual.filter((m) => store.manualDate(m.id)).length;
    const levelOk = done === tests.length && checked === manual.length;
    const progress = [
      tests.length ? `${plural(done, 'test')} validé${done > 1 ? 's' : ''} sur ${tests.length}` : null,
      manual.length ? `${plural(checked, 'critère')} coché${checked > 1 ? 's' : ''} sur ${manual.length}` : null,
    ].filter(Boolean).join(' · ');

    main.append(
      tabs('tests'),
      h('section', { class: 'intro' },
        tests.length ? h('p', {}, `Ces tests vérifient les compétences du niveau ${level}. Chaque test est validé après `,
          h('strong', {}, `deux réussites à au moins ${CONFIG.minDaysBetween} jours d'écart`),
          '. Les questions changent à chaque essai.') : null,
        testsNote ? h('p', {}, testsNote) : null,
        // Prénom, sauvegarde, transfert, effacement : page Profil (bouton à droite des niveaux).
        h('p', { class: 'meta' }, store.getPlayer() ? `Joueur : ${store.getPlayer()} · ` : '',
          h('a', { href: '#profil' }, store.getPlayer() ? 'Profil' : 'Indiquez votre prénom dans le Profil'),
          ' (sauvegarde, changement d\'appareil)')),
      simInvite(),
      h('section', { class: `level-status ${levelOk ? 'ok' : ''}` },
        levelOk
          ? h('p', {}, h('strong', {}, `Niveau ${level} validé.`), ` Reportez la date dans votre carnet.`)
          : h('p', {}, h('strong', {}, `${progress}.`), ' Le niveau est validé quand tout l\'est.')),
      h('ul', { class: 'test-list' }, tests.map((ex, i) => {
        const st = statuses[i];
        return h('li', { class: 'test-card' },
          h('div', { class: 'test-head' },
            h('span', { class: 'test-code' }, ex.code),
            h('span', { class: `chip ${st.state}` }, STATE_LABEL[st.state])),
          h('h2', {}, ex.title),
          h('p', { class: 'meta' }, `Compétences ${ex.competences} · Réussite : ${ex.rule}`),
          h('p', { class: 'meta' }, statusLine(st)),
          reviewLinks(ex.competences),
          h('button', { type: 'button', class: 'btn', onclick: () => run(ex) },
            st.state === 'none' ? 'Commencer' : 'Refaire le test'));
      })),
      ...(manual.length ? [manualSection()] : []),   // append (natif) écrirait « null » en texte
    );
  }

  // Critères du cours qui portent sur le jeu réel : le joueur les coche lui-même.
  function manualSection() {
    return h('section', { class: 'block manual' },
      h('h2', {}, 'À vérifier à la table'),
      h('p', { class: 'meta' }, 'Ces critères portent sur votre jeu réel (résultats, durée, volume de mains) : ',
        'l\'application ne peut pas les mesurer. Cochez-les quand ils sont remplis.'),
      h('ul', { class: 'manual-list' }, manual.map((m) => {
        const date = store.manualDate(m.id);
        return h('li', {},
          h('label', { class: 'manual-item' },
            h('input', { type: 'checkbox', checked: Boolean(date), onchange: (e) => { store.setManual(m.id, e.target.checked); dashboard(); } }),
            h('span', {}, m.text, date ? h('span', { class: 'meta' }, ` · coché le ${formatDate(date)}`) : null)));
      })));
  }

  // ---------- exercices d'entraînement ----------

  function exercisesHome() {
    clear(main);
    setHash(`${base}/exercices`);
    main.append(
      tabs('exercices'),
      h('section', { class: 'intro' },
        h('p', {}, 'Entraînez-vous autant que vous voulez avant de passer les tests. ',
          'La correction est immédiate et ', h('strong', {}, 'rien n\'est enregistré'), '.')),
      simInvite(),
      ...[levelCompetences(level)].filter(Boolean),
      h('ul', { class: 'test-list' }, practices.map((px) => h('li', { class: 'test-card' },
        h('div', { class: 'test-head' }, h('span', { class: 'test-code' }, competenceNames(px.competences) || `Compétences ${px.competences}`)),
        h('h2', {}, px.title),
        h('p', { class: 'meta' }, px.summary),
        reviewLinks(px.competences),
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
        h('p', { class: 'meta' }, `${competenceNames(px.competences) || `Compétences ${px.competences}`} · ${px.summary}`),
        reviewLinks(px.competences)),
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

  // Un test peut se passer en plusieurs séries (ex.series, défaut 1) de 10 questions au plus,
  // chacune avec des données différentes ; le score est alors additionné et jugé sur ex.pass.
  // Une seule graine pour toutes les séries : la tentative reste reproductible.
  function run(ex) {
    const seed = newSeed();
    const rand = rng(seed);
    const count = ex.series || 1;
    const done = [];
    const started = Date.now();

    function serie(k) {
      const instance = ex.create(rand, { serie: k, series: count });
      clear(main);
      window.scrollTo(0, 0);
      const message = h('p', { class: 'form-message', role: 'alert' });
      const body = h('div', { class: 'exercise-body' });
      const last = k === count;
      main.append(
        h('div', { class: 'exercise-head' },
          h('button', { type: 'button', class: 'link-btn', onclick: () => { if (confirm('Abandonner ce test ? Il ne sera pas enregistré.')) dashboard(); } }, '← Retour'),
          h('h2', {}, `${ex.code} · ${ex.title}`),
          h('p', { class: 'meta' }, `Réussite : ${ex.rule}`),
          count > 1 ? h('p', { class: 'serie-badge' }, `Série ${k} sur ${count}`, h('span', { class: 'meta' }, ' · chaque série a des données différentes')) : null),
        body,
        h('div', { class: 'submit-bar' },
          message,
          h('button', {
            type: 'button', class: 'btn primary',
            onclick: () => {
              const missing = instance.missing();
              if (missing) { message.textContent = missing; return; }
              done.push(instance);
              if (last) finish(ex, done, seed, started); else serie(k + 1);
            },
          }, last ? 'Valider mes réponses' : `Valider et passer à la série ${k + 1}`)),
      );
      instance.render(body);
    }
    serie(1);
  }

  function finish(ex, instances, seed, started) {
    const grades = instances.map((x) => x.grade());
    const result = grades.length === 1 ? grades[0] : {
      score: grades.reduce((s, g) => s + g.score, 0),
      total: grades.reduce((s, g) => s + g.total, 0),
      items: grades.flatMap((g, k) => g.items.map((it) => ({ ...it, title: `Série ${k + 1} · ${it.title}` }))),
    };
    if (grades.length > 1) result.passed = result.score >= ex.pass;
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
        saved ? null : h('p', { class: 'meta' }, 'Attention : votre navigateur bloque l\'enregistrement, ce résultat ne sera pas conservé.'),
        reviewLinks(ex.competences)),
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

  (TABS.find((t) => t.id === startTab) || TABS[0]).view();
}
