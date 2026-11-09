# Niveau 1 : les règles

Le niveau 1 de l'application d'entraînement (`index.html#niveau-1`) fait passer les 4 tests du niveau 1 du programme d'initiation au poker. Architecture, lancement et déploiement : voir le [README de l'application](../README.md).

| Test | Compétences | Contenu | Réussite |
| --- | --- | --- | --- |
| 1 · Déroulement d'une main | C1.1, C1.2 | Remettre les 6 étapes dans l'ordre + 5 questions tirées d'une banque de 10 | Tout juste |
| 2 · Classement des mains | C1.3 | Nommer 10 mains, une par combinaison, tirées au hasard | 10 sur 10 |
| 3 · Trouver les nuts | C1.4 | 10 tableaux aléatoires, choisir la main qui fait les nuts parmi 4 | 9 sur 10 |
| 4 · Pot annexe | C1.2 | Un joueur à tapis, calculer les pots et la répartition à l'abattage | 5 sur 5 |

Les questions sont générées à chaque essai. Un test est validé après **deux réussites à au moins 3 jours d'écart** ; le niveau est validé quand les 4 tests le sont.

## Exercices d'entraînement

L'onglet **Exercices** (adresse `index.html#niveau-1/exercices`) reprend les exercices du niveau 1 du tutoriel. La correction est immédiate, un compteur suit les réussites de la séance, et rien n'est enregistré. Chaque exercice a ses options, choisies dans des listes déroulantes.

| Exercice | Compétences | Contenu | Options |
| --- | --- | --- | --- |
| Annoncer les étapes | C1.1, C1.2 | Une main distribuée étape par étape : annoncer chaque étape avant qu'elle ait lieu | 3 à 6 joueurs ; questions : étape seule, + qui pose la petite blind et qui parle, + qui gagne à l'abattage |
| Meilleure main en 7 cartes | C1.3 | 7 cartes au hasard, nommer la meilleure combinaison ; la correction montre les 5 cartes retenues | Temps limite 10 s, 20 s ou sans ; 7 cartes en vrac ou 2 en main + 5 au tableau |
| Nommer les nuts | C1.4 | Un tableau de 5 cartes, nommer les nuts ; la correction donne un exemple et le nombre de combos | Série de 20, de 10 ou sans fin ; combinaison seule ou combinaison et hauteur |

## Organisation du code

```
niveau-1/
├── niveau.js           définition du niveau : tests et exercices
├── evaluator.js        évaluation d'une main de 5 à 7 cartes, description en français
├── analysis.js         meilleure main de 5 cartes parmi 7, nuts d'un tableau
├── exercises/
│   ├── deroulement.js  test 1
│   ├── classement.js   test 2
│   ├── nuts.js         test 3
│   └── pot-annexe.js   test 4
└── practice/
    ├── annonces.js        exercice : annoncer les étapes
    ├── meilleure-main.js  exercice : meilleure main en 7 cartes
    └── nommer-nuts.js     exercice : nommer les nuts
```

Les résultats sont stockés sous la clé `poker.niveau1.v1`.
