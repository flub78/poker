---
name: publier-tutoriel
description: Publie le tutoriel après une modification du Claude Doc — export HTML du doc, génération du cours de l'application, test de fumée, PDF imprimé depuis le site, nombre de pages dans le README. Ne commite pas.
argument-hint: "[sans-pdf]"
disable-model-invocation: true
---

# Publier le tutoriel

Arguments : `$ARGUMENTS` (`sans-pdf` : sauter l'étape du PDF).

Le Claude Doc « Initiation au poker — programme progressif » est la source
(https://claude.ai/artifact/Gi1w58HDF6x5atzDWz5HuB ; doc `7f332624-99fb-4d5d-a9b2-7ec0499e28e2`,
onglet `24fb8c37-e6a8`). Le site (`web/`) en est la version de référence ; le PDF est une impression
du site. Travailler dans le dossier scratchpad pour les fichiers temporaires.

## 1. Exporter le doc en HTML
- Outil `export` des Claude Docs : container `{"kind":"project","id":"7f332624-99fb-4d5d-a9b2-7ec0499e28e2"}`,
  file `24fb8c37-e6a8`, format `html`.
- L'export est trop gros pour la conversation : Claude Code l'enregistre dans un fichier de résultat.
  Le décoder : `python3 tools/decoder_export.py <fichier de résultat> <scratchpad>/export.html`.

## 2. Générer le cours
`python3 tools/cours_html.py <scratchpad>/export.html`
- Une erreur signale un changement de structure du doc : grande partie ajoutée ou renommée,
  image inconnue, lien interne sans cible, tableau d'escalier introuvable. Compléter
  `tools/cours_config.json` (pages, images, escaliers), relancer. Une nouvelle image du doc doit
  aussi exister en local (`doc/figures/` ou `doc/images/`).
- Un « Attention : graphique du doc non exportable » : un widget a été ajouté au doc. Le signaler ;
  proposer de le remplacer dans le doc par un tableau.

## 3. Vérifier le site
`node tools/verifier_web.mjs` : doit finir par « Aucun problème ». Sinon corriger avant d'aller plus loin.

## 4. Fabriquer le PDF (sauf `sans-pdf`)
- `node tools/pdf_cours.mjs` → `doc/initiation-poker-tutoriel.pdf`.
- Vérifier le texte : `pdftotext doc/initiation-poker-tutoriel.pdf - | head -80` (table des
  matières numérotée) et chercher une ou deux phrases modifiées dans le doc.
- Mettre à jour le nombre de pages dans `README.md` (`pdfinfo` donne `Pages:`).

## 5. Résumer
- `git status --short` et `git diff --stat`.
- Dire ce qui a changé dans le cours (pages touchées), le nombre de pages du PDF, le résultat du test.
- Ne pas commiter : l'utilisateur relit d'abord.
