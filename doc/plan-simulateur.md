# Plan d'implémentation — le simulateur de table

Fiche de suivi : S-015 dans [`suggestions.md`](suggestions.md). Cocher chaque case au fil du travail,
noter le commit en fin de ligne quand une étape est terminée.

## Objectif

Une table à 6 joueurs : l'humain en bas, 5 bots. L'humain se couche, checke, suit ou relance.
Trois modes d'aide : **sans aide**, **Indice** (le coup que jouerait un bot de son niveau),
**Mentor** (l'humain joue, le simulateur compare et explique). En fin de partie : évaluation des
**décisions** de l'humain et des bots, pas des jetons gagnés.

## Décisions prises (2026-11-10)

| # | Sujet | Décision |
|---|---|---|
| D1 | Architecture | Tout dans le navigateur, sans serveur ni dépendance, comme le reste de `web/`. |
| D2 | Moteur des bots | Algorithmique : règles du cours. Une IA éventuelle ne ferait que rédiger (phase 6, optionnelle). |
| D3 | Niveaux des bots | De 2 à 6 : aucun bot ne joue au hasard. Un humain du niveau 1 reçoit les conseils du niveau 2. |
| D4 | Table | Les bots peuvent être de niveaux différents à la même table (réglage par siège). |
| D5 | Verdicts du mentor | Trois verdicts : **conforme**, **défendable** (écart faible), **erreur** (règle enfreinte ou perte nette). |
| D6 | Évaluation | Porte sur les décisions : écarts aux règles, perte d'espérance estimée. Les jetons sont affichés, pas notés. |
| D7 | Indice et mentor | Le même calcul : `decider(situation, niveau)` renvoie `{ action, montant, raisons[] }`. |
| D8 | Règles | Une règle dont le bot a besoin et que le cours ne donne pas est d'abord écrite dans le cours (comme pour S-014), puis codée. |
| D9 | Tapis | Chaque main commence à 100 grosses blinds pour tous (pas d'élimination) ; blinds 1/2. |
| D10 | Reproductibilité | Toute donne vient d'un générateur aléatoire à **graine** : une main se rejoue à l'identique. |

## Architecture

```
web/simulateur/
├── niveau.js          onglet : point d'entrée chargé par js/app.js (#simulateur)
├── moteur/            JavaScript pur, sans DOM, testé sous Node
│   ├── table.js       une main : donne (graine, cartes imposées), blinds, enchères, actions légales
│   └── pots.js        pot principal, pots annexes, partage à l'abattage (niveau-1/evaluator.js)
├── regles/            une fonction par règle du cours, qui renvoie sa raison et sa section
│   ├── preflop.js     ranges par position, relance, sur-relance (réutilise niveau-2)
│   ├── cote.js        outs, cote du pot, équité requise (réutilise niveau-3)
│   ├── cbet.js        texture, taille de c-bet, SPR (niveau 4)
│   ├── lecture.js     range adverse, profils (niveau 5)
│   └── defense.js     MDF, part de bluffs (niveau 6)
├── equite.js          équité contre une range, par Monte-Carlo (Web Worker si besoin)
├── bots.js            decider(situation, niveau) : applique les règles des niveaux 2 à N
├── mentor.js          comparer(coupHumain, decision) → verdict + explication
├── journal.js         historique des mains et des décisions (rejouable grâce à la graine)
├── evaluation.js      bilan de fin de partie
└── vue/               dessin de la table, boutons, panneau du mentor
tests/
├── moteur/            tests unitaires et de propriétés du moteur
├── regles/            un cas par exemple du cours
└── existants/         tests rétroactifs des modules des niveaux 1 à 3
```

Format d'une raison : `{ code: 'C2.2', texte: 'Au CO, A9o n\'est pas dans la liste.', gravite: 'erreur' }`.
Le code renvoie au cours grâce au lien déjà en place (S-005).

## Phase 0 — Tests automatiques (avant tout le reste)

- [x] Choisir l'outil : `node --test` (inclus dans Node 24, aucune dépendance). Vérifié : les modules
      purs actuels (`evaluator.js`, `strategy.js`, `odds.js`, `draws.js`, `cards.js`) s'importent sous Node.
- [x] Créer `tests/` et une commande unique `bin/tester.sh` : `node --test tests/` puis
      `node tools/verifier_web.mjs` (`--rapide` : tests unitaires seuls).
- [x] Tests rétroactifs (21 tests, `tests/existants/`) : classement des mains (`niveau-1/evaluator.js`), lecture des ranges
      (`niveau-2/ranges.js`), cotes et équités (`niveau-3/odds.js`), comptage des outs (`niveau-3/draws.js`).
- [x] Règle dans `CLAUDE.md` : toute modification d'un module JavaScript pur s'accompagne de ses
      tests ; `bin/tester.sh` passe avant chaque commit.
- [ ] Option : intégration continue GitHub Actions qui lance `node --test` sur chaque PR
      (le test de fumée demande Chrome : à garder en local).

## Phase 1 — Moteur de jeu (sans interface)

- [x] Graine : réutiliser `rng(seed)` de `web/js/cards.js` (mulberry32, déjà là) ; tester que
      même graine → même donne.
- [x] Donne (dans `table.js`) : paquet mélangé, distribution, cartes imposées (`preset`).
- [x] `table.js` : de 2 à 6 sièges, blinds, ordre de parole préflop et postflop, tête-à-tête.
      (Le bouton tournant d'une main à l'autre relève de la partie : phase 2.)
- [x] Actions légales à chaque instant : se coucher, checker, suivre, miser, relancer (relance
      minimale = dernière relance), tapis.
- [x] Fin d'un tour d'enchères, passage de flop à turn puis river, main gagnée sans abattage.
- [x] `pots.js` : pots annexes avec plusieurs tapis de tailles différentes.
- [x] Abattage (dans `pots.js`) : meilleure main, égalités, partage des pots (jeton indivisible au premier
      joueur après le bouton).
- [x] Tests de scénarios : 15 mains écrites à la main, 5 tests de pots (`tests/moteur/`).
- [x] Tests de propriétés : 10 000 mains aléatoires jouées par des joueurs aléatoires ; à chaque
      étape, total des jetons constant, aucun tapis négatif, aucune action illégale acceptée ;
      gagnants vérifiés à l'abattage. Contrôlé en introduisant deux bogues : tous deux détectés.

## Phase 2 — Table jouable et bots des niveaux 2 et 3

- [ ] Onglet « Simulateur » dans l'en-tête (à côté de Cours et Profil), adresse `#simulateur`.
- [ ] Réglages : niveau de l'humain, niveau de chaque bot (2 à 6, valeurs mélangées possibles),
      mode d'aide, nombre de mains, graine (facultative).
- [ ] Vue de la table : 6 sièges, cartes (`web/cartes/`), pot, mises, bouton dealer, joueur actif.
- [ ] Boutons de l'humain : seules les actions légales sont actives ; montant de relance avec
      raccourcis (1/3, 1/2, 2/3 du pot, pot, tapis).
- [ ] Rythme des bots : court délai entre leurs actions, bouton « Accélérer ».
- [ ] `regles/preflop.js` : ranges du niveau 2 (ouverture, relance, sur-relance, suivre).
- [ ] `regles/cote.js` : décision postflop du niveau 3 (outs, cote du pot, équité requise).
- [ ] `equite.js` : équité d'une main contre une range, par Monte-Carlo ; mesurer le temps.
- [ ] `bots.js` : `decider(situation, niveau)` pour les niveaux 2 et 3, avec ses raisons.
- [ ] Postflop au niveau 2 : définir ce que fait un bot sans les règles du niveau 3 (simple :
      miser avec une paire ou mieux, sinon checker ou se coucher). **À écrire d'abord dans le cours (D8).**
- [ ] Bouton **Indice** : affiche la décision et ses raisons, avec un lien vers le cours.
- [ ] Tests : un cas par exemple du cours pour chaque règle codée.
- [ ] Ajouter le simulateur au test de fumée (`tools/verifier_web.mjs`) : clair, sombre, mobile.

## Phase 3 — Mentor

- [ ] Mode **Mentor** : l'humain choisit son coup, le simulateur le compare à `decider` avant de
      l'appliquer.
- [ ] `mentor.js` : verdicts conforme / défendable / erreur (D5). Définir et écrire les seuils
      de « défendable » (par exemple main à la limite d'une range, équité à moins de 5 points de
      l'équité requise).
- [ ] Explication : pourquoi le coup humain est moins bon, avec la règle et la section du cours.
- [ ] Choix laissé à l'humain : jouer son coup quand même, ou reprendre celui du mentor.
- [ ] Tests : situations types pour chaque verdict.

## Phase 4 — Journal et évaluation de fin de partie

- [ ] `journal.js` : chaque décision (humain et bots) avec la situation, le coup, la décision de
      référence, le verdict.
- [ ] Rejouer une main du journal à partir de sa graine.
- [ ] `evaluation.js` : par joueur, nombre de décisions conformes, défendables et erreurs ;
      erreurs regroupées par règle ; perte d'espérance estimée quand elle est calculable.
- [ ] Commentaire : les 3 erreurs les plus coûteuses de l'humain, avec la main et la règle.
- [ ] Statistiques du cours sur la partie : VPIP, PFR, AF (lien avec les profils du niveau 5).
- [ ] Rappel affiché : sur quelques dizaines de mains, les jetons mesurent surtout la chance.
- [ ] Sauvegarde du bilan dans le profil (`storage.js`), visible sur la page Profil.

## Phase 5 — Bots des niveaux 4 à 6

- [ ] Niveau 4 : raison de miser (valeur, bluff ou aucune), texture du flop, taille de c-bet, SPR.
- [ ] Niveau 5 : range adverse estimée d'après les actions, adaptation au profil observé des
      autres bots.
- [ ] Niveau 6 : défense minimale (MDF), part de bluffs équilibrée, exploitation des profils.
- [ ] Pour chaque niveau : lister les règles manquantes dans le cours, les y écrire (D8), puis les coder.
- [ ] Tests : un cas par exemple du cours ; partie de contrôle où les bots du niveau N battent
      ceux du niveau N−1 sur 10 000 mains (sinon une règle est mal codée).

## Phase 6 — Option : commentaire rédigé par une IA

- [ ] Décider si c'est utile après les phases 3 et 4.
- [ ] Le simulateur transmet les faits calculés (journal, verdicts, chiffres) ; l'IA rédige
      seulement, sans recalculer.
- [ ] Petit relais serveur pour garder la clé d'API secrète (même hébergement que S-012 B).

## Documentation

- [ ] `web/simulateur/README.md` et ligne dans le tableau des adresses de `web/README.md`.
- [ ] Section « Le simulateur » dans le mode d'emploi du cours (doc), puis `/publier-tutoriel`.
- [ ] Nouveaux termes éventuels dans le glossaire, avec leur origine.
