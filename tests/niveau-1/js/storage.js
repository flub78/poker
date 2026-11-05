// Historique des tentatives, conservé dans le navigateur (localStorage).
// Règle : un test est validé après deux réussites séparées d'au moins
// CONFIG.minDaysBetween jours calendaires.
import { CONFIG } from './config.js';

const EMPTY = () => ({ version: 1, player: '', tests: {} });

function read() {
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    return raw ? { ...EMPTY(), ...JSON.parse(raw) } : EMPTY();
  } catch {
    return EMPTY();
  }
}

function write(data) {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    return true;
  } catch {
    return false;          // navigation privée ou stockage bloqué : le test reste utilisable
  }
}

export function getPlayer() {
  return read().player;
}

export function setPlayer(name) {
  const data = read();
  data.player = name.trim();
  write(data);
}

export function attempts(testId) {
  return read().tests[testId]?.attempts || [];
}

export function addAttempt(testId, attempt) {
  const data = read();
  data.tests[testId] = data.tests[testId] || { attempts: [] };
  data.tests[testId].attempts.push(attempt);
  return write(data);
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

// État d'un test : 'none' | 'progress' | 'once' | 'validated'
export function status(testId) {
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
}

export function exportJSON() {
  return JSON.stringify(read(), null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || typeof data.tests !== 'object') {
    throw new Error('Fichier non reconnu.');
  }
  write({ ...EMPTY(), ...data });
}

export function reset() {
  write(EMPTY());
}
