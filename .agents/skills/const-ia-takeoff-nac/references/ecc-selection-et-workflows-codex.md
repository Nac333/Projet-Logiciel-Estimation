# ECC — analyse sélective pour CONST. IA & Takeoff — NAC

**Examen : 18 novembre 2026.** Source authentifiée par lecture du dépôt : https://github.com/affaan-m/ECC, branche principale, commit observé `3f14a103a8694e51c1df9a806217a6d0b5f7a6f7` du 17 novembre 2026. Licence **MIT**, copyright Affaan Mustafa. Fichiers consultés : `README.md`, `LICENSE`, `.codex-plugin/plugin.json`, `hooks/codex-hooks.json`, `.mcp.json`, et les skills `content-hash-cache-pattern`, `mcp-dependency-review`, `change-impact`, `ai-regression-testing`, `delivery-gate`, `security-scan`, `context-and-decisions`.

## Nature du projet et pertinence réelle

**Everything Claude Code (ECC)** est un **système de méthodes pour agents de développement**, pas un modèle d'IA de segmentation, ni un moteur de relevé automatique. Le README du dépôt annonce **72 agents, 327 skills et 98 commandes historiques**. Il fonctionne surtout avec Claude Code et possède une intégration Codex 2.2.x, dont `.codex-plugin/plugin.json` revendique une intégration native et charge des hooks et une configuration MCP. Ces affirmations d'intégration proviennent de l'auteur et **ne prouvent pas** une installation ou un essai local sur notre poste.

Le code est gratuit sous licence MIT; le site annonce également ECC Pro / une application GitHub payante pour les dépôts privés. **Ne pas activer l'offre Pro, npx ecc-universal, les 327 skills, hooks, connexions MCP, mémoire ou scanners tiers pour Quantif Plancher V7 par simple examen.**

### Ce qui a été sélectionné : deux compétences autonomes copiées et adaptées

| Compétence installée sous `.agents/skills/` | Source ECC | Utilité réelle pour V7 | Limites |
|---|---|---|---|
| `content-hash-cache-pattern` | `skills/content-hash-cache-pattern/SKILL.md` | Concevoir, si demandé, un cache **local** qui évite de réextraire/rasteriser les mêmes PDF lourds après un déplacement/renommage, avec invalidation après modification | Un cache basé seulement sur le SHA-256 du PDF ne suffit pas pour des **mesures géométriques** qui dépendent aussi de l'échelle, de la page, des versions de moteur et des options. Aucun cache moteur implémenté par cette PR. |
| `mcp-dependency-review` | `skills/mcp-dependency-review/SKILL.md` | Auditer **sans exécution** les références MCP du projet avant une mise à jour : versions `@latest`, dépendances non épinglées, conteneurs `latest`, droits et transfert possible de plans | Une version épinglée ne prouve pas que l'outil est fiable, confidentiel ou sans vulnérabilité. Aucun nouveau serveur MCP installé. |

Les deux `SKILL.md` sont repris de l'original ECC avec **préambule de sécurité et descriptif adaptés à Quantif Plancher V7 / Codex**, et chaque dossier contient sa copie de la licence MIT. Les scénarios originaux (parfois Python) doivent être traduits à notre architecture HTML/JS si une vraie implémentation est commandée. Aucun outil exécutable importé.

### Autres compétences ECC étudiées mais **non installées**

- `change-impact` : excellente méthode d'analyse d'impact avant/après, mais elle chevauche `constraint-driven-development`, `verification-before-completion` et notre approche de branches/PR. Nous réutilisons l'idée de **diff vérifié** dans NAC sans multiplier les skills.
- `ai-regression-testing` : avertit contre les angles morts quand une IA code et vérifie ses propres modifications. Les exemples sont orientés Next.js/Vitest et ne s'appliquent pas directement à notre grand fichier HTML. Préférer la suite Playwright actuelle, tests géométriques et contrôle indépendant par un estimateur.
- `delivery-gate` : implémente un **hook d'arrêt Claude Code** pouvant bloquer l'agent sur la base d'horodatages, logs d'apprentissage et seuils disque. Ne pas recopier ou activer ce hook dans Codex; mécanisme disproportionné.
- `security-scan` : repose sur `ecc-agentshield`, un paquet exécutable extérieur et des options d'analyse LLM payantes. Référence utile; pas de scanner exécuté ou installé.
- `context-and-decisions` : gouvernance des définitions/ADR, redondante avec notre documentation métier et décisions existantes. Éviter les nouveaux fichiers vides.

## Workflow pratique adapté à NAC : « planifier → contrôler → modifier → vérifier »

1. **Lire l'existant** avant de proposer : `AGENTS.md`, le code réel `Quantif-Plancher-V7.html`, les tests, les plans synthétiques et la branche courante. Ne pas inventer des fichiers ou des résultats.
2. **Définir l'acceptation** (mesures nettes, calibrage par feuille, exclusions, trous, pi² et pi lin., tolérances explicites).
3. **Examiner l'impact et la source** : éléments de l'interface, fonctions PDF, données conservées et export Excel. Identifier le repli local et les risques de cache obsolète.
4. **Écrire ou choisir les tests métier pertinents avant la modification** ; exige un relevé humain indépendant et des PDF représentatifs.
5. **Implémenter sur branche dédiée uniquement après autorisation** ; sauvegarder la version et les corrections existantes.
6. **Vérifier à partir de commandes et sorties réelles** ; un test de compilation ne suffit pas à prouver la précision du takeoff.
7. **Comparer le diff et les résultats attendus** ; expliquer toute régression, documenter l'option de retour arrière, ne pas annoncer un gain de performance sans mesure.
8. **Consigner l'apprentissage utile** dans le rapport NAC et les fiches Codex sans ajouter du bruit ou des fichiers de mémoire redondants.

## Stratégie du cache PDF : points métier qui invalident la mesure

Il faut distinguer **la donnée brute cachée** de **l'estimation confirmée**. Pour un résultat dérivé de PDF, une clé potentielle doit tenir compte de :

- Empreinte SHA-256 des octets PDF originaux, **page et révision**.
- **Type de donnée** : texte, bitmap de rendu, vecteurs, OCR local, géométrie candidate, ou dessin de référence.
- **Version du moteur / algorithme**, paramètres (DPI, rotation, seuils, modèle), système d'unités et transformation de coordonnées.
- **Calibration** par feuille, échelle physique et exclusions pertinentes, pour les surfaces et périmètres.
- Contours modifiés/acceptés par l'utilisateur : stockés et versionnés séparément, **jamais écrasés par recalcul automatique**.

Cas à prévoir : PDF identique déplacé → données de lecture potentiellement réutilisables ; nouvelle révision → invalidation sélective ; changement d'échelle → recalcul de superficie ; nouveau DPI → nouvelle image de rendu ; cache illisible → extraction sûre et message d'erreur ; aucun import de plans clients dans GitHub.

## Audit des MCP : protocole statique avant installation

Règle de relecture de configuration (sans lancer les commandes trouvées dans les fichiers) :

| Référence | Constats | Décision initiale |
|---|---|---|
| `npx package@latest` | Version mutable / nouvelle exécution possible lors d'un prochain démarrage | Élevé : épingler après vérification |
| `package@1.2.3` | Sélecteur direct exact, mais dépendances transitives à contrôler | Vérification de provenance requise |
| Image Docker `:latest` | Image mutable malgré l'absence de modification des fichiers | Élevé : préférer un digest approuvé |
| MCP HTTP hébergé | Serveur hors machine ; confidentialité des plans et identifiants à vérifier | Bloquer les données clients sans accord |
| Exécutable local sans version | Chemin ou environnement évolutif | Examen ciblé nécessaire |

Comparer ce protocole à nos outils locaux OpenTakeoff, aux serveurs Codex autorisés et aux tests actuels. Toute vérification du type `outil démarré`, `plan transmis` ou `performance validée` exige une preuve **distincte** ; l'audit statique ne prouve pas la sécurité totale.

## Statuts et critères d'acceptation

- `DÉPÔT LU` : source officielle et fichiers ci-dessus inspectés.
- `SKILL DANS GITHUB` : après vérification de la branche principale, deux compétences ciblées disponibles dans le dépôt.
- `COMPÉTENCE INSTALLÉE SUR PC` : non confirmé sans synchronisation et preuve d'exécution de Codex.
- `CODE MÉTIER MODIFIÉ` : **NON** ; aucune fonction HTML/takeoff n'est changée par cette intégration.
- `PERFORMANCE PDF TESTÉE` : **NON** ; aucune preuve de temps/mémoire ou précision issue des tests ECC.
- `ECC PRO / HOOK / MÉMOIRE / MCP EXTÉRIEUR` : **NON INSTALLÉS / NON AUTORISÉS**.

Ce retour ne crée pas de sixième créateur YouTube ni de nouveau sujet de suivi systématique ; il ajoute **une méthode de fiabilité et deux compétences de développement** au service exclusif du projet Quantif Plancher V7. AMTA / Claude Code demeure séparé.
