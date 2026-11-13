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

## Compétences supplémentaires : quatre dépôts GitHub

Ces six compétences sélectionnées sont **fournies sous forme de fichiers dans la branche** et seront détectables dans Codex une fois la PR fusionnée et le dépôt local synchronisé. Ce n'est pas une installation de binaires sur le PC, ni l'exécution d'un moteur de takeoff.

- Extraction textuelle des devis, tableaux de finis, PDF textuels : `$convert-documents-to-markdown` (**AnyDoc**) ; privilégier le local, **interdire `--ocr hosted`** sur les plans, comparer à MarkItDown, ne pas y chercher de géométrie.
- Références API/version avant code : `$source-driven-development`.
- Profilage PDF et navigation lourde après mesures : `$performance-optimization`.
- Critères mesurables et non-affaissement des tests : `$constraint-driven-development`.
- Inspections navigateur complémentaires : `$browser-testing-with-devtools` si Chrome DevTools MCP autorisé et disponible (Playwright existant prioritaire, profil isolé).
- Conception d'intégrations MCP locales : `$build-mcp-server` ; sa documentation d'origine vient du système Claude, adapter à Codex, aucune transmission externe de plans.
- Claude-Mem : **non installé**, non autorisé sur les fichiers clients à ce stade (hooks/observateur/télémétrie/quotas). Consigner le suivi et les décisions dans NAC et GitHub.

Guide détaillé et critères de confidentialité : `docs/NAC_4_DEPOTS_CODEX.md`. Veille hebdomadaire : `$const-ia-takeoff-nac`.

## Radar complémentaire EGM / FreeLLMAPI / 21st MCP
- Étudier **EGM** (Google Elephant-Goldfish) pour la critique de spécifications et la détection des écarts entre concept et code. Plugin complet requis (skills + agents + resources); **non installé par ce dépôt**; ne pas déclarer une revue indépendante sans sous-agents à contexte frais réellement disponibles.
- **FreeLLMAPI** : agrégateur d'API de modèles externes, présenté par son auteur comme expérimental, non destiné à la production. Pas de fournisseur configuré, aucune clé externe et aucun plan client transmis. Ne pas remplacer le modèle Codex ni la détection géométrique par cette solution.
- **Magic MCP / 21st MCP** : proxy de composants UI vers un service distant; génération AI conditionnelle/payante, sans intérêt direct pour la détection des pièces. Aucune installation/clé, aucune refonte React/Tailwind sans validation visuelle spécifique de l'utilisateur.
- Guide : `docs/NAC_EGM_FREELLMAPI_MAGIC_CODEX.md`. Veille dans `.agents/skills/const-ia-takeoff-nac/references/trois-depots-egm-freellmapi-magic.md`. Séparer `DOCUMENTE`, `PLUGIN INSTALLE SUR PC`, `EXECUTE` et `TEST METIER VALIDE`.

## Standards de travail
- Examiner le code et definir les controles de reception avant tout changement.
- Distinguer trace manuel assiste, IA de detection, reconnaissance des finis et calcul des commandes.
- Confirmer echelle, exclusions, hauteurs et pertes; ne jamais les inventer.
- Les surfaces proposees par un agent restent a accepter et a verifier.
- Tests declares REUSSIS seulement s'ils ont ete executes et documentes. Sinon noter ECHOUE ou NON EXECUTE.
- Faire des modifications limitees et faciles a revoir; eviter les grands blocs de contexte et les explorations redondantes.

Guide : `docs/CODEX_TAKEOFF_GRATUIT.md`.

## Veille NAC pour la recherche, l'apprentissage et les fiches Codex

- Utiliser `$const-ia-takeoff-nac` pour la veille des cinq créateurs, le radar technique des 30 derniers jours, le rapport « Ce qu'on a appris » et les fiches préparatoires à Codex.
- Source de référence : `.agents/skills/const-ia-takeoff-nac/SKILL.md` et `references/integrations-skills-codex.md`.
- Last 30 Days, Teach, Chief of Staff, Anatomy et Marketing Psychology sont des sources ou options facultatives : ne déclarer leur installation et leur exécution qu'après vérification. Leur simple description dans NAC ne les installe pas.
- Aucune donnée de plan privée vers des serveurs tiers, aucun achat/abonnement, aucune modification de `Quantif-Plancher-V7.html` au titre de cette veille. Suivre `docs/INSTALL_NAC_SKILLS_CODEX.md` pour les installations locales sous contrôle.
