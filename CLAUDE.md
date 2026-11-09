# Projet poker — consignes

## Le tutoriel d'initiation

- **Source** : le Claude Doc « Initiation au poker — programme progressif »
  (https://claude.ai/artifact/Gi1w58HDF6x5atzDWz5HuB). On le modifie avec les outils Claude Docs,
  jamais en éditant le PDF.
- **PDF** : `doc/initiation-poker-tutoriel.pdf` est fabriqué à partir de ce doc. Après chaque
  modification du doc :
  1. réexporter le PDF (export `pdf`, papier A4) dans un fichier temporaire ;
  2. le mettre en page : `.venv/bin/python tools/mise_en_page_pdf.py export.pdf doc/initiation-poker-tutoriel.pdf`
     (sauts de page avant les grandes parties, table des matières en page 2 avec liens, signets,
     « Page X sur N ») ; l'export des Docs ne sait pas faire de saut de page ;
  3. vérifier le texte avec `pdftotext` ;
  4. mettre à jour le nombre de pages dans `README.md` ;
  5. régénérer le cours de l'application : export `html` du même doc dans un fichier temporaire, puis
     `python3 tools/cours_html.py export.html` (écrit `web/cours/`) ; vérifier dans le navigateur
     (`bin/serve.sh`, puis `#cours`).
  Une modification qui n'apparaît pas dans le PDF et dans le cours n'est pas terminée. Première fois :
  `python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt`.

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
