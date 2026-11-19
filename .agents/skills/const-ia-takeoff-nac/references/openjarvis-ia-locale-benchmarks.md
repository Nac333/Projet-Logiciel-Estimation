# OpenJarvis — analyse et méthodes pour Quantif Plancher V7

**Contrôle des sources : 18 novembre 2026.** Dépôt officiel : https://github.com/open-jarvis/OpenJarvis (licence Apache-2.0). Commit principal observé : `c3ed63f1d2a2c0c1f7dabbc69050e1968a11dc10` (18 novembre 2026 ; mise à jour de données de trafic). Documentation de référence : https://open-jarvis.github.io/OpenJarvis/.

## 1. Ce que fait réellement OpenJarvis

Le README présente **OpenJarvis comme une plateforme pour des agents d'intelligence artificielle locaux** sur ordinateur : moteurs d'inférence, agents, outils, import de skills, évaluation, statistiques de performance et suivi des traces. Des moteurs locaux tels qu'**Ollama, llama.cpp, MLX, LM Studio** sont décrits dans `docs/architecture/engine.md`. Les moteurs cloud OpenAI/Anthropic/Google et un système de connecteurs MCP externes existent **aussi** ; `local-first` ne garantit donc pas `local-only`.

Le produit cible Python **3.11 à <3.14**, avec environnement `uv`, une installation guidée qui peut ajouter Ollama et télécharger un modèle (espace disque/mémoire et matériel à vérifier). Le GUI depuis les sources demande Node.js 22+. L'installation suggérée par README utilise `curl ... | bash` ou PowerShell `irm ... | iex` : **ne jamais lancer ces commandes à l'aveugle**, ni sur l'ordinateur utilisateur ni dans la machine de production, au titre de la simple veille.

**Limitations confirmées dans le code** :

- `src/openjarvis/tools/pdf_tool.py` enregistre `pdf_extract` et emploie `pdfplumber` pour extraire du **texte** par pages d'un PDF ; il ne détecte pas de polygones de pièces, n'étalonne pas une échelle architecturale, ne calcule pas de surfaces nettes ou de plinthes.
- `tests/test_vision.py` vérifie le **transport de tableaux d'images en base64** entre un message et une requête Ollama : un test de sérialisation d'images, **pas une preuve de reconnaissance fiable des pièces**. La présence d'une entrée image ne suffit pas à valider un modèle vision en conditions réelles.
- `docs/user-guide/benchmarks.md` mesure temps de génération (moyenne/p50/p95) et débit de jetons; `docs/user-guide/evaluations.md` décrit une évaluation de modèles sur divers jeux de données académiques. Aucun résultat de précision du **takeoff de plancher** n'est fourni par ces documents.
- `docs/user-guide/data-boundary-scan.md` montre comment inventorier des chemins potentiels d'export de données ; le scan documente des **possibilités** et ne prouve pas qu'un réseau ou une API externe n'a jamais été appelé.
- `docs/telemetry.md` indique que les statistiques externes sont **désactivées par défaut jusqu'au consentement**, mais plusieurs autres réglages indépendants existent (traces, serveurs MCP, modèles cloud, apprentissage local ou connecté). Contrôler chaque option si un pilote est autorisé.

Aucun benchmark ni serveur OpenJarvis n'a été démarré par cette intégration; aucun résultat n'a été mesuré sur des plans privés.

## 2. Intérêt concret pour le métier du takeoff

| Capacité observée | Potentiel dans Quantif Plancher V7 | Priorité et limite |
|---|---|---|
| Backend d'inférence interchangeable, ex. Ollama | Tester un **petit modèle local** pour des étiquettes de pièces, de finis et des résumés de notes autorisés | **P1 expérimental** : reconnaissance à vérifier, aucun remplacement du moteur de segmentation géométrique |
| Contrat multimodal message → image Ollama | Piste pour utiliser des images de pages PDF rendues localement dans des requêtes à un modèle vision | **P1 étude** : compatible avec le transport, mais segmentation de polygones/mesures toujours non démontrées |
| Benchmarks de latence/débit/coûts | Comparer à matériel égal des moteurs/modèles locaux lors de l'analyse OCR, étiquetage, texte | **P1** : ajouter nos indicateurs métier; les jetons/s ne mesurent pas la précision des surfaces |
| Évaluation reproductible sur jeux d'essai | Définir un jeu de plans synthétiques annotés, versions de modèles et critères d'acceptation explicites | **P0 méthode** : comparer avec un relevé humain indépendant |
| Analyse des frontières de données | Préparer une liste de vérification « aucun plan privé à l'extérieur » avant tout essai | **P0 confidentialité** : vérifier la configuration ET le trafic dans un environnement isolé |
| Skills/agents et planification interne | Inspirations d'orchestration et d'agents de contrôle | **P2** : nos compétences NAC/Codex et notre automatisation existante rendent inutile une seconde plateforme permanente |

**À distinguer des outils existants** : AnyDoc et MarkItDown extraient principalement du contenu documentaire; OpenJarvis orchestre des **modèles** et propose un outil textuel PDF. Ni cette combinaison ni ses tests de vision ne justifient d'annoncer un relevé de surfaces automatisé opérationnel. Les compétences géométriques de V7 restent le moteur décisionnel.

## 3. Protocole d'évaluation original à remettre à Codex

Pour envisager un pilote futur, tester **sans plan client** sur un espace isolé non connecté à un serveur public et avec des jeux de documents synthétiques ou librement partageables.

### Reproductibilité de chaque essai
Consigner `plan_sha256`, `page`, `revision`, `echelle/units`, `moteur/version`, `nom_modele+version/digest`, `type_quantite`, `parametres`, `materiel_CPU/GPU/RAM`, `duree`, `memoire_max`, `cout`, `sous-ensembles_reussis`, `erreurs` et `preuve`.

### Épreuves métier obligatoires avant tout avis de fiabilité

1. **Étiquettes/finis** : extraire les codes VY1, CE1, CE2, notes de plinthes et références de feuilles; évaluer précision/rappel par code sur la vérité terrain.
2. **Pièces/contours** : comparer chaque polygone proposé à une annotation humaine; mesurer pièces manquées, faux positifs, **IoU des masques** et erreur de superficie nette par pièce.
3. **Géométrie vérifiable** : rectangle **10 pi × 12 pi = 120 pi²**, périmètre **44 pi lin.** ; pièce avec trou, ouverture, cloisons interrompues, rotation, plusieurs échelles.
4. **Mural vs plancher** : ne pas appliquer de hauteur arbitraire; distinguer céramique murale, receveur de douche/bain et surfaces au sol.
5. **Correction humaine** : refus ou ajustement des propositions, révisions de PDF et sauvegarde; les quantités refusées ne sont pas exportées.
6. **Coût et performances** : temps PDF complet, RAM/VRAM maximale, disponibilité CPU seulement vs GPU, coût réellement nul, absence de requête distante. Comparer une exécution à froid et après cache, sans mélanger des machines différentes.

Définir les seuils de précision **avant** l'essai, garder les sorties brutes et annotées, et comparer à une baseline (tracé manuel / segmentation existante). Un modèle local peut lire un texte sans savoir mesurer un espace.

### Sécurité : paramètres d'un pilote, et non configuration déployée

Avant tout essai : vérifier `analytics.enabled=false`, `traces.enabled=false`, `telemetry.enabled=false`, l'absence de moteur `cloud`, l'absence de fournisseurs/agents connectés, les MCP externes désactivés, les permissions d'accès fichiers, les ports, les journaux et l'absence de synchronisation/entraînement automatique. Lire la documentation officielle de la **version réellement installée** avant d'interpréter les paramètres : les exemples de configuration peuvent changer. Les modèles téléchargés ont leurs **propres licences**.

Ne pas supposer qu'un outil local est sûr par défaut : inspecter ses capacités shell/écriture, ses outils réseau et les permissions. Ne pas exécuter le script d'installation officiel depuis une URL distante sans revue du code, demande distincte et sauvegarde du poste.

## 4. Décision d'intégration et état

**Décision pour cette itération : adapter les méthodes de comparaison de modèles, de pipeline local-first et de contrôle des données dans `CONST. IA & Takeoff — NAC`, et remettre un guide Codex d'essai futur. Ne pas installer OpenJarvis dans le dépôt du logiciel ou sur le PC, ne pas démarrer Ollama, ne pas télécharger de poids de modèles, ne pas connecter de cloud.**

- `RECHERCHE CONFIRMÉE` : README, sources Python, tests de transport vision, docs benchmarks/evals, télémétrie, MCP et sécurité consultés.
- `COMPÉTENCE NAC ENRICHIE` : méthodes documentées; ne pas confondre avec installation native de Jarvis.
- `MOTEUR OPENJARVIS EXÉCUTÉ` : **NON**.
- `TEST DE TAKEOFF PDF RÉUSSI` : **NON**.
- `NOUVEAU MODÈLE LOCAL INSTALLÉ` : **NON**.

La veille NAC conserve les **cinq créateurs vidéo**, le radar technique GitHub et l'exclusivité **Quantif Plancher V7/Codex**. AMTA/Claude Code demeure distinct. Aucun nouvel agent autonome ou travail récurrent n'est créé pour OpenJarvis.
