# Suggestions d'amélioration

Mis à jour le 2026-11-10 (ajout de S-015 et S-016 ; avant : réalisation de S-001, S-003 à S-010, S-012 option A, S-013, S-014). Fiches classées par section ; index trié par rapport
bénéfice/coût. Statuts : proposée · acceptée · en cours · faite · reportée · refusée.
Règles de tenue et commandes : voir [`strategie_suggestions.md`](../strategie_suggestions.md).

Coût : S = moins d'une session ; M = quelques sessions ; L = un chantier.

## Index

| ID | Section | Suggestion | Bénéfice | Coût | Rapport | Statut |
|---|---|---|---|---|---|---|
| S-016 | Méthodes | Tests automatiques systématiques : `node --test` sur les modules purs, commande unique `bin/tester.sh` | élevé | S | élevé | faite |
| S-015 | Par fonctionnalité | Simulateur de table à 6 : bots des niveaux 2 à 6, Indice, Mentor, évaluation des décisions | élevé | L | moyen | acceptée |
| S-012 | Architecture | Garder les progrès d'un appareil à l'autre : code de transfert (A), puis petit serveur PHP + fichiers JSON (B) | élevé | S puis M | élevé | A faite, B proposée |
| S-014 | Tutoriel | Écrire dans le cours trois règles que l'application a dû fixer (c-bet sur flop apparié ou monotone, seuils des profils, catégories de range) | moyen | S | élevé | faite |
| S-013 | Par fonctionnalité | Quiz préflop du niveau 2 en 2 séries de 10 (règle des 10 questions par série) | moyen | S | élevé | faite |
| S-010 | Tutoriel | Corriger l'écart de VPIP du test du niveau 2 (18–26 % ou 12–20 %) | moyen | S | élevé | faite |
| S-011 | Tutoriel | Ajouter C3.7 à la grille d'auto-évaluation | faible | S | élevé | proposée |
| S-002 | Système | Remplacer le carnet PDF par la progression enregistrée dans l'application | élevé | M | moyen | proposée |
| S-001 | Système | Remplacer le PDF du tutoriel par une version imprimable du site | élevé | S | élevé | faite |
| S-005 | Par fonctionnalité | Lier chaque exercice et chaque test à sa section du cours | moyen | S | élevé | faite |
| S-004 | Méthodes | Une commande qui enchaîne toute la publication du tutoriel | moyen | S | élevé | faite |
| S-007 | Méthodes | Test de fumée automatique : toutes les pages, sans erreur, contraste suffisant | moyen | S | élevé | faite |
| S-003 | Système | Supprimer le texte de l'escalier des niveaux recopié dans le générateur | faible | S | moyen | faite |
| S-006 | Par fonctionnalité | Grille d'auto-évaluation du cours remplie avec les résultats réels | moyen | M | moyen | faite |
| S-008 | Méthodes | Numéro de version des fichiers (`?v=N`) calculé automatiquement | faible | S | moyen | faite |
| S-009 | Autres projets | Générateur générique « Claude Doc → site à pages » | moyen | M | faible | faite en partie |

## 1. Système et organisation du projet

### S-001 · Remplacer le PDF du tutoriel par une version imprimable du site
- **Statut** : faite · **Date** : 2026-11-09 · **Origine** : discussion sur la fusion cours + exercices
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
- **Décision** : 2026-11-09, acceptée et réalisée. Vue `#cours/imprimer` (tout le cours sur une
  page) et feuille d'impression ; `tools/pdf_cours.mjs` l'imprime dans Chrome headless en deux
  passes (numéros de page de la table des matières lus avec `pdftotext`), avec signets et
  « Page X sur N ». 36 pages au lieu de 40, sans perte de texte (comparaison des mots).
  `tools/mise_en_page_pdf.py` et la dépendance PyMuPDF sont supprimés.

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
- **Statut** : faite · **Date** : 2026-11-09 · **Origine** : création du cours HTML
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
- **Décision** : 2026-11-09, acceptée et réalisée. Le widget du doc est remplacé par un tableau
  (Niveau, Objectif, Durée, Test de passage) ; le générateur le dessine en escalier (`escaliers`
  dans `tools/cours_config.json`). L'export `markdown` n'a pas été essayé : trop gros pour être lu
  directement, et le tableau règle la question pour tous les formats. Le PDF en profite (S-001).
  Effet de bord découvert : voir S-010.

## 2. Architecture

### S-012 · Garder les progrès d'un appareil à l'autre
- **Statut** : option A faite, option B proposée · **Date** : 2026-11-09 · **Origine** : question de l'utilisateur
- **Constat** : les résultats ne vivent que dans un navigateur (`localStorage`). Changer de
  téléphone, d'ordinateur ou de navigateur fait tout perdre, sauf export JSON manuel par niveau.
  L'import remplaçait les données locales au lieu de les compléter.
- **Proposition** : sans base de données ni framework, par étapes.
  - **A. Code de transfert** : un lien qui contient tous les résultats, compressé, après le `#`
    (jamais envoyé au serveur) ; ouvert ailleurs, il fusionne. Aucun serveur.
  - **B. Synchronisation** : `api.php` (~120 lignes) et un fichier JSON par joueur hors de la partie
    publique ; un « code joueur » secret de 128 bits gardé dans un cookie `HttpOnly; Secure;
    SameSite=Strict`. Variante C : SQLite (intégré à PHP) au lieu des fichiers JSON.
  - Écartées : D, service externe (Firebase, Supabase : dépendance, données ailleurs) ;
    E, Laravel de `doc/architecture.md` (framework et MySQL).
- **Bénéfices** : A : changement d'appareil et sauvegarde en un lien. B : synchronisation
  automatique, plus besoin d'y penser.
- **Coûts** : A : S (~250 lignes avec la page et le test). B : M (1 à 2 sessions), plus une
  sauvegarde régulière du dossier de données ; demande PHP sur le serveur (à vérifier : `php -v`).
  Sans PHP, un petit service Python, avec un service système et un proxy à gérer.
- **Rapport** : élevé.
- **Premier pas pour B** : vérifier que le serveur exécute PHP.
- **Décision** : 2026-11-09, A acceptée et réalisée. `web/js/transfert.js`, page `#transfert`,
  bouton dans l'onglet Tests et lien en pied de page ; fusion `mergeData` dans `web/js/storage.js`,
  utilisée aussi par l'import de fichier (qui ne remplace plus). Lien d'environ 2,4 Ko pour 200
  tentatives. Testé par `tools/verifier_web.mjs` : aller-retour entre deux profils de navigateur,
  sans doublon, lien rouvert sans effet, code abîmé signalé. Pas de QR code (bibliothèque à ajouter,
  peu lisible au-delà de 1 Ko) : « Partager » du téléphone à la place. B reste à décider.
  Puis, à la demande : tout est regroupé dans une page **Profil** (`web/js/profil.js`, bouton à
  droite des niveaux) : prénom commun à tout le site (clé `poker.joueur`, reprise de l'ancien prénom
  d'un niveau), résumé des résultats, transfert, fichier de sauvegarde unique pour tous les niveaux
  (anciens fichiers d'un niveau acceptés), effacement de tout. L'onglet Tests de chaque niveau perd
  son champ prénom et ses quatre boutons.

## 3. Méthodes de développement

### S-004 · Une commande qui enchaîne toute la publication du tutoriel
- **Statut** : faite · **Date** : 2026-11-09 · **Origine** : relecture de `CLAUDE.md`
- **Constat** : après chaque modification du doc, `CLAUDE.md` prévoit 5 étapes manuelles :
  export PDF, mise en page, vérification, nombre de pages dans le README, export HTML et
  génération du cours. Un oubli laisse les supports désynchronisés.
- **Proposition** : une commande `/publier-tutoriel` (skill) qui fait les exports, lance les
  deux scripts, vérifie, met à jour le README et résume ce qui a changé (`git diff --stat`).
- **Bénéfices** : rien n'est oublié ; moins de tokens dépensés à relire les consignes.
- **Coûts** : S. À simplifier si S-001 supprime le PDF.
- **Rapport** : élevé.
- **Premier pas** : écrire le skill à partir de la liste de `CLAUDE.md`.
- **Décision** : 2026-11-09, acceptée et réalisée. Skill `.claude/skills/publier-tutoriel/` ;
  `tools/decoder_export.py` décode l'export enregistré par Claude Code. `CLAUDE.md` renvoie à la
  commande. Pas encore lancée de bout en bout comme commande (les étapes l'ont été une à une).

### S-007 · Test de fumée automatique : toutes les pages, sans erreur, contraste suffisant
- **Statut** : faite · **Date** : 2026-11-09 · **Origine** : correction du bouton invisible
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
- **Décision** : 2026-11-09, acceptée et réalisée. `tools/verifier_web.mjs` (module commun
  `tools/chrome.mjs`) : 62 vues, deux thèmes. Seuils WCAG AA (4,5 ; 3 pour un grand texte), boutons,
  liens et pastilles ; liens internes du cours. Premier passage : icône d'onglet manquante
  (`favicon.ico` en 404), corrigée par une icône intégrée à `index.html`. Limite : le contraste du
  texte courant n'est pas mesuré, seulement celui des éléments interactifs.

### S-008 · Numéro de version des fichiers calculé automatiquement
- **Statut** : faite · **Date** : 2026-11-09 · **Origine** : mise à jour de `style.css`
- **Constat** : `web/index.html` charge `style.css?v=6` et `app.js?v=5`, numéros à augmenter à
  la main ; les autres modules JavaScript n'en ont pas et peuvent rester en cache.
- **Proposition** : un petit script de déploiement qui remplace `?v=…` par l'empreinte du
  fichier ou le commit courant.
- **Bénéfices** : plus de version périmée chez les joueurs après une mise à jour.
- **Coûts** : S. Une étape de plus au déploiement (à intégrer à la commande `rsync`).
- **Rapport** : moyen.
- **Premier pas** : `bin/deploy.sh` qui écrit le commit court dans `index.html` avant `rsync`.
- **Décision** : 2026-11-09, acceptée et réalisée. `bin/deploy.sh <destination> [options rsync]`
  copie `web/`, remplace `?v=…` par le commit (suffixe `-modifie` si `web/` a des changements non
  commités), puis lance rsync. Essayé vers un dossier local ; pas encore vers le serveur.

### S-016 · Tests automatiques systématiques
- **Statut** : faite · **Date** : 2026-11-10 · **Origine** : préparation du simulateur
- **Constat** : le seul test automatique est le test de fumée (S-007), qui vérifie l'affichage.
  La logique (classement des mains, ranges, cotes, outs) n'est testée qu'à la main. Le simulateur
  ajoute un moteur de jeu (pots annexes, relances) où une erreur passe inaperçue à l'œil.
- **Proposition** : `node --test` (inclus dans Node 24, aucune dépendance) sur les modules
  JavaScript purs, dans `tests/` ; `bin/tester.sh` enchaîne tests unitaires et test de fumée ;
  règle dans `CLAUDE.md` : pas de module pur modifié sans ses tests.
- **Bénéfices** : modifications sans crainte de régression ; les exemples du cours deviennent des
  cas de test, donc cours et application restent d'accord.
- **Coûts** : S pour l'outillage et les premiers tests rétroactifs ; ensuite, une part de chaque
  développement.
- **Rapport** : élevé.
- **Premier pas** : phase 0 de [`plan-simulateur.md`](plan-simulateur.md). Vérifié : les modules
  purs actuels s'importent sous Node sans modification.
- **Décision** : 2026-11-10, acceptée avec le plan du simulateur et réalisée : `tests/` (21 tests
  rétroactifs des niveaux 1 à 3), `bin/tester.sh`, règle dans `CLAUDE.md`. Reste en option :
  intégration continue GitHub (tests unitaires seuls, le test de fumée demande Chrome).

## 4. Interface et parcours

(voir aussi S-005 et S-006)

## 5. Par fonctionnalité

### 5.1 Cours

### S-005 · Lier chaque exercice et chaque test à sa section du cours
- **Statut** : faite · **Date** : 2026-11-09 · **Origine** : création du cours HTML
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
- **Décision** : 2026-11-09, acceptée et réalisée. « Revoir dans le cours : C1.1 · C1.2 » sur les
  cartes de tests et d'exercices, en tête d'un exercice et dans le résultat d'un test. Les plages
  (« C2.1 à C2.3 ») sont développées. Le cours est chargé aussi pour les niveaux (86 Ko, une fois).

### S-006 · Grille d'auto-évaluation du cours remplie avec les résultats réels
- **Statut** : faite · **Date** : 2026-11-09 · **Origine** : création du cours HTML
- **Constat** : la page « Grille d'auto-évaluation » du cours affiche « Non commencé » partout,
  alors que l'application connaît le statut des tests des niveaux 1 et 2.
- **Proposition** : remplir les colonnes Statut et Date de validation à partir des résultats
  enregistrés ; laisser les compétences sans test automatique en saisie manuelle. Rejoint S-002.
- **Bénéfices** : la grille devient le tableau de bord de toute la progression.
- **Coûts** : M. Correspondance compétence ↔ test à établir ; cas des compétences évaluées
  hors de l'application.
- **Rapport** : moyen.
- **Premier pas** : faire S-005, qui crée la correspondance code → section.
- **Décision** : 2026-11-09, acceptée et réalisée. Statut par compétence d'après les tests qui la
  couvrent : Validé (tous validés, date de la dernière validation), Validé une fois, En cours, Non
  commencé ; la note dit de quels tests il s'agit. Les compétences sans test dans l'application ne
  changent pas. Rien n'est écrit : les données restent celles du navigateur. Vérifié avec des
  résultats simulés. Rejoint S-002 sans la remplacer : le carnet reste nécessaire pour la table.

### S-013 · Quiz préflop du niveau 2 en 2 séries de 10
- **Statut** : faite · **Date** : 2026-11-09 · **Origine** : réalisation du niveau 3
- **Constat** : depuis le niveau 3, une série ne pose pas plus de 10 questions ; les tests de 20
  situations se passent en 2 séries avec des données différentes (option `series` de `shell.js`).
  Le test 2 du niveau 2 (quiz préflop) pose encore ses 20 situations sur une seule page.
- **Proposition** : `series: 2, pass: 18` et 10 situations par série (dont 5 face à une relance),
  comme le test 3 du niveau 3.
- **Bénéfices** : même rythme dans tous les niveaux ; une page moins longue, surtout sur mobile.
- **Coûts** : S. Répartir le plan des 20 situations en deux moitiés équilibrées.
- **Rapport** : élevé.
- **Premier pas** : découper `PLAN` dans `web/niveau-2/exercises/quiz.js`.
- **Décision** : 2026-11-09, acceptée et réalisée. Deux plans de 10 (5 face à une relance chacun),
  `series: 2, pass: 18`. Au passage, les deux critères de table du niveau 2 (VPIP sur 500 mains,
  aucun limp) sont devenus des cases à cocher dans l'onglet Tests.

### 5.2 Contenu du tutoriel

### S-014 · Écrire dans le cours les règles que l'application a dû fixer
- **Statut** : faite · **Date** : 2026-11-09 · **Origine** : réalisation des niveaux 4 et 5
- **Constat** : pour corriger sans ambiguïté, l'application applique trois règles que le cours ne
  donne pas :
  1. taille de c-bet sur flop **apparié** et **monotone** : petite (1/3) dans l'application ; le
     cours ne la donne que pour sec (petite) et humide (grosse) ;
  2. **seuils des profils** (C5.4) : serré VPIP < 25 %, large > 35 % ; passif AF < 1,5,
     agressif > 2,5 ;
  3. **catégories de la range** à la river (test du niveau 5) : forte = deux paires ou mieux,
     moyenne = une paire, bluff = moins qu'une paire.
- **Proposition** : les écrire dans le doc (C4.3 ou C4.4, C5.4, C5.1), ou corriger l'application si
  le cours dit autre chose, puis `/publier-tutoriel`.
- **Bénéfices** : le cours et les tests disent la même chose ; le joueur trouve la règle dans le cours.
- **Coûts** : S. Trois paragraphes ou lignes de tableau dans le doc.
- **Rapport** : élevé.
- **Premier pas** : valider ou corriger les trois règles (question de contenu).
- **Décision** : 2026-11-09, acceptée. Ajouts dans le doc : en C4.3, c-bet petite sur flops
  appariés et monotones ; en C5.1, les trois catégories de range à la river ; en C5.4, les repères
  chiffrés des profils. L'application renvoie désormais à ces passages du cours. Cours et PDF
  republiés.

### S-010 · Corriger l'écart de VPIP du test du niveau 2
- **Statut** : faite · **Date** : 2026-11-09 · **Origine** : réalisation de S-003
- **Constat** : le doc donne deux seuils pour le même test. L'escalier du mode d'emploi (repris de
  l'ancien widget) dit « VPIP 18 à 26 % sur 500 mains » ; le test de passage du niveau 2 dit
  « entre 12 et 20 % », comme l'application (`web/niveau-2/niveau.js`, `testsNote`).
- **Proposition** : choisir la bonne valeur et corriger l'autre dans le doc, puis `/publier-tutoriel`.
- **Bénéfices** : un objectif clair pour le joueur ; plus de contradiction entre cours et application.
- **Coûts** : S. Une cellule du doc (ou la note de l'application).
- **Rapport** : élevé.
- **Premier pas** : décider du seuil (question de contenu, pas de code).
- **Décision** : 2026-11-09, acceptée. Seuil retenu : **12 à 20 %**, celui du test de passage du
  niveau 2 et de l'application ; l'escalier du mode d'emploi (18 à 26 %, repris de l'ancien
  graphique) est corrigé dans le doc. Cours et PDF republiés.

### S-011 · Ajouter C3.7 à la grille d'auto-évaluation
- **Statut** : proposée · **Date** : 2026-11-09 · **Origine** : réalisation de S-006
- **Constat** : la section C3.7 « Compter les mains qui vous battent » existe dans le niveau 3, mais
  la grille s'arrête à C3.6.
- **Proposition** : ajouter la ligne C3.7 à la grille du doc (et vérifier le carnet PDF).
- **Bénéfices** : la grille couvre toutes les compétences.
- **Coûts** : S. Une ligne du tableau.
- **Rapport** : élevé.
- **Premier pas** : ajouter la ligne dans le doc, puis `/publier-tutoriel`.
- **Décision** :

### S-015 · Simulateur de table à 6 joueurs
- **Statut** : acceptée · **Date** : 2026-11-10 · **Origine** : demande de l'utilisateur
- **Constat** : l'application entraîne chaque compétence isolément ; rien ne les met en jeu
  ensemble, dans une main complète, face à des adversaires.
- **Proposition** : un onglet « Simulateur » : l'humain et 5 bots de niveaux 2 à 6 (mélangés
  possibles) ; modes sans aide, Indice, Mentor (verdicts conforme / défendable / erreur, avec la
  règle et la section du cours) ; évaluation des décisions en fin de partie. Tout dans le
  navigateur, bots algorithmiques ; une IA ne ferait éventuellement que rédiger le commentaire.
  Idées associées, intégrées au plan : chaque règle du cours écrite comme une fonction qui renvoie
  sa raison (une seule source de vérité pour bots, indice, mentor et tests) ; donnes tirées
  d'une graine, pour rejouer une main à l'identique.
- **Bénéfices** : le joueur pratique tout le cours en situation ; retour immédiat et expliqué.
- **Coûts** : L. Moteur de jeu (pots annexes), règles postflop des niveaux 4 à 6, règles
  manquantes à écrire d'abord dans le cours.
- **Rapport** : moyen (élevé pour les phases 1 à 3).
- **Premier pas** : [`plan-simulateur.md`](plan-simulateur.md), phase 0 (S-016) puis phase 1.
- **Décision** : 2026-11-10, acceptée. Pas de serveur ; Laraskel écarté pour cette
  fonctionnalité (à reconsidérer seulement avec S-012 B ou un relais vers une IA).

## 6. Transverses

(performances, sécurité, qualité : aucune suggestion pour l'instant)

## 7. Idées pour d'autres projets

### S-009 · Générateur générique « Claude Doc → site à pages »
- **Statut** : faite en partie · **Date** : 2026-11-09 · **Origine** : création du cours HTML
- **Constat** : `tools/cours_html.py` résout des problèmes communs à tout doc publié en site :
  découpage par titres, images, liens internes, sommaire, navigation précédent/suivant.
  Il est écrit pour ce doc seulement (`PAGES`, `BLOBS`, `STAIRS`).
- **Proposition** : en tirer un outil réutilisable, avec la configuration propre à chaque doc
  dans un petit fichier.
- **Bénéfices** : publier d'autres tutoriels ou documentations sans repartir de zéro.
- **Coûts** : M. Généraliser sans alourdir ; maintenir un outil de plus.
- **Rapport** : faible pour ce projet.
- **Premier pas** : attendre un deuxième besoin réel avant de généraliser.
- **Décision** : 2026-11-09, réalisée en partie, à la demande. Tout ce qui est propre au doc est
  sorti dans `tools/cours_config.json` (pages, images, couverture, escaliers, auteur, sortie) ;
  `tools/cours_html.py` prend la configuration en second argument. Pas d'outil séparé ni de
  paquet : la recommandation d'attendre un deuxième besoin réel reste valable pour la suite.

## Archive

(vide)
