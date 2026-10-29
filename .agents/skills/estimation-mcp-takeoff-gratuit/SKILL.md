---
name: estimation-mcp-takeoff-gratuit
description: Utiliser OpenTakeoff MCP local et Craft Quantities MCP gratuit dans Codex pour relever des surfaces et murs, compter des objets, calculer les plinthes et verifier les quantites de revetements. Utiliser pour un takeoff PDF assiste par agent, pas pour affirmer qu'un moteur de detection IA est valide.
---

# Takeoff MCP gratuit pour Estimation

## Prealables
1. Verifier que les serveurs `opentakeoff` et, si necessaire, `craft_quantities` sont accessibles dans Codex. Si l'outil n'est pas disponible, annoncer NON EXECUTE.
2. N'ouvrir que des plans autorises. OpenTakeoff traite les fichiers localement, mais le contenu retourne a Codex peut integrer la conversation de l'assistant.
3. Craft Quantities est un serveur distant. Ne lui envoyer aucune information confidentielle de projet, noms de client, plans ou devis sans approbation explicite. Utiliser de preference des dimensions anonymisees.
4. Aucun achat, essai payant, credital API ou depassement facture.

## OpenTakeoff
1. Lire `takeoff://wiki` si disponible; puis appeler `load_plan` et inspecter `sheet_info`, `read_sheet_text` et `get_sheet_vectors`.
2. Lire l'echelle du plan et demander sa verification sur une cote independante avant `set_scale`. Sans echelle validee, ne pas annoncer de pi2 ou m2 reels.
3. Tracer les surfaces interieures par `measure_polygon`; deduire les exclusions confirmees par `cut_out`. Pour mur et dosseret, utiliser `measure_surface` uniquement si la hauteur est connue.
4. Pour plinthes et seuils, mesurer ou deriver les lineaires selon le fini et les portes. Pour douche/bain-douche, conserver des comptages distincts des surfaces murales.
5. Les codes de fini proviennent de la legende et du devis; un nom de piece ne suffit pas pour attribuer du vinyle ou de la ceramique.
6. Utiliser `view_sheet` pour inspecter les contours si le rendu fonctionne. Exporter le rapport, les donnees et le PDF annote avec leur provenance.
7. Les mesures d'un agent restent des propositions jusqu'a verification humaine; ne pas ecraser automatiquement les quantites internes d'Estimation.
8. Important : `one_click` et `detect_rooms` sont desactives par defaut par OpenTakeoff pendant revalidation. Ne pas contourner ce garde-fou ni presenter `measure_polygon` comme une detection autonome.

## Craft Quantities (facultatif)
1. Utiliser `search` et `calculate` lorsque le serveur est accessible et que seules des dimensions non confidentielles sont transmises.
2. Documenter les unites et les pertes explicitement fournies; comparer au moteur local d'Estimation, ne jamais remplacer des donnees contractuelles sans validation.
3. En cas d'indisponibilite, continuer avec les calculs locaux et signaler la limite.

## Compte rendu
Fournir feuille, revision, cote de calibration, contours proposes/acceptes, quantites nettes, pertes appliquees, boites et ecarts, ainsi que les tests REUSSIS, ECHOUES ou NON EXECUTES. Repondre en francais.

Sources :
- https://github.com/Kentucky-ai/opentakeoff/blob/main/docs/CONNECT.md
- https://github.com/Kentucky-ai/opentakeoff/blob/main/docs/AGENT_GUIDE.md
- https://craftquantities.com/api/
