# Intégration sélective de quatre dépôts externes — Codex / Quantif Plancher V7
Date d'évaluation : 12 novembre 2026. Dépôt : Nac333/Projet-Logiciel-Estimation.

## Objet et état effectif

Priorité absolue : takeoff PDF **automatisé**, exact et éditable (pièces, murs, ouvertures, céramique sol/mur, plinthes, surfaces nettes et corrections). Éviter tout mélange avec un produit tiers ou un autre code. Aucune modification de `Quantif-Plancher-V7.html` n'est impliquée par l'installation de skills.

Dans la branche NAC, les instructions de **six skills autonomes** ont été ajoutées au dossier de projet `.agents/skills/`, avec leurs ressources pertinentes et copies des licences. Leur présence dans GitHub n'atteste pas leur téléchargement local ou leur exécution par Codex sur PC/Mac. Une fois la branche fusionnée et récupérée par Codex, l'agent peut les consulter. La bibliothèque AnyDoc n'est pas ajoutée aux dépendances de production de V7.

| Dépôt | Ajout concret dans Codex | Limite/précaution |
|---|---|---|
| [firecrawl/anydoc](https://github.com/firecrawl/anydoc) | `$convert-documents-to-markdown` (compétence d'extraction) | AnyDoc **n'effectue pas de takeoff géométrique ni d'OCR local**. Son CLI n'est pas installé dans le HTML. `--ocr hosted` interdit sur nos plans : envoie le fichier entier à un service externe. |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | `$source-driven-development`, `$performance-optimization`, `$constraint-driven-development`, `$browser-testing-with-devtools` | Seuls quatre skills ciblés sont copiés (pas le pack complet). Les outils de sécurité/qualité externes, Chrome DevTools MCP et tout système facultatif doivent être autorisés et vérifiés. Les tests Playwright déjà présents sont prioritaires. |
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | `$build-mcp-server` avec références officielles utiles au développement local, adapté par un préambule Codex | Skill d'origine orienté Claude; adapter les commandes MCP à Codex. Ne pas déployer sur Cloudflare ni sur un serveur distant sans décision explicite. Les autres plugins de la marketplace ne sont pas installés. |
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | **Analyse et procédure de pilote seulement**, dans la compétence NAC; pas de hooks, worker, plugin ou télémétrie installés. | Logiciel de mémoire persistante, pas un simple fichier SKILL. Il collecte potentiellement prompts, sorties d'outils, captures, etc. Sécuriser/évaluer le dispositif avant toute installation effective. |

### Provenance et licences

- AnyDoc : source `skills/convert-documents-to-markdown/SKILL.md`, code MIT. Le skill est modifié par un préambule de confidentialité propre au projet.
- Addy Osmani : sources `skills/{source-driven-development,performance-optimization,constraint-driven-development,browser-testing-with-devtools}`, licence MIT, notices `LICENSE` jointes dans chaque répertoire.
- Anthropic : source `plugins/mcp-server-dev/skills/build-mcp-server`, licence Apache-2.0 du plugin et références conservées avec attribution; préambule Codex ajouté.
- Claude-Mem : code Apache-2.0, **non copié** (dépend d'un service local complet); cette proposition documente seulement son éventuel pilote.

Ne jamais supposer qu'un skill est installé globalement à la machine, ou que son moteur logiciel est opérationnel, uniquement parce que `SKILL.md` se trouve dans GitHub.

## Directives de travail pour Codex

1. Lire `AGENTS.md`, `Quantif-Plancher-V7.html`, la branche courante, les tests existants et `docs/CODEX_TAKEOFF_GRATUIT.md`. Ne pas modifier l'HTML avant une tâche concrète et des contrôles de réception approuvés.
2. Sur les PDF **textuels**, tester d'abord des exemples autorisés avec l'extraction locale AnyDoc; comparer l'extraction aux résultats de Microsoft MarkItDown et à des tableaux contrôlés manuellement. Indiquer références extraites, erreurs et temps réels. Les PDF scannés nécessitent un autre OCR **local**, non disponible dans AnyDoc.
3. Pour la géométrie, continuer à utiliser en priorité `$estimation-plans-geometrie`, `$estimation-takeoff-automatise` et `$estimation-evaluer-takeoff`. Le Markdown ne contient pas les données nécessaires à la mesure vectorielle fiable.
4. Utiliser `$source-driven-development` pour documenter les APIs/bibliothèques précises avant intégration. Vérifier les versions et licences réelles.
5. Utiliser `$performance-optimization` uniquement après une mesure de base reproductible (PDF lourd, pages nombreuses, zoom, mémoire, temps de détection, latence d'édition).
6. Utiliser `$constraint-driven-development` pour préparer des contrôles qualité sans inventer de seuils de détection. **Les valeurs de précision sont définies avant les tests**, comparées aux relevés humains.
7. `$browser-testing-with-devtools` sert de complément à Playwright **uniquement si** le Chrome DevTools MCP est disponible et fonctionne dans un profil isolé. Ce skill décrit un `.mcp.json` orienté Claude; ne pas coller cette config dans Codex sans adaptation.
8. Avec `$build-mcp-server`, concevoir au besoin une intégration **MCP locale** entre les composants PDF/takeoff (ex. OpenTakeoff) et Codex; minimiser les outils, données et droits, conserver une confirmation humaine. Ne pas installer un serveur distant par défaut.
9. Sauvegarder documentation, scripts et tests sur une branche dédiée avec PR. Ne pas installer des modèles/abonnements/APIs payantes ni divulguer des plans.
10. Tout rapport de tests doit marquer `REUSSI`, `ECHEC`, `NON EXECUTE` pour chaque scénario. Une compétence installée n'équivaut pas à une capacité logicielle développée.

### Protocole d'essai AnyDoc vs MarkItDown (sans coûts externes)

Utiliser un ensemble de documents **autorisés ou synthétiques** : PDF vectoriel de plans, devis avec tableau de finis, DOCX et XLSX simples, et un scan volontairement annoté. Pour chaque outil : comparer pages couvertes, codes de finis, références de feuilles, tableaux, faux positifs, erreurs, durée. Pour le scan, signaler `OCR INDISPONIBLE` si aucun moteur local autorisé. Ne pas traiter l'absence d'OCR comme une invitation au cloud.

Commande facultative à exécuter par Codex **dans une installation approuvée**, pas pendant le chargement du skill :

```sh
node --version
npx @firecrawl/anydoc --help
npx @firecrawl/anydoc chemin/document.pdf -o resultat.md
```

La première exécution `npx` peut télécharger un binaire; vérifier la source et les conditions avant son exécution. Si le registre npm est inaccessible, documenter `NON EXECUTE`. Ne jamais utiliser `--ocr hosted`.

### Pilote Claude-Mem : bloqué par précaution

La documentation source indique un worker Bun, SQLite local, hooks des agents, recherche MCP et observateur LLM. Elle annonce la prise en charge de Codex et un mode `--provider codex` avec authentification Codex CLI; aucun test de ce mode n'est réalisé ici. Les réglages de capture d'images, télémétrie et synchronisation peuvent exposer du contenu; l'observateur peut consommer les quotas de l'abonnement, et d'autres offres peuvent demander un paiement.

Évaluer éventuellement dans un répertoire isolé **sans plans ni secrets**, avec collecte désactivée par défaut, après approbation de l'utilisateur et contrôle de l'administrateur Enterprise. Ne pas lancer `npx claude-mem install` ni activer les hooks silencieusement. Pour la veille NAC, préférer le registre durable GitHub, les ADR et les rapports existants.

### Règles géométriques métier

- Calibration indépendante par feuille; pixels/PDF/unités physiques; conversions contrôlées.
- Surface nette, trou, murs, ouvertures, espace commun, pièces reliées, céramique sol vs mural, hauteur, plinthes; rejets et corrections conservés.
- Cas référence : rectangle 10 × 12 pieds = 120 pi²; périmètre = 44 pi lin.
- Tests comparatifs : vectoriel/scan, plan tourné, échelles distinctes, exclusion, révision de feuille, sauvegarde/refus, export Excel des seules propositions acceptées.
- Ne pas conclure qu'une extraction textuelle, un test de navigation ou un plugin mémoire rend le takeoff automatique.

## Transmission / statut de la PR

Cette notice et les six skills ciblés sont proposés dans la PR NAC; Codex doit utiliser les fichiers après validation/fusion et synchronisation du dépôt. La PR n'est pas une exécution d'agent autonome. Vérifier la branche et les commentaires PR avant toute implémentation. Les composants tiers exécutables restent non testés tant que les commandes ne sont pas réellement lancées.
