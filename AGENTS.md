# Instructions Codex - Quantif Plancher V7

## Objectif
Faire evoluer les fonctions de takeoff et d'estimation de revetements du projet. Preserver `Quantif-Plancher-V7.html`, ses fonctionnalites et les modifications de l'utilisateur; ne pas rearchitecturer tout le logiciel sans demande.

## Zero depense et donnees
- Aucun outil payant, abonnement, credit facturable, API a cout variable ou essai payant sans approbation explicite.
- OpenTakeoff MCP s'execute localement; Craft Quantities MCP est distant. Ne pas transmettre des plans ou des donnees confidentielles au serveur distant sans consentement explicite.
- Ne pas contourner les restrictions de l'administrateur Enterprise; l'utilisateur conserve les autorisations d'execution MCP.
- Les resultats des MCP locaux peuvent apparaitre dans la conversation Codex. Respecter les regles de partage des documents de projet.

## Router vers les competences
- Segmentation et propositions IA : `$estimation-takeoff-automatise`
- PDF, zoom, echelle, polygones et trous : `$estimation-plans-geometrie`
- Tests de detection, omissions et ecarts : `$estimation-evaluer-takeoff`
- Pertes, boites, plinthes, ceramique et rouleaux : `$estimation-calculs-calepinage`
- Controle Excel, totaux par etage/bloc : `$verifier-quantites-plancher`
- Creation, structure, formules et controle technique XLSX : `$xlsx`; appliquer ensuite `$verifier-quantites-plancher` pour la validation metier.
- Qualite du relevé automatique compare au plan source et aux annotations humaines : `$estimation-evaluer-takeoff`.
- Analyse fonctionnelle de PlanSwift/Togal : `$rea-analyse-logiciel`
- Mesures avec OpenTakeoff et calculs Craft Quantities : `$estimation-mcp-takeoff-gratuit`

## Standards de travail
- Examiner le code et definir les controles de reception avant tout changement.
- Distinguer trace manuel assiste, IA de detection, reconnaissance des finis et calcul des commandes.
- Confirmer echelle, exclusions, hauteurs et pertes; ne jamais les inventer.
- Les surfaces proposees par un agent restent a accepter et a verifier.
- Tests declares REUSSIS seulement s'ils ont ete executes et documentes. Sinon noter ECHOUE ou NON EXECUTE.
- Faire des modifications limitees et faciles a revoir; eviter les grands blocs de contexte et les explorations redondantes.

Guide : `docs/CODEX_TAKEOFF_GRATUIT.md`.

## Contrat Excel avec Codex (a preciser avant integration)
- Exporter les quantites SOURCE par fichier/feuille/revision, bloc, niveau, unite reelle ou type de logement, local, code de fini, unite SF/LF/EA, provenance et statut humain. Ne pas faire perdre la provenance des geometries.
- Reconstituer dans cet ordre : feuille PDF -> unite -> niveau -> bloc -> batiment -> produit. La validation est ascendante ET descendante.
- Si deux niveaux sont semblables : creer une reference explicite au niveau source et une liste d'exceptions; ne pas dupliquer silencieusement les lignes de releve. Verifier la liste des logements et le multiplicateur avant totalisation.
- Detecter les doublons d'unités, les pieces manquantes, fins de niveaux non verifies, echelles non confirmees, revisions contradictoires et incoherences de finishes; afficher un statut explicite et des ecarts, jamais un faux OK.
- Distinguer quantite nette, perte confirme, besoin, colis arrondis par groupe d'achat et quantite de pose; ne pas appliquer de pertes implicites. De nouveaux finis ne doivent pas necessiter l'ajout de colonnes fixes au modele.
- Aucun releve PROPOSE, refusé ou non confirme ne doit alimenter une commande valide. Aucun test Excel ou test d'accuracy IA declare REUSSI sans execution.
- Le classeur Excel modele et le code export restent a valider par des scenarios independants AVANT integration de l'export au logiciel V7.
