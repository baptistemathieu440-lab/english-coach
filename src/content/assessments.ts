import type { Assessment, AssessmentSection, Cefr, ListeningItem, McqExercise, Speaker } from "./types";

type Q = [prompt: string, options: string[], answer: number, explanation: string, level?: Cefr];

let n = 0;
const qs = (prefix: string, list: Q[]): McqExercise[] =>
  list.map(([prompt, options, answer, explanation, level]) => ({ id: `${prefix}-${++n}`, kind: "mcq", prompt, options, answer, explanation, level }));

const sp = (name: string, accent: Speaker["accent"], voice: Speaker["voice"]): Speaker => ({ name, accent, voice });

function dialogue(id: string, level: ListeningItem["level"], speakers: Speaker[], lines: [number, string][]): ListeningItem {
  return {
    id, title: "Écoute d'évaluation", level, difficulty: 2, theme: "Évaluation", speakers,
    lines: lines.map(([s, en]) => ({ s, en, fr: "" })), questions: [], dictation: [], summaryPrompt: "", glossary: [],
  };
}

const task = (instruction: string, minWords: number, any: string, model: string): AssessmentSection["task"] => ({
  instruction, minWords, any: any.split(";").map((g) => g.split("/").map((x) => x.trim())), model,
});

/* =================== Test de positionnement =================== */

export const PLACEMENT: Assessment = {
  id: "placement", title: "Test de positionnement", stage: 0, validates: "A2",
  description: "Environ 20 minutes. Il mesure six compétences et sert à personnaliser votre parcours. Répondez sans aide : un résultat honnête donne un meilleur programme.",
  sections: [
    {
      skill: "grammar", title: "Grammaire",
      items: qs("pl-g", [
        ["She ___ in a bank.", ["work", "works", "working"], 1, "3e personne : works.", "A1"],
        ["___ you like coffee?", ["Do", "Are", "Does"], 0, "Question : Do you…?", "A1"],
        ["Yesterday we ___ to the cinema.", ["go", "went", "have gone"], 1, "Past simple : went.", "A2"],
        ["Look! It ___.", ["snows", "is snowing", "snowed"], 1, "Action en cours.", "A2"],
        ["This is the ___ restaurant in town.", ["better", "best", "most good"], 1, "Superlatif : the best.", "A2"],
        ["I ___ here since 2020.", ["live", "am living", "have lived"], 2, "Present perfect + since.", "A2"],
        ["If it rains, we ___ at home.", ["stay", "will stay", "would stay"], 1, "Conditionnel 1.", "B1"],
        ["The bridge ___ in 1890.", ["built", "was built", "has built"], 1, "Passif au passé.", "B1"],
        ["He told me he ___ tired.", ["is", "was", "has been"], 1, "Discours indirect : recul.", "B1"],
        ["When I arrived, the film ___.", ["already started", "had already started", "has already started"], 1, "Past perfect.", "B1"],
        ["If I ___ you, I'd accept.", ["am", "were", "would be"], 1, "Conditionnel 2.", "B1"],
        ["If she had left earlier, she ___ the train.", ["wouldn't miss", "wouldn't have missed", "didn't miss"], 1, "Conditionnel 3.", "B2"],
        ["He ___ have forgotten; he never forgets.", ["must", "can't", "should"], 1, "Déduction négative au passé.", "B2"],
        ["Not only ___ late, but he also forgot the documents.", ["he was", "was he", "he has been"], 1, "Inversion.", "B2"],
      ]),
    },
    {
      skill: "vocabulary", title: "Vocabulaire",
      items: qs("pl-v", [
        ["« Une addition » au restaurant (UK) :", ["a note", "a bill", "an addition"], 1, "the bill.", "A1"],
        ["I'm going to ___ a table for tonight.", ["book", "reserve to", "take"], 0, "book a table.", "A2"],
        ["« Bagages » :", ["luggages", "luggage", "baggages"], 1, "Indénombrable : luggage.", "A2"],
        ["We've ___ milk. Can you buy some?", ["run out of", "given up", "looked after"], 0, "run out of = ne plus avoir.", "B1"],
        ["« Une réclamation » :", ["a reclamation", "a complaint", "a claim back"], 1, "a complaint.", "B1"],
        ["The ___ of the plan is that it's very expensive.", ["drawback", "breakthrough", "outcome"], 0, "drawback = inconvénient.", "B2"],
        ["« Actuellement » :", ["actually", "currently", "eventually"], 1, "Faux ami : currently.", "B2"],
        ["We need to ___ costs before the end of the year.", ["cut", "lower down", "decrease of"], 0, "cut costs.", "B2"],
      ]),
    },
    {
      skill: "reading", title: "Compréhension écrite",
      passage: [
        "When Clara opened her small bookshop five years ago, friends told her it was a risky idea. People buy books online, they said, and nobody has time to read any more.",
        "Clara decided to offer something online shops can't: advice and a place to meet. She organises reading clubs, writing workshops for children and talks with local authors. Customers often stay for a coffee and leave with a book they hadn't planned to buy.",
        "The shop is not making a lot of money, but it has been profitable for two years. \"I'll never be rich,\" Clara says, \"but I've built something people really value.\"",
      ],
      items: qs("pl-r", [
        ["What did her friends think about the bookshop?", ["It was a great idea", "It was risky", "It was too small"], 1, "« a risky idea ».", "A2"],
        ["What does Clara offer that online shops can't?", ["Lower prices", "Advice and a place to meet", "Faster delivery"], 1, "« advice and a place to meet ».", "A2"],
        ["What often happens when customers stay for a coffee?", ["They complain", "They buy unplanned books", "They work"], 1, "« leave with a book they hadn't planned to buy ».", "B1"],
        ["What best describes the shop's financial situation?", ["Very rich", "Profitable but modest", "Losing money"], 1, "Rentable depuis deux ans, mais modeste.", "B1"],
      ]),
    },
    {
      skill: "listening", title: "Compréhension orale",
      listening: dialogue("pl-l", "B1", [sp("Anna", "gb", "female"), sp("Mike", "us", "male")], [
        [0, "Hi Mike, are we still meeting at three to prepare the presentation?"],
        [1, "Actually, could we make it four? My train was cancelled and I'm still in Manchester."],
        [0, "Oh no. Four is fine, but the meeting with the client is tomorrow at nine, so we can't move it again."],
        [1, "Understood. I'll call you from the train. Could you send me the latest version of the slides?"],
        [0, "Sure. I've already added the sales figures, but the budget slide is still missing."],
        [1, "I'll do the budget slide tonight, then. Thanks for your patience!"],
      ]),
      items: qs("pl-l", [
        ["What time will they meet now?", ["Three", "Four", "Nine"], 1, "« could we make it four? »", "A2"],
        ["Why is Mike late?", ["He's ill", "His train was cancelled", "He forgot"], 1, "« My train was cancelled ».", "A2"],
        ["When is the meeting with the client?", ["Today at four", "Tomorrow at nine", "Tomorrow at three"], 1, "« tomorrow at nine ».", "B1"],
        ["What will Mike do tonight?", ["Add the sales figures", "Prepare the budget slide", "Call the client"], 1, "« I'll do the budget slide tonight ».", "B1"],
      ]),
    },
    {
      skill: "writing", title: "Expression écrite", items: [],
      task: task("Présentez-vous en anglais (40 à 80 mots) : qui vous êtes, votre travail ou vos études, et pourquoi vous voulez améliorer votre anglais.", 40, "i/my; because/to/so/want; work/study/job/live", "My name is Laura and I live in Bordeaux. I work in a small company that sells wine abroad. I want to improve my English because I often speak with clients from the UK and the USA, and I would like to feel more confident in meetings."),
    },
    {
      skill: "speaking", title: "Expression orale", items: [],
      task: task("Répondez à voix haute (ou par écrit si le micro est indisponible) : « Tell me about a place you like and explain why. » Parlez au moins 30 secondes.", 30, "like/love/favourite; because/since/as", "I really like the Atlantic coast near Bordeaux, especially Cap Ferret. I like it because it's quiet, the beaches are beautiful and I can eat fresh oysters with my friends. I go there almost every summer."),
    },
  ],
};

/* =================== Examens blancs de fin d'étape =================== */

export const EXAMS: Assessment[] = [
  {
    id: "exam-stage-1", title: "Examen blanc — fin d'étape 1", stage: 1, validates: "B1",
    description: "Valide le passage de A2 consolidé à B1. Réussite : 70 % en grammaire, vocabulaire, lecture et écoute, 60 % en expression écrite et orale.",
    sections: [
      { skill: "grammar", title: "Grammaire", items: qs("e1-g", [
        ["He usually ___ to work by bike.", ["go", "goes", "is going"], 1, "Habitude, 3e personne."],
        ["I ___ my phone. I can't find it anywhere.", ["lost", "have lost", "lose"], 1, "Résultat présent : present perfect."],
        ["While I ___, the phone rang.", ["cooked", "was cooking", "am cooking"], 1, "Action longue interrompue."],
        ["We ___ married for ten years.", ["are", "have been", "were being"], 1, "Durée jusqu'à maintenant."],
        ["The train is ___ than the bus.", ["more fast", "faster", "fastest"], 1, "Comparatif court."],
        ["You ___ pay; it's free.", ["mustn't", "don't have to", "can't"], 1, "Absence d'obligation."],
        ["Where ___ last summer?", ["did you go", "you went", "have you gone"], 0, "Question au past simple."],
        ["I'll call you when I ___ home.", ["will get", "get", "got"], 1, "Présent après when."],
        ["She's ___ engineer.", ["a", "an", "the"], 1, "an + son voyelle."],
        ["I stayed home ___ the rain.", ["because", "because of", "so"], 1, "because of + nom."],
      ]) },
      { skill: "vocabulary", title: "Vocabulaire", items: qs("e1-v", [
        ["« Un rendez-vous chez le médecin » :", ["a meeting", "an appointment", "a date"], 1, "appointment."],
        ["I need to ___ for my holiday.", ["save up", "give up", "set up"], 0, "save up = économiser."],
        ["« Le loyer » :", ["the rent", "the rental", "the location"], 0, "rent."],
        ["The flight was ___ by two hours.", ["late", "delayed", "slow"], 1, "delayed."],
        ["« Une connaissance (personne) » :", ["a knowledge", "an acquaintance", "a known"], 1, "acquaintance."],
        ["I'm ___ to cats.", ["allergic", "allergy", "sensitive of"], 0, "allergic to."],
      ]) },
      { skill: "reading", title: "Lecture", passage: [
        "Tom moved to Lisbon last year for a new job in a software company. At first, everything was difficult: he didn't speak Portuguese, he didn't know anyone and his flat was very small.",
        "After a few weeks, he joined a running club. Every Saturday morning, the group runs ten kilometres along the river and then has breakfast together. Tom made his first friends there, and they helped him with his Portuguese.",
        "Today, Tom says he feels at home. He still finds the language hard, but he can order in restaurants and chat with his neighbours. He would like to stay in Lisbon for at least three more years.",
      ], items: qs("e1-r", [
        ["Why did Tom move to Lisbon?", ["For his studies", "For a new job", "For his family"], 1, "« for a new job »."],
        ["Which was NOT a difficulty at first?", ["The language", "His flat", "His salary"], 2, "Langue, solitude, petit appartement."],
        ["What does the running club do after running?", ["They swim", "They have breakfast together", "They go to work"], 1, "« has breakfast together »."],
        ["How did his friends help him?", ["With his Portuguese", "With his job", "With his flat"], 0, "« helped him with his Portuguese »."],
        ["What are his plans?", ["Leave soon", "Stay at least three more years", "Move to Porto"], 1, "« at least three more years »."],
      ]) },
      { skill: "listening", title: "Écoute", listening: dialogue("e1-l", "A2", [sp("Receptionist", "au", "female"), sp("Caller", "gb", "male")], [
        [1, "Hello, I'd like to change my booking, please. My name is Daniel Price."],
        [0, "Of course, Mr Price. You're booked for two nights from Friday. What would you like to change?"],
        [1, "Could I arrive on Saturday instead and stay until Monday?"],
        [0, "Let me check. Yes, that's possible, but the room on Sunday night is ten dollars more expensive."],
        [1, "That's fine. And is parking still free?"],
        [0, "Yes, parking is free for guests. Breakfast is served from seven to ten."],
      ]), items: qs("e1-l", [
        ["Why is Daniel calling?", ["To cancel", "To change his booking", "To complain"], 1, "« change my booking »."],
        ["When does he want to arrive now?", ["Friday", "Saturday", "Monday"], 1, "« arrive on Saturday instead »."],
        ["What is different about Sunday night?", ["It's free", "It's ten dollars more", "It's full"], 1, "« ten dollars more expensive »."],
        ["Is parking free?", ["Yes", "No", "Only on Sunday"], 0, "« parking is free for guests »."],
        ["When is breakfast served?", ["6 to 9", "7 to 10", "8 to 11"], 1, "« from seven to ten »."],
      ]) },
      { skill: "writing", title: "Expression écrite", items: [], task: task("Écrivez un email (70 à 100 mots) à un collègue pour raconter un voyage récent et proposer un déjeuner la semaine prochaine.", 70, "went/visited/was/had/stayed; would you like/how about/shall we/could we; lunch/next week", "Hi Sarah,\nI'm back from my trip to Edinburgh! It was amazing. I visited the castle and walked a lot in the old town. The weather was cold but sunny, and the people were really friendly. I also had a great dinner in a small Scottish restaurant.\nWould you like to have lunch next week? I could show you my photos. How about Tuesday or Wednesday?\nSee you soon,\nMarc") },
      { skill: "speaking", title: "Expression orale", items: [], task: task("Parlez 45 secondes : « Describe your daily routine and tell me what you did last weekend. »", 45, "usually/every day/always/often; last weekend/on saturday/on sunday; went/did/was/had/saw", "On weekdays I usually get up at seven and take the tram to work. I start at nine and finish at six. Last weekend I went to my parents' house. On Saturday we had a barbecue and on Sunday I watched a football match.") },
    ],
  },
  {
    id: "exam-stage-2", title: "Examen blanc — fin d'étape 2", stage: 2, validates: "B1",
    description: "Valide un B1 solide. Réussite : 70 % en grammaire, vocabulaire, lecture et écoute, 60 % en expression écrite et orale.",
    sections: [
      { skill: "grammar", title: "Grammaire", items: qs("e2-g", [
        ["How long ___ for the bus?", ["are you waiting", "have you been waiting", "did you wait"], 1, "Present perfect continuous."],
        ["By the time we arrived, the shop ___.", ["closed", "had closed", "has closed"], 1, "Past perfect."],
        ["If I ___ more money, I would travel more.", ["have", "had", "would have"], 1, "Conditionnel 2."],
        ["The report ___ by the manager yesterday.", ["was written", "wrote", "has written"], 0, "Passif passé."],
        ["She asked me where I ___.", ["work", "worked", "did work"], 1, "Question rapportée."],
        ["The woman ___ car was stolen called the police.", ["who", "which", "whose"], 2, "Possession."],
        ["I'm looking forward to ___ you.", ["see", "seeing", "have seen"], 1, "look forward to + -ing."],
        ["___ the rain, we went for a walk.", ["Although", "Despite", "However"], 1, "despite + nom."],
        ["Could you turn ___ the TV? It's too loud.", ["down", "off of", "out"], 0, "turn down."],
        ["Unless you ___, you'll miss the train.", ["hurry", "don't hurry", "will hurry"], 0, "unless = if not."],
      ]) },
      { skill: "vocabulary", title: "Vocabulaire", items: qs("e2-v", [
        ["« Charge de travail » :", ["workload", "worktime", "overwork"], 0, "workload."],
        ["We need to ___ a solution quickly.", ["come up with", "run out of", "put off"], 0, "come up with."],
        ["« Empreinte carbone » :", ["carbon footprint", "carbon print", "carbon step"], 0, "carbon footprint."],
        ["« Selon le rapport » :", ["According to the report", "Following the report", "As the report"], 0, "according to."],
        ["We can't ___ a new car this year.", ["afford", "pay", "spend"], 0, "afford."],
        ["« Chiffre d'affaires » :", ["benefit", "revenue", "profit"], 1, "revenue (ou turnover)."],
      ]) },
      { skill: "reading", title: "Lecture", passage: [
        "A growing number of companies are allowing employees to choose where they work. Some staff come to the office every day, while others work mostly from home.",
        "Supporters say this flexibility improves well-being and helps companies attract talent from other regions. Critics, however, worry about team spirit and the difficulty of training new employees remotely.",
        "One company tried an experiment: teams agreed on two 'collaboration days' a week when everyone came to the office. The rest of the time, people worked wherever they wanted. After six months, most employees said they felt both more productive and more connected to their colleagues.",
        "Managers admit that the system requires better planning. Meetings must be organised carefully, and important information has to be shared in writing so that no one is left out.",
      ], items: qs("e2-r", [
        ["What are companies increasingly allowing?", ["Longer holidays", "Choosing where to work", "Higher salaries"], 1, "Premier paragraphe."],
        ["What do critics worry about?", ["Costs", "Team spirit and training", "Technology"], 1, "Deuxième paragraphe."],
        ["What were 'collaboration days'?", ["Days off", "Days when everyone came to the office", "Online training days"], 1, "Troisième paragraphe."],
        ["What was the result after six months?", ["Employees felt more productive and connected", "Employees wanted to stay home", "The experiment was cancelled"], 0, "Troisième paragraphe."],
        ["What does the system require according to managers?", ["Better planning and written information", "More offices", "Fewer meetings only"], 0, "Dernier paragraphe."],
      ]) },
      { skill: "listening", title: "Écoute", listening: dialogue("e2-l", "B1", [sp("Ellie", "ie", "female"), sp("Raj", "in", "male")], [
        [0, "Raj, have you finished the customer survey report? The director wants it by Thursday."],
        [1, "Almost. I've analysed the answers, but I haven't written the conclusion yet."],
        [0, "What are the main results?"],
        [1, "Most customers are happy with our products, but nearly forty percent complained about delivery times."],
        [0, "That's a lot. Did they give any details?"],
        [1, "Yes, the main problem is that deliveries are often late on Mondays, probably because the warehouse is closed at the weekend."],
        [0, "Interesting. Could you suggest a solution in the conclusion? Maybe opening the warehouse on Saturday mornings."],
        [1, "Good idea. I'll include that and send you the report tomorrow afternoon."],
      ]), items: qs("e2-l", [
        ["What hasn't Raj finished yet?", ["The analysis", "The conclusion", "The survey"], 1, "« I haven't written the conclusion yet »."],
        ["What were customers unhappy about?", ["Prices", "Delivery times", "Product quality"], 1, "Délais de livraison."],
        ["Why are deliveries late on Mondays?", ["Drivers are on holiday", "The warehouse is closed at the weekend", "There is more traffic"], 1, "Entrepôt fermé le week-end."],
        ["What solution does Ellie suggest?", ["Opening the warehouse on Saturday mornings", "Hiring more drivers", "Changing suppliers"], 0, "Dernière réplique d'Ellie."],
        ["When will Raj send the report?", ["Tonight", "Tomorrow afternoon", "On Thursday evening"], 1, "« tomorrow afternoon »."],
      ]) },
      { skill: "writing", title: "Expression écrite", items: [], task: task("Donnez votre avis (100 à 140 mots) : « Should shops be open on Sundays? » Deux arguments, un contre-argument, une conclusion.", 100, "think/opinion/believe; however/on the other hand/although/but; moreover/furthermore/in addition/also; to sum up/in conclusion/overall", "In my opinion, shops should be allowed to open on Sundays, but not all day. First of all, many people work during the week and Sunday is the only day they can do their shopping. Moreover, it creates jobs, especially for students. On the other hand, employees also need time with their families, and small shops cannot always compete with big supermarkets. In conclusion, I think shops should be able to open on Sunday mornings, with higher pay for the staff who work.") },
      { skill: "speaking", title: "Expression orale", items: [], task: task("Parlez une minute : « Tell me about a difficult experience and what you learned from it. »", 60, "was/had/happened/decided; learned/learnt/realised/understood; because/so/but", "A few years ago I had to give a presentation in English in front of fifty people. I was very nervous because my English wasn't very good. I practised a lot the week before and it went quite well. I learned that preparation is the key and that people are usually kind when you make mistakes.") },
    ],
  },
  {
    id: "exam-stage-3", title: "Examen blanc — fin d'étape 3", stage: 3, validates: "B2",
    description: "Valide le niveau B2. Réussite : 70 % en grammaire, vocabulaire, lecture et écoute, 60 % en expression écrite et orale.",
    sections: [
      { skill: "grammar", title: "Grammaire", items: qs("e3-g", [
        ["If we had invested earlier, we ___ more money now.", ["would have", "would have had", "had"], 0, "Conditionnel mixte."],
        ["She ___ the email; she replied to it.", ["can't have missed", "must miss", "mustn't have missed"], 0, "Déduction négative passée."],
        ["I'm not used to ___ so early.", ["get up", "getting up", "got up"], 1, "be used to + -ing."],
        ["I wish I ___ that job offer last year.", ["accepted", "had accepted", "would accept"], 1, "Regret passé."],
        ["The CEO is reported ___ yesterday.", ["to resign", "to have resigned", "resigning"], 1, "Passif impersonnel passé."],
        ["We had the office ___ last month.", ["repaint", "repainted", "repainting"], 1, "Causatif."],
        ["___ hard she tries, she can't convince him.", ["However", "Although", "Despite"], 0, "However + adjectif."],
        ["By 2030, the company ___ its emissions by half.", ["will reduce", "will have reduced", "reduces"], 1, "Future perfect."],
        ["This time tomorrow, I ___ to Singapore.", ["will fly", "will be flying", "fly"], 1, "Future continuous."],
        ["You ___ told me! I would have helped.", ["should have", "must have", "might"], 0, "Reproche."],
      ]) },
      { skill: "vocabulary", title: "Vocabulaire", items: qs("e3-v", [
        ["The benefits clearly ___ the risks.", ["outweigh", "overcome", "outnumber of"], 0, "outweigh."],
        ["« Conclure une affaire » :", ["close a deal", "finish a business", "conclude an affair"], 0, "close a deal."],
        ["« Ordre du jour » :", ["agenda", "schedule of the day", "day order"], 0, "agenda."],
        ["It cost an ___ and a leg.", ["arm", "eye", "hand"], 0, "Expression idiomatique."],
        ["« Point rédhibitoire » :", ["deal-breaker", "breakpoint", "stop point"], 0, "deal-breaker."],
        ["« Notoriété de la marque » :", ["brand awareness", "brand notoriety", "mark fame"], 0, "brand awareness."],
      ]) },
      { skill: "reading", title: "Lecture", passage: [
        "For decades, economic success was measured mainly through growth in gross domestic product, or GDP. Yet many economists now argue that GDP alone gives an incomplete picture of a nation's well-being.",
        "GDP measures the value of goods and services produced, but it ignores factors such as inequality, unpaid work or environmental damage. A country could, in theory, increase its GDP while most of its citizens become less satisfied with their lives.",
        "As a result, several governments have started publishing additional indicators, covering areas like health, education, air quality and life satisfaction. Supporters believe these measures encourage more balanced policies.",
        "Critics, however, point out that such indicators are harder to compare between countries and can be influenced by political choices about what to include. Nevertheless, few would deny that the debate has encouraged a broader understanding of progress.",
      ], items: qs("e3-r", [
        ["What do many economists argue about GDP?", ["It is useless", "It gives an incomplete picture", "It should be replaced immediately"], 1, "« an incomplete picture »."],
        ["Which factor does GDP ignore?", ["Production of services", "Environmental damage", "Exports"], 1, "Deuxième paragraphe."],
        ["What have some governments started doing?", ["Stopping GDP calculations", "Publishing additional indicators", "Reducing taxes"], 1, "Troisième paragraphe."],
        ["What is a criticism of new indicators?", ["They are too cheap", "They are harder to compare and can be political", "They ignore health"], 1, "Dernier paragraphe."],
        ["What is the writer's overall tone?", ["Strongly against GDP", "Balanced", "Humorous"], 1, "Le texte présente les deux points de vue."],
      ]) },
      { skill: "listening", title: "Écoute", listening: dialogue("e3-l", "B2", [sp("Host", "us", "male"), sp("Economist", "gb", "female")], [
        [0, "With housing prices rising again, many young people say they'll never be able to buy a home. Is that fear justified?"],
        [1, "To some extent, yes. In most big cities, prices have grown much faster than salaries over the last twenty years."],
        [1, "That said, the situation varies enormously between regions. In some medium-sized towns, buying remains realistic for people on average incomes."],
        [0, "What could governments do?"],
        [1, "The most obvious answer is to build more, but that takes time and often faces local opposition. Other options include taxing empty homes or limiting short-term rentals in areas under pressure."],
        [0, "Some say limiting rentals hurts tourism."],
        [1, "It might, in certain places. Any policy involves trade-offs. The key is to measure the effects carefully and adjust if necessary."],
      ]), items: qs("e3-l", [
        ["Why do young people fear they can't buy a home?", ["Interest rates are zero", "Prices have grown faster than salaries", "There are no houses"], 1, "Les prix ont augmenté plus vite que les salaires."],
        ["What does the economist say about regions?", ["The situation is the same everywhere", "It varies enormously", "Small towns are more expensive"], 1, "« varies enormously »."],
        ["Why is building more not a quick solution?", ["It takes time and faces opposition", "It's illegal", "Nobody wants new homes"], 0, "Prend du temps + opposition locale."],
        ["Which policy is NOT mentioned?", ["Taxing empty homes", "Limiting short-term rentals", "Lowering salaries"], 2, "Non mentionné."],
        ["What is her final point?", ["Policies have no trade-offs", "Effects should be measured and adjusted", "Tourism is more important"], 1, "Dernière réplique."],
      ]) },
      { skill: "writing", title: "Expression écrite", items: [], task: task("Essai (150 à 200 mots) : « Should companies be required to publish employees' salaries? » Présentez des arguments nuancés et votre position.", 150, "admittedly/although/while/whereas/even though/that said; moreover/furthermore/nevertheless/therefore/consequently; would/could/might; in conclusion/on balance/to conclude/all things considered", "Salary transparency has become a widely debated issue. While some argue that publishing salaries would create conflict, I believe that, on balance, more openness would be beneficial.\nFirstly, transparency can help reduce unjustified pay gaps, for instance between men and women doing the same job. Moreover, it would allow candidates to negotiate on a fairer basis.\nAdmittedly, publishing individual salaries could make some employees uncomfortable, and it might lead to tensions within teams. Nevertheless, these risks could be limited by publishing salary ranges for each position rather than individual figures.\nIn conclusion, I would support a law requiring companies to publish pay ranges, which seems a reasonable compromise between privacy and fairness.") },
      { skill: "speaking", title: "Expression orale", items: [], task: task("Parlez 90 secondes : « Some people think artificial intelligence will make work more interesting; others think it will destroy jobs. What's your view? »", 90, "on the one hand/on the other hand/however/whereas/although; i think/i believe/in my view/personally; will/might/could/likely/probably", "Personally, I think AI will change most jobs rather than destroy them. On the one hand, it can do repetitive tasks such as writing standard emails, which might free up time for more interesting work. On the other hand, some people will probably lose their jobs, especially if they don't receive training. So I believe companies and governments should invest in training to make the transition fairer.") },
    ],
  },
  {
    id: "exam-stage-4", title: "Examen blanc — B2 consolidé", stage: 4, validates: "B2",
    description: "Évaluation complète des compétences B2 en contexte professionnel. Réussite : 75 % en grammaire, vocabulaire, lecture et écoute, 65 % en expression écrite et orale.",
    sections: [
      { skill: "grammar", title: "Grammaire", items: qs("e4-g", [
        ["___ you have any questions, please contact me.", ["Should", "Would", "Had"], 0, "Inversion conditionnelle."],
        ["Never ___ such a complicated contract.", ["I have read", "have I read", "I read"], 1, "Inversion après never."],
        ["What I need ___ more time.", ["it is", "is", "are"], 1, "Clivée."],
        ["He denied ___ the documents.", ["to take", "taking", "take"], 1, "deny + -ing."],
        ["She reminded me ___ the invoice.", ["sending", "to send", "send"], 1, "remind + objet + to."],
        ["___ in 1998, the firm now employs 500 people.", ["Founding", "Founded", "Having found"], 1, "Participe passé."],
        ["___ the figures, she called the client.", ["Having checked", "Checked", "Having check"], 0, "Having + participe."],
        ["The results ___ to show a recovery.", ["seem", "are seeming", "seems to"], 0, "Hedging."],
        ["The consultant suggested ___ costs.", ["us to cut", "cutting", "to cut"], 1, "suggest + -ing."],
        ["Had I known, I ___ differently.", ["would act", "would have acted", "acted"], 1, "Inversion = If I had known."],
      ]) },
      { skill: "vocabulary", title: "Vocabulaire", items: qs("e4-v", [
        ["« Trésorerie » :", ["cash flow", "treasure", "liquidity flow"], 0, "cash flow."],
        ["« Atteindre le seuil de rentabilité » :", ["break even", "break out", "even out"], 0, "break even."],
        ["« Partie prenante » :", ["stakeholder", "shareholder", "partaker"], 0, "stakeholder."],
        ["« Diversifier un portefeuille » :", ["diversify a portfolio", "vary a wallet", "spread a folder"], 0, "diversify a portfolio."],
        ["We need to ___ the process to save time.", ["streamline", "undermine", "foresee"], 0, "streamline."],
        ["« Complet, exhaustif » :", ["comprehensive", "comprehensible", "understanding"], 0, "Faux ami : comprehensive."],
      ]) },
      { skill: "reading", title: "Lecture", passage: [
        "When a mid-sized logistics firm decided to expand into three new European markets, its directors expected the main challenges to be legal and financial. They were surprised to discover that communication turned out to be the most delicate issue.",
        "Meetings that seemed productive often ended with different interpretations of what had been agreed. In one case, a German partner understood a 'tentative' delivery date as a firm commitment, while the French team considered it a rough estimate.",
        "The company responded by introducing simple rules: every meeting ends with a written summary of decisions, deadlines are always stated with a date and a time zone, and participants are encouraged to rephrase key points before leaving.",
        "Within a year, the number of disputes with partners had fallen considerably. Managers concluded that clear, explicit language was not a sign of mistrust but a basic condition for working across cultures.",
      ], items: qs("e4-r", [
        ["What did the directors expect to be the main challenges?", ["Communication", "Legal and financial issues", "Recruitment"], 1, "Premier paragraphe."],
        ["What caused the misunderstanding with the German partner?", ["A late payment", "Different interpretations of a 'tentative' date", "A translation error in the contract"], 1, "Deuxième paragraphe."],
        ["Which rule was introduced?", ["No more meetings", "Written summaries of decisions", "Only one language allowed"], 1, "Troisième paragraphe."],
        ["What happened within a year?", ["Disputes fell considerably", "The company left Europe", "Partners complained more"], 0, "Dernier paragraphe."],
        ["What did managers conclude?", ["Explicit language shows mistrust", "Clear language is essential across cultures", "Meetings should be shorter"], 1, "Dernière phrase."],
      ]) },
      { skill: "listening", title: "Écoute", listening: dialogue("e4-l", "B2", [sp("Chair", "ca", "female"), sp("Finance lead", "za", "male"), sp("Sales lead", "au", "female")], [
        [0, "Let's move on to the budget. Thabo, where do we stand?"],
        [1, "We're slightly over budget this quarter, by about four percent, mainly because of the trade fair in Milan."],
        [2, "Can I just come in here? The fair generated around sixty qualified leads, so I'd argue it was worth it."],
        [1, "I'm not disputing that. My concern is that we haven't adjusted the rest of the plan to compensate."],
        [0, "Fair point. What would you suggest?"],
        [1, "Postponing the website redesign to next quarter. It isn't urgent, and it would bring us back in line."],
        [2, "I could live with that, provided the new product pages are still ready for the launch."],
        [0, "Okay, so we postpone the redesign but keep the product pages. Thabo, could you send a revised budget by Wednesday?"],
      ]), items: qs("e4-l", [
        ["Why is the team over budget?", ["Higher salaries", "A trade fair", "A new office"], 1, "« because of the trade fair in Milan »."],
        ["How does the sales lead justify the expense?", ["It generated qualified leads", "It was cheap", "It was the director's idea"], 0, "« sixty qualified leads »."],
        ["What is Thabo's real concern?", ["The fair was useless", "The plan hasn't been adjusted", "Sales are falling"], 1, "« we haven't adjusted the rest of the plan »."],
        ["What is postponed?", ["The product launch", "The website redesign", "The next trade fair"], 1, "Refonte du site reportée."],
        ["What condition does the sales lead set?", ["Product pages must be ready for the launch", "A bigger budget next year", "Another trade fair"], 0, "« provided the new product pages are still ready »."],
      ]) },
      { skill: "writing", title: "Expression écrite", items: [], task: task("Rédigez un email professionnel (150 à 200 mots) à un partenaire étranger : vous devez reporter une livraison. Expliquez la situation, proposez des solutions, restez diplomate.", 150, "i am writing/i'm writing/regarding/further to; unfortunately/i'm afraid/i am afraid/regret; could/would/propose/suggest/offer; should you/please do not hesitate/look forward/kind regards", "Dear Mr Okafor,\nI am writing regarding your order no. 7714, scheduled for delivery on 12 March. Unfortunately, one of our suppliers has informed us of a shortage of components, which means we will not be able to ship the full order on time.\nWe would like to propose two options. We could deliver 70% of the order on the original date and the remaining 30% by 26 March. Alternatively, we could ship the complete order on 20 March, with transport costs covered by us.\nI do apologise for the inconvenience this may cause, and I would be grateful if you could let us know which option suits you best by Friday.\nShould you have any questions, please do not hesitate to contact me directly.\nKind regards,\nÉlodie Bernard") },
      { skill: "speaking", title: "Expression orale", items: [], task: task("Parlez deux minutes : présentez un projet professionnel (réel ou imaginaire) comme dans une réunion : contexte, objectifs, risques et prochaines étapes.", 120, "aim/objective/goal; risk/challenge/concern; next step/will/by; however/that said/although", "I'd like to present our plan to open a second office in Lyon. The main objective is to be closer to our clients in the region. We aim to hire five people within twelve months. The main risk is that recruitment could take longer than expected. That said, we already have contacts with two candidates. The next step will be to validate the budget by the end of the month.") },
    ],
  },
];

export const ALL_ASSESSMENTS: Assessment[] = [PLACEMENT, ...EXAMS];

/** Seuils de réussite par compétence (pourcentage). */
export function passMark(a: Assessment, skill: string): number {
  const productive = skill === "writing" || skill === "speaking";
  if (a.stage === 4) return productive ? 65 : 75;
  return productive ? 60 : 70;
}
