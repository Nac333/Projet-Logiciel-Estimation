---
name: yt-viral
description: Classer les vidéos YouTube publiques de ConstructIQ, Shubham Sharma, Thomas Berton, Hamza Abdul Jabbar ou Better Boss par performance relative aux vues habituelles de chaque chaîne. Utiliser lors de la veille CONST. IA & Takeoff — NAC pour prioriser les vidéos dont le contenu pourrait améliorer la détection automatique et le takeoff PDF dans Quantif Plancher V7, sans confondre popularité et pertinence.
---

# yt-viral — Radar vidéo pour Quantif Plancher V7

Fournir un classement **indicatif** des vidéos anormalement performantes à partir de **métadonnées publiques ou transmises par l'utilisateur**. Le script ne collecte rien directement sur YouTube, ne récupère aucune transcription et ne démontre pas le contenu technique d'une vidéo. Ne pas modifier le logiciel HTML ou AMTA.

## Exécution locale (Python 3 sans dépendance externe)

Depuis la racine de `Nac333/Projet-Logiciel-Estimation` :

```sh
python3 .agents/skills/yt-viral/swipe.py chemin/videos.json --min 2.0 --json
```

Entrée JSON : `[{"channel":"ConstructIQ","title":"PDF Plan Example","views":5000,"url":"https://www.youtube.com/watch?v=...","duration":600}, ...]`.

- Rassembler **au moins quatre vidéos réelles par chaîne**, de préférence sur une fenêtre temporelle comparable, sans inventer les vues, URLs ni dates. La fonction `swipe.py` ignore les chaînes dont l'échantillon est trop petit.
- Le ratio est `vues_de_la_video / mediane_des_vues_de_la_chaine_dans_le_jeu_collecte`. Ce n'est ni une mesure de qualité scientifique ni une preuve de viralité. La fraîcheur et l'ancienneté des vidéos rendent les comparaisons sensibles.
- La classification par formules de titres utilise `hooks.json`, 21 modèles **anglais de marketing de titres** provenant du dépôt amont. Cela ne détermine pas la technique de construction démontrée.
- **Prioriser toujours** les vidéos sur PDF, segmentation, pièces, murs/portes, plancher, céramique, quantités, OpenTakeoff, IA et tests fiables. Garder aussi les vidéos peu populaires mais pertinentes.
- Conserver URL, source des vues, date de collecte, échantillon, ratio et limites. Le rapport NAC doit distinguer `SOURCE VIDEO` de `TRANSCRIPTION LUE` et `DEMONSTRATION VERIFIEE`.
- Aucune clé API YouTube requise pour le traitement d'un fichier local; ne pas contourner l'authentification ni les limitations des plateformes. Aucun envoi de plans clients.

Code adapté de `Jakeschincariol/youtube-agent-skill` (MIT, commit `a2feb2104981a375ffd4f87ee04f4f5344ac43c6`), script `swipe.py` et données `hooks.json` regroupés dans ce dossier pour rendre la compétence autonome. Licence jointe.
