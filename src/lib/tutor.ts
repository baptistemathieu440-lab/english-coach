import { FOLLOW_UPS } from "@/content/speaking";
import type { FreeTopic } from "@/content/types";
import { checkText, correctText, type Issue } from "./checker";
import { containsTerm, wordCount } from "./text";
import type { AiMode, Settings } from "@/state/store";

export interface TutorFeedback {
  issues: Issue[];
  corrected: string;
  /** Explication en français. */
  notes: string[];
  score: number;
}

export interface TutorTurn {
  reply: string;
  feedback: TutorFeedback;
  /** Version corrigée renvoyée par l'IA, s'il y en a une. */
  aiCorrection?: string;
}

/** Analyse locale d'une réponse : erreurs détectées, longueur, développement. */
export function analyse(text: string): TutorFeedback {
  const issues = checkText(text);
  const corrected = correctText(text, issues);
  const words = wordCount(text);
  const notes: string[] = [];
  if (words < 6) notes.push("Réponse très courte : essayez de faire une phrase complète, puis ajoutez une raison (because…) ou un exemple.");
  else if (words < 15) notes.push("Bonne base. Pour progresser, développez : une raison, un exemple ou une conséquence.");
  else notes.push("Réponse développée : très bien.");
  if (!/\b(because|so|but|although|however|when|if|since|while)\b/i.test(text) && words >= 6) notes.push("Ajoutez un connecteur (because, but, so, although) pour relier vos idées.");
  const accuracy = Math.max(0, 1 - issues.length * 0.2);
  const length = Math.min(1, words / 20);
  return { issues, corrected, notes, score: Math.round(100 * (0.6 * accuracy + 0.4 * length)) };
}

/**
 * Professeur hors IA : il pose les questions d'un thème, relance selon la longueur
 * et la qualité de la réponse, et corrige avec le détecteur d'erreurs local.
 */
export class OfflineTutor {
  private i = 0;
  private followed = false;
  constructor(private topic: FreeTopic) {}

  opening(): string {
    return `Hi! Let's talk about this: ${this.topic.questions[0]}`;
  }

  respond(text: string): TutorTurn {
    const feedback = analyse(text);
    const words = wordCount(text);
    const ack = FOLLOW_UPS.good[(this.i + words) % FOLLOW_UPS.good.length];
    let reply: string;
    if (words < 12 && !this.followed) {
      this.followed = true;
      reply = FOLLOW_UPS.short[this.i % FOLLOW_UPS.short.length];
    } else if (!containsTerm(text, "because") && !this.followed && words < 25) {
      this.followed = true;
      reply = `${ack} ${FOLLOW_UPS.reasons[this.i % FOLLOW_UPS.reasons.length]}`;
    } else {
      this.followed = false;
      this.i++;
      reply = this.i < this.topic.questions.length ? `${ack} Next question: ${this.topic.questions[this.i]}` : `${ack} That was a great conversation. Well done!`;
    }
    return { reply, feedback };
  }

  get finished(): boolean {
    return this.i >= this.topic.questions.length;
  }

  get progress(): { done: number; total: number } {
    return { done: Math.min(this.i, this.topic.questions.length), total: this.topic.questions.length };
  }
}

/* ---------- IA conversationnelle facultative ---------- */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function systemPrompt(level: string, topic: string): string {
  return [
    `You are a friendly English teacher talking with a French-speaking adult learner whose level is ${level} (CEFR). Their goal is B2.`,
    `Topic: ${topic}.`,
    "Rules:",
    "1. Reply in simple, natural English adapted to the learner's level, in 1 to 3 short sentences, and always end with ONE question to keep the conversation going.",
    "2. Then, on a new line, write 'CORRECTION:' followed by the learner's last message rewritten correctly and naturally. If it was already correct, write 'CORRECTION: OK'.",
    "3. Then, on a new line, write 'EXPLICATION:' followed by a short explanation in French of the main mistake (one sentence), or 'EXPLICATION: Aucune erreur.'",
    "Never write anything else.",
  ].join("\n");
}

export function parseAiReply(raw: string): { reply: string; correction?: string; explanation?: string } {
  const c = raw.split(/\n?\s*CORRECTION\s*:/i);
  const reply = c[0].trim();
  if (c.length < 2) return { reply };
  const [corr, expl] = c[1].split(/\n?\s*EXPLICATION\s*:/i);
  const correction = corr.trim();
  return { reply, correction: /^ok\.?$/i.test(correction) ? undefined : correction, explanation: expl?.trim() };
}

type WebLlmEngine = {
  chat: { completions: { create: (r: { messages: ChatMessage[]; temperature?: number; max_tokens?: number }) => Promise<{ choices: { message: { content: string | null } }[] }> } };
};

let engine: WebLlmEngine | null = null;
let engineModel = "";

export function webGpuAvailable(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

/** Charge le modèle local (WebLLM). Le premier chargement télécharge le modèle (plusieurs centaines de Mo), ensuite il est en cache. */
export async function loadWebLlm(model: string, onProgress: (p: { progress: number; text: string }) => void): Promise<void> {
  if (engine && engineModel === model) return;
  const webllm = await import("@mlc-ai/web-llm");
  engine = (await webllm.CreateMLCEngine(model, { initProgressCallback: onProgress })) as unknown as WebLlmEngine;
  engineModel = model;
}

export function webLlmReady(model: string): boolean {
  return engine !== null && engineModel === model;
}

export async function aiChat(settings: Settings["ai"], messages: ChatMessage[]): Promise<string> {
  if (settings.mode === "webllm") {
    if (!engine) throw new Error("Le modèle local n'est pas chargé.");
    const r = await engine.chat.completions.create({ messages, temperature: 0.6, max_tokens: 220 });
    return r.choices[0]?.message.content ?? "";
  }
  if (settings.mode === "ollama") {
    const res = await fetch(`${settings.ollamaUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: settings.ollamaModel, messages, stream: false, options: { temperature: 0.6 } }),
    });
    if (!res.ok) throw new Error(`Ollama a répondu ${res.status}`);
    const data = (await res.json()) as { message?: { content?: string } };
    return data.message?.content ?? "";
  }
  throw new Error("IA désactivée");
}

export const AI_MODES: { id: AiMode; label: string; description: string }[] = [
  { id: "off", label: "Professeur intégré (recommandé)", description: "Fonctionne partout, hors connexion. Questions guidées, relances et correction des erreurs fréquentes des francophones. Il ne comprend pas le sens de vos phrases comme une IA." },
  { id: "webllm", label: "IA locale dans le navigateur (WebLLM)", description: "Un petit modèle open source tourne sur votre appareil, gratuitement et sans compte. Nécessite un navigateur compatible WebGPU (Chrome ou Edge récents), un premier téléchargement de 0,4 à 1 Go et un appareil assez puissant. Les corrections d'un petit modèle peuvent être imparfaites." },
  { id: "ollama", label: "IA sur votre ordinateur (Ollama)", description: "Si vous installez Ollama (gratuit, open source) sur votre ordinateur, l'application peut dialoguer avec un modèle plus grand. Ne fonctionne que sur cet ordinateur ou votre réseau local." },
];

export const WEBLLM_MODELS = [
  { id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 0.5B — léger (≈ 0,4 Go), qualité limitée" },
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B — équilibré (≈ 0,9 Go)" },
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 1.5B — meilleur (≈ 1 Go)" },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama 3.2 3B — le plus juste (≈ 2 Go, ordinateur conseillé)" },
];
