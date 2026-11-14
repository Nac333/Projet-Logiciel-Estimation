# Intégration sélective YouTube Agent Skill — NAC / Quantif Plancher V7

Source du code : https://github.com/Jakeschincariol/youtube-agent-skill
Commit source `a2feb2104981a375ffd4f87ee04f4f5344ac43c6` (16 septembre 2026). Licence MIT (copyright Jake Schincariol, 2026) incluse avec chaque compétence. L'usage est gratuit en Python 3 local; aucune clé API YouTube n'est nécessaire pour analyser des **fichiers déjà obtenus**. L'acquisition des transcriptions et des métadonnées est une étape séparée et conditionnelle à l'accès autorisé.

## Deux compétences installées dans le dépôt Codex

| Compétence | Code installé | Raison métier et réserves |
|---|---|---|
| `yt-viral` | `SKILL.md`, `swipe.py`, `hooks.json`, `LICENSE` | Repérer un intérêt inhabituel relativement aux autres vidéos d'une même chaîne, avec échantillon minimum de quatre. L'heuristique de classement des **titres** est anglophone et non représentative de la valeur technique. Prioriser toujours le takeoff des plans et la qualité des preuves. |
| `yt-chapters` | `SKILL.md`, `chapters.py`, `deadair.py`, `LICENSE` | Indexer des passages à partir de SRT/VTT/JSON Whisper déjà accessibles. Les frontières sont proposées par pauses et variation des mots, non par un modèle de compréhension vidéo. Titres à relire et valider. La regex a été adaptée pour prendre en charge les caractères accentués français et quelques mots courants. |

## Dépendances incorporées sans autres skills

Le code amont de `yt-viral/swipe.py` lit `../yt-script/hooks.json`; ce fichier de données a été copié **dans le même répertoire `yt-viral/`**, et le chemin Python adapté. Cela n'installe PAS `yt-script` comme troisième compétence.

Le code amont de `yt-chapters/chapters.py` importe une fonction `load` située dans `../yt-edit/deadair.py`; `deadair.py` a été copié **dans le même répertoire `yt-chapters/`** et le chemin d'import adapté. Cela n'installe PAS `yt-edit` comme troisième compétence.

## Usage dans NAC

1. Collecter légalement les données publiques / sous-titres fournis; annoter la date des vues.
2. Sélectionner les vidéos sur IA, PDF, segmentation, murs, coupes, surfaces et quantités; garder les vidéos techniquement importantes même avec peu de vues.
3. Pour un jeu de données comparables et suffisamment fourni, appeler `yt-viral` et noter ratio, taille d'échantillon et biais de date de publication.
4. Pour des sous-titres horodatés, appeler `yt-chapters` et revoir les chapitres/horodatages à la source.
5. Réaliser l'analyse technique habituelle en précisant l'accès réel aux images et aux transcriptions; produire « Ce qu'on a appris », priorités de détection et fiches Codex.
6. Rendre explicites `NON EXECUTÉ`, `EXÉCUTÉ SUR DONNÉES SYNTHÉTIQUES` et `VÉRIFIÉ SUR VIDÉO RÉELLE` et les confondre jamais.

Aucun besoin pour le moment des neuf autres compétences YouTube (scripts marketing, miniatures, rétention de notre chaîne, commentaires, calendrier, SEO, audit, montage, Shorts); pas d'installation massive.

## Critères de validation technique

- `swipe.py` : ratio correct sur échantillon médian 10, 10, 10, 90 = 9x pour la vidéo à 90 vues; moins de quatre vidéos entraîne un saut signalé; aucun appel réseau.
- `chapters.py` : entrée SRT valide donnant au moins trois chapitres à partir de 00:00, chaque segment ≥ 10 secondes; erreur explicite si transcription trop courte; test de mots accentués.
- Aucun accès au fichier de production `Quantif-Plancher-V7.html`; aucune sortie qui affirme avoir vu des captures de vidéos ou avoir mesuré des plans.
- Les scripts doivent être lancés réellement avant d'indiquer un succès; les tests de transcriptions réelles des cinq créateurs restent distincts.
