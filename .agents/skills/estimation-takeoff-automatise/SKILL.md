---
name: estimation-takeoff-automatise
description: "Developper et diagnostiquer le releve automatise d'Estimation pour pieces, murs, ouvertures, OCR, segmentation et contours editables; ne pas confondre mesures assistees et detection IA."
---

# Takeoff automatisé de plans

## Méthode
1. Définir la sortie avant le choix technique : contours des pièces à l’intérieur des murs, feuille et révision source, statuts, provenance, paramètres et version du modèle. Distinguer détection des pièces, lecture des noms, reconnaissance des finis et calcul des surfaces.
2. Évaluer l’extraction vectorielle pour les PDF qui le permettent et une chaîne de vision pour les scans. Prétraiter résolution, inclinaison, bruit et raccord des tuiles en conservant la transformation vers le repère original. Ne jamais assimiler un rectangle englobant à un contour de pièce.
3. Définir une interface commune pour les moteurs : entrée feuille et options, sortie propositions avec géométrie, statut, provenance et avertissements. Versionner les dépendances et modèles. Prévoir erreur, annulation, progression et résultats partiels. Ne pas choisir une API externe par défaut.
4. Utiliser Transformers.js seulement si le modèle, ses tâches et son format sont compatibles et vérifiés. Un modèle général de segmentation n’est pas réputé reconnaître les pièces. Vérifier licence, taille, mémoire, runtime et qualité sur les plans d’essai avant intégration.
5. Convertir masques et sorties en polygones éditables avec trous, sans chevauchements parasites ni perte de repère. Signaler portes ouvertes, murs interrompus, pièces contiguës et zones ambiguës; conserver une correction manuelle.
6. Traiter OCR et noms comme propositions avec source. Ne pas transformer automatiquement un nom de pièce en code de fini. Les baignoires et douches ne sont exclues qu’après confirmation du périmètre et du fini concerné.
7. Afficher proposé, accepté comme contour et refusé. Séparer validation du contour et validation du fini. Les propositions et brouillons n’alimentent jamais les achats. Une modification du plan, de la calibration ou du contour déclenche la revalidation des résultats concernés.
8. Démontrer sur des plans représentatifs autorisés, puis utiliser estimation-evaluer-takeoff pour comparer aux annotations de référence. Un bouton, des polygones préenregistrés ou une animation ne démontrent pas une détection.

## Réception
Lire references/cas-reference.md. Livrer méthode, limites, version du modèle, résultats effectivement obtenus et procédure de correction. Si les plans ou modèles manquent, livrer la spécification et indiquer que la détection reste NON EXÉCUTÉE.

## Cadre commun
Répondre en français et examiner les instructions et le code existants avant une modification. Préserver les travaux de l’utilisateur. Adapter l’architecture à l’existant; ne pas imposer React, un serveur ou un fournisseur IA.
Distinguer spécification, prototype et fonction réellement vérifiée. Ne déclarer un contrôle réussi qu’après exécution; signaler séparément ÉCHOUÉ et NON EXÉCUTÉ. Définir les résultats attendus avant de programmer. Respecter les permissions et ne pas envoyer de plans à un tiers ni engager de frais sans autorisation spécifique.
Utiliser REA – Analyse logiciel pour les comportements observables de PlanSwift et Togal AI. Produire une implémentation indépendante. Une compétence fournit une méthode; elle ne constitue pas un moteur de détection installé.
