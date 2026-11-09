# Suggestions d'amélioration

Mis à jour le 2026-11-09. Fiches classées par section ; index trié par rapport
bénéfice/coût. Statuts : proposée · acceptée · en cours · faite · reportée · refusée.
Règles de tenue et commandes : voir [`strategie_suggestions.md`](../strategie_suggestions.md).

Coût : S = moins d'une session ; M = quelques sessions ; L = un chantier.

## Index

| ID | Section | Suggestion | Bénéfice | Coût | Rapport | Statut |
|---|---|---|---|---|---|---|
| S-001 | Système | Remplacer le PDF du tutoriel par une version imprimable du site | élevé | S | élevé | proposée |
| S-005 | Par fonctionnalité | Lier chaque exercice et chaque test à sa section du cours | moyen | S | élevé | proposée |
| S-004 | Méthodes | Une commande qui enchaîne toute la publication du tutoriel | moyen | S | élevé | proposée |
| S-007 | Méthodes | Test de fumée automatique : toutes les pages, sans erreur, contraste suffisant | moyen | S | élevé | proposée |
| S-002 | Système | Remplacer le carnet PDF par la progression enregistrée dans l'application | élevé | M | moyen | proposée |
| S-003 | Système | Supprimer le texte de l'escalier des niveaux recopié dans le générateur | faible | S | moyen | proposée |
| S-006 | Par fonctionnalité | Grille d'auto-évaluation du cours remplie avec les résultats réels | moyen | M | moyen | proposée |
| S-008 | Méthodes | Numéro de version des fichiers (`?v=N`) calculé automatiquement | faible | S | moyen | proposée |
| S-009 | Autres projets | Générateur générique « Claude Doc → site à pages » | moyen | M | faible | proposée |

## 1. Système et organisation du projet

### S-001 · Remplacer le PDF du tutoriel par une version imprimable du site
- **Statut** : proposée · **Date** : 2026-11-09 · **Origine** : discussion sur la fusion cours + exercices
- **Constat** : le tutoriel est produit deux fois depuis le Claude Doc : le PDF (export, mise en
  page par `tools/mise_en_page_pdf.py`, vérification `pdftotext`) et le cours HTML
  (`tools/cours_html.py`). L'utilisateur passe de toute façon par le site pour s'entraîner.
- **Proposition** : faire du site la seule version de référence. Le PDF devient une impression
  du cours : une page « tout le cours » et une feuille `@media print` (sauts de page avant
  chaque partie, liens visibles).
- **Bénéfices** : une seule chaîne de fabrication ; pas d'écart possible entre les deux
  versions ; une étape de moins (et un script de moins) à chaque modification du doc.
- **Coûts** : S. Feuille d'impression et page « tout le cours ». On perd la table des
  matières paginée et les signets du PDF actuel. Garder le PDF existant tant que la version
  imprimée n'est pas jugée suffisante.
- **Rapport** : élevé.
- **Premier pas** : imprimer en PDF la page Niveau 1 du cours avec une feuille d'impression
  minimale, comparer avec le PDF actuel.
- **Décision** :

### S-002 · Remplacer le carnet PDF par la progression enregistrée dans l'application
- **Statut** : proposée · **Date** : 2026-11-09 · **Origine** : relecture du README
- **Constat** : la progression est suivie à deux endroits : le carnet
  (`doc/carnet-progression-poker.pdf`, formulaire à remplir à la main, avec des copies
  personnelles dans `doc/progressions/` et `progressions/`) et l'application, qui enregistre
  déjà chaque tentative et la règle des 3 jours (`localStorage`, export JSON). Même cause que
  S-001 : deux supports pour la même chose.
- **Proposition** : un onglet « Ma progression » dans l'application : toutes les compétences,
  leur statut, les dates de validation, et un champ de notes par session (ce que le carnet
  demande : nombre de mains jouées, erreur principale). Impression possible pour garder une
  trace papier.
- **Bénéfices** : plus de double saisie ; le carnet est toujours à jour ; les tests
  déclaratifs (VPIP sur 500 mains…) y trouvent leur place.
- **Coûts** : M. Nouvel écran, stockage des notes, prise en compte des niveaux pas encore
  développés (saisie manuelle). Les données restent dans un seul navigateur (export JSON
  existant).
- **Rapport** : moyen.
- **Premier pas** : lister les champs du carnet PDF et voir lesquels l'application connaît déjà.
- **Décision** :

### S-003 · Supprimer le texte de l'escalier des niveaux recopié dans le générateur
- **Statut** : proposée · **Date** : 2026-11-09 · **Origine** : création du cours HTML
- **Constat** : le graphique « Six niveaux, chacun ouvert par un test de passage » est un
  widget du doc, absent de l'export HTML. Son texte est recopié en dur dans
  `tools/cours_html.py` (`STAIRS`). Une modification du widget ne serait pas reportée.
- **Proposition** : dans le doc, remplacer le widget par un tableau (niveau, objectif, durée,
  test), que le générateur met en forme en escalier ; ou faire lire au générateur les données
  du widget.
- **Bénéfices** : une seule source ; plus de risque d'écart silencieux.
- **Coûts** : S. Toucher au doc (le PDF change aussi, sauf si S-001 est fait).
- **Rapport** : moyen.
- **Premier pas** : vérifier si l'export `markdown` ou `notion` du doc contient les données du widget.
- **Décision** :

## 2. Architecture

(aucune suggestion pour l'instant)

## 3. Méthodes de développement

### S-004 · Une commande qui enchaîne toute la publication du tutoriel
- **Statut** : proposée · **Date** : 2026-11-09 · **Origine** : relecture de `CLAUDE.md`
- **Constat** : après chaque modification du doc, `CLAUDE.md` prévoit 5 étapes manuelles :
  export PDF, mise en page, vérification, nombre de pages dans le README, export HTML et
  génération du cours. Un oubli laisse les supports désynchronisés.
- **Proposition** : une commande `/publier-tutoriel` (skill) qui fait les exports, lance les
  deux scripts, vérifie, met à jour le README et résume ce qui a changé (`git diff --stat`).
- **Bénéfices** : rien n'est oublié ; moins de tokens dépensés à relire les consignes.
- **Coûts** : S. À simplifier si S-001 supprime le PDF.
- **Rapport** : élevé.
- **Premier pas** : écrire le skill à partir de la liste de `CLAUDE.md`.
- **Décision** :

### S-007 · Test de fumée automatique : toutes les pages, sans erreur, contraste suffisant
- **Statut** : proposée · **Date** : 2026-11-09 · **Origine** : correction du bouton invisible
- **Constat** : le projet n'a pas de test automatique de l'application web. Un bouton au texte
  invisible (cours) et des boutons peu lisibles en thème sombre (contraste 2,25) sont passés
  inaperçus. Un script ponctuel, lancé dans Chrome headless, les a trouvés en quelques secondes.
- **Proposition** : `tools/verifier_web.mjs` : ouvre chaque adresse (cours, niveaux, onglets,
  exercices, tests) en thème clair et sombre ; échoue sur une erreur JavaScript, une image
  manquante ou un contraste inférieur à 4,5 (3 pour les grands textes).
- **Bénéfices** : les régressions visibles sont attrapées avant l'utilisateur ; vérification
  en une commande après chaque modification.
- **Coûts** : S. Dépend de Chrome et de Node, déjà présents.
- **Rapport** : élevé.
- **Premier pas** : reprendre le script de contraste écrit le 2026-11-09 et l'ajouter à `tools/`.
- **Décision** :

### S-008 · Numéro de version des fichiers calculé automatiquement
- **Statut** : proposée · **Date** : 2026-11-09 · **Origine** : mise à jour de `style.css`
- **Constat** : `web/index.html` charge `style.css?v=6` et `app.js?v=5`, numéros à augmenter à
  la main ; les autres modules JavaScript n'en ont pas et peuvent rester en cache.
- **Proposition** : un petit script de déploiement qui remplace `?v=…` par l'empreinte du
  fichier ou le commit courant.
- **Bénéfices** : plus de version périmée chez les joueurs après une mise à jour.
- **Coûts** : S. Une étape de plus au déploiement (à intégrer à la commande `rsync`).
- **Rapport** : moyen.
- **Premier pas** : `bin/deploy.sh` qui écrit le commit court dans `index.html` avant `rsync`.
- **Décision** :

## 4. Interface et parcours

(voir aussi S-005 et S-006)

## 5. Par fonctionnalité

### 5.1 Cours

### S-005 · Lier chaque exercice et chaque test à sa section du cours
- **Statut** : proposée · **Date** : 2026-11-09 · **Origine** : création du cours HTML
- **Constat** : le cours renvoie vers les exercices (« S'entraîner au niveau N »), mais pas
  l'inverse. Chaque exercice et chaque test connaît déjà ses compétences (`competences: 'C1.3'`),
  et chaque section du cours a une adresse (`#cours/niveau-1/c1-3-…`).
- **Proposition** : sur les cartes d'exercice et dans la correction d'un test, un lien
  « Revoir C1.3 » vers la section du cours.
- **Bénéfices** : après une erreur, on retrouve la notion en un clic : c'est le parcours
  naturel « échec → révision → nouvel essai » que décrit le mode d'emploi.
- **Coûts** : S. Une table code → adresse tirée de `cours/contenu.js`.
- **Rapport** : élevé.
- **Premier pas** : afficher le lien sur les cartes de l'onglet Exercices.
- **Décision** :

### S-006 · Grille d'auto-évaluation du cours remplie avec les résultats réels
- **Statut** : proposée · **Date** : 2026-11-09 · **Origine** : création du cours HTML
- **Constat** : la page « Grille d'auto-évaluation » du cours affiche « Non commencé » partout,
  alors que l'application connaît le statut des tests des niveaux 1 et 2.
- **Proposition** : remplir les colonnes Statut et Date de validation à partir des résultats
  enregistrés ; laisser les compétences sans test automatique en saisie manuelle. Rejoint S-002.
- **Bénéfices** : la grille devient le tableau de bord de toute la progression.
- **Coûts** : M. Correspondance compétence ↔ test à établir ; cas des compétences évaluées
  hors de l'application.
- **Rapport** : moyen.
- **Premier pas** : faire S-005, qui crée la correspondance code → section.
- **Décision** :

## 6. Transverses

(performances, sécurité, qualité : aucune suggestion pour l'instant)

## 7. Idées pour d'autres projets

### S-009 · Générateur générique « Claude Doc → site à pages »
- **Statut** : proposée · **Date** : 2026-11-09 · **Origine** : création du cours HTML
- **Constat** : `tools/cours_html.py` résout des problèmes communs à tout doc publié en site :
  découpage par titres, images, liens internes, sommaire, navigation précédent/suivant.
  Il est écrit pour ce doc seulement (`PAGES`, `BLOBS`, `STAIRS`).
- **Proposition** : en tirer un outil réutilisable, avec la configuration propre à chaque doc
  dans un petit fichier.
- **Bénéfices** : publier d'autres tutoriels ou documentations sans repartir de zéro.
- **Coûts** : M. Généraliser sans alourdir ; maintenir un outil de plus.
- **Rapport** : faible pour ce projet.
- **Premier pas** : attendre un deuxième besoin réel avant de généraliser.
- **Décision** :

## Archive

(vide)
