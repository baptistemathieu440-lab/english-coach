import { openDB, type IDBPDatabase } from "idb";
import { useSyncExternalStore } from "react";
import type { Card } from "@/lib/srs";
import type { Cefr, Skill } from "@/content/types";

export interface Attempt {
  best: number;
  last: number;
  attempts: number;
  lastDate: number;
}

export interface ActivityEvent {
  t: number;
  type:
    | "exercise"
    | "lesson"
    | "review"
    | "listening"
    | "dictation"
    | "reading"
    | "writing"
    | "speaking"
    | "conversation"
    | "pronunciation"
    | "assessment"
    | "words";
  skill: Skill;
  ref?: string;
  /** Score 0-100 quand l'activité est notée. */
  score?: number;
  /** Niveau du contenu (A2, B1, B2). */
  level?: string;
  xp: number;
}

export interface AssessmentResult {
  id: string;
  date: number;
  scores: Partial<Record<Skill, number>>;
  overall: number;
  passed: boolean;
  /** Niveau estimé (test de positionnement) ou validé (examen). */
  level: Cefr;
}

export interface CustomWord {
  id: string;
  en: string;
  fr: string;
  note?: string;
  source?: string;
  addedAt: number;
}

export interface DayLog {
  seconds: number;
  xp: number;
  /** Activités du programme du jour (figées au premier affichage). */
  plan?: string[];
  done: string[];
  /** Temps par compétence (secondes). */
  bySkill?: Partial<Record<Skill, number>>;
}

export type AiMode = "off" | "webllm" | "ollama";

export interface Settings {
  theme: "system" | "light" | "dark";
  dailyMinutes: 30 | 45;
  newWordsPerDay: number;
  speechRate: number;
  ai: { mode: AiMode; model: string; ollamaUrl: string; ollamaModel: string };
  /** Afficher les consignes en anglais quand le niveau le permet. */
  englishInstructions: boolean;
}

export interface AppState {
  version: 1;
  createdAt: number;
  name: string;
  onboarded: boolean;
  settings: Settings;
  placement?: AssessmentResult & { perSkill: Partial<Record<Skill, Cefr>> };
  assessments: AssessmentResult[];
  lessons: Record<string, Attempt & { mastered: boolean; testedOut?: boolean }>;
  listening: Record<string, Attempt & { dictation?: number; summary?: string }>;
  reading: Record<string, Attempt & { summary?: string }>;
  speaking: Record<string, Attempt>;
  writing: Record<string, Attempt & { text?: string }>;
  cards: Record<string, Card>;
  customWords: Record<string, CustomWord>;
  events: ActivityEvent[];
  days: Record<string, DayLog>;
  xp: number;
  totalSeconds: number;
  badges: Record<string, number>;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  dailyMinutes: 30,
  newWordsPerDay: 10,
  speechRate: 0.95,
  ai: { mode: "off", model: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", ollamaUrl: "http://localhost:11434", ollamaModel: "llama3.2" },
  englishInstructions: false,
};

export function initialState(): AppState {
  return {
    version: 1,
    createdAt: Date.now(),
    name: "",
    onboarded: false,
    settings: DEFAULT_SETTINGS,
    assessments: [],
    lessons: {},
    listening: {},
    reading: {},
    speaking: {},
    writing: {},
    cards: {},
    customWords: {},
    events: [],
    days: {},
    xp: 0,
    totalSeconds: 0,
    badges: {},
  };
}

/* ---------- Persistance (IndexedDB, repli localStorage) ---------- */

const DB_NAME = "english-coach";
const KEY = "state";
let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(d) {
      d.createObjectStore("kv");
    },
  });
  return dbPromise;
}

async function loadPersisted(): Promise<AppState | null> {
  try {
    const v = (await (await db()).get("kv", KEY)) as AppState | undefined;
    if (v) return v;
  } catch {
    /* IndexedDB indisponible (navigation privée) */
  }
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppState) : null;
  } catch {
    return null;
  }
}

async function persist(s: AppState) {
  try {
    await (await db()).put("kv", s, KEY);
    return;
  } catch {
    /* repli */
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* stockage plein ou bloqué */
  }
}

/** Complète un état chargé avec les champs ajoutés dans les versions suivantes. */
export function migrate(raw: Partial<AppState>): AppState {
  const base = initialState();
  return {
    ...base,
    ...raw,
    settings: { ...base.settings, ...raw.settings, ai: { ...base.settings.ai, ...raw.settings?.ai } },
  } as AppState;
}

/* ---------- Store ---------- */

let state: AppState = initialState();
let ready = false;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function emit() {
  for (const l of listeners) l();
}

export async function loadState() {
  const saved = await loadPersisted();
  if (saved) state = migrate(saved);
  ready = true;
  if (typeof navigator !== "undefined" && navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  emit();
}

export function isReady() {
  return ready;
}

export function getState(): AppState {
  return state;
}

export function setState(updater: (s: AppState) => AppState) {
  state = updater(state);
  emit();
  // Écriture regroupée en fin de tâche : rien n'est perdu si la page est fermée juste après.
  if (saveTimer === undefined) {
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      void persist(state);
    }, 0);
  }
}

export function flush() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  return persist(state);
}

export function replaceState(next: AppState) {
  state = migrate(next);
  emit();
  return flush();
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useReady(): boolean {
  return useSyncExternalStore(subscribe, isReady, isReady);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
  window.addEventListener("pagehide", () => void flush());
}

/* ---------- Dates ---------- */

export function dayKey(t = Date.now()): string {
  const d = new Date(t - 4 * 3_600_000); // journée d'apprentissage de 4 h à 4 h
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function emptyDay(): DayLog {
  return { seconds: 0, xp: 0, done: [] };
}
