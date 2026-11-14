// Moteur de répétition espacée (méthode Leitner), module pur : aucun accès au DOM ni au stockage.
// Mêmes règles que le module Leitner de mentor (PRD leitner §7 ; app/Leitner/Engine) :
//   - boîtes posées : la boîte 1 à chaque séance, plus une seule boîte haute, en rotation : à la
//     séance n, la boîte 2 + v, où v est le nombre de fois que n est divisible par 2 (boîte 2 une
//     séance sur deux, boîte 3 une sur quatre, boîte k une sur 2^(k−1)) ; si elle dépasse la
//     dernière boîte, seule la boîte 1 est posée. La charge reste régulière d'une séance à l'autre ;
//   - réponse juste : la question monte d'une boîte ; juste dans la dernière : maîtrisée ;
//   - réponse fausse : elle recule d'une boîte ; second échec de suite : retour en boîte 1 ;
//   - seule la première réponse d'une séance compte ; une question échouée est reposée en fin
//     de séance jusqu'à être réussie (reprise), sans changer sa boîte ;
//   - nouvelles questions : si la boîte 1 en compte moins que le minimum, on en introduit,
//     par difficulté croissante (sans difficulté = moyenne), au hasard dans un même niveau.
// Le rythme se compte en séances, pas en jours.
//
// État d'une suite (enregistré tel quel) :
//   { version: 1, session: dernier numéro de séance, sessions: [dates ISO],
//     items: { idQuestion: { box, fails, mastered: date ISO | null } },
//     current: séance en cours (createRun().snapshot() + number), absente une fois la séance finie }
// Une question absente de items est « en banque » (jamais posée).
// Séance interrompue : la reprendre continue les questions restantes, avec le même numéro ;
// en commencer une nouvelle abandonne le reste et avance le numéro (donc les boîtes posées).

export const DEFAULTS = { boxCount: 5, minBoxOne: 10 };

export const emptySuite = () => ({ version: 1, session: 0, sessions: [], items: {} });

export function boxesDue(sessionNumber, boxCount = DEFAULTS.boxCount) {
  let n = Math.max(1, sessionNumber);
  let v = 0;                                   // nombre de fois que n est divisible par 2
  while (n % 2 === 0) { n /= 2; v++; }
  const high = 2 + v;
  return high <= boxCount ? [1, high] : [1];
}

// Nouvel état d'une question après sa première réponse de la séance.
export function move(item, ok, boxCount = DEFAULTS.boxCount, now = new Date().toISOString()) {
  if (ok) {
    return item.box >= boxCount
      ? { box: boxCount, fails: 0, mastered: now }
      : { box: item.box + 1, fails: 0, mastered: null };
  }
  return { box: item.fails > 0 ? 1 : Math.max(1, item.box - 1), fails: item.fails + 1, mastered: null };
}

function shuffle(list, rand) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const difficultyRank = (d) => {
  const s = String(d || '').trim().toLowerCase();
  return { 1: 1, facile: 1, 3: 3, difficile: 3 }[s] || 2;
};

// Questions de la banque encore jamais posées, dans l'ordre d'introduction.
export function newQuestions(suite, questions, rand = Math.random) {
  const fresh = questions.filter((q) => !suite.items[q.id]);
  return [1, 2, 3].flatMap((d) => shuffle(fresh.filter((q) => difficultyRank(q.difficulte) === d), rand));
}

// Prépare la séance suivante : { number, introduced: [ids], queue: [ids] }. Ne modifie rien.
export function planSession(suite, questions, { boxCount = DEFAULTS.boxCount, minBoxOne = DEFAULTS.minBoxOne, rand = Math.random } = {}) {
  const number = suite.session + 1;
  const known = questions.filter((q) => suite.items[q.id]);
  const inBoxOne = known.filter((q) => !suite.items[q.id].mastered && suite.items[q.id].box === 1).length;
  const introduced = newQuestions(suite, questions, rand).slice(0, Math.max(0, minBoxOne - inBoxOne)).map((q) => q.id);
  const due = boxesDue(number, boxCount);
  const selected = known.filter((q) => !suite.items[q.id].mastered && due.includes(suite.items[q.id].box)).map((q) => q.id);
  return { number, introduced, queue: shuffle([...selected, ...introduced], rand) };
}

// Ouvre la séance planifiée : numéro avancé, questions introduites en boîte 1.
export function startSession(suite, plan, now = new Date().toISOString()) {
  const items = { ...suite.items };
  for (const id of plan.introduced) items[id] = { box: 1, fails: 0, mastered: null };
  return { ...suite, session: plan.number, sessions: [...suite.sessions, now], items };
}

export function recordAnswer(suite, id, ok, boxCount = DEFAULTS.boxCount, now = new Date().toISOString()) {
  const item = suite.items[id] || { box: 1, fails: 0, mastered: null };
  return { ...suite, items: { ...suite.items, [id]: move(item, ok, boxCount, now) } };
}

// Déroulé d'une séance, avec la reprise des erreurs :
//   const run = createRun(plan.queue);     ou createRun(null, instantané) pour reprendre
//   run.current()            id de la question à poser, ou null à la fin
//   run.isRetry(id)          true si la question a déjà eu sa première réponse (reprise d'erreur)
//   run.answer(ok)           → { counts: true si c'est la première réponse (à enregistrer) }
//   run.stats()              { asked, good, retries, left, total }
//   run.snapshot()           état à enregistrer : { todo, answered, good, retries, total }
export function createRun(queue, saved = null) {
  const todo = (saved?.todo || queue).slice();
  const answered = new Set(saved?.answered || []);
  let good = saved?.good || 0;
  let retries = saved?.retries || 0;
  const total = saved?.total ?? queue.length;
  return {
    current: () => todo[0] ?? null,
    isRetry: (id) => answered.has(id),
    answer(ok) {
      const id = todo.shift();
      const first = !answered.has(id);
      if (first) { answered.add(id); if (ok) good++; } else retries++;
      if (!ok) todo.push(id);               // reposée en fin de séance
      return { counts: first };
    },
    stats: () => ({ asked: answered.size, good, retries, left: todo.length, total }),
    snapshot: () => ({ todo: todo.slice(), answered: [...answered], good, retries, total }),
  };
}

// Séance interrompue à reprendre : { number, run } ou null. known(id) dit si la question existe
// encore dans la banque (une question retirée entre-temps est sautée).
export function resumable(suite, known = () => true) {
  const c = suite.current;
  if (!c || c.number !== suite.session || !Array.isArray(c.todo)) return null;
  const todo = c.todo.filter(known);
  if (!todo.length) return null;
  return { number: c.number, run: createRun(null, { ...c, todo }) };
}

// État de la suite pour l'affichage : questions en banque, par boîte, maîtrisées.
export function summary(suite, questions, boxCount = DEFAULTS.boxCount) {
  const boxes = Array(boxCount).fill(0);
  let mastered = 0;
  let fresh = 0;
  for (const q of questions) {
    const item = suite.items[q.id];
    if (!item) fresh++;
    else if (item.mastered) mastered++;
    else boxes[Math.min(item.box, boxCount) - 1]++;
  }
  return {
    total: questions.length, fresh, boxes, mastered,
    acquired: questions.length > 0 && mastered === questions.length,
    sessions: suite.session,
  };
}

// Fusion de deux états de la même suite (import d'une sauvegarde) : on garde l'état qui a fait
// le plus de séances ; les questions qu'il ne connaît pas sont reprises de l'autre.
export function mergeSuites(a, b) {
  const [main, other] = (b?.session || 0) > (a?.session || 0) ? [b, a] : [a, b];
  if (!other) return main;
  return {
    ...main,
    sessions: [...new Set([...(other.sessions || []), ...(main.sessions || [])])].sort(),
    items: { ...(other.items || {}), ...(main.items || {}) },
  };
}

// Change les identifiants des questions d'une suite (map : ancien → nouveau), séance en cours
// comprise. Sert à reprendre la progression quand une question reçoit un identifiant stable
// (référence). Un nouvel identifiant déjà suivi garde son état. Renvoie { suite, moved }.
export function renameItems(suite, map) {
  const items = { ...suite.items };
  let moved = 0;
  for (const [from, to] of map) {
    if (from === to || !items[from]) continue;
    if (!items[to]) { items[to] = items[from]; moved++; }
    delete items[from];
  }
  if (!moved) return { suite, moved };
  const ren = (id) => (map.has(id) && suite.items[id] ? map.get(id) : id);
  const c = suite.current;
  const current = c ? { ...c, todo: c.todo.map(ren), answered: c.answered.map(ren) } : c;
  return { suite: { ...suite, items, ...(c ? { current } : {}) }, moved };
}
