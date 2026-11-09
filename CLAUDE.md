# Projet poker — consignes

## Le tutoriel d'initiation

- **Source** : le Claude Doc « Initiation au poker — programme progressif »
  (https://claude.ai/artifact/Gi1w58HDF6x5atzDWz5HuB). On le modifie avec les outils Claude Docs,
  jamais en éditant le PDF.
- **Site et PDF** : le cours de l'application (`web/`, bouton « Cours ») est la version de
  référence ; `doc/initiation-poker-tutoriel.pdf` en est une impression. Après chaque modification
  du doc, lancer `/publier-tutoriel`, qui enchaîne :
  1. export `html` du doc, décodé par `python3 tools/decoder_export.py <résultat> export.html` ;
  2. `python3 tools/cours_html.py export.html` (écrit `web/cours/`, configuration dans
     `tools/cours_config.json`) ;
  3. `node tools/verifier_web.mjs` (test de fumée : erreurs, fichiers manquants, contraste) ;
  4. `node tools/pdf_cours.mjs` (PDF imprimé depuis `#cours/imprimer` : sauts de page, table des
     matières numérotée avec liens, signets, « Page X sur N »), vérification avec `pdftotext` ;
  5. nombre de pages du PDF dans `README.md`.
  Une modification qui n'apparaît pas dans le cours et dans le PDF n'est pas terminée.
- **Pas de graphique (widget) dans le doc** : l'export HTML ne les contient pas. Utiliser un
  tableau ; le générateur sait dessiner un tableau en escalier (`escaliers` dans la configuration).
- **Déploiement** : `bin/deploy.sh <destination rsync>` (numéro de version des fichiers calculé
  depuis le commit).

## Principes de rédaction du tutoriel

1. **Étymologie systématique.** Chaque terme technique a son origine expliquée :
   - dans le **glossaire** en fin de document (colonne « Origine ») ;
   - **et** à sa **première utilisation** dans le texte, entre parenthèses.
2. **Sigles.** Développer chaque sigle dans sa langue d'origine, puis le traduire en français.
   Exemple : VPIP (voluntarily put money in pot, « argent mis volontairement au pot »).
3. **Termes anglais.** Donner le sens littéral du mot anglais et, quand c'est utile, sa racine
   (latin, ancien français…). Exemple : check, « arrêt », de l'ancien français eschec.
4. **Honnêteté.** Quand l'origine est incertaine ou légendaire (nuts, river, cut-off), le dire
   explicitement plutôt que présenter une légende comme un fait.
5. **Nouveau terme = nouvelle ligne de glossaire.** Tout terme ajouté au texte entre dans le
   glossaire (Terme, Sens, Origine, Défini en), dans l'ordre alphabétique.
6. Texte en français, phrases courtes.

## Suggestions d'amélioration

Une petite part de l'effort sert à repérer des améliorations. On les propose, on ne les
applique jamais sans accord.

### Au fil de l'eau (à chaque demande d'implémentation)
- En fin de réponse, 0 à 3 suggestions au plus, seulement si elles valent l'attention.
  Aucune suggestion vaut mieux qu'une suggestion faible.
- Ne pas explorer exprès : partir de ce qui a déjà été lu pour la tâche.
- Raisonner à trois niveaux :
  1. **Détail** : le code ou l'écran touché.
  2. **Fonctionnalité** : le parcours de l'utilisateur dont ce détail fait partie.
  3. **Système** : l'organisation du projet sert-elle encore son objectif ?
     Questions à se poser :
     - Quelque chose est-il maintenu en double, à la main ?
     - Un artefact (document, export, outil, étape) a-t-il perdu sa raison d'être ?
     - L'utilisateur fait-il un détour qu'une petite modification supprimerait ?
     - La demande en cours renforce-t-elle une organisation qu'il faudrait remettre en cause ?
- Avant de proposer, consulter `doc/suggestions.md` : ne pas reproposer une idée refusée,
  sauf si un fait nouveau change la donne (le dire).
- Format en fin de réponse, une ligne par suggestion :
  **[domaine] idée** : bénéfice ; coût S/M/L ; premier pas.

### Domaines
Système et organisation du projet · architecture · méthodes de développement ·
interface et parcours · fonctionnalités (de préférence les extensions qui demandent peu
de changements) · performances · sécurité · qualité et tests · documentation.

### Fichier de suggestions : `doc/suggestions.md`
- Toute suggestion faite et non traitée y entre, avec ses bénéfices et ses coûts.
- Le garder organisé (index, sections par thème, une fiche par suggestion) : voir la
  structure en tête du fichier.
- Ne jamais supprimer une suggestion coûteuse, refusée ou reportée : changer son
  statut et noter la raison. Elle peut inspirer un projet futur.
- Une suggestion acceptée et réalisée passe au statut « faite », avec le commit.

### Commandes
- `/suggestions [portée] [type]` : suggestions à partir du contexte récent.
- `/audit-suggestions [sources] [type]` : relit objectifs, PRD et notes de conception.
- `/review-architecture`, `/review-design`, `/review-dev-methods` : revues spécialisées, pas
  encore créées (voir `strategie_suggestions.md`, partie 8).
Ces commandes ne descendent pas au niveau du code : c'est le rôle des revues de code.
