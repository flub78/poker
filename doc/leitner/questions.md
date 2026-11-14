# Questions des Réflexes (Leitner) — niveaux 1 à 6

Banque de questions de mémorisation tirées du cours (`web/cours/`). Brouillon de travail, à traduire
au format d'échange de mentor quand il sera défini ; la banque sera ensuite éditée dans mentor seulement.

**But du module** : entraîner les réflexes, les réponses immédiates. Une question = un fait, une
image à lire, une décision. Pas de liste à réciter.

## Conventions

- **Types** (ceux du MVP Leitner de mentor) :
  - **VF** : vrai / faux ;
  - **QCM** : une bonne réponse parmi les choix donnés entre crochets ;
  - **NUM** : valeur numérique, avec tolérance éventuelle (± entre parenthèses) ;
  - **AUTO** : auto-évaluation (l'étudiant compare à la réponse de référence).
- **Cartes** : code rang + couleur, celui des fichiers `web/cartes/` : rang `A K Q J T 9 … 2`
  (T = 10), couleur `S` pique, `H` cœur, `D` carreau, `C` trèfle. Exemple : `AS KH` = As de pique,
  Roi de cœur. Ces codes deviendront des images de cartes.
- **Colonne Cartes** : `Main` = vos deux cartes ; `Tableau` = cartes communes ; `A` / `B` = deux
  mains de 5 cartes à comparer ; `Carte` = carte candidate dont parle la question (un out, par
  exemple), encadrée sur l'image. Vide : question sans image.
- **Colonne Image** : description de l'image à afficher, tirée de la colonne Cartes. Le
  « bandeau » est un court texte affiché sur l'image (position, action adverse, mise, rue).
  Vide : question sans image.
- **Thème** = le niveau ; la colonne **Section** renvoie au cours.
- **ID** = la `reference` de la question dans mentor : stable, jamais montrée à l'étudiant ; ne pas
  la changer (mentor met à jour la question, poker garde la progression).
- **QCM** : les choix s'affichent dans l'ordre des crochets (colonne `ordre`, sans mélange).
- Les réponses calculables (noms de mains, duels, nuts, grille préflop, outs) ont été vérifiées
  avec les modules de l'application (`niveau-1/evaluator.js`, `analysis.js`, `niveau-2/strategy.js`,
  `niveau-3/draws.js`) le 11/11/2026.

---

## Niveau 1 — Les règles

### Classement des mains (C1.3) — sans image

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N1-01 | VF | | | Un carré bat un full. | Vrai | Carré 3e, full 4e. | C1.3 |
| N1-02 | VF | | | Une couleur bat une quinte. | Vrai | Couleur 5e, quinte 6e. | C1.3 |
| N1-03 | VF | | | Une couleur bat un full. | Faux | Le full (4e) bat la couleur (5e). | C1.3 |
| N1-04 | VF | | | Un brelan bat une double paire. | Vrai | Brelan 7e, double paire 8e. | C1.3 |
| N1-05 | VF | | | Une double paire bat un brelan. | Faux | C'est l'inverse. | C1.3 |
| N1-06 | VF | | | Une quinte bat un brelan. | Vrai | Quinte 6e, brelan 7e. | C1.3 |
| N1-07 | VF | | | Une quinte flush bat un carré. | Vrai | Quinte flush 2e, carré 3e. | C1.3 |
| N1-08 | QCM | | | Laquelle de ces trois combinaisons est la plus forte ? [Full · Couleur · Quinte] | Full | Full > couleur > quinte. | C1.3 |
| N1-09 | QCM | | | Laquelle de ces trois combinaisons est la plus faible ? [Brelan · Quinte · Double paire] | Double paire | | C1.3 |
| N1-10 | VF | | | L'As peut servir de carte basse dans la quinte A-2-3-4-5. | Vrai | La « quinte basse ». | C1.3 |
| N1-11 | VF | | | Q-K-A-2-3 est une quinte, l'As faisant le lien entre le Roi et le 2. | Faux | La quinte ne « tourne » pas autour de l'As. | C1.3 |
| N1-12 | VF | | | Deux joueurs ont la même combinaison : la carte annexe la plus haute (le kicker) les départage. | Vrai | La carte annexe la plus haute gagne. | C1.3 |

### Nommer une main (C1.3) — une image de 5 cartes

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N1-13 | QCM | `9H 8H 7H 6H 5H` | Une main de 5 cartes : 9♥ 8♥ 7♥ 6♥ 5♥. | Quelle combinaison forment ces 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Quinte flush | Quinte flush (hauteur 9). Suite et même couleur. | C1.3 |
| N1-14 | QCM | `AD JD 8D 5D 2D` | Une main de 5 cartes : A♦ J♦ 8♦ 5♦ 2♦. | Quelle combinaison forment ces 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Couleur | Couleur (à l'As). | C1.3 |
| N1-15 | QCM | `TS 9H 8D 7C 6S` | Une main de 5 cartes : 10♠ 9♥ 8♦ 7♣ 6♠. | Quelle combinaison forment ces 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Quinte | Quinte (hauteur 10). | C1.3 |
| N1-16 | QCM | `JS JH 5D 5C AS` | Une main de 5 cartes : J♠ J♥ 5♦ 5♣ A♠. | Quelle combinaison forment ces 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Double paire | Double paire (valets et 5). | C1.3 |
| N1-17 | QCM | `8S 8H 8D KC 3S` | Une main de 5 cartes : 8♠ 8♥ 8♦ K♣ 3♠. | Quelle combinaison forment ces 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Brelan | Brelan de 8. | C1.3 |
| N1-18 | QCM | `QS QH QD 7C 7D` | Une main de 5 cartes : Q♠ Q♥ Q♦ 7♣ 7♦. | Quelle combinaison forment ces 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Full | Full (dames par les 7). Brelan + paire. | C1.3 |
| N1-19 | QCM | `AS 2H 3D 4C 5S` | Une main de 5 cartes : A♠ 2♥ 3♦ 4♣ 5♠. | Quelle combinaison forment ces 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Quinte | Quinte (hauteur 5). L'As compte pour 1. | C1.3 |
| N1-20 | QCM | `QS KH AD 2C 3S` | Une main de 5 cartes : Q♠ K♥ A♦ 2♣ 3♠. | Quelle combinaison forment ces 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Carte haute | Carte haute (As). Pas de quinte qui tourne. | C1.3 |
| N1-21 | QCM | `AS KS QS JS TS` | Une main de 5 cartes : A♠ K♠ Q♠ J♠ 10♠. | Quelle combinaison forment ces 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Quinte flush royale | | C1.3 |
| N1-22 | QCM | `2H 2D 2S 2C 9H` | Une main de 5 cartes : 2♥ 2♦ 2♠ 2♣ 9♥. | Quelle combinaison forment ces 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Carré | Carré de 2. | C1.3 |

### Laquelle gagne ? (C1.3) — deux mains de 5 cartes

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N1-23 | QCM | A `KS KH KD KC 4H` · B `QS QH QD 7C 7D` | Deux mains côte à côte, étiquetées A et B : main A : K♠ K♥ K♦ K♣ 4♥ ; main B : Q♠ Q♥ Q♦ 7♣ 7♦. | Ces deux mains vont à l'abattage. Laquelle gagne ? [A · B · Partage] | A | Carré > full. | C1.3 |
| N1-24 | QCM | A `TS 9H 8D 7C 6S` · B `AH KH 9H 5H 2H` | Deux mains côte à côte, étiquetées A et B : main A : 10♠ 9♥ 8♦ 7♣ 6♠ ; main B : A♥ K♥ 9♥ 5♥ 2♥. | Ces deux mains vont à l'abattage. Laquelle gagne ? [A · B · Partage] | B | Couleur > quinte. | C1.3 |
| N1-25 | QCM | A `8S 8H 8D KC 3S` · B `AS AH KD KC QS` | Deux mains côte à côte, étiquetées A et B : main A : 8♠ 8♥ 8♦ K♣ 3♠ ; main B : A♠ A♥ K♦ K♣ Q♠. | Ces deux mains vont à l'abattage. Laquelle gagne ? [A · B · Partage] | A | Brelan > double paire. | C1.3 |
| N1-26 | QCM | A `AS AH KD 7C 3S` · B `AD AC QH JS TD` | Deux mains côte à côte, étiquetées A et B : main A : A♠ A♥ K♦ 7♣ 3♠ ; main B : A♦ A♣ Q♥ J♠ 10♦. | Ces deux mains vont à l'abattage. Laquelle gagne ? [A · B · Partage] | A | Même paire : kicker Roi > Dame. | C1.3 |
| N1-27 | QCM | A `6S 5H 4D 3C 2S` · B `AS 2H 3D 4C 5S` | Deux mains côte à côte, étiquetées A et B : main A : 6♠ 5♥ 4♦ 3♣ 2♠ ; main B : A♠ 2♥ 3♦ 4♣ 5♠. | Ces deux mains vont à l'abattage. Laquelle gagne ? [A · B · Partage] | A | Quinte au 6 > quinte au 5. | C1.3 |
| N1-28 | QCM | A `AH KH 9H 5H 2H` · B `AD QD JD TD 8D` | Deux mains côte à côte, étiquetées A et B : main A : A♥ K♥ 9♥ 5♥ 2♥ ; main B : A♦ Q♦ J♦ 10♦ 8♦. | Ces deux mains vont à l'abattage. Laquelle gagne ? [A · B · Partage] | A | Couleurs : on compare carte par carte, Roi > Dame. | C1.3 |
| N1-29 | QCM | A `7S 7H 7D KC KS` · B `6S 6H 6D AC AS` | Deux mains côte à côte, étiquetées A et B : main A : 7♠ 7♥ 7♦ K♣ K♠ ; main B : 6♠ 6♥ 6♦ A♣ A♠. | Ces deux mains vont à l'abattage. Laquelle gagne ? [A · B · Partage] | A | Full : le brelan compte d'abord. | C1.3 |
| N1-30 | QCM | A `KS KH QD QC 2S` · B `KD KC JH JS AD` | Deux mains côte à côte, étiquetées A et B : main A : K♠ K♥ Q♦ Q♣ 2♠ ; main B : K♦ K♣ J♥ J♠ A♦. | Ces deux mains vont à l'abattage. Laquelle gagne ? [A · B · Partage] | A | Deuxième paire Dame > Valet ; le kicker ne joue pas. | C1.3 |

### Meilleure main avec le tableau (C1.4)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N1-31 | QCM | Main `QC QD` · Tableau `KH QH 7H 4C 2S` | Vos deux cartes : Q♣ Q♦ ; tableau de 5 cartes (river) : K♥ Q♥ 7♥ 4♣ 2♠. | Avec ce tableau, quelle est votre meilleure main de 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Brelan | Brelan de dames. | C1.4 |
| N1-32 | QCM | Main `9H 3H` · Tableau `KH QH 7H 4C 2S` | Vos deux cartes : 9♥ 3♥ ; tableau de 5 cartes (river) : K♥ Q♥ 7♥ 4♣ 2♠. | Avec ce tableau, quelle est votre meilleure main de 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Couleur | Couleur (au Roi). Deux cœurs + trois au tableau. | C1.4 |
| N1-33 | QCM | Main `AS KH` · Tableau `QD JC TS 4H 2S` | Vos deux cartes : A♠ K♥ ; tableau de 5 cartes (river) : Q♦ J♣ 10♠ 4♥ 2♠. | Avec ce tableau, quelle est votre meilleure main de 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Quinte | Quinte à l'As. A K Q J 10. | C1.1 |
| N1-34 | QCM | Main `JS TS` · Tableau `QH 9D 2C 8S 3D` | Vos deux cartes : J♠ 10♠ ; tableau de 5 cartes (river) : Q♥ 9♦ 2♣ 8♠ 3♦. | Avec ce tableau, quelle est votre meilleure main de 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Quinte | Quinte à la Dame. Q J 10 9 8. | C1.4 |
| N1-35 | QCM | Main `5H 5D` · Tableau `5S KC KD 9H 2C` | Vos deux cartes : 5♥ 5♦ ; tableau de 5 cartes (river) : 5♠ K♣ K♦ 9♥ 2♣. | Avec ce tableau, quelle est votre meilleure main de 5 cartes ? [Quinte flush royale · Quinte flush · Carré · Full · Couleur · Quinte · Brelan · Double paire · Paire · Carte haute] | Full | Full (5 par les rois). | C1.4 |
| N1-36 | QCM | Main `AH 2D` · Tableau `9S 9H 5D 5C KS` | Vos deux cartes : A♥ 2♦ ; tableau de 5 cartes (river) : 9♠ 9♥ 5♦ 5♣ K♠. | Combien de vos deux cartes entrent dans votre meilleure main de 5 cartes ? [0 · 1 · 2] | 1 | Double paire du tableau, l'As remplace le Roi comme kicker. | C1.4 |
| N1-37 | QCM | Main `2H 3D` · Tableau `AS KS QS JS TS` | Vos deux cartes : 2♥ 3♦ ; tableau de 5 cartes (river) : A♠ K♠ Q♠ J♠ 10♠. | Combien de vos deux cartes entrent dans votre meilleure main de 5 cartes ? [0 · 1 · 2] | 0 | Quinte flush royale au tableau : personne ne fait mieux, vos cartes ne servent pas et le pot est partagé. | C1.4 |
| N1-38 | QCM | Vous `AD KD` · Adversaire `7C 2S` · Tableau `8C 8D 8H 4S 4C` | Vos cartes : A♦ K♦ ; cartes de l'adversaire : 7♣ 2♠ ; tableau de 5 cartes (river) : 8♣ 8♦ 8♥ 4♠ 4♣. | À l'abattage, qui gagne le pot ? [Vous · Adversaire · Partage] | Partage | Les deux jouent le full du tableau. | C1.3 |

### Les nuts (C1.4) — un tableau

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N1-39 | AUTO | Tableau `KH QH 7H 4C 2S` | Tableau de 5 cartes (river) : K♥ Q♥ 7♥ 4♣ 2♠. | Quelles cartes privées donnent la meilleure main possible (les nuts) sur ce tableau ? | `AH JH` (couleur à l'As) | Trois cœurs ; vos deux cartes comptent. | C1.4 |
| N1-40 | AUTO | Tableau `9S 9D 6H 3C 2S` | Tableau de 5 cartes (river) : 9♠ 9♦ 6♥ 3♣ 2♠. | Quelles cartes privées donnent la meilleure main possible (les nuts) sur ce tableau ? | Carré de 9 (`9H 9C`) | Paire au tableau → carré possible. | C1.4 |
| N1-41 | AUTO | Tableau `JS TS 9D 4C 2H` | Tableau de 5 cartes (river) : J♠ 10♠ 9♦ 4♣ 2♥. | Quelles cartes privées donnent la meilleure main possible (les nuts) sur ce tableau ? | K-Q (quinte au Roi) | Pas de paire, pas trois cartes d'une couleur. | C1.4 |
| N1-42 | AUTO | Tableau `AS KD 8C 5H 2S` | Tableau de 5 cartes (river) : A♠ K♦ 8♣ 5♥ 2♠. | Quelles cartes privées donnent la meilleure main possible (les nuts) sur ce tableau ? | 4-3 (quinte au 5) | Piège : A-2-5 permettent la quinte basse, qui bat le brelan d'As. | C1.4 |
| N1-43 | AUTO | Tableau `8H 7H 6H 2C KD` | Tableau de 5 cartes (river) : 8♥ 7♥ 6♥ 2♣ K♦. | Quelles cartes privées donnent la meilleure main possible (les nuts) sur ce tableau ? | `TH 9H` (quinte flush au 10) | | C1.4 |
| N1-44 | AUTO | Tableau `2C 5D 8H JS KH` | Tableau de 5 cartes (river) : 2♣ 5♦ 8♥ J♠ K♥. | Quelles cartes privées donnent la meilleure main possible (les nuts) sur ce tableau ? | K-K (brelan de rois) | Ni paire, ni quinte, ni couleur possibles. | C1.4 |
| N1-45 | VF | Tableau `QC JD TS 5H 5C` | Tableau de 5 cartes (river) : Q♣ J♦ 10♠ 5♥ 5♣. | Sur ce tableau, la meilleure main possible (les nuts) est une quinte. | Faux | Paire au tableau : carré de 5 (`5S 5D`). | C1.4 |
| N1-46 | VF | | | Sans paire au tableau, aucun joueur ne peut avoir de full ni de carré. | Vrai | Il faudrait 3 cartes de même rang en main. | C1.4 |

### Déroulement et actions (C1.1, C1.2)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N1-47 | NUM | | | Combien de cartes communes sont retournées au flop ? | 3 | Puis 1 au turn, 1 à la river. | C1.1 |
| N1-48 | QCM | | | Avant le flop, quel joueur parle en premier ? [À gauche du bouton · À gauche de la BB · La BB] | À gauche de la BB | | C1.1 |
| N1-49 | QCM | | | Au flop, quel joueur encore en jeu parle en premier ? [À gauche du bouton · À gauche de la BB · Le bouton] | À gauche du bouton | Premier joueur encore en jeu. | C1.1 |
| N1-50 | QCM | | | À chaque nouvelle main, le bouton se déplace d'une place vers… [La gauche · La droite] | La gauche | | C1.1 |
| N1-51 | VF | | | Un joueur a misé avant vous : vous pouvez checker (parler sans miser). | Faux | Checker n'est possible que si personne n'a misé. | C1.2 |
| N1-52 | NUM | | | Un joueur mise 20. Votre relance doit atteindre au moins quel montant total ? | 40 | La relance vaut au moins la mise précédente. | C1.2 |
| N1-53 | VF | | | Un joueur à tapis peut gagner le pot annexe, formé des mises faites après son tapis. | Faux | Il ne joue que le pot principal. | C1.2 |
| N1-54 | NUM | | | A fait tapis pour 50 ; B et C suivent, puis misent encore 100 chacun. Combien vaut le pot principal (blinds non comptées) ? | 150 | 3 × 50 ; le pot annexe fait 200. | C1.2 |

---

## Niveau 2 — Éviter les grosses erreurs

### Position (C2.1)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N2-01 | QCM | | | À une table de 6 joueurs, quelle est la meilleure position ? [UTG · CO · BTN · BB] | BTN | Il parle en dernier après le flop. | C2.1 |
| N2-02 | QCM | | | Quelle place se trouve juste avant le bouton ? [MP · CO · SB] | CO | | C2.1 |
| N2-03 | QCM | | | Quelle position parle en premier avant le flop ? [UTG · SB · BTN] | UTG | « Sous le canon ». | C2.1 |
| N2-04 | QCM | | | Quelle position parle en premier après le flop, si elle est encore en jeu ? [SB · UTG · BTN] | SB | Les blinds sont hors position. | C2.1 |
| N2-05 | VF | | | Plus on parle tôt avant le flop, plus on doit jouer de mains. | Faux | C'est l'inverse. | C2.1 |

### Notation des mains de départ (C2.2)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N2-06 | AUTO | Main `AS 7S` | Vos deux cartes : A♠ 7♠. | Comment s'écrit cette main en notation courte ? | A7s | Même couleur → « s ». | C2.2 |
| N2-07 | AUTO | Main `AS 7D` | Vos deux cartes : A♠ 7♦. | Comment s'écrit cette main en notation courte ? | A7 | Couleurs différentes. | C2.2 |
| N2-08 | AUTO | Main `TH 9H` | Vos deux cartes : 10♥ 9♥. | Comment s'écrit cette main en notation courte ? | T9s | T = 10. | C2.2 |
| N2-09 | AUTO | Main `6C 6H` | Vos deux cartes : 6♣ 6♥. | Comment s'écrit cette main en notation courte ? | 66 | | C2.2 |
| N2-10 | VF | | | La notation 77+ comprend la paire de 6 (66). | Faux | 77+ = 77 à AA. | C2.2 |
| N2-11 | VF | | | La notation AJ+ comprend AT (As-10). | Faux | AJ+ = AJ, AQ, AK. | C2.2 |
| N2-12 | VF | | | La notation ATs+ comprend AKs (As-Roi assortis). | Vrai | ATs, AJs, AQs, AKs. | C2.2 |

### Ouvrir ou non (C2.2) — personne n'a relancé ; réponse : Relancer / Se coucher

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N2-13 | QCM | UTG · Main `AS JD` | Vos deux cartes : A♠ J♦ ; bandeau : « UTG ». | Personne n'a relancé ; vous êtes UTG (premier à parler) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Relancer | AJ+. | C2.2 |
| N2-14 | QCM | UTG · Main `KD JC` | Vos deux cartes : K♦ J♣ ; bandeau : « UTG ». | Personne n'a relancé ; vous êtes UTG (premier à parler) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Se coucher | KJ seulement assorti. | C2.2 |
| N2-15 | QCM | UTG · Main `KH JH` | Vos deux cartes : K♥ J♥ ; bandeau : « UTG ». | Personne n'a relancé ; vous êtes UTG (premier à parler) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Relancer | KJs+. | C2.2 |
| N2-16 | QCM | UTG · Main `6S 6D` | Vos deux cartes : 6♠ 6♦ ; bandeau : « UTG ». | Personne n'a relancé ; vous êtes UTG (premier à parler) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Se coucher | 77+ en UTG. | C2.2 |
| N2-17 | QCM | UTG · Main `AS TD` | Vos deux cartes : A♠ 10♦ ; bandeau : « UTG ». | Personne n'a relancé ; vous êtes UTG (premier à parler) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Se coucher | AT seulement assorti. | C2.2 |
| N2-18 | QCM | UTG · Main `AH 3C` | Vos deux cartes : A♥ 3♣ ; bandeau : « UTG ». | Personne n'a relancé ; vous êtes UTG (premier à parler) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Se coucher | Erreur classique : « tout As ». | C2.4 |
| N2-19 | QCM | MP · Main `KS QD` | Vos deux cartes : K♠ Q♦ ; bandeau : « MP ». | Personne n'a relancé ; vous êtes en milieu de table (MP) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Relancer | KQ. | C2.2 |
| N2-20 | QCM | CO · Main `AS 7S` | Vos deux cartes : A♠ 7♠ ; bandeau : « CO ». | Personne n'a relancé ; vous êtes au CO (juste avant le bouton) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Relancer | A2s+. | C2.2 |
| N2-21 | QCM | CO · Main `AS 7D` | Vos deux cartes : A♠ 7♦ ; bandeau : « CO ». | Personne n'a relancé ; vous êtes au CO (juste avant le bouton) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Se coucher | Dépareillé : AT au moins. | C2.2 |
| N2-22 | QCM | CO · Main `6C 6H` | Vos deux cartes : 6♣ 6♥ ; bandeau : « CO ». | Personne n'a relancé ; vous êtes au CO (juste avant le bouton) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Relancer | 55+. | C2.2 |
| N2-23 | QCM | CO · Main `4S 4H` | Vos deux cartes : 4♠ 4♥ ; bandeau : « CO ». | Personne n'a relancé ; vous êtes au CO (juste avant le bouton) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Se coucher | 55+ au CO. | C2.2 |
| N2-24 | QCM | CO · Main `QH JD` | Vos deux cartes : Q♥ J♦ ; bandeau : « CO ». | Personne n'a relancé ; vous êtes au CO (juste avant le bouton) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Relancer | QJ. | C2.2 |
| N2-25 | QCM | CO · Main `KS 9S` | Vos deux cartes : K♠ 9♠ ; bandeau : « CO ». | Personne n'a relancé ; vous êtes au CO (juste avant le bouton) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Relancer | K9s+. | C2.2 |
| N2-26 | QCM | CO · Main `KH 9D` | Vos deux cartes : K♥ 9♦ ; bandeau : « CO ». | Personne n'a relancé ; vous êtes au CO (juste avant le bouton) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Se coucher | K9 seulement assorti. | C2.2 |
| N2-27 | QCM | CO · Main `9S 8S` | Vos deux cartes : 9♠ 8♠ ; bandeau : « CO ». | Personne n'a relancé ; vous êtes au CO (juste avant le bouton) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Se coucher | Au CO, T9s est la plus basse. | C2.2 |
| N2-28 | QCM | BTN · Main `2S 2D` | Vos deux cartes : 2♠ 2♦ ; bandeau : « BTN ». | Personne n'a relancé ; vous êtes au bouton (BTN) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Relancer | Toutes les paires. | C2.2 |
| N2-29 | QCM | BTN · Main `AH 3C` | Vos deux cartes : A♥ 3♣ ; bandeau : « BTN ». | Personne n'a relancé ; vous êtes au bouton (BTN) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Relancer | Tous les As au bouton. | C2.2 |
| N2-30 | QCM | BTN · Main `7S 6S` | Vos deux cartes : 7♠ 6♠ ; bandeau : « BTN ». | Personne n'a relancé ; vous êtes au bouton (BTN) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Relancer | Assorties connectées jusqu'à 76s. | C2.2 |
| N2-31 | QCM | BTN · Main `6S 5S` | Vos deux cartes : 6♠ 5♠ ; bandeau : « BTN ». | Personne n'a relancé ; vous êtes au bouton (BTN) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Se coucher | 76s est la dernière. | C2.2 |
| N2-32 | QCM | BTN · Main `QH TD` | Vos deux cartes : Q♥ 10♦ ; bandeau : « BTN ». | Personne n'a relancé ; vous êtes au bouton (BTN) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Relancer | Deux cartes de 10 ou plus. | C2.2 |
| N2-33 | QCM | BTN · Main `KH 9D` | Vos deux cartes : K♥ 9♦ ; bandeau : « BTN ». | Personne n'a relancé ; vous êtes au bouton (BTN) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Se coucher | K9 seulement assorti. | C2.2 |
| N2-34 | QCM | BTN · Main `JS 9S` | Vos deux cartes : J♠ 9♠ ; bandeau : « BTN ». | Personne n'a relancé ; vous êtes au bouton (BTN) avec cette main. Que faites-vous ? [Relancer · Se coucher] | Se coucher | Pas dans la liste du bouton. | C2.2 |
| N2-35 | QCM | SB · Main `AS 5S` | Vos deux cartes : A♠ 5♠ ; bandeau : « SB ». | Personne n'a relancé ; vous êtes en petite blind (SB) avec cette main. Que faites-vous ? [Relancer · Suivre · Se coucher] | Relancer | SB = liste du CO ; elle ne suit jamais. | C2.2 |
| N2-36 | QCM | BB, personne n'a relancé · Main `KD 7C` | Vos deux cartes : K♦ 7♣ ; bandeau : « BB, personne n'a relancé ». | Personne n'a relancé ; vous êtes en grosse blind (BB) avec cette main. Que faites-vous ? [Relancer · Checker · Se coucher] | Checker | Gratuit : on ne jette pas. | C2.2 |
| N2-37 | VF | | | Avant le flop, il est parfois bon d'entrer dans le pot en suivant simplement la grosse blind (limp). | Faux | Toujours en relançant. | C2.3 |
| N2-38 | NUM | | | Personne n'est encore entré dans le pot : à combien de BB ouvrez-vous ? | 2,5 | | C2.3 |
| N2-39 | NUM | | | Un joueur a déjà suivi (limp) : à combien de BB ouvrez-vous ? | 3,5 | 2,5 + 1 par suiveur. | C2.3 |
| N2-40 | QCM | | | Au bouton, quelle part environ des mains de départ ouvrez-vous ? [9 % · 17 % · 29 %] | 29 % | UTG 9 %, CO 17 %. | C2.2 |

### Face à une relance (C2.2)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N2-41 | QCM | UTG relance ; vous BTN · Main `9S 9D` | Vos deux cartes : 9♠ 9♦ ; bandeau : « UTG relance ; vous BTN ». | UTG a relancé ; vous êtes au bouton (BTN) avec cette main. Que faites-vous ? [Sur-relancer · Suivre · Se coucher] | Suivre | JJ à 66 en position. | C2.2 |
| N2-42 | QCM | UTG relance ; vous BB · Main `9S 9D` | Vos deux cartes : 9♠ 9♦ ; bandeau : « UTG relance ; vous BB ». | UTG a relancé ; vous êtes en grosse blind (BB) avec cette main. Que faites-vous ? [Sur-relancer · Suivre · Se coucher] | Suivre | JJ à 88 aux blinds. | C2.2 |
| N2-43 | QCM | UTG relance ; vous BB · Main `7S 7D` | Vos deux cartes : 7♠ 7♦ ; bandeau : « UTG relance ; vous BB ». | UTG a relancé ; vous êtes en grosse blind (BB) avec cette main. Que faites-vous ? [Sur-relancer · Suivre · Se coucher] | Se coucher | 88 au moins aux blinds. | C2.2 |
| N2-44 | QCM | UTG relance ; vous BTN · Main `AS JD` | Vos deux cartes : A♠ J♦ ; bandeau : « UTG relance ; vous BTN ». | UTG a relancé ; vous êtes au bouton (BTN) avec cette main. Que faites-vous ? [Sur-relancer · Suivre · Se coucher] | Se coucher | AJ dépareillé : dominé. | C2.2 |
| N2-45 | QCM | UTG relance ; vous BTN · Main `AH JH` | Vos deux cartes : A♥ J♥ ; bandeau : « UTG relance ; vous BTN ». | UTG a relancé ; vous êtes au bouton (BTN) avec cette main. Que faites-vous ? [Sur-relancer · Suivre · Se coucher] | Suivre | AJs en position. | C2.2 |
| N2-46 | QCM | UTG relance ; vous CO · Main `AS KD` | Vos deux cartes : A♠ K♦ ; bandeau : « UTG relance ; vous CO ». | UTG a relancé ; vous êtes au CO avec cette main. Que faites-vous ? [Sur-relancer · Suivre · Se coucher] | Sur-relancer | QQ+, AK. | C2.2 |
| N2-47 | QCM | CO relance ; vous SB · Main `AD QC` | Vos deux cartes : A♦ Q♣ ; bandeau : « CO relance ; vous SB ». | Le joueur au CO a relancé ; vous êtes en petite blind (SB) avec cette main. Que faites-vous ? [Sur-relancer · Suivre · Se coucher] | Suivre | AQ suit, même aux blinds. | C2.2 |
| N2-48 | QCM | Vous aviez relancé ; sur-relance · Main `JS JD` | Vos deux cartes : J♠ J♦ ; bandeau : « Vous aviez relancé ; sur-relance ». | Vous aviez relancé, un joueur sur-relance (3-bet). Que faites-vous avec cette main ? [4-bet · Suivre · Se coucher] | Suivre | JJ et TT suivent. | C2.2 |
| N2-49 | QCM | Vous aviez relancé ; sur-relance · Main `AH QD` | Vos deux cartes : A♥ Q♦ ; bandeau : « Vous aviez relancé ; sur-relance ». | Vous aviez relancé, un joueur sur-relance (3-bet). Que faites-vous avec cette main ? [4-bet · Suivre · Se coucher] | Se coucher | AQ compris. | C2.2 |
| N2-50 | QCM | Relance puis sur-relance avant vous · Main `JS JD` | Vos deux cartes : J♠ J♦ ; bandeau : « Relance puis sur-relance avant vous ». | Avant vous, un joueur a relancé et un autre a sur-relancé. Que faites-vous avec cette main ? [4-bet · Suivre · Se coucher] | Se coucher | Seuls QQ+ et AK continuent. | C2.2 |
| N2-51 | NUM | | | Un joueur relance à 3 BB ; vous parlerez après lui (en position). À combien de BB sur-relancez-vous ? | 9 | 3 fois la relance. | C2.2 |
| N2-52 | NUM | | | Un joueur relance à 3 BB ; vous êtes en grosse blind (hors position). À combien de BB sur-relancez-vous ? | 12 | 4 fois hors position. | C2.2 |

### Après le flop, schéma simple (C2.3)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N2-53 | VF | Main `AS KD` · Tableau `KH 8C 3S` | Vos deux cartes : A♠ K♦ ; tableau de 3 cartes (flop) : K♥ 8♣ 3♠. | Avec cette main et ce flop, vous avez une top paire. | Vrai | Paire avec la plus haute carte du tableau. | C2.3 |
| N2-54 | VF | Main `AH 6D` · Tableau `TC 6S 2H` | Vos deux cartes : A♥ 6♦ ; tableau de 3 cartes (flop) : 10♣ 6♠ 2♥. | Avec cette main et ce flop, vous avez une top paire. | Faux | Paire du milieu. | C2.3 |
| N2-55 | VF | Main `9S 9H` · Tableau `7D 5C 2H` | Vos deux cartes : 9♠ 9♥ ; tableau de 3 cartes (flop) : 7♦ 5♣ 2♥. | Avec cette main et ce flop, vous avez une top paire. | Vrai | Paire en main plus haute que le tableau. | C2.3 |
| N2-56 | QCM | Personne n'a misé · Main `AS KD` · Tableau `KH 8C 3S` | Vos deux cartes : A♠ K♦ ; tableau de 3 cartes (flop) : K♥ 8♣ 3♠ ; bandeau : « Personne n'a misé ». | Au flop, personne n'a misé. Que faites-vous ? [Miser ½ pot · Checker] | Miser ½ pot | Top paire ou mieux. | C2.3 |
| N2-57 | QCM | Personne n'a misé · Main `QS JS` · Tableau `KH 8C 3S` | Vos deux cartes : Q♠ J♠ ; tableau de 3 cartes (flop) : K♥ 8♣ 3♠ ; bandeau : « Personne n'a misé ». | Au flop, personne n'a misé. Que faites-vous ? [Miser ½ pot · Checker] | Checker | Pas de top paire. | C2.3 |
| N2-58 | QCM | Face à une mise · Main `KS 8S` · Tableau `KH 8C 3S` | Vos deux cartes : K♠ 8♠ ; tableau de 3 cartes (flop) : K♥ 8♣ 3♠ ; bandeau : « Face à une mise ». | Au flop, l'adversaire mise. Que faites-vous ? [Relancer ×3 · Suivre · Se coucher] | Relancer ×3 | Deux paires avec vos deux cartes. | C2.3 |
| N2-59 | QCM | Face à une mise · Main `AS KD` · Tableau `KH 8C 3S` | Vos deux cartes : A♠ K♦ ; tableau de 3 cartes (flop) : K♥ 8♣ 3♠ ; bandeau : « Face à une mise ». | Au flop, l'adversaire mise. Que faites-vous ? [Relancer ×3 · Suivre · Se coucher] | Suivre | Top paire. | C2.3 |
| N2-60 | QCM | Vous misez, on vous relance · Main `AS KD` · Tableau `KH 8C 3S` | Vos deux cartes : A♠ K♦ ; tableau de 3 cartes (flop) : K♥ 8♣ 3♠ ; bandeau : « Vous misez, on vous relance ». | Au flop, vous misez et l'adversaire relance. Que faites-vous ? [Relancer · Suivre · Se coucher] | Se coucher | Règle 3 : main moyenne contre grosse action. | C2.3 |
| N2-61 | QCM | | | Avec deux cartes assorties, quelle est la probabilité de finir avec une couleur à la river ? [6 % · 20 % · 35 %] | 6 % | Ne pas surestimer les assorties. | C2.4 |

---

## Niveau 3 — Les probabilités

### Compter ses outs (C3.1) — main + flop

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N3-01 | NUM | Main `AH 8H` · Tableau `KH 7H 2C` | Vos deux cartes : A♥ 8♥ ; tableau de 3 cartes (flop) : K♥ 7♥ 2♣. | Combien d'outs avez-vous pour faire la couleur ? | 9 | 13 cœurs − 4 vus. | C3.1 |
| N3-02 | NUM | Main `9S 8D` · Tableau `7H 6C 2S` | Vos deux cartes : 9♠ 8♦ ; tableau de 3 cartes (flop) : 7♥ 6♣ 2♠. | Combien d'outs avez-vous pour faire la quinte ? | 8 | Bilatérale : 4 dix + 4 cinq. | C3.1 |
| N3-03 | NUM | Main `9S 8D` · Tableau `JH 7C 2S` | Vos deux cartes : 9♠ 8♦ ; tableau de 3 cartes (flop) : J♥ 7♣ 2♠. | Combien d'outs avez-vous pour faire la quinte ? | 4 | Ventrale : seulement les 10. | C3.2 |
| N3-04 | NUM | Main `6S 6D` · Tableau `KH 9C 3S` | Vos deux cartes : 6♠ 6♦ ; tableau de 3 cartes (flop) : K♥ 9♣ 3♠. | Combien d'outs avez-vous pour faire un brelan ? | 2 | Les deux 6 restants. | C3.2 |
| N3-05 | NUM | Main `AS KD` · Tableau `8H 7C 2S` | Vos deux cartes : A♠ K♦ ; tableau de 3 cartes (flop) : 8♥ 7♣ 2♠. | Combien d'outs avez-vous pour faire une paire d'As ou de Rois ? | 6 | Deux cartes hautes : 3 + 3. | C3.2 |
| N3-06 | NUM | Main `JH TH` · Tableau `9H 8C 2H` | Vos deux cartes : J♥ 10♥ ; tableau de 3 cartes (flop) : 9♥ 8♣ 2♥. | Combien d'outs avez-vous pour faire une couleur ou une quinte ? | 15 | 9 cœurs + 6 Q/7 non cœur. | C3.2 |
| N3-07 | NUM | Main `KH QH` · Tableau `JH 4H 2C` | Vos deux cartes : K♥ Q♥ ; tableau de 3 cartes (flop) : J♥ 4♥ 2♣. | Combien d'outs avez-vous pour faire la couleur ? | 9 | | C3.1 |
| N3-08 | VF | Main `9S 8D` · Tableau `7H 6H 2H` · Carte `5H` | Vos deux cartes : 9♠ 8♦ ; tableau de 3 cartes (flop) : 7♥ 6♥ 2♥ ; carte candidate, encadrée : 5♥. | Le 5♥ vous donne la quinte : c'est un bon out. | Faux | Out « sale » : il donne aussi un 4e cœur au tableau. | C3.1 |

### Règle du 2 et du 4 (C3.2)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N3-09 | QCM | | | Règle du 2 et du 4 : au flop, pour voir le turn et la river, on multiplie les outs par… [2 · 4] | 4 | | C3.2 |
| N3-10 | QCM | | | Règle du 2 et du 4 : au turn, pour voir la river seule, on multiplie les outs par… [2 · 4] | 2 | | C3.2 |
| N3-11 | NUM | | | Avec un tirage couleur au flop, quelles sont vos chances (%) de la toucher d'ici la river ? | 35 (± 2) | 9 × 4 − 1. | C3.2 |
| N3-12 | NUM | | | Avec un tirage couleur au turn, quelles sont vos chances (%) de la toucher à la river ? | 20 (± 2) | | C3.2 |
| N3-13 | NUM | | | Avec une quinte bilatérale au flop, quelles sont vos chances (%) de la toucher d'ici la river ? | 31 (± 2) | | C3.2 |
| N3-14 | NUM | | | Avec une quinte ventrale au turn, quelles sont vos chances (%) de la toucher à la river ? | 9 (± 1) | | C3.2 |
| N3-15 | NUM | | | Avec un tirage couleur et une quinte bilatérale au flop, quelles sont vos chances (%) de toucher d'ici la river ? | 54 (± 3) | 15 outs. | C3.2 |
| N3-16 | NUM | | | Votre paire servie n'a pas touché au flop. Quelles sont vos chances (%) de faire un brelan d'ici la river ? | 8 (± 1) | 2 outs. | C3.2 |

### Cote du pot (C3.3)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N3-17 | NUM | | | L'adversaire mise un demi-pot. Quelle équité (%) vous faut-il au minimum pour suivre ? | 25 | | C3.3 |
| N3-18 | NUM | | | L'adversaire mise la taille du pot. Quelle équité (%) vous faut-il au minimum pour suivre ? | 33 | | C3.3 |
| N3-19 | NUM | | | L'adversaire mise un tiers de pot. Quelle équité (%) vous faut-il au minimum pour suivre ? | 20 | | C3.3 |
| N3-20 | NUM | | | L'adversaire mise deux tiers de pot. Quelle équité (%) vous faut-il au minimum pour suivre ? | 29 | | C3.3 |
| N3-21 | NUM | | | L'adversaire mise un quart de pot. Quelle équité (%) vous faut-il au minimum pour suivre ? | 17 | | C3.3 |
| N3-22 | NUM | | | L'adversaire mise deux fois le pot. Quelle équité (%) vous faut-il au minimum pour suivre ? | 40 | | C3.3 |
| N3-23 | NUM | | | Le pot fait 100, l'adversaire mise 50. Quelle équité (%) vous faut-il au minimum pour suivre ? | 25 | 50 ÷ 200. | C3.3 |
| N3-24 | NUM | | | Le pot fait 90, l'adversaire mise 30. Quelle équité (%) vous faut-il au minimum pour suivre ? | 20 | 30 ÷ 150. | C3.3 |

### Suivre ou se coucher ? (C3.2 + C3.3) — décision en moins de 10 secondes

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N3-25 | QCM | Turn · Main `AH 8H` · Tableau `KH 7H 2C 4S` · mise ½ pot | Vos deux cartes : A♥ 8♥ ; tableau de 4 cartes (turn) : K♥ 7♥ 2♣ 4♠ ; bandeau : « Turn · mise ½ pot ». | Au turn, l'adversaire mise un demi-pot. Que faites-vous avec ce tirage ? [Suivre · Se coucher] | Se coucher | 20 % < 25 %. | C3.3 |
| N3-26 | QCM | Flop, adversaire à tapis (pot) · Main `AH 8H` · Tableau `KH 7H 2C` | Vos deux cartes : A♥ 8♥ ; tableau de 3 cartes (flop) : K♥ 7♥ 2♣ ; bandeau : « Flop, adversaire à tapis (pot) ». | Au flop, l'adversaire fait tapis pour la taille du pot. Que faites-vous avec ce tirage ? [Suivre · Se coucher] | Suivre | 35 % > 33 %. | C3.3 |
| N3-27 | QCM | Turn · Main `9S 8D` · Tableau `JH 7C 2S 3D` · mise ⅓ pot | Vos deux cartes : 9♠ 8♦ ; tableau de 4 cartes (turn) : J♥ 7♣ 2♠ 3♦ ; bandeau : « Turn · mise ⅓ pot ». | Au turn, l'adversaire mise un tiers de pot. Que faites-vous avec ce tirage ? [Suivre · Se coucher] | Se coucher | 9 % < 20 %. | C3.3 |
| N3-28 | QCM | Flop, adversaire à tapis (pot) · Main `JH TH` · Tableau `9H 8C 2H` | Vos deux cartes : J♥ 10♥ ; tableau de 3 cartes (flop) : 9♥ 8♣ 2♥ ; bandeau : « Flop, adversaire à tapis (pot) ». | Au flop, l'adversaire fait tapis pour la taille du pot. Que faites-vous avec ce tirage ? [Suivre · Se coucher] | Suivre | 54 % > 33 %. | C3.3 |
| N3-29 | QCM | Turn · Main `AH 8H` · Tableau `KH 7H 2C 4S` · mise ¼ pot | Vos deux cartes : A♥ 8♥ ; tableau de 4 cartes (turn) : K♥ 7♥ 2♣ 4♠ ; bandeau : « Turn · mise ¼ pot ». | Au turn, l'adversaire mise un quart de pot. Que faites-vous avec ce tirage ? [Suivre · Se coucher] | Suivre | 20 % > 17 %. | C3.3 |

### Cotes implicites (C3.4)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N3-30 | QCM | Main `4S 4D` | Vos deux cartes : 4♠ 4♦. | Avec une petite paire servie, à quelle fréquence touchez-vous le brelan au flop ? [1 fois sur 4 · 1 fois sur 8 · 1 fois sur 20] | 1 fois sur 8 | | C3.4 |
| N3-31 | NUM | | | Pour payer préflop avec une petite paire, les tapis restants doivent valoir au moins combien de fois le prix du call ? | 15 | | C3.4 |
| N3-32 | VF | | | Contre un adversaire au gros tapis, qui paiera si vous touchez, un tirage un peu cher devient rentable (cotes implicites). | Vrai | Il paiera quand vous touchez. | C3.4 |

### Duels préflop (C3.5)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N3-33 | NUM | A `KS KH` · B `QD QC` | Deux mains côte à côte, étiquetées A et B : main A : K♠ K♥ ; main B : Q♦ Q♣. | Avant le flop, main A contre main B : quelle est l'équité (%) de A ? | 82 (± 3) | Paire contre paire inférieure. | C3.5 |
| N3-34 | NUM | A `AS KD` · B `AH QC` | Deux mains côte à côte, étiquetées A et B : main A : A♠ K♦ ; main B : A♥ Q♣. | Avant le flop, main A contre main B : quelle est l'équité (%) de A ? | 74 (± 3) | Main dominée. | C3.5 |
| N3-35 | QCM | A `8S 8H` · B `AD KC` | Deux mains côte à côte, étiquetées A et B : main A : 8♠ 8♥ ; main B : A♦ K♣. | Avant le flop, quelle main est favorite ? [A · B · Égalité] | A | Paire ≈ 55 % contre deux cartes plus hautes. | C3.5 |
| N3-36 | NUM | A `AS KD` · B `8H 7C` | Deux mains côte à côte, étiquetées A et B : main A : A♠ K♦ ; main B : 8♥ 7♣. | Avant le flop, main A contre main B : quelle est l'équité (%) de A ? | 60 (± 3) | Deux hautes contre deux basses. | C3.5 |
| N3-37 | VF | A `AS KD` · B `8H 8C` | Deux mains côte à côte, étiquetées A et B : main A : A♠ K♦ ; main B : 8♥ 8♣. | Avant le flop, la main A est favorite contre la main B. | Faux | 88 ≈ 55 %. | C3.5 |

### Espérance de gain (C3.6)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N3-38 | NUM | | | Vous payez 50 pour gagner 150, avec 30 % d'équité. Quelle est l'EV de votre call ? | 10 | 0,30 × 150 − 0,70 × 50. | C3.6 |
| N3-39 | NUM | | | Vous payez 20 pour gagner 80, avec 25 % d'équité. Quelle est l'EV de votre call ? | 5 | 20 − 15. | C3.6 |
| N3-40 | NUM | | | Vous payez 100 pour gagner 200, avec 25 % d'équité. Quelle est l'EV de votre call ? | −25 | 50 − 75. | C3.6 |
| N3-41 | VF | | | Une décision rentable en moyenne (EV positive) peut perdre le coup joué. | Vrai | Elle rapporte en moyenne. | C3.6 |

### Compter les combos (C3.7)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N3-42 | NUM | Main `QC QD` · Tableau `KH QH 7H 4C 2S` | Vos deux cartes : Q♣ Q♦ ; tableau de 5 cartes (river) : K♥ Q♥ 7♥ 4♣ 2♠. | Combien de combinaisons de deux Rois (combos K-K) vous battent ? | 3 | Il reste 3 rois. | C3.7 |
| N3-43 | NUM | Main `QC QD` · Tableau `KH QH 7H 4C 2S` | Vos deux cartes : Q♣ Q♦ ; tableau de 5 cartes (river) : K♥ Q♥ 7♥ 4♣ 2♠. | Combien de combinaisons de deux cœurs (combos) un adversaire peut-il avoir ? | 45 | 10 cœurs : 10 × 9 ÷ 2. | C3.7 |
| N3-44 | NUM | | | Après la river, vous voyez 7 cartes. Combien de cartes restent inconnues ? | 47 | 52 − 7. | C3.7 |
| N3-45 | NUM | | | Sans aucune carte visible, combien de combinaisons (combos) existe-t-il pour une paire donnée, par exemple 8-8 ? | 6 | 4 × 3 ÷ 2. | C3.7 |

---

## Niveau 4 — Jouer après le flop

### Les deux raisons de miser (C4.1) — vous êtes seul contre un adversaire

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N4-01 | QCM | Main `AS KD` · Tableau `KH 8C 3S` | Vos deux cartes : A♠ K♦ ; tableau de 3 cartes (flop) : K♥ 8♣ 3♠. | Seul contre un adversaire, vous envisagez de miser. Quelle est la raison de cette mise ? [Valeur · Bluff · Aucune raison] | Valeur | Top paire, bon kicker : des paires inférieures paient. | C4.1 |
| N4-02 | QCM | Main `9H 8H` · Tableau `KH 4H 2C` | Vos deux cartes : 9♥ 8♥ ; tableau de 3 cartes (flop) : K♥ 4♥ 2♣. | Seul contre un adversaire, vous envisagez de miser. Quelle est la raison de cette mise ? [Valeur · Bluff · Aucune raison] | Bluff | Semi-bluff : rien encore, mais 9 outs pour la couleur. | C4.1 |
| N4-03 | QCM | Main `5S 5D` · Tableau `KH QC 8S` | Vos deux cartes : 5♠ 5♦ ; tableau de 3 cartes (flop) : K♥ Q♣ 8♠. | Seul contre un adversaire, vous envisagez de miser. Quelle est la raison de cette mise ? [Valeur · Bluff · Aucune raison] | Aucune raison | Main moyenne : seules les plus faibles se couchent, seules les plus fortes paient. | C4.1 |
| N4-04 | QCM | Main `9S 8S` · Tableau `KH QD 7C 4H 2S` | Vos deux cartes : 9♠ 8♠ ; tableau de 5 cartes (river) : K♥ Q♦ 7♣ 4♥ 2♠. | Seul contre un adversaire, vous envisagez de miser. Quelle est la raison de cette mise ? [Valeur · Bluff · Aucune raison] | Bluff | Rien à la river : seule une mise peut gagner le pot. | C4.6 |
| N4-05 | VF | | | Un semi-bluff est un bluff avec un tirage : il peut encore gagner s'il touche. | Vrai | Tirage couleur, quinte bilatérale. | C4.1 |
| N4-06 | VF | | | Miser avec une main moyenne, c'est miser pour la valeur. | Faux | C'est le piège des mains moyennes. | C4.1 |

### Texture du flop (C4.2)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N4-07 | QCM | Tableau `KS 7D 2C` | Tableau de 3 cartes (flop) : K♠ 7♦ 2♣. | Quelle est la texture de ce flop ? [Sec · Humide · Apparié · Monotone] | Sec | Peu de tirages. | C4.2 |
| N4-08 | QCM | Tableau `JH TH 8C` | Tableau de 3 cartes (flop) : J♥ 10♥ 8♣. | Quelle est la texture de ce flop ? [Sec · Humide · Apparié · Monotone] | Humide | Cartes liées, deux cœurs : beaucoup de tirages. | C4.2 |
| N4-09 | QCM | Tableau `9S 9D 4C` | Tableau de 3 cartes (flop) : 9♠ 9♦ 4♣. | Quelle est la texture de ce flop ? [Sec · Humide · Apparié · Monotone] | Apparié | | C4.2 |
| N4-10 | QCM | Tableau `QH 8H 3H` | Tableau de 3 cartes (flop) : Q♥ 8♥ 3♥. | Quelle est la texture de ce flop ? [Sec · Humide · Apparié · Monotone] | Monotone | Trois cartes de la même couleur. | C4.2 |
| N4-11 | QCM | Tableau `AS 9D 5C` | Tableau de 3 cartes (flop) : A♠ 9♦ 5♣. | Quelle est la texture de ce flop ? [Sec · Humide · Apparié · Monotone] | Sec | Cartes éloignées, trois couleurs. | C4.2 |
| N4-12 | QCM | Tableau `9H 8H 6C` | Tableau de 3 cartes (flop) : 9♥ 8♥ 6♣. | Quelle est la texture de ce flop ? [Sec · Humide · Apparié · Monotone] | Humide | | C4.2 |
| N4-13 | QCM | Tableau `TS 6S 2S` | Tableau de 3 cartes (flop) : 10♠ 6♠ 2♠. | Quelle est la texture de ce flop ? [Sec · Humide · Apparié · Monotone] | Monotone | | C4.2 |

### C-bet (C4.3) — vous avez relancé préflop, un adversaire a payé

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N4-14 | QCM | Vous avez relancé préflop · Tableau `KS 7D 2C` | Tableau de 3 cartes (flop) : K♠ 7♦ 2♣ ; bandeau : « Vous avez relancé préflop ». | Vous avez relancé préflop, un adversaire a payé. Quelle c-bet faites-vous sur ce flop ? [1/3 de pot · 2/3 de pot · Parole] | 1/3 de pot | Flop sec à carte haute : petite et fréquente. | C4.3 |
| N4-15 | QCM | Vous avez relancé préflop · Tableau `9H 8H 6C` | Tableau de 3 cartes (flop) : 9♥ 8♥ 6♣ ; bandeau : « Vous avez relancé préflop ». | Vous avez relancé préflop, un adversaire a payé. Quelle c-bet faites-vous sur ce flop ? [1/3 de pot · 2/3 de pot · Parole] | 2/3 de pot | Flop coordonné et bas : plus rare et plus grosse. | C4.3 |
| N4-16 | QCM | Vous avez relancé préflop · Tableau `9S 9D 4C` | Tableau de 3 cartes (flop) : 9♠ 9♦ 4♣ ; bandeau : « Vous avez relancé préflop ». | Vous avez relancé préflop, un adversaire a payé. Quelle c-bet faites-vous sur ce flop ? [1/3 de pot · 2/3 de pot · Parole] | 1/3 de pot | Apparié : peu de mains l'ont touché. | C4.3 |
| N4-17 | QCM | Vous avez relancé préflop · Main `AS KD` · Tableau `QH 8H 3H` | Vos deux cartes : A♠ K♦ ; tableau de 3 cartes (flop) : Q♥ 8♥ 3♥ ; bandeau : « Vous avez relancé préflop ». | Vous avez relancé préflop, un adversaire a payé. Avec cette main, quelle c-bet faites-vous sur ce flop ? [1/3 de pot · 2/3 de pot · Parole] | Parole | Monotone sans carte de la couleur. | C4.3 |
| N4-18 | QCM | | | Environ combien de fois un adversaire rate-t-il le flop ? [1 fois sur 3 · 2 fois sur 3 · 9 fois sur 10] | 2 fois sur 3 | D'où l'efficacité de la c-bet. | C4.3 |
| N4-19 | VF | | | Contre plusieurs adversaires, on fait une c-bet aussi souvent qu'en tête-à-tête. | Faux | Beaucoup moins, et surtout pour la valeur. | C4.3 |

### Taille de mise (C4.4)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N4-20 | QCM | | | Sur un tableau sec où vous avez l'avantage de range, quelle taille de mise choisissez-vous ? [1/4 à 1/3 · 1/2 à 2/3 · 3/4 à pot · Plus que le pot] | 1/4 à 1/3 | | C4.4 |
| N4-21 | QCM | | | Dans le cas général, pour une mise de valeur, quelle taille choisissez-vous ? [1/4 à 1/3 · 1/2 à 2/3 · 3/4 à pot · Plus que le pot] | 1/2 à 2/3 | | C4.4 |
| N4-22 | QCM | Main `JS JD` · Tableau `JH TH 8C` | Vos deux cartes : J♠ J♦ ; tableau de 3 cartes (flop) : J♥ 10♥ 8♣. | Vous avez un brelan sur ce flop plein de tirages. Quelle taille de mise de valeur choisissez-vous ? [1/4 à 1/3 · 1/2 à 2/3 · 3/4 à pot · Plus que le pot] | 3/4 à pot | Tableau humide, main forte : faire payer les tirages. | C4.4 |
| N4-23 | QCM | | | À la river, avec les nuts ou rien du tout, quelle taille de mise choisissez-vous ? [1/4 à 1/3 · 1/2 à 2/3 · 3/4 à pot · Plus que le pot] | Plus que le pot | Overbet. | C4.4 |

### SPR (C4.5)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N4-24 | NUM | | | Le pot au flop fait 100 et le tapis effectif 400. Quel est le SPR (rapport tapis sur pot) ? | 4 | 400 ÷ 100. | C4.5 |
| N4-25 | NUM | | | Pot au flop : 10 BB. Votre tapis : 150 BB ; celui de l'adversaire : 60 BB. Quel est le SPR (rapport tapis sur pot) ? | 6 | Tapis effectif = le plus petit : 60 ÷ 10. | C4.5 |
| N4-26 | VF | | | Avec un SPR de 2 et une top paire, vous êtes prêt à mettre tout votre tapis. | Vrai | SPR sous 3 : top paire ou mieux. | C4.5 |
| N4-27 | VF | | | Avec un SPR de 5 et une top paire, vous êtes prêt à mettre tout votre tapis. | Faux | Entre 3 et 8 : deux paires ou mieux. | C4.5 |
| N4-28 | VF | | | Avec un SPR de 12 et deux paires, vous êtes prêt à mettre tout votre tapis. | Faux | Au-dessus de 8 : très grosse main. | C4.5 |

### River (C4.6)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N4-29 | QCM | | | À la river, avec une main moyenne, personne n'a misé. Que faites-vous ? [Miser gros · Parole] | Parole | | C4.6 |
| N4-30 | QCM | | | À la river, avec une main moyenne, l'adversaire mise petit. Que faites-vous ? [Suivre · Se coucher · Relancer] | Suivre | Une main moyenne paie une petite mise. | C4.6 |

---

## Niveau 5 — Penser en ranges et s'adapter

### Range à la river en trois catégories (C5.1)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N5-01 | QCM | Main `AH KD` · Tableau `AC 8D 3S KH 2C` | Vos deux cartes : A♥ K♦ ; tableau de 5 cartes (river) : A♣ 8♦ 3♠ K♥ 2♣. | À la river, dans quelle catégorie de range classez-vous cette main ? [Forte · Moyenne · Bluff] | Forte | Deux paires. | C5.1 |
| N5-02 | QCM | Main `AH 9S` · Tableau `AC 8D 3S KH 2C` | Vos deux cartes : A♥ 9♠ ; tableau de 5 cartes (river) : A♣ 8♦ 3♠ K♥ 2♣. | À la river, dans quelle catégorie de range classez-vous cette main ? [Forte · Moyenne · Bluff] | Moyenne | Une paire. | C5.1 |
| N5-03 | QCM | Main `QD JD` · Tableau `AC 8D 3S KH 2C` | Vos deux cartes : Q♦ J♦ ; tableau de 5 cartes (river) : A♣ 8♦ 3♠ K♥ 2♣. | À la river, dans quelle catégorie de range classez-vous cette main ? [Forte · Moyenne · Bluff] | Bluff | Moins qu'une paire. | C5.1 |
| N5-04 | QCM | Main `8H 8S` · Tableau `AC 8D 3S KH 2C` | Vos deux cartes : 8♥ 8♠ ; tableau de 5 cartes (river) : A♣ 8♦ 3♠ K♥ 2♣. | À la river, dans quelle catégorie de range classez-vous cette main ? [Forte · Moyenne · Bluff] | Forte | Brelan. | C5.1 |
| N5-05 | QCM | Main `5H 4H` · Tableau `AC 8D 3S KH 2C` | Vos deux cartes : 5♥ 4♥ ; tableau de 5 cartes (river) : A♣ 8♦ 3♠ K♥ 2♣. | À la river, dans quelle catégorie de range classez-vous cette main ? [Forte · Moyenne · Bluff] | Forte | Piège : quinte A-2-3-4-5. | C5.1 |
| N5-06 | QCM | Main `KS QS` · Tableau `AC 8D 3S KH 2C` | Vos deux cartes : K♠ Q♠ ; tableau de 5 cartes (river) : A♣ 8♦ 3♠ K♥ 2♣. | À la river, dans quelle catégorie de range classez-vous cette main ? [Forte · Moyenne · Bluff] | Moyenne | Paire de rois. | C5.1 |
| N5-07 | VF | Tableau `AC 8D 3S KH` | Tableau de 4 cartes (turn) : A♣ 8♦ 3♠ K♥. | Un joueur serré relance UTG, mise le flop A-8-3, puis gros au turn K. Votre A9 est probablement devant. | Faux | Sa range : AK, AQ, brelans, peut-être AJ. | C5.2 |

### Avantage de range (C5.3) — UTG a relancé, la BB a payé

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N5-08 | QCM | UTG relance, la BB paie · Tableau `AS KD 4C` | Tableau de 3 cartes (flop) : A♠ K♦ 4♣ ; bandeau : « UTG relance, la BB paie ». | UTG a relancé, la grosse blind a payé. Sur ce flop, qui a l'avantage de range ? [Le relanceur UTG · La BB] | Le relanceur UTG | Ses As et ses Rois forts. | C5.3 |
| N5-09 | QCM | UTG relance, la BB paie · Tableau `7S 6D 5H` | Tableau de 3 cartes (flop) : 7♠ 6♦ 5♥ ; bandeau : « UTG relance, la BB paie ». | UTG a relancé, la grosse blind a payé. Sur ce flop, qui a l'avantage de range ? [Le relanceur UTG · La BB] | La BB | Petites cartes liées : la range large de la BB. | C5.3 |
| N5-10 | VF | | | Sur un tableau donné, le joueur qui a l'avantage de range doit miser plus souvent. | Vrai | | C5.3 |

### Profils adverses (C5.4)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N5-11 | QCM | | | Un adversaire a un VPIP de 18 % et un AF de 1. Quel est son profil ? [Serré-passif · Large-passif · Serré-agressif · Large-agressif] | Serré-passif | VPIP sous 25 %, AF sous 1,5 : le rock. | C5.4 |
| N5-12 | QCM | | | Un adversaire a un VPIP de 45 % et un AF de 0,8. Quel est son profil ? [Serré-passif · Large-passif · Serré-agressif · Large-agressif] | Large-passif | La calling station. | C5.4 |
| N5-13 | QCM | | | Un adversaire a un VPIP de 20 % et un AF de 3. Quel est son profil ? [Serré-passif · Large-passif · Serré-agressif · Large-agressif] | Serré-agressif | Le TAG. | C5.4 |
| N5-14 | QCM | | | Un adversaire a un VPIP de 50 % et un AF de 4. Quel est son profil ? [Serré-passif · Large-passif · Serré-agressif · Large-agressif] | Large-agressif | Le maniaque. | C5.4 |
| N5-15 | VF | | | Contre une calling station (large-passif, qui paie tout), on bluffe souvent. | Faux | Jamais : elle paie tout. On mise gros pour la valeur. | C5.4 |
| N5-16 | QCM | | | Un joueur serré-passif (rock) relance. Vous avez une main moyenne : que faites-vous ? [Suivre · Se coucher · Sur-relancer] | Se coucher | | C5.4 |
| N5-17 | QCM | | | Contre un maniaque (large-agressif), avec une main moyenne, que faites-vous ? [Le laisser bluffer et payer · Le bluffer · Se coucher] | Le laisser bluffer et payer | Il mise et relance tout. | C5.4 |
| N5-18 | NUM | | | Un joueur est serré si son VPIP est sous quel pourcentage ? | 25 | Large : au-dessus de 35 %. | C5.4 |
| N5-19 | NUM | | | Un joueur est agressif si son AF (facteur d'agressivité) dépasse quelle valeur ? | 2,5 | Passif : sous 1,5. | C5.4 |
| N5-20 | AUTO | | | Que signifie le sigle PFR ? | Preflop raise : part des mains relancées préflop | Avec VPIP et AF, les trois statistiques du début. | C5.4 |

### Bankroll et tilt (C5.5, C5.6)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N5-21 | NUM | | | En cash-game, combien de tapis complets faut-il au minimum dans sa bankroll ? | 30 | Un tapis complet = 100 BB. | C5.5 |
| N5-22 | NUM | | | En cash-game avec une grosse blind à 0,10 €, quelle bankroll minimale (€) faut-il ? | 300 | 30 × 100 × 0,10. | C5.5 |
| N5-23 | NUM | | | En tournois, combien de droits d'entrée faut-il au minimum dans sa bankroll ? | 100 | | C5.5 |
| N5-24 | NUM | | | Pour des tournois à 5 €, quelle bankroll minimale (€) faut-il ? | 500 | 100 × 5. | C5.5 |
| N5-25 | VF | | | Quand la bankroll passe sous le seuil, on redescend de limite. | Vrai | Dès qu'elle passe sous le seuil. | C5.5 |
| N5-26 | VF | | | Vous jouez pour « vous refaire » : il faut continuer la session. | Faux | C'est le tilt : on arrête. | C5.6 |

---

## Niveau 6 — Vers le GTO

### Défense minimale et équilibre (C6.1)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N6-01 | NUM | | | Face à une mise pot, quelle part minimale (%) de votre range devez-vous défendre (MDF) ? | 50 | pot ÷ (pot + mise) = 1 ÷ 2. | C6.1 |
| N6-02 | NUM | | | Face à une mise d'un demi-pot, quelle part minimale (%) de votre range devez-vous défendre (MDF) ? | 67 (± 1) | 1 ÷ 1,5. | C6.1 |
| N6-03 | NUM | | | Face à une mise d'un tiers de pot, quelle part minimale (%) de votre range devez-vous défendre (MDF) ? | 75 (± 1) | 1 ÷ 1,33. | C6.1 |
| N6-04 | NUM | | | Face à une mise de deux fois le pot, quelle part minimale (%) de votre range devez-vous défendre (MDF) ? | 33 (± 1) | 1 ÷ 3. | C6.1 |
| N6-05 | NUM | | | Le pot fait 100, l'adversaire mise 25. Quelle part minimale (%) de votre range devez-vous défendre (MDF) ? | 80 | 100 ÷ 125. | C6.1 |
| N6-06 | QCM | | | À la river, avec une mise pot équilibrée, quelle part de vos mises sont des bluffs ? [1 sur 2 · 1 sur 3 · 1 sur 10] | 1 sur 3 | L'adversaire n'a alors aucun intérêt à changer. | C6.1 |
| N6-07 | VF | | | Une stratégie GTO joue toujours une même main de la même façon. | Faux | Elle mélange ses actions. | C6.1 |

### Exploiter (C6.4)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N6-08 | QCM | | | Votre adversaire paie trop souvent. Comment vous adaptez-vous ? [Bluffer plus · Bluffer moins] | Bluffer moins | Et miser plus gros pour la valeur. | C6.4 |
| N6-09 | QCM | | | Votre adversaire se couche trop souvent. Comment vous adaptez-vous ? [Bluffer plus · Bluffer moins] | Bluffer plus | | C6.4 |
| N6-10 | QCM | | | Face à vos mises pot, l'adversaire continue 30 % du temps. Comment vous adaptez-vous ? [Bluffer plus · Bluffer moins · Rester à l'équilibre] | Bluffer plus | MDF 50 % : il se couche trop. | C6.4 |
| N6-11 | QCM | | | Face à vos mises d'un demi-pot, l'adversaire continue 85 % du temps. Comment vous adaptez-vous ? [Bluffer plus · Bluffer moins · Rester à l'équilibre] | Bluffer moins | MDF 67 % : il paie trop. | C6.4 |

### Solveur et suivi (C6.2, C6.3, C6.5)

| ID | Type | Cartes | Image | Question | Réponse | Pourquoi | Section |
|---|---|---|---|---|---|---|---|
| N6-12 | QCM | | | Avant de regarder la réponse du solveur sur une situation, que faites-vous ? [Prédire sa stratégie · Lire toute la grille · Rien] | Prédire sa stratégie | Puis comparer et noter le plus gros écart. | C6.2 |
| N6-13 | NUM | | | Dans la revue de mains hebdomadaire, combien de gros pots perdus revoit-on ? | 20 | Et 10 pots gagnés. | C6.3 |
| N6-14 | NUM | | | Grosse blind à 1 € : vous gagnez 150 € sur 5 000 mains. Quel est votre BB/100 (grosses blinds gagnées pour 100 mains) ? | 3 | 150 BB ÷ 50. | C6.5 |
| N6-15 | NUM | | | Vous avez payé 1 000 € de droits d'entrée et encaissé 1 200 € de gains. Quel est votre ROI (%) ? | 20 | Gain net 200 ÷ 1 000. | C6.5 |
| N6-16 | NUM | | | En cash-game, combien de mains faut-il au minimum avant de juger ses résultats ? | 30 000 | La variance domine les petits échantillons. | C6.5 |
| N6-17 | NUM | | | En tournois, combien de tournois faut-il au minimum avant de juger ses résultats ? | 300 | | C6.5 |
| N6-18 | VF | | | Grosse blind à 0,10 € : vous avez gagné 40 € sur 8 000 mains. Cela suffit pour conclure que vous êtes gagnant. | Faux | 8 000 mains, sous les 30 000. | C6.5 |
