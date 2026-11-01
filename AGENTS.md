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
