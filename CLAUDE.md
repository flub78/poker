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
  4. mettre à jour le nombre de pages dans `README.md`.
  Une modification qui n'apparaît pas dans le PDF n'est pas terminée. Première fois :
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
