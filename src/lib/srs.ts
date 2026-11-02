/**
 * Répétition espacée, variante de l'algorithme SM-2 (Anki).
 * - Étapes d'apprentissage courtes (1 min, 10 min), puis intervalles en jours.
 * - Chaque oubli réduit la facilité et l'intervalle ; chaque réussite l'allonge.
 */

export type Grade = 1 | 2 | 3 | 4; // 1 Oublié · 2 Difficile · 3 Correct · 4 Facile
export type CardState = "new" | "learning" | "review" | "relearning";

export interface Card {
  id: string;
  /** word = mot du programme · custom = mot ajouté par l'apprenant · exercise = erreur de grammaire à retravailler */
  kind: "word" | "custom" | "exercise";
  ref: string;
  state: CardState;
  due: number;
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
  step: number;
  addedAt: number;
  lastReview?: number;
  lastLapse?: number;
  /** Notes récentes (les plus récentes à la fin). */
  history: Grade[];
}

const MIN = 60_000;
const DAY = 86_400_000;
const LEARNING_STEPS = [1 * MIN, 10 * MIN];
const RELEARNING_STEPS = [10 * MIN];
const GRADUATING_INTERVAL = 1;
const EASY_INTERVAL = 4;
const MAX_INTERVAL = 365;

export function newCard(kind: Card["kind"], ref: string, now = Date.now()): Card {
  return {
    id: `${kind}:${ref}`,
    kind,
    ref,
    state: "new",
    due: now,
    interval: 0,
    ease: 2.5,
    reps: 0,
    lapses: 0,
    step: 0,
    addedAt: now,
    history: [],
  };
}

/** Début du jour suivant la date donnée (heure locale), pour planifier en jours. */
function dayStart(t: number): number {
  const d = new Date(t);
  d.setHours(4, 0, 0, 0); // une « journée » d'apprentissage commence à 4 h
  if (new Date(t).getHours() < 4) d.setDate(d.getDate() - 1);
  return d.getTime();
}

function inDays(now: number, days: number): number {
  return dayStart(now) + Math.max(1, Math.round(days)) * DAY;
}

/** Petite variation déterministe pour éviter que toutes les cartes reviennent le même jour. */
function fuzz(interval: number, id: string): number {
  if (interval < 3) return interval;
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  const f = ((Math.abs(h) % 11) - 5) / 100; // ±5 %
  return Math.max(1, Math.round(interval * (1 + f)));
}

export function review(card: Card, grade: Grade, now = Date.now()): Card {
  const c: Card = { ...card, history: [...card.history, grade].slice(-10), lastReview: now, reps: card.reps + 1 };

  if (c.state === "new" || c.state === "learning") {
    c.state = "learning";
    if (grade === 1) {
      c.step = 0;
      c.due = now + LEARNING_STEPS[0];
    } else if (grade === 2) {
      c.due = now + LEARNING_STEPS[c.step] * 1.5;
    } else if (grade === 3) {
      c.step += 1;
      if (c.step >= LEARNING_STEPS.length) {
        c.state = "review";
        c.interval = GRADUATING_INTERVAL;
        c.due = inDays(now, c.interval);
      } else c.due = now + LEARNING_STEPS[c.step];
    } else {
      c.state = "review";
      c.interval = EASY_INTERVAL;
      c.due = inDays(now, c.interval);
    }
    return c;
  }

  if (c.state === "relearning") {
    if (grade === 1) {
      c.due = now + RELEARNING_STEPS[0];
    } else {
      c.state = "review";
      c.interval = Math.max(1, c.interval);
      c.due = inDays(now, grade === 4 ? c.interval + 1 : c.interval);
    }
    return c;
  }

  // review
  if (grade === 1) {
    c.lapses += 1;
    c.lastLapse = now;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.interval = Math.max(1, Math.round(c.interval * 0.5));
    c.state = "relearning";
    c.due = now + RELEARNING_STEPS[0];
    return c;
  }
  const late = Math.max(0, (now - c.due) / DAY);
  if (grade === 2) {
    c.ease = Math.max(1.3, c.ease - 0.15);
    c.interval = Math.max(c.interval + 1, c.interval * 1.2);
  } else if (grade === 3) {
    c.interval = Math.max(c.interval + 1, (c.interval + late / 2) * c.ease);
  } else {
    c.ease += 0.15;
    c.interval = Math.max(c.interval + 2, (c.interval + late) * c.ease * 1.3);
  }
  c.interval = Math.min(MAX_INTERVAL, fuzz(Math.round(c.interval), c.id));
  c.due = inDays(now, c.interval);
  return c;
}

/** Intervalle prévu pour chaque note (affiché sous les boutons). */
export function previewIntervals(card: Card, now = Date.now()): Record<Grade, string> {
  const out = {} as Record<Grade, string>;
  for (const g of [1, 2, 3, 4] as Grade[]) {
    const r = review(card, g, now);
    const ms = r.due - now;
    out[g] = ms < 60 * MIN ? `${Math.max(1, Math.round(ms / MIN))} min` : ms < DAY ? `${Math.round(ms / (60 * MIN))} h` : `${Math.round(ms / DAY)} j`;
  }
  return out;
}

export type CardCategory = "new" | "recent" | "mastered" | "forgotten" | "difficult" | "learning" | "known";

export function isDue(card: Card, now = Date.now()): boolean {
  if (card.state === "new") return false;
  if (card.state === "learning" || card.state === "relearning") return card.due <= now + 20 * MIN;
  return card.due <= dayStart(now) + DAY;
}

export function categorize(card: Card, now = Date.now()): CardCategory[] {
  const cats: CardCategory[] = [];
  if (card.state === "new") return ["new"];
  if (card.state === "learning" || card.state === "relearning") cats.push("learning");
  if (card.addedAt > now - 7 * DAY && card.state !== "relearning") cats.push("recent");
  if (card.state === "review" && card.interval >= 21) cats.push("mastered");
  else if (card.state === "review") cats.push("known");
  if (card.lastLapse && card.lastLapse > now - 14 * DAY) cats.push("forgotten");
  if (card.lapses >= 3 || card.ease < 1.9) cats.push("difficult");
  return cats;
}

/** Un mot est « appris » dès qu'il est sorti de la phase d'apprentissage. */
export function isLearned(card: Card): boolean {
  return card.state === "review" || (card.state === "relearning" && card.interval >= 1);
}

export function isMastered(card: Card): boolean {
  return card.state === "review" && card.interval >= 21;
}

/**
 * Mode de la carte : on commence par reconnaître, puis on produit.
 * Objectif : savoir retrouver et écrire le mot, pas seulement le reconnaître.
 */
export type CardMode = "recognize" | "choice" | "produce" | "listen" | "cloze";

export function cardMode(card: Card): CardMode {
  if (card.kind === "exercise") return "produce";
  const ok = card.history.filter((g) => g >= 3).length;
  if (card.state === "new" || ok === 0) return "recognize";
  if (ok === 1) return "choice";
  const cycle: CardMode[] = card.kind === "custom" ? ["produce", "recognize", "produce"] : ["produce", "cloze", "listen", "produce"];
  return cycle[card.reps % cycle.length];
}
