// Page Profil (#profil), ouverte par le bouton à droite des niveaux : tout ce qui concerne le joueur,
// pour tous les niveaux à la fois.
//   - le prénom, commun à tout le site ;
//   - le résumé des résultats par niveau ;
//   - le code de transfert vers un autre appareil (envoyer, recevoir) ;
//   - la sauvegarde dans un fichier (exporter, importer) ;
//   - l'effacement des résultats.
//
// Adresses : #profil                 la page
//            #transfert/<code>       lien de transfert reçu : la page, avec le résumé de ce qui arrive
//
// Code de transfert : placé après le « # », le navigateur ne l'envoie jamais au serveur.
// Format : « 1. » + base64url( deflate-raw( JSON ) ), JSON = { v: 1, p: prénom, n: { niveau: { test: [tentatives] } } },
// chaque tentative en tableau compact [secondes depuis 1970, graine, score, total, réussi 0/1, durée en s].
// Transfert et import de fichier passent par la fusion (storage.js, mergeData) : on ajoute les
// tentatives manquantes, rien n'est jamais remplacé.
import { h, clear } from './dom.js';
import { LEVELS } from './config.js';
import { createStore, mergeData, getPlayerName, setPlayerName } from './storage.js';

const VERSION = '1';
const FILE_FORMAT = 'poker-resultats';
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

// Niveaux prêts : numéro, titre, définition (niveau-N/niveau.js) et magasin de résultats.
async function levels() {
  const out = [];
  for (const l of LEVELS.filter((x) => x.ready)) {
    try {
      const def = (await import(`../niveau-${l.n}/niveau.js`)).default;
      out.push({ n: l.n, title: l.title, def, store: createStore(def.storageKey) });
    } catch { /* niveau illisible : ignoré */ }
  }
  return out;
}

// Fusionne { niveau: données } dans les résultats locaux ; apply = false : simple simulation.
// Renvoie { rows: [{ n, received, added }], ignored: [niveaux inconnus ici] }.
async function mergeLevels(byLevel, apply) {
  const known = await levels();
  const ignored = Object.keys(byLevel).filter((n) => !known.some((l) => String(l.n) === String(n)));
  const rows = [];
  for (const lvl of known) {
    const incoming = byLevel[lvl.n];
    if (!incoming) continue;
    const received = Object.values(incoming.tests || {}).reduce((s, t) => s + (t.attempts?.length || 0), 0);
    let added;
    if (apply) {
      added = lvl.store.merge(incoming);
      if (added === false) throw new Error('le navigateur bloque l\'enregistrement (navigation privée ?)');
    } else {
      added = mergeData(lvl.store.exportData(), incoming).added;
    }
    rows.push({ n: lvl.n, received, added });
  }
  return { rows, ignored };
}

// ---------- code de transfert ----------

const compact = (a) => [Math.floor(Date.parse(a.date) / 1000), a.seed, a.score, a.total, a.passed ? 1 : 0, a.seconds ?? 0];
const expand = ([t, seed, score, total, passed, seconds]) => ({
  date: new Date(t * 1000).toISOString(), seed, score, total, passed: passed === 1, seconds,
});

async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}
function toBase64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const fromBase64url = (text) => Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export async function createCode() {
  const payload = { v: 1, p: getPlayerName(), n: {} };
  let attempts = 0;
  for (const lvl of await levels()) {
    const tests = {};
    for (const [id, t] of Object.entries(lvl.store.exportData().tests)) {
      if (t.attempts?.length) { tests[id] = t.attempts.map(compact); attempts += t.attempts.length; }
    }
    if (Object.keys(tests).length) payload.n[lvl.n] = tests;
  }
  const bytes = await pipe(new TextEncoder().encode(JSON.stringify(payload)), new CompressionStream('deflate-raw'));
  return { code: `${VERSION}.${toBase64url(bytes)}`, attempts };
}

// Lit un code (ou un lien entier qui le contient) ; renvoie { player, byLevel }.
export async function readCode(text) {
  const m = /(?:#transfert\/)?(\d+)\.([A-Za-z0-9_-]+)\s*$/.exec(text.trim());
  if (!m) throw new Error('ce n\'est pas un code de transfert');
  if (m[1] !== VERSION) throw new Error('code créé par une autre version de l\'application');
  let payload;
  try {
    const bytes = await pipe(fromBase64url(m[2]), new DecompressionStream('deflate-raw'));
    payload = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error('code incomplet ou abîmé (vérifiez qu\'il a été copié en entier)');
  }
  if (payload?.v !== 1 || typeof payload.n !== 'object') throw new Error('contenu non reconnu');
  const byLevel = {};
  for (const [n, tests] of Object.entries(payload.n)) {
    byLevel[n] = { tests: Object.fromEntries(Object.entries(tests).map(([id, list]) => [id, { attempts: list.map(expand) }])) };
  }
  return { player: payload.p || '', byLevel, code: `${m[1]}.${m[2]}` };
}

export const transferLink = (code) => `${location.origin}${location.pathname}#transfert/${code}`;

// ---------- fichier de sauvegarde ----------

async function exportFile() {
  const niveaux = {};
  for (const lvl of await levels()) niveaux[lvl.n] = lvl.store.exportData();
  const json = JSON.stringify({ format: FILE_FORMAT, version: 1, joueur: getPlayerName(), date: new Date().toISOString(), niveaux }, null, 2);
  const a = h('a', {
    href: URL.createObjectURL(new Blob([json], { type: 'application/json' })),
    download: `poker-resultats-${new Date().toISOString().slice(0, 10)}.json`,
  });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
}

// Fichier complet (tous les niveaux) ou ancien export d'un seul niveau (reconnu à ses tests).
async function readFile(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('ce n\'est pas un fichier JSON'); }
  if (data?.format === FILE_FORMAT && typeof data.niveaux === 'object') return { player: data.joueur || '', byLevel: data.niveaux };
  if (data && typeof data.tests === 'object') {
    const ids = Object.keys(data.tests);
    const lvl = (await levels()).find((l) => ids.length && ids.every((id) => l.def.tests.some((t) => t.id === id)));
    if (!lvl) throw new Error('fichier d\'un niveau non reconnu');
    return { player: data.player || '', byLevel: { [lvl.n]: data } };
  }
  throw new Error('fichier non reconnu');
}

// ---------- la page ----------

export async function renderProfil(main, code) {
  clear(main);
  window.scrollTo(0, 0);
  main.append(...[
    code ? receiveBlock(code) : null,
    nameBlock(),
    await summaryBlock(),
    sendBlock(),
    receiveFormBlock(),
    fileBlock(),
    resetBlock(),
  ].filter(Boolean));
}

// Après une modification : le bouton Profil de l'en-tête affiche le prénom.
const notify = () => window.dispatchEvent(new Event('profil-change'));

function nameBlock() {
  const status = h('span', { class: 'meta', 'aria-live': 'polite' });
  const input = h('input', {
    type: 'text', id: 'player', value: getPlayerName(), placeholder: 'Votre prénom', autocomplete: 'given-name', maxlength: 40,
    onchange: (e) => {
      status.textContent = setPlayerName(e.target.value) ? 'Enregistré.' : 'Le navigateur bloque l\'enregistrement.';
      notify();
    },
  });
  return h('section', { class: 'block' },
    h('h2', {}, 'Joueur'),
    h('label', { class: 'player', for: 'player' }, 'Prénom ', input), ' ', status,
    h('p', { class: 'meta' }, 'Commun à tout le site ; il accompagne vos résultats quand vous les transférez ou les sauvegardez.'));
}

async function summaryBlock() {
  const STATES = { validated: 'validé', once: 'validé une fois', progress: 'en cours', none: 'non tenté' };
  const rows = (await levels()).map((lvl) => {
    const data = lvl.store.exportData();
    const attempts = Object.values(data.tests).reduce((s, t) => s + (t.attempts?.length || 0), 0);
    const states = lvl.def.tests.map((t) => lvl.store.status(t.id).state);
    const done = states.filter((s) => s === 'validated').length;
    return h('tr', {},
      h('td', {}, h('a', { href: `#niveau-${lvl.n}` }, `Niveau ${lvl.n}`), ` · ${lvl.title}`),
      h('td', {}, `${done} / ${states.length}`),
      h('td', {}, String(attempts)),
      h('td', {}, lvl.def.tests.map((t, i) => `${t.code} : ${STATES[states[i]]}`).join(' ; ')));
  });
  return h('section', { class: 'block' },
    h('h2', {}, 'Mes résultats'),
    h('div', { class: 'table-wrap' }, h('table', { class: 'summary' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Niveau'), h('th', {}, 'Tests validés'), h('th', {}, 'Tentatives'), h('th', {}, 'Détail'))),
      h('tbody', {}, rows))),
    h('p', { class: 'meta' }, 'Ils restent dans ce navigateur. Transférez-les ou sauvegardez-les ci-dessous pour ne pas les perdre.'));
}

// Résumé d'un lien reçu, puis ajout sur confirmation.
function receiveBlock(code) {
  const box = h('section', { class: 'block transfer-receive', 'aria-live': 'polite' });
  (async () => {
    let got;
    try {
      got = await readCode(code);
    } catch (err) {
      box.classList.add('ko');
      box.append(h('h2', {}, 'Lien illisible'), h('p', {}, `Ce lien ne peut pas être lu : ${err.message}.`));
      history.replaceState(null, '', '#profil');
      return;
    }
    const { rows, ignored } = await mergeLevels(got.byLevel, false);
    const total = rows.reduce((s, r) => s + r.added, 0);
    box.append(...[
      h('h2', {}, 'Résultats reçus'),
      h('p', {}, got.player ? `Joueur : ${got.player}.` : 'Joueur sans prénom.'),
      h('ul', {}, rows.map((r) => h('li', {}, `Niveau ${r.n} : ${plural(r.received, 'tentative')}, dont `,
        h('strong', {}, `${r.added} nouvelle${r.added > 1 ? 's' : ''}`), '.'))),
      ignored.length ? h('p', { class: 'meta' }, `Niveau${ignored.length > 1 ? 'x' : ''} ${ignored.join(', ')} : pas encore dans cette version de l'application, ignoré${ignored.length > 1 ? 's' : ''}.`) : null,
    ].filter(Boolean));
    history.replaceState(null, '', '#profil');   // le code quitte la barre d'adresse
    if (!total) {
      box.append(h('p', {}, h('strong', {}, 'Rien de nouveau : '), 'ces résultats sont déjà tous dans ce navigateur.'));
      return;
    }
    const message = h('p', { class: 'form-message', role: 'alert' });
    box.append(h('div', { class: 'practice-actions' },
      h('button', {
        type: 'button', class: 'btn',
        onclick: async () => {
          try {
            const done = await mergeLevels(got.byLevel, true);
            if (!getPlayerName() && got.player) { setPlayerName(got.player); notify(); }
            const added = done.rows.reduce((s, r) => s + r.added, 0);
            box.classList.add('ok');
            clear(box).append(h('h2', {}, 'Résultats ajoutés'),
              h('p', {}, `${plural(added, 'tentative')} ajoutée${added > 1 ? 's' : ''} à ce navigateur.`));
            const summary = main().querySelector('.summary')?.closest('.block');
            if (summary) summary.replaceWith(await summaryBlock());
            const nameField = main().querySelector('#player');
            if (nameField && !nameField.value) nameField.value = getPlayerName();
          } catch (err) {
            message.textContent = `Échec : ${err.message}.`;
          }
        },
      }, `Ajouter ${plural(total, 'tentative')} à mes résultats`),
      h('button', { type: 'button', class: 'btn secondary', onclick: () => box.remove() }, 'Ignorer')),
    message);
  })();
  return box;
}

const main = () => document.getElementById('app');

function sendBlock() {
  const out = h('div', {});
  const make = h('button', {
    type: 'button', class: 'btn',
    onclick: async () => {
      make.disabled = true;
      try {
        const { code, attempts } = await createCode();
        const link = transferLink(code);
        const field = h('textarea', { class: 'transfer-link', readonly: true, rows: 3, 'aria-label': 'Lien de transfert' });
        field.value = link;
        const status = h('p', { class: 'meta', 'aria-live': 'polite' },
          `${plural(attempts, 'tentative')}, lien de ${(link.length / 1024).toFixed(1)} Ko.`);
        const copy = h('button', {
          type: 'button', class: 'btn secondary',
          onclick: async () => {
            try { await navigator.clipboard.writeText(link); status.textContent = 'Lien copié.'; } catch {
              field.select(); status.textContent = 'Lien sélectionné : copiez-le (Ctrl+C).';
            }
          },
        }, 'Copier le lien');
        const share = navigator.share ? h('button', {
          type: 'button', class: 'btn secondary',
          onclick: () => navigator.share({ title: 'Mes résultats de poker', url: link }).catch(() => {}),
        }, 'Partager…') : null;
        clear(out).append(field, h('div', { class: 'practice-actions' }, copy, share), status);
      } finally {
        make.disabled = false;
      }
    },
  }, 'Créer le lien');
  return h('section', { class: 'block' },
    h('h2', {}, 'Changer d\'appareil'),
    h('p', {}, 'Le lien contient votre prénom et tous vos résultats. Envoyez-le-vous (e-mail, message), ',
      'puis ouvrez-le sur l\'autre appareil : ses résultats s\'ajoutent à ceux qui s\'y trouvent déjà.'),
    h('p', { class: 'meta' }, 'Rien ne passe par le serveur. Le lien sert aussi de sauvegarde, à la date où il est créé. ',
      'Ne le publiez pas.'),
    make, out);
}

function receiveFormBlock() {
  const field = h('textarea', { rows: 2, placeholder: 'https://…#transfert/1.…', 'aria-label': 'Lien ou code reçu' });
  const message = h('p', { class: 'form-message', role: 'alert' });
  return h('section', { class: 'block' },
    h('h2', {}, 'Recevoir des résultats'),
    h('p', {}, 'Ouvrez le lien reçu sur cet appareil, ou collez-le ici.'),
    field,
    h('div', { class: 'practice-actions' }, h('button', {
      type: 'button', class: 'btn secondary',
      onclick: async () => {
        try {
          const { code } = await readCode(field.value);
          location.hash = `#transfert/${code}`;
        } catch (err) {
          message.textContent = `Lien illisible : ${err.message}.`;
        }
      },
    }, 'Lire ce lien')),
    message);
}

function fileBlock() {
  const status = h('p', { class: 'meta', role: 'status' });
  const onFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const got = await readFile(await file.text());
      const done = await mergeLevels(got.byLevel, true);
      if (!getPlayerName() && got.player) { setPlayerName(got.player); notify(); }
      const added = done.rows.reduce((s, r) => s + r.added, 0);
      status.textContent = `${file.name} : ${plural(added, 'tentative')} ajoutée${added > 1 ? 's' : ''} (les résultats déjà présents sont conservés).`;
      const summary = main().querySelector('.summary')?.closest('.block');
      if (summary) summary.replaceWith(await summaryBlock());
    } catch (err) {
      status.textContent = `Import impossible : ${err.message}.`;
    }
  };
  return h('section', { class: 'block' },
    h('h2', {}, 'Sauvegarde dans un fichier'),
    h('p', {}, 'Un fichier JSON avec tous les niveaux. L\'import ajoute les tentatives qui manquent ; ',
      'il accepte aussi les anciens fichiers d\'un seul niveau.'),
    h('div', { class: 'practice-actions' },
      h('button', { type: 'button', class: 'btn secondary', onclick: exportFile }, 'Exporter mes résultats'),
      h('label', { class: 'btn secondary file-btn' }, 'Importer un fichier',
        h('input', { type: 'file', accept: 'application/json,.json', onchange: onFile }))),
    status);
}

function resetBlock() {
  return h('section', { class: 'block' },
    h('h2', {}, 'Effacer'),
    h('p', {}, 'Efface les résultats de tous les niveaux dans ce navigateur. Le prénom est conservé.'),
    h('button', {
      type: 'button', class: 'btn danger',
      onclick: async () => {
        if (!confirm('Effacer les résultats de tous les niveaux ? Cette action est définitive. Pensez à exporter avant.')) return;
        for (const lvl of await levels()) lvl.store.reset();
        renderProfil(main());
      },
    }, 'Effacer tous mes résultats'));
}
