import type { ContentLevel, PartOfSpeech, VocabTheme, Word } from "../types";

const POS: Record<string, PartOfSpeech> = {
  n: "noun",
  v: "verb",
  adj: "adjective",
  adv: "adverb",
  pv: "phrasal verb",
  exp: "expression",
  prep: "preposition",
  conj: "conjunction",
};

/** [anglais, français, définition, API, nature, exemple, traduction de l'exemple] */
export type Row = [string, string, string, string, string, string, string];

export interface ThemeDef extends VocabTheme {
  level: ContentLevel;
  rows: Row[];
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function expand(themes: ThemeDef[]): Word[] {
  const out: Word[] = [];
  const seen = new Set<string>();
  for (const t of themes) {
    for (const [en, fr, def, ipa, pos, example, exampleFr] of t.rows) {
      let id = slug(en);
      if (seen.has(id)) id = `${id}-${t.id}`;
      seen.add(id);
      out.push({ id, en, fr, def, ipa, pos: POS[pos] ?? "expression", level: t.level, theme: t.id, example, exampleFr });
    }
  }
  return out;
}
