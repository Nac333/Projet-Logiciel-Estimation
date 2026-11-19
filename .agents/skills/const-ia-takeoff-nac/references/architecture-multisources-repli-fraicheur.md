# Retour d'analyse — Travel Hacking Toolkit : motifs transférables à NAC / Quantif Plancher V7

**Source analysée :** https://github.com/borski/travel-hacking-toolkit (branche `main`; dernier commit observé `d10f6cae5027879872ffa244fcd2f99d6dd5cbfe`, 16 novembre 2026). Dépôt publié sous licence MIT (copyright 2026 Michael Borohovski). Sources ouvertes : `README.md`, `plugins/travel-hacking-toolkit/.codex-plugin/plugin.json`, `plugins/travel-hacking-toolkit/.mcp.json`, `plugins/travel-hacking-toolkit/skills/{trip-planner,compare-flights,trip-calculator,fallback-and-resilience,gardening}/SKILL.md`, `scripts/check-data-freshness.sh` et `scripts/smoke-test.sh`. Ce document adapte **des pratiques générales**, sans réutiliser le code ou les flux du voyage.

## Constat sur le dépôt d'origine (observé dans les fichiers)

- Catalogue d'environ **42 skills selon le README**, et plusieurs MCP de voyages : vols, hôtels, points, réservation et suivi. Le dossier de skills contient aussi des références, des orchestrateurs et des calculateurs.
- `trip-planner` lance plusieurs recherches (trajets aller/retour, hôtels) et consolide un résultat unique; `compare-flights` documente une matrice des sources avec statuts succès, erreur et « ignoré : raison ».
- `fallback-and-resilience` documente le remplacement d'un outil défaillant et oblige à déclarer la source de repli. **Cette structure d'escalade** nous intéresse, pas les services d'aviation cités.
- `scripts/check-data-freshness.sh` examine `_meta.last_updated` et `_meta.staleness_days` dans des JSON et signale les données périmées.
- `scripts/smoke-test.sh` comporte des contrôles statiques de déclarations de skills, dépendances, configuration et ancienneté des fichiers de données.
- Le plugin complet est **hors périmètre** du takeoff : les MCP publics du dépôt traitent les voyages, certaines fonctions nécessitent une clé ou un compte payant (par ex. Seats.aero Pro, AwardWallet Business, LiteAPI), et des skills utilisent Docker / navigateur / comptes personnels.
- **Risque explicite** : le fichier `plugins/travel-hacking-toolkit/.mcp.json` référence des services distants et lance le composant Airbnb avec `--ignore-robots-txt`. Ne pas copier ces configurations, ni installer des extensions de navigateur, tenter de contourner des accès, exécuter des scripts curl PowerShell ou transmettre des données de construction en dehors du poste.
- Les commandes `codex plugin marketplace add borski/travel-hacking-toolkit` et `setup-keys.sh/.ps1` existent dans le README ; **ne pas les lancer pour V7**. Ni 42 skills ni les 7 MCP de voyage ne sont installés dans Estimation.

## Adaptation originale pour NAC : orchestration multi-source et gestion des limites

**Principe 1 — matrice des sources.** Pour chaque fonctionnalité de détection automatique, établir une fiche source indiquant :
- rôle (ex. PDF vectoriel, pixels raster, OCR local, annotation/texte du devis, page de design, mesure indépendante);
- entrée exacte (fichier, empreinte, feuille, révision, unités, échelle, source autorisée);
- constat vérifié et limites du moteur;
- statut `RÉUSSI`, `ÉCHEC`, `NON EXÉCUTÉ`, `ABSENT` ou `À CONFIRMER`.

**Principe 2 — stratégie primaire et repli.**
- **PDF vectoriel** : extraire les objets si la géométrie et la calibration sont valides. Si la structure n'est pas exploitable, proposer un rendu raster local puis segmentation suggérée et tracé manuel confirmé.
- **Scan PDF** : segmentation locale et vérification de l'échelle; OCR local des étiquettes seulement si disponible. Si l'OCR manque, traiter comme `OCR INDISPONIBLE` ; **jamais d'envoi de plan vers une API hébergée par défaut**.
- **Contours/fermetures incertains** : conserver le contour et la mesure d'origine; demander une correction humaine (ne pas « deviner » une salle de bain ou un trou).
- **Nomenclature/design manquants** : déclarer `FINI À CONFIRMER` ; ne pas substituer automatiquement un produit ou extrapoler une finition.
- **MCP non disponible** : utiliser les calculs locaux dont la provenance et les règles sont vérifiées; sinon signaler que le contrôle externe est indisponible.

**Principe 3 — fraîcheur / obsolescence.** Chaque plan devrait porter au minimum une empreinte de contenu, numéro de feuille, date ou code de révision si disponible, unités/calibration vérifiées et date du dernier relevé. À chaque révision, marquer les contours et quantités dépendants comme `À REVALIDER`. Un délai arbitraire ne remplace pas l'identification d'une **nouvelle révision**. Les règles de TTL sont adaptées aux données externes (catalogues/prix), pas à une géométrie PDF inchangée.

**Principe 4 — comparaison indépendante.** Une mesure « confirmée par deux sorties » n'est pas indépendante si les deux outils utilisent la même image, la même échelle ou la même extraction. Pour les tests pilotes, comparer les polygones, superficies nettes et plinthes à un takeoff humain annoté indépendant, avec tolérances fixées **avant** les essais. Conserver erreurs, omissions, faux positifs et temps de correction.

**Principe 5 — consolidation traçable.** Pour une surface candidate :
`ID zone`, `page`, `empreinte PDF`, `révision`, `méthode primaire`, `méthode de repli`, `calibration`, `polygone`, `trous`, `superficie brute/nette`, `statut utilisateur`, `date de mesure`. Ne publier dans les calculs/export Excel que les **quantités acceptées**.

## Exemple de tableau de décision — à proposer à Codex, non implémenté

| Situation | Source primaire | Repli autorisé | Action attendue |
|---|---|---|---|
| PDF vectoriel avec contours cohérents | Extraction géométrique locale | Segmentation raster locale | Proposition modifiable ; contrôle d'échelle obligatoire |
| Scan 300 DPI / lignes incertaines | Segmentation raster locale | Tracé manuel | Mesure en attente ; signaler la confiance et les pièces manquées |
| Page de révision différente | Calage révision/empreinte et comparaison des changements | Relevé manuel de contrôle | Ne pas réutiliser silencieusement les anciennes quantités |
| OCR d'étiquettes manquant | OCR local déjà approuvé | Consultation humaine de la feuille | Fini à confirmer ; jamais OCR hébergé |
| Divergence 120 pi² attendu / surface calculée | Test géométrique sur rectangle 10 x 12 pi | Contrôle unité, échelle et contour | Blocage de l'acceptation de test si erreur non expliquée |

## À inclure dans « Ce qu'on a appris — NAC »

Ajouter une rubrique courte **« Fiabilité de nos sources et plans de repli »** lorsque la technique étudiée dépend d'un fournisseur, moteur PDF, OCR, serveur MCP ou jeu de données susceptible d'échouer. Indiquer : source primaire, repli gratuit/local possible, date/versions, règle d'obsolescence, test réalisé, limites et conséquence sur la quantité finale. Ne pas modifier automatiquement la chaîne technique en production à partir d'un article de voyage.

## Statut et critères de réception

- `ÉTUDIÉ` : lecture des fichiers officiels du dépôt borski, licence MIT vérifiée.
- `INTÉGRÉ À LA COMPÉTENCE NAC` : règles de méthode et cette référence uniquement, après fusion GitHub / livraison de l'archive.
- `MOTEUR DE TAKEOFF INSTALLÉ` : **NON**. Aucune fonctionnalité de détection n'est apportée par ce dépôt.
- `TESTS MÉTIER EXÉCUTÉS` : **NON**. Les exemples ci-dessus sont des exigences pour une future réalisation Codex.

**Séparation des projets** : Quantif Plancher V7 / Codex exclusivement; AMTA / Claude Code reste distinct. Priorité absolue à la détection automatique de revêtements et au contrôle indépendant des quantités.
