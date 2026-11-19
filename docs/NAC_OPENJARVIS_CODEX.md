# OpenJarvis — transmission à Codex pour Quantif Plancher V7

Date : 18 novembre 2026. Source : https://github.com/open-jarvis/OpenJarvis. Licence Apache-2.0. Commit observé : `c3ed63f1d2a2c0c1f7dabbc69050e1968a11dc10`. Voir `.agents/skills/const-ia-takeoff-nac/references/openjarvis-ia-locale-benchmarks.md` pour les fichiers officiels consultés, limites et recommandations.

## Résultat exact

Les **méthodes** de comparaison d'IA locales, de tests reproductibles et de protection des plans sont désormais documentées dans `CONST. IA & Takeoff — NAC` et orientées par `AGENTS.md`. **Le framework OpenJarvis n'est pas installé dans V7 ou sur le PC.**

### Ce que nous pouvons apprendre

| Élément OpenJarvis vérifié | Utilité possible | Ce que cela ne prouve pas |
|---|---|---|
| Moteurs locaux Ollama, llama.cpp, LM Studio et autres | Tester une lecture privée des étiquettes et notes de finis | Ni OCR garanti ni contours/surfaces exacts |
| Outil `pdf_extract` dans `src/openjarvis/tools/pdf_tool.py` | Extraction textuelle avec pdfplumber, à comparer avec AnyDoc/MarkItDown | Pas un moteur de takeoff |
| `tests/test_vision.py` | Transport d'images base64 vers Ollama | Pas de reconnaissance validée des pièces |
| `openjarvis.evals` et `openjarvis.bench` | Méthodes d'évaluation de la justesse et des performances | Aucun résultat métier sur des plans de revêtement fourni |
| `docs/user-guide/data-boundary-scan.md`, `docs/telemetry.md` | Checklist de confidentialité avant exécution locale | `local-first` n'interdit pas les réseaux, MCP ou fournisseurs cloud |

## Cahier de tests pour un futur pilote séparé

**Étape 1 — Sans installation** : lire l'HTML actuel, les scripts/tests existants, établir une matrice des composants du PDF (texte, éléments vectoriels, images, géométrie) et confirmer les besoins réellement non couverts.

**Étape 2 — Jeu de référence synthétique** : plan PDF avec deux pièces, échelle explicite, rectangle 10 x 12 pieds (120 pi², 44 pi lin.), pièce avec trou, salle de bain, murs interrompus, rotations et noms de finis. Ajouter un relevé humain indépendant, la révision de chaque page et les résultats attendus.

**Étape 3 — Pistes distinctes** :
- Lecture de codes et notes avec une IA locale via moteur approuvé, si une tâche l'autorise. Mesurer faux positifs/omissions, page et code de fini.
- Détection géométrique de pièces avec un moteur spécifique de segmentation (à identifier et comparer) et polygones modifiables; OpenJarvis n'apporte **pas** ce moteur.
- Contrôle indépendant par estimateur des surfaces/quantités, puis acceptation/refus avant export Excel.

**Étape 4 — Benchmarks** : à matériel et PDF constants, comparer temps p50/p95, mémoire maximale, coût réel, précision/rappel, IoU des contours, écarts pi², disponibilité CPU ou GPU. Distinguer temps de chargement à froid et à chaud avec les contrôles de cache déjà référencés dans NAC.

**Étape 5 — Confidentialité** : aucun fichier client, code de licence ou clé dans les tests publics; vérifier (et bloquer si nécessaires) cloud, accès réseau, télémétrie, traces, synchro, outils shell et serveur MCP. Le guide OpenJarvis recommande plusieurs réglages indépendants pour un mode strictement local; consulter la version exacte avant tout essai.

### Prérequis si le propriétaire demande plus tard une installation locale

OpenJarvis demande Python >= 3.11, < 3.14 selon `pyproject.toml`. Le GUI depuis une copie source utilise Node.js 22+. L'installation guidée peut ajouter `uv`, Ollama et télécharger des modèles lourds. **Ne pas exécuter** ses commandes `curl | bash` et `irm | iex` sans audit préalable, approbation, sauvegarde et contrôle des licences/ressources.

## Périmètre du changement GitHub

Cette intégration modifie **seulement** :
- le skill NAC et sa référence de recherche;
- `AGENTS.md` (instructions Codex);
- ce guide d'évaluation;
- un petit contrôle statique hors ligne si ajouté.

Ne pas toucher au code `Quantif-Plancher-V7.html`, à AMTA/Claude Code, au dépôt de production, aux MCP installés ou aux paramètres personnels.

**Statuts à séparer** : `SOURCE ANALYSÉE`, `MÉTHODE INTEGRÉE À NAC`, `MODÈLE LOCAL INSTALLÉ`, `ESSAI IA EXÉCUTÉ`, `TAKEOFF VALIDÉ`. Seuls les deux premiers peuvent être affirmés après validation/fusion de la PR; tous les autres restent **NON EXÉCUTÉS**.
