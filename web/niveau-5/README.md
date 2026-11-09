# Niveau 5 : penser en ranges et s'adapter

Le niveau 5 de l'application (`index.html#niveau-5`). Architecture, lancement et déploiement : voir le [README de l'application](../README.md). Une série pose 10 questions au plus.

## Test de passage

| Critère du cours | Dans l'application | Réussite |
| --- | --- | --- |
| Sur 10 mains revues, je décris la range adverse à la river en 3 catégories (forte, moyenne, bluff) | **Test 1 · La range adverse à la river** (C5.1, C5.2) : 10 tableaux, 4 mains de la range à classer pour chacun | 8 sur 10, les 4 mains justes |
| Je classe un adversaire dans un profil après 30 mains, et mes stats le confirment | **Test 2 · Profils adverses** (C5.4) : 10 adversaires décrits par leurs statistiques ; profil et exploitation | 8 sur 10 |
| Ma bankroll respecte les seuils de C5.5 depuis 2 mois | case à cocher | — |
| Sur 4 semaines, j'ai respecté ma limite de perte à chaque session | case à cocher | — |

Les deux tests vérifient la compétence sur des situations générées ; le cours demande aussi de la pratiquer sur vos mains et vos adversaires réels (rappelé dans les exercices).

## Exercices

| Exercice | Compétences | Contenu |
| --- | --- | --- |
| La range à la river | C5.1, C5.2 | Un tableau, 4 mains de la range adverse : forte, moyenne ou bluff ? |
| Profils adverses | C5.4 | VPIP, PFR, AF : quel profil, et comment l'exploiter ? |
| Bankroll : quelle limite ? | C5.5 | Une bankroll : plus haute limite de cash-game (30 tapis de 100 BB), ou droit d'entrée maximal (1/100) |

## Règles de réponse

- **Catégories de la range** : forte = deux paires ou mieux ; moyenne = une paire ; bluff = moins qu'une paire. Le cours ne les définit pas : ce sont les définitions de l'application, rappelées sous chaque question. Les tableaux ne permettent ni quinte ni couleur.
- **Profils** : le cours donne les profils et leur exploitation, pas de seuils chiffrés. Repères de l'application : serré = VPIP sous 25 %, large = VPIP au-dessus de 35 % ; passif = AF sous 1,5, agressif = AF au-dessus de 2,5. Les statistiques tirées restent loin de ces seuils (voir la suggestion S-014).
- **Bankroll** : les bankrolls trop proches d'un seuil (à 8 % près) ne sont pas tirées.

## Organisation du code

```
niveau-5/
├── niveau.js      définition : 2 tests, 2 critères à cocher, 3 exercices
└── questions.js   range à la river, profils, bankroll
```
