/**
 * Détecteur d'erreurs fréquentes des francophones en anglais.
 * Fonctionne hors ligne, sans IA : il repère des structures précises
 * (calques du français, accords, temps) et explique la règle en français.
 * Il ne remplace pas un correcteur complet : une phrase sans alerte n'est pas
 * forcément parfaite.
 */

export interface Issue {
  id: string;
  start: number;
  end: number;
  found: string;
  suggestion?: string;
  message: string;
}

interface Rule {
  id: string;
  re: RegExp;
  message: string;
  fix?: (m: RegExpExecArray) => string;
}

const AUX_BEFORE =
  "(?<!\\b(?:do|does|did|will|would|can|could|should|must|might|may|shall|to|let|lets|make|makes|made|help|helps|helped|see|saw|watch|hear|heard|have|had|not|n't)\\s)";

const THIRD_PERSON: Record<string, string> = {
  go: "goes", do: "does", have: "has", want: "wants", like: "likes", need: "needs", work: "works",
  live: "lives", play: "plays", think: "thinks", know: "knows", say: "says", make: "makes",
  take: "takes", come: "comes", love: "loves", hate: "hates", feel: "feels", try: "tries",
  study: "studies", watch: "watches", speak: "speaks", understand: "understands", prefer: "prefers",
  use: "uses", seem: "seems", look: "looks", eat: "eats", drink: "drinks", read: "reads",
  write: "writes", sleep: "sleeps", get: "gets", leave: "leaves", start: "starts", finish: "finishes",
  pay: "pays", buy: "buys", sell: "sells", teach: "teaches", believe: "believes", earn: "earns",
  manage: "manages", run: "runs", travel: "travels", cost: "costs", mean: "means", spend: "spends",
};

const IRREGULAR_BASE: Record<string, string> = {
  went: "go", saw: "see", came: "come", ate: "eat", took: "take", made: "make", bought: "buy",
  got: "get", had: "have", said: "say", told: "tell", wrote: "write", gave: "give", knew: "know",
  thought: "think", found: "find", left: "leave", met: "meet", paid: "pay", sent: "send",
  spoke: "speak", began: "begin", drank: "drink", drove: "drive", ran: "run", was: "be", were: "be",
  did: "do", lost: "lose", sold: "sell", felt: "feel", brought: "bring", understood: "understand",
};

const SUPERLATIVE: Record<string, string> = {
  big: "biggest", good: "best", bad: "worst", small: "smallest", easy: "easiest", cheap: "cheapest",
  fast: "fastest", tall: "tallest", long: "longest", old: "oldest", young: "youngest", nice: "nicest",
  hard: "hardest", large: "largest", high: "highest", great: "greatest", happy: "happiest", busy: "busiest",
};

const COMPARATIVE: Record<string, string> = {
  big: "bigger", small: "smaller", cheap: "cheaper", fast: "faster", tall: "taller", long: "longer",
  old: "older", young: "younger", nice: "nicer", hard: "harder", large: "larger", high: "higher",
  easy: "easier", happy: "happier", busy: "busier", good: "better", bad: "worse", great: "greater",
};

const UNCOUNTABLE_PLURAL: Record<string, string> = {
  informations: "information", advices: "advice", furnitures: "furniture", equipments: "equipment",
  feedbacks: "feedback", knowledges: "knowledge", homeworks: "homework", researches: "research",
  evidences: "evidence", luggages: "luggage", softwares: "software",
};

const NUM = "(?:\\d+|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|several|many|a few)";

const AN_EXCEPTIONS = /^(uni|use|usu|uti|eu|one|once|ur)/;
const SILENT_H = /^(hour|honest|honou?r|heir)/;

function keepCase(original: string, replacement: string): string {
  return /^[A-Z]/.test(original) ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
}

const BE_FOR: Record<string, string> = { i: "am", you: "are", we: "are", they: "are", he: "is", she: "is" };

const RULES: Rule[] = [
  {
    id: "be-agree",
    re: /\b(i'm|i am|you're|you are|we're|we are|they're|they are|he's|he is|she's|she is) (totally |completely |not )?agree\b/gi,
    message: "« agree » est un verbe, pas un adjectif : on dit « I agree » / « I don't agree », jamais « I am agree ».",
    fix: (m) => {
      const subj = m[1].toLowerCase().split(/'| /)[0];
      const neg = (m[2] ?? "").trim() === "not";
      const adv = !neg && m[2] ? m[2] : "";
      const third = subj === "he" || subj === "she";
      const verb = neg ? (third ? "doesn't agree" : "don't agree") : third ? "agrees" : "agree";
      return keepCase(m[1], `${subj === "i" ? "I" : subj} ${adv}${verb}`);
    },
  },
  {
    id: "have-years",
    re: /\b(i|you|we|they|he|she) (have|has) (\d+) years( old)?\b/gi,
    message: "L'âge se dit avec « be » : « I am 30 (years old) », pas « I have 30 years ».",
    fix: (m) => keepCase(m[1], `${m[1].toLowerCase() === "i" ? "I" : m[1]} ${BE_FOR[m[1].toLowerCase()]} ${m[3]} years old`),
  },
  {
    id: "since-duration",
    re: new RegExp(`\\bsince (${NUM}) (years?|months?|weeks?|days?|hours?|minutes?)\\b`, "gi"),
    message: "« since » + point de départ (since 2020, since Monday) ; « for » + durée (for three years).",
    fix: (m) => `for ${m[1]} ${m[2]}`,
  },
  {
    id: "during-duration",
    re: new RegExp(`\\bduring (${NUM}) (years|months|weeks|days|hours)\\b`, "gi"),
    message: "Pour une durée chiffrée, on utilise « for » : « for three years ». « during » s'emploie avec un nom : during the meeting.",
    fix: (m) => `for ${m[1]} ${m[2]}`,
  },
  {
    id: "uncountable-plural",
    re: new RegExp(`\\b(${Object.keys(UNCOUNTABLE_PLURAL).join("|")})\\b`, "gi"),
    message: "Ce nom est indénombrable en anglais : il ne prend jamais de « s » (some information, a piece of advice).",
    fix: (m) => keepCase(m[1], UNCOUNTABLE_PLURAL[m[1].toLowerCase()]),
  },
  {
    id: "a-uncountable",
    re: /\b(an? )(information|advice|furniture|equipment|homework|knowledge|luggage)\b/gi,
    message: "Nom indénombrable : pas de « a/an ». Dites « some advice » ou « a piece of advice ».",
    fix: (m) => `a piece of ${m[2]}`,
  },
  {
    id: "third-dont",
    re: /\b(he|she|it) don't\b/gi,
    message: "À la 3e personne du singulier, la négation se fait avec « doesn't ».",
    fix: (m) => `${m[1]} doesn't`,
  },
  {
    id: "third-person-s",
    re: new RegExp(`${AUX_BEFORE}\\b(he|she|it) (${Object.keys(THIRD_PERSON).join("|")})\\b`, "gi"),
    message: "Present simple : à la 3e personne du singulier (he, she, it), le verbe prend un « s ».",
    fix: (m) => `${m[1]} ${THIRD_PERSON[m[2].toLowerCase()]}`,
  },
  {
    id: "you-we-they-was",
    re: /\b(you|we|they) was\b/gi,
    message: "Au passé, « be » donne « were » avec you, we et they.",
    fix: (m) => `${m[1]} were`,
  },
  {
    id: "plural-subject-singular-verb",
    re: /\b(i|you|we|they) (is|has|does|doesn't|goes|wants|likes|needs)\b/gi,
    message: "Accord sujet-verbe : pas de forme en « s » avec I, you, we, they.",
    fix: (m) => {
      const map: Record<string, string> = { is: m[1].toLowerCase() === "i" ? "am" : "are", has: "have", does: "do", "doesn't": "don't", goes: "go", wants: "want", likes: "like", needs: "need" };
      return `${m[1]} ${map[m[2].toLowerCase()]}`;
    },
  },
  {
    id: "people-is",
    re: /\bpeople (is|has|was|doesn't|does)\b/gi,
    message: "« people » est pluriel : people are, people have, people were.",
    fix: (m) => {
      const map: Record<string, string> = { is: "are", has: "have", was: "were", "doesn't": "don't", does: "do" };
      return `people ${map[m[1].toLowerCase()]}`;
    },
  },
  {
    id: "more-comparative",
    re: /\bmore (better|worse|bigger|smaller|easier|cheaper|faster|older|younger|happier)\b/gi,
    message: "Double comparatif : « better » est déjà un comparatif, on ne dit pas « more better ».",
    fix: (m) => m[1],
  },
  {
    id: "more-short-adj",
    re: new RegExp(`\\bmore (${Object.keys(COMPARATIVE).join("|")}) than\\b`, "gi"),
    message: "Adjectif court : comparatif en -er (bigger than), pas « more big than ».",
    fix: (m) => `${COMPARATIVE[m[1].toLowerCase()]} than`,
  },
  {
    id: "most-short-adj",
    re: new RegExp(`\\bthe most (${Object.keys(SUPERLATIVE).join("|")})\\b`, "gi"),
    message: "Adjectif court : superlatif en -est (the biggest), pas « the most big ».",
    fix: (m) => `the ${SUPERLATIVE[m[1].toLowerCase()]}`,
  },
  {
    id: "modal-to",
    re: /\b(can|could|must|should|might|may|will|would) to (\w+)/gi,
    message: "Après un modal (can, must, should…), le verbe s'emploie sans « to ».",
    fix: (m) => `${m[1]} ${m[2]}`,
  },
  {
    id: "did-past",
    re: new RegExp(`\\b(did|didn't|did not)((?: (?:i|you|he|she|it|we|they))?) (${Object.keys(IRREGULAR_BASE).join("|")})\\b`, "gi"),
    message: "Après « did / didn't », le verbe reste à la base verbale : « Did you go? », « I didn't see ».",
    fix: (m) => `${m[1]}${m[2]} ${IRREGULAR_BASE[m[3].toLowerCase()]}`,
  },
  {
    id: "did-ed",
    re: /\b(did|didn't|did not)((?: (?:i|you|he|she|it|we|they))?) (\w{3,}ed)\b/gi,
    message: "Après « did / didn't », pas de -ed : le verbe reste à la base verbale.",
    fix: (m) => `${m[1]}${m[2]} ${m[3].replace(/ed$/i, "").replace(/(.)\1$/, "$1")}`,
  },
  {
    id: "explain-me",
    re: /\bexplain(s|ed|ing)? (me|him|her|us|them)\b/gi,
    message: "« explain » se construit avec « to » : explain something to me / explain to me how…",
    fix: (m) => `explain${m[1] ?? ""} to ${m[2]}`,
  },
  {
    id: "depend-of",
    re: /\bdepend(s|ed|ing)? of\b/gi,
    message: "On dit « depend on », pas « depend of ».",
    fix: (m) => `depend${m[1] ?? ""} on`,
  },
  {
    id: "listen-to",
    re: /\blisten(s|ed|ing)? (music|the radio|the music|me|him|her|them|us|my|his|your|the teacher|podcasts?)\b/gi,
    message: "« listen » se construit avec « to » : listen to music, listen to me.",
    fix: (m) => `listen${m[1] ?? ""} to ${m[2]}`,
  },
  {
    id: "to-home",
    re: /\b(go|goes|went|going|come|comes|came|coming|get|got|arrive|arrived) to home\b/gi,
    message: "Pas de « to » devant « home » : go home, get home.",
    fix: (m) => `${m[1]} home`,
  },
  {
    id: "make-photo",
    re: /\b(make|makes|made|making) (a|some|many|lots of) (photos?|pictures?)\b/gi,
    message: "On « prend » une photo : take a photo / take pictures.",
    fix: (m) => {
      const t: Record<string, string> = { make: "take", makes: "takes", made: "took", making: "taking" };
      return `${t[m[1].toLowerCase()]} ${m[2]} ${m[3]}`;
    },
  },
  {
    id: "do-mistake",
    re: /\b(do|does|did|doing|done) (a|many|some|lots of|a lot of|no) (mistakes?)\b/gi,
    message: "On « fait » une erreur avec « make » : make a mistake.",
    fix: (m) => {
      const t: Record<string, string> = { do: "make", does: "makes", did: "made", doing: "making", done: "made" };
      return `${t[m[1].toLowerCase()]} ${m[2]} ${m[3]}`;
    },
  },
  {
    id: "make-sport",
    re: /\b(make|makes|made|making) (sport|sports|homework|exercise|yoga)\b/gi,
    message: "Avec le sport et les devoirs, on utilise « do » : do sport, do homework, do exercise.",
    fix: (m) => {
      const t: Record<string, string> = { make: "do", makes: "does", made: "did", making: "doing" };
      return `${t[m[1].toLowerCase()]} ${m[2]}`;
    },
  },
  {
    id: "generic-the",
    re: /(^|[.!?]\s+)(the) (life|nature|society|money|love|happiness|unemployment|education|technology|work) (is|was|can|has|makes|seems)\b/gi,
    message: "Pour une idée générale, pas d'article en anglais : « Life is… », « Money can't buy… ».",
    fix: (m) => `${m[1]}${keepCase(m[2], m[3])} ${m[4]}`,
  },
  {
    id: "if-will",
    re: /\bif (i|you|he|she|we|they|it) will\b/gi,
    message: "Après « if » (condition), on n'emploie pas « will » : « If it rains, I'll stay » (présent après if).",
  },
  {
    id: "a-an-vowel",
    re: /\b([aA]) ([aeiouAEIOU][a-z]+)\b/g,
    message: "Devant un son voyelle, « a » devient « an » : an apple, an idea, an hour.",
    fix: (m) => `${m[1] === "A" ? "An" : "an"} ${m[2]}`,
  },
  {
    id: "a-silent-h",
    re: /\b(a) (hour|hours|honest|honour|honor)\b/gi,
    message: "Le « h » de hour / honest ne se prononce pas : on dit « an hour ».",
    fix: (m) => `${keepCase(m[1], "an")} ${m[2]}`,
  },
  {
    id: "an-consonant",
    re: /\b([aA]n) ([b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z][a-z]+|uni\w*|use\w*|usu\w*|euro\w*|one)\b/g,
    message: "Devant un son consonne, on écrit « a » : a book, a university, a useful tool.",
    fix: (m) => `${m[1] === "An" ? "A" : "a"} ${m[2]}`,
  },
  {
    id: "present-since",
    re: /\b(i am|i'm|i live|i work|i know|we are|we live|we work|he is|she is|he lives|she works|he works|she lives) [^.?!]{0,30}?\bsince\b/gi,
    message: "Action commencée dans le passé et toujours vraie : present perfect avec since/for (« I have lived here since 2019 », « I have known him for years »).",
  },
  {
    id: "perfect-finished-time",
    re: /\b(have|has|'ve) (\w+ed|been|gone|seen|done|made|had|eaten|bought|met|visited|lost|found) [^.?!]{0,30}?\b(yesterday|last (?:week|month|year|night|summer|weekend)|ago|in (?:19|20)\d\d)\b/gi,
    message: "Avec un moment passé précis (yesterday, last year, ago), on emploie le past simple, pas le present perfect.",
  },
  {
    id: "there-is-plural",
    re: /\bthere is (many|several|two|three|four|five|lots of|a lot of)\b/gi,
    message: "Avec un pluriel : « there are » (there are many people).",
    fix: (m) => `there are ${m[1]}`,
  },
  {
    id: "am-born",
    re: /\b(i am|i'm) born\b/gi,
    message: "La naissance se dit au passé : « I was born in… ».",
    fix: () => "I was born",
  },
  {
    id: "say-me",
    re: /\b(say|says|said) (me|him|her|us|them)\b/gi,
    message: "« say » ne prend pas de complément de personne direct : « tell me » ou « say to me ».",
    fix: (m) => {
      const t: Record<string, string> = { say: "tell", says: "tells", said: "told" };
      return `${t[m[1].toLowerCase()]} ${m[2]}`;
    },
  },
  {
    id: "discuss-about",
    re: /\b(discuss|discussed|discussing|discusses) about\b/gi,
    message: "« discuss » est transitif : discuss the project (sans « about »). Mais : talk about the project.",
    fix: (m) => m[1],
  },
  {
    id: "married-with",
    re: /\bmarried with\b/gi,
    message: "On est marié « à » quelqu'un : married to someone.",
    fix: () => "married to",
  },
  {
    id: "arrive-to",
    re: /\b(arrive|arrives|arrived|arriving) to\b/gi,
    message: "« arrive » se construit avec « in » (ville, pays) ou « at » (lieu précis), jamais « to ».",
    fix: (m) => `${m[1]} at`,
  },
  {
    id: "look-forward",
    re: /\b(look|looks|looking|looked) forward to (see|meet|hear|work|talk|speak|visit|receive|discuss)\b/gi,
    message: "Dans « look forward to », « to » est une préposition : suivi d'un verbe en -ing (looking forward to meeting you).",
    fix: (m) => `${m[1]} forward to ${m[2].replace(/e$/, "")}ing`.replace("seing", "seeing"),
  },
  {
    id: "much-countable",
    re: /\bmuch (people|friends|cars|things|books|questions|problems|ideas|clients|customers|countries)\b/gi,
    message: "Avec un nom dénombrable pluriel : « many » (many people), « much » pour l'indénombrable (much time).",
    fix: (m) => `many ${m[1]}`,
  },
  {
    id: "less-countable",
    re: /\bless (people|cars|things|questions|mistakes|problems|clients|customers|hours)\b/gi,
    message: "Avec un nom dénombrable : « fewer » (fewer mistakes). « less » s'emploie avec l'indénombrable (less time).",
    fix: (m) => `fewer ${m[1]}`,
  },
  {
    id: "want-that",
    re: /\b(want|wants|wanted|would like) that (you|he|she|they|we|him|her|them|us)\b/gi,
    message: "Calque du français : « I want you to come », pas « I want that you come ».",
  },
  {
    id: "how-many-time",
    re: /\bhow many time\b/gi,
    message: "« how much time » (combien de temps) ou « how many times » (combien de fois).",
    fix: () => "how much time",
  },
  {
    id: "what-means",
    re: /\bwhat means\b/gi,
    message: "Question avec « mean » : « What does it mean? » / « What does this word mean? ».",
  },
  {
    id: "like-very-much",
    re: /\b(like|love|enjoy) very much (\w+)/gi,
    message: "Ordre des mots : le complément suit directement le verbe (« I like football very much » ou « I really like football »).",
  },
  {
    id: "lowercase-i",
    re: /(^|[\s(])i(?=[\s',.!?]|$)/g,
    message: "Le pronom « I » s'écrit toujours en majuscule.",
    fix: (m) => `${m[1]}I`,
  },
  {
    id: "actual-false-friend",
    re: /\b(actual|actually) (situation|price|job|president|context|moment|period)\b/gi,
    message: "Faux ami : « actual » = réel ; « actuel » se dit « current » (the current situation).",
    fix: (m) => `current ${m[2]}`,
  },
  {
    id: "eventually-false-friend",
    re: /\beventually (we|i|you|they|it) (could|might|may)\b/gi,
    message: "Faux ami : « eventually » = finalement. « Éventuellement » se dit « possibly » ou « perhaps ».",
    fix: (m) => `possibly ${m[1]} ${m[2]}`,
  },
];

export function checkText(text: string): Issue[] {
  const issues: Issue[] = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.re.exec(text))) {
      if (rule.id === "a-an-vowel" && AN_EXCEPTIONS.test(m[2].toLowerCase())) continue;
      if (rule.id === "an-consonant" && SILENT_H.test(m[2].toLowerCase())) continue;
      // Ignore « an » / « a » qui ne sont pas des articles (ex. lettres isolées).
      const start = m.index + (rule.id === "lowercase-i" || rule.id === "generic-the" ? m[1].length : 0);
      const found = m[0].slice(start - m.index);
      const suggestionRaw = rule.fix?.(m);
      let suggestion = suggestionRaw !== undefined ? suggestionRaw.slice(start - m.index) : undefined;
      if (suggestion && /^[A-Z]/.test(found) && /^[a-z]/.test(suggestion)) suggestion = suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
      if (suggestion !== undefined && suggestion === found) continue;
      if (issues.some((i) => start < i.end && start + found.length > i.start)) continue;
      issues.push({ id: rule.id, start, end: start + found.length, found, suggestion, message: rule.message });
      if (m[0].length === 0) rule.re.lastIndex++;
    }
  }
  return issues.sort((a, b) => a.start - b.start);
}

/** Applique les corrections automatiques disponibles. */
export function correctText(text: string, issues = checkText(text)): string {
  let out = "";
  let pos = 0;
  for (const i of issues) {
    if (i.suggestion === undefined) continue;
    out += text.slice(pos, i.start) + i.suggestion;
    pos = i.end;
  }
  return out + text.slice(pos);
}
