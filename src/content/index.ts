import { stage1 } from "./grammar/stage1";
import { stage2 } from "./grammar/stage2";
import { stage3, stage4 } from "./grammar/stage3";
import { stage1More, stage2More, stage3More, stage4More } from "./grammar/more";
import { expand } from "./vocabulary/build";
import { generalThemes } from "./vocabulary/general";
import { businessThemes } from "./vocabulary/business";
import { LISTENING as LISTENING_BASE } from "./listening";
import { LISTENING_MORE } from "./listening-more";
import { ARTICLES as ARTICLES_BASE } from "./reading";
import { ARTICLES_MORE } from "./reading-more";
import { SCENARIOS, FREE_TOPICS, DRILLS } from "./speaking";
import { WRITING, BUSINESS } from "./writing";
import { ALL_ASSESSMENTS, EXAMS, PLACEMENT } from "./assessments";
import { STAGES } from "./curriculum";
import type { GrammarLesson, Stage, VocabTheme, Word } from "./types";

export const LESSONS: GrammarLesson[] = [...stage1, ...stage1More, ...stage2, ...stage2More, ...stage3, ...stage3More, ...stage4, ...stage4More];
const allThemes = [...generalThemes, ...businessThemes];
export const THEMES: (VocabTheme & { level: string })[] = allThemes.map(({ id, title, business, level }) => ({ id, title, business, level }));
export const WORDS: Word[] = expand(allThemes);
export const LISTENING = [...LISTENING_BASE, ...LISTENING_MORE];
export const ARTICLES = [...ARTICLES_BASE, ...ARTICLES_MORE];

export { SCENARIOS, FREE_TOPICS, DRILLS, WRITING, BUSINESS, ALL_ASSESSMENTS, EXAMS, PLACEMENT, STAGES };

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((x) => [x.id, x]));

export const lessonById = byId(LESSONS);
export const wordById = byId(WORDS);
export const listeningById = byId(LISTENING);
export const articleById = byId(ARTICLES);
export const scenarioById = byId(SCENARIOS);
export const writingById = byId(WRITING);
export const assessmentById = byId(ALL_ASSESSMENTS);
export const themeById = byId(THEMES);

/** Thème de vocabulaire → étape où il est introduit. */
export const themeStage = new Map<string, Stage>();
for (const s of STAGES) for (const t of s.vocabThemes) themeStage.set(t, s.stage);

export function wordsForStage(stage: Stage): Word[] {
  return WORDS.filter((w) => themeStage.get(w.theme) === stage);
}

export function lessonsForStage(stage: Stage): GrammarLesson[] {
  return LESSONS.filter((l) => l.stage === stage);
}
