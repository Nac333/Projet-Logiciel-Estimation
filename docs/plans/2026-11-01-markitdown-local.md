# Intégration MarkItDown locale — Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un lecteur documentaire gratuit et local à Quantif Plancher V7 sans modifier les calculs de surfaces ni envoyer les documents à une API distante.

**Architecture:** Un serveur Python standard expose le HTML V7 inchangé et y insère un lien vers une page d'analyse locale. Un endpoint reçoit des fichiers binaires, les convertit via Microsoft MarkItDown et restitue uniquement du Markdown et des lignes mentionnant des codes de finis, à confirmer par l'estimateur.

**Tech Stack:** Python 3.10+, `markitdown==0.1.9` avec extensions de conversion, HTML/CSS/JavaScript natif, `unittest`.

## Global Constraints

- Zéro abonnement, zéro API distante, zéro modification du fichier V7 d'origine.
- Serveur lié uniquement à 127.0.0.1 et contrôle Origin/Host.
- Aucun calcul de géométrie ni attribution de produits non corroborée.
- Fichiers provisoires supprimés, taille maximale de 20 Mo par fichier.

---

### Task 1: Conversion locale et protection des fichiers

**Files:**
- Create: `markitdown_local/server.py`
- Create: `markitdown_local/__init__.py`
- Create: `markitdown_local/requirements.txt`
- Test: `tests/test_markitdown_local.py`

**Interfaces:**
- Consumes: `POST /api/convert?name=<filename>` avec corps binaire du fichier.
- Produces: JSON `{filename, markdown, finishes:[{code,extrait}], warnings}` ; 400/411/413/415/422/503 suivant les erreurs.

- [x] **Step 1: Add the focused failing test** — vérifier conversion par un convertisseur factice, nettoyage et refus extension/taille/origine.
- [x] **Step 2: Verify the relevant failure** — `python3 -m unittest discover -s tests -v` ; échecs attendus sur le module non implémenté observés.
- [x] **Step 3: Implement the minimum behavior** — validation d'extension, tampon mémoire et fichier temporaire, MarkItDown désactivant les plugins, extraction des codes et messages de limite.
- [x] **Step 4: Verify the focused pass** — `python3 -m unittest discover -s tests -v` ; 8 tests réussis dans l'environnement de préparation.
- [x] **Step 5: Run the affected integration check** — appel HTTP local avec convertisseur déterministe, succès 200 et suppression des fichiers temporaires.
- [ ] **Step 6: Commit the passing deliverable** — à inscrire dans une branche GitHub isolée.

### Task 2: Interface pour l'estimateur et documentation

**Files:**
- Create: `markitdown_local/analyse-documents.html`
- Create: `docs/MARKITDOWN_LOCAL.md`
- Test: `tests/test_markitdown_local.py`

**Interfaces:**
- Consumes: `GET /`, `GET /analyse-documents` et API `POST /api/convert`.
- Produces: navigation depuis le V7, prévisualisation Markdown, tableau de codes candidats et export CSV.

- [x] **Step 1: Add the focused failing test** — présence de la navigation et de la page d'analyse.
- [x] **Step 2: Verify the relevant failure** — tests rouges avant implémentation serveur.
- [x] **Step 3: Implement the minimum behavior** — interface de dépôt, vue du texte, CSV, téléchargements, erreurs par fichier.
- [ ] **Step 4: Verify the focused pass** — valider le JavaScript de la page et le parcours navigateur réel quand le moteur est installé.
- [ ] **Step 5: Run the affected integration check** — effectuer une conversion réelle d'un PDF non confidentiel et vérifier le rendu dans V7.
- [ ] **Step 6: Commit the passing deliverable** — à inscrire dans une branche GitHub isolée.

## Décisions encore ouvertes

- Validation humaine des codes et liaison au catalogue V7 : aucun import automatique activé.
- OCR local des PDF scannés : non installé ; choix du moteur et coûts de ressources à étudier distinctement.
- Conservation de la source et des références de page : différée au lot de validation documentaire.
