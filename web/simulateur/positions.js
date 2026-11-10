// Positions à une table de 6 (C2.1) et montants affichés en grosses blinds.
export const POSITIONS_6 = ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'];

// Position de chaque siège : à partir du bouton, dans le sens du jeu.
// À moins de 6 joueurs, on retire d'abord les places du début (UTG, puis MP…).
export function positions(hand) {
  const n = hand.order.length;                       // joueurs servis, à partir de la gauche du bouton
  const names = n === 2 ? ['BB', 'BTN'] : [...POSITIONS_6.slice(1, 3), ...POSITIONS_6.slice(3 + (6 - n)), 'BTN'];
  const out = {};
  hand.order.forEach((seat, k) => { out[seat] = names[k]; });
  return out;
}

export const isBlind = (pos) => pos === 'SB' || pos === 'BB';

// 7 jetons avec une grosse blind de 2 → « 3,5 BB ».
export function bbText(chips, bb = 2) {
  const x = Math.round((chips / bb) * 10) / 10;
  return `${String(x).replace('.', ',')} BB`;
}

// Pot total : tout ce qui a été misé dans la main, mises du tour en cours comprises.
export const potTotal = (hand) => hand.seats.reduce((a, s) => a + s.committed, 0);
