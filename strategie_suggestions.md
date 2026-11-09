# Stratégie de suggestions d'amélioration

Ce document a deux usages :
- garder la trace d'une discussion sur un manque de recul de l'assistant de code ;
- fournir des consignes et des commandes à reprendre dans d'autres projets.

Les parties 5 à 8 se copient telles quelles. Le reste explique pourquoi.

---

## 1. Le cas d'origine : deux supports maintenus en parallèle

Le projet visait un environnement progressif d'apprentissage du poker. Il s'est construit en trois temps :

1. **Des notes, puis un tutoriel PDF.** Rédiger un tutoriel est une bonne façon de structurer des notes d'apprentissage. On y voit clairement les notions à maîtriser, et on vérifie en écrivant qu'on les comprend vraiment.
2. **Des pages HTML.** Il fallait ensuite un support dynamique pour les exercices et les tests.
3. **La fusion.** Dès lors que l'utilisateur passe par un site web, maintenir un PDF à part n'a plus grand intérêt. Le cours a donc rejoint les exercices dans le même site.

Pendant plusieurs jours, les deux supports ont pourtant été maintenus séparément. L'assistant connaissait l'objectif du projet et n'a jamais proposé de les regrouper.

Pire, à la fin de la fusion, il a ajouté dans `CLAUDE.md` une étape qui rendait officielle une triple chaîne : le doc source, puis le PDF, puis le HTML. Il n'a pas posé la question évidente : le PDF sert-il encore ?

## 2. Pourquoi la suggestion n'est pas venue

- **L'assistant reste dans le périmètre.** Ses consignes par défaut le poussent à faire ce qui est demandé, sans élargir le sujet. C'est utile la plupart du temps, mais aucun moment n'est prévu pour prendre du recul. À chaque demande, il cherche comment la réaliser, pas si elle sert encore l'objectif.
- **Il n'a pas de vue continue sur le projet.** Chaque session repart de `CLAUDE.md`, du code et de l'historique git. Une dérive qui s'étale sur plusieurs sessions n'est vue par aucune comme un coût qui grandit.
- **Le signal était pourtant fort.** Une duplication maintenue à la main est un cas typique, que l'on repère facilement quand on regarde le projet dans son ensemble.

**Hypothèse :** avec une consigne explicite qui demande de remonter du détail au système, la suggestion aurait probablement été faite. L'assistant ne peut pas le prouver par introspection, car connaître la réponse après coup biaise son jugement. D'où le protocole de la partie 9.

## 3. Principes de la stratégie

1. **Proposer, jamais appliquer sans accord.** Une suggestion est une information, pas une modification.
2. **Analyser à trois niveaux.**
   - **Détail** : le code ou l'écran touché.
   - **Fonctionnalité** : le parcours de l'utilisateur dont ce détail fait partie.
   - **Système** : l'organisation du projet sert-elle encore son objectif ?
3. **Classer par rapport bénéfice / coût.** Une suggestion coûteuse n'est jamais jetée. Elle est notée, avec sa raison, et peut inspirer un projet futur.
4. **Tenir un fichier de suggestions.** C'est la mémoire entre les sessions. Il évite de reproposer une idée refusée et garde les idées coûteuses.
5. **Dépenser peu de tokens, au bon moment.** Pas d'audit global à chaque demande.
6. **Laisser le code aux revues de code.** Les audits de suggestions restent au niveau des objectifs, de la conception, de l'architecture et des méthodes. Le code relève des revues de code (`/code-review`, `/security-review`).

## 4. Quatre niveaux d'effort

| Niveau | Déclencheur | Coût en tokens | Sources lues | Ce qu'il produit |
|---|---|---|---|---|
| **Au fil de l'eau** | chaque demande d'implémentation | quasi nul | seulement ce qui a déjà été lu pour la tâche | 0 à 3 suggestions en fin de réponse |
| **`/suggestions`** | fin d'une fonctionnalité, avant une fusion, ou sur demande | faible à moyen | contexte de la session, demandes récentes, `git log`, fichier de suggestions | 3 à 7 suggestions, fichier mis à jour |
| **`/audit-suggestions`** | début de phase, après un changement d'objectif, environ une fois par mois | moyen | objectifs, PRD, notes de conception, README, feuille de route, ADR | revue complète du fichier, nouvelles suggestions par section |
| **Revues spécialisées** (`/review-architecture`, `/review-design`, `/review-dev-methods`) | ponctuel, sur demande | moyen à élevé | selon la revue (partie 8) | un rapport et des suggestions dans la section concernée |

**Pourquoi pas une analyse en arrière-plan à chaque réponse ?** Un hook déclenché après chaque réponse coûterait cher. Il produirait aussi des résultats que personne ne lit. Le niveau « au fil de l'eau » réutilise le contexte déjà chargé : il ne coûte presque rien et attrape déjà les gros signaux. Les commandes ne servent que quand on a le temps de lire.

---

## 5. Consignes à ajouter dans le `CLAUDE.md` d'un projet

````markdown
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
- `/review-architecture`, `/review-design`, `/review-dev-methods` : revues spécialisées.
Ces commandes ne descendent pas au niveau du code : c'est le rôle des revues de code.
````

---

## 6. Le fichier de suggestions

### Emplacement

`doc/suggestions.md`, versionné avec le projet. On y voit l'évolution des idées dans l'historique git.

### Structure

````markdown
# Suggestions d'amélioration

Mis à jour le AAAA-MM-JJ. Fiches classées par section ; index trié par rapport
bénéfice/coût. Statuts : proposée · acceptée · en cours · faite · reportée · refusée.

## Index

| ID | Section | Suggestion | Bénéfice | Coût | Rapport | Statut |
|---|---|---|---|---|---|---|
| S-007 | Système | Remplacer le PDF par une version imprimable du site | élevé | S | élevé | proposée |

## 1. Système et organisation du projet
Artefacts, chaînes de fabrication, doublons, répartition des rôles entre outils.

## 2. Architecture
Découpage en modules, flux de données, dépendances, choix techniques.

## 3. Méthodes de développement
Workflow git, tests, CI, revues, documentation, usage de l'assistant.

## 4. Interface et parcours
Cohérence, accessibilité, parcours naturels, mobile.

## 5. Par fonctionnalité
### 5.1 <Fonctionnalité A>
### 5.2 <Fonctionnalité B>

## 6. Transverses
Performances, sécurité, qualité, documentation.

## 7. Idées pour d'autres projets
Suggestions hors du périmètre actuel, gardées pour l'inspiration.

## Archive
Suggestions faites ou refusées depuis plus de 3 mois (fiche complète, statut final).
````

### Une fiche

````markdown
### S-007 · Remplacer le PDF par une version imprimable du site
- **Statut** : proposée · **Date** : 2026-11-09 · **Origine** : au fil de l'eau
- **Constat** : le tutoriel est produit deux fois (PDF et cours HTML) depuis le même doc ;
  chaque modification demande deux exports et deux vérifications.
- **Proposition** : faire du site la seule version de référence ; produire le PDF par
  l'impression du navigateur, avec une feuille de style d'impression.
- **Bénéfices** : une seule chaîne de fabrication ; plus d'écart possible entre les
  versions ; moins de temps à chaque modification.
- **Coûts** : S. Feuille d'impression (sauts de page, table des matières) ; retirer
  le script de mise en page du PDF. Risque : rendu PDF un peu moins soigné.
- **Rapport** : élevé.
- **Premier pas** : imprimer une page du cours avec une feuille `@media print` et
  comparer avec le PDF actuel.
- **Décision** : (date, choix, raison)
````

### Règles de tenue

- **Identifiants stables** (`S-001`, `S-002`…), jamais réutilisés. Les fiches se citent entre elles.
- **Bénéfices et coûts toujours décrits**, pas seulement notés. Le coût S/M/L se lit ainsi : S, moins d'une session ; M, quelques sessions ; L, un chantier.
- **Le rapport bénéfice/coût** classe l'index : élevé, moyen ou faible.
- **Pas de doublon.** Si une idée revient, on complète la fiche existante (« revue le … : toujours pertinente parce que … »).
- **Une suggestion refusée garde sa raison.** On ne la repropose que si un fait nouveau change la donne.
- **À chaque passage** de `/suggestions` ou d'un audit, mettre à jour la date en tête et l'index.

---

## 7. Les commandes `/suggestions` et `/audit-suggestions`

Dans Claude Code, une commande personnalisée est un skill : un fichier `.claude/skills/<nom>/SKILL.md` dans le projet, ou `~/.claude/skills/<nom>/SKILL.md` pour tous les projets. Ce qui suit `/nom` arrive dans `$ARGUMENTS`. Avec `disable-model-invocation: true`, seul l'utilisateur lance la commande.

### 7.1 `/suggestions`

Usage :

| Commande | Effet |
|---|---|
| `/suggestions` | contexte de la session et demandes récentes, tous domaines |
| `/suggestions web/js/cours.js` | portée restreinte à un fichier, un dossier ou une fonctionnalité |
| `/suggestions type:ui,perf` | domaines restreints |
| `/suggestions cours type:systeme max:3` | combinaison des deux, nombre de suggestions limité |
| `/suggestions sans-fichier` | répondre sans mettre à jour `doc/suggestions.md` |

Fichier `.claude/skills/suggestions/SKILL.md` :

````markdown
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
````

### 7.2 `/audit-suggestions`

Cette commande prend du recul : elle relit les documents qui disent pourquoi le projet existe et comment il est conçu. Elle ne lit pas le code. Elle s'appuie seulement sur la structure des dossiers, pour vérifier que ce qui est écrit correspond à ce qui existe.

Usage :

| Commande | Effet |
|---|---|
| `/audit-suggestions` | toutes les sources de conception trouvées, tous domaines |
| `/audit-suggestions sources:doc/prd,doc/adr` | sources restreintes |
| `/audit-suggestions type:archi,methode` | domaines restreints |
| `/audit-suggestions revue` | relit aussi tout le fichier de suggestions (statuts, doublons, priorités) |

Fichier `.claude/skills/audit-suggestions/SKILL.md` :

````markdown
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
````

---

## 8. Revues spécialisées à créer

Ces revues complètent `/code-review` : chacune regarde un niveau que la revue de code ne couvre pas. Toutes écrivent leurs conclusions comme des fiches dans `doc/suggestions.md`, dans la section concernée.

| Commande | Question centrale | Sources | Section du fichier |
|---|---|---|---|
| `/review-architecture` | Le découpage tient-il face à la croissance prévue ? | arborescence, points d'entrée, imports entre modules (graphe, pas le contenu), docs d'architecture, ADR | Architecture |
| `/review-design` | Le produit est-il cohérent et naturel à utiliser ? | PRD, maquettes, captures ou parcours dans l'application, textes de l'interface | Interface et parcours, Par fonctionnalité |
| `/review-dev-methods` | La façon de travailler est-elle efficace et sûre ? | historique git, CI, scripts, `CLAUDE.md`, README, tests (structure et couverture, pas le contenu) | Méthodes de développement |

### `/review-architecture`
- **Vérifie** : responsabilités des modules, dépendances circulaires ou inversées, couplage, points de configuration, doublons de logique entre modules, cohérence avec les décisions documentées.
- **Se demande** : que se passe-t-il quand on ajoute un niveau, un utilisateur, une source de données ? Où faudrait-il toucher à plusieurs endroits ?
- **Produit** : un schéma court de l'existant, les écarts avec l'architecture visée, des fiches.

### `/review-design`
- **Vérifie** : cohérence des écrans (vocabulaire, boutons, navigation), parcours principaux de bout en bout, accessibilité (contraste, clavier, mobile), états vides et erreurs, cohérence entre documentation et produit.
- **Se demande** : l'utilisateur doit-il aller et venir entre deux supports ? Une étape du parcours n'a-t-elle aucune raison d'être ?
- **Produit** : les parcours testés, les frictions classées par gravité, des fiches. Avec un navigateur disponible, s'appuyer sur des captures et des mesures (par exemple le contraste calculé), pas sur la seule lecture.

### `/review-dev-methods`
- **Vérifie** : taille et rythme des commits, stratégie de branches, tests automatiques et leur exécution, étapes manuelles répétées, documentation à jour, consignes de `CLAUDE.md` encore valides, usage de l'assistant (demandes répétées qui mériteraient un script ou une commande).
- **Se demande** : quelle tâche fait-on à la main à chaque modification ? Quelle erreur est déjà arrivée deux fois ?
- **Produit** : les irritants classés par fréquence × coût, des fiches.

---

## 9. Protocole pour mesurer l'effet des consignes

**But :** vérifier que les consignes de la partie 5 font apparaître une suggestion qui manquait, sans noyer l'utilisateur sous les suggestions faibles.

1. **Choisir des points de test.** Prendre des commits où une suggestion connue était déjà pertinente. Dans le cas d'origine : les commits des premières pages HTML, avant la fusion. Pour chacun : `git worktree add ../projet-test-X <commit>`.
2. **Neutraliser les fuites.**
   - Utiliser le `CLAUDE.md` de ce commit.
   - Vider ou désactiver la mémoire persistante.
   - Travailler dans un dossier sans transcription liée.
   - Ne pas faire résumer le contexte par un assistant qui connaît déjà la réponse.
3. **Rejouer les demandes réelles de l'époque**, tirées des transcriptions, sans les reformuler.
4. **Comparer deux conditions.**
   - Condition A : `CLAUDE.md` d'origine.
   - Condition B : le même fichier, avec la section « Suggestions d'amélioration ».
5. **Répéter.** Au moins 5 exécutions par condition et par point, car les réponses varient. On peut automatiser avec `claude -p "<demande>"`.
6. **Fixer le critère avant de regarder.** Exemple : « propose de réunir cours et exercices sur le site, ou remet en cause la maintenance du PDF ». Mesurer aussi le nombre total de suggestions et la part jugée utile.
7. **Juger à l'aveugle**, réponses mélangées, par l'utilisateur ou par un autre assistant qui ne connaît pas la condition.

Le résultat utile est l'écart de détection entre A et B, rapporté au bruit ajouté.

---

## 10. Mise en place dans un projet

1. Copier la section de la partie 5 dans le `CLAUDE.md` du projet.
2. Créer `doc/suggestions.md` avec la structure de la partie 6.
3. Créer `.claude/skills/suggestions/SKILL.md` et `.claude/skills/audit-suggestions/SKILL.md` (partie 7). Pour les avoir dans tous les projets, les mettre plutôt dans `~/.claude/skills/`.
4. Créer au besoin les trois revues de la partie 8, sur le même modèle.
5. Après deux ou trois semaines, relire le fichier de suggestions. Si les suggestions faites au fil de l'eau sont surtout du bruit, durcir le seuil (« 0 à 1 suggestion ») plutôt que supprimer la consigne.
