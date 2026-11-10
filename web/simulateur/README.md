# Simulateur de table

Une table à 6 joueurs (adresse `index.html#simulateur`, lien « Table » de l'en-tête) : l'humain
en bas et 5 bots qui appliquent les règles du cours. Plan et état d'avancement :
[`doc/plan-simulateur.md`](../../doc/plan-simulateur.md).

| Fichier | Rôle |
| --- | --- |
| `simulateur.js`, `simulateur.css` | L'écran : table, boutons (raccourcis F, C, R, I, Entrée), indice, journal, bilan, réglages |
| `partie.js` | Suite de mains : bouton qui tourne, 100 BB à chaque main, gains cumulés |
| `bots.js` | `decider(main, siège, niveau)` → `{ action, raisons, facts }` : sert aux bots, à l'indice et au mentor |
| `mentor.js` | `judge(main, coup, conseil, actions légales)` → verdict (conforme, défendable, erreur) et explications |
| `regles/preflop.js` | Grille du niveau 2 (C2.2), tailles (C2.2, C2.3), cotes implicites des petites paires (C3.4) |
| `regles/postflop.js` | Après le flop : schéma du niveau 2 (C2.3), outs et cote du pot au niveau 3 (C3.2, C3.3) |
| `regles/force.js` | Classe d'une main (forte, top paire, paire, rien) et outs |
| `positions.js` | Positions (BTN, SB, BB, UTG, MP, CO), montants en BB |
| `journal.js` | Le journal d'une main en français |
| `moteur/` | Les règles du jeu (ci-dessous) |

Chaque raison porte le code de la compétence du cours (`C2.2`…) ; l'indice en fait un lien vers la
section. Toute règle appliquée par un bot est écrite dans le cours (décision D8 du plan).

## Le moteur (`moteur/`)

JavaScript pur, sans DOM : testé sous Node (`tests/moteur/`, `bin/tester.sh --rapide`).

```js
import { newHand, legalActions, act } from './moteur/table.js';
import { rng } from '../js/cards.js';

const main = newHand({ stacks: [200, 200, 200, 200, 200, 200], button: 0, sb: 1, bb: 2, rand: rng(42) });
legalActions(main);   // { seat: 3, toCall: 2, fold: true, check: false, call: true, raise: { min: 4, max: 200 } }
act(main, { type: 'raise', to: 6 });
```

- **Actions** : `fold`, `check`, `call`, `raise` avec `to`, le total misé dans le tour d'enchères
  (une première mise est une relance à partir de 0). Une action illégale lève une erreur et ne
  change rien.
- **Règles appliquées** : relance minimale égale à la relance précédente ; un tapis pour moins ne
  rouvre pas la parole à ceux qui ont déjà parlé ; tête-à-tête (le bouton pose la petite blind) ;
  blind à tapis pour moins ; tableau déroulé quand tout le monde est à tapis ; pots annexes ; mise
  non suivie rendue ; jeton indivisible au premier joueur à gauche du bouton.
- **Reproductible** : même graine, même donne. `preset` impose des cartes (mains, tableau).
- **Résultat** (`main.result`) : `showdown`, `pots` (montant, éligibles, gagnants, parts), `won`,
  `net` par siège. `main.history` garde chaque action.
