# Trois dépôts GitHub examinés — revue du 12 novembre 2026

Projet exclusif : Quantif Plancher V7 développé avec Codex. **Priorité absolue : automatiser le takeoff PDF** (pièces, contours, murs/ouvertures, céramique, plinthes, quantités acceptées et vérifiées). Ces outils ne proposent pas eux-mêmes un moteur validé de segmentation de plancher.

## 1. google/elephant-goldfish-model — À retenir pour les spécifications (P1)

Source : https://github.com/google/elephant-goldfish-model ; licence du dépôt Apache-2.0, non présenté comme un produit officiellement pris en charge par Google.

**Ce que le dépôt montre** : EGM est un plugin complet, pas un modèle de vision ni un détecteur de pièces. « Elephant » conserve l'historique du projet pour rédiger une spécification; des « Goldfish » indépendants examinent cette spécification avec un contexte conversationnel frais. Il propose notamment `egm-review` (critique structurée), `egm-drift-report` (écart code/documentation), `egm-draft` et `egm-bootstrap`.

**Application NAC/Codex** : faire relire une spécification de détection de pièces/contours, d'exclusion de SDB, de calibration multi-feuilles et de navigation plan-coupe avant d'implémenter. Donner aux relecteurs la documentation métier et les tests de référence, mais pas le raisonnement antérieur du rédacteur. Les conclusions doivent être comparées aux relevés indépendants. `egm-drift-report` peut confronter les fonctions documentées et les fonctions réellement présentes dans le HTML. Cette compétence est complémentaire de `writing-plans`, `test-driven-development` et des contrôles de qualité déjà présents; ne pas installer leurs doublons.

**Prérequis réels** : EGM indique qu'il faut installer son plugin *entier* (skills + agents + resources + docs), pas copier un seul SKILL.md. Pour Codex CLI, instructions amont :

```sh
codex plugin marketplace add google/elephant-goldfish-model
codex plugin add egm@egm
```

Commande **NON EXÉCUTÉE** sur le poste utilisateur. L'installation complète nécessite un Codex compatible, des quotas d'agents et l'accès aux sous-agents. Sans outil de délégation à contexte frais, le review Goldfish doit s'arrêter sans prétendre à une revue isolée. Dans certains cas, `AGENTS.md` reste visible dans les sous-agents : le contenu d'instructions n'est pas nécessairement isolé. Consulter https://github.com/google/elephant-goldfish-model/blob/main/docs/codex.md et https://github.com/google/elephant-goldfish-model/blob/main/docs/harnesses.md avant usage. Ne pas simuler une vérification indépendante.

## 2. tashfeenahmed/freellmapi — Bac à sable facultatif, pas production (P3)

Source : https://github.com/tashfeenahmed/freellmapi ; licence MIT pour le code.

**Ce que le dépôt montre** : logiciel local de **routage d'appels LLM**, compatible avec un point d'entrée type OpenAI. Il agrège des quotas gratuits déclarés par de nombreux fournisseurs, gère les clés, les limites, le basculement et la disponibilité, avec compatibilité documentée Codex CLI. L'affirmation de « 10,1 milliards de jetons/mois » est un **maximum agrégé annoncé par l'auteur**, pas un droit garanti ni le quota d'un utilisateur; les fournisseurs doivent être configurés individuellement. Un abonnement commercial facultatif existe pour un catalogue plus rapide.

**Limite déterminante** : la section Disclaimer du README dit explicitement **« for personal experimentation and learning, not production »**. Les requêtes envoyées aux modèles passent par des fournisseurs externes et restent soumises à leurs conditions d'utilisation. Les plans d'architecture, devis clients, fichiers confidentiels et données d'entreprise **ne doivent pas être envoyés à ce routeur**. Aucun fournisseur, clé, compte, installation Docker ni abonnement n'a été configuré ou exécuté.

**Usage possible** : uniquement une expérimentation sur textes fictifs ou données synthétiques, avec budget zéro confirmé et contrôle des fournisseurs; ne pas l'intégrer au moteur de takeoff de V7 ni contourner les quotas de Codex/ChatGPT.

## 3. 21st-dev/magic-mcp — Veille UI seulement (P3)

Source : https://github.com/21st-dev/magic-mcp ; licence du proxy ISC.

**Ce que le code montre** : le paquet `@21st-dev/magic` **n'est plus un serveur de génération autonome**. Depuis 0.2.0, `src/index.ts` est un proxy local stdio qui renvoie les messages MCP à `https://21st.dev/api/mcp`. Le service actuel s'appelle **21st MCP**. Sa bibliothèque cible surtout des composants React/Tailwind, l'inspiration UI et la génération distante.

**Risque et compatibilité** : un compte/une clé API est requis. Certaines fonctions `generate` et `iterate_generation` n'apparaissent que si l'accès AI est activé; récupération de code et génération peuvent être payantes. Le programme V7 est un grand fichier HTML existant, pas un projet React/Tailwind natif. Copier les composants ou convertir l'interface serait un chantier UI distinct de la détection automatique. Aucune installation recommandée avant validation visuelle explicite de l'utilisateur et vérification de la gratuité. Ne jamais envoyer de plans au service.

## Décision et registre à conserver dans NAC

| Source | Recommandation | Réellement installé/exécuté |
|---|---|---|
| Elephant-Goldfish Model | P1 : préparer un contrôle de conception / divergence dans Codex, sous réserve de vrais sous-agents et autorisation locale. | NON — documentation/routage seulement. |
| FreeLLMAPI | P3 : suivre les évolutions; expérience fictive facultative, zéro production. | NON — aucune clé ni service configuré. |
| Magic MCP / 21st MCP | P3 : surveiller seulement les composants UI; ne pas déplacer la priorité takeoff. | NON — aucun service distant connecté. |

Dans « Ce qu'on a appris — CONST. IA & Takeoff — NAC », ajouter si pertinent un **Radar outils de développement / agents** avec date, URL, démonstration vérifiée, licence et coût, statut d'exécution et impact sur le takeoff. Les cinq créateurs vidéo restent la base et le rattrapage des archives se poursuit. Si des fonctionnalités sont proposées à Codex, demander d'abord une spécification et des tests métier, jamais un déploiement automatique.
