import type {
  BuildExercise,
  ErrorExercise,
  Exercise,
  GapExercise,
  GrammarLesson,
  McqExercise,
  OrderExercise,
  TranslateExercise,
} from "./types";

type NoId<T> = Omit<T, "id">;
export type Draft = NoId<McqExercise> | NoId<GapExercise> | NoId<TranslateExercise> | NoId<OrderExercise> | NoId<ErrorExercise> | NoId<BuildExercise>;

/** QCM : la bonne réponse est l'index `answer`. */
export const mcq = (prompt: string, options: string[], answer: number, explanation: string): Draft => ({ kind: "mcq", prompt, options, answer, explanation });

/** Phrase à trous : `___` marque l'emplacement. Réponses acceptées séparées par « | ». */
export const gap = (prompt: string, answers: string, explanation: string, hint?: string): Draft => ({
  kind: "gap",
  prompt,
  answers: answers.split("|").map((a) => a.trim()),
  explanation,
  hint,
});

export const fr2en = (source: string, answers: string, explanation: string): Draft => ({
  kind: "translate",
  direction: "fr-en",
  source,
  answers: answers.split("|").map((a) => a.trim()),
  explanation,
});

export const en2fr = (source: string, answers: string, explanation: string): Draft => ({
  kind: "translate",
  direction: "en-fr",
  source,
  answers: answers.split("|").map((a) => a.trim()),
  explanation,
});

/** Remise en ordre : la phrase donnée est l'ordre correct. */
export const order = (sentence: string, explanation: string, translation?: string, alternatives?: string[]): Draft => ({
  kind: "order",
  words: sentence.replace(/[.?!]$/, "").split(" "),
  explanation,
  translation,
  alternatives,
});

/** Détection d'erreur : `wrong` est le mot (ou groupe) fautif, présent tel quel dans la phrase. */
export const fix = (sentence: string, wrong: string, corrections: string, explanation: string): Draft => ({
  kind: "error",
  sentence,
  wrong,
  corrections: corrections.split("|").map((a) => a.trim()),
  explanation,
});

/** Construction libre : `required` = groupes de formes possibles (« a/b; c »). */
export const build = (instruction: string, required: string, model: string, explanation: string, minWords = 5): Draft => ({
  kind: "build",
  instruction,
  required: required.split(";").map((g) => g.split("/").map((x) => x.trim())),
  model,
  explanation,
  minWords,
});

export function lesson(l: Omit<GrammarLesson, "exercises" | "extra"> & { exercises: Draft[]; extra: Draft[] }): GrammarLesson {
  return {
    ...l,
    exercises: l.exercises.map((e, i) => ({ ...e, id: `${l.id}-${i + 1}` }) as Exercise),
    extra: l.extra.map((e, i) => ({ ...e, id: `${l.id}-x${i + 1}` }) as Exercise),
  };
}
