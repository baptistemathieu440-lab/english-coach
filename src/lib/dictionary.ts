import { ARTICLES, LISTENING, WORDS } from "@/content";
import type { Word } from "@/content/types";
import { lemmaCandidates } from "./text";

export interface DictEntry {
  term: string;
  fr: string;
  word?: Word;
  source: string;
}

let index: Map<string, DictEntry[]> | null = null;

/** Petit lexique des mots grammaticaux fréquents, pour que le dictionnaire réponde aussi sur eux. */
const CORE: [string, string][] = [
  ["the", "le, la, les"], ["a", "un, une"], ["an", "un, une"], ["and", "et"], ["but", "mais"], ["or", "ou"], ["because", "parce que"],
  ["if", "si"], ["when", "quand"], ["while", "pendant que ; alors que"], ["although", "bien que"], ["so", "donc ; si (tellement)"],
  ["with", "avec"], ["without", "sans"], ["for", "pour ; pendant (durée)"], ["since", "depuis ; puisque"], ["from", "de, depuis"],
  ["into", "dans (mouvement)"], ["about", "à propos de ; environ"], ["around", "autour ; environ"], ["between", "entre"],
  ["through", "à travers ; grâce à"], ["during", "pendant"], ["until", "jusqu'à"], ["after", "après"], ["before", "avant"],
  ["already", "déjà"], ["yet", "déjà (question) ; pas encore (négation)"], ["still", "encore, toujours"], ["just", "juste ; venir de"],
  ["really", "vraiment"], ["quite", "assez, plutôt"], ["rather", "plutôt"], ["enough", "assez"], ["too", "trop ; aussi"],
  ["also", "aussi"], ["even", "même"], ["only", "seulement"], ["almost", "presque"], ["nearly", "presque"], ["often", "souvent"],
  ["usually", "d'habitude"], ["never", "jamais"], ["always", "toujours"], ["sometimes", "parfois"], ["maybe", "peut-être"],
  ["perhaps", "peut-être"], ["probably", "probablement"], ["each", "chaque"], ["every", "chaque, tous les"], ["both", "les deux"],
  ["either", "l'un ou l'autre"], ["neither", "ni l'un ni l'autre"], ["several", "plusieurs"], ["few", "peu de"], ["little", "petit ; peu"],
  ["many", "beaucoup de (dénombrable)"], ["much", "beaucoup de (indénombrable)"], ["most", "la plupart ; le plus"], ["more", "plus"],
  ["less", "moins"], ["own", "propre (à soi) ; posséder"], ["same", "même (identique)"], ["other", "autre"], ["another", "un(e) autre"],
  ["such", "tel, si"], ["which", "qui, que, lequel"], ["whose", "dont, à qui"], ["whether", "si (alternative)"], ["however", "cependant"],
  ["though", "pourtant ; bien que"], ["instead", "à la place"], ["anyway", "de toute façon"], ["get", "obtenir ; devenir ; arriver"],
  ["make", "faire, fabriquer"], ["take", "prendre"], ["give", "donner"], ["keep", "garder ; continuer"], ["need", "avoir besoin"],
  ["want", "vouloir"], ["know", "savoir, connaître"], ["think", "penser"], ["feel", "se sentir, ressentir"], ["seem", "sembler"],
  ["become", "devenir"], ["leave", "partir ; laisser"], ["find", "trouver"], ["tell", "dire, raconter (à qn)"], ["say", "dire"],
  ["ask", "demander"], ["try", "essayer"], ["start", "commencer"], ["stop", "arrêter"], ["help", "aider"], ["show", "montrer"],
  ["mean", "signifier ; vouloir dire"], ["work", "travailler ; fonctionner ; travail"], ["people", "les gens"], ["time", "temps ; fois"],
  ["way", "chemin ; façon"], ["thing", "chose"], ["day", "jour"], ["year", "an, année"], ["week", "semaine"], ["life", "vie"],
  ["world", "monde"], ["job", "emploi, poste"], ["money", "argent"], ["price", "prix"], ["cost", "coût ; coûter"], ["rise", "hausse ; augmenter"],
  ["fall", "baisse ; tomber, baisser"], ["grow", "grandir, croître"], ["increase", "augmentation ; augmenter"], ["reduce", "réduire"],
  ["expect", "s'attendre à, prévoir"], ["suggest", "suggérer"], ["allow", "permettre, autoriser"], ["require", "exiger, nécessiter"],
  ["provide", "fournir"], ["include", "inclure"], ["offer", "offrir, proposer ; offre"], ["main", "principal"], ["key", "clé, essentiel"],
  ["likely", "probable"], ["unlikely", "peu probable"], ["able", "capable"], ["available", "disponible"], ["difficult", "difficile"],
  ["easy", "facile"], ["important", "important"], ["possible", "possible"], ["real", "réel"], ["true", "vrai"], ["whole", "entier"],
];

function add(map: Map<string, DictEntry[]>, key: string, e: DictEntry) {
  const k = key.toLowerCase();
  const list = map.get(k) ?? [];
  if (!list.some((x) => x.fr === e.fr)) list.push(e);
  map.set(k, list);
}

function build(): Map<string, DictEntry[]> {
  const map = new Map<string, DictEntry[]>();
  for (const w of WORDS) {
    add(map, w.en, { term: w.en, fr: w.fr, word: w, source: "Vocabulaire du parcours" });
    // Les expressions sont aussi retrouvées par leur mot principal.
    const parts = w.en.toLowerCase().split(/[\s-]+/);
    if (parts.length > 1) for (const p of parts) if (p.length > 3) add(map, p, { term: w.en, fr: w.fr, word: w, source: "Expression du parcours" });
  }
  for (const it of [...LISTENING, ...ARTICLES]) for (const g of it.glossary) for (const t of g.term.split("/")) add(map, t.trim(), { term: g.term, fr: g.fr, source: "Glossaire" });
  for (const [en, fr] of CORE) add(map, en, { term: en, fr, source: "Mots courants" });
  return map;
}

export function lookup(raw: string, custom: { en: string; fr: string }[] = []): DictEntry[] {
  index ??= build();
  const out: DictEntry[] = [];
  const cands = lemmaCandidates(raw);
  for (const c of custom) if (cands.includes(c.en.toLowerCase())) out.push({ term: c.en, fr: c.fr, source: "Mon carnet" });
  for (const cand of cands) for (const e of index.get(cand) ?? []) if (!out.some((o) => o.term === e.term && o.fr === e.fr)) out.push(e);
  return out.slice(0, 4);
}
