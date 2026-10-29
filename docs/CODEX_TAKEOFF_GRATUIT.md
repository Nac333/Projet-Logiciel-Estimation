# Installer les outils de takeoff gratuits dans Codex

Ce depot fournit sept competences dans `.agents/skills/` et deux connexions MCP dans `.codex/config.toml`. Aucun changement de `Quantif-Plancher-V7.html` n'est requis.

## Preparer son ordinateur
1. Mettre le depot local a jour avec `git pull` sur `main`.
2. Avoir Node.js 20+ et Codex CLI ou l'extension Codex IDE. Verifier `node -v`, `npx --version` et `codex --version`.
3. Ouvrir le repertoire du depot dans Codex et le marquer comme projet fiable. Codex ignore les couches `.codex/` des projets non fiables.
4. Laisser l'administrateur Enterprise approuver les MCP si l'organisation le demande. Aucune politique de securite n'est contournee.

## Verifier
- Dans le projet, `codex mcp list` ou la commande Codex `/mcp` doit montrer `opentakeoff` et `craft_quantities`.
- Cette liste confirme seulement l'enregistrement. Demander a Codex une operation de lecture sur un plan de demonstration public pour tester la connexion et le lancement.
- Pour appeler la competence de releve, utiliser `$estimation-mcp-takeoff-gratuit`. On peut aussi selectionner une autre competence dans `/skills`.
- Exemple de test public : `demo/sample-finish-plan.pdf` du depot Kentucky-ai/opentakeoff. Lire les feuilles et la note d'echelle; valider une cote avant de mesurer.
- Verifier les propositions et superpositions avant acceptation. Ne pas importer de quantites dans Estimation sans controle.

## En cas de blocage
- `npx` indisponible : installer Node.js; sous Windows, si le processus ne demarre pas, essayer `npx.cmd` dans la configuration.
- Connexion npm impossible : verifier les restrictions reseau. Une installation ne peut pas etre consideree reussie sans lancement de serveur.
- Serveur absent : verifier la confiance du depot, la version de Codex et les autorisations Enterprise.
- `one_click` / `detect_rooms` absents : c'est normal, OpenTakeoff les desactive par defaut. Utiliser `measure_polygon`.
- Craft Quantities inaccessible : les releves OpenTakeoff et les calculs internes peuvent continuer sans service distant.

## Confidentialite et cout
- OpenTakeoff : moteur local libre AGPL-3.0. Utiliser le MCP n'autorise pas automatiquement a reutiliser son code dans un produit commercial ferme.
- Craft Quantities : serveur distant gratuit, sans cle, soumis a des quotas. Utiliser seulement des donnees autorisees ou anonymisees.
- Aucune installation de Exayard, Kreo, Togal AI ou zzTakeoff, dont les services peuvent etre payants.
- Les commandes et autorisations locales restent a executer sur votre ordinateur; une configuration dans GitHub ne prouve pas que Codex l'a demarree.

Sources officielles :
https://github.com/Kentucky-ai/opentakeoff/blob/main/docs/CONNECT.md
https://craftquantities.com/api/
https://learn.chatgpt.com/docs/build-skills
https://learn.chatgpt.com/docs/config-file/config-basic
