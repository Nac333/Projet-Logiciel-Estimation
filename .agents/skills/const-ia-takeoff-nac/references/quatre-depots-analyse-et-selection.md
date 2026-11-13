# Quatre dépôts évalués pour CONST. IA & Takeoff — NAC

Contrôle des dépôts GitHub et fichiers d'origine : 12 novembre 2026. Domaine exclusif : **Quantif Plancher V7 avec Codex**. L'implémentation continue de prioriser les contours/surfaces de pièces **détectés automatiquement**, vérifiables et corrigibles. Ne pas employer ces dépôts pour un autre projet.

| Dépôt vérifié | Fonction réelle et source | Intérêt pour V7 | État de cette intégration |
|---|---|---|---|
| [firecrawl/anydoc](https://github.com/firecrawl/anydoc) | Rust + bindings Node/Python/WASM : conversion DOC, DOCX, XLSX et PDF textuels vers Markdown; skill `convert-documents-to-markdown`; licence MIT. PDF traité via `pdf-inspector`. **Pas d'OCR local**. | Extraire tableaux de finis, notes et références; comparer à MarkItDown sur fichiers autorisés. Ce n'est pas un moteur de mesure géométrique. | Skill copié dans le dépôt GitHub sous `.agents/skills/`; binaire AnyDoc non exécuté ni ajouté à la production. |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | Compétences d'ingénierie, tests DevTools, vérification documentaire, performance, contraintes qualité; licence MIT. | Vérification de code et de tests de la détection, stratégie de performance, régressions. | Quatre skills sélectionnés copiés dans le dépôt avec ressources et notices; tests DevTools et outils facultatifs non exécutés. |
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | Catalogue de plugins Claude Code; skill `build-mcp-server` depuis `plugins/mcp-server-dev` avec licence Apache-2.0. | Adapter **les méthodes** de construction MCP à un connecteur local OpenTakeoff/Codex. | Seul `build-mcp-server` et ses références copiés/adaptés dans le dépôt; pas de plugin Claude Code global installé. |
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | Mémoire longue : hooks, worker Bun, SQLite, observateur et MCP, code Apache-2.0; version CodeX/documentation présente. | Retrouver historique de corrections et décisions sans répétition. | **NON INSTALLÉ** : nécessite un service actif, choix de fournisseur LLM et règles de conservation, confidentialité et télémétrie. |

## Priorités de veille

**P0** : vérifier toute avancée réelle dans segmentation automatique, lecture de PDF vectoriels/raster, calcul des contours, précision des quantités, contrôle des erreurs et approbation de propositions.

**P1** : comparer AnyDoc vs MarkItDown sur extraction des finis des devis et les évolutions des solutions de géométrie, sans passer par OCR hébergé. Surveiller les mises à jour de bibliothèques PDF pertinentes (par ex. `pdf-inspector`) et vérifier le code avant de recommander quoi que ce soit.

**P1** : étudier les tests de code/takeoff proposés par Addy Osmani et leurs différences avec les compétences métier et Playwright déjà présents. Ne pas ajouter de doublons.

**P2** : examiner les pratiques de conception de serveurs MCP locaux dans le plugin Anthropic, en les adaptant à Codex et aux restrictions de confidentialité.

**P2 seulement** : étudier le mode local de Claude-Mem, la collecte de prompts/captures, la télémetrie, la dépendance éventuelle au quota d'un abonnement et les options de désinstallation. Aucun pilote sur des plans clients sans autorisation explicite distincte.

## Intégration au rapport NAC

Après les cinq créateurs, ajouter :
- **Radar GitHub — 30 jours** : modifications/version réelle observées, liens source, licence, coût et valeur pour V7.
- **Méthodes à apprendre** : 1 à 3 concepts applicables, fiches Codex, limites de preuve.
- **État d'installation** : `GITHUB PR` / `FUSIONNÉ` / `PC SYNCHRONISÉ` / `OUTIL EXÉCUTÉ` / `TEST MÉTIER VALIDÉ` (preuves distinctes).
- **Risques** : transmission externe de fichiers, OCR cloud, copie de mémoires, doublons d'outils, abonnements et quotas.

Doc technique à consulter dans le dépôt : `docs/NAC_4_DEPOTS_CODEX.md`. Ne pas présenter la présence de `SKILL.md` comme une installation réussie sur PC/Mac, ni confondre un serveur MCP avec le moteur d'IA pour takeoff.
