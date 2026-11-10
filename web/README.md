# Application d'entraînement

Une seule page web (HTML, CSS, JavaScript sans dépendance ni compilation) pour tous les niveaux du programme d'initiation au poker. Chaque niveau a ses tests de passage, ses exercices d'entraînement et, au besoin, ses propres onglets. Le contenu de chaque niveau est décrit dans son README : niveaux [1](niveau-1/README.md), [2](niveau-2/README.md), [3](niveau-3/README.md), [4](niveau-4/README.md), [5](niveau-5/README.md), [6](niveau-6/README.md).

## Adresses

Tout passe par `index.html` ; la partie après `#` choisit le niveau et l'onglet.

| Adresse | Affiche |
| --- | --- |
| `index.html` | le dernier niveau ouvert dans ce navigateur (sinon le niveau 1) |
| `index.html#niveau-2` | l'onglet Tests du niveau 2 |
| `index.html#niveau-2/exercices` | l'onglet Exercices du niveau 2 |
| `index.html#niveau-2/aide` | un onglet propre au niveau (ici l'Aide-mémoire) |
| `index.html#cours` | le cours : accueil et table des matières |
| `index.html#cours/niveau-3` | une page du cours (`introduction`, `mode-d-emploi`, `niveau-1` à `niveau-6`, `grille`, `ressources`, `glossaire`) |
| `index.html#cours/niveau-3/c3-7-compter-les-mains-qui-vous-battent` | une section d'une page du cours |
| `index.html#cours/imprimer` | tout le cours sur une page, pour l'impression (source du PDF) |
| `index.html#profil` | le Profil (bouton à droite des niveaux) : prénom, résultats, changement d'appareil, sauvegarde, effacement |
| `index.html#transfert/1.…` | lien de transfert reçu : page Profil, avec le résumé de ce qui arrive |

Les anciennes adresses `niveau-1/` et `niveau-2/` redirigent vers `index.html#niveau-N`, pour ne pas casser les favoris.

## Lancer en local

Les modules JavaScript ne fonctionnent pas en ouvrant le fichier directement (`file://`) : il faut un serveur HTTP. Depuis la racine du dépôt :

```bash
bin/serve.sh            # affiche http://localhost:8000/web/ et l'adresse de chaque niveau
```

## Déployer sur un serveur

Le dossier `web/` est autonome : tous les chemins sont relatifs à `index.html`, cartes comprises (`cartes/`). On le copie tel quel, sous le nom qu'on veut :

```bash
rsync -av --delete web/ utilisateur@vps:/chemin/public_html/poker/
```

La page est alors à `https://domaine/poker/`. Aucune configuration serveur particulière : des fichiers statiques suffisent. Les `.svg` doivent être servis en `image/svg+xml` et les `.js` en `text/javascript` (réglages par défaut de nginx et d'Apache).

Ou, depuis la racine du dépôt : `bin/deploy.sh utilisateur@vps:/chemin/public_html/poker/` (ajouter `--dry-run` pour simuler). `index.html` charge `css/style.css?v=…` et `js/app.js?v=…` ; le script remplace ce numéro par le commit courant, pour que les navigateurs ne gardent pas l'ancienne version en cache. Pour les autres fichiers JavaScript, un rechargement forcé (Ctrl+Maj+R) peut être nécessaire.

## Vérifier

`bin/tester.sh` (depuis la racine) lance tous les tests ; `bin/tester.sh --rapide` se limite aux tests unitaires.

Les tests unitaires (`tests/`, lancés par `node --test`, sans dépendance) vérifient la logique des modules purs, ceux qui ne touchent pas à la page : classement des mains, ranges, cotes, outs. Un module importé par un test ne doit pas utiliser `document` ni `window` au chargement.

`node tools/verifier_web.mjs` (depuis la racine) ouvre chaque page dans Chrome headless, en thème clair et sombre, y compris l'intérieur des exercices et des tests. Il signale les erreurs JavaScript, les fichiers introuvables, les boutons et liens peu lisibles (contraste WCAG AA) et les liens internes du cours sans cible.

## Organisation

```
web/
├── index.html              la page unique
├── css/style.css           mise en page commune, thème clair et sombre, mobile
├── cartes/                 jeu de cartes vectoriel poker-qr (SVG)
├── cours/
│   ├── contenu.js          le tutoriel découpé en pages (généré par tools/cours_html.py, ne pas modifier)
│   └── img/                ses illustrations
├── js/
│   ├── app.js              lit l'adresse, dessine l'en-tête et la barre Cours + niveaux, charge niveau-N/niveau.js
│   ├── cours.js            le cours : sommaire, pages, navigation précédent / suivant (flèches du clavier aussi)
│   ├── profil.js           page Profil : prénom, résumé, code de transfert, fichier, effacement
│   ├── serie.js            séries de questions (10 au plus), une à la fois : makeTest, makePractice (niveaux 3 à 6)
│   ├── config.js           chemin des cartes, écart de jours, liste des niveaux (LEVELS)
│   ├── shell.js            onglets, tableau de bord, passage d'un test, correction, exercices, export
│   ├── dom.js              construction du DOM
│   ├── cards.js            paquet, tirage reproductible (graine), affichage des cartes
│   └── storage.js          historique des tentatives (localStorage), règle des 3 jours, fusion
├── niveau-1/
│   ├── niveau.js           définition du niveau : tests, exercices
│   ├── index.html          redirection vers ../index.html#niveau-1
│   └── …                   modules propres au niveau
└── niveau-2/
    ├── niveau.js           définition du niveau : tests, exercices, onglet Aide-mémoire, feuille de style
    ├── style.css           styles propres au niveau, chargés par app.js
    ├── index.html          redirection vers ../index.html#niveau-2
    └── …
```

## Le cours

Le bouton « Cours », avant les niveaux, affiche le tutoriel complet en 12 pages : l'accueil avec la table des matières, l'introduction, le mode d'emploi, une page par niveau, puis une page par annexe (grille d'auto-évaluation, ressources, glossaire). Chaque page a, en haut et en bas, un bouton Sommaire et des liens vers la page précédente et la suivante ; les flèches gauche et droite du clavier font de même. Les pages d'un niveau prêt renvoient aussi vers ses exercices et ses tests.

Chaque exercice et chaque test renvoie vers les sections du cours de ses compétences (« Revoir dans le cours : C1.3 »). La page Grille d'auto-évaluation se remplit avec les résultats des tests enregistrés dans le navigateur. La vue `#cours/imprimer` met tout le cours sur une page ; c'est elle que `tools/pdf_cours.mjs` imprime pour fabriquer le PDF.

Le contenu vient du Claude Doc du tutoriel. Après une modification du doc (commande `/publier-tutoriel` dans Claude Code) : l'exporter au format `html`, puis

```bash
python3 tools/cours_html.py export.html
```

Le script s'arrête avec un message si le doc a changé de structure (grande partie ajoutée, image inconnue, lien interne sans cible, tableau d'escalier introuvable) : il faut alors compléter `tools/cours_config.json`. Ce fichier contient tout ce qui est propre au doc ; le script lui-même sert pour n'importe quel Claude Doc.

## Ajouter un niveau

1. Créer `niveau-N/niveau.js`, qui exporte par défaut :

   ```js
   export default {
     level: 3,
     storageKey: 'poker.niveau3.v1',   // clé localStorage, propre au niveau
     tests: [...],                     // épreuves
     manual: [{ id, text }],           // facultatif : critères vérifiés à la table, à cocher
     practices: [...],                 // exercices d'entraînement
     extraTabs: [{ id, label, render(root) }],   // facultatif
     testsNote: '…',                   // facultatif : texte sous l'introduction des tests
     css: 'style.css',                 // facultatif : relatif au dossier du niveau
   };
   ```

2. Passer `ready` à `true` pour ce niveau dans `LEVELS` (`js/config.js`). Les niveaux pas encore prêts apparaissent grisés dans la barre.

Les modules d'un niveau importent le code commun par `../js/…` (ou `../../js/…` depuis un sous-dossier).

**Un critère à cocher** (`manual`) : ce que l'application ne peut pas mesurer (résultats sur des milliers de mains, durée, habitude de jeu). Il s'affiche dans l'onglet Tests, rubrique « À vérifier à la table » ; le joueur le coche, la date est enregistrée (`manual` dans les données du niveau) et suit le transfert et la sauvegarde. Le niveau est validé quand tous les tests le sont et que tous les critères sont cochés.

**Une épreuve** exporte `{ id, code, title, competences, rule, create(rand) }`. `create` reçoit un générateur aléatoire et renvoie un objet avec `render(root)`, `missing()` (message si des réponses manquent) et `grade()` (`{ score, total, passed, items }`). Avec `series: 2` et `pass: 18`, le test se passe en 2 séries : `create` est appelé une fois par série (même générateur, donc d'autres données), les scores sont additionnés et jugés sur `pass`. Une série ne doit pas poser plus de 10 questions.

**Un exercice d'entraînement** exporte `{ id, title, competences, summary, settings, create(rand, settings, report) }`. `settings` décrit les listes déroulantes (`{ id, label, default, options: [{ value, label }] }`) ; changer une option relance l'exercice. `create` renvoie un objet avec `render(root)` et appelle `report(ok)` après chaque réponse pour mettre à jour le compteur.

Chaque tentative enregistre sa graine aléatoire : on peut régénérer exactement les mêmes questions pour une revue.

## Résultats

Les résultats restent dans le navigateur du joueur (`localStorage`), une clé par niveau (`poker.niveauN.v1`). En navigation privée, la page fonctionne mais rien n'est conservé.

**Le Profil** (`js/profil.js`, bouton à droite des niveaux, qui affiche le prénom une fois saisi) regroupe tout ce qui concerne le joueur, pour tous les niveaux à la fois : le prénom, commun à tout le site (clé `poker.joueur` ; un prénom saisi autrefois dans un niveau est repris), le résumé des résultats, le changement d'appareil, la sauvegarde dans un fichier et l'effacement.

**Changer d'appareil : le code de transfert.** Le Profil crée un lien qui contient le prénom et tous les résultats, compressé : environ 2,4 Ko pour 200 tentatives. Ouvert sur un autre appareil, il ajoute les tentatives qui y manquent. Aucun serveur : le code est après le `#`, que le navigateur n'envoie jamais. Format : `#transfert/1.<base64url(deflate-raw(JSON))>`, chaque tentative en tableau `[secondes, graine, score, total, réussi, durée]`.

**Sauvegarde dans un fichier.** Un fichier JSON pour tous les niveaux (`{ format: "poker-resultats", joueur, niveaux: { 1: …, 2: … } }`). L'import accepte aussi les anciens fichiers d'un seul niveau, reconnus à leurs tests.

**Fusion, jamais remplacement.** Une tentative n'est jamais modifiée ; elle est identifiée par sa seconde et sa graine. Fusionner deux historiques revient à les réunir sans doublon (`mergeData`, `js/storage.js`) : rouvrir un lien ou réimporter un fichier ne change rien, un vieux lien ne fait rien perdre, on peut transférer dans les deux sens.
