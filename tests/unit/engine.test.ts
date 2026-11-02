import { describe, expect, it } from "vitest";
import { checkText, correctText } from "@/lib/checker";
import { matchAnswer, wordOverlap, lemmaCandidates } from "@/lib/text";
import { newCard, review, isDue, isMastered, cardMode } from "@/lib/srs";
import { evaluateText, evaluateAnswer } from "@/lib/evaluate";
import { parseAiReply } from "@/lib/tutor";

describe("correction des réponses", () => {
  it("accepte contractions et ponctuation", () => {
    expect(matchAnswer("I'm working from home this week.", ["I am working from home this week"]).status).toBe("correct");
    expect(matchAnswer("i dont like coffee", ["don't like"]).status).toBe("wrong");
    expect(matchAnswer("don't like", ["don't like|do not like".split("|")[1]]).status).toBe("correct");
  });
  it("tolère une faute de frappe sur un mot long, pas une erreur grammaticale", () => {
    expect(matchAnswer("I have lived in Bordaux for three years", ["I have lived in Bordeaux for three years"]).status).toBe("typo");
    expect(matchAnswer("He work in a bank", ["He works in a bank"]).status).toBe("wrong");
    expect(matchAnswer("She play", ["She plays"]).status).toBe("wrong");
  });
  it("signale les accents oubliés en français", () => {
    expect(matchAnswer("Il ne m'a pas dit la verite", ["Il ne m'a pas dit la vérité"], "fr").status).toBe("accent");
  });
});

describe("détecteur d'erreurs des francophones", () => {
  const cases: [string, string, string][] = [
    ["I am agree with you.", "be-agree", "I agree with you."],
    ["I have 30 years.", "have-years", "I am 30 years old."],
    ["I live here since 3 years.", "since-duration", "for 3 years"],
    ["He work in London.", "third-person-s", "He works in London."],
    ["She don't like it.", "third-dont", "She doesn't like it."],
    ["I need some informations.", "uncountable-plural", "some information"],
    ["It is more cheap than the train.", "more-short-adj", "cheaper than"],
    ["You must to go.", "modal-to", "You must go."],
    ["Did you went there?", "did-past", "Did you go there?"],
    ["Can you explain me this?", "explain-me", "explain to me"],
    ["It depends of the price.", "depend-of", "depends on"],
    ["I listen music every day.", "listen-to", "listen to music"],
    ["We discussed about the budget.", "discuss-about", "We discussed the budget."],
    ["I'm looking forward to see you.", "look-forward", "looking forward to seeing you"],
    ["There is many people.", "there-is-plural", "There are many people."],
    ["I want an university degree.", "an-consonant", "a university"],
    ["It takes a hour.", "a-silent-h", "an hour"],
    ["I did a mistake.", "do-mistake", "made a mistake"],
    ["People is happy.", "people-is", "People are happy."],
  ];
  for (const [input, rule, expected] of cases) {
    it(`${rule} : ${input}`, () => {
      const issues = checkText(input);
      expect(issues.map((i) => i.id)).toContain(rule);
      expect(correctText(input, issues)).toContain(expected);
    });
  }
  it("ne signale rien sur des phrases correctes", () => {
    for (const ok of [
      "Does she have a car?", "I have lived here since 2019.", "If I were you, I would accept.", "She works in a bank and he doesn't.",
      "Let it go.", "Can it work?", "I made it work.", "A university in Europe.", "An hour later, an honest man arrived.",
      "He has been working here for ten years.", "I agree with you.", "They were happy.", "I was born in 1990.",
    ]) expect(checkText(ok), ok).toEqual([]);
  });
});

describe("répétition espacée", () => {
  const t0 = new Date("2026-03-02T10:00:00").getTime();
  it("fait progresser une carte jusqu'à la maîtrise", () => {
    let c = newCard("word", "x", t0);
    c = review(c, 3, t0);
    expect(c.state).toBe("learning");
    c = review(c, 3, t0 + 600_000);
    expect(c.state).toBe("review");
    expect(c.interval).toBe(1);
    let t = c.due;
    for (let i = 0; i < 5; i++) { c = review(c, 3, t); t = c.due; }
    expect(c.interval).toBeGreaterThanOrEqual(21);
    expect(isMastered(c)).toBe(true);
  });
  it("un oubli réduit l'intervalle et la facilité", () => {
    let c = newCard("word", "y", t0);
    c = review(c, 4, t0);
    c = review(c, 3, c.due);
    const before = c.interval;
    const ease = c.ease;
    c = review(c, 1, c.due);
    expect(c.state).toBe("relearning");
    expect(c.lapses).toBe(1);
    expect(c.ease).toBeLessThan(ease);
    c = review(c, 3, c.due);
    expect(c.interval).toBeLessThanOrEqual(before);
  });
  it("une carte en apprentissage revient vite", () => {
    let c = newCard("word", "z", t0);
    c = review(c, 1, t0);
    expect(isDue(c, t0 + 60_000)).toBe(true);
  });
  it("passe de la reconnaissance à la production", () => {
    let c = newCard("word", "w", t0);
    expect(cardMode(c)).toBe("recognize");
    c = review(c, 3, t0);
    expect(cardMode(c)).toBe("choice");
    c = review(c, 3, t0 + 600_000);
    expect(["produce", "cloze", "listen"]).toContain(cardMode(c));
  });
});

describe("évaluations sans IA", () => {
  it("note un texte selon la consigne", () => {
    const good = evaluateText("In my opinion, remote work is positive because it saves time. However, it can be lonely. Moreover, some people work better at home. To sum up, a mix is ideal.", { minWords: 30, checklist: [{ label: "Opinion", any: ["in my opinion"] }, { label: "Opposition", any: ["however"] }] });
    const bad = evaluateText("I am agree. Is good.", { minWords: 30, checklist: [{ label: "Opinion", any: ["in my opinion"] }] });
    expect(good.score).toBeGreaterThan(bad.score + 30);
    expect(bad.issues.length).toBeGreaterThan(0);
  });
  it("évalue la pertinence d'une réponse orale", () => {
    const r = evaluateAnswer("I'd like a glass of water, please.", [["like", "have", "could"]], 4);
    expect(r.relevant).toBe(true);
    expect(evaluateAnswer("Yes.", [["book", "reserve"]], 5).tooShort).toBe(true);
  });
  it("compare la prononciation mot à mot", () => {
    expect(wordOverlap("I think there are three things", "I think there are three things").score).toBe(100);
    expect(wordOverlap("I think there are three things", "I sink there are tree things").score).toBeLessThan(80);
  });
  it("lemmatise pour le dictionnaire", () => {
    expect(lemmaCandidates("studies")).toContain("study");
    expect(lemmaCandidates("running")).toContain("run");
    expect(lemmaCandidates("delayed")).toContain("delay");
  });
  it("lit la réponse structurée de l'IA", () => {
    const p = parseAiReply("Nice! Where did you go?\nCORRECTION: I went to London last year.\nEXPLICATION: Past simple avec last year.");
    expect(p.reply).toBe("Nice! Where did you go?");
    expect(p.correction).toBe("I went to London last year.");
    expect(parseAiReply("Great.\nCORRECTION: OK\nEXPLICATION: Aucune erreur.").correction).toBeUndefined();
  });
});
