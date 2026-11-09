# Poker — programme d'initiation et application d'entraînement

Méthode progressive d'apprentissage du Texas Hold'em No-Limit en 6 niveaux, du simple apprentissage des règles jusqu'au travail avec un solveur. Chaque niveau a ses compétences numérotées (C1.1 à C6.5) et ses tests de passage. Un test est validé après deux réussites à au moins 3 jours d'écart.

## Contenu

| Fichier | Description |
| --- | --- |
| [`doc/initiation-poker-tutoriel.pdf`](doc/initiation-poker-tutoriel.pdf) | Le tutoriel complet : règles, stratégie, probabilités, exercices, tests de passage, ressources, glossaire, avec table des matières (40 pages) |
| [`doc/carnet-progression-poker.pdf`](doc/carnet-progression-poker.pdf) | Carnet de progression individuel, formulaire PDF à remplir (10 pages) |
| [`doc/suggestions.md`](doc/suggestions.md) | Suggestions d'amélioration du projet, avec bénéfices et coûts, classées par rapport bénéfice/coût |
| [`strategie_suggestions.md`](strategie_suggestions.md) | Comment les suggestions sont produites : consignes, commandes `/suggestions` et `/audit-suggestions` (dans `.claude/skills/`), revues à créer |
| [`doc/architecture.md`](doc/architecture.md) | Proposition d'architecture d'une application en ligne multi-joueurs qui implémente la méthode |
| [`web/`](web/) | Application d'entraînement : une seule page (`web/index.html`) avec le cours (le tutoriel en pages web, bouton « Cours ») et un onglet par niveau, avec exercices et tests de passage. Dossier autonome, à déployer tel quel ; voir son [README](web/README.md) |
| `web/cours/` | Le tutoriel en HTML : `contenu.js` (généré) et ses illustrations |
| [`web/niveau-1/`](web/niveau-1/), [`web/niveau-2/`](web/niveau-2/) | Contenu des niveaux 1 et 2 ; voir leurs README ([1](web/niveau-1/README.md), [2](web/niveau-2/README.md)) |
| `web/cartes/` | Cartes vectorielles poker-qr (SVG) utilisées par l'application et par les illustrations |
| [`bin/serve.sh`](bin/serve.sh) | Lance un serveur local et affiche l'adresse de l'application et de chaque niveau (`bin/serve.sh [port]`, `HOST=0.0.0.0` pour le réseau local) |
| `tools/make_figs.py` | Génère les illustrations de `doc/figures/` à partir des cartes |
| `tools/cours_html.py` | Génère `web/cours/` (le cours de l'application) à partir de l'export HTML du Claude Doc |
| `tools/mise_en_page_pdf.py` | Met en page le PDF exporté du Claude Doc : sauts de page avant les grandes parties, table des matières cliquable en page 2, signets (dépend de PyMuPDF : `tools/requirements.txt`) |

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
