import type { Cefr, ContentLevel, Stage } from "./types";

export interface StageInfo {
  stage: Stage;
  title: string;
  from: string;
  to: string;
  months: string;
  /** Niveau des contenus d'écoute, de lecture et d'oral de l'étape. */
  level: ContentLevel;
  goals: string[];
  /** Thèmes de vocabulaire introduits pendant l'étape. */
  vocabThemes: string[];
  /** Examen qui valide l'étape. */
  exam: string;
}

export const STAGES: StageInfo[] = [
  {
    stage: 1,
    title: "Consolidation A2 → B1",
    from: "A2",
    to: "B1",
    months: "≈ 3 mois",
    level: "A2",
    goals: [
      "Consolider les bases grammaticales",
      "Construire des phrases correctes",
      "Comprendre des conversations simples",
      "Développer le vocabulaire courant",
      "Parler avec plus de fluidité",
    ],
    vocabThemes: ["daily", "food", "travel", "home", "people", "work-basics", "time", "health"],
    exam: "exam-stage-1",
  },
  {
    stage: 2,
    title: "Un B1 solide",
    from: "B1",
    to: "B1+",
    months: "≈ 3 mois",
    level: "B1",
    goals: [
      "Comprendre des conversations plus longues",
      "Raconter une expérience",
      "Exprimer et justifier une opinion",
      "Comprendre des articles d'actualité",
      "Participer à une conversation quotidienne",
    ],
    vocabThemes: ["feelings", "media", "environment", "money", "work", "phrasal", "connectors", "business-basics", "customer"],
    exam: "exam-stage-2",
  },
  {
    stage: 3,
    title: "Progression B1 → B2",
    from: "B1+",
    to: "B2",
    months: "≈ 3 mois",
    level: "B2",
    goals: [
      "Comprendre des contenus authentiques",
      "S'exprimer avec fluidité",
      "Défendre une opinion",
      "Comprendre des accents différents",
      "Participer à des discussions professionnelles",
    ],
    vocabThemes: ["society", "technology", "idioms", "argument", "marketing", "sales", "negotiation", "meetings", "emails"],
    exam: "exam-stage-3",
  },
  {
    stage: 4,
    title: "Consolidation du B2",
    from: "B2",
    to: "B2 solide",
    months: "1 à 3 mois",
    level: "B2",
    goals: [
      "Gagner en autonomie",
      "Comprendre l'essentiel de contenus complexes",
      "Parler spontanément",
      "Participer à des réunions",
      "Rédiger des textes structurés et défendre une idée avec précision",
    ],
    vocabThemes: ["management", "finance", "banking", "wealth", "entrepreneurship", "international", "presentations", "advanced"],
    exam: "exam-stage-4",
  },
];

export function stageInfo(stage: Stage): StageInfo {
  return STAGES[stage - 1];
}

/** Échelle utilisée pour les estimations par compétence. */
export const CEFR_ORDER: Cefr[] = ["A1", "A2", "B1", "B2", "C1"];

export function cefrIndex(l: Cefr | string): number {
  const i = CEFR_ORDER.indexOf(l as Cefr);
  return i < 0 ? 1 : i;
}
