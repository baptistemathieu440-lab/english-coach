/** Niveaux CECRL utilisés par l'application. A1 et C1 servent seulement aux estimations. */
export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1";
export type ContentLevel = "A2" | "B1" | "B2";
export type Stage = 1 | 2 | 3 | 4;

export type Skill = "grammar" | "vocabulary" | "listening" | "reading" | "writing" | "speaking";

export const SKILLS: Skill[] = ["grammar", "vocabulary", "listening", "reading", "writing", "speaking"];

/* ---------- Exercices ---------- */

interface ExerciseBase {
  id: string;
  /** Explication de la correction, en français. */
  explanation: string;
}

/** QCM. */
export interface McqExercise extends ExerciseBase {
  kind: "mcq";
  prompt: string;
  options: string[];
  answer: number;
  /** Niveau de la question (évaluations). */
  level?: Cefr;
}

/** Phrase à compléter : `___` marque le trou. Plusieurs réponses acceptées. */
export interface GapExercise extends ExerciseBase {
  kind: "gap";
  prompt: string;
  answers: string[];
  hint?: string;
}

/** Traduction. `answers` liste les traductions acceptées. */
export interface TranslateExercise extends ExerciseBase {
  kind: "translate";
  direction: "fr-en" | "en-fr";
  source: string;
  answers: string[];
}

/** Remise en ordre : `words` est l'ordre correct ; l'interface les mélange. */
export interface OrderExercise extends ExerciseBase {
  kind: "order";
  words: string[];
  /** Autres ordres corrects (phrase complète). */
  alternatives?: string[];
  translation?: string;
}

/** Détection d'erreur : l'apprenant touche le mot faux puis le corrige. */
export interface ErrorExercise extends ExerciseBase {
  kind: "error";
  sentence: string;
  /** Mot (ou groupe exact) incorrect dans la phrase. */
  wrong: string;
  corrections: string[];
}

/** Construction de phrase libre, guidée par des mots imposés. */
export interface BuildExercise extends ExerciseBase {
  kind: "build";
  instruction: string;
  /** Chaque groupe : au moins une des formes doit apparaître. */
  required: string[][];
  model: string;
  minWords?: number;
}

export type Exercise =
  | McqExercise
  | GapExercise
  | TranslateExercise
  | OrderExercise
  | ErrorExercise
  | BuildExercise;

/* ---------- Grammaire ---------- */

export interface GrammarLesson {
  id: string;
  title: string;
  titleEn: string;
  level: ContentLevel;
  stage: Stage;
  /** Ce que l'apprenant saura faire à la fin. */
  objective: string;
  /** Explication simple en français. `**gras**` autorisé. */
  explanation: string[];
  /** La règle : lignes de formation et d'emploi. */
  rule: { label: string; value: string }[];
  examples: { en: string; fr: string }[];
  mistakes: { wrong: string; right: string; why: string }[];
  tips: string[];
  /** Exercices progressifs (du plus guidé au plus libre). */
  exercises: Exercise[];
  /** Exercices de renfort proposés en cas de difficulté. */
  extra: Exercise[];
  /** Leçons à maîtriser avant de débloquer celle-ci. */
  prerequisites: string[];
}

/* ---------- Vocabulaire ---------- */

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "phrasal verb"
  | "expression"
  | "preposition"
  | "conjunction";

export interface Word {
  id: string;
  en: string;
  fr: string;
  /** Définition anglaise simple. */
  def: string;
  /** Transcription phonétique API (anglais britannique standard). */
  ipa: string;
  pos: PartOfSpeech;
  level: ContentLevel;
  theme: string;
  example: string;
  exampleFr: string;
}

export interface VocabTheme {
  id: string;
  title: string;
  business?: boolean;
}

/* ---------- Écoute ---------- */

export type Accent = "us" | "gb" | "au" | "ie" | "in" | "ca" | "za";

export interface Speaker {
  name: string;
  accent: Accent;
  voice: "female" | "male";
}

export interface ListeningItem {
  id: string;
  title: string;
  level: ContentLevel;
  difficulty: 1 | 2 | 3;
  theme: string;
  speakers: Speaker[];
  /** `s` = index du locuteur. */
  lines: { s: number; en: string; fr: string }[];
  questions: McqExercise[];
  /** Phrases du dialogue proposées en dictée. */
  dictation: string[];
  summaryPrompt: string;
  glossary: { term: string; fr: string }[];
}

/* ---------- Lecture ---------- */

export interface Article {
  id: string;
  title: string;
  level: ContentLevel;
  category: string;
  /** Une phrase en français pour situer le texte. */
  intro: string;
  paragraphs: string[];
  glossary: { term: string; fr: string }[];
  questions: McqExercise[];
  summaryPrompt: string;
}

/* ---------- Oral ---------- */

export interface ScenarioStep {
  tutor: string;
  tutorFr: string;
  /** Groupes de mots attendus : au moins un mot de chaque groupe rend la réponse pertinente. */
  expect: string[][];
  minWords: number;
  hint: string;
  model: string;
}

export interface Scenario {
  id: string;
  title: string;
  titleEn: string;
  level: ContentLevel;
  category: "daily" | "travel" | "social" | "work" | "business" | "opinion";
  goal: string;
  setting: string;
  tutorRole: string;
  steps: ScenarioStep[];
  phrases: { en: string; fr: string }[];
}

export interface FreeTopic {
  id: string;
  title: string;
  level: ContentLevel;
  questions: string[];
}

export interface PronunciationDrill {
  id: string;
  title: string;
  focus: string;
  explanation: string;
  pairs?: [string, string][];
  sentences: string[];
}

/* ---------- Écriture ---------- */

export interface WritingTask {
  id: string;
  title: string;
  level: ContentLevel;
  category: "daily" | "opinion" | "email" | "business" | "story";
  instruction: string;
  minWords: number;
  /** Éléments attendus (vérifiés par mots-clés). */
  checklist: { label: string; any: string[] }[];
  model: string;
}

/* ---------- Business ---------- */

export interface BusinessTheme {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  vocabTheme: string;
  scenarios: string[];
  writing: string[];
  articles: string[];
  phrases: { en: string; fr: string }[];
}

/* ---------- Évaluations ---------- */

export interface AssessmentSection {
  skill: Skill;
  title: string;
  /** Pour la lecture : texte support. Pour l'écoute : dialogue support. */
  passage?: string[];
  listening?: ListeningItem;
  items: McqExercise[];
  /** Pour l'écrit et l'oral. */
  task?: { instruction: string; minWords: number; any: string[][]; model: string };
}

export interface Assessment {
  id: string;
  title: string;
  stage: Stage | 0;
  /** Niveau que l'examen permet de valider. */
  validates: Cefr;
  description: string;
  sections: AssessmentSection[];
}
