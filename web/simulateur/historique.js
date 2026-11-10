// Historique des parties du simulateur, gardé dans ce navigateur (localStorage) et affiché sur la
// page Profil. Une partie n'est jamais modifiée : fusionner deux historiques (import d'un fichier)
// revient à les réunir sans doublon (même date à la seconde près et même graine).
const KEY = 'poker.simulateur.parties';
const MAX = 200;

const keyOf = (p) => `${Math.floor(Date.parse(p.date) / 1000)}|${p.seed}`;

// Résumé enregistré d'une évaluation (evaluation.js) : nombres simples, montants en BB.
export function summarize(ev, game, date = new Date().toISOString()) {
  const you = ev.players.find((p) => p.human);
  const af = you.stats.af;
  return {
    date, seed: ev.seed, hands: ev.hands, level: you.level, judgedAt: you.judgedAt,
    decisions: you.decisions, ...you.counts,
    vpip: Math.round(you.stats.vpip), pfr: Math.round(you.stats.pfr),
    af: af === null ? null : af === Infinity ? 'inf' : Math.round(af * 10) / 10,
    gains: you.gains / game.bb, rules: you.byRule.slice(0, 3).map((r) => r.code),
  };
}

export function loadParties() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.sort((a, b) => a.date.localeCompare(b.date)).slice(-MAX)));
    return true;
  } catch { return false; }
}

export const saveParty = (party) => write([...loadParties(), party]);

// Ajoute les parties absentes ; renvoie leur nombre (false si l'écriture échoue).
export function mergeParties(incoming) {
  const list = loadParties();
  const seen = new Set(list.map(keyOf));
  const fresh = (Array.isArray(incoming) ? incoming : []).filter((p) => p && p.date && !seen.has(keyOf(p)) && seen.add(keyOf(p)));
  if (!fresh.length) return 0;
  return write([...list, ...fresh]) ? fresh.length : false;
}

export function clearParties() {
  try { localStorage.removeItem(KEY); } catch { /* stockage bloqué */ }
}
