---
name: audit-suggestions
description: Audit de recul. Relit objectifs, PRD, notes de conception, ADR et feuille de route, les confronte à l'état du projet, et réorganise doc/suggestions.md. Ne descend pas au niveau du code.
argument-hint: "[sources:chemin,…] [type:…] [revue]"
disable-model-invocation: true
---

# Audit de suggestions

Arguments : `$ARGUMENTS`

## 1. Sources
Par défaut, chercher et lire : `CLAUDE.md`, les README, et les dossiers ou fichiers dont
le nom évoque objectifs, PRD, spécifications, conception, architecture, ADR, feuille de
route, notes, décisions (`doc/`, `docs/`, `design/`, `adr/`, `prd/`, `ROADMAP*`…).
Avec `sources:`, se limiter aux chemins donnés. Toujours lire `doc/suggestions.md`.
Pour l'état réel du projet : arborescence (2 niveaux), `git log --oneline -50`, liste
des branches. **Ne pas lire le code source** : la qualité du code relève des revues
de code (`/code-review`, `/security-review`).

## 2. Questions à poser
**Objectifs**
- Les objectifs écrits sont-ils toujours ceux que les derniers commits poursuivent ?
- Un objectif est-il atteint, abandonné ou contredit sans que la documentation le dise ?
**Système et organisation**
- Quels artefacts existent (documents, exports, outils, applications) ? Lesquels sont
  maintenus en double ? Lesquels n'ont plus d'utilisateur ?
- La chaîne de fabrication a-t-elle des étapes manuelles qu'on pourrait supprimer ?
**Conception et architecture**
- Les choix documentés tiennent-ils face à ce qui a été construit ?
- Une décision prise pour une raison qui a disparu mérite-t-elle d'être revue ?
**Fonctionnalités**
- Quelles extensions à faible coût découlent naturellement de l'existant ?
- Quelles fonctionnalités promises manquent, et lesquelles ne valent plus la peine ?
**Méthodes**
- Le workflow (branches, tests, revues, documentation) est-il adapté à la taille du projet ?

## 3. Produire
- Des fiches complètes (constat, proposition, bénéfices, coûts, rapport, premier pas),
  rangées dans les sections de `doc/suggestions.md`.
- Avec `revue` : relire toutes les fiches ; fusionner les doublons ; passer en « faite »
  ce qui est réalisé (citer le commit) ; signaler les suggestions reportées dont la
  condition est maintenant remplie ; reclasser l'index.
- Dans la réponse : les 5 suggestions au meilleur rapport, les 2 plus ambitieuses, et
  les écarts entre objectifs et réalité. Ne rien implémenter.
