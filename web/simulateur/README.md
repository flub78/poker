# Simulateur de table

Une table à 6 joueurs : l'humain et 5 bots qui appliquent les règles du cours. Plan et état
d'avancement : [`doc/plan-simulateur.md`](../../doc/plan-simulateur.md). Pas encore d'interface.

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
