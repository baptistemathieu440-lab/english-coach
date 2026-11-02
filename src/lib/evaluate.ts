import { checkText, correctText, type Issue } from "./checker";
import { containsTerm, wordCount } from "./text";

const CONNECTORS = [
  "and", "but", "because", "so", "although", "even though", "however", "moreover", "furthermore", "in addition",
  "therefore", "as a result", "on the other hand", "whereas", "while", "despite", "in spite of", "for example",
  "for instance", "such as", "first", "firstly", "secondly", "then", "finally", "to sum up", "in conclusion",
  "overall", "nevertheless", "that said", "admittedly", "unless", "since", "consequently", "on balance", "if", "when",
];

export interface TextEvaluation {
  words: number;
  sentences: number;
  issues: Issue[];
  corrected: string;
  connectors: string[];
  variety: number;
  checklist: { label: string; ok: boolean }[];
  /** Détail de la note (sur 100). */
  parts: { label: string; score: number; max: number }[];
  score: number;
}

/**
 * Évaluation automatique d'un texte, sans IA : longueur, éléments attendus,
 * connecteurs, variété du vocabulaire et erreurs détectées. C'est une estimation :
 * elle ne juge ni le sens ni le style comme le ferait un professeur.
 */
export function evaluateText(text: string, opts: { minWords: number; checklist?: { label: string; any: string[] }[] }): TextEvaluation {
  const words = wordCount(text);
  const sentences = Math.max(1, (text.match(/[.!?]+(\s|$)/g) ?? []).length);
  const issues = checkText(text);
  const corrected = correctText(text, issues);
  const connectors = CONNECTORS.filter((c) => containsTerm(text, c));
  const tokens = text.toLowerCase().match(/[a-z']+/g) ?? [];
  const variety = tokens.length ? new Set(tokens).size / tokens.length : 0;
  const checklist = (opts.checklist ?? []).map((c) => ({ label: c.label, ok: c.any.some((t) => (t === "?" ? text.includes("?") : containsTerm(text, t))) }));

  const lengthScore = Math.round(Math.min(1, words / Math.max(1, opts.minWords)) * 20);
  const checklistScore = checklist.length ? Math.round((checklist.filter((c) => c.ok).length / checklist.length) * 30) : 30;
  const connectorScore = Math.round(Math.min(1, connectors.length / Math.max(2, Math.round(opts.minWords / 30))) * 15);
  const varietyScore = words < 10 ? 0 : Math.round(Math.min(1, Math.max(0, (variety - 0.35) / 0.3)) * 15);
  const per100 = words ? (issues.length / words) * 100 : 0;
  const accuracyScore = words < 5 ? 0 : Math.max(0, Math.round(20 - per100 * 4));

  const parts = [
    { label: "Longueur", score: lengthScore, max: 20 },
    { label: "Consigne respectée", score: checklistScore, max: 30 },
    { label: "Connecteurs", score: connectorScore, max: 15 },
    { label: "Variété du vocabulaire", score: varietyScore, max: 15 },
    { label: "Correction (erreurs détectées)", score: accuracyScore, max: 20 },
  ];
  return { words, sentences, issues, corrected, connectors, variety, checklist, parts, score: parts.reduce((a, p) => a + p.score, 0) };
}

export interface SpokenEvaluation {
  relevant: boolean;
  matchedGroups: number;
  totalGroups: number;
  tooShort: boolean;
  issues: Issue[];
  corrected: string;
  score: number;
}

/** Évaluation d'une réponse orale (transcription) dans un scénario guidé. */
export function evaluateAnswer(text: string, expect: string[][], minWords: number): SpokenEvaluation {
  const words = wordCount(text);
  const matchedGroups = expect.filter((g) => g.some((t) => (t === "?" ? text.includes("?") : containsTerm(text, t)))).length;
  const issues = checkText(text);
  const corrected = correctText(text, issues);
  const relevant = expect.length === 0 || matchedGroups >= Math.ceil(expect.length / 2);
  const tooShort = words < minWords;
  const relevance = expect.length ? matchedGroups / expect.length : 1;
  const length = Math.min(1, words / Math.max(1, minWords));
  const accuracy = Math.max(0, 1 - issues.length * 0.25);
  const score = Math.round(100 * (0.4 * relevance + 0.3 * length + 0.3 * accuracy));
  return { relevant, matchedGroups, totalGroups: expect.length, tooShort, issues, corrected, score };
}
