# Poker — programme d'initiation et application d'entraînement

Méthode progressive d'apprentissage du Texas Hold'em No-Limit en 6 niveaux, du simple apprentissage des règles jusqu'au travail avec un solveur. Chaque niveau a ses compétences numérotées (C1.1 à C6.5) et ses tests de passage. Un test est validé après deux réussites à au moins 3 jours d'écart.

## Contenu

| Fichier | Description |
| --- | --- |
| [`doc/initiation-poker-tutoriel.pdf`](doc/initiation-poker-tutoriel.pdf) | Le tutoriel complet : règles, stratégie, probabilités, exercices, tests de passage, ressources, glossaire (21 pages) |
| [`doc/carnet-progression-poker.pdf`](doc/carnet-progression-poker.pdf) | Carnet de progression individuel, formulaire PDF à remplir (10 pages) |
| [`doc/architecture.md`](doc/architecture.md) | Proposition d'architecture d'une application en ligne multi-joueurs qui implémente la méthode |

## Les 6 niveaux

| Niveau | Objectif | Durée indicative |
| --- | --- | --- |
| 1 — Règles | Jouer une main sans aide | 1 semaine |
| 2 — Anti-erreurs | Jouer serré et agressif avant le flop | 2 à 3 semaines |
| 3 — Probabilités | Savoir en 10 secondes si un call est rentable | 3 à 4 semaines |
| 4 — Après le flop | Chaque mise a une raison : valeur ou bluff | 1 à 2 mois |
| 5 — Ranges et adaptation | Raisonner sur l'éventail adverse, exploiter | 2 à 3 mois |
| 6 — Vers le GTO | S'entraîner au solveur, puis exploiter | continu |

## Application

L'application n'est pas encore développée. Elle est prévue sur Laravel (base Laraskel), avec Filament, Livewire et MySQL ; le détail est dans [`doc/architecture.md`](doc/architecture.md).
