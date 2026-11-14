// Lecture d'une banque de questions exportée par mentor (module Banques, PRD banques §8),
// et verdict d'une réponse. Module pur : aucun accès au DOM ni au stockage (testé sous Node).
//
// La banque est déposée telle quelle dans web/reflexes/banque/ : le contenu de l'archive ZIP
// exportée par mentor (questions.csv, images/, banque.json). On ne l'édite jamais ici.
//
//   const { questions, ignored } = readBank(texteCsv);
//   verdict(question, réponse) → true | false
//
// Types lus : qcm, vrai_faux, auto_evaluation, valeur_numerique. Les autres types du format
// (réponse courte, énumération…) sont écartés et comptés dans ignored, avec leur motif.

export const TYPES = ['qcm', 'vrai_faux', 'auto_evaluation', 'valeur_numerique'];

// ---------- CSV ----------

// Découpe un texte CSV en lignes de cellules (guillemets, retours à la ligne dans un champ).
// Séparateur : « ; » ou « , », deviné sur la ligne d'en-tête. BOM toléré.
export function parseCsv(text) {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.slice(0, src.search(/\r?\n|$/));
  const sep = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
    } else if (c === '"' && cell === '') quoted = true;
    else if (c === sep) { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

// « Bonne réponse » → bonne_reponse ; « Vrai faux » → vrai_faux (en-têtes et types, §8.1 et §8.3).
export const normalize = (s) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[\s-]+/g, '_');

// Nombre au format du fichier : virgule ou point décimal, espaces des milliers, signe moins typographique.
export function parseNumber(text) {
  const s = String(text ?? '').trim().replace(/[\s  ]/g, '').replace('−', '-').replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  return Number(s);
}

const yesNo = (text, fallback) => {
  const s = normalize(text || '');
  if (['oui', 'vrai', '1'].includes(s)) return true;
  if (['non', 'faux', '0'].includes(s)) return false;
  return fallback;
};

// Liste dans une cellule (§8.3) : éléments séparés par « | » ; « \| », « \= » et « \\ » désignent les
// caractères eux-mêmes, espaces de bord retirés, éléments vides ignorés.
export function parseList(text) {
  const items = [];
  let cur = '';
  const src = String(text ?? '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '\\' && i + 1 < src.length && '|=\\'.includes(src[i + 1])) { cur += src[++i]; continue; }
    if (c === '|') { items.push(cur); cur = ''; continue; }
    cur += c;
  }
  items.push(cur);
  return items.map((x) => x.trim()).filter(Boolean);
}

// Identifiant d'une question pour la progression : sa référence (colonne `reference`, stable
// d'un export à l'autre, même quand l'énoncé change), sinon l'empreinte de son type et de son
// énoncé (une question sans référence dont l'énoncé change repart à zéro).
export const referenceId = (reference) => `ref:${reference}`;

export function questionId(type, enonce) {
  let h = 2166136261;                       // FNV-1a 32 bits
  for (const ch of `${type}|${enonce.trim()}`) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36);
}

// ---------- banque ----------

export function readBank(text) {
  const [head, ...lines] = parseCsv(text);
  if (!head) return { questions: [], ignored: [] };
  const cols = head.map(normalize);
  const questions = [];
  const ignored = [];
  const refs = new Map();             // référence → ligne : unique dans le fichier
  lines.forEach((cells, i) => {
    const line = i + 2;
    const get = (name) => (cells[cols.indexOf(name)] ?? '').trim();
    const type = normalize(get('type') || 'qcm');
    const enonce = get('enonce');
    const skip = (reason) => ignored.push({ line, type, reason });
    if (!enonce) return skip('énoncé vide');
    if (!TYPES.includes(type)) return skip(`type ${type} non pris en charge`);
    const reference = get('reference');
    if (reference && refs.has(reference)) return skip(`référence ${reference} déjà portée par la ligne ${refs.get(reference)}`);
    if (reference) refs.set(reference, line);
    const q = {
      id: reference ? referenceId(reference) : questionId(type, enonce),
      reference: reference || null,
      line,
      type,
      enonce,
      explication: get('explication'),
      theme: get('theme') || get('module'),
      difficulte: get('difficulte'),
      image: get('illustration') || null,
      alt: get('texte_alternatif') || (get('illustration') ? `Illustration : ${enonce.slice(0, 60)}` : ''),
    };
    if (type === 'qcm') {
      q.bonne = get('bonne_reponse');
      q.mauvaises = cols.map((c, k) => (/^mauvaise_reponse_\d+$/.test(c) ? [Number(c.slice(17)), (cells[k] ?? '').trim()] : null))
        .filter((x) => x && x[1]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
      q.melange = yesNo(get('melange'), true);
      if (!q.bonne || !q.mauvaises.length) return skip('QCM sans bonne réponse ou sans mauvaise réponse');
      // Ordre d'affichage sans mélange : colonne `ordre`, sinon la bonne réponse puis les mauvaises.
      const all = [q.bonne, ...q.mauvaises];
      const ordre = q.melange ? [] : parseList(get('ordre'));
      if (ordre.length) {
        const bad = ordre.find((x, k) => !all.includes(x) || ordre.indexOf(x) !== k) ?? all.find((x) => !ordre.includes(x));
        if (bad !== undefined) return skip(`colonne ordre : proposition « ${bad} » absente, inconnue ou répétée`);
      }
      q.ordre = q.melange ? null : (ordre.length ? ordre : all);
    } else if (type === 'vrai_faux') {
      q.reponse = yesNo(get('reponse'), null);
      if (q.reponse === null) return skip('réponse vrai / faux illisible');
    } else if (type === 'auto_evaluation') {
      q.reponse = get('reponse');
      if (!q.reponse) return skip('réponse de référence vide');
    } else {
      q.valeur = parseNumber(get('valeur'));
      q.typeTolerance = normalize(get('type_tolerance') || 'aucune');
      q.tolerance = q.typeTolerance === 'aucune' ? 0 : parseNumber(get('tolerance'));
      q.unite = get('unite');
      if (q.valeur === null) return skip('valeur numérique illisible');
      if (!['aucune', 'absolue', 'pourcentage'].includes(q.typeTolerance) || q.tolerance === null || q.tolerance < 0) {
        return skip('tolérance illisible');
      }
    }
    questions.push(q);
  });
  return { questions, ignored };
}

// Anciens identifiants d'une question qui a une référence, pour reprendre la progression
// enregistrée avant les références : empreinte de l'énoncé, et de l'énoncé suivi de « (référence) »
// (forme des énoncés rendus uniques par tools/leitner_export.py avant la colonne reference).
export function legacyIds(q) {
  if (!q.reference) return [];
  return [questionId(q.type, q.enonce), questionId(q.type, `${q.enonce} (${q.reference})`)];
}

// Niveau du cours d'une question : son thème commence par « Niveau N ». Sinon null.
export const levelOfTheme = (theme) => Number(/^niveau\s+(\d+)/i.exec(theme || '')?.[1]) || null;

// ---------- verdict ----------

// answer : texte du choix (qcm), booléen (vrai_faux), texte saisi (valeur_numerique),
// booléen « je savais » (auto_evaluation).
export function verdict(q, answer) {
  switch (q.type) {
    case 'qcm': return answer === q.bonne;
    case 'vrai_faux': return answer === q.reponse;
    case 'auto_evaluation': return answer === true;
    case 'valeur_numerique': {
      const x = parseNumber(answer);
      if (x === null) return false;
      const gap = Math.abs(x - q.valeur);
      const allowed = q.typeTolerance === 'absolue' ? q.tolerance
        : q.typeTolerance === 'pourcentage' ? Math.abs(q.valeur) * q.tolerance / 100 : 0;
      return gap <= allowed + 1e-9;
    }
    default: return false;
  }
}

// Réponse attendue, en texte, pour la correction.
export function expected(q) {
  switch (q.type) {
    case 'qcm': return q.bonne;
    case 'vrai_faux': return q.reponse ? 'Vrai' : 'Faux';
    case 'auto_evaluation': return q.reponse;
    case 'valeur_numerique': {
      const n = (x) => String(x).replace('.', ',').replace('-', '−');
      const tol = q.typeTolerance === 'absolue' ? ` (± ${n(q.tolerance)})`
        : q.typeTolerance === 'pourcentage' ? ` (± ${n(q.tolerance)} %)` : '';
      return `${n(q.valeur)}${q.unite ? ` ${q.unite}` : ''}${tol}`;
    }
    default: return '';
  }
}
