// Sous-niveaux : un niveau chargé en mémorisation se découpe en étapes cumulatives (2.0, 2.1 … 2.5).
// Le joueur choisit son sous-niveau ; exercices, Réflexes et simulateur s'y règlent.
//
// - Définitions : SUBLEVELS[niveau] = [{ step, code, name }] ; seul le niveau 2 en a (les étapes
//   de « Pour retenir la grille », niveau-2/strategy.js).
// - Banque des Réflexes : le thème d'une question dit son sous-niveau, « Niveau 2.3 — … » ;
//   « Niveau 2 — … », sans sous-niveau, compte comme 2.0 (posée à tous les sous-niveaux).
//   Le thème est un texte libre dans mentor : la convention ne demande rien à mentor.
// - Cumulatif : au sous-niveau 2.3, on revoit 2.0 à 2.3.
// - Choix enregistré dans le navigateur, { niveau: { code, date } } ; repris par la sauvegarde
//   et le code de transfert de la page Profil (la date la plus récente l'emporte).
// Les fonctions de lecture et de fusion sont pures (testées sous Node, tests/sous-niveaux/).
import { STEPS } from '../niveau-2/strategy.js';

export const SUBLEVELS = { 2: STEPS };
export const KEY = 'poker.sousniveaux.v1';

export const subLevelsOf = (level) => SUBLEVELS[level] || null;

// « Niveau 2.3 — Le reste du CO » → { level: 2, step: 3 } ; « Niveau 2 — … » → { level: 2, step: null }.
export function parseTheme(theme) {
  const m = /^niveau\s+(\d+)(?:\.(\d+))?/i.exec(theme || '');
  return m ? { level: Number(m[1]), step: m[2] === undefined ? null : Number(m[2]) } : { level: null, step: null };
}

// Questions d'un niveau posées au sous-niveau choisi (étape step ; null : toutes).
export function questionsFor(questions, level, step = null) {
  return questions.filter((q) => {
    const t = parseTheme(q.theme);
    return t.level === level && (step === null || (t.step ?? 0) <= step);
  });
}

// Sous-niveau choisi parmi les données enregistrées : la définition { step, code, name }, ou la
// première étape si rien n'est choisi (ou si le code n'existe plus). null : niveau sans sous-niveaux.
export function chosen(data, level) {
  const list = subLevelsOf(level);
  if (!list) return null;
  return list.find((s) => s.code === data?.[level]?.code) || list[0];
}

// Fusion de deux choix enregistrés : par niveau, le plus récent. Renvoie { data, changed }.
export function mergeChoices(base, incoming) {
  const data = { ...(base || {}) };
  let changed = 0;
  for (const [level, c] of Object.entries(incoming || {})) {
    if (!c || typeof c.code !== 'string' || !c.date) continue;
    if (!data[level] || c.date > data[level].date) { data[level] = { code: c.code, date: c.date }; changed++; }
  }
  return { data, changed };
}

// ---------- stockage (navigateur) ----------

export function loadChoices() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    return data && typeof data === 'object' ? data : {};
  } catch { return {}; }
}

function saveChoices(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; }
}

export const currentSubLevel = (level) => chosen(loadChoices(), level);

export function setSubLevel(level, code, now = new Date().toISOString()) {
  return saveChoices({ ...loadChoices(), [level]: { code, date: now } });
}

// Import (fichier, code de transfert) : renvoie le nombre de choix repris, ou false si l'écriture échoue.
export function mergeStoredChoices(incoming) {
  const { data, changed } = mergeChoices(loadChoices(), incoming);
  if (!changed) return 0;
  return saveChoices(data) ? changed : false;
}

export function resetChoices() {
  try { localStorage.removeItem(KEY); } catch { /* stockage bloqué */ }
}

export const subLevelLabel = (s) => `${s.code} · ${s.name}`;
