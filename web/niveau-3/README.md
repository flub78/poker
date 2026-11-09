# Niveau 3 : les probabilités

Le niveau 3 de l'application d'entraînement (`index.html#niveau-3`) fait passer les 4 tests du niveau 3 du programme d'initiation au poker. Architecture, lancement et déploiement : voir le [README de l'application](../README.md).

**Dix questions au plus par série.** Les nombres du cours restent les objectifs, mais une série ne pose jamais plus de 10 questions. Un test de 20 situations se passe en 2 séries de 10, avec des données différentes ; le score des deux séries est additionné (option `series` des tests, gérée par `js/shell.js` ; séries : `js/serie.js`). Un exercice se refait par séries : « 50 cartes-flash » = 5 séries de 10.

| Test | Compétences | Contenu | Réussite |
| --- | --- | --- | --- |
| 1 · Compter les outs | C3.1 | 20 situations de tirage, en 2 séries de 10 : combien d'outs ? | 20 sur 20 |
| 2 · Tableau des équités requises | C3.3 | Les 6 repères du tableau (1/4 de pot à 2 pots), dans le désordre | 6 sur 6, à 1 point près |
| 3 · Call ou fold en 10 secondes | C3.2, C3.3 | 20 décisions, en 2 séries de 10, chacune en moins de 10 secondes | 18 sur 20 |
| 4 · Espérance de gain d'un call | C3.6 | 5 calls : montant, gain possible, équité ; calculer l'EV | 4 sur 5, à 1 jeton près |

Le critère « réciter le tableau des équités requises » du cours devient le test 2, et « calculer l'EV d'un call sur papier » le test 4. Les duels préflop (C3.5) et les combos (C3.7) n'ont pas de test dans le cours.

Les questions sont générées à chaque essai. Un test est validé après **deux réussites à au moins 3 jours d'écart** ; le niveau est validé quand les 4 tests le sont.

## Exercices d'entraînement

L'onglet **Exercices** (`index.html#niveau-3/exercices`) : correction après chaque réponse, bilan en fin de série, puis « Nouvelle série » avec d'autres données. Rien n'est enregistré.

| Exercice | Compétences | Contenu | Options |
| --- | --- | --- | --- |
| Compter les outs | C3.1, C3.2 | Combien d'outs ? La correction montre les cartes et la chance de toucher (règle du 2 et du 4) | Flop, turn ou les deux |
| Cartes-flash : call ou fold | C3.2, C3.3 | Un tirage et une mise : suivre ou se coucher ; la correction donne outs, équité et équité requise | Flop, turn ou les deux ; 10 s, 20 s ou sans limite |
| Équités requises | C3.3 | Une mise : quelle équité pour suivre ? | Repères du cours ou montants quelconques (à 2 points près) |
| Duels préflop | C3.5 | Deux mains face à face : équité du favori (82, 74, 60 ou 55 %) | — |
| Espérance de gain | C3.6 | Calculer l'EV d'un call (séries de 5) | — |

Le troisième exercice du cours, « annoncer mentalement outs et cote du pot pendant une session », se fait à la table.

## Comment les situations sont construites

- **Tirages** (`draws.js`) : 7 types du cours (couleur 9 outs, quinte bilatérale 8, ventrale 4, couleur + bilatérale 15, couleur + ventrale 12, deux cartes hautes 6, paire servie → brelan 2), au flop ou au turn. Chaque situation est recomptée avec l'évaluateur du niveau 1 ; si le compte ne correspond pas au type, elle est rejetée. Les tableaux ne sont jamais appariés et n'ont jamais trois cartes d'une couleur adverse : aucun out « sale ».
- **Call ou fold** : au flop, l'adversaire est à tapis (on voit turn et river, règle du 4) ; au turn, il reste la river (règle du 2). La décision est toujours nette : la règle du 2 et du 4 et la valeur exacte donnent la même décision, à 4 points au moins de l'équité requise.
- **Duels** : chaque catégorie est construite pour rester proche de la valeur du cours. Vérifié par simulation (4 000 tableaux par duel) : paire contre paire inférieure 80 à 83 %, main dominée 68 à 75 % (kickers de 9 au moins), paire contre deux figures 48 à 55 %, deux figures contre deux petites cartes qui se suivent, non assorties, 61 à 67 %.

## Organisation du code

```
niveau-3/
├── niveau.js      définition du niveau : 4 tests, 5 exercices
├── questions.js   les questions (outs, équité requise, call ou fold, EV, duels)
├── draws.js       situations de tirage et outs exacts (évaluateur du niveau 1)
└── odds.js        règle du 2 et du 4, chance exacte, équité requise, EV
```

Le moteur des séries (une question à la fois, chronomètre, correction, `makeTest`, `makePractice`) est commun aux niveaux 3 à 6 : `js/serie.js`.
