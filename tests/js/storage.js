// Historique des tentatives, conservé dans le navigateur (localStorage).
// Règle : un test est validé après deux réussites séparées d'au moins
// CONFIG.minDaysBetween jours calendaires.
// createStore(clé) renvoie le magasin d'un niveau : chaque niveau a sa propre clé.
import { CONFIG } from './config.js';

const EMPTY = () => ({ version: 1, player: '', tests: {} });

const dayIndex = (iso) => {
  const d = new Date(iso);
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
};

export function addDays(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString();
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
    getPlayer: () => read().player,

    setPlayer(name) {
      const data = read();
      data.player = name.trim();
      write(data);
    },

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

    exportJSON: () => JSON.stringify(read(), null, 2),

    importJSON(text) {
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object' || typeof data.tests !== 'object') {
        throw new Error('Fichier non reconnu.');
      }
      write({ ...EMPTY(), ...data });
    },

    reset() {
      write(EMPTY());
    },
  };
}
