# Test de passage du niveau 1

Page web autonome (HTML, CSS, JavaScript sans dépendance ni compilation) qui fait passer les 4 tests du niveau 1 du programme d'initiation au poker.

| Test | Compétences | Contenu | Réussite |
| --- | --- | --- | --- |
| 1 · Déroulement d'une main | C1.1, C1.2 | Remettre les 6 étapes dans l'ordre + 5 questions tirées d'une banque de 10 | Tout juste |
| 2 · Classement des mains | C1.3 | Nommer 10 mains, une par combinaison, tirées au hasard | 10 sur 10 |
| 3 · Trouver les nuts | C1.4 | 10 tableaux aléatoires, choisir la main qui fait les nuts parmi 4 | 9 sur 10 |
| 4 · Pot annexe | C1.2 | Un joueur à tapis, calculer les pots et la répartition à l'abattage | 5 sur 5 |

Les questions sont générées à chaque essai. Un test est validé après **deux réussites à au moins 3 jours d'écart** ; le niveau est validé quand les 4 tests le sont.

## Exercices d'entraînement

L'onglet **Exercices** (adresse `#exercices`) reprend les exercices du niveau 1 du tutoriel. La correction est immédiate, un compteur suit les réussites de la séance, et rien n'est enregistré. Chaque exercice a ses options, choisies dans des listes déroulantes.

| Exercice | Compétences | Contenu | Options |
| --- | --- | --- | --- |
| Annoncer les étapes | C1.1, C1.2 | Une main distribuée étape par étape : annoncer chaque étape avant qu'elle ait lieu | 3 à 6 joueurs ; questions : étape seule, + qui pose la petite blind et qui parle, + qui gagne à l'abattage |
| Meilleure main en 7 cartes | C1.3 | 7 cartes au hasard, nommer la meilleure combinaison ; la correction montre les 5 cartes retenues | Temps limite 10 s, 20 s ou sans ; 7 cartes en vrac ou 2 en main + 5 au tableau |
| Nommer les nuts | C1.4 | Un tableau de 5 cartes, nommer les nuts ; la correction donne un exemple et le nombre de combos | Série de 20, de 10 ou sans fin ; combinaison seule ou combinaison et hauteur |

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
    ├── app.js              onglets Tests et Exercices, passage d'un test, correction
    ├── dom.js              construction du DOM
    ├── cards.js            paquet, tirage reproductible (graine), affichage des cartes
    ├── evaluator.js        évaluation d'une main de 5 à 7 cartes, description en français
    ├── storage.js          historique des tentatives (localStorage), règle des 3 jours
    ├── analysis.js         meilleure main de 5 cartes parmi 7, nuts d'un tableau
    ├── exercises/
    │   ├── deroulement.js  test 1
    │   ├── classement.js   test 2
    │   ├── nuts.js         test 3
    │   └── pot-annexe.js   test 4
    └── practice/
        ├── annonces.js        exercice : annoncer les étapes
        ├── meilleure-main.js  exercice : meilleure main en 7 cartes
        └── nommer-nuts.js     exercice : nommer les nuts
```

Chaque épreuve est un module qui exporte `{ id, code, title, competences, rule, create(rand) }`. `create` reçoit un générateur aléatoire et renvoie un objet avec `render(root)`, `missing()` (message si des réponses manquent) et `grade()` (`{ score, total, passed, items }`). Pour ajouter une épreuve, créer un module sur ce modèle et l'ajouter à la liste `EXERCISES` de `app.js`.

Un exercice d'entraînement exporte `{ id, title, competences, summary, settings, create(rand, settings, report) }`. `settings` décrit les listes déroulantes (`{ id, label, default, options: [{ value, label }] }`) ; changer une option relance l'exercice. `create` renvoie un objet avec `render(root)` et appelle `report(ok)` après chaque réponse pour mettre à jour le compteur. Les exercices sont listés dans `PRACTICES` de `app.js`.

Chaque tentative enregistre sa graine aléatoire : on peut régénérer exactement les mêmes questions pour une revue.

## Résultats

Les résultats restent dans le navigateur du joueur (`localStorage`). Le tableau de bord permet de les exporter en JSON, de les réimporter sur un autre appareil ou de les effacer. En navigation privée, le test fonctionne mais rien n'est conservé.
