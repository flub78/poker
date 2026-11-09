// Calculs du niveau 3 : chances de toucher (règle du 2 et du 4, valeur exacte), équité requise
// pour suivre (cote du pot), espérance de gain. Pourcentages en nombres (35 = 35 %).

// Règle du 2 et du 4 (C3.2). Au flop pour voir turn et river : outs × 4, moins 1 point par out
// au-dessus de 8. Au turn, pour la river seule : outs × 2.
export function ruleOf24(outs, street) {
  if (street === 'turn') return outs * 2;
  return outs * 4 - Math.max(0, outs - 8);
}

// Chance exacte de toucher au moins un out : du flop à la river (47 cartes inconnues, deux tirages)
// ou du turn à la river (46 cartes inconnues).
export function exactHit(outs, street) {
  if (street === 'turn') return (100 * outs) / 46;
  const miss = ((47 - outs) * (46 - outs)) / (47 * 46);
  return 100 * (1 - miss);
}

// Équité requise (C3.3) = montant à payer ÷ pot total après votre call. pot : avant la mise adverse.
export function required(pot, bet) {
  return (100 * bet) / (pot + 2 * bet);
}

// Espérance d'un call (C3.6) : equity en %, gain = ce qu'il y a au milieu avant votre call.
export function evCall(equity, gain, call) {
  const p = equity / 100;
  return p * gain - (1 - p) * call;
}

// Affichage : « 35 % », « 28,6 % ».
export const pct = (x, digits = 0) => `${x.toFixed(digits).replace('.', ',')} %`;
export const num = (x) => String(x).replace('.', ',');

// Lecture d'un nombre saisi : « 28,6 », « 28.6 », « 29 % », « -12 », « −12 ».
export function parseNumber(text) {
  const s = String(text).trim().replace(/\s|%/g, '').replace(',', '.').replace('−', '-');
  if (!/^[-+]?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

// Le tableau des repères de C3.3 : mise en part du pot → équité requise (arrondie, comme le cours).
export const TABLE = [
  { label: '1/4 de pot', bet: 1 / 4, need: 17 },
  { label: '1/3 de pot', bet: 1 / 3, need: 20 },
  { label: '1/2 pot', bet: 1 / 2, need: 25 },
  { label: '2/3 de pot', bet: 2 / 3, need: 29 },
  { label: 'Pot', bet: 1, need: 33 },
  { label: '2 pots', bet: 2, need: 40 },
];
