# Deux compétences YouTube intégrées à Codex — CONST. IA & Takeoff — NAC

Projet exclusif : `Nac333/Projet-Logiciel-Estimation`, **Quantif Plancher V7**. Aucun changement du logiciel de production ni du projet AMTA.

## Installation dans le dépôt

Sous `.agents/skills/`, les dossiers `yt-viral` et `yt-chapters` contiennent chacun `SKILL.md`, `agents/openai.yaml`, les scripts Python nécessaires et une copie de la licence MIT. Il n'est pas nécessaire d'installer Claude Code, yt-script ou yt-edit pour exécuter les scripts repris ici. Les fichiers n'installent pas Python 3 sur les postes utilisateurs.

Source vérifiée : https://github.com/Jakeschincariol/youtube-agent-skill, commit `a2feb2104981a375ffd4f87ee04f4f5344ac43c6`. Les scripts sont adaptés uniquement pour regrouper leurs dépendances et mieux gérer les accents dans les chapitres. Ne pas présenter cette adaptation comme une transcription vidéo automatique.

## Commandes à utiliser depuis le dépôt local synchronisé

```sh
python3 --version
python3 .agents/skills/yt-viral/swipe.py chemin/vers/videos.json --min 2.0 --json
python3 .agents/skills/yt-chapters/chapters.py chemin/vers/transcription.srt --target 8 --json
```

**Exemple d'entrée yt-viral :**

```json
[
  {"channel":"Demo-NAC","title":"PDF plan - etude","views":10,"url":"https://www.youtube.com/watch?v=exemple1"},
  {"channel":"Demo-NAC","title":"Plinthes - essai","views":10,"url":"https://www.youtube.com/watch?v=exemple2"},
  {"channel":"Demo-NAC","title":"Murs et portes - essai","views":10,"url":"https://www.youtube.com/watch?v=exemple3"},
  {"channel":"Demo-NAC","title":"Detection des pieces - essai","views":90,"url":"https://www.youtube.com/watch?v=exemple4"}
]
```

Les URLs ci-dessus sont **fictives**. Le ratio de la quatrième vidéo vaut 90 / 10 = 9 fois la médiane. N'utiliser que des données vérifiables pour les rapports réels.

**Exemple yt-chapters :** fournir un fichier SRT/VTT ou une transcription Whisper JSON avec horodatages; le script propose des limites de chapitres. Vérifier les étapes de construction démontrées dans la vidéo, indépendamment des titres proposés.

## Tests automatisés du dépôt

```sh
python3 -m unittest discover -s tests/nac_youtube -v
```

Tests synthétiques : ratios, échantillons insuffisants, chapitres valides, transcript trop court et Unicode français. Le résultat d'un test synthétique ne démontre pas la lecture intégrale des vidéos des cinq créateurs.

## Priorités pour Codex

1. Les **cinq créateurs NAC** et leurs archives demeurent prioritaires; `yt-viral` ne doit jamais supprimer une vidéo technique pour cause de faible audience.
2. Chercher d'abord les nouveaux progrès **en détection automatique des pièces, métrés et géométrie PDF**; les deux scripts sont seulement des outils de tri.
3. Conserver la trace du texte réellement accessible et différencier analyse de transcription et analyse d'images/gestes.
4. Ne pas utiliser les neuf autres skills du pack ou publier de contenu sans demande distincte.
5. Gratuité : Python standard; pas d'API, aucun transfert de plans ni droit implicite sur des vidéos privées.

## Statuts

- `FICHIERS SUR GITHUB` : vérifiable par la présence dans la branche principale après fusion.
- `TEST SYNTHÉTIQUE PYTHON` : si commande réellement exécutée avec sortie.
- `INSTALLÉ SUR PC/MAC` : non établi sans synchronisation du dépôt et vérification locale.
- `VEILLE VIDÉO RÉELLE` : non établie sans données collectées et vérifiées.
