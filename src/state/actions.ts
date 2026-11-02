import { dayKey, emptyDay, flush, getState, setState, type ActivityEvent, type AppState, type AssessmentResult, type Attempt } from "./store";
import { newCard, review, type Grade } from "@/lib/srs";
import type { Skill } from "@/content/types";

const MAX_EVENTS = 6000;

function today(s: AppState) {
  const k = dayKey();
  return { k, d: s.days[k] ?? emptyDay() };
}

export function recordEvent(e: Omit<ActivityEvent, "t">, planId?: string) {
  setState((s) => {
    const { k, d } = today(s);
    const done = planId && !d.done.includes(planId) ? [...d.done, planId] : d.done;
    return {
      ...s,
      xp: s.xp + e.xp,
      events: [...s.events, { ...e, t: Date.now() }].slice(-MAX_EVENTS),
      days: { ...s.days, [k]: { ...d, xp: d.xp + e.xp, done } },
    };
  });
}

export function markPlanDone(planId: string) {
  setState((s) => {
    const { k, d } = today(s);
    if (d.done.includes(planId)) return s;
    return { ...s, days: { ...s.days, [k]: { ...d, done: [...d.done, planId] } } };
  });
}

export function savePlan(ids: string[]) {
  setState((s) => {
    const { k, d } = today(s);
    if (d.plan) return s;
    return { ...s, days: { ...s.days, [k]: { ...d, plan: ids } } };
  });
}

export function resetPlan() {
  setState((s) => {
    const { k, d } = today(s);
    return { ...s, days: { ...s.days, [k]: { ...d, plan: undefined } } };
  });
}

function bump<T extends Attempt>(prev: T | undefined, score: number): Attempt {
  return {
    best: Math.max(prev?.best ?? 0, score),
    last: score,
    attempts: (prev?.attempts ?? 0) + 1,
    lastDate: Date.now(),
  };
}

type AttemptBucket = "listening" | "reading" | "speaking" | "writing";

export function recordAttempt(bucket: AttemptBucket, id: string, score: number, extra: Record<string, unknown> = {}) {
  setState((s) => ({ ...s, [bucket]: { ...s[bucket], [id]: { ...s[bucket][id], ...bump(s[bucket][id], score), ...extra } } }));
}

/** Seuil de maîtrise d'une leçon de grammaire. */
export const MASTERY = 80;
/** Seuil pour débloquer les leçons qui en dépendent. */
export const UNLOCK = 70;

export function recordLesson(id: string, score: number, testedOut = false) {
  setState((s) => {
    const prev = s.lessons[id];
    const a = bump(prev, score);
    return {
      ...s,
      lessons: { ...s.lessons, [id]: { ...a, mastered: a.best >= MASTERY, testedOut: testedOut || prev?.testedOut } },
    };
  });
}

export function recordAssessment(r: AssessmentResult, placementPerSkill?: AppState["placement"]) {
  setState((s) => ({
    ...s,
    assessments: [...s.assessments, r],
    placement: placementPerSkill ?? s.placement,
  }));
  void flush();
}

/* ---------- Cartes ---------- */

export function addCard(kind: "word" | "custom" | "exercise", ref: string) {
  setState((s) => {
    const c = newCard(kind, ref);
    if (s.cards[c.id]) return s;
    return { ...s, cards: { ...s.cards, [c.id]: c } };
  });
}

export function addWords(refs: string[]) {
  setState((s) => {
    const cards = { ...s.cards };
    for (const ref of refs) {
      const c = newCard("word", ref);
      if (!cards[c.id]) cards[c.id] = c;
    }
    return { ...s, cards };
  });
}

export function removeCard(id: string) {
  setState((s) => {
    const cards = { ...s.cards };
    delete cards[id];
    return { ...s, cards };
  });
}

export function gradeCard(id: string, grade: Grade) {
  const card = getState().cards[id];
  if (!card) return;
  const next = review(card, grade);
  const xp = grade >= 3 ? 3 : 1;
  setState((s) => ({ ...s, cards: { ...s.cards, [id]: next } }));
  recordEvent({ type: "review", skill: card.kind === "exercise" ? "grammar" : "vocabulary", ref: card.ref, score: grade >= 3 ? 100 : grade === 2 ? 60 : 0, xp });
}

export function addCustomWord(en: string, fr: string, source?: string, note?: string) {
  const id = `c-${en.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}`;
  setState((s) => {
    const c = newCard("custom", id);
    return {
      ...s,
      customWords: { ...s.customWords, [id]: { id, en: en.trim(), fr: fr.trim(), source, note, addedAt: Date.now() } },
      cards: s.cards[c.id] ? s.cards : { ...s.cards, [c.id]: c },
    };
  });
  return id;
}

export function deleteCustomWord(id: string) {
  setState((s) => {
    const customWords = { ...s.customWords };
    delete customWords[id];
    const cards = { ...s.cards };
    delete cards[`custom:${id}`];
    return { ...s, customWords, cards };
  });
}

/* ---------- Temps d'apprentissage ---------- */

export function addSeconds(sec: number, skill?: Skill) {
  setState((s) => {
    const { k, d } = today(s);
    const bySkill = { ...d.bySkill };
    if (skill) bySkill[skill] = (bySkill[skill] ?? 0) + sec;
    return { ...s, totalSeconds: s.totalSeconds + sec, days: { ...s.days, [k]: { ...d, seconds: d.seconds + sec, bySkill } } };
  });
}

export function unlockBadges(ids: string[]) {
  if (!ids.length) return;
  setState((s) => {
    const badges = { ...s.badges };
    for (const id of ids) badges[id] ??= Date.now();
    return { ...s, badges };
  });
}
