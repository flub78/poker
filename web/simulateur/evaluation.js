// Évaluation d'une partie : chaque décision jugée par le mentor, statistiques du cours (VPIP, PFR,
// AF, profils de C5.4), commentaires. JavaScript pur, testé sous Node (tests/simulateur/).
//
// Qui est jugé avec quelles règles :
//   le joueur humain : les règles de son niveau, comme le mentor ;
//   les bots         : les règles du niveau de référence (le plus haut disponible), pour montrer
//                      ce qu'un niveau de plus apporte.
import { BOT_LEVELS, playLevel } from './bots.js';
import { evCall } from '../niveau-3/odds.js';
import { potTotal } from './positions.js';

export const REFERENCE_LEVEL = Math.max(...BOT_LEVELS);
export const judgeLevel = (player) => (player.human ? playLevel(player.level) : REFERENCE_LEVEL);

// Coût d'un coup : { stake, ev }.
//   stake : jetons engagés par le coup (pour un « se coucher » : le pot abandonné) ;
//   ev    : espérance de gain perdue par rapport au coup conseillé, quand elle se calcule
//           (suivre ou se coucher face à une mise, avec une équité connue : C3.6).
export function costOf(hand, action, advice, legal) {
  const s = hand.seats[hand.toAct];
  const pot = potTotal(hand);
  const stake = action.type === 'call' ? legal.toCall
    : action.type === 'raise' ? action.to - s.bet
      : action.type === 'fold' ? pot : 0;
  let ev = null;
  const f = advice.facts || {};
  if (f.equity !== undefined && action.type !== advice.action.type
    && ['call', 'fold'].includes(action.type) && ['call', 'fold'].includes(advice.action.type)) {
    ev = Math.abs(evCall(f.equity, pot, legal.toCall));
  }
  return { stake, ev };
}

// ---------- statistiques (C5.4) ----------

// hands : mains terminées. Renvoie { hands, vpip, pfr, af } (pourcentages, AF en rapport ;
// af = null sans aucun call ni mise après le flop, Infinity sans call).
export function playerStats(hands, seat) {
  let dealt = 0; let vpip = 0; let pfr = 0; let aggr = 0; let calls = 0;
  for (const hand of hands) {
    if (!hand.seats[seat]?.dealt) continue;
    dealt++;
    const mine = hand.history.filter((e) => e.seat === seat);
    const pre = mine.filter((e) => e.street === 'preflop');
    if (pre.some((e) => e.type === 'call' || e.type === 'raise')) vpip++;
    if (pre.some((e) => e.type === 'raise')) pfr++;
    for (const e of mine) {
      if (e.street === 'preflop') continue;
      if (e.type === 'raise') aggr++;
      if (e.type === 'call') calls++;
    }
  }
  const pct = (n) => (dealt ? (100 * n) / dealt : 0);
  const af = calls ? aggr / calls : aggr ? Infinity : null;
  return { hands: dealt, vpip: pct(vpip), pfr: pct(pfr), af };
}

// Profil selon les repères de C5.4 : serré VPIP < 25 %, large > 35 % ; passif AF < 1,5, agressif > 2,5.
export function profile({ vpip, af }) {
  const width = vpip < 25 ? 'serré' : vpip > 35 ? 'large' : null;
  const style = af === null ? null : af < 1.5 ? 'passif' : af > 2.5 ? 'agressif' : null;
  if (width && style) return `${width}-${style}`;
  if (width) return `${width}, agressivité moyenne`;
  if (style) return `${style}, nombre de mains moyen`;
  return 'entre les profils';
}

export const afText = (af) => (af === null ? '—' : af === Infinity ? '∞' : String(Math.round(af * 10) / 10).replace('.', ','));
export const pctText = (x) => `${String(Math.round(x)).replace('.', ',')} %`;

// ---------- évaluation complète ----------

// game : la partie (partie.js), avec game.decisions et game.finished. Les mains rejouées ne comptent pas.
export function evaluateGame(game) {
  const decisions = game.decisions.filter((d) => !d.replay);
  const hands = game.finished.filter((f) => !f.replay).map((f) => f.hand);
  const players = game.players.map((p, seat) => {
    const mine = decisions.filter((d) => d.seat === seat);
    const counts = { conforme: 0, défendable: 0, erreur: 0 };
    for (const d of mine) counts[d.verdict]++;
    const byRule = new Map();
    for (const d of mine.filter((x) => x.verdict === 'erreur')) {
      for (const code of new Set(d.why.map((w) => w.code).filter(Boolean))) byRule.set(code, (byRule.get(code) || 0) + 1);
    }
    const stats = playerStats(hands, seat);
    return {
      seat, name: p.name, human: p.human, level: p.level, judgedAt: judgeLevel(p),
      decisions: mine.length, counts,
      score: mine.length ? (100 * counts.conforme) / mine.length : null,
      byRule: [...byRule.entries()].sort((a, b) => b[1] - a[1]).map(([code, count]) => ({ code, count })),
      stats, profile: profile(stats), gains: game.totals[seat],
    };
  });
  const human = players.find((p) => p.human);
  // Les 3 erreurs les plus coûteuses, une par main au plus (chacune se rejoue).
  const seenHands = new Set();
  const worst = decisions.filter((d) => d.seat === human.seat && d.verdict === 'erreur')
    .sort((a, b) => (b.ev ?? b.stake) - (a.ev ?? a.stake))
    .filter((d) => !seenHands.has(d.hand) && seenHands.add(d.hand)).slice(0, 3);
  return { hands: hands.length, seed: game.seed, players, worst, comments: comments(human, players, game) };
}

// Commentaires en phrases courtes : sur le joueur, puis une ligne par bot.
function comments(human, players, game) {
  const you = [];
  if (human.decisions === 0) {
    you.push('Aucune décision jouée pour l\'instant.');
  } else {
    const s = human.score;
    you.push(`${pctText(s)} de vos décisions sont conformes aux règles du niveau ${human.judgedAt} (${human.counts.conforme} sur ${human.decisions}).`);
    you.push(s >= 90 ? 'Très bon respect des règles : continuez ainsi.'
      : s >= 75 ? 'Bonne base ; quelques écarts à revoir ci-dessous.'
        : 'Revoyez les règles citées ci-dessous avant la prochaine partie.');
    if (human.byRule.length) {
      you.push(`Règles les plus souvent enfreintes : ${human.byRule.slice(0, 3).map((r) => `${r.code} (${r.count})`).join(', ')}.`);
    }
  }
  const st = human.stats;
  if (st.hands > 0) {
    const few = st.hands < 30 ? ' Moins de 30 mains : ces chiffres sont indicatifs (C5.4).' : '';
    you.push(`Vous avez joué ${pctText(st.vpip)} des mains (VPIP) et relancé ${pctText(st.pfr)} avant le flop (PFR) ; profil : ${human.profile}.${few}`);
    if (st.hands >= 20 && (st.vpip > 20 || st.vpip < 12)) {
      you.push(`Le test du niveau 2 demande un VPIP entre 12 et 20 % : vous jouez ${st.vpip > 20 ? 'trop' : 'trop peu'} de mains.`);
    }
    if (st.vpip > 0 && st.pfr < st.vpip / 2) {
      you.push('Vous suivez plus souvent que vous ne relancez avant le flop : la règle d\'or 1 (C2.3) dit d\'entrer en relançant.');
    }
  }
  const bots = players.filter((p) => !p.human).map((p) => {
    const main = p.byRule[0] ? `, surtout ${p.byRule[0].code}` : '';
    return `${p.name} (niveau ${p.level}) : ${p.counts.erreur} erreur${p.counts.erreur > 1 ? 's' : ''} sur ${p.decisions} décisions au regard des règles du niveau ${p.judgedAt}${main} ; profil ${p.profile}.`;
  });
  return { you, bots };
}
