# Test de passage du niveau 1

Page web autonome (HTML, CSS, JavaScript sans dépendance ni compilation) qui fait passer les 4 tests du niveau 1 du programme d'initiation au poker.

| Test | Compétences | Contenu | Réussite |
| --- | --- | --- | --- |
| 1 · Déroulement d'une main | C1.1, C1.2 | Remettre les 6 étapes dans l'ordre + 5 questions tirées d'une banque de 10 | Tout juste |
| 2 · Classement des mains | C1.3 | Nommer 10 mains, une par combinaison, tirées au hasard | 10 sur 10 |
| 3 · Trouver les nuts | C1.4 | 20 tableaux aléatoires, choisir la main qui fait les nuts parmi 4 | 18 sur 20 |
| 4 · Pot annexe | C1.2 | Un joueur à tapis, calculer les pots et la répartition à l'abattage | 5 sur 5 |

Les questions sont générées à chaque essai. Un test est validé après **deux réussites à au moins 3 jours d'écart** ; le niveau est validé quand les 4 tests le sont.

## Lancer en local

Les modules JavaScript ne fonctionnent pas en ouvrant le fichier directement (`file://`) : il faut un serveur HTTP. Depuis la racine du dépôt :

```bash
cd ~/git/poker
python3 -m http.server 8000
# ou : php -S localhost:8000
```

Puis ouvrir <http://localhost:8000/tests/niveau-1/>.

## Déployer sur un serveur

La page utilise les cartes de `assets/poker-qr/` par un chemin relatif (`../../assets/poker-qr/`). Deux possibilités :

- copier le dépôt (au moins `tests/` et `assets/`) en gardant la même arborescence, par exemple dans le `public_html` d'un domaine Hestia ;
- ou servir les cartes ailleurs et modifier `cardsPath` dans `js/config.js`.

Aucune configuration serveur particulière : des fichiers statiques suffisent. Avec nginx, les `.svg` doivent être servis en `image/svg+xml` et les `.js` en `text/javascript` (réglages par défaut).

## Organisation du code

```
tests/niveau-1/
├── index.html              page d'accueil, charge css/style.css et js/app.js
├── css/style.css           mise en page, thème clair et sombre, mobile
└── js/
    ├── config.js           chemin des cartes, écart de jours, clé de stockage
    ├── app.js              tableau de bord, passage d'un test, correction
    ├── dom.js              construction du DOM
    ├── cards.js            paquet, tirage reproductible (graine), affichage des cartes
    ├── evaluator.js        évaluation d'une main de 5 à 7 cartes, description en français
    ├── storage.js          historique des tentatives (localStorage), règle des 3 jours
    └── exercises/
        ├── deroulement.js  test 1
        ├── classement.js   test 2
        ├── nuts.js         test 3
        └── pot-annexe.js   test 4
```

Chaque épreuve est un module qui exporte `{ id, code, title, competences, rule, create(rand) }`. `create` reçoit un générateur aléatoire et renvoie un objet avec `render(root)`, `missing()` (message si des réponses manquent) et `grade()` (`{ score, total, passed, items }`). Pour ajouter une épreuve, créer un module sur ce modèle et l'ajouter à la liste `EXERCISES` de `app.js`.

Chaque tentative enregistre sa graine aléatoire : on peut régénérer exactement les mêmes questions pour une revue.

## Résultats

Les résultats restent dans le navigateur du joueur (`localStorage`). Le tableau de bord permet de les exporter en JSON, de les réimporter sur un autre appareil ou de les effacer. En navigation privée, le test fonctionne mais rien n'est conservé.
