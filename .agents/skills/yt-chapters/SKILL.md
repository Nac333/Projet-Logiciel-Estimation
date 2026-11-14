---
name: yt-chapters
description: Découper localement en chapitres horodatés les transcriptions SRT, VTT ou Whisper JSON de vidéos YouTube liées au takeoff, à l'IA et aux plans PDF. Utiliser dans CONST. IA & Takeoff — NAC pour retrouver des passages montrant la segmentation de pièces, l'échelle, les murs, les corrections et les limitations avant de préparer un rapport ou une fiche Codex pour Quantif Plancher V7.
---

# yt-chapters — Index de transcriptions pour la veille NAC

Organiser des sous-titres **horodatés et autorisés** de vidéos des cinq créateurs, puis faire examiner les passages techniques pertinents. Cette compétence **n'obtient pas elle-même de transcription**, ne télécharge pas de vidéo, ne regarde pas les images et ne certifie pas le sens des propos.

## Exécution locale (Python 3 sans dépendance externe)

Depuis la racine du dépôt :

```sh
python3 .agents/skills/yt-chapters/chapters.py chemin/video.srt --target 8 --json
```

- Accepter les formats SRT, VTT ou JSON Whisper supportés par `deadair.py`. Les horodatages sont ceux de la transcription et doivent être vérifiés contre la vidéo lorsque l'accès est possible.
- Le programme repère des **limites de chapitres suggérées** par les pauses et les variations lexicales, pas une compréhension garantie du contenu. Il fournit des titres de brouillon et vérifie des contraintes générales de chapitres (premier point 00:00, au moins 3 chapitres, 10 s minimum). Des transcriptions incomplètes, des mots techniques ou des changements de langue peuvent dégrader le résultat.
- Adaptation minimale : `deadair.py` est inclus localement plutôt qu'importé depuis une autre compétence; prise en charge de mots Unicode et quelques mots-outils français ajoutés. **Cette adaptation n'a pas la fiabilité d'un modèle de segmentation sémantique**, surtout pour la construction en français.
- Pour NAC, annoter les chapitres réels : `PDF / géométrie`, `segmentation automatique`, `murs et ouvertures`, `finis et revêtements`, `correction humaine`, `tests et limites`. Ne pas inventer des thèmes ou des minutes sans source.
- Dans « Ce qu'on a appris », différencier `chapitre proposé automatiquement`, `paroles accessibles`, `démonstration visualisée` et `méthode validée`.
- Pas de publication ni retouche de la vidéo d'origine. Aucun partage de plans clients ni installation d'API.

Code adapté de `Jakeschincariol/youtube-agent-skill` (MIT, commit `a2feb2104981a375ffd4f87ee04f4f5344ac43c6`), fichiers `chapters.py` et `deadair.py` regroupés dans ce dossier. Licence jointe.
