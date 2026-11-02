/** Outils de normalisation et de comparaison de texte. */

const PRONOUN_IS = ["it", "he", "she", "that", "what", "there", "here", "who", "where", "how"];

export function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Met en forme une réponse pour la comparaison : minuscules, ponctuation, contractions. */
export function normalize(input: string, opts: { expand?: boolean } = {}): string {
  let s = input
    .toLowerCase()
    .replace(/[‘’′`´]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (opts.expand !== false) s = expandContractions(s);
  s = s
    .replace(/[.,!?;:"()[\]{}]/g, " ")
    .replace(/(^|\s)-+|-+(\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s;
}

export function expandContractions(s: string): string {
  return s
    .replace(/\bwon't\b/g, "will not")
    .replace(/\bcan't\b/g, "cannot")
    .replace(/\bcan not\b/g, "cannot")
    .replace(/\bshan't\b/g, "shall not")
    .replace(/\blet's\b/g, "let us")
    .replace(/\b(\w+)n't\b/g, "$1 not")
    .replace(/\b(\w+)'re\b/g, "$1 are")
    .replace(/\b(\w+)'ve\b/g, "$1 have")
    .replace(/\bi'm\b/g, "i am")
    .replace(/\b(\w+)'ll\b/g, "$1 will")
    .replace(/\b(i|you|he|she|we|they|it)'d\b/g, "$1 would")
    .replace(new RegExp(`\\b(${PRONOUN_IS.join("|")})'s\\b`, "g"), "$1 is");
}

export function tokenize(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

export type MatchStatus = "correct" | "typo" | "accent" | "wrong";

export interface MatchResult {
  status: MatchStatus;
  /** Réponse attendue la plus proche. */
  expected: string;
  /** Mots en écart (pour l'affichage). */
  diff?: { got: string; want: string }[];
}

/**
 * Compare une réponse aux réponses acceptées.
 * Une faute de frappe n'est tolérée que sur un mot long et jamais quand l'écart
 * est grammatical (work/works, play/played) : ces écarts sont des erreurs.
 */
export function matchAnswer(input: string, accepted: string[], lang: "en" | "fr" = "en"): MatchResult {
  const got = normalize(input, { expand: lang === "en" });
  let best: MatchResult = { status: "wrong", expected: accepted[0] ?? "" };
  let bestDistance = Infinity;
  for (const answer of accepted) {
    const want = normalize(answer, { expand: lang === "en" });
    if (got === want) return { status: "correct", expected: answer };
    if (lang === "fr" && stripDiacritics(got) === stripDiacritics(want)) {
      best = { status: "accent", expected: answer };
      bestDistance = 0;
      continue;
    }
    const gw = got.split(" ");
    const ww = want.split(" ");
    const d = levenshtein(got, want);
    if (gw.length === ww.length) {
      const diff: { got: string; want: string }[] = [];
      let tolerable = true;
      for (let i = 0; i < gw.length; i++) {
        if (gw[i] === ww[i]) continue;
        const a = lang === "fr" ? stripDiacritics(gw[i]) : gw[i];
        const b = lang === "fr" ? stripDiacritics(ww[i]) : ww[i];
        diff.push({ got: gw[i], want: ww[i] });
        if (a === b) continue;
        const grammatical = a.startsWith(b) || b.startsWith(a);
        if (grammatical || b.length < 5 || levenshtein(a, b) > 1) tolerable = false;
      }
      if (tolerable && diff.length <= 2 && bestDistance > 0) {
        best = { status: "typo", expected: answer, diff };
        bestDistance = 0;
        continue;
      }
      if (d < bestDistance) {
        bestDistance = d;
        best = { status: "wrong", expected: answer, diff };
      }
    } else if (d < bestDistance) {
      bestDistance = d;
      best = { status: "wrong", expected: answer };
    }
  }
  return best;
}

/** Recherche un mot ou une expression dans un texte (frontières de mots). */
export function containsTerm(text: string, term: string): boolean {
  const t = ` ${normalize(text)} `;
  const n = normalize(term);
  return n.length > 0 && t.includes(` ${n} `);
}

/** Proportion de mots de la cible retrouvés dans la transcription (prononciation). */
export function wordOverlap(target: string, said: string): { score: number; words: { w: string; ok: boolean }[] } {
  const want = target.split(/\s+/).filter(Boolean);
  const got = tokenize(said);
  const pool = [...got];
  const words = want.map((w) => {
    const n = normalize(w);
    const parts = n.split(" ");
    const ok = parts.every((p) => {
      const i = pool.indexOf(p);
      if (i >= 0) {
        pool.splice(i, 1);
        return true;
      }
      return false;
    });
    return { w, ok };
  });
  const score = want.length ? Math.round((words.filter((x) => x.ok).length / want.length) * 100) : 0;
  return { score, words };
}

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter((w) => /[a-zA-Z]/.test(w)).length;
}

export function shuffle<T>(arr: T[], seed = Math.random()): T[] {
  const a = [...arr];
  let x = Math.floor(seed * 2 ** 31) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    x = (x * 48271) % 2147483647;
    const j = x % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Lemmatisation simple pour le dictionnaire intégré. */
export function lemmaCandidates(raw: string): string[] {
  const w = raw.toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z']+|[^a-z']+$/g, "").replace(/'s$/, "");
  const out = new Set<string>([w]);
  const add = (x: string) => x.length > 1 && out.add(x);
  if (w.endsWith("ies")) add(w.slice(0, -3) + "y");
  if (w.endsWith("es")) add(w.slice(0, -2));
  if (w.endsWith("s")) add(w.slice(0, -1));
  if (w.endsWith("ied")) add(w.slice(0, -3) + "y");
  if (w.endsWith("ed")) {
    add(w.slice(0, -2));
    add(w.slice(0, -1));
    if (/(.)\1ed$/.test(w)) add(w.slice(0, -3));
  }
  if (w.endsWith("ing")) {
    add(w.slice(0, -3));
    add(w.slice(0, -3) + "e");
    if (/(.)\1ing$/.test(w)) add(w.slice(0, -4));
  }
  if (w.endsWith("er")) add(w.slice(0, -2));
  if (w.endsWith("est")) add(w.slice(0, -3));
  if (w.endsWith("ly")) add(w.slice(0, -2));
  return [...out];
}
