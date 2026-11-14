// Tests exigés d'un joueur pour valider un niveau. JavaScript pur (tests/existants/validation.test.js).
//
// Un test ajouté à un niveau après coup porte la date de son ajout (since: 'AAAA-MM-JJ'). Un joueur
// qui avait déjà validé, avant cette date, tous les tests plus anciens du niveau garde son niveau :
// le nouveau test est facultatif pour lui (il peut le passer, sans que cela compte). Pour les
// autres joueurs, il est exigé comme les autres. Les tentatives enregistrées ne changent jamais.
//
// requirements(tests, statusOf) → [{ test, status, required }], dans l'ordre de tests.
// statusOf(id) : état d'un test (store.status), { state, second? } où second est la date ISO
// de la seconde réussite quand state vaut 'validated'.

// Minuit (heure locale) le jour since.
const startOf = (since) => new Date(`${since}T00:00:00`).getTime();

export function requirements(tests, statusOf) {
  const status = new Map(tests.map((t) => [t.id, statusOf(t.id)]));
  return tests.map((test) => {
    let required = true;
    if (test.since) {
      const older = tests.filter((t) => !t.since || t.since < test.since);
      required = !older.length || !older.every((t) => {
        const st = status.get(t.id);
        return st.state === 'validated' && new Date(st.second).getTime() < startOf(test.since);
      });
    }
    return { test, status: status.get(test.id), required };
  });
}

// Bilan d'un niveau : { done, total, ok } sur les tests exigés seulement.
export function levelProgress(reqs) {
  const mine = reqs.filter((r) => r.required);
  const done = mine.filter((r) => r.status.state === 'validated').length;
  return { done, total: mine.length, ok: done === mine.length };
}
