import { describe, expect, it } from "vitest";
import { ALL_ASSESSMENTS, ARTICLES, BUSINESS, DRILLS, FREE_TOPICS, LESSONS, LISTENING, SCENARIOS, STAGES, THEMES, WORDS, WRITING, lessonById, scenarioById, themeStage, writingById, articleById } from "@/content";
import type { Exercise, McqExercise } from "@/content/types";
import { checkText } from "@/lib/checker";
import { matchAnswer, normalize } from "@/lib/text";

function mcqOk(q: McqExercise) {
  expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
  expect(q.answer, q.id).toBeLessThan(q.options.length);
  expect(new Set(q.options).size, `${q.id} options uniques`).toBe(q.options.length);
}

describe("contenu pédagogique", () => {
  it("volume suffisant pour plusieurs mois", () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(30);
    expect(WORDS.length).toBeGreaterThanOrEqual(300);
    expect(LISTENING.length).toBeGreaterThanOrEqual(15);
    expect(ARTICLES.length).toBeGreaterThanOrEqual(12);
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(12);
  });

  it("identifiants uniques", () => {
    for (const list of [LESSONS, WORDS, LISTENING, ARTICLES, SCENARIOS, WRITING, ALL_ASSESSMENTS, FREE_TOPICS, DRILLS]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    const exIds = LESSONS.flatMap((l) => [...l.exercises, ...l.extra].map((e) => e.id));
    expect(new Set(exIds).size).toBe(exIds.length);
  });

  it("chaque mot a un thème rattaché à une étape et des champs complets", () => {
    for (const w of WORDS) {
      expect(themeStage.has(w.theme), w.id).toBe(true);
      expect(w.ipa.startsWith("/") && w.ipa.endsWith("/"), w.id).toBe(true);
      expect(w.fr && w.def && w.example && w.exampleFr, w.id).toBeTruthy();
    }
    for (const s of STAGES) for (const t of s.vocabThemes) expect(THEMES.some((x) => x.id === t), t).toBe(true);
    const en = WORDS.map((w) => w.en.toLowerCase());
    expect(new Set(en).size, "pas de mot en double").toBe(en.length);
  });

  it("leçons : prérequis existants, antérieurs, exercices variés", () => {
    const order = new Map(LESSONS.map((l, i) => [l.id, i]));
    for (const l of LESSONS) {
      for (const p of l.prerequisites) {
        expect(lessonById.has(p), `${l.id} → ${p}`).toBe(true);
        expect(order.get(p)!, `${l.id} : prérequis ${p} doit précéder`).toBeLessThan(order.get(l.id)!);
      }
      expect(l.exercises.length, l.id).toBeGreaterThanOrEqual(8);
      expect(l.extra.length, l.id).toBeGreaterThanOrEqual(3);
      expect(new Set(l.exercises.map((e) => e.kind)).size, `${l.id} formats variés`).toBeGreaterThanOrEqual(5);
      expect(l.examples.length && l.mistakes.length && l.tips.length && l.rule.length, l.id).toBeTruthy();
    }
  });

  it("exercices cohérents", () => {
    const check = (e: Exercise) => {
      expect(e.explanation, e.id).toBeTruthy();
      switch (e.kind) {
        case "mcq": mcqOk(e); break;
        case "gap": {
          const blanks = e.prompt.split("___").length - 1;
          expect(blanks, e.id).toBeGreaterThanOrEqual(1);
          for (const a of e.answers) if (blanks > 1) expect(a.split(" ").length, `${e.id} : ${a}`).toBeGreaterThanOrEqual(blanks);
          break;
        }
        case "error":
          expect(e.sentence.includes(e.wrong), `${e.id} : « ${e.wrong} » absent`).toBe(true);
          break;
        case "order":
          expect(e.words.length, e.id).toBeGreaterThanOrEqual(4);
          break;
        case "translate":
          expect(e.answers.length, e.id).toBeGreaterThanOrEqual(1);
          break;
        case "build":
          expect(e.required.length, e.id).toBeGreaterThanOrEqual(1);
          break;
      }
    };
    for (const l of LESSONS) [...l.exercises, ...l.extra].forEach(check);
  });

  it("le modèle des exercices de construction ne déclenche pas le correcteur et remplit les consignes", () => {
    for (const l of LESSONS) for (const e of [...l.exercises, ...l.extra]) if (e.kind === "build") {
      expect(checkText(e.model), `${e.id} : ${e.model}`).toEqual([]);
      for (const g of e.required) expect(g.some((t) => t === "?" ? e.model.includes("?") : ` ${normalize(e.model)} `.includes(` ${normalize(t)} `)), `${e.id} groupe ${g.join("/")}`).toBe(true);
    }
  });

  it("les réponses acceptées sont reconnues comme correctes", () => {
    for (const l of LESSONS) for (const e of [...l.exercises, ...l.extra]) {
      if (e.kind === "translate") for (const a of e.answers) expect(matchAnswer(a, e.answers, e.direction === "fr-en" ? "en" : "fr").status).toBe("correct");
    }
  });

  it("écoutes, articles et évaluations valides", () => {
    for (const it of LISTENING) {
      it.questions.forEach(mcqOk);
      for (const l of it.lines) expect(l.s, it.id).toBeLessThan(it.speakers.length);
      for (const d of it.dictation) expect(it.lines.some((l) => normalize(l.en).includes(normalize(d))), `${it.id} dictée : ${d}`).toBe(true);
    }
    for (const a of ARTICLES) a.questions.forEach(mcqOk);
    for (const a of ALL_ASSESSMENTS) for (const s of a.sections) {
      s.items.forEach(mcqOk);
      if (s.skill === "writing" || s.skill === "speaking") expect(s.task, `${a.id} ${s.skill}`).toBeTruthy();
    }
  });

  it("les modèles de scénarios et d'écrits ne déclenchent pas le correcteur", () => {
    for (const sc of SCENARIOS) for (const st of sc.steps) expect(checkText(st.model), `${sc.id} : ${st.model}`).toEqual([]);
    for (const w of WRITING) expect(checkText(w.model), w.id).toEqual([]);
    for (const a of ALL_ASSESSMENTS) for (const s of a.sections) if (s.task) expect(checkText(s.task.model), `${a.id} ${s.skill}`).toEqual([]);
  });

  it("les thèmes business renvoient vers du contenu existant", () => {
    for (const b of BUSINESS) {
      expect(THEMES.some((t) => t.id === b.vocabTheme), b.id).toBe(true);
      for (const s of b.scenarios) expect(scenarioById.has(s), `${b.id} → ${s}`).toBe(true);
      for (const w of b.writing) expect(writingById.has(w), `${b.id} → ${w}`).toBe(true);
      for (const a of b.articles) expect(articleById.has(a), `${b.id} → ${a}`).toBe(true);
    }
  });
});

describe("vocabulaire complémentaire", () => {
  it("chaque thème de mots supplémentaires existe", async () => {
    const { MORE_ROWS } = await import("@/content/vocabulary/more");
    for (const id of Object.keys(MORE_ROWS)) expect(THEMES.some((t) => t.id === id), id).toBe(true);
  });
});
