---
name: estimation-plans-geometrie
description: "Concevoir et verifier la geometrie de releve PDF dans Estimation: calibration, zoom, rotation, contours, exclusions, surfaces et perimetres."
---

# Plans PDF et géométrie de relevé

## Méthode
1. Identifier la version du plan, la feuille, ses dimensions, son recadrage et sa rotation. Distinguer PDF vectoriel et scan. Consulter la documentation officielle correspondant aux dépendances réellement utilisées.
2. Définir un repère de feuille indépendant des pixels écran et du zoom, avec transformations aller et retour explicites. Conserver les polygones dans ce repère et les distances physiques dans une unité interne documentée. Traiter chaque feuille et révision séparément.
3. Calibrer sur une cote connue avec unité explicite. Vérifier une deuxième cote indépendante, idéalement dans une autre direction. Ne pas inventer l’échelle à partir du format papier. Rapporter l’écart relatif et le seuil convenu. Si les axes sont déformés, signaler le scan et proposer une rectification vérifiée; ne pas masquer le défaut dans une échelle moyenne.
4. Valider les contours : anneau fermé, trous, intersections, points répétés et segments nuls. Ne pas réparer une géométrie en changeant silencieusement la surface. Définir une tolérance liée à la calibration, distincte du nombre de décimales affichées.
5. Calculer le net comme aire du contour moins l’union des exclusions, intersectée avec le contour. Une exclusion extérieure ne réduit pas la surface; des exclusions superposées ne se déduisent qu’une fois. Séparer le périmètre géométrique du linéaire admissible aux plinthes.
6. Relier tracés et tableau par identifiants stables. Prévoir déplacement des sommets, double-clic, annulation, rétablissement, fusion et division selon le périmètre autorisé. Une modification invalide les quantités dérivées concernées.
7. Tester changement d’unité, zoom, déplacement, rotation, sauvegarde et réouverture. Vérifier que le repère écran ne modifie pas les quantités.

## Réception
Lire references/cas-reference.md avant de choisir les tests. Fournir la calibration, les transformations, les cas exécutés, la version testée et les captures réellement examinées. Utiliser des calculs indépendants en plus des captures.

## Cadre commun
Répondre en français et examiner les instructions et le code existants avant une modification. Préserver les travaux de l’utilisateur. Adapter l’architecture à l’existant; ne pas imposer React, un serveur ou un fournisseur IA.
Distinguer spécification, prototype et fonction réellement vérifiée. Ne déclarer un contrôle réussi qu’après exécution; signaler séparément ÉCHOUÉ et NON EXÉCUTÉ. Définir les résultats attendus avant de programmer. Respecter les permissions et ne pas envoyer de plans à un tiers ni engager de frais sans autorisation spécifique.
Utiliser REA – Analyse logiciel pour les comportements observables de PlanSwift et Togal AI. Produire une implémentation indépendante. Une compétence fournit une méthode; elle ne constitue pas un moteur de détection installé.
