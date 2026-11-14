// Progression des Réflexes dans le navigateur (localStorage), une suite Leitner par niveau.
// Donnée : { version: 1, suites: { '1': état de suite (leitner.js), '2': … } }.
// Sauvegarde, import et effacement passent par la page Profil (js/profil.js).
import { emptySuite, mergeSuites } from './leitner.js';

export const KEY = 'poker.reflexes.v1';

export function loadAll() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (data && typeof data.suites === 'object') return data;
  } catch { /* stockage bloqué ou illisible */ }
  return { version: 1, suites: {} };
}

function saveAll(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; }
}

export const loadSuite = (level) => loadAll().suites[level] || emptySuite();

export function saveSuite(level, suite) {
  const data = loadAll();
  data.suites[level] = suite;
  return saveAll(data);
}

// Import d'une sauvegarde : fusion suite par suite (leitner.js, mergeSuites).
// Renvoie le nombre de suites reçues, ou false si l'écriture échoue.
export function mergeAll(incoming) {
  if (!incoming || typeof incoming.suites !== 'object') return 0;
  const data = loadAll();
  let n = 0;
  for (const [level, suite] of Object.entries(incoming.suites)) {
    if (!suite || typeof suite.items !== 'object') continue;
    data.suites[level] = mergeSuites(data.suites[level], suite);
    n++;
  }
  if (!n) return 0;
  return saveAll(data) ? n : false;
}

export function resetAll() {
  try { localStorage.removeItem(KEY); } catch { /* stockage bloqué */ }
}
