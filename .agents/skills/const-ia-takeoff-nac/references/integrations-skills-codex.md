# Intégration des skills externes — CONST. IA & Takeoff — NAC

Sources contrôlées le 12 novembre 2026. **Projet unique : Quantif Plancher V7 / Codex** (Nac333/Projet-Logiciel-Estimation). Les composants de cette veille ne sont pas un moteur de takeoff et ne peuvent modifier le logiciel.

| Compétence | Priorité | Usage NAC | Réserve |
|---|---|---|---|
| Last 30 Days | P1 | Radar du dernier mois : GitHub, Hacker News, Reddit, outils PDF, segmentation et nouveautés d'agents. Contrôler les sources primaires, les releases et les licences. | Sa recherche multi-sources a un moteur et des prérequis spécifiques; les données récentes ne remplacent pas les archives des cinq chaînes. |
| Teach | P2 | Leçons courtes et exercices en français pour comprendre segmentation, contours, calibration et évaluation de takeoff. | Créer un espace d'étude distinct; les leçons ne prouvent pas la fiabilité d'un algorithme. |
| Chief of Staff | P2 | Router les questions techniques vers estimateur, géométrie PDF, IA et tests, puis synthétiser les désaccords et options. | Ses dépendances et conseillers d'origine ne sont pas implicitement installés. Limiter la délégation à deux niveaux et conserver le contrôle humain. |
| Anatomy | P3 facultatif | Illustrations explicatives SVG/WebGL uniquement sur demande, par exemple calibration ou lien plan/coupe. | Les SVG/animations ne constituent pas un relevé de quantités ni une preuve de détection. |
| Marketing Psychology | P3 hors objectif | Plus tard, si l'utilisateur demande de travailler l'ergonomie commerciale du produit. | Ne doit pas influencer la mesure ou la validation des quantités. |

## Sources officielles et licences

- Last 30 Days : https://github.com/mvanhorn/last30days-skill ; spécification : `skills/last30days/SKILL.md` (licence MIT annoncée). Plusieurs sources facultatives utilisent des clés ou sessions; le moteur demande une installation complète et Python 3.12+.
- Teach : https://www.aihero.dev/skills-teach et https://github.com/mattpocock/skills/tree/main/skills/productivity/teach (MIT pour le dépôt). Les leçons écrivent dans le répertoire de travail courant : créer un répertoire isolé.
- Chief of Staff : https://github.com/alirezarezvani/claude-skills/blob/main/c-level-advisor/skills/chief-of-staff/SKILL.md (MIT pour le dépôt). Le modèle d'origine s'appuie notamment sur `context-engine` et ses rôles C-suite.
- Anatomy : https://github.com/wheresryan22/anatomy (MIT; demande Node.js et navigateur pour tests selon le README).
- Marketing Psychology : https://github.com/coreyhaines31/marketingskills/blob/main/skills/marketing-psychology/SKILL.md (MIT pour le dépôt).

Respecter toutes les notices de licences des fichiers éventuellement copiés. Vérifier séparément droits des modèles, données, dépôts et dépendances. Ne pas installer tous les skills d'un mono-dépôt quand seul le skill ciblé est utile.

## Installation des skills originaux dans le dépôt Codex (facultative, non exécutée)

Ces commandes sont **à lancer depuis la racine du dépôt sur un ordinateur autorisé** après inspection des dépendances et des scripts de l'installateur. Elles ajoutent les skills au projet, pas globalement. L'option `-g` est intentionnellement absente. Une procédure alternative et des contrôles de sécurité figurent dans `docs/INSTALL_NAC_SKILLS_CODEX.md`.

```sh
npx skills@latest add mvanhorn/last30days-skill --skill last30days -a codex
npx skills@latest add mattpocock/skills --skill teach -a codex
npx skills@latest add alirezarezvani/claude-skills --skill chief-of-staff -a codex
npx skills@latest add wheresryan22/anatomy --skill anatomy -a codex
npx skills@latest add coreyhaines31/marketingskills --skill marketing-psychology -a codex
```

Les paramètres réels doivent être validés avec `npx skills@latest --help` et l'outil installé avant l'exécution. Pour Last 30 Days, installer seulement le skill d'origine avec ses scripts et fichiers de référence; un fichier `SKILL.md` seul est insuffisant. Ne pas lancer d'assistant de configuration qui crée un abonnement ou saisit une clé payante.

## Procédure de veille étendue

1. Inventorier nouveautés des cinq chaînes, puis archives non traitées. **Ne pas supprimer le suivi des anciennes vidéos**.
2. Scanner les trente derniers jours (GitHub releases, issues, PR, Hacker News et autres accès publics autorisés). Rapprocher chaque affirmation de sources primaires, sans utiliser uniquement les likes ou étoiles comme preuves techniques.
3. Retenir seulement les méthodes liées à contours éditables, segmentation de pièces, détection murs/portes, extraction de PDF vectoriels et scans, calibration, OCR et corrections manuelles.
4. Pour chaque technique : URL, date vérifiée, licence, prérequis, coût réel, éléments observés, limites, niveau de test et valeur pour Quantif Plancher V7. Distinguer `SOURCE REPÉRÉE`, `SOURCE ANALYSÉE`, `SKILL INSTALLÉ`, `OUTIL EXÉCUTÉ` et `TEST VALIDÉ`.
5. Si nécessaire, simuler **uniquement comme méthode de réflexion** une revue de quatre rôles (estimateur, géométrie PDF, segmentation, QA), avec désaccords visibles. Ne pas prétendre à de vrais sous-agents non appelés.
6. Enrichir le rapport unique « Ce qu'on a appris — CONST. IA & Takeoff — NAC » avec le radar du dernier mois et une fiche prête pour Codex. Pour l'apprentissage, créer sur demande une courte leçon testable dans un espace distinct.
7. Aucun transfert de plans privés vers un service distant. Aucune installation facturable, édition de `Quantif-Plancher-V7.html` ou déploiement automatique dans le cadre de cette compétence.

## Tests métier à exiger

Cas simple : 10 × 12 pieds = 120 pi² et 44 pi lin. de périmètre; puis pièces reliées par ouverture, trou, différentes échelles, rotation, PDF vectoriel et scan, sauvegarde des corrections/refus, révision des plans. Comparer à un relevé indépendant, fixer les seuils avant mesure et déclarer NON EXÉCUTÉ pour tout test non réellement lancé.

## Quatre dépôts supplémentaires — intégration du 12 novembre 2026

La présente référence conserve les **cinq skills** de veille initialement étudiés. Quatre nouveaux **dépôts** ont été vérifiés : Firecrawl AnyDoc, Addy Osmani Agent Skills, Anthropic Claude Plugins Official et Claude-Mem. Voir [quatre-depots-analyse-et-selection.md](quatre-depots-analyse-et-selection.md) et `docs/NAC_4_DEPOTS_CODEX.md`.

Les **six skills techniques ciblés** présents dans la branche GitHub sont : `convert-documents-to-markdown` (AnyDoc), `source-driven-development`, `performance-optimization`, `constraint-driven-development`, `browser-testing-with-devtools` (Addy Osmani), et `build-mcp-server` (Anthropic). Ils ne doivent être appelés que lorsque le besoin précis existe. L'outil CLI AnyDoc, Chrome DevTools MCP et un serveur MCP réellement démarré requièrent une étape de vérification distincte. La mémoire Claude-Mem n'est pas installée (autorisations et coûts à vérifier).

**Ne pas confondre** six dossiers `SKILL.md` copiés sur une branche, une PR fusionnée, les compétences installées sur le poste et une fonction takeoff réellement testée. Aucun appel OCR hébergé ni service facturable.
