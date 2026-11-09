// Historique des tentatives, conservé dans le navigateur (localStorage).
// Règle : un test est validé après deux réussites séparées d'au moins
// CONFIG.minDaysBetween jours calendaires.
// createStore(clé) renvoie le magasin d'un niveau : chaque niveau a sa propre clé.
import { CONFIG } from './config.js';

const EMPTY = () => ({ version: 1, player: '', tests: {} });

// Prénom du joueur : un seul pour tout le site (page Profil). Avant, chaque niveau avait le sien
// (champ player de ses données) : s'il n'y a pas encore de prénom global, on reprend celui-là.
const PLAYER_KEY = 'poker.joueur';

export function getPlayerName() {
  try {
    const name = localStorage.getItem(PLAYER_KEY);
    if (name !== null) return name;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (/^poker\.niveau\d+\./.test(key)) {
        const old = JSON.parse(localStorage.getItem(key) || '{}').player;
        if (old) return old;
      }
    }
  } catch { /* stockage bloqué */ }
  return '';
}

export function setPlayerName(name) {
  try {
    localStorage.setItem(PLAYER_KEY, name.trim());
    return true;
  } catch {
    return false;
  }
}

const dayIndex = (iso) => {
  const d = new Date(iso);
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
};

export function addDays(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// Identité d'une tentative : sa seconde et sa graine. Une tentative n'est jamais modifiée, donc
// fusionner deux historiques revient à les réunir sans doublon (code de transfert, import).
const attemptKey = (a) => `${Math.floor(Date.parse(a.date) / 1000)}|${a.seed}`;

// Fusionne incoming dans base (deux données de niveau { version, player, tests }).
// Renvoie { data, added } ; base n'est pas modifié. (Le prénom est global : getPlayerName.)
export function mergeData(base, incoming) {
  const data = { ...EMPTY(), ...base, tests: { ...base.tests } };
  let added = 0;
  for (const [testId, t] of Object.entries(incoming.tests || {})) {
    const mine = data.tests[testId]?.attempts || [];
    const seen = new Set(mine.map(attemptKey));
    const fresh = (t.attempts || []).filter((a) => a && a.date && !seen.has(attemptKey(a)) && seen.add(attemptKey(a)));
    if (!fresh.length) continue;
    added += fresh.length;
    data.tests[testId] = { ...data.tests[testId], attempts: [...mine, ...fresh].sort((a, b) => a.date.localeCompare(b.date)) };
  }
  return { data, added };
}

export function createStore(storageKey) {
  function read() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? { ...EMPTY(), ...JSON.parse(raw) } : EMPTY();
    } catch {
      return EMPTY();
    }
  }

  function write(data) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      return true;
    } catch {
      return false;          // navigation privée ou stockage bloqué : le test reste utilisable
    }
  }

  const attempts = (testId) => read().tests[testId]?.attempts || [];

  return {
    getPlayer: getPlayerName,
    setPlayer: setPlayerName,

    attempts,

    addAttempt(testId, attempt) {
      const data = read();
      data.tests[testId] = data.tests[testId] || { attempts: [] };
      data.tests[testId].attempts.push(attempt);
      return write(data);
    },

    // État d'un test : 'none' | 'progress' | 'once' | 'validated'
    status(testId) {
      const list = attempts(testId);
      if (!list.length) return { state: 'none', count: 0 };
      const passed = list.filter((a) => a.passed).sort((a, b) => a.date.localeCompare(b.date));
      if (!passed.length) return { state: 'progress', count: list.length };
      const first = passed[0];
      const second = passed.find((a) => dayIndex(a.date) - dayIndex(first.date) >= CONFIG.minDaysBetween);
      if (second) return { state: 'validated', count: list.length, first: first.date, second: second.date };
      return {
        state: 'once', count: list.length, first: first.date,
        nextFrom: addDays(first.date, CONFIG.minDaysBetween),
      };
    },

    exportData: () => read(),

    exportJSON: () => JSON.stringify(read(), null, 2),

    // Ajoute les tentatives de incoming qui manquent ; renvoie leur nombre (false si l'écriture échoue).
    merge(incoming) {
      const { data, added } = mergeData(read(), incoming);
      if (!added) return 0;
      return write(data) ? added : false;
    },

    // Import d'un fichier exporté : fusion, pas remplacement (les tentatives locales restent).
    importJSON(text) {
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object' || typeof data.tests !== 'object') {
        throw new Error('Fichier non reconnu.');
      }
      const added = this.merge(data);
      if (added === false) throw new Error('le navigateur bloque l\'enregistrement.');
      return added;
    },

    reset() {
      write(EMPTY());
    },
  };
}
