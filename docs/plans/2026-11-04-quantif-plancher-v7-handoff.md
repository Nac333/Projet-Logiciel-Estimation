# Quantif Plancher V7 — Plan d'amélioration et transfert Codex

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire évoluer `Quantif-Plancher-V7.html` en logiciel web hybride inspiré des comportements observables de PlanSwift et Togal AI, spécialisé dans l'estimation automatique des revêtements de plancher, céramique, tapis, plinthes, moulures, dosserets, douches et bains-douches.

**Architecture:** Préserver l'application HTML autonome actuelle et ses fonctions existantes. Ajouter les nouvelles fonctions par modules logiques limités dans le fichier existant, avec géométrie éditable, détection automatique proposée, calculs métier séparés de la détection et validation manuelle disponible. Ne pas réarchitecturer en React, ne pas imposer de serveur ni d'API payante.

**Tech Stack:** HTML/CSS/JavaScript autonome existant, PDF.js ou composants déjà présents dans V7, Playwright pour les tests E2E si disponible, compétences Estimation installées dans le dépôt.

## Global Constraints

- Ne pas casser ni supprimer les fonctions existantes de `Quantif-Plancher-V7.html`.
- Travailler à partir de la branche expérimentale actuelle `essai-html-2026-10-26-ea71f768`, pas directement sur `main`.
- La branche expérimentale est actuellement divergente de `main`; elle contient 10 commits d'avance et 2 commits de retard. Ne pas fusionner `main` aveuglément.
- Aucun abonnement, API payante, crédit facturable ou service externe à coût variable sans approbation explicite.
- Préférer traitement local et navigateur.
- Distinguer clairement : détection, contour accepté, fini accepté, calcul de quantité, quantité à commander.
- Toute détection automatique doit conserver une provenance et un statut `à vérifier` lorsqu'une information n'est pas certaine.
- Les détails et indications explicites de l'architecte/designer ont priorité sur les règles par défaut.
- Les plans, coupes, élévations et détails doivent être recoupés entre feuilles quand nécessaire.
- Les calculs de céramique et tapis en carreaux utilisent les dimensions nominales des carreaux; ne pas ajouter l'épaisseur des joints dans le calcul standard.
- Conserver une possibilité de vérification manuelle, mais l'objectif produit est de réduire au minimum l'intervention de l'estimateur.

---

## 1. Vision produit confirmée

Le logiciel doit combiner deux approches :

- **PlanSwift-like** : visionneuse PDF, ruban/outils de takeoff, arborescence de feuilles, calibration, sélection, édition de contours, bibliothèque de finis, tableau de quantités, raccourcis clavier.
- **Togal AI-like** : analyse automatique des feuilles, propositions de contours, détection de pièces, reconnaissance des zones, regroupement de logements répétitifs et génération automatique des quantités.

L'application doit rester utilisable sur le web, idéalement en HTML autonome sans installation pour l'utilisateur final.

### Couleurs métier convenues

- Revêtement principal / vinyle : conserver le code couleur existant, actuellement vert.
- Zones déjà utilisées en bleu dans l'application : ne pas les réassigner sans vérifier l'existant.
- **Dosserets cuisine : orange**, pour les distinguer immédiatement du plancher et des autres surfaces.
- Les couleurs doivent être semi-transparentes afin de garder le plan lisible.

---

## 2. Échelle et calibration par feuille

### Détection automatique

À l'import d'un PDF, analyser le texte de chaque feuille pour rechercher une échelle explicite, par exemple :

- `1/4" = 1'-0"`
- `3/8" = 1'-0"`
- autres échelles architecturales ou métriques.

Chaque feuille conserve sa propre échelle.

### Règles

- Si une seule échelle explicite est trouvée et cohérente, la proposer automatiquement.
- Statut initial : **Détectée automatiquement — à vérifier**.
- Si la feuille indique `Comme indiqué`, contient plusieurs vues avec des échelles différentes, ou si l'échelle est ambiguë : ne pas calibrer toute la feuille aveuglément.
- Prévoir calibration manuelle par 2 points sur une cote connue.

### Interface demandée

Fenêtre `Échelle` avec champs séparés :

- Pieds
- Pouces
- Numérateur de fraction
- Dénominateur de fraction

Exemple : `20 pi | 6 po | 3 / 16`.

Prévoir aussi :

- onglet Auto;
- standards architecturaux;
- métrique;
- bouton `Vérifier avec 2 points`;
- écart mesuré en %;
- `Valider sans modifier`;
- `Recalibrer sur cette cote`.

Une modification d'échelle doit invalider/recalculer les surfaces et longueurs dérivées de la feuille concernée.

---

## 3. Sélection, suppression et raccourcis clavier

Améliorer l'ergonomie PlanSwift-like.

### Raccourcis confirmés

- `Ctrl + clic` : ajouter/retirer un objet à la sélection.
- `Maj + clic` dans la liste : sélectionner une plage.
- `Ctrl + A` : sélectionner tous les objets de la feuille active seulement.
- `Suppr` / `Retour arrière` :
  - si objets sélectionnés : supprimer la sélection;
  - si tracé en cours : retirer seulement le dernier point.
- `Ctrl + Z` : annuler.
- `Ctrl + Y` ou `Ctrl + Maj + Z` : rétablir.
- `Échap` : annuler le tracé en cours, fermer une fenêtre ou désélectionner.
- `Entrée` / double-clic : terminer un tracé.
- `Tab` / `Maj + Tab` lorsque le plan a le focus : objet suivant/précédent.
- `F2` : renommer la mesure sélectionnée.

### Sécurité

Ne jamais déclencher `Suppr`, `Ctrl+A` ou autres raccourcis de plan lorsqu'un champ texte, nombre ou formulaire est actif.

Prévoir rectangle de sélection par glisser sur une zone vide du plan.

---

## 4. Fenêtre de configuration avant détection automatique

Avant de lancer `Détecter les surfaces`, ouvrir une fenêtre de configuration.

Conserver les choix déjà présents dans V7, notamment :

- revêtement de plancher principal;
- salles de bain;
- salles de lavage séparées;
- autres catégories déjà existantes.

### Nouvelle section distincte

Ajouter une **nouvelle case/section `Dosseret cuisine`**, sans la cacher dans `Autres finis`.

Paramètres :

- actif / inactif;
- format de céramique;
- hauteur de dosseret, en pouces ou pieds/pouces/fraction;
- `Hotte : incluse / non incluse`.

Objectif : l'utilisateur configure les règles avant l'analyse, puis la détection fonctionne automatiquement.

---

## 5. Dosserets cuisine automatiques

### Source de vérité

Analyser toutes les feuilles du PDF et rechercher :

- plans agrandis de cuisine;
- élévations de cuisine;
- détails de cuisine;
- cotes de hauteur et largeur;
- emplacement de hotte;
- forme réellement dessinée du dosseret.

### Réutilisation

Quand une élévation de cuisine est reconnue comme type de référence :

- l'associer aux unités correspondantes;
- appliquer automatiquement la même logique aux unités répétitives;
- reconnaître les versions en miroir lorsque la géométrie est inversée.

### Géométrie

Le contour du dosseret doit être créé automatiquement en orange.

Exemple de règle utilisateur :

- hauteur principale : ex. `1'-6"` ou `16"`;
- si `Hotte non incluse` : dosseret rectangulaire à hauteur constante;
- si `Hotte incluse` : détecter la zone de hotte et suivre automatiquement la remontée dessinée; exemple courant discuté : ajouter environ 12 po de hauteur dans la zone de hotte, puis redescendre et fermer le polygone.

**Important :** si l'élévation architecturale montre une forme ou une hauteur différente, suivre le dessin réel plutôt que la règle générique.

Si aucune élévation exploitable n'existe, ne pas inventer la largeur de hotte ou la forme; produire une proposition marquée `à vérifier`.

---

## 6. Douches et bains-douches — analyse multi-feuilles

Appliquer le même principe que pour les dosserets aux salles de bain.

### Sources à analyser

- plans agrandis de salle de bain;
- élévations A/B/C/D;
- détails de douche et bain-douche;
- coupes de bâtiment;
- élévations générales;
- notes et cotes de hauteur.

### Fonctionnement

Pour chaque type de douche/bain-douche :

1. reconnaître la configuration;
2. identifier les murs concernés;
3. rassembler les élévations A/B/C/D correspondantes;
4. calculer la surface murale totale de céramique;
5. appliquer le type aux unités identiques ou en miroir;
6. conserver le niveau/étage de chaque occurrence.

### Hauteurs par niveau

Ne jamais supposer qu'une même douche a la même surface à tous les étages.

Exemple métier confirmé :

- RDC : hauteur libre 9 pi;
- étages : hauteur libre 8 pi.

Si la céramique va jusqu'au plafond, la quantité doit donc changer selon l'étage.

### Priorité des hauteurs

Ordre de priorité :

1. hauteur explicitement cotée sur le détail/élévation de la douche;
2. note spécifique de finition;
3. hauteur du niveau lue dans les coupes/élévations de bâtiment;
4. seulement si aucune donnée exploitable : résultat `hauteur à vérifier`.

Une hauteur générale de niveau ne doit pas écraser une hauteur spécifique de céramique.

---

## 7. Point de départ, grille et motif de céramique

Le logiciel ne doit pas choisir arbitrairement le point de départ si l'architecte ou le designer l'a défini.

### Priorité

1. **Point de départ explicitement indiqué** : respecter exactement.
2. Sinon, si le dessin montre une grille/calepinage : détecter son axe, orientation et décalage et reproduire la grille.
3. Sinon seulement : proposer un calepinage standard interne, avec statut `inféré`.

Le même principe s'applique à :

- céramique au plancher;
- céramique murale;
- douches;
- bains-douches;
- dosserets.

Un détail spécial doit toujours passer avant l'optimisation des chutes.

---

## 8. Fractionnement de surface et grille de carreaux

Après attribution d'un format, par exemple :

- 12 x 24;
- 24 x 24;
- 24 x 48;
- autres formats configurés,

le logiciel doit projeter une grille nominale dans le polygone de surface et calculer les carreaux/coupes nécessaires.

### Exemple confirmé

Surface linéaire de 60 po avec tuile de 24 po :

- 24 + 24 + 12;
- donc 2 tuiles complètes + 1 demi-tuile.

La grille doit suivre le point de départ et le motif architectural détectés.

### Joints

En mode estimation standard :

- utiliser les dimensions nominales;
- ne pas ajouter l'épaisseur des joints;
- ne pas compliquer le calcul avec les dimensions réelles de fabrication (ex. 11 7/8 x 23 7/8).

Prévoir éventuellement un `calepinage détaillé` séparé pour les cas spéciaux, mais il ne doit pas alourdir le calcul standard.

---

## 9. Réutilisation des coupes / chutes

Le moteur doit réutiliser les morceaux compatibles avant d'ouvrir une nouvelle tuile.

### Règle confirmée pour demi-tuiles

- 2 demi-tuiles = 1 tuile complète consommée.
- 13 demi-tuiles = `ceil(13 / 2) = 7` tuiles à commander.
- Exemple : 10 tuiles complètes + 13 demi-tuiles = 17 tuiles.

Cette logique doit être exacte pour les demi-tuiles.

### Extension recommandée

Pour les autres fractions, utiliser un inventaire simple des chutes compatibles par format et orientation, mais ne pas prétendre à une optimisation globale parfaite tant qu'elle n'est pas démontrée par tests.

La réutilisation ne doit jamais modifier un motif ou un point de départ imposé par l'architecte.

---

## 10. Calcul de quantité avec pertes — céramique

Pour la céramique, la quantité avec pertes doit être dérivée du nombre réel de tuiles nécessaires, pas d'un pourcentage arbitraire ajouté au départ.

### Surface nominale par tuile

Formule :

`surface_tuile_pi2 = (largeur_po × longueur_po) / 144`

Exemples :

- 12 x 12 = 1 pi²;
- 12 x 24 = 2 pi²;
- 24 x 24 = 4 pi²;
- 24 x 48 = 8 pi²;
- 18 x 36 = 4,5 pi².

### Quantité avec pertes

`quantité_avec_pertes_pi2 = nombre_tuiles_requises × surface_nominale_tuile_pi2`

### Pourcentage de perte final confirmé

Utiliser la définition finale validée dans la conversation :

`perte_% = ((quantité_avec_pertes - quantité_nette) / quantité_nette) × 100`

Exemple : 100 pi² nets et 108 pi² requis = 8 %.

Ne pas utiliser par défaut un 10 % ou 15 % arbitraire pour la céramique lorsque le calepinage par tuile est disponible.

### Champ d'application

Même logique pour :

- céramique de plancher;
- céramique murale;
- douches;
- bains-douches;
- dosserets.

Séparer ensuite le nombre de boîtes/commande si le conditionnement fabricant impose un arrondi supplémentaire.

---

## 11. Tapis en carreaux

Le tapis en carreaux suit le même principe de calcul par carreau que la céramique :

- grille selon format;
- carreaux complets;
- morceaux;
- réutilisation de coupes compatibles;
- quantité avec pertes dérivée des carreaux réellement consommés;
- % de perte calculé à partir du net.

Le **tapis en rouleau** est un autre moteur : largeur de rouleau, lés, sens, raccords, coutures et réutilisation des chutes. Ne pas appliquer la logique carreau au rouleau.

---

## 12. Détection des surfaces et fragmentation

Améliorer la détection automatique des contours :

- contour intérieur des murs;
- pièces irrégulières;
- portes ouvertes;
- murs interrompus;
- zones imbriquées;
- exclusions;
- séparation de plusieurs finis dans une même pièce.

Pour une salle avec une zone de céramique dans un plancher principal :

- produire de vraies géométries séparées;
- soustraire la céramique de la surface principale;
- éviter les superpositions et doubles comptes.

Les surfaces proposées restent éditables.

---

## 13. Regroupement et répétition des logements

Le logiciel doit exploiter les répétitions :

- unités identiques;
- unités en miroir;
- mêmes cuisines;
- mêmes salles de bain;
- mêmes douches/bains-douches.

Mais il doit conserver les différences de niveau, notamment les hauteurs de plafond.

Réutiliser une géométrie de type ne signifie pas recopier une quantité finale si la hauteur, le fini ou le détail diffère.

---

## 14. Traçabilité des décisions automatiques

Pour chaque résultat automatique important, conserver :

- feuille source;
- type de vue : plan, élévation, coupe, détail;
- nom/code de la pièce si détecté;
- niveau/étage;
- géométrie;
- format de produit;
- point de départ/grille détecté;
- hauteur utilisée et sa provenance;
- statut : proposé / accepté / à vérifier;
- avertissements.

L'estimateur doit pouvoir comprendre pourquoi une quantité a été calculée.

---

## 15. Export et résultats

Conserver/étendre l'export Excel pour inclure au minimum :

- superficies nettes;
- quantité avec pertes;
- % de perte calculé;
- nombre de tuiles/carpet tiles;
- nombre de boîtes si conditionnement connu;
- étage;
- unité;
- type de pièce;
- fini;
- format;
- source/provenance pour les résultats automatiques;
- dosserets;
- douches;
- bains-douches;
- plinthes et moulures.

Les totaux affichés dans l'interface et les exports doivent être identiques.

---

## 16. Plan d'implémentation recommandé

### Task 1: Stabiliser la base et intégrer les tests Playwright

**Files:**
- Modify: `Quantif-Plancher-V7.html`
- Reuse from branch: `codex/add-playwright-tests-20261023`
- Proposed tests: `tests/e2e/*.spec.mjs`

**Interfaces:**
- Consumes: état actuel de la branche `essai-html-2026-10-26-ea71f768`.
- Produces: base testable sans modification fonctionnelle visible.

- [ ] Importer/adopter le harnais Playwright existant sans écraser le V7 expérimental.
- [ ] Ajouter des tests de démarrage, import PDF, ouverture des fenêtres principales et sauvegarde.
- [ ] Vérifier que les tests existants passent avant toute nouvelle fonction.
- [ ] Ne pas fusionner `main` aveuglément; intégrer uniquement les fichiers de test nécessaires.

### Task 2: Calibration automatique et interactions clavier

**Files:**
- Modify: `Quantif-Plancher-V7.html`
- Test: `tests/e2e/scale-and-selection.spec.mjs` (proposé)

**Interfaces:**
- Consumes: texte PDF par feuille, objets de takeoff existants.
- Produces: `sheetScale` par feuille avec source, statut et facteur; sélection multiple cohérente.

- [ ] Détecter les expressions d'échelle.
- [ ] Ajouter pieds/pouces/fraction.
- [ ] Ajouter vérification 2 points et recalibrage.
- [ ] Ajouter les raccourcis clavier confirmés.
- [ ] Tester que les raccourcis ne s'activent pas dans les champs de formulaire.

### Task 3: Configuration pré-analyse et moteur dosseret

**Files:**
- Modify: `Quantif-Plancher-V7.html`
- Test: `tests/e2e/backsplash.spec.mjs` (proposé)

**Interfaces:**
- Consumes: options utilisateur + feuilles classées comme plan/élévation/détail.
- Produces: propositions de dosserets orange, avec géométrie et provenance.

- [ ] Ajouter section `Dosseret cuisine`.
- [ ] Ajouter format, hauteur, hotte incluse/non incluse.
- [ ] Détecter les élévations cuisine.
- [ ] Réutiliser la configuration pour unités identiques/miroir.
- [ ] Tester rectangle simple et remontée de hotte.

### Task 4: Douches, bains-douches et hauteurs par niveau

**Files:**
- Modify: `Quantif-Plancher-V7.html`
- Test: `tests/e2e/bathroom-elevations.spec.mjs` (proposé)

**Interfaces:**
- Consumes: plans agrandis, élévations A/B/C/D, coupes et niveaux.
- Produces: surfaces murales par occurrence, niveau et source de hauteur.

- [ ] Classifier les vues.
- [ ] Associer les élévations à un type de salle de bain.
- [ ] Combiner les murs concernés.
- [ ] Lire les hauteurs spécifiques puis les hauteurs de niveau.
- [ ] Appliquer aux unités répétitives sans perdre les différences d'étage.
- [ ] Tester un même type avec RDC 9 pi et étage 8 pi.

### Task 5: Calepinage, point de départ et calcul par tuile

**Files:**
- Modify: `Quantif-Plancher-V7.html`
- Test: `tests/e2e/tile-layout.spec.mjs` (proposé)

**Interfaces:**
- Consumes: polygone, format nominal, orientation, point de départ/grille.
- Produces: grille, carreaux complets, coupes, inventaire de chutes, quantité avec pertes.

- [ ] Respecter point de départ explicite.
- [ ] Sinon détecter grille dessinée.
- [ ] Sinon produire une grille standard marquée `inférée`.
- [ ] Calculer 60 po avec tuile 24 po = 2 complètes + 1 demi.
- [ ] Réutiliser les demi-tuiles.
- [ ] Calculer surface nominale, quantité avec pertes et % final.
- [ ] Réutiliser le moteur pour céramique sol/mur/dosseret/douche.

### Task 6: Tapis en carreaux, exports et contrôles de cohérence

**Files:**
- Modify: `Quantif-Plancher-V7.html`
- Test: `tests/e2e/export-and-carpet-tile.spec.mjs` (proposé)

**Interfaces:**
- Consumes: moteur de grille/quantité de Task 5.
- Produces: carpet tile quantifié; exports cohérents.

- [ ] Appliquer la logique par carreau au tapis en carreaux.
- [ ] Conserver le moteur rouleau séparé.
- [ ] Étendre l'export Excel.
- [ ] Vérifier égalité interface/export.
- [ ] Tester sauvegarde/rechargement des nouvelles données.

---

## 17. Jeux de tests de réception minimum

1. **Échelle** : feuille `1/4" = 1'-0"`, détection auto + vérification 34 pi.
2. **Dosseret simple** : hauteur 18 po, hotte non incluse, rectangle.
3. **Dosseret avec hotte** : même base + remontée détectée dans la zone hotte.
4. **Cuisine miroir** : contour reflété sans erreur de surface.
5. **Douche identique, hauteurs différentes** : RDC 9 pi vs étage 8 pi.
6. **Hauteur spécifique** : détail de douche à 7 pi doit avoir priorité sur plafond 9 pi.
7. **Point de départ explicite** : grille alignée sur le repère architecte.
8. **Grille sans note** : reproduire la grille dessinée.
9. **12 x 24 sur 60 po** : 2 tuiles + 1 demi par rangée.
10. **13 demi-tuiles** : 7 tuiles consommées.
11. **Perte céramique** : `((avec_pertes - net) / net) × 100`.
12. **24 x 24** : surface nominale 4 pi² par tuile.
13. **24 x 48** : surface nominale 8 pi² par tuile.
14. **Tapis en carreaux** : même moteur de comptage/coupes.
15. **Double compte** : une zone céramique soustraite du plancher principal ne doit pas être comptée deux fois.
16. **Clavier** : Suppr ne doit jamais supprimer un objet si l'utilisateur tape dans un champ.
17. **Export** : total interface = total Excel.
18. **Persistance** : sauvegarde/rechargement conserve échelle, grille, source, statut et quantités.

---

## 18. État actuel du dépôt au moment du transfert

- Dépôt : `Nac333/Projet-Logiciel-Estimation`.
- Branche par défaut : `main`.
- Cible de travail recommandée : `essai-html-2026-10-26-ea71f768`.
- `Quantif-Plancher-V7.html` existe dans `main`, mais la branche expérimentale contient des changements importants plus récents.
- Comparaison au 2026-11-04 : branche expérimentale 10 commits en avance et 2 en retard par rapport à `main`; seul `Quantif-Plancher-V7.html` diffère dans cette comparaison.
- Les tests Playwright historiques se trouvent sur `codex/add-playwright-tests-20261023`; les intégrer prudemment sans remplacer le HTML expérimental.
- Les instructions de travail sont dans `AGENTS.md`.
- Les compétences Estimation disponibles sont déjà référencées dans `AGENTS.md`.

---

## 19. Instruction de démarrage pour Codex

À utiliser au début de la prochaine session Codex :

> Lis `AGENTS.md` puis `docs/plans/2026-11-04-quantif-plancher-v7-handoff.md`. Travaille à partir de la branche `essai-html-2026-10-26-ea71f768`, jamais directement sur `main`. Commence par vérifier l'état réel de `Quantif-Plancher-V7.html` et du harnais Playwright. Exécute le plan tâche par tâche, avec petits changements réversibles et tests ciblés. Ne remplace aucune fonction existante sans preuve qu'elle est couverte. Utilise les compétences `$estimation-takeoff-automatise`, `$estimation-plans-geometrie`, `$estimation-calculs-calepinage`, `$estimation-evaluer-takeoff` et `$rea-analyse-logiciel` selon le sous-problème. Aucun service payant ou envoi de plans à un tiers sans autorisation explicite. Avant chaque affirmation de réussite, exécute les tests et rapporte RÉUSSI, ÉCHOUÉ ou NON EXÉCUTÉ.

---

## 20. Décisions encore ouvertes

Ces points ne doivent pas être inventés par Codex; ils doivent être proposés ou confirmés avant de figer le comportement :

- valeur exacte par défaut de la hauteur de dosseret si aucun détail ni paramètre utilisateur n'existe;
- règle générale de remontée sous hotte si l'élévation ne donne aucune cote exploitable;
- algorithme de réutilisation pour fractions autres que demi-tuile;
- seuil de confiance à partir duquel une association unité ↔ élévation peut être appliquée automatiquement sans confirmation;
- comportement par défaut lorsqu'aucun point de départ ni aucune grille n'est visible;
- stratégie de regroupement des chutes entre pièces, logements, étages ou projet complet.

