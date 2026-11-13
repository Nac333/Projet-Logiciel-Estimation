# Skills NAC dans Codex : installation et vérification

Projet : `Nac333/Projet-Logiciel-Estimation` / `Quantif-Plancher-V7.html`.
Version proposée le 12 novembre 2026. Aucun changement du logiciel HTML.

## Ce qui est effectivement intégré au dépôt

- La compétence NAC principale sous `.agents/skills/const-ia-takeoff-nac/` avec ses cinq sources vidéo préservées.
- Le radar technologique des 30 derniers jours et le routage de formation/coordination inspirés de cinq compétences tierces, avec limites et garde-fous.
- L'aiguillage depuis `AGENTS.md`.
- Les cinq compétences d'origine **ne sont pas encore téléchargées et installées** dans le dépôt ni sur l'ordinateur : les étapes suivantes restent facultatives.

## Installation sur ton PC/Mac (vérification préalable)

1. Fusionner la PR NAC après relecture.
2. Mettre à jour le dépôt local, par exemple `git pull --ff-only origin main` si sa branche active est bien `main`.
3. Dans la racine du projet, contrôler `node --version`, `npm --version`, `npx skills@latest --help`, et les instructions actuelles de https://github.com/vercel-labs/skills. Ne pas lancer d'installateur externe non inspecté.
4. Commencer par **Last 30 Days** et **Teach** seulement; activer les autres si un besoin documenté le justifie. Les commandes ciblent Codex et l'installation locale au projet (**sans `-g`**).

```sh
npx skills@latest add mvanhorn/last30days-skill --skill last30days -a codex
npx skills@latest add mattpocock/skills --skill teach -a codex
```

Optionnels, au besoin :

```sh
npx skills@latest add alirezarezvani/claude-skills --skill chief-of-staff -a codex
npx skills@latest add wheresryan22/anatomy --skill anatomy -a codex
npx skills@latest add coreyhaines31/marketingskills --skill marketing-psychology -a codex
```

Si l'option `--skill` ou le nom n'est pas accepté par la version installée, afficher l'aide et sélectionner le bon skill de façon interactive. Éviter `-g` et l'installation de l'ensemble des compétences d'un mono-dépôt. Exécuter les commandes seulement après contrôle du code téléchargé et du risque d'appels payants.

**Last 30 Days** : la version actuelle est un ensemble de scripts et ressources, pas seulement un `SKILL.md`. Vérifier Python 3.12+ avec `python3 --version` et suivre la procédure `references/runtime.md` officielle avant tout moteur. Plusieurs sources demandent des API, sessions ou clés : ne configurer aucune option payante. Si son moteur est indisponible, NAC poursuit une veille manuelle et déclare `last30days NON EXÉCUTÉ`.

**Teach** : utiliser un dossier d'apprentissage séparé des sources du logiciel, car les leçons et fichiers d'avancement sont écrits dans le répertoire courant.

**Chief of Staff** : avant usage natif, confirmer l'installation de ses rôles et de `context-engine`. Dans NAC, on peut déjà employer la méthode de synthèse sans installer tout l'écosystème.

**Anatomy** : compétence de visualisation, non de géométrie takeoff. Vérifier sa compatibilité Node/Chromium avant toute exécution.

**Marketing Psychology** : non nécessaire pour le takeoff. Pas de raison d'ajouter ce moteur au flux hebdomadaire.

## Contrôles après installation

```sh
git status --short
find .agents/skills -maxdepth 2 -name SKILL.md -print
git diff --stat
```

Ouvrir Codex sur le projet. Demander la liste des compétences réellement détectées et les fichiers `SKILL.md` accessibles. Pour la compétence NAC, déclencher une revue du dernier mois sans publier de codes ni charger de plans confidentiels.

Ne jamais annoncer `Last 30 Days exécuté` sans une commande moteur exécutée avec ses instructions, ni `takeoff validé` sans confrontation à un relevé indépendant. Les méthodes d'organisation et les recherches de sources ne prouvent pas la précision de segmentation.

Pour annuler seulement cette intégration, fermer la PR sans fusionner; pour une PR déjà fusionnée, utiliser un revert du commit dans une nouvelle branche. Ne jamais effacer `Quantif-Plancher-V7.html` ou les sept compétences Estimation historiques.

## Fichier en production

Le fichier `Quantif-Plancher-V7.html` reste inchangé. Aucune offre, aucun abonnement, aucune clé API et aucun service facturable ne sont activés par ces instructions.
