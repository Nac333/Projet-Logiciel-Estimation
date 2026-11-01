---
name: estimation-calculs-calepinage
description: "Verifier les calculs Estimation de vinyle, tapis, ceramique, gym, plinthes, pertes, boites et calepinage de rouleaux."
---

# Calculs et calepinage des revêtements

## Calculs métier
1. Documenter produit, format, couleur, lot si requis, conditionnement, unité et provenance. Séparer surface nette posée, besoin avec pertes et quantité commandée. Ne pas cumuler pertes dans les quantités et dans les assemblages.
2. Utiliser uniquement les pertes fournies ou explicitement configurées. Si elles manquent, marquer le besoin et la commande incomplets; autoriser un scénario provisoire clairement identifié, sans le présenter comme commande validée. Aucun taux implicite de 6 %.
3. Fixer le regroupement par zone, logement réel, étage ou projet selon la décision de l’estimateur. Grouper seulement les produits compatibles; somme des besoins non arrondis dans chaque groupe puis plafond(besoin/couverture). Ne pas multiplier les boîtes d’un type de logement si la commande doit être groupée au projet.
4. Calculer pose et préparation sur la base propre à chaque poste, généralement nette, sans ajouter automatiquement les pertes d’achat. Distinguer coût direct, frais, majoration et marge sur vente; expliciter les taxes et leur base.
5. Calculer les rouleaux à partir des lés et de leur implantation : largeur disponible, sens, raccord de motif, marges aux extrémités, coutures et réutilisation des chutes. Une surface divisée par largeur ne constitue pas un calepinage validé. Ne pas ajouter de perte surfacique automatique aux coupes déjà majorées.
6. Paramétrer le départ, l’orientation, le joint et le motif de céramique. Déplacer le départ change les coupes et éventuellement la commande, jamais l’aire nette du contour. Ne pas promettre une optimisation globale sans preuve.
7. Séparer unités, céramique au sol, tapis, gym et parties communes. Associer plinthes, moulures et transitions au bon fini. Déduire les ouvertures du linéaire seulement selon les règles du projet.
8. Pour mural et dosserets, utiliser les longueurs et hauteurs documentées et déduire les ouvertures concernées. Ne pas présumer que toute paroi de douche est carrelée. Ne pas déduire un bain à la fois comme exclusion de zone et comme réduction déjà intégrée dans sa surface.
9. Conserver la précision de calcul, arrondir uniquement l’affichage sauf plafond de commande. Invalider les résultats dérivés après modification de géométrie, produit, pertes ou regroupement. Tester sauvegarde et égalité entre tableau et exports.

## Réception
Lire references/cas-reference.md avant d’implémenter. Comparer les résultats à un calcul indépendant; expliquer les écarts de regroupement. Les attentes métier priment sur la sortie actuelle du logiciel.

## Cadre commun
Répondre en français et examiner les instructions et le code existants avant une modification. Préserver les travaux de l’utilisateur. Adapter l’architecture à l’existant; ne pas imposer React, un serveur ou un fournisseur IA.
Distinguer spécification, prototype et fonction réellement vérifiée. Ne déclarer un contrôle réussi qu’après exécution; signaler séparément ÉCHOUÉ et NON EXÉCUTÉ. Définir les résultats attendus avant de programmer. Respecter les permissions et ne pas envoyer de plans à un tiers ni engager de frais sans autorisation spécifique.
Utiliser REA – Analyse logiciel pour les comportements observables de PlanSwift et Togal AI. Produire une implémentation indépendante. Une compétence fournit une méthode; elle ne constitue pas un moteur de détection installé.
