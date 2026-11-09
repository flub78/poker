# Niveau 6 : vers le GTO

Le niveau 6 de l'application (`index.html#niveau-6`). Niveau continu : le cours parle de « repères de maîtrise ». Architecture, lancement et déploiement : voir le [README de l'application](../README.md).

## Repères de maîtrise

| Repère du cours | Dans l'application | Réussite |
| --- | --- | --- |
| Je connais et applique la MDF face à 3 tailles de mise | **Test 1 · La MDF face à 3 tailles de mise** (C6.1) : MDF à 1/2 pot, pot et 2 pots, puis appliquée au nombre de combos d'une range | 5 sur 6, à 1 près |
| J'ai étudié au solveur les 5 situations les plus fréquentes de mon jeu | case à cocher | — |
| Mon score en mode entraîneur dépasse 85 % sur les situations préflop | case à cocher (outil externe) | — |
| Je tiens ma revue de mains chaque semaine depuis 3 mois | case à cocher | — |
| Je suis gagnant sur 30 000 mains ou 300 tournois à ma limite | case à cocher | — |

## Exercices

| Exercice | Compétences | Contenu |
| --- | --- | --- |
| Défense minimale (MDF) | C6.1 | Toutes tailles de mise : MDF en %, ou nombre de combos à continuer |
| Part de bluffs équilibrée | C6.1 | Mise ÷ (pot + 2 mises) : 1 bluff sur 3 pour une mise pot |
| Exploiter plutôt que copier | C6.1, C6.4 | Un adversaire défend plus ou moins que la MDF : bluffer plus, bluffer moins, ou rester à l'équilibre |
| Mesurer ses résultats | C6.5 | BB/100 en cash-game, ROI en tournoi, et « peut-on conclure ? » (30 000 mains, 300 tournois) |

Les exercices du cours (étude au solveur, mode entraîneur, revue de mains avec un partenaire) se font hors de l'application.

## Organisation du code

```
niveau-6/
├── niveau.js      définition : 1 test, 4 critères à cocher, 4 exercices
└── questions.js   MDF, part de bluffs, exploitation, BB/100 et ROI
```
