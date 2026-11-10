// Le mentor : compare le coup du joueur à celui que jouerait un bot de son niveau (bots.js) et
// explique l'écart. Trois verdicts (décision D5 du plan) :
//   conforme   : même action (pour une relance, une taille proche) ;
//   défendable : écart faible — main à la limite d'une liste, équité à moins de 5 points de
//                l'équité requise, valeur manquée sans perte, taille de mise différente ;
//   erreur     : une règle du cours enfreinte (limp, main hors liste, call sans raison…).
// JavaScript pur, testé sous Node (tests/simulateur/mentor.test.js).
import { openRange, RERAISE, CALL_IP, CALL_OOP, CALL_3BET } from '../niveau-2/strategy.js';
import { frontier, shortCode } from '../niveau-2/ranges.js';
import { isBlind, bbText } from './positions.js';

export const VERDICTS = {
  conforme: 'Conforme',
  défendable: 'Défendable',
  erreur: 'Erreur',
};

// « Relancer à 2,5 BB », « Suivre 1 BB »… legal : legalActions(hand) au moment du coup.
export function actionLabel(action, hand, legal) {
  switch (action.type) {
    case 'fold': return 'Se coucher';
    case 'check': return 'Checker';
    case 'call': return `Suivre ${bbText(legal.toCall, hand.bb)}`;
    default: return `${hand.currentBet > 0 ? 'Relancer à' : 'Miser'} ${bbText(action.to, hand.bb)}`;
  }
}

const low = (t) => t.charAt(0).toLowerCase() + t.slice(1);
const plays = (a) => a.type === 'call' || a.type === 'raise';
const pts = (x) => `${String(Math.round(x)).replace('.', ',')} %`;

// La liste du cours qui s'applique à la situation préflop, pour savoir si une main est à sa limite.
function rangeFor(sit) {
  switch (sit.type) {
    case 'open': return openRange(sit.pos).set;
    case 'bb': return openRange('BB').set;
    case 'vsRaise': return new Set([...RERAISE.set, ...(isBlind(sit.hero) ? CALL_OOP : CALL_IP).set]);
    case 'vs3bet': return new Set([...RERAISE.set, ...CALL_3BET.set]);
    default: return RERAISE.set;
  }
}
const onEdge = (sit, code) => frontier(rangeFor(sit)).includes(code);

// Juge le coup « action » du joueur qui a la parole. advice : decider(hand, seat, level).
// Renvoie { verdict, human, advised, why: [{ code, texte }], raisons } ; why explique l'écart,
// raisons sont celles du coup conseillé.
export function judge(hand, action, advice, legal) {
  const a = advice.action;
  const human = actionLabel(action, hand, legal);
  const advised = actionLabel(a, hand, legal);
  const out = (verdict, ...why) => ({ verdict, human, advised, why, raisons: advice.raisons, level: advice.level });
  const r = (code, texte) => ({ code, texte });

  if (action.type === a.type) {
    if (action.type !== 'raise') return out('conforme');
    const allIn = action.to === legal.raise.max && a.to === legal.raise.max;
    if (allIn || Math.abs(action.to - a.to) <= 0.3 * a.to) return out('conforme');
    return out('défendable', r(advice.facts?.street === 'preflop' ? 'C2.3' : 'C4.4',
      `Bonne action, mais la taille s'écarte de celle du cours : ${low(advised)} plutôt que ${low(human)}.`));
  }

  if (action.type === 'fold' && legal.check) {
    return out('erreur', r(null, 'Checker ne coûte rien : se coucher abandonne le pot sans raison.'));
  }

  const f = advice.facts || {};
  if (f.street === 'preflop') {
    const { sit, code } = f;
    const hand2 = shortCode(code);
    if ((sit.type === 'open') && action.type === 'call') {
      return out('erreur', r('C2.3', 'Règle d\'or 1 : on entre dans un pot en relançant, jamais en suivant (limp).'));
    }
    const edge = onEdge(sit, code);
    if (plays(action) && !plays(a)) {
      return edge
        ? out('défendable', r('C2.2', `${hand2} est à la limite de la liste : la jouer ici coûte peu, mais le cours la jette.`))
        : out('erreur', r('C2.2', `${hand2} est loin de la liste : jouée ici, elle perd de l'argent à long terme.`));
    }
    if (!plays(action) && plays(a)) {
      return edge
        ? out('défendable', r('C2.2', `${hand2} est à la limite de la liste : la jeter coûte peu, mais le cours la joue.`))
        : out('erreur', r('C2.2', `${hand2} est bien dans la liste : la jeter ici fait perdre une main rentable.`));
    }
    if (action.type === 'call' && a.type === 'raise') {
      return out('défendable', r('C2.2', `Avec ${hand2}, le cours sur-relance : suivre laisse l'adversaire voir le flop à bon prix.`));
    }
    if (action.type === 'raise' && a.type === 'call') {
      return out('défendable', r('C2.2', `${hand2} fait partie des mains qui suivent : sur-relancer gonfle un pot que vous jouerez souvent dominé.`));
    }
    return out('défendable');
  }

  // Après le flop.
  if (f.equity !== undefined && (action.type === 'call' || action.type === 'fold')) {
    const gap = f.equity - f.needed;
    const facts = `${f.outs} outs, environ ${pts(f.equity)} d'équité pour ${pts(f.needed)} requis`;
    if (Math.abs(gap) < 5) {
      return out('défendable', r('C3.3', `${facts} : l'écart est faible, les deux choix se valent presque.`));
    }
    return action.type === 'call'
      ? out('erreur', r('C3.3', `${facts} : il manque ${pts(-gap)}, ce call perd de l'argent en moyenne (C3.6).`))
      : out('erreur', r('C3.3', `${facts} : vous avez ${pts(gap)} de marge, suivre est rentable.`));
  }
  if (action.type === 'call' && a.type === 'fold') {
    return f.cls === 'top' && f.facingRaise
      ? out('erreur', r('C2.3', 'Règle 3 : une main moyenne contre une grosse action est souvent battue. Face à une relance, top paire se couche.'))
      : out('erreur', r('C2.3', `Règle 5 : on ne paie pas « pour voir ». Vous avez ${f.text}.`));
  }
  if (action.type === 'raise' && (a.type === 'check' || a.type === 'fold')) {
    return out('erreur', r('C4.1', `Vous avez ${f.text} : cette mise fait surtout coucher les mains plus faibles et payer les plus fortes. Le bluff s'apprend au niveau 4.`));
  }
  if (action.type === 'check' && a.type === 'raise') {
    return out('défendable', r('C2.3', `Vous avez ${f.text} : en checkant, vous laissez passer de la valeur, des mains moins bonnes auraient payé.`));
  }
  if (action.type === 'call' && a.type === 'raise') {
    return out('défendable', r('C2.3', `Vous avez ${f.text} : relancer fait grossir le pot quand vous êtes devant.`));
  }
  if (action.type === 'raise' && a.type === 'call') {
    return out('défendable', r('C2.3', `Vous avez ${f.text} : assez pour suivre, pas pour relancer. Une relance ne fait payer que les mains meilleures.`));
  }
  if (action.type === 'fold' && plays(a)) {
    return out('erreur', r('C2.3', `Vous avez ${f.text} : le cours ${a.type === 'call' ? 'suit' : 'relance'}, se coucher abandonne un pot que vous gagnez souvent.`));
  }
  return out('défendable');
}
