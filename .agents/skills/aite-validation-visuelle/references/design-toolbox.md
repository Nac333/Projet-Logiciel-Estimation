# Outils design intégrés à AITE

Périmètre: installation des ressources de développement; aucune maquette sélectionnée ni refonte du logiciel autorisée par cette opération. Quantif Plancher V7 et AMTA restent séparés.

| Ressource | Intégration réelle |
|---|---|
| Web Design Guidelines | Compétence d'audit et copie datée des règles officielles |
| Taste Skill | Adaptation AITE installée; ni plugin complet ni hooks automatiques |
| Image to Code | Adaptation AITE installée, utilisable après choix explicite de maquette |
| Awesome DESIGN.md | Référence de systèmes visuels; aucune identité de marque copiée |
| Microsoft Playwright CLI | Dépendance de développement @playwright/cli 0.1.24, verrouillée dans tools/design du dépôt |
| 21st / Magic MCP | Référence documentée; NON CONNECTÉ, authentification et coûts non validés |

Les adaptations sont dans `.agents/skills/aite-design-taste` et `.agents/skills/aite-image-to-code`; l'audit dans `.agents/skills/web-design-guidelines`. Le guide `DESIGN.md` définit les contraintes existantes, pas une palette approuvée.

## Utilisation locale

Depuis la racine du dépôt synchronisé, avec Node et npm disponibles:

```sh
npm ci --prefix tools/design
npm exec --prefix tools/design -- playwright-cli --help
npm exec --prefix tools/design -- playwright-cli -s=aite open http://127.0.0.1:8765/Quantif-Plancher-V7.html
```

Pour un navigateur système, vérifier `playwright-cli open --help`; ne pas supposer qu'un binaire téléchargé est présent. Installer un navigateur seulement si nécessaire. Profils isolés, aucun compte privé ou plan client dans une session d'essai. La dépendance est installée dans l'environnement de travail de cette conversation; cela n'installe rien sur le PC de l'utilisateur.

Pour les audits, rapporter les preuves fichier:ligne. Utiliser une capture non sensible et un PDF synthétique pour les tests; ne pas publier de plans clients. Les tests du CLI ne valident pas les calculs métier. Avant toute refonte: propositions comparables, choix explicite, puis changements CSS/UI limités et tests.

Awesome DESIGN.md: https://github.com/VoltAgent/awesome-design-md — source d'inspiration documentaire, pas un service à installer.
21st: https://github.com/21st-dev/magic-mcp — ne pas créer de clé, connecter de compte, envoyer des données ou activer de crédits payants implicitement.

## Vérification du 13 novembre 2026

- `playwright-cli --version`: 0.1.24, réussi; aide du CLI accessible.
- Téléchargement Chrome: échec (archive invalide reçue).
- Lancement avec Chromium système: bloqué par la restriction de sockets de cet environnement. Tests UI AITE NON EXÉCUTÉS; aucun résultat de takeoff validé.
- Compétences: validation structurelle réussie. Les cinq tests YouTube existants passent.
