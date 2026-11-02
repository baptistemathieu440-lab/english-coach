import { ARTICLES, DRILLS, FREE_TOPICS, LISTENING, SCENARIOS, WRITING, articleById, lessonById, listeningById, scenarioById, writingById } from "@/content";
import type { ContentLevel, Skill } from "@/content/types";
import { currentStage, nextLesson, nextNewWords, vocabStats, newWordsIntroducedToday } from "./progress";
import { stageInfo } from "@/content/curriculum";
import { dayKey, type AppState } from "@/state/store";

export interface PlanItem {
  id: string;
  block: "A" | "B" | "C" | "D";
  skill: Skill;
  title: string;
  subtitle: string;
  minutes: number;
  href: string;
}

const LEVELS: ContentLevel[] = ["A2", "B1", "B2"];

/**
 * Difficulté adaptative : on part du niveau de l'étape, on monte si les trois
 * derniers résultats de la compétence dépassent 85 %, on redescend sous 50 %.
 */
export function recommendedLevel(s: AppState, skill: Skill): ContentLevel {
  const base = stageInfo(currentStage(s)).level;
  const recent = s.events.filter((e) => e.skill === skill && e.score !== undefined && e.type !== "review").slice(-3);
  let i = LEVELS.indexOf(base);
  if (recent.length === 3) {
    const avg = recent.reduce((a, e) => a + (e.score ?? 0), 0) / 3;
    if (avg >= 85) i = Math.min(2, i + 1);
    else if (avg < 50) i = Math.max(0, i - 1);
  }
  return LEVELS[i];
}

function pickNext<T extends { id: string; level: ContentLevel }>(list: T[], level: ContentLevel, done: Record<string, { best: number } | undefined>): T {
  const atLevel = list.filter((x) => x.level === level);
  const pool = atLevel.length ? atLevel : list;
  return pool.find((x) => !done[x.id]) ?? [...pool].sort((a, b) => (done[a.id]?.best ?? 0) - (done[b.id]?.best ?? 0))[0];
}

function dayIndex(): number {
  return Math.floor(new Date(`${dayKey()}T12:00:00`).getTime() / 86_400_000);
}

/** Construit les identifiants du programme du jour. */
export function buildPlanIds(s: AppState): string[] {
  const ids: string[] = [];
  const long = s.settings.dailyMinutes >= 45;
  const stage = currentStage(s);
  const d = dayIndex();

  // A. Grammaire & vocabulaire (≈ 15 min)
  const stats = vocabStats(s);
  if (stats.due > 0) ids.push("review");
  const remaining = Math.max(0, s.settings.newWordsPerDay - newWordsIntroducedToday(s));
  if (remaining > 0 && nextNewWords(s, 1).length) ids.push("words");
  const nl = nextLesson(s);
  if (nl) ids.push(`lesson:${nl.lesson.id}`);

  // B. Compréhension orale (5-10 min)
  const lLevel = recommendedLevel(s, "listening");
  ids.push(`listen:${pickNext(LISTENING, lLevel, s.listening).id}`);

  // C. Lecture (5-10 min) — un article par jour en séance longue, un jour sur deux sinon (dictée l'autre jour)
  const rLevel = recommendedLevel(s, "reading");
  const businessDay = stage >= 2 && d % 3 === 0;
  const articles = businessDay ? ARTICLES.filter((a) => ["Business", "Entrepreneuriat", "Finance", "Économie"].includes(a.category)) : ARTICLES;
  if (long || d % 2 === 0) ids.push(`read:${pickNext(articles, rLevel, s.reading).id}`);
  else ids.push(`dictation:${pickNext(LISTENING, lLevel, s.listening).id}`);

  // D. Expression orale et écrite (≈ 10 min), en alternance
  const pLevel = recommendedLevel(s, "speaking");
  const wLevel = recommendedLevel(s, "writing");
  const scenarios = businessDay ? SCENARIOS.filter((x) => x.category === "business") : SCENARIOS.filter((x) => x.category !== "business" || stage >= 3);
  const rotation = d % 4;
  if (rotation === 0 || rotation === 3) ids.push(`speak:${pickNext(scenarios, pLevel, s.speaking).id}`);
  else if (rotation === 1) ids.push(`write:${pickNext(businessDay ? WRITING.filter((w) => w.category === "business" || w.category === "email") : WRITING, wLevel, s.writing).id}`);
  else {
    const topics = FREE_TOPICS.filter((t) => LEVELS.indexOf(t.level) <= LEVELS.indexOf(pLevel));
    ids.push(`free:${topics[d % topics.length].id}`);
  }
  if (long) ids.push(`drill:${DRILLS[d % DRILLS.length].id}`);
  return ids;
}

export function planItem(id: string, s: AppState): PlanItem | null {
  const [kind, ref] = id.split(":");
  switch (kind) {
    case "review": {
      const due = vocabStats(s).due;
      return { id, block: "A", skill: "vocabulary", title: "Révisions du jour", subtitle: due ? `${due} carte${due > 1 ? "s" : ""} à revoir (mots et erreurs)` : "Toutes les cartes du jour sont revues", minutes: Math.min(10, Math.max(2, Math.ceil(due * 0.3))), href: "/revisions/session?plan=review" };
    }
    case "words":
      return { id, block: "A", skill: "vocabulary", title: "Nouveaux mots", subtitle: `${s.settings.newWordsPerDay} mots du parcours à découvrir`, minutes: 4, href: "/revisions/nouveaux?plan=words" };
    case "lesson": {
      const l = lessonById.get(ref);
      if (!l) return null;
      const weak = s.lessons[ref] && s.lessons[ref].best < 70;
      return { id, block: "A", skill: "grammar", title: weak ? `Renforcement : ${l.title}` : l.title, subtitle: weak ? "Explications revues et exercices supplémentaires" : l.objective, minutes: 12, href: `/apprendre/${l.id}?plan=${encodeURIComponent(id)}` };
    }
    case "listen": {
      const it = listeningById.get(ref);
      return it ? { id, block: "B", skill: "listening", title: it.title, subtitle: `Écoute ${it.level} · ${it.theme}`, minutes: 7, href: `/ecouter/${it.id}?plan=${encodeURIComponent(id)}` } : null;
    }
    case "dictation": {
      const it = listeningById.get(ref);
      return it ? { id, block: "C", skill: "listening", title: `Dictée : ${it.title}`, subtitle: "Écrire ce que vous entendez", minutes: 5, href: `/ecouter/${it.id}/dictee?plan=${encodeURIComponent(id)}` } : null;
    }
    case "read": {
      const a = articleById.get(ref);
      return a ? { id, block: "C", skill: "reading", title: a.title, subtitle: `Lecture ${a.level} · ${a.category}`, minutes: 7, href: `/lire/${a.id}?plan=${encodeURIComponent(id)}` } : null;
    }
    case "speak": {
      const sc = scenarioById.get(ref);
      return sc ? { id, block: "D", skill: "speaking", title: sc.title, subtitle: `Mise en situation ${sc.level}${sc.category === "business" ? " · Business" : ""}`, minutes: 8, href: `/parler/scenario/${sc.id}?plan=${encodeURIComponent(id)}` } : null;
    }
    case "write": {
      const w = writingById.get(ref);
      return w ? { id, block: "D", skill: "writing", title: w.title, subtitle: `Expression écrite ${w.level} · ${w.minWords} mots minimum`, minutes: 10, href: `/ecrire/${w.id}?plan=${encodeURIComponent(id)}` } : null;
    }
    case "free": {
      const t = FREE_TOPICS.find((x) => x.id === ref);
      return t ? { id, block: "D", skill: "speaking", title: `Conversation : ${t.title}`, subtitle: "Conversation libre avec le professeur", minutes: 8, href: `/parler/libre/${t.id}?plan=${encodeURIComponent(id)}` } : null;
    }
    case "drill": {
      const dr = DRILLS.find((x) => x.id === ref);
      return dr ? { id, block: "D", skill: "speaking", title: `Prononciation : ${dr.title}`, subtitle: dr.focus, minutes: 5, href: `/parler/prononciation/${dr.id}?plan=${encodeURIComponent(id)}` } : null;
    }
    default:
      return null;
  }
}

export const BLOCKS: Record<PlanItem["block"], string> = {
  A: "Grammaire et vocabulaire",
  B: "Compréhension orale",
  C: "Lecture",
  D: "Expression orale et écrite",
};
