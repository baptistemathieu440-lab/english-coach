import type { Article, McqExercise } from "./types";

type Q = [string, string[], number, string];
interface Def extends Omit<Article, "questions"> {
  questions: Q[];
}

export function article(d: Def): Article {
  return {
    ...d,
    questions: d.questions.map(([prompt, options, answer, explanation], i): McqExercise => ({ id: `${d.id}-q${i + 1}`, kind: "mcq", prompt, options, answer, explanation })),
  };
}

/**
 * Textes originaux rédigés pour l'application. Ils traitent de sujets d'actualité
 * de façon générale et pédagogique ; les personnes et entreprises citées sont fictives.
 */
export const ARTICLES: Article[] = [
  article({
    id: "four-day-week", title: "Is the four-day week the future?", level: "A2", category: "Société",
    intro: "Un texte court sur la semaine de quatre jours, ses avantages et ses limites.",
    paragraphs: [
      "In many countries, companies are testing a four-day working week. Employees work four days instead of five, but they usually get the same salary.",
      "Supporters say that people are happier and less tired. They have more time for their family, sport or hobbies. Some managers also say their teams are more focused, because they know they have less time.",
      "But the idea doesn't work for every job. Hospitals, shops and restaurants need staff every day. For these businesses, a four-day week often means hiring more people, and that costs money.",
      "So, is it the future? Maybe for some offices. For many other jobs, it will probably stay a dream for now.",
    ],
    glossary: [{ term: "instead of", fr: "au lieu de" }, { term: "supporters", fr: "partisans" }, { term: "focused", fr: "concentré" }, { term: "hiring", fr: "embaucher" }],
    questions: [
      ["In a four-day week, employees usually…", ["earn less money", "get the same salary", "work longer hours"], 1, "« they usually get the same salary »."],
      ["Why are some teams more focused?", ["They have more breaks", "They know they have less time", "They work from home"], 1, "« because they know they have less time »."],
      ["Why is it difficult for hospitals and shops?", ["They need staff every day", "Their employees don't want it", "It's illegal"], 0, "« need staff every day »."],
      ["What is the writer's conclusion?", ["It will soon be everywhere", "It may work for some offices but not for all jobs", "It is a bad idea"], 1, "« Maybe for some offices… a dream for now »."],
    ],
    summaryPrompt: "Write 2–3 sentences: what is the four-day week, one advantage and one problem.",
  }),
  article({
    id: "second-hand-clothes", title: "Why second-hand clothes are popular", level: "A2", category: "Business",
    intro: "Pourquoi les vêtements d'occasion séduisent de plus en plus.",
    paragraphs: [
      "A few years ago, many people thought second-hand clothes were only for students with no money. Today, buying used clothes is normal, and even fashionable.",
      "There are three main reasons. First, it's cheaper: you can find a good jacket for a quarter of the original price. Second, it's better for the planet, because making new clothes uses a lot of water and energy. Third, apps make it very easy to sell and buy from your phone.",
      "Some big fashion brands now have their own second-hand sections. They know that young customers care about the environment.",
      "However, there is a problem. Some people buy more clothes than before, because they are cheap. If you buy too much, even second-hand shopping isn't very green.",
    ],
    glossary: [{ term: "second-hand / used", fr: "d'occasion" }, { term: "fashionable", fr: "à la mode" }, { term: "a quarter", fr: "un quart" }, { term: "care about", fr: "se soucier de" }],
    questions: [
      ["How did people see second-hand clothes in the past?", ["As expensive", "As only for students with no money", "As very fashionable"], 1, "« only for students with no money »."],
      ["Which is NOT a reason given in the text?", ["Price", "The environment", "Better quality"], 2, "Les trois raisons : prix, planète, applications."],
      ["Why do big brands sell second-hand clothes?", ["Young customers care about the environment", "It's cheaper for them", "The law says so"], 0, "« young customers care about the environment »."],
      ["What problem does the writer mention?", ["Apps are difficult", "Some people buy too much", "Clothes are dirty"], 1, "« Some people buy more clothes than before »."],
    ],
    summaryPrompt: "Write 3 sentences: why second-hand clothes are popular and what the problem is.",
  }),
  article({
    id: "city-bikes", title: "A morning with a bike courier", level: "A2", category: "Société",
    intro: "Portrait (fictif) d'une coursière à vélo dans une grande ville.",
    paragraphs: [
      "Lena is 26 and she works as a bike courier in the city centre. She starts at seven every morning and cycles about sixty kilometres a day.",
      "\"I love being outside,\" she says. \"I don't want to sit in an office all day.\" She delivers documents, food and sometimes flowers.",
      "The job is not easy. In winter it's cold and wet, and the traffic can be dangerous. She always wears a helmet and bright clothes.",
      "Lena doesn't want to do this job forever. She is saving money because she wants to open a small bike repair shop next year.",
    ],
    glossary: [{ term: "courier", fr: "coursier" }, { term: "deliver", fr: "livrer" }, { term: "helmet", fr: "casque" }, { term: "bright", fr: "voyant, vif" }],
    questions: [
      ["How far does Lena cycle each day?", ["About 16 km", "About 60 km", "About 100 km"], 1, "« about sixty kilometres a day »."],
      ["Why does she like her job?", ["The salary", "Being outside", "Her colleagues"], 1, "« I love being outside »."],
      ["What does she do to stay safe?", ["She cycles slowly", "She wears a helmet and bright clothes", "She only works in summer"], 1, "Casque et vêtements voyants."],
      ["What is her plan?", ["To work in an office", "To open a bike repair shop", "To move abroad"], 1, "« open a small bike repair shop »."],
    ],
    summaryPrompt: "Present Lena in 3 sentences (job, difficulties, plans).",
  }),
  article({
    id: "smartphone-sleep", title: "Your phone and your sleep", level: "A2", category: "Technologie",
    intro: "Quelques conseils simples sur le téléphone et le sommeil.",
    paragraphs: [
      "Many of us check our phone in bed before we go to sleep. It feels relaxing, but sleep specialists often say it's not a good habit.",
      "One reason is the light from screens, which can make your brain think it is still daytime. Another reason is the content: an exciting video or a stressful work email can keep you awake.",
      "Here are some simple ideas. Stop using screens thirty minutes before bed. Keep your phone outside the bedroom and use a normal alarm clock. Read a paper book instead.",
      "You don't need to change everything at once. Try one idea for a week and see if you sleep better.",
    ],
    glossary: [{ term: "habit", fr: "habitude" }, { term: "keep you awake", fr: "vous empêcher de dormir" }, { term: "alarm clock", fr: "réveil" }, { term: "at once", fr: "d'un coup" }],
    questions: [
      ["What do sleep specialists often say?", ["Phones help you sleep", "Using your phone in bed is not a good habit", "You should sleep with your phone"], 1, "« it's not a good habit »."],
      ["Which two reasons are given?", ["Noise and price", "Light and content", "Battery and size"], 1, "La lumière et le contenu."],
      ["What does the writer suggest?", ["Buying a new phone", "Stopping screens 30 minutes before bed", "Sleeping less"], 1, "« Stop using screens thirty minutes before bed »."],
      ["What is the final advice?", ["Change everything today", "Try one idea for a week", "See a doctor"], 1, "« Try one idea for a week »."],
    ],
    summaryPrompt: "Write 2–3 sentences of advice for a friend who sleeps badly.",
  }),

  /* ---------- B1 ---------- */
  article({
    id: "small-bakery", title: "How a small bakery survived rising costs", level: "B1", category: "Entrepreneuriat",
    intro: "L'histoire (fictive) d'une boulangerie face à la hausse des coûts.",
    paragraphs: [
      "When energy prices went up sharply, Marta Ruiz, who runs a small bakery, saw her electricity bill nearly double in a few months. \"For a while, I honestly thought I would have to close,\" she says.",
      "Instead of raising all her prices, Marta looked carefully at her costs. She realised that her old ovens were using far more energy than modern ones. With a bank loan, she replaced two of them, which reduced her energy use by about a quarter.",
      "She also changed her opening hours. The bakery now closes on Monday, which was always the quietest day, and opens earlier on weekends, when demand is highest.",
      "Finally, she started selling bread to three local restaurants. These regular orders give her a more stable income, even when fewer customers come into the shop.",
      "\"The lesson,\" she explains, \"is that you can't control the economy, but you can control how you react to it.\"",
    ],
    glossary: [{ term: "sharply", fr: "fortement" }, { term: "run (a business)", fr: "diriger, tenir" }, { term: "oven", fr: "four" }, { term: "loan", fr: "prêt" }, { term: "income", fr: "revenu" }],
    questions: [
      ["What problem did Marta face?", ["Fewer customers", "Her electricity bill almost doubled", "Her staff left"], 1, "« electricity bill nearly double »."],
      ["How did she reduce energy use?", ["She baked less bread", "She replaced old ovens", "She moved to a new shop"], 1, "Elle a remplacé deux fours."],
      ["Why does the bakery now close on Mondays?", ["It was the quietest day", "Marta needs a rest", "Energy is more expensive on Mondays"], 0, "« always the quietest day »."],
      ["Why are the restaurant orders important?", ["They are very profitable", "They give a more stable income", "They are good publicity"], 1, "« a more stable income »."],
      ["What is Marta's main lesson?", ["Always raise prices", "You can control your reaction, not the economy", "Small shops can't survive"], 1, "Dernière citation."],
    ],
    summaryPrompt: "Summarise the three things Marta did and why (4–5 sentences, use 'first', 'then', 'finally').",
  }),
  article({
    id: "learning-languages-adults", title: "Is it too late to learn a language as an adult?", level: "B1", category: "Société",
    intro: "Ce que l'on sait de l'apprentissage des langues à l'âge adulte.",
    paragraphs: [
      "Many adults believe that it's too late to learn a new language. They often say that children are like sponges, while adults find it much harder.",
      "It is true that children who grow up with a language usually develop a more native-like accent. However, adults have several advantages. They can understand grammar rules, use learning strategies and connect new words to what they already know.",
      "The biggest difference is often time and exposure. A child hears a language for many hours every day. An adult with a job and a family might study for twenty minutes, twice a week.",
      "Research on memory suggests that short, regular sessions work better than long, occasional ones. Reviewing words just before you forget them, a method called spaced repetition, is particularly effective.",
      "So it isn't too late. Adults may never sound exactly like native speakers, but they can certainly become confident, effective communicators.",
    ],
    glossary: [{ term: "sponge", fr: "éponge" }, { term: "native-like", fr: "proche d'un natif" }, { term: "exposure", fr: "exposition (à la langue)" }, { term: "occasional", fr: "occasionnel" }, { term: "spaced repetition", fr: "répétition espacée" }],
    questions: [
      ["What advantage do children have?", ["They understand grammar rules", "They usually develop a more native-like accent", "They study more efficiently"], 1, "« a more native-like accent »."],
      ["Which is an advantage of adults?", ["They hear the language all day", "They can use learning strategies", "They never forget words"], 1, "« use learning strategies »."],
      ["According to the text, what is often the biggest difference?", ["Intelligence", "Time and exposure", "Motivation"], 1, "« The biggest difference is often time and exposure »."],
      ["What kind of study sessions work better?", ["Long and occasional", "Short and regular", "Only at weekends"], 1, "« short, regular sessions »."],
      ["What is the writer's conclusion?", ["Adults can become confident communicators", "Adults should not try", "Only children can be bilingual"], 0, "Dernière phrase."],
    ],
    summaryPrompt: "Explain in 4 sentences why adults can still learn a language effectively.",
  }),
  article({
    id: "inflation-explained", title: "Inflation explained simply", level: "B1", category: "Économie",
    intro: "Une explication pédagogique de l'inflation et de ses effets.",
    paragraphs: [
      "Inflation means that prices, on average, go up over time. If inflation is three percent a year, something that costs one hundred euros today will cost about one hundred and three euros next year.",
      "A small amount of inflation is considered normal in a growing economy. Many central banks aim for around two percent. Problems start when prices rise much faster than salaries, because people can then afford less.",
      "Inflation can have different causes. Sometimes demand is very strong and businesses raise prices. At other times, the cost of energy or raw materials increases, and companies pass these costs on to customers.",
      "To slow inflation down, central banks usually raise interest rates. Borrowing becomes more expensive, so people and companies spend less, which reduces pressure on prices.",
      "Inflation also affects savings. Money kept in an account with a low interest rate slowly loses its purchasing power.",
    ],
    glossary: [{ term: "on average", fr: "en moyenne" }, { term: "central bank", fr: "banque centrale" }, { term: "pass on", fr: "répercuter" }, { term: "borrowing", fr: "l'emprunt" }, { term: "purchasing power", fr: "pouvoir d'achat" }],
    questions: [
      ["What does inflation mean?", ["Prices go down", "Prices go up on average over time", "Salaries go up"], 1, "Définition du premier paragraphe."],
      ["When does inflation become a problem?", ["When it is around 2%", "When prices rise faster than salaries", "When banks close"], 1, "« rise much faster than salaries »."],
      ["Which is a possible cause of inflation?", ["Higher energy costs", "Lower demand", "Lower interest rates only"], 0, "Coût de l'énergie et des matières premières."],
      ["What do central banks usually do to slow inflation?", ["Print money", "Raise interest rates", "Lower taxes"], 1, "« raise interest rates »."],
      ["How does inflation affect savings with a low interest rate?", ["They lose purchasing power", "They grow faster", "Nothing changes"], 0, "Dernier paragraphe."],
    ],
    summaryPrompt: "Explain inflation to a friend in 4 sentences: definition, causes, solution, effect on savings.",
  }),
  article({
    id: "online-reviews", title: "Can you trust online reviews?", level: "B1", category: "Business",
    intro: "Comment lire les avis en ligne avec un esprit critique.",
    paragraphs: [
      "Before booking a hotel or buying a product, most of us read online reviews. They're useful, but they're not always reliable.",
      "Some reviews are fake: they're written by people who never used the product, sometimes paid by the company or by a competitor. In many countries this practice is illegal, but it still happens.",
      "There are some warning signs. Be careful if a product has hundreds of perfect reviews posted in a few days, or if many reviews use very similar sentences. Extremely emotional reviews, either very positive or very negative, can also be less useful.",
      "Experts suggest reading the three-star and four-star reviews first. They're often more balanced and mention both good and bad points.",
      "Finally, remember that your needs are personal. A hotel that is \"too quiet\" for one guest might be perfect for you.",
    ],
    glossary: [{ term: "reliable", fr: "fiable" }, { term: "fake", fr: "faux" }, { term: "warning signs", fr: "signaux d'alerte" }, { term: "balanced", fr: "équilibré, nuancé" }],
    questions: [
      ["What is a fake review?", ["A review written by someone who never used the product", "A negative review", "A very long review"], 0, "Définition du 2e paragraphe."],
      ["Which is a warning sign?", ["Reviews from different years", "Hundreds of perfect reviews in a few days", "Reviews with photos"], 1, "« hundreds of perfect reviews posted in a few days »."],
      ["Which reviews do experts suggest reading first?", ["Five-star", "One-star", "Three- and four-star"], 2, "« three-star and four-star reviews first »."],
      ["What is the point of the last paragraph?", ["Hotels are too quiet", "Your needs are personal", "Never trust reviews"], 1, "« your needs are personal »."],
    ],
    summaryPrompt: "Give 3 tips to recognise unreliable reviews (one sentence each).",
  }),
  article({
    id: "plastic-free-shop", title: "The rise of zero-waste shops", level: "B1", category: "International",
    intro: "Les épiceries sans emballage, entre succès et défis.",
    paragraphs: [
      "Zero-waste shops, where customers bring their own containers and buy products by weight, have opened in many European cities over the past decade.",
      "Their customers are often motivated by environmental concerns. They want to reduce the amount of plastic packaging they throw away every week.",
      "Running such a shop isn't simple, though. Products must be stored carefully to stay fresh, and shop owners have to explain the system to new customers. Prices can also be higher than in supermarkets, which limits the number of people who shop there regularly.",
      "In response, some large supermarkets have created their own refill sections. This is good news for the environment, but it creates strong competition for small independent shops.",
      "The future of these shops may depend on what supermarkets can't easily offer: advice, local products and a sense of community.",
    ],
    glossary: [{ term: "container", fr: "récipient, contenant" }, { term: "by weight", fr: "au poids" }, { term: "packaging", fr: "emballage" }, { term: "refill", fr: "recharge, vrac" }],
    questions: [
      ["How do zero-waste shops work?", ["Customers bring containers and buy by weight", "Everything is delivered", "Products are free"], 0, "Premier paragraphe."],
      ["What is one difficulty for shop owners?", ["Finding customers who speak English", "Keeping products fresh", "Too many customers"], 1, "« stored carefully to stay fresh »."],
      ["How have supermarkets reacted?", ["They ignored the trend", "They created refill sections", "They bought the small shops"], 1, "« their own refill sections »."],
      ["What might help small shops survive?", ["Lower prices than supermarkets", "Advice, local products and community", "More plastic"], 1, "Dernier paragraphe."],
    ],
    summaryPrompt: "Summarise the advantages and challenges of zero-waste shops in 4 sentences.",
  }),

  /* ---------- B2 ---------- */
  article({
    id: "gig-economy", title: "The gig economy: freedom or insecurity?", level: "B2", category: "Économie",
    intro: "Un texte argumenté sur l'économie des petits boulots via les plateformes.",
    paragraphs: [
      "Over the past fifteen years, digital platforms have made it remarkably easy to earn money through short-term tasks: delivering meals, driving passengers or completing small design jobs. This model is often referred to as the gig economy.",
      "Its supporters emphasise flexibility. Workers can, in theory, choose when and how much they work, which suits students, parents or people looking for extra income alongside another job.",
      "Critics, however, argue that this flexibility comes at a high price. Many gig workers are classified as self-employed, which means they may not be entitled to paid holidays, sick pay or a pension. Moreover, their income can fluctuate considerably from one week to the next, depending on demand and the platform's algorithms.",
      "Several governments and courts have begun to question whether some of these workers should in fact be considered employees. The debate is complex, since reclassifying them could protect workers but also increase costs for platforms and, ultimately, for consumers.",
      "Perhaps the real challenge is to design a system that preserves genuine flexibility while guaranteeing a basic level of protection, whatever form work takes.",
    ],
    glossary: [{ term: "gig", fr: "mission, petit boulot" }, { term: "be entitled to", fr: "avoir droit à" }, { term: "fluctuate", fr: "fluctuer, varier" }, { term: "ultimately", fr: "en fin de compte" }, { term: "genuine", fr: "véritable" }],
    questions: [
      ["What do supporters of the gig economy emphasise?", ["Higher salaries", "Flexibility", "Job security"], 1, "« Its supporters emphasise flexibility »."],
      ["Why may gig workers lack paid holidays?", ["They work too little", "They are often classified as self-employed", "Platforms are illegal"], 1, "« classified as self-employed »."],
      ["What affects their weekly income?", ["Demand and algorithms", "The weather only", "Their age"], 0, "« depending on demand and the platform's algorithms »."],
      ["Why is reclassification a complex issue?", ["It would protect workers but raise costs", "Workers don't want protection", "It is impossible legally"], 0, "Avantage pour les travailleurs, coûts plus élevés."],
      ["What is the writer's position at the end?", ["The gig economy should be banned", "We need flexibility with basic protection", "Nothing should change"], 1, "Dernier paragraphe."],
    ],
    summaryPrompt: "Write a balanced summary (80–100 words) presenting both sides and the writer's conclusion.",
  }),
  article({
    id: "ai-at-work", title: "Will AI take our jobs?", level: "B2", category: "Technologie",
    intro: "Une réflexion nuancée sur l'intelligence artificielle et l'emploi.",
    paragraphs: [
      "Every major technological change has raised the same fear: that machines will replace human workers. Artificial intelligence is no exception, and this time the concern extends to office jobs that were long considered safe.",
      "It is undeniable that some tasks are being automated. Systems can already draft standard emails, summarise documents or answer simple customer questions. Jobs that consist mainly of these tasks are likely to change significantly.",
      "Yet history suggests that technology tends to transform jobs rather than simply eliminate them. Spreadsheets did not make accountants disappear; they changed what accountants spend their time on. Many experts expect a similar pattern, with people focusing more on judgement, relationships and complex problem-solving.",
      "That said, the transition may not be smooth. Workers whose tasks are automated will need training, and not everyone will find it easy to adapt. The speed of change also matters: the faster it happens, the harder it is for education systems to keep up.",
      "The question, then, is not only what AI can do, but how companies and governments choose to manage its introduction.",
    ],
    glossary: [{ term: "no exception", fr: "pas une exception" }, { term: "draft", fr: "rédiger un brouillon" }, { term: "pattern", fr: "schéma, tendance" }, { term: "judgement", fr: "discernement, jugement" }, { term: "keep up", fr: "suivre le rythme" }],
    questions: [
      ["What is new about the fear this time?", ["It concerns factory jobs only", "It extends to office jobs", "Nobody is worried"], 1, "« the concern extends to office jobs »."],
      ["What does the spreadsheet example show?", ["Technology destroys jobs", "Technology transforms jobs", "Accountants disappeared"], 1, "« changed what accountants spend their time on »."],
      ["What will people probably focus on more?", ["Repetitive tasks", "Judgement, relationships and complex problems", "Typing"], 1, "Troisième paragraphe."],
      ["Why might the transition be difficult?", ["Training and adaptation take time", "AI is too expensive", "Workers refuse to change"], 0, "Quatrième paragraphe."],
      ["According to the conclusion, what matters?", ["Only what AI can do", "How companies and governments manage it", "Stopping AI research"], 1, "Dernière phrase."],
    ],
    summaryPrompt: "Do you agree with the writer? Write 100 words giving your opinion with two arguments.",
  }),
  article({
    id: "pitch-mistakes", title: "Five mistakes founders make when pitching", level: "B2", category: "Entrepreneuriat",
    intro: "Conseils pratiques pour présenter un projet à des investisseurs.",
    paragraphs: [
      "Investors listen to dozens of pitches every month, and they often decide within the first few minutes whether a project deserves a closer look. Here are five common mistakes.",
      "First, talking about the product before the problem. Investors need to understand why your solution matters before they can care about how it works. Start with a clear, concrete problem that real customers face.",
      "Second, overestimating the market. Claiming that your target market is \"everyone\" damages your credibility. A precise, well-researched segment is far more convincing.",
      "Third, ignoring competitors. Saying that you have no competition usually suggests that you haven't done your homework, or that there's no real demand.",
      "Fourth, unrealistic financial forecasts. Ambition is welcome, but figures should be backed by assumptions you can explain. Finally, being vague about the money: specify how much you need and exactly how it will be used.",
      "Above all, investors invest in people. Showing that you listen, accept tough questions and learn quickly can matter as much as the slides themselves.",
    ],
    glossary: [{ term: "deserve", fr: "mériter" }, { term: "overestimate", fr: "surestimer" }, { term: "credibility", fr: "crédibilité" }, { term: "backed by", fr: "étayé par" }, { term: "assumptions", fr: "hypothèses" }],
    questions: [
      ["Why should founders start with the problem?", ["It is shorter", "Investors must understand why the solution matters", "Products are boring"], 1, "Deuxième paragraphe."],
      ["Why is saying your market is 'everyone' a mistake?", ["It damages credibility", "It's too small", "It's illegal"], 0, "« damages your credibility »."],
      ["What does claiming 'no competition' suggest?", ["A brilliant idea", "Insufficient research or no demand", "A large market"], 1, "Quatrième paragraphe."],
      ["What should financial forecasts be based on?", ["Hope", "Assumptions you can explain", "Competitors' figures"], 1, "« backed by assumptions you can explain »."],
      ["According to the last paragraph, what do investors invest in?", ["Slides", "People", "Technology"], 1, "« investors invest in people »."],
    ],
    summaryPrompt: "Write a short checklist (5 points) in English for a founder preparing a pitch.",
  }),
  article({
    id: "diversified-investing", title: "Why diversification matters", level: "B2", category: "Finance",
    intro: "Le principe de diversification expliqué simplement (texte pédagogique, pas un conseil personnalisé).",
    paragraphs: [
      "\"Don't put all your eggs in one basket\" is perhaps the best-known piece of investment wisdom. The principle behind it, diversification, is simple: spreading money across different assets reduces the impact of any single loss.",
      "Imagine an investor who puts all their savings into the shares of one company. If that company runs into difficulties, a large part of the savings could be lost. By contrast, an investor holding many companies across several sectors and countries is less exposed to the fate of one firm.",
      "Diversification can also be achieved across asset types, such as shares, bonds, property and cash, which tend to react differently to economic events.",
      "It is important to understand what diversification does not do. It does not guarantee a profit, nor does it protect against a general market decline, when most assets fall at the same time. It reduces specific risks, not all risks.",
      "Finally, an appropriate mix depends on personal factors: goals, time horizon and tolerance for risk. This is why professional advice is often recommended before making significant decisions.",
    ],
    glossary: [{ term: "basket", fr: "panier" }, { term: "spread", fr: "répartir" }, { term: "shares", fr: "actions" }, { term: "bonds", fr: "obligations" }, { term: "decline", fr: "baisse, déclin" }],
    questions: [
      ["What is the basic principle of diversification?", ["Investing in one strong company", "Spreading money across different assets", "Keeping all money in cash"], 1, "Premier paragraphe."],
      ["Why is investing in one company risky?", ["Shares are expensive", "Its difficulties could cause a large loss", "It's not allowed"], 1, "Deuxième paragraphe."],
      ["What can diversification NOT do?", ["Reduce specific risks", "Guarantee a profit", "Include bonds"], 1, "« It does not guarantee a profit »."],
      ["What does an appropriate mix depend on?", ["The bank's advice only", "Goals, time horizon and risk tolerance", "Last year's returns"], 1, "Dernier paragraphe."],
    ],
    summaryPrompt: "Explain diversification in 80 words to a colleague, including its limits.",
  }),
  article({
    id: "international-teams", title: "Working in international teams", level: "B2", category: "International",
    intro: "Les défis de la communication dans les équipes internationales.",
    paragraphs: [
      "As companies increasingly operate across borders, more and more employees work in teams whose members are spread over several countries and time zones. English is frequently the common language, yet for most participants it is not their first language.",
      "This can lead to subtle misunderstandings. Native speakers, in particular, may speak too fast, use idioms or rely on humour that doesn't translate well. Paradoxically, they are sometimes the hardest people to understand in an international meeting.",
      "Cultural differences also play a role. In some cultures, disagreeing openly with a manager is acceptable; in others, it may be seen as disrespectful. A silence that one person interprets as agreement may in fact signal doubt.",
      "Successful teams tend to make their rules explicit. They summarise decisions in writing, check understanding by asking open questions and rotate meeting times so that the same people are not always connecting late at night.",
      "Ultimately, clear and simple language is not a sign of a low level. In international business, it is often a mark of professionalism.",
    ],
    glossary: [{ term: "across borders", fr: "à l'international" }, { term: "misunderstanding", fr: "malentendu" }, { term: "rely on", fr: "compter sur, recourir à" }, { term: "explicit", fr: "explicite" }, { term: "rotate", fr: "faire tourner, alterner" }],
    questions: [
      ["Why can native speakers be hard to understand?", ["They speak too fast and use idioms", "They speak too slowly", "They refuse to speak"], 0, "Deuxième paragraphe."],
      ["What can silence mean in some cultures?", ["Always agreement", "Possibly doubt", "Anger"], 1, "« may in fact signal doubt »."],
      ["Which is a practice of successful teams?", ["Avoiding written summaries", "Rotating meeting times", "Speaking only English slang"], 1, "« rotate meeting times »."],
      ["What does the writer say about simple language?", ["It shows a low level", "It's a mark of professionalism", "It's impolite"], 1, "Dernière phrase."],
    ],
    summaryPrompt: "Write 4 recommendations for a new member of an international team.",
  }),
];
