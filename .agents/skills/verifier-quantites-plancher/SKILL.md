---
name: verifier-quantites-plancher
description: "Verifier les tableurs de quantites par unite, etage et bloc, les pertes, les boites et les totaux de projets de plancher."
---

# Vérifier les quantités de plancher

Appliquer une vérification descendante et remontante : plans ou données sources → unités → étages → blocs → total général, puis total général → blocs → étages → unités.

## Structurer les données

Conserver au minimum les champs suivants :

- Bloc
- Niveau ou étage
- Numéro d'unité
- Type d'unité
- Quantité (`EA`)
- Surface sans perte par unité
- Pourcentage de perte
- Surface avec perte par unité
- Quantité totale sans perte
- Quantité totale avec perte
- Pi² par boîte, si applicable
- Boîtes arrondies

Pour la céramique murale, distinguer `Douche`, `Bain-douche` et `Bain`. Calculer `Surface sans perte` comme leur somme, puis calculer séparément `Surface avec perte`.

## Appliquer les règles de calcul

1. Utiliser les surfaces et pertes propres au projet lorsqu'elles sont fournies.
2. Utiliser les pertes explicitement fournies ou configurées par produit et projet. Ne pas appliquer de taux implicite de 6 %. Si elles manquent, conserver les surfaces nettes et signaler que le besoin et la commande restent incomplets. Un scénario provisoire nécessite une hypothèse visible et ne valide pas les achats. Une perte explicitement égale à zéro est valide.
3. Calculer sans perte avant d'appliquer la perte : `Qté sans perte = Qty EA × Surface sans perte/unité`.
4. Calculer avec perte : `Qté avec perte = Qté sans perte × (1 + perte)`.
5. Documenter le regroupement choisi : zone, logement réel, étage ou projet. Ne pas imposer l’étage. Regrouper uniquement les produits compatibles par référence, format, couleur et conditionnement, et lot si requis. Pour chaque groupe, sommer les besoins non arrondis puis calculer `ARRONDI.SUP(Qté avec perte / Pi² par boîte; 0)`. Ne pas sommer les arrondis par logement pour simuler une commande regroupée.
6. Ne jamais arrondir les surfaces intermédiaires si cela crée un écart avec le total source. Garder la précision complète dans les formules et arrondir seulement l'affichage.
7. Afficher vide, et non zéro trompeur, lorsqu'une recherche ne trouve aucune valeur. Signaler la donnée manquante.

## Séparer les postes

Séparer surface nette, besoin avec pertes et quantité commandée. Calculer la pose sur la base propre au poste sans ajouter automatiquement les pertes d’achat. Distinguer céramique au sol, mural et dosserets; associer plinthes et moulures au bon fini. Appliquer l’union des exclusions confirmées pour éviter les doubles déductions. Les rouleaux exigent un calepinage des coupes distinct du calcul des boîtes. Ne pas prendre une hauteur ou une perte non documentée comme donnée certaine.

## Vérifier dans cet ordre

1. **Unités** : confirmer chaque numéro, type et quantité EA; détecter doublons, omissions et unités affectées au mauvais étage.
2. **Étages** : sommer les unités et surfaces de chaque niveau; comparer au plan et au tableau de comptage.
3. **Blocs** : sommer les étages séparément pour chaque bloc.
4. **Pertes** : comparer sans perte, perte ajoutée et avec perte; repérer toute perte appliquée deux fois ou oubliée.
5. **Boîtes** : vérifier le regroupement choisi et comparer les commandes par logement, étage ou projet; expliquer les écarts dus à l’arrondi sans modifier le réglage pour faire concorder le total.
6. **Total général** : confirmer que la somme des blocs et des étages égale exactement le récapitulatif.
7. **Formules** : inspecter les plages, références absolues, recherches, lignes exclues et formules copiées.

Lire [controle-final.md](references/controle-final.md) avant de déclarer le fichier final.

## Produire un contrôle visible

Ajouter une zone ou feuille `Validation` contenant au minimum :

- unités attendues vs unités comptées;
- total sans perte source vs calculé;
- total avec perte source vs calculé, si disponible;
- boîtes cibles vs boîtes calculées;
- écart pour chaque contrôle;
- statut `OK` seulement si l'écart est nul ou expliqué;
- liste des cellules, unités ou niveaux à vérifier.

Ne jamais déclarer le tableau parfait uniquement parce que les formules fonctionnent. Exiger la concordance des données sources, du comptage et des totaux.

## Présenter le résultat

Fournir un tableau clair par étage et par bloc, puis un résumé global. Conserver les dimensions en pieds et les surfaces en pi². Indiquer distinctement :

- les corrections effectuées;
- les écarts encore ouverts;
- les hypothèses utilisées;
- les contrôles réussis;
- les données manquantes empêchant une validation complète.

Ne pas remplacer silencieusement une donnée incertaine. La laisser vide, la signaler et empêcher le statut final `OK`.
