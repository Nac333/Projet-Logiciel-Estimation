# Quantif Plancher - tests de demarrage

L'application existante reste `Quantif-Plancher-V7.html` : aucun changement
au code applicatif et aucun nouveau framework ne sont necessaires.

## Installation locale

Prerequis : Node.js 22 LTS a jour (ou une version plus recente compatible)
et npm. Dans le dossier du depot :

```sh
npm ci
npx --no-install playwright install chromium
npm test
```

Sous Linux, les bibliotheques systeme du navigateur peuvent etre installees avec :

```sh
npx --no-install playwright install --with-deps chromium
```

Playwright Test et ses deux dependances sont verrouilles en version 1.64.1.
Ne pas envoyer `node_modules`, les navigateurs ou les rapports dans Git.

## Commandes utiles

```sh
npm run test:server       # 5 tests du serveur, sans navigateur
npm run test:e2e          # test du vrai fichier HTML avec Chromium
npm run test:e2e:headed   # meme test avec fenetre de navigateur
npm run test:e2e:report   # ouvrir le dernier rapport HTML
npm run serve:test       # ouvrir manuellement l'application sur le port 4173
```

Le serveur lie uniquement `127.0.0.1`. Il sert le fichier HTML sans le modifier,
a `/` et `/Quantif-Plancher-V7.html`, sans publier les autres fichiers du depot.
Il s'agit d'un serveur de test, pas d'un hebergement de production.
Playwright le demarre et l'arrete automatiquement. Le port 4173 doit etre libre.

## Ce qui est verifie

Le test navigateur ouvre **notre application**, pas une demonstration Playwright.
Il verifie la reponse HTTP, le titre non vide, le contenu visible, la presence
d'au moins un controle utilisable et l'absence d'erreurs JavaScript non interceptees
pendant le demarrage. Il joint une capture et les diagnostics au rapport.
Les erreurs reseau et console sont enregistrees, sans etre ignorees ou presentees
comme des preuves que toutes les fonctions du logiciel marchent.

**Un test de demarrage vert ne valide ni les mesures, ni l'import PDF, ni les
calculs, ni les exports.** Ces fonctions devront recevoir leurs propres scenarios
et des donnees de reference independantes, sans plans clients confidentiels.
Aucune assertion metier ne repose sur une competence IA non validee.

Les tests du serveur utilisent uniquement un petit HTML synthetique temporaire.
Ils ne remplacent jamais le fichier de l'application dans le test navigateur.

## GitHub Actions

Le workflow `.github/workflows/playwright.yml` execute les tests sur les pull
requests vers `main` et les pushes sur `main`. Il propose aussi un lancement
manuel une fois le workflow present sur la branche par defaut.

Dans GitHub : **Actions > Playwright Tests > une execution**.
Le resultat vert ou rouge et les journaux sont disponibles dans cette execution.
L'artefact `playwright-report-1` (numero de tentative variable) contient le rapport
et les preuves, conserves 7 jours. Apres extraction, on peut ouvrir le rapport avec :

```sh
npx --no-install playwright show-report chemin/vers/playwright-report
```

En cas d'echec avant l'execution du navigateur, il peut ne pas y avoir de rapport :
consulter alors les journaux de l'etape en echec.

Le workflow ne deploie rien et n'a que l'autorisation de lecture du depot.
Une pull request reste a approuver et fusionner humainement. Aucun resultat de
ce workflow ne contourne cette validation. Ce changement ne configure pas de
protection de branche : les controles obligatoires se reglent separement.

## Ajouter de vrais tests fonctionnels

Ajouter des scenarios dans `tests/e2e/` : import d'un PDF synthetique, zoom,
selection/modification de surface, sauvegarde/relecture et export. Pour les
quantites, verifier des valeurs calculees independamment; ne pas approuver
un resultat uniquement parce qu'il correspond a ce que le logiciel affiche.
