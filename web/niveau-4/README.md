# Niveau 4 : après le flop

Le niveau 4 de l'application (`index.html#niveau-4`) : chaque mise a une raison, valeur ou bluff. Architecture, lancement et déploiement : voir le [README de l'application](../README.md). Une série pose 10 questions au plus (moteur commun `js/serie.js`, comme au niveau 3).

## Test de passage

| Critère du cours | Dans l'application | Réussite |
| --- | --- | --- |
| Sur 20 mains revues, chaque mise a une raison nommée (valeur ou bluff) | **Test 1 · Valeur, bluff ou aucune raison** (C4.1, C4.6) : 20 situations générées, en 2 séries de 10 | 18 sur 20 |
| Je classe 10 flops par texture et je donne la taille de c-bet adaptée | **Test 2 · Texture du flop et taille de c-bet** (C4.2 à C4.4) : 10 flops | 9 sur 10, texture et taille justes |
| Je planifie la turn avant de miser le flop sur 10 mains d'affilée | case à cocher (habitude de jeu) | — |
| Sur 5 000 mains (ou 30 tournois), résultat au moins à l'équilibre | case à cocher (résultat réel) | — |

Les cases à cocher sont dans l'onglet Tests, rubrique « À vérifier à la table » : le joueur les coche quand le critère est rempli ; la date est enregistrée. Le niveau est validé quand les tests le sont et que les cases sont cochées.

## Exercices

| Exercice | Compétences | Contenu |
| --- | --- | --- |
| Valeur, bluff ou aucune raison | C4.1, C4.6 | Une main, un tableau, un tour d'enchères : pour quelle raison miser ? |
| Textures de flop | C4.2 à C4.4 | Texture seule, ou texture et taille de c-bet ; objectif du cours : 30 flops (3 séries) |
| SPR et engagement du tapis | C4.5 | Calculer le SPR, puis dire si la main justifie le tapis ; objectif du cours : 20 mains (2 séries) |

## Règles de réponse

- **Raison de miser.** Valeur : top paire avec un kicker dame ou mieux, overpair, deux paires, brelan. Bluff : tirage couleur ou quinte bilatérale sans paire au flop ou au turn (semi-bluff), ou rien à la river. Aucune raison : deuxième ou troisième paire, petite paire servie sous la carte haute (piège des mains moyennes). Les tableaux sont « secs » (ni appariés, ni trois cartes d'une couleur, ni trois rangs dans une fenêtre de cinq) pour que la réponse ne soit pas discutable ; une main moyenne n'a jamais de tirage.
- **Textures.** Sec : arc-en-ciel, As ou roi en tête, cartes éloignées d'au moins 4 rangs. Humide : deux cartes d'une couleur, trois rangs dans une fenêtre de cinq, valet ou moins. Apparié. Monotone. **Taille de c-bet** : petite (1/3) sur sec, grosse (2/3) sur humide, comme le dit le cours ; **petite aussi sur apparié et monotone, choix de l'application** : le cours ne donne pas de taille pour ces deux textures (voir la suggestion S-014).
- **SPR.** Tapis effectif (le plus petit) ÷ pot. Engager tout le tapis : SPR sous 3, top paire ou mieux ; de 3 à 8, deux paires ou mieux ; au-dessus de 8, brelan ou mieux (« très grosse main »). Les SPR trop proches de 3 ou de 8 ne sont pas tirés.

## Organisation du code

```
niveau-4/
├── niveau.js      définition : 2 tests, 2 critères à cocher, 3 exercices
└── questions.js   raison de miser, textures, SPR ; dryBoard (tableau sec, aussi utilisé au niveau 5)
```
