# Niveau 2 : éviter les grosses erreurs

Le niveau 2 de l'application d'entraînement (`index.html#niveau-2`). Il aide à retenir la grille des mains de départ (C2.2) par étapes, entraîne aux décisions préflop et fait passer les tests du niveau. Il a trois onglets : **Tests**, **Exercices** (`index.html#niveau-2/exercices`) et **Aide-mémoire** (`index.html#niveau-2/aide`). Architecture, lancement et déploiement : voir le [README de l'application](../README.md).

## Tests de passage

| Test | Compétences | Contenu | Réussite |
| --- | --- | --- | --- |
| 1 · La grille de mémoire | C2.2 | Colorier de mémoire, sur la grille 13 × 13, les mains relancées à UTG puis au BTN | 2 cases fausses au plus par grille |
| 2 · Quiz préflop | C2.1 à C2.3 | 20 situations : 10 sans relance (dont une en BB face à des limps), 6 face à une relance, 2 face à une sur-relance après votre relance, 2 après une relance et une sur-relance | 18 sur 20 |

Un test est validé après **deux réussites à au moins 3 jours d'écart**. Les deux autres critères du test de passage (VPIP entre 12 et 20 % sur 500 mains, aucun limp) se vérifient à la table : ils se notent dans le carnet.

## Exercices d'entraînement

| Exercice | Contenu | Options |
| --- | --- | --- |
| Quelle décision ? | Une situation et deux cartes : relancer, suivre, checker ou se coucher. La correction donne la raison et la gravité de l'erreur. | Étape 0 à 5 ; toutes les situations, sans relance ou face à une relance ; série de 20 ou sans fin |
| Position minimum | Deux cartes : à partir de quelle position les relance-t-on ? | Mains limites ou au hasard |
| Colorier la grille | Colorier de mémoire la liste d'une position, puis voir les cases oubliées et en trop | UTG et MP, CO et SB, BTN |
| Seuils éclair | Questions courtes : plus petite paire, plus petit As, mains à suivre face à une relance | — |

### Les étapes de mémorisation

Elles suivent l'encadré « Pour retenir la grille » du tutoriel (C2.2). Chaque étape est une stratégie complète, plus serrée que la grille finale. L'exercice « Quelle décision ? » corrige selon l'étape choisie et signale la réponse de la grille complète quand elle diffère. On passe à l'étape suivante après 19 sur 20.

| Étape | Stratégie corrigée |
| --- | --- |
| 0 · Le filet | La liste UTG partout ; face à une relance ou une sur-relance, QQ+ et AK continuent, le reste se couche |
| 1 · Le bouton | + la liste du BTN au bouton |
| 2 · Paires et As | + au CO, en SB et en BB face à des limps : 55+, AT+, A2s+ |
| 3 · Le reste du CO | La liste complète du CO |
| 4 · Suivre une relance | + les mains qu'on suit face à une relance ou une sur-relance |
| 5 · Grille complète | Identique à l'étape 4 ; c'est la stratégie du test 2 |

## Organisation du code

Les résultats sont stockés sous la clé `poker.niveau2.v1`.

```
niveau-2/
├── niveau.js               définition : tests, exercices, onglet Aide-mémoire, feuille de style
├── style.css               grille 13 × 13, situations, aide-mémoire, impression
├── ranges.js               notation des mains (AKs, AKo, 77+, JJ-66…), grille, combinaisons, tirages
├── strategy.js             les listes du tutoriel, les étapes, decide() et la gravité d'une erreur
├── situations.js           génération et récit des situations, choix des mains près des limites
├── grid.js                 grille 13 × 13 affichée, à colorier, et sa correction
├── hand.js                 affichage d'une situation et des boutons de décision
├── aide.js                 onglet Aide-mémoire (imprimable)
├── exercises/
│   ├── grille.js           test 1
│   └── quiz.js             test 2
└── practice/
    ├── decision.js         Quelle décision ?
    ├── position-min.js     Position minimum
    ├── colorier.js         Colorier la grille
    └── seuils.js           Seuils éclair
```

Les listes sont écrites comme dans le tutoriel, dans `strategy.js` : si la grille C2.2 change, c'est le seul fichier à modifier, et les pourcentages de l'aide-mémoire se recalculent.
