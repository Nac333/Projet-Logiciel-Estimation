# ECC — deux compétences ciblées disponibles pour Codex et Quantif Plancher V7

Date d'intégration : 18 novembre 2026. Source vérifiée : https://github.com/affaan-m/ECC (MIT ; ECC 2.2.3 dans le manifeste, commit analysé `3f14a103a8694e51c1df9a806217a6d0b5f7a6f7`). Référence : `.agents/skills/const-ia-takeoff-nac/references/ecc-selection-et-workflows-codex.md`.

## Décision

Le projet ECC (« Everything Claude Code ») est une collection massive de pratiques pour agents de développement (README : 72 agents, 327 skills, 98 commandes historiques), **pas** un moteur de géométrie ou de segmentation des plans. L'installation globale depuis `npx ecc-universal` ou depuis une marketplace est écartée : elle peut installer de nombreux skills, hooks et ressources superflus; ECC Pro est une offre payante optionnelle. **Aucun npx, hook, AgentShield, mémoire ou MCP ECC n'a été démarré.**

Deux skills **seulement**, sources MIT conservées avec préambules métier, sont accessibles à Codex dans ce dépôt :

| Skill | Usage dans Quantif Plancher V7 | Installation effective |
|---|---|---|
| `$content-hash-cache-pattern` | Concevoir un cache local et versionné d'extraction/rendu PDF, après analyse des performances et de l'état actuel | Instructions installées dans `.agents/skills/`; aucun cache de PDF ajouté à l'application |
| `$mcp-dependency-review` | Examiner les déclarations d'un MCP, ses versions et son caractère local/distants, **sans lancer** les commandes trouvées | Instructions installées dans `.agents/skills/`; aucun MCP nouveau ou scan runtime |

## Comment Codex doit les utiliser

### Besoin : ralentissement sur PDF lourds

1. Lire `AGENTS.md`, `Quantif-Plancher-V7.html`, les tests et la logique de rendu PDF existante.
2. Mesurer temps de chargement et mémoire sur **un plan synthétique ou autorisé**, et repérer les opérations répétitives (rendu, extraction texte, contours).
3. Utiliser `$content-hash-cache-pattern` **en conception seulement** tant que la modification n'est pas demandée. Cache clé : SHA-256 original + page + moteur/version + DPI/rotation/paramètres; inclure unités, échelle et règles d'exclusion pour tout résultat mesuré.
4. Prévoir les invalidations : modification PDF, nouvelle révision, changement d'échelle, paramètres, moteur, corrections manuelles. Protéger les mesures acceptées et les projets clients de toute publication externe.
5. Exécuter des tests seulement lors d'une tâche de développement autorisée : `cache hit`, `cache miss`, modifications, corruption, plusieurs échelles, trous, reprise, export conforme. Comparer temps et mémoire avant/après.

### Besoin : connexion MCP de relevé

1. Lire **statistiquement** le fichier de configuration du projet; ne pas activer les MCP ni lancer les commandes trouvées.
2. Avec `$mcp-dependency-review`, noter chaque fournisseur, URL/commande, sélecteur de version, contrôle de provenance, permissions et statut `LOCAL`/`EXTERNE`.
3. Distinguer version flottante et compromission **avérée**. Un paquet `@latest` est mutable mais cela ne prouve pas un piratage.
4. Ne jamais imprimer de jetons ni transmettre un plan privé. Si une configuration est risquée, recommander un correctif et demander validation avant toute installation.

## Contrôle de non-régression obligatoire sur demande de changement

- Rectangle 10 × 12 pieds = **120 pi²**, périmètre **44 pi lin.**
- Respecter les surfaces nettes, trous, murs, ouvertures, rotations, échelles par feuille et corrections conservées.
- Comparer les quantités proposées à un takeoff humain indépendant avant d'affirmer une amélioration IA.
- Respecter les tests Playwright existants et ne pas transformer la suite de tests d'une autre application.
- **Ne jamais** confondre `documentation ajoutée`, `code modifié`, `test exécuté` et `résultat validé`.

## Statut

- Instructions et licence des deux skills : **ajoutées à la branche GitHub**; après fusion, disponibles dans `main`.
- Moteur PDF et interface : **inchangés** par cette intégration.
- Installation locale de Codex sur PC/Mac : **non vérifiée**.
- Optimisation PDF, sécurité du runtime MCP et tests de précision : **NON EXÉCUTÉS**.

Objectif prioritaire : detection automatisée et fiable des surfaces, pas accumulation de compétences. Projet AMTA séparé.
