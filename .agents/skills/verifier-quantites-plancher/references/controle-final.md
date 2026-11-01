# Contrôle final obligatoire

## Comptage

- Chaque unité apparaît une seule fois au bon bloc et au bon étage.
- La somme des `Qty EA` par étage correspond au plan.
- La somme des étages correspond au total du bloc.
- La somme des blocs correspond au total général.
- Les types d'unités correspondent aux numéros d'unités.

## Surfaces et pertes

- La surface par type provient de la table source appropriée.
- Le total sans perte est calculé avant la perte.
- Le pourcentage de perte est documenté par produit et projet; aucun 6 % implicite. Une perte manquante bloque la validation du besoin et des achats, sans bloquer le calcul du net.
- Aucune perte n'est appliquée deux fois.
- Pour le mural : `Douche + Bain-douche + Bain = Surface sans perte`.

## Boîtes

- Le pi² par boîte est vérifié pour le bon produit.
- L’arrondi est supérieur et effectué après somme des besoins du groupe choisi : zone, logement, étage ou projet. Vérifier référence, format, couleur, conditionnement et lot si requis.
- Les boîtes calculées sont comparées aux boîtes cibles.
- Tout écart d'arrondi est chiffré et expliqué.

## Excel

- Les plages de somme incluent toutes les lignes et aucune ligne de total intermédiaire.
- Les références absolues et relatives sont cohérentes.
- Les recherches sans correspondance donnent une cellule vide et une alerte.
- Les filtres, lignes masquées et doublons ne faussent pas les sommes.
- Les valeurs affichées arrondies ne remplacent pas la précision des formules.

## Statut final

Attribuer `OK` uniquement lorsque tous les contrôles concordent. Sinon attribuer `À vérifier` et nommer précisément le bloc, le niveau, l'unité, le produit ou la formule en cause.

## Cas indépendants

Deux logements de 20 pi² nets, pertes explicites 10 %, boîte 20 pi² : 4 boîtes si achat par logement; 3 si achat regroupé. Pose sur 40 pi² pour ce poste. Ne pas mélanger les produits incompatibles.
