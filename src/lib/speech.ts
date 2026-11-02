import type { Accent } from "@/content/types";

/**
 * Synthèse et reconnaissance vocales natives du navigateur (gratuites).
 * - La synthèse utilise les voix installées sur l'appareil : selon le système,
 *   certaines voix sont locales (hors connexion), d'autres sont en ligne.
 * - La reconnaissance (Chrome, Edge, Safari) envoie l'audio au service du
 *   fabricant du navigateur ; elle n'existe pas dans Firefox.
 */

export const ACCENT_LANG: Record<Accent, string> = {
  us: "en-US",
  gb: "en-GB",
  au: "en-AU",
  ie: "en-IE",
  in: "en-IN",
  ca: "en-CA",
  za: "en-ZA",
};

export const ACCENT_LABEL: Record<Accent, string> = {
  us: "américain",
  gb: "britannique",
  au: "australien",
  ie: "irlandais",
  in: "indien",
  ca: "canadien",
  za: "sud-africain",
};

const FEMALE = /female|woman|samantha|karen|moira|tessa|serena|victoria|fiona|veena|kate|libby|sonia|jenny|aria|natasha|clara|emily|susan|zira|hazel|catherine|allison|ava|nicky|martha|isla|neerja|leah|olivia|emma|amy|joanna|salli|kimberly|ivy|ruth|female/i;
const MALE = /male|man|daniel|alex|fred|oliver|tom|rishi|arthur|gordon|aaron|ryan|guy|thomas|george|william|james|liam|connor|prabhat|luke|brian|matthew|joey|justin|male/i;

let voices: SpeechSynthesisVoice[] = [];

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function loadVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  return voices;
}

if (ttsSupported()) {
  loadVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}

export function englishVoices(): SpeechSynthesisVoice[] {
  return voices.length ? voices : loadVoices();
}

export function pickVoice(accent: Accent = "gb", gender?: "female" | "male"): { voice?: SpeechSynthesisVoice; exact: boolean } {
  const list = englishVoices();
  const lang = ACCENT_LANG[accent].toLowerCase();
  const sameLang = list.filter((v) => v.lang.toLowerCase().replace("_", "-") === lang);
  const byGender = (arr: SpeechSynthesisVoice[]) => {
    if (!gender) return arr[0];
    const re = gender === "female" ? FEMALE : MALE;
    const other = gender === "female" ? MALE : FEMALE;
    return arr.find((v) => re.test(v.name) && !other.test(v.name.replace(re, ""))) ?? arr[0];
  };
  if (sameLang.length) return { voice: byGender(sameLang), exact: true };
  const fallback = list.filter((v) => /en-(gb|us)/i.test(v.lang));
  return { voice: byGender(fallback.length ? fallback : list), exact: false };
}

export function accentAvailable(accent: Accent): boolean {
  return englishVoices().some((v) => v.lang.toLowerCase().replace("_", "-") === ACCENT_LANG[accent].toLowerCase());
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

export function speak(text: string, opts: { accent?: Accent; gender?: "female" | "male"; rate?: number } = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!ttsSupported()) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    const { voice } = pickVoice(opts.accent ?? "gb", opts.gender);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? ACCENT_LANG[opts.accent ?? "gb"];
    u.rate = opts.rate ?? 0.95;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    u.onend = finish;
    u.onerror = finish;
    // Garde-fou : certains navigateurs ne déclenchent pas toujours onend.
    setTimeout(finish, Math.max(4000, text.length * 120 / (opts.rate ?? 1)));
    window.speechSynthesis.speak(u);
  });
}

/* ---------- Reconnaissance vocale ---------- */

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }>;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function sttSupported(): boolean {
  return recognitionCtor() !== null;
}

export interface Listening {
  stop: () => void;
  result: Promise<{ transcript: string; confidence: number }>;
}

export function listen(opts: { lang?: string; onInterim?: (t: string) => void } = {}): Listening {
  const Ctor = recognitionCtor();
  if (!Ctor) return { stop: () => {}, result: Promise.reject(new Error("unsupported")) };
  const rec = new Ctor();
  rec.lang = opts.lang ?? "en-GB";
  rec.interimResults = true;
  rec.continuous = true;
  rec.maxAlternatives = 1;
  let finalText = "";
  let interim = "";
  let conf = 0;
  let n = 0;
  const result = new Promise<{ transcript: string; confidence: number }>((resolve, reject) => {
    rec.onresult = (e) => {
      finalText = "";
      interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalText += r[0].transcript + " ";
          conf += r[0].confidence;
          n++;
        } else interim += r[0].transcript;
      }
      opts.onInterim?.((finalText + interim).trim());
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      reject(new Error(e.error));
    };
    rec.onend = () => resolve({ transcript: (finalText + interim).trim(), confidence: n ? conf / n : 0 });
  });
  rec.start();
  return { stop: () => rec.stop(), result };
}

export function sttErrorMessage(err: unknown): string {
  const code = err instanceof Error ? err.message : String(err);
  if (code === "not-allowed" || code === "service-not-allowed") return "Accès au micro refusé. Autorisez le micro dans les réglages du navigateur, ou répondez par écrit.";
  if (code === "network") return "La reconnaissance vocale de ce navigateur nécessite une connexion internet. Répondez par écrit en attendant.";
  if (code === "unsupported") return "Ce navigateur ne propose pas la reconnaissance vocale (Firefox par exemple). Utilisez Chrome, Edge ou Safari, ou répondez par écrit.";
  return "La reconnaissance vocale a échoué. Réessayez ou répondez par écrit.";
}
