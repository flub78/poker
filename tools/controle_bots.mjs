// Partie de contrôle des bots du simulateur (doc/plan-simulateur.md, phase 5) : chaque niveau de
// bot ne doit pas perdre contre le précédent (1), ni gagner moins que lui contre une table de
// profils faibles (2). Un niveau nettement moins bon trahit une règle mal codée.
//
//   node tools/controle_bots.mjs [mains] [mains-profils]
//       (défaut : 200 000 mains par paire de niveaux, 50 000 par niveau contre les profils)
//
// Méthode « duplicate » : pour chaque paire de niveaux voisins, 3 bots de chaque niveau en
// alternance autour de la table (tapis de 100 BB à chaque main), puis les mêmes cartes avec les
// places inversées. Chaque placement tient la lecture des joueurs (lecture.js), comme une partie.
// L'écart de la main k est la moyenne des deux placements : la chance des cartes
// s'annule en grande partie. On en tire l'écart moyen (BB/100, par joueur) et son erreur type.
//
// Verdict, avec t = écart ÷ erreur type :
//   t ≥ 2         le niveau supérieur gagne ;
//   −2 < t < 2    pas d'écart mesurable (c'est le cas du niveau 3 contre le 2 : ses calls de tirage
//                 au prix juste rapportent peu entre bots serrés) ;
//   t ≤ −2        ÉCHEC : le niveau supérieur perd, une règle est probablement mal codée.
// Graine fixe : résultat reproductible. Code de sortie non nul en cas d'échec.
// Lancé par bin/tester.sh (sauf --rapide).
import { newHand, act } from '../web/simulateur/moteur/table.js';
import { decider, BOT_LEVELS } from '../web/simulateur/bots.js';
import { rng } from '../web/js/cards.js';
import { createReads } from '../web/simulateur/lecture.js';

const HANDS = Number(process.argv[2]) || 200000;
const SEED = 20261115;
const BB = 2;

// Écart par main (BB par joueur, niveau haut − niveau bas, divisé par 2) pour un placement.
function play(levels, high) {
  const rand = rng(SEED);
  const out = new Float64Array(HANDS);
  const reads = createReads(6);         // comme dans une partie : les profils se lisent au fil des mains
  for (let k = 0; k < HANDS; k++) {
    const h = newHand({ stacks: Array(6).fill(100 * BB), button: k % 6, sb: BB / 2, bb: BB, rand });
    h.reads = reads;
    while (!h.done) act(h, decider(h, h.toAct, levels[h.toAct]).action);
    reads.add(h);
    let d = 0;
    h.result.net.forEach((x, i) => { d += levels[i] === high ? x : -x; });
    out[k] = d / BB / 6;
  }
  return out;
}

function compare(low, high) {
  const a = play([high, low, high, low, high, low], high);
  const b = play([low, high, low, high, low, high], high);
  let sum = 0;
  let sq = 0;
  for (let k = 0; k < HANDS; k++) {
    const d = (a[k] + b[k]) / 2;
    sum += d;
    sq += d * d;
  }
  const mean = sum / HANDS;
  const se = Math.sqrt((sq / HANDS - mean * mean) / (HANDS - 1));
  return { mean: mean * 100, se: se * 100, t: mean / se };
}

const fmt = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(2).replace('.', ',')}`;
let failed = 0;
for (let i = 1; i < BOT_LEVELS.length; i++) {
  const [low, high] = [BOT_LEVELS[i - 1], BOT_LEVELS[i]];
  const { mean, se, t } = compare(low, high);
  const verdict = t >= 2 ? 'gagne' : t > -2 ? 'pas d\'écart mesurable' : 'ÉCHEC : perd';
  if (t <= -2) failed++;
  console.log(`Niveau ${high} contre ${low} : ${fmt(mean)} BB/100 (erreur type ${se.toFixed(2).replace('.', ',')}, t = ${fmt(t)}) → ${verdict}`);
}

// ---------- 2. Contre une table de profils faibles (C5.4) ----------
// Le même joueur (siège 0) est tour à tour de chaque niveau, face aux mêmes adversaires et aux
// mêmes cartes : rock, station, maniaque, rock, station. Écart main par main entre le niveau N et
// le N−1 : le niveau N doit y gagner au moins autant (t > −2). On attend qu'il gagne plus : c'est
// contre ces joueurs que les niveaux supérieurs se distinguent.
const WEAK = ['rock', 'station', 'maniaque', 'rock', 'station'];
const WEAK_HANDS = Number(process.argv[3]) || 50000;

function atWeakTable(level) {
  const rand = rng(SEED + 1);
  const reads = createReads(6);
  const levels = [level, ...WEAK];
  const out = new Float64Array(WEAK_HANDS);
  for (let k = 0; k < WEAK_HANDS; k++) {
    const h = newHand({ stacks: Array(6).fill(100 * BB), button: k % 6, sb: BB / 2, bb: BB, rand });
    h.reads = reads;
    while (!h.done) act(h, decider(h, h.toAct, levels[h.toAct]).action);
    reads.add(h);
    out[k] = h.result.net[0] / BB;
  }
  return out;
}

const won = new Map(BOT_LEVELS.map((l) => [l, atWeakTable(l)]));
const mean100 = (a) => (100 * a.reduce((x, y) => x + y, 0)) / a.length;
console.log(`Contre une table de profils faibles (${WEAK.join(', ')}), ${WEAK_HANDS} mains :`);
console.log(`  ${BOT_LEVELS.map((l) => `niveau ${l} ${fmt(mean100(won.get(l)))}`).join(' · ')} BB/100`);
for (let i = 1; i < BOT_LEVELS.length; i++) {
  const [low, high] = [BOT_LEVELS[i - 1], BOT_LEVELS[i]];
  const a = won.get(high);
  const b = won.get(low);
  let sum = 0;
  let sq = 0;
  for (let k = 0; k < WEAK_HANDS; k++) { const d = a[k] - b[k]; sum += d; sq += d * d; }
  const mean = sum / WEAK_HANDS;
  const se = Math.sqrt((sq / WEAK_HANDS - mean * mean) / (WEAK_HANDS - 1));
  const t = mean / se;
  const verdict = t >= 2 ? 'gagne plus' : t > -2 ? 'pas d\'écart mesurable' : 'ÉCHEC : gagne moins';
  if (t <= -2) failed++;
  console.log(`  Niveau ${high} contre ${low} : ${fmt(mean * 100)} BB/100 (erreur type ${(se * 100).toFixed(2).replace('.', ',')}, t = ${fmt(t)}) → ${verdict}`);
}

if (failed) {
  console.log(`${failed} échec${failed > 1 ? 's' : ''} : une règle est probablement mal codée.`);
  process.exit(1);
}
console.log(`Aucun niveau ne fait moins bien que le précédent (${HANDS} mains par placement entre niveaux, ${WEAK_HANDS} contre les profils).`);
