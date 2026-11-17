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
| Quelle décision ? | Une situation et deux cartes : relancer, suivre, checker ou se coucher. La correction donne la raison et la gravité de l'erreur. | Toutes les situations, sans relance ou face à une relance ; série de 20 ou sans fin |
| Position minimum | Deux cartes : à partir de quelle position les relance-t-on ? | Mains limites ou au hasard ; listes du sous-niveau |
| Colorier la grille | Colorier de mémoire la liste d'une position, puis voir les cases oubliées et en trop | UTG et MP, CO et SB, BTN ; liste du sous-niveau (à l'étape 0, la liste UTG partout) |
| Seuils éclair | Questions courtes : plus petite paire, plus petit As, mains à suivre face à une relance | Questions des étapes 0 au sous-niveau choisi |

### Les sous-niveaux (étapes de mémorisation)

Ils suivent l'encadré « Pour retenir la grille » du tutoriel (C2.2) : l'étape N est le **sous-niveau 2.N**. Chaque étape est une stratégie complète, plus serrée que la grille finale, et reprend les précédentes (cumulatif). Le joueur choisit son sous-niveau en tête des onglets Exercices et Réflexes (`js/sous-niveaux.js`, choix enregistré et repris par la page Profil) ; le simulateur lit le même choix quand le joueur est au niveau 2. Tout s'y règle : « Quelle décision ? » corrige selon l'étape et signale la réponse de la grille complète quand elle diffère ; « Position minimum » et « Colorier la grille » prennent les listes de l'étape ; « Seuils éclair » ne pose que les questions des étapes déjà vues ; les Réflexes posent les questions des thèmes « Niveau 2.0 » au sous-niveau choisi ; le simulateur conseille (Indice, mentor) et juge selon l'étape. **Réponses en avance** : une réponse fausse au sous-niveau choisi mais juste à un sous-niveau plus avancé compte juste, avec la mention « en avance » et la réponse attendue au sous-niveau (`grade`, `strategy.js`) ; plus de 2 réponses en avance dans une série de « Quelle décision ? » : le bilan propose un sous-niveau plus avancé. Le simulateur applique la même règle (`judgeMove`, `simulateur/mentor.js`). Les tests du niveau restent sur la grille complète. On passe au sous-niveau suivant après 19 sur 20 à « Quelle décision ? ».

| Sous-niveau | Stratégie corrigée |
| --- | --- |
| 2.0 · Le filet | La liste UTG partout ; face à une relance ou une sur-relance, QQ+ et AK continuent, le reste se couche |
| 2.1 · Le bouton | + la liste du BTN au bouton |
| 2.2 · Paires et As | + au CO, en SB et en BB face à des limps : 55+, AT+, A2s+ |
| 2.3 · Le reste du CO | La liste complète du CO |
| 2.4 · Suivre une relance | + les mains qu'on suit face à une relance ou une sur-relance |
| 2.5 · Grille complète | Identique à 2.4 ; c'est la stratégie du test 2 |

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
