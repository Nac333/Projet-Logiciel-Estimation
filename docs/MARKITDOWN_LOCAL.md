# Analyse documentaire locale — Quantif Plancher V7

Cette intégration **ne modifie pas** `Quantif-Plancher-V7.html` sur le disque. Le service local sert une copie de la page avec un bouton **Devis & finis** dans le bandeau supérieur. Aucun abonnement ni API distante n'est utilisé.

## Démarrer sur Mac ou PC

Ouvrir un terminal dans le dossier du projet et installer les dépendances Python dans un environnement isolé :

```bash
python3 -m venv .venv
```

Sur macOS/Linux :

```bash
.venv/bin/python -m pip install -r markitdown_local/requirements.txt
.venv/bin/python -m markitdown_local.server
```

Sur Windows (PowerShell) :

```powershell
.venv\Scripts\python.exe -m pip install -r markitdown_local\requirements.txt
.venv\Scripts\python.exe -m markitdown_local.server
```

Ouvrir ensuite `http://127.0.0.1:8765/` dans le navigateur, puis le bouton **Devis & finis**, ou directement `http://127.0.0.1:8765/analyse-documents`.

**Prérequis :** Python installé sur le poste, accès initial à Internet pour télécharger les dépendances Python. MarkItDown est gratuit sous licence MIT. Aucune installation administrateur n'est requise si Python et venv sont déjà disponibles. Vérifier les règles de sécurité applicables aux documents professionnels.

## Ce que fait cette première version

- Lit localement les formats PDF, DOCX, PPTX, XLS/XLSX, HTML, CSV et TXT (20 Mo maximum par fichier).
- Affiche le Markdown extrait et permet de télécharger un fichier `.md`.
- Repère des **mentions candidates** de codes `CE`, `VY`, `TA`, `RS`, `PL`, `PB`, `ML`, `MU`, `VT` suivis d'un numéro, avec leur ligne source.
- Exporte un CSV UTF-8 à séparateur `;` pour révision dans Excel.
- Efface les fichiers temporaires après conversion ; les documents ne sont pas envoyés à un service distant par ce module.
- Le serveur écoute exclusivement sur `127.0.0.1`, vérifie l'origine des requêtes et ne journalise pas les noms des documents.

## Limites importantes

- Les associations produit/localisation/plinthe **ne sont pas inférées** et doivent être vérifiées dans les dessins et devis originaux.
- Les PDF uniquement numérisés peuvent nécessiter un OCR **local séparé** (non installé et non activé).
- La géométrie, l'échelle, le calcul des surfaces et des plinthes demeurent exclusivement dans Quantif Plancher V7. Aucun relevé automatique n'est créé par ce module.
- Certaines structures complexes de tableaux et les numéros de page peuvent être perdus lors de la conversion.
- Aucune intégration automatique des résultats au catalogue des matériaux n'est activée : le CSV/Markdown est une étape de vérification humaine.
- Une conversion échouée, vide ou volumineuse ne doit jamais être interprétée comme l'absence d'un fini.

## Tests

Depuis la racine :

```bash
python3 -m unittest discover -s tests -v
```

Les tests utilisent un faux convertisseur déterministe pour vérifier les routes, les limites, l'extraction et la suppression des fichiers temporaires. **Ils ne prouvent pas une conversion réelle d'un PDF.** Tester séparément avec un devis non confidentiel après installation du moteur Microsoft.

## Confidentialité et fonctionnement

- Le traitement se fait sur la machine qui exécute le serveur local, pas dans les onglets d'un autre PC.
- Le module désactive les plugins facultatifs MarkItDown et ne configure aucune API externe ni serveur MCP.
- Ne pas l'exposer sur le réseau. Ne pas l'utiliser avec des documents non autorisés par l'entreprise.

## Architecture

`Quantif-Plancher-V7.html` (inchangé) → serveur Python local → bouton injecté dans le HTML servi → page `/analyse-documents` → POST binaire `/api/convert` → MarkItDown local → extraits vérifiables + Markdown/CSV.
