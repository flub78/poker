---
name: suggestions
description: Propose des améliorations à partir du contexte récent (session, dernières demandes, derniers commits), classées par rapport bénéfice/coût, et met à jour doc/suggestions.md.
argument-hint: "[portée] [type:ui,feature,perf,qualite,securite,archi,methode,systeme,doc] [max:N] [sans-fichier]"
disable-model-invocation: true
---

# Suggestions d'amélioration

Arguments : `$ARGUMENTS`

## 1. Lire les arguments
- **Portée** : un chemin, un dossier ou un nom de fonctionnalité. Rien : le contexte récent.
- **type:** : domaines retenus, séparés par des virgules. Rien : tous les domaines.
  ui = interface et parcours ; feature = fonctionnalités ; perf ; qualite = qualité et
  tests ; securite ; archi = architecture ; methode = méthodes de développement ;
  systeme = organisation du projet ; doc = documentation.
- **max:N** : nombre maximal de suggestions (défaut 5, plafond 7).
- **sans-fichier** : ne pas modifier `doc/suggestions.md`.

## 2. Rassembler le contexte (budget borné)
Sans portée :
1. La conversation en cours : demandes de l'utilisateur, décisions prises, difficultés.
2. Si la session est récente ou vide, les 10 dernières demandes de l'utilisateur, lues
   dans les transcriptions du projet (`~/.claude/projects/<dossier du projet>/*.jsonl`,
   messages de type user, les plus récents d'abord). Seulement les demandes, pas les
   réponses ni les sorties d'outils.
3. `git log --oneline -20` et `git status`.
4. `CLAUDE.md`, le README principal, `doc/suggestions.md`.
Avec une portée : les mêmes sources, plus les fichiers de la portée et leurs voisins
directs (imports, README du dossier). Pas d'exploration au-delà.

## 3. Analyser à trois niveaux
1. **Détail** : ce qui a été touché récemment.
2. **Fonctionnalité** : le parcours de l'utilisateur dont ce détail fait partie.
3. **Système** : l'organisation du projet sert-elle son objectif ?
   - Quelque chose est-il maintenu en double, à la main ?
   - Un artefact ou une étape a-t-il perdu sa raison d'être ?
   - Les demandes récentes renforcent-elles une organisation à remettre en cause ?
   - L'utilisateur répète-t-il une tâche qu'un outil ferait ?
Ne pas faire de revue ligne à ligne : signaler un problème de code seulement s'il est
déjà visible dans le contexte, et renvoyer vers `/code-review`.

## 4. Filtrer et classer
- Écarter les idées déjà présentes dans `doc/suggestions.md`, sauf fait nouveau (le dire,
  et compléter la fiche existante).
- Pour chaque idée : constat, proposition, bénéfices, coûts (S/M/L, risques, ce qu'on
  perd), rapport bénéfice/coût, premier pas.
- Classer par rapport bénéfice/coût. Garder au moins une idée système si elle existe,
  même coûteuse.

## 5. Restituer
- Dans la réponse : un tableau court (ID, domaine, idée, bénéfice, coût, rapport), puis
  les fiches des 3 premières.
- Sauf `sans-fichier` : ajouter les nouvelles fiches à leur section dans
  `doc/suggestions.md`, mettre à jour l'index et la date. Créer le fichier avec sa
  structure s'il n'existe pas.
- Ne rien implémenter. Terminer en demandant quelles suggestions retenir.
