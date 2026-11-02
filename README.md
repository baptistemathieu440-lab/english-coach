# English Coach — de A2 à B2

Application web installable (PWA) pour apprendre l'anglais 30 à 45 minutes par jour, de A2 à B2 : grammaire, vocabulaire en répétition espacée, compréhension orale, lecture, expression orale avec professeur virtuel, expression écrite, Business English, évaluations et suivi des progrès.

**En ligne : https://english-coach-a2-b2.netlify.app** (publiée automatiquement par Netlify à chaque envoi sur `main`).

**Gratuite, sans compte, sans serveur, sans traceur.** Tout fonctionne dans le navigateur ; les progrès sont stockés sur l'appareil.

---

## Lancer l'application

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # version de production dans dist/
npm run preview      # sert dist/ sur http://localhost:4173
```

Tests :

```bash
npm test             # 42 tests unitaires (contenu, correcteur, répétition espacée, évaluations)
npm run test:e2e     # 30 tests navigateur (desktop + mobile, accessibilité axe WCAG 2.2 AA, hors connexion)
```

Node 20 ou plus récent.

## Mettre en ligne gratuitement

L'application est un site statique : n'importe quel hébergeur statique gratuit convient.

- **Netlify** : nouveau site depuis le dépôt GitHub, commande `npm run build`, dossier `dist` (le fichier `netlify.toml` le prévoit déjà).
- **GitHub Pages / Cloudflare Pages / Vercel** : même principe (build `npm run build`, sortie `dist`, réécriture de toutes les routes vers `index.html`).

Ensuite, depuis le téléphone : ouvrir l'adresse puis « Ajouter à l'écran d'accueil » (iPhone) ou « Installer l'application » (Android, Chrome, Edge).

## Ce que contient l'application

| Rubrique | Contenu |
|---|---|
| **Accueil** | Programme du jour en 4 blocs (grammaire et vocabulaire, écoute, lecture, expression), série, objectif de temps, défis de la semaine, niveau validé, progression vers B2 |
| **Apprendre** | 41 leçons de grammaire réparties sur 4 étapes (explication en français, règle, exemples audio, erreurs fréquentes, astuces, 9 à 10 exercices + 3 de renfort) ; 34 thèmes de vocabulaire |
| **Écouter** | 25 dialogues originaux (A2 → B2), 7 accents possibles, vitesse réglable, questions, transcription et traduction après l'écoute, dictionnaire intégré, résumé corrigé, dictées |
| **Parler** | 15 conversations guidées (dont 7 professionnelles), conversation libre sur 6 thèmes, 8 ateliers de prononciation, 12 sujets d'expression écrite |
| **Lire** | 22 articles originaux (économie, société, technologie, finance, entrepreneuriat, international) avec dictionnaire au clic, questions, résumé corrigé |
| **Business English** | 14 thèmes (marketing, ventes, négociation, management, finance, banque, patrimoine, réunions, présentations, emails…) reliés au vocabulaire, aux scénarios, aux écrits et aux articles |
| **Révisions** | Répétition espacée (SM-2) des mots et des erreurs de grammaire, 5 modes de carte, carnet personnel, catégories : à revoir, récents, maîtrisés, oubliés, difficiles |
| **Progression** | Niveau validé, progression par étape, résultats par compétence et évolution sur 8 semaines, minutes par jour, calendrier, examens, badges |

Volume total : 41 leçons, 504 exercices, 554 mots et expressions, 25 écoutes, 22 articles, 15 scénarios, 12 sujets d'écrit, 1 test de positionnement et 4 examens blancs.

## Règles pédagogiques appliquées dans le code

- **Progression par résultats, pas par temps.** Une leçon se débloque quand ses prérequis sont réussis à 70 % ; elle est maîtrisée à 80 %. L'étape suivante ne s'ouvre qu'après l'**examen blanc** de l'étape (70 % par compétence, 60 % à l'écrit et à l'oral).
- **Pas de niveau usurpé.** Le niveau affiché (A2, B1, B1 solide, B2, B2 consolidé) ne monte qu'avec un examen réussi. Le test de positionnement personnalise le parcours mais ne « donne » jamais le B1. Sans examen, une étape plafonne à 90 %.
- **Les XP ne font pas progresser.** Ils récompensent les bonnes réponses et la régularité ; la progression vient de la maîtrise.
- **Correction immédiate et réactivation.** Un exercice raté revient en fin de série puis dans les révisions espacées.
- **Difficulté adaptative.** Le niveau des écoutes, lectures et exercices oraux proposés monte si les trois derniers résultats dépassent 85 %, redescend sous 50 %. Une leçon sous 70 % déclenche un mode renfort (cours revu + exercices supplémentaires). Un « test de sortie » permet d'avancer vite sur une notion déjà connue.
- **Apprendre, pas reconnaître.** Une carte de vocabulaire passe de la reconnaissance au choix multiple, puis à la production écrite, à la phrase à compléter et à la dictée du mot.
- **Examens blancs** : une nouvelle tentative après un échec est possible au bout de 7 jours (pour mesurer des progrès réels et non la mémoire des questions). Une évaluation complète est rappelée chaque mois.

## Intelligence artificielle et gratuité : ce qui est vrai

| Fonction | Technologie | Coût | Limites |
|---|---|---|---|
| Synthèse vocale (écoutes, mots, professeur) | Web Speech API du navigateur | Gratuit | Les voix et accents dépendent de l'appareil ; l'application l'indique quand un accent manque et utilise une autre voix anglaise |
| Reconnaissance vocale | Web Speech API | Gratuit | Chrome et Edge envoient l'audio aux serveurs de Google ou Microsoft (connexion nécessaire) ; Safari peut transcrire sur l'appareil ; **Firefox ne la propose pas** → réponse au clavier toujours possible. Elle mesure l'intelligibilité, pas la finesse de l'accent |
| Professeur intégré (par défaut) | Règles locales : scénarios guidés, relances, détecteur de près de 50 erreurs typiques des francophones avec explications en français | Gratuit, hors connexion | Ne comprend pas le sens comme une IA ; ne détecte pas toutes les erreurs |
| Notation de l'écrit et de l'oral | Heuristiques locales (longueur, consigne, connecteurs, variété, erreurs) + auto-évaluation | Gratuit | Estimation affichée comme telle, critère par critère |
| IA locale facultative | **WebLLM** (open source) : Qwen 2.5 ou Llama 3.2 exécutés dans le navigateur | Gratuit, sans compte | Navigateur WebGPU requis (Chrome/Edge récents), téléchargement unique de 0,4 à 2 Go, appareil assez puissant ; un petit modèle peut se tromper |
| IA sur ordinateur facultative | **Ollama** (open source) | Gratuit | Uniquement sur l'ordinateur où il est installé ; lancer Ollama avec `OLLAMA_ORIGINS=*` pour autoriser l'application |

Aucune API payante n'est intégrée. Une API comme celle d'un grand modèle hébergé donnerait des conversations plus riches, mais elle demande une clé et un quota facturé : c'est volontairement exclu.

## Architecture

- **Vite 8 + React 19 + TypeScript strict + Tailwind CSS 4 + React Router 8**, icônes Lucide.
- **Stockage** : IndexedDB (repli localStorage), un seul document d'état sauvegardé à chaque action ; export/import JSON dans les réglages.
- **PWA** : `vite-plugin-pwa` (Workbox). Tout le contenu pédagogique est dans le bundle, donc disponible hors connexion. Le moteur WebLLM (6 Mo) n'est téléchargé que si on active l'IA locale.

```
src/
  content/           contenu pédagogique (données typées)
    types.ts         modèles : leçon, exercice, mot, écoute, article, scénario, évaluation
    curriculum.ts    les 4 étapes, leurs objectifs, thèmes et examens
    grammar/         leçons (stage1, stage2, stage3 = étapes 3 et 4)
    vocabulary/      mots généraux et business
    listening.ts     dialogues        reading.ts   articles
    speaking.ts      scénarios, thèmes libres, prononciation
    writing.ts       sujets d'écrit + thèmes Business English
    assessments.ts   test de positionnement et examens blancs
  lib/
    srs.ts           répétition espacée          text.ts      comparaison des réponses
    checker.ts       détecteur d'erreurs FR→EN    evaluate.ts  notation écrit/oral
    progress.ts      niveau, étapes, compétences, séries, badges, défis
    plan.ts          programme du jour adaptatif  dictionary.ts dictionnaire intégré
    speech.ts        voix et micro                tutor.ts     professeur hors IA + WebLLM/Ollama
  state/             store (IndexedDB) et actions
  components/        kit d'interface, moteur d'exercices, lecteur audio, graphiques
  pages/             une page par rubrique
tests/unit           vitest          tests/e2e   Playwright
```

## Ajouter du contenu

Tout le contenu est en TypeScript typé : l'éditeur signale les champs manquants, et `npm test` vérifie la cohérence (identifiants uniques, prérequis existants, réponses valides, modèles sans erreur, dictées présentes dans les dialogues…).

- **Une leçon** : ajouter un `lesson({...})` dans `src/content/grammar/stageN.ts`, avec `prerequisites` (identifiants de leçons précédentes), au moins 8 `exercises` de 5 formats différents et 3 `extra`. Aides : `mcq`, `gap` (`___` = trou ; réponses séparées par `|`), `fr2en`, `en2fr`, `order`, `fix` (détection d'erreur), `build` (construction libre).
- **Des mots** : ajouter des lignes `[anglais, français, définition, API, nature, exemple, traduction]` dans `src/content/vocabulary/more.ts` (rangées par identifiant de thème) ou directement dans un thème de `src/content/vocabulary/`. Un nouveau thème doit être rattaché à une étape dans `curriculum.ts`.
- **Une écoute** : `src/content/listening.ts` (locuteurs avec accent `us | gb | au | ie | in | ca | za`, répliques traduites, questions, phrases de dictée tirées du dialogue).
- **Un article** : `src/content/reading.ts`. **Un scénario oral** : `src/content/speaking.ts`. **Un sujet d'écrit** : `src/content/writing.ts`.
- **Une règle du correcteur** : `src/lib/checker.ts` (expression régulière, message en français, correction) + un cas dans `tests/unit/engine.test.ts`.

Contenus : tous les textes, dialogues et exercices ont été écrits pour cette application. Les personnes et entreprises citées sont fictives. Ne pas copier de contenus protégés (BBC, manuels, autres applications).

## Données et vie privée

Aucune donnée n'est envoyée à un serveur de l'application (il n'y en a pas). Exceptions, indiquées dans les réglages : la reconnaissance vocale de Chrome/Edge (traitée par Google/Microsoft) et, si vous activez l'IA locale, le téléchargement du modèle depuis Hugging Face. Effacer les données du navigateur efface les progrès : exportez régulièrement une sauvegarde.
