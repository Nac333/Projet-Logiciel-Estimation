---
name: estimation-evaluer-takeoff
description: "Evaluer la precision du takeoff automatique sur des plans de reference, avec pieces manquees, faux positifs, surfaces et temps de correction."
---

# Évaluation du takeoff IA

## Protocole
1. Définir l’usage, les critères obligatoires et leurs seuils avant l’essai. Aucun pourcentage universel n’est imposé. Identifier plans autorisés, modèle, paramètres, calibration, version du code, machine et runtime.
2. Séparer réglage et test par projet ou bâtiment, pas seulement par page, pour limiter les fuites. Constituer des annotations humaines indépendantes de la sortie IA : identifiant de pièce, contour et trous, unité, calibration, fini et exclusions confirmées séparément. Résoudre ou marquer les désaccords avant le verdict.
3. Inclure scans, PDF vectoriels, plans denses, ouvertures, murs interrompus, salles de bain et plusieurs échelles. Ne pas prétendre généraliser à tous les projets après quelques feuilles.
4. Mettre prédictions et références dans le même repère. Apparier les pièces une à une selon une règle fixée et un seuil IoU convenu. IoU = aire intersection / aire union. Une division ou fusion incorrecte ne doit pas masquer des pièces manquées.
5. Rapporter TP, FP, FN, précision TP/(TP+FP), rappel TP/(TP+FN), IoU par pièce, erreur absolue de surface et erreur relative pour les références d’aire positive. Si le dénominateur est nul, déclarer non défini selon le protocole, sans fabriquer 100 %.
6. Mesurer les erreurs par pièce ET par feuille, avec maximums et distributions : les erreurs opposées peuvent s’annuler au total. Séparer performance des contours, OCR, association de fini et quantités d’achat.
7. Mesurer temps de détection, mémoire si accessible et temps humain jusqu’au relevé accepté. Comparer au manuel avec tâches et conditions identiques; distinguer téléchargement initial, chargement et inférence. Ne pas inventer un gain de temps.
8. Conserver résultats bruts, annotations, provenance et commandes réellement exécutées. Examiner les images de superposition lorsqu’elles sont requises. Une capture ne remplace pas la vérification numérique. Marquer chaque critère RÉUSSI, ÉCHOUÉ ou NON EXÉCUTÉ.

## Verdict
Lire references/cas-reference.md et produire un bilan limité au jeu évalué. Ne pas modifier les seuils après observation pour obtenir la réussite. Une modification du modèle ou des paramètres exige une nouvelle évaluation; ne pas réutiliser les résultats précédents comme preuves nouvelles.

## Cadre commun
Répondre en français et examiner les instructions et le code existants avant une modification. Préserver les travaux de l’utilisateur. Adapter l’architecture à l’existant; ne pas imposer React, un serveur ou un fournisseur IA.
Distinguer spécification, prototype et fonction réellement vérifiée. Ne déclarer un contrôle réussi qu’après exécution; signaler séparément ÉCHOUÉ et NON EXÉCUTÉ. Définir les résultats attendus avant de programmer. Respecter les permissions et ne pas envoyer de plans à un tiers ni engager de frais sans autorisation spécifique.
Utiliser REA – Analyse logiciel pour les comportements observables de PlanSwift et Togal AI. Produire une implémentation indépendante. Une compétence fournit une méthode; elle ne constitue pas un moteur de détection installé.
