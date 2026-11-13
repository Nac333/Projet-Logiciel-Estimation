# Trois nouveautés pour Codex — EGM, FreeLLMAPI et 21st MCP
Projet : **Quantif Plancher V7 uniquement**. Priorité takeoff PDF : détection automatique des surfaces, contrôle de l'échelle, polygones, murs, céramique au sol/mur, plinthes, édition et export vérifié.

Ce document accompagne la veille `CONST. IA & Takeoff — NAC`. Il n'installe pas de serveur, de modèle ou de plugin Codex sur l'ordinateur. Il ne modifie pas `Quantif-Plancher-V7.html`.

## Décisions d'intégration

### EGM (google/elephant-goldfish-model) : préparé pour une installation native optionnelle

- Dépôt : https://github.com/google/elephant-goldfish-model (Apache-2.0).
- Fonction réelle : assistants de **spécification et revue** indépendantes (« elephant » rédige avec l'historique, « goldfish » examine avec un contexte conversationnel frais).
- Compétences utiles : `egm-review`, `egm-drift-report`, `egm-draft`, `egm-bootstrap`.
- **Ne pas copier un seul `SKILL.md`** : le plugin a besoin de `agents/`, `resources/`, `docs/` et de ses propres compétences. Le dépôt amont le confirme dans `docs/harnesses.md` et `docs/codex.md`.
- La commande d'installation locale indiquée dans le README amont, à exécuter sur un poste Codex CLI compatible après accord et vérification des versions :

```sh
codex plugin marketplace add google/elephant-goldfish-model
codex plugin add egm@egm
```

- Pour Codex desktop ou ChatGPT desktop, le README fournit un plugin publié, à sélectionner et installer par l'utilisateur. Cette **PR ne remplace pas** cet acte.
- Le plugin consomme les ressources/quota de modèle associés à l'agent; ne pas déclencher une revue si des sous-agents réellement indépendants ne sont pas disponibles. L'isolation des tours ne garantit pas l'exclusion des instructions `AGENTS.md` (voir la note `#237` du projet).
- Cas pilote à préparer dans V7 : spécification « Détection automatique des pièces PDF »; demander à un relecteur frais de tester les oublis : variation d'échelle entre pages, tracés déjà corrigés, murs interrompus, salle de bain exclue, trous et portes, faux positifs. Comparer les critiques aux critères métier et au code actuel. Second cas : `egm-drift-report` sur la navigation plan-coupe-élévation et les spécifications réellement commitées.
- **Statut : documentation transmise à Codex dans GitHub; plugin complet NON INSTALLÉ localement; revue Goldfish NON EXÉCUTÉE.**

### FreeLLMAPI (tashfeenahmed/freellmapi) : ne pas intégrer à l'application V7

- Source : https://github.com/tashfeenahmed/freellmapi (MIT).
- Agrégateur local de plusieurs **fournisseurs LLM distants** via un endpoint OpenAI compatible; annoncé compatible Codex CLI, avec quotas gratuits individuels variables et clés à configurer.
- Les chiffres de quotas/millions de jetons du README sont les **estimations publicitaires globales de l'auteur**, pas un quota garanti ni un indicateur de gratuité pour l'entreprise.
- Le README dit explicitement `for personal experimentation and learning, not production`. Conditions de chaque fournisseur, confidentialité des plans et coûts éventuels demeurent distincts. Les API externes n'ont pas un rôle de géométrie déterministe pour V7.
- **Décision : bac à sable synthétique uniquement** si une expérimentation indépendante est approuvée. Ne pas modifier les configurations de Codex, ne pas injecter des clés dans GitHub, ne pas installer le routeur sur un environnement client; ne pas promettre une fiabilité de production.
- **Statut : veille documentée; aucune installation, API, abonnement, clé ou essai lancé.**

### Magic MCP (21st-dev/magic-mcp) : ne pas installer pour le takeoff

- Dépôt : https://github.com/21st-dev/magic-mcp (ISC).
- Le code `src/index.ts` montre que `@21st-dev/magic` 0.2.x est un proxy stdio -> service distant `https://21st.dev/api/mcp` (21st MCP), pas un moteur local de lecture PDF.
- Les fonctions de recherche de composants sont principalement React/Tailwind et la génération hébergée / récupération de code peut nécessiter un abonnement ou des crédits AI.
- Notre application V7 utilise un grand HTML existant, les propositions de modification d'interface doivent d'abord être soumises comme concepts visuels et approuvées; ne pas transformer la structure de l'interface au titre du takeoff.
- **Statut : veille documentée seulement; aucune clé ou connexion MCP configurée.**

## Instructions à appliquer lors d'une prochaine tâche Codex

1. Lire `AGENTS.md`, la branche courante, `docs/NAC_4_DEPOTS_CODEX.md` et `Quantif-Plancher-V7.html`. L'objectif n'est pas une refonte.
2. Avant toute modification liée à l'automatisation, écrire une spécification testable et un jeu de référence approuvé : PDF vectoriel, scan, pièces contiguës, trous, rotations, échelle propre à chaque page, sauvegarde/refus, renvois plan/coupe/élévation.
3. Utiliser le protocole EGM seulement s'il est installé complètement et les sous-agents frais réellement disponibles. Sinon faire une revue classique **sans prétendre à une revue Goldfish**.
4. Établir les règles métier : rectangle 10 x 12 pi = 120 pi2, périmètre 44 pi lin., surfaces nettes et exclusions, mural distinct du sol, pertes et boîtes uniquement après validation du fini.
5. Ne pas rendre payants les outils, transmettre de plans aux API distantes, modifier `main` ou fusionner sans vérification.
6. Rapporter séparément `DOCUMENTÉ`, `INSTALLÉ`, `REVU`, `IMPLÉMENTÉ`, `TESTÉ`, en conservant la preuve.

## Compatibilité et sources d'origine

- EGM : `README.md`, `docs/harnesses.md`, `docs/codex.md`, `TESTING.md` du dépôt Google.
- FreeLLMAPI : `README.md` et son `## Disclaimer`, `docs/en/clients/02-supported-agents.md` du dépôt tashfeenahmed.
- Magic : `README.md`, `src/index.ts` et `package.json` du dépôt 21st-dev.
- Justificatifs et évaluation pour la compétence NAC : `.agents/skills/const-ia-takeoff-nac/references/trois-depots-egm-freellmapi-magic.md`.
