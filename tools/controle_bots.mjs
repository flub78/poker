// Partie de contrôle des bots du simulateur (doc/plan-simulateur.md, phase 5) : chaque niveau de
// bot ne doit pas perdre contre le précédent. Un niveau nettement moins bon trahit une règle mal codée.
//
//   node tools/controle_bots.mjs [mains]      (défaut : 200 000 mains par paire de niveaux)
//
// Méthode « duplicate » : pour chaque paire de niveaux voisins, 3 bots de chaque niveau en
// alternance autour de la table (tapis de 100 BB à chaque main), puis les mêmes cartes avec les
// places inversées. L'écart de la main k est la moyenne des deux placements : la chance des cartes
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

const HANDS = Number(process.argv[2]) || 200000;
const SEED = 20261115;
const BB = 2;

// Écart par main (BB par joueur, niveau haut − niveau bas, divisé par 2) pour un placement.
function play(levels, high) {
  const rand = rng(SEED);
  const out = new Float64Array(HANDS);
  for (let k = 0; k < HANDS; k++) {
    const h = newHand({ stacks: Array(6).fill(100 * BB), button: k % 6, sb: BB / 2, bb: BB, rand });
    while (!h.done) act(h, decider(h, h.toAct, levels[h.toAct]).action);
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
if (failed) {
  console.log(`${failed} niveau${failed > 1 ? 'x perdent' : ' perd'} contre le précédent : une règle est probablement mal codée.`);
  process.exit(1);
}
console.log(`Aucun niveau ne perd contre le précédent (${HANDS} mains par placement).`);
