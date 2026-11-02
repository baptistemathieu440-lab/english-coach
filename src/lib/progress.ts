import {
  ARTICLES,
  EXAMS,
  LESSONS,
  LISTENING,
  SCENARIOS,
  STAGES,
  WORDS,
  WRITING,
  lessonById,
  lessonsForStage,
  themeStage,
  wordsForStage,
} from "@/content";
import { cefrIndex } from "@/content/curriculum";
import type { Cefr, ContentLevel, GrammarLesson, Skill, Stage } from "@/content/types";
import { SKILLS } from "@/content/types";
import { categorize, isDue, isLearned, isMastered } from "./srs";
import { UNLOCK } from "@/state/actions";
import { dayKey, type AppState } from "@/state/store";

const DAY = 86_400_000;

/* ---------- Étapes et niveau ---------- */

export function examResults(s: AppState, examId: string) {
  return s.assessments.filter((a) => a.id === examId);
}

export function examPassed(s: AppState, examId: string): boolean {
  return examResults(s, examId).some((a) => a.passed);
}

/** Étape en cours : la première dont l'examen n'est pas validé. */
export function currentStage(s: AppState): Stage {
  for (const st of STAGES) if (!examPassed(s, st.exam)) return st.stage;
  return 4;
}

/** Délai avant de repasser un examen échoué (évite l'apprentissage par cœur des réponses). */
export const EXAM_COOLDOWN_DAYS = 7;

export function examAvailableAt(s: AppState, examId: string): number {
  const fails = examResults(s, examId).filter((a) => !a.passed);
  const last = fails.at(-1);
  return last ? last.date + EXAM_COOLDOWN_DAYS * DAY : 0;
}

export interface LevelInfo {
  cefr: Cefr;
  label: string;
  /** Ce qui justifie le niveau affiché. */
  basis: string;
}

/**
 * Niveau affiché : uniquement ce qui a été démontré.
 * Le test de positionnement ne peut pas « donner » le B1 : seul un examen blanc le valide.
 */
export function validatedLevel(s: AppState): LevelInfo {
  if (examPassed(s, "exam-stage-4")) return { cefr: "B2", label: "B2 consolidé", basis: "Examen blanc B2 consolidé réussi" };
  if (examPassed(s, "exam-stage-3")) return { cefr: "B2", label: "B2", basis: "Examen blanc de fin d'étape 3 réussi" };
  if (examPassed(s, "exam-stage-2")) return { cefr: "B1", label: "B1 solide", basis: "Examen blanc de fin d'étape 2 réussi" };
  if (examPassed(s, "exam-stage-1")) return { cefr: "B1", label: "B1", basis: "Examen blanc de fin d'étape 1 réussi" };
  if (s.placement) {
    const p = s.placement.level === "A1" ? "A1" : "A2";
    return { cefr: p, label: p, basis: "Estimation du test de positionnement" };
  }
  return { cefr: "A2", label: "A2", basis: "Niveau déclaré (test de positionnement non passé)" };
}

/* ---------- Leçons ---------- */

export function lessonScore(s: AppState, id: string): number {
  return s.lessons[id]?.best ?? 0;
}

export function lessonUnlocked(s: AppState, l: GrammarLesson): { ok: boolean; missing: GrammarLesson[]; stageLocked: boolean } {
  const missing = l.prerequisites.filter((p) => lessonScore(s, p) < UNLOCK).map((p) => lessonById.get(p)!).filter(Boolean);
  const stageLocked = l.stage > currentStage(s);
  return { ok: missing.length === 0 && !stageLocked, missing, stageLocked };
}

/** Prochaine leçon conseillée : renforcement d'abord, puis la suivante débloquée. */
export function nextLesson(s: AppState): { lesson: GrammarLesson; remedial: boolean } | null {
  const weak = LESSONS.find((l) => {
    const a = s.lessons[l.id];
    return a && a.best < UNLOCK && lessonUnlocked(s, l).ok;
  });
  if (weak) return { lesson: weak, remedial: true };
  const next = LESSONS.find((l) => !s.lessons[l.id]?.mastered && lessonUnlocked(s, l).ok);
  return next ? { lesson: next, remedial: false } : null;
}

/* ---------- Progression par étape ---------- */

const STAGE_LEVEL: Record<Stage, ContentLevel> = { 1: "A2", 2: "B1", 3: "B2", 4: "B2" };

export interface StageProgress {
  stage: Stage;
  value: number;
  lessons: { mastered: number; total: number };
  words: { learned: number; total: number };
  comprehension: { done: number; total: number };
  production: { done: number; total: number };
  examPassed: boolean;
}

export function stageProgress(s: AppState, stage: Stage): StageProgress {
  const lessons = lessonsForStage(stage);
  const lessonValue = lessons.length ? lessons.reduce((sum, l) => sum + (s.lessons[l.id]?.mastered ? 1 : (s.lessons[l.id]?.best ?? 0) / 100 * 0.7), 0) / lessons.length : 0;
  const words = wordsForStage(stage);
  const learned = words.filter((w) => {
    const c = s.cards[`word:${w.id}`];
    return c && isLearned(c);
  }).length;
  const level = STAGE_LEVEL[stage];
  const half = (arr: { id: string; level: ContentLevel }[]) => {
    const list = arr.filter((x) => x.level === level);
    // Les étapes 3 et 4 partagent le niveau B2 : on répartit les contenus.
    if (level === "B2") return list.filter((_, i) => (stage === 3 ? i % 2 === 0 : i % 2 === 1));
    return list;
  };
  const comp = [...half(LISTENING).map((x) => s.listening[x.id]), ...half(ARTICLES).map((x) => s.reading[x.id])];
  const compDone = comp.filter((a) => (a?.best ?? 0) >= 70).length;
  const prod = [...half(SCENARIOS).map((x) => s.speaking[x.id]), ...half(WRITING).map((x) => s.writing[x.id])];
  const prodDone = prod.filter((a) => (a?.best ?? 0) >= 60).length;
  const passed = examPassed(s, STAGES[stage - 1].exam);
  const raw =
    0.45 * lessonValue +
    0.25 * (words.length ? learned / words.length : 0) +
    0.15 * (comp.length ? compDone / comp.length : 0) +
    0.15 * (prod.length ? prodDone / prod.length : 0);
  return {
    stage,
    value: passed ? 1 : Math.min(0.9, raw),
    lessons: { mastered: lessons.filter((l) => s.lessons[l.id]?.mastered).length, total: lessons.length },
    words: { learned, total: words.length },
    comprehension: { done: compDone, total: comp.length },
    production: { done: prodDone, total: prod.length },
    examPassed: passed,
  };
}

/** Progression globale de A2 vers B2 (0-1). Sans examen réussi, une étape plafonne à 90 %. */
export function overallProgress(s: AppState): number {
  return STAGES.reduce((sum, st) => sum + stageProgress(s, st.stage).value, 0) / STAGES.length;
}

/* ---------- Compétences ---------- */

export interface SkillStat {
  skill: Skill;
  score: number | null;
  count: number;
  /** Niveau démontré : au moins 3 activités notées ≥ 70 % à ce niveau. */
  demonstrated: Cefr | null;
  trend: number[];
}

export function skillStats(s: AppState): Record<Skill, SkillStat> {
  const out = {} as Record<Skill, SkillStat>;
  for (const skill of SKILLS) {
    const ev = s.events.filter((e) => e.skill === skill && e.score !== undefined && (e.type !== "review" || skill === "vocabulary"));
    const recent = ev.slice(-20);
    const score = recent.length ? Math.round(recent.reduce((a, e) => a + (e.score ?? 0), 0) / recent.length) : null;
    let demonstrated: Cefr | null = null;
    for (const lvl of ["B2", "B1", "A2"] as Cefr[]) {
      const at = ev.filter((e) => e.level === lvl && e.type !== "review").slice(-6);
      if (at.length >= 3 && at.reduce((a, e) => a + (e.score ?? 0), 0) / at.length >= 70) {
        demonstrated = lvl;
        break;
      }
    }
    const exam = [...s.assessments].reverse().find((a) => a.passed && a.scores[skill] !== undefined && a.id !== "placement");
    if (exam) {
      const lvl = EXAMS.find((e) => e.id === exam.id)?.validates;
      if (lvl && (!demonstrated || cefrIndex(lvl) > cefrIndex(demonstrated))) demonstrated = lvl;
    }
    // Évolution hebdomadaire (8 dernières semaines)
    const now = Date.now();
    const trend: number[] = [];
    for (let w = 7; w >= 0; w--) {
      const from = now - (w + 1) * 7 * DAY;
      const to = now - w * 7 * DAY;
      const inWeek = ev.filter((e) => e.t >= from && e.t < to);
      trend.push(inWeek.length ? Math.round(inWeek.reduce((a, e) => a + (e.score ?? 0), 0) / inWeek.length) : -1);
    }
    out[skill] = { skill, score, count: ev.length, demonstrated, trend };
  }
  return out;
}

/* ---------- Vocabulaire ---------- */

export function vocabStats(s: AppState, now = Date.now()) {
  const cards = Object.values(s.cards);
  const words = cards.filter((c) => c.kind !== "exercise");
  const count = (cat: string) => words.filter((c) => categorize(c, now).includes(cat as never)).length;
  return {
    total: words.length,
    learned: words.filter(isLearned).length,
    mastered: words.filter(isMastered).length,
    due: cards.filter((c) => isDue(c, now)).length,
    recent: count("recent"),
    forgotten: count("forgotten"),
    difficult: count("difficult"),
    learning: count("learning"),
    newCards: words.filter((c) => c.state === "new").length,
    /** À réviser + nouvelles cartes en attente (session possible). */
    sessionable: cards.filter((c) => isDue(c, now) || c.state === "new").length,
    mistakes: cards.filter((c) => c.kind === "exercise").length,
  };
}

/** Prochains mots à introduire, dans l'ordre du parcours. */
export function nextNewWords(s: AppState, n: number): string[] {
  const stage = currentStage(s);
  const pool = WORDS.filter((w) => (themeStage.get(w.theme) ?? 4) <= stage);
  return pool.filter((w) => !s.cards[`word:${w.id}`]).slice(0, n).map((w) => w.id);
}

export function newWordsIntroducedToday(s: AppState): number {
  const start = new Date();
  start.setHours(4, 0, 0, 0);
  if (new Date().getHours() < 4) start.setDate(start.getDate() - 1);
  return Object.values(s.cards).filter((c) => c.kind === "word" && c.addedAt >= start.getTime()).length;
}

/* ---------- Régularité ---------- */

function dayActive(s: AppState, key: string): boolean {
  const d = s.days[key];
  return !!d && (d.seconds >= 600 || d.done.length >= 2);
}

export function streak(s: AppState): { current: number; best: number; todayDone: boolean } {
  const todayKey = dayKey();
  const todayDone = dayActive(s, todayKey);
  let current = 0;
  let t = Date.now();
  if (!todayDone) t -= DAY;
  while (dayActive(s, dayKey(t))) {
    current++;
    t -= DAY;
  }
  const keys = Object.keys(s.days).filter((k) => dayActive(s, k)).sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const k of keys) {
    const d = new Date(`${k}T12:00:00`).getTime();
    run = prev !== null && Math.round((d - prev) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best: Math.max(best, current), todayDone };
}

export function secondsSince(s: AppState, days: number): number {
  let total = 0;
  for (let i = 0; i < days; i++) total += s.days[dayKey(Date.now() - i * DAY)]?.seconds ?? 0;
  return total;
}

export function weekStart(t = Date.now()): number {
  const d = new Date(t);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.getTime();
}

/* ---------- Badges ---------- */

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  check: (s: AppState) => boolean;
}

const countEvents = (s: AppState, type: string, min = 0) => s.events.filter((e) => e.type === type && (e.score ?? 0) >= min).length;

export const BADGES: BadgeDef[] = [
  { id: "placement", title: "Point de départ", description: "Passer le test de positionnement", check: (s) => !!s.placement },
  { id: "first-lesson", title: "Première leçon", description: "Maîtriser une première leçon de grammaire (≥ 80 %)", check: (s) => Object.values(s.lessons).some((l) => l.mastered) },
  { id: "ten-lessons", title: "Bases solides", description: "Maîtriser 10 leçons de grammaire", check: (s) => Object.values(s.lessons).filter((l) => l.mastered).length >= 10 },
  { id: "streak-7", title: "Une semaine", description: "7 jours d'apprentissage d'affilée", check: (s) => streak(s).best >= 7 },
  { id: "streak-30", title: "Un mois", description: "30 jours d'apprentissage d'affilée", check: (s) => streak(s).best >= 30 },
  { id: "words-50", title: "50 mots appris", description: "50 mots sortis de la phase d'apprentissage", check: (s) => Object.values(s.cards).filter((c) => c.kind !== "exercise" && isLearned(c)).length >= 50 },
  { id: "words-mastered-100", title: "100 mots maîtrisés", description: "100 mots retenus depuis au moins 3 semaines", check: (s) => Object.values(s.cards).filter((c) => c.kind !== "exercise" && isMastered(c)).length >= 100 },
  { id: "listener", title: "Oreille attentive", description: "Réussir 10 écoutes à 70 % ou plus", check: (s) => countEvents(s, "listening", 70) >= 10 },
  { id: "dictation", title: "Sous la dictée", description: "Réussir 15 dictées à 80 % ou plus", check: (s) => countEvents(s, "dictation", 80) >= 15 },
  { id: "reader", title: "Lecteur", description: "Réussir 10 articles à 70 % ou plus", check: (s) => countEvents(s, "reading", 70) >= 10 },
  { id: "speaker", title: "Prendre la parole", description: "Terminer 10 conversations ou scénarios", check: (s) => countEvents(s, "speaking") + countEvents(s, "conversation") >= 10 },
  { id: "writer", title: "Plume", description: "Rédiger 5 textes notés 60 % ou plus", check: (s) => countEvents(s, "writing", 60) >= 5 },
  { id: "business", title: "Business ready", description: "Réussir 5 scénarios Business à 60 % ou plus", check: (s) => SCENARIOS.filter((x) => x.category === "business" && (s.speaking[x.id]?.best ?? 0) >= 60).length >= 5 },
  { id: "b1", title: "Cap B1", description: "Réussir l'examen blanc de fin d'étape 1", check: (s) => examPassed(s, "exam-stage-1") },
  { id: "b1-solid", title: "B1 solide", description: "Réussir l'examen blanc de fin d'étape 2", check: (s) => examPassed(s, "exam-stage-2") },
  { id: "b2", title: "Cap B2", description: "Réussir l'examen blanc de fin d'étape 3", check: (s) => examPassed(s, "exam-stage-3") },
  { id: "b2-solid", title: "B2 consolidé", description: "Réussir l'examen blanc final", check: (s) => examPassed(s, "exam-stage-4") },
];

/* ---------- Défis hebdomadaires ---------- */

export interface Challenge {
  id: string;
  title: string;
  target: number;
  measure: (s: AppState, from: number) => number;
}

const inWeek = (s: AppState, from: number, pred: (e: AppState["events"][number]) => boolean) => s.events.filter((e) => e.t >= from && pred(e)).length;

const CHALLENGE_POOL: Challenge[] = [
  { id: "reviews-150", title: "Réviser 150 cartes", target: 150, measure: (s, f) => inWeek(s, f, (e) => e.type === "review") },
  { id: "sessions-5", title: "Terminer 5 programmes du jour", target: 5, measure: (s, f) => Object.entries(s.days).filter(([k, d]) => new Date(`${k}T12:00:00`).getTime() >= f && d.plan && d.plan.every((p) => d.done.includes(p))).length },
  { id: "listen-4", title: "Réussir 4 écoutes (≥ 70 %)", target: 4, measure: (s, f) => inWeek(s, f, (e) => e.type === "listening" && (e.score ?? 0) >= 70) },
  { id: "speak-3", title: "3 conversations orales", target: 3, measure: (s, f) => inWeek(s, f, (e) => e.type === "speaking" || e.type === "conversation") },
  { id: "dictation-10", title: "10 dictées réussies (≥ 80 %)", target: 10, measure: (s, f) => inWeek(s, f, (e) => e.type === "dictation" && (e.score ?? 0) >= 80) },
  { id: "read-3", title: "Lire 3 articles (≥ 70 %)", target: 3, measure: (s, f) => inWeek(s, f, (e) => e.type === "reading" && (e.score ?? 0) >= 70) },
  { id: "lessons-2", title: "Maîtriser 2 leçons", target: 2, measure: (s, f) => inWeek(s, f, (e) => e.type === "lesson" && (e.score ?? 0) >= 80) },
  { id: "write-2", title: "Rédiger 2 textes (≥ 60 %)", target: 2, measure: (s, f) => inWeek(s, f, (e) => e.type === "writing" && (e.score ?? 0) >= 60) },
  { id: "minutes-180", title: "3 heures d'apprentissage", target: 180, measure: (s, f) => Math.round(Object.entries(s.days).filter(([k]) => new Date(`${k}T12:00:00`).getTime() >= f).reduce((a, [, d]) => a + d.seconds, 0) / 60) },
];

export function weeklyChallenges(s: AppState): { c: Challenge; value: number; done: boolean }[] {
  const from = weekStart();
  const week = Math.floor(from / (7 * DAY));
  const picks = [CHALLENGE_POOL[week % 3], CHALLENGE_POOL[3 + (week % 3)], CHALLENGE_POOL[6 + (week % 3)]];
  return picks.map((c) => {
    const value = c.measure(s, from);
    return { c, value: Math.min(value, c.target), done: value >= c.target };
  });
}

/* ---------- XP ---------- */

export function xpTier(xp: number): { tier: number; into: number; size: number } {
  const size = 500;
  return { tier: Math.floor(xp / size) + 1, into: xp % size, size };
}
