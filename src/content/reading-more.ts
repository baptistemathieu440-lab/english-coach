import type { Article } from "./types";
import { article } from "./reading";

/** Articles complémentaires : textes originaux, généraux et pédagogiques ; personnes et entreprises fictives. */
export const ARTICLES_MORE: Article[] = [
  article({
    id: "pay-by-phone", title: "Paying with your phone", level: "A2", category: "Technologie",
    intro: "Le paiement par téléphone : pratique, mais avec quelques précautions.",
    paragraphs: [
      "Many people now pay for coffee, train tickets and shopping with their phone. They just hold the phone near the card machine, and the payment is done in a second.",
      "It is fast and practical. You don't need to carry a wallet, and you don't touch the machine. Some people also like to see all their payments in one app.",
      "But there are a few things to remember. If your battery is empty, you can't pay. And if you lose your phone, you must lock it quickly. Most phones ask for a code, a fingerprint or your face before every payment, which makes them quite secure.",
      "A good idea is to keep one bank card at home, just in case.",
    ],
    glossary: [{ term: "card machine", fr: "terminal de paiement" }, { term: "wallet", fr: "portefeuille" }, { term: "battery", fr: "batterie" }, { term: "fingerprint", fr: "empreinte digitale" }, { term: "just in case", fr: "au cas où" }],
    questions: [
      ["How do you pay with your phone?", ["You type your card number", "You hold the phone near the card machine", "You send an email"], 1, "Premier paragraphe."],
      ["Which is an advantage mentioned?", ["It's cheaper", "You don't need to carry a wallet", "You get free coffee"], 1, "« You don't need to carry a wallet »."],
      ["What problem can happen?", ["Your battery can be empty", "Shops refuse phones", "Payments take an hour"], 0, "« If your battery is empty, you can't pay »."],
      ["What does the writer suggest at the end?", ["Never use a card", "Keep one bank card at home", "Buy a second phone"], 1, "Dernier paragraphe."],
    ],
    summaryPrompt: "Write 2–3 sentences: one advantage and one risk of paying with your phone.",
  }),
  article({
    id: "coworking-day", title: "A day in a co-working space", level: "A2", category: "Entrepreneuriat",
    intro: "Portrait (fictif) d'une graphiste indépendante qui travaille dans un espace partagé.",
    paragraphs: [
      "Nadia is a freelance graphic designer. For three years she worked at her kitchen table, but she often felt alone. Last year she started renting a desk in a co-working space in the city centre.",
      "She pays two hundred euros a month. For that price she gets a desk, fast internet, coffee and a meeting room she can book for her clients.",
      "\"The best part is the people,\" she says. \"I eat lunch with a web developer, a photographer and an accountant. We often help each other, and I've found two new clients here.\"",
      "There are some disadvantages. It can be noisy, and she spends forty minutes on the bus every day. But Nadia doesn't want to go back to her kitchen.",
    ],
    glossary: [{ term: "freelance", fr: "indépendant, en free-lance" }, { term: "rent", fr: "louer" }, { term: "book", fr: "réserver" }, { term: "accountant", fr: "comptable" }, { term: "noisy", fr: "bruyant" }],
    questions: [
      ["Why did Nadia leave her kitchen table?", ["It was too small", "She often felt alone", "Her internet was slow"], 1, "« she often felt alone »."],
      ["What does she get for €200 a month?", ["A private office", "A desk, internet, coffee and a meeting room", "A car"], 1, "Deuxième paragraphe."],
      ["What does she like most?", ["The coffee", "The people", "The location"], 1, "« The best part is the people »."],
      ["Which is a disadvantage?", ["It's expensive", "It can be noisy", "There is no internet"], 1, "« It can be noisy »."],
    ],
    summaryPrompt: "Present Nadia's new way of working in 3 sentences.",
  }),

  /* ---------- B1 ---------- */
  article({
    id: "night-trains", title: "The return of night trains", level: "B1", category: "International",
    intro: "Pourquoi les trains de nuit séduisent à nouveau les voyageurs.",
    paragraphs: [
      "For years, night trains seemed to belong to the past. Low-cost flights were faster and often cheaper, so many routes across Europe were closed.",
      "Recently, however, several night services have been relaunched. One reason is the environment: travelling by train usually produces far less CO2 than flying. Another is comfort. Passengers can sleep during the journey and arrive in the city centre in the morning, without going through airport security.",
      "Night trains also have challenges. Tickets for a private compartment can be expensive, and delays on one part of the route can affect the whole journey. Operators also need to cooperate across several countries, each with its own rules.",
      "Supporters say that the experience itself is part of the appeal. \"You go to sleep in one country and wake up in another,\" says one regular traveller. \"It feels like a small adventure.\"",
    ],
    glossary: [{ term: "belong to the past", fr: "appartenir au passé" }, { term: "relaunched", fr: "relancé" }, { term: "compartment", fr: "compartiment" }, { term: "operators", fr: "opérateurs, exploitants" }, { term: "appeal", fr: "attrait" }],
    questions: [
      ["Why were many night trains closed?", ["They were dangerous", "Low-cost flights were faster and cheaper", "Nobody liked trains"], 1, "Premier paragraphe."],
      ["Which is a reason for their return?", ["The environment", "Lower taxes", "New airports"], 0, "« One reason is the environment »."],
      ["What is a comfort advantage?", ["Free meals", "Arriving in the city centre without airport security", "Faster than planes"], 1, "Deuxième paragraphe."],
      ["What is one challenge for operators?", ["Cooperating across several countries", "Finding drivers", "Selling food"], 0, "Troisième paragraphe."],
      ["What does the regular traveller enjoy?", ["The low price", "The feeling of a small adventure", "The speed"], 1, "Dernière citation."],
    ],
    summaryPrompt: "Summarise the advantages and challenges of night trains in 4–5 sentences.",
  }),
  article({
    id: "social-media-small-business", title: "Small businesses on social media", level: "B1", category: "Business",
    intro: "Comment les petites entreprises utilisent les réseaux sociaux, et leurs limites.",
    paragraphs: [
      "For a small business with a limited budget, social media can look like free advertising. A bakery can post photos of fresh bread, and a hairdresser can show before-and-after pictures in a few minutes.",
      "Used well, these platforms help businesses build relationships with customers. People can ask questions, leave comments and share posts with friends. Some owners say that a single popular video brought them more customers than months of paid adverts.",
      "However, social media is not really free. It takes time to create good content regularly, to reply to messages and to deal with negative comments. Many owners underestimate this and give up after a few weeks.",
      "Experts suggest choosing one or two platforms where your customers really are, posting consistently, and measuring results. If a platform brings no visits or sales after several months, it may be better to spend that time elsewhere.",
    ],
    glossary: [{ term: "advertising", fr: "publicité" }, { term: "post", fr: "publier ; publication" }, { term: "underestimate", fr: "sous-estimer" }, { term: "give up", fr: "abandonner" }, { term: "consistently", fr: "régulièrement, avec constance" }],
    questions: [
      ["Why does social media look attractive to small businesses?", ["It seems like free advertising", "It's required by law", "It replaces employees"], 0, "Premier paragraphe."],
      ["What can a single popular video do?", ["Bring more customers than paid adverts", "Cost a lot of money", "Close the business"], 0, "Deuxième paragraphe."],
      ["Why is social media 'not really free'?", ["It takes a lot of time", "Platforms charge a fee", "Photos are expensive"], 0, "Troisième paragraphe."],
      ["What do experts recommend?", ["Using every platform", "Choosing one or two platforms and measuring results", "Posting only once a year"], 1, "Dernier paragraphe."],
    ],
    summaryPrompt: "Give advice in 4 sentences to a friend who wants to promote their shop on social media.",
  }),
  article({
    id: "rent-or-buy", title: "Renting or buying: how to think about it", level: "B1", category: "Finance",
    intro: "Les questions à se poser avant de louer ou d'acheter son logement (texte général, pas un conseil personnalisé).",
    paragraphs: [
      "\"Renting is throwing money away\" is something many people hear from their parents. The reality is more complicated, and the right choice depends on each person's situation.",
      "Buying a home can provide stability, and over a long period a buyer gradually owns more of the property. However, buying involves large upfront costs, such as the deposit, notary or legal fees and sometimes renovation work. It also makes it harder to move quickly for a new job.",
      "Renting offers flexibility. Tenants usually don't pay for major repairs, and they can keep their savings available for other projects. On the other hand, rent can increase, and tenants have less control over their home.",
      "Before deciding, it helps to ask a few questions. How long do I expect to stay in this city? Is my income stable? Could I still pay the monthly costs if interest rates rose? There is no universal answer, which is why many people seek independent advice before making such an important decision.",
    ],
    glossary: [{ term: "throw money away", fr: "jeter l'argent par les fenêtres" }, { term: "upfront costs", fr: "frais initiaux" }, { term: "notary fees", fr: "frais de notaire" }, { term: "repairs", fr: "réparations" }, { term: "seek advice", fr: "demander conseil" }],
    questions: [
      ["What is the writer's view of 'renting is throwing money away'?", ["It's always true", "The reality is more complicated", "It's a law"], 1, "Premier paragraphe."],
      ["Which is a disadvantage of buying?", ["Large upfront costs", "No stability", "Rent increases"], 0, "Deuxième paragraphe."],
      ["What is an advantage of renting?", ["Flexibility", "Owning the property", "Lower interest rates"], 0, "« Renting offers flexibility »."],
      ["Which question does the writer suggest asking?", ["How long do I expect to stay in this city?", "Which bank is the biggest?", "What do my friends do?"], 0, "Dernier paragraphe."],
      ["Why do many people seek independent advice?", ["It's mandatory", "There is no universal answer", "Banks require it"], 1, "Dernière phrase."],
    ],
    summaryPrompt: "Write a balanced summary (60–80 words) of the pros and cons of renting and buying.",
  }),

  /* ---------- B2 ---------- */
  article({
    id: "resilient-supply-chains", title: "Rethinking supply chains", level: "B2", category: "Économie",
    intro: "Pourquoi de nombreuses entreprises repensent leurs chaînes d'approvisionnement.",
    paragraphs: [
      "For decades, many companies organised their supply chains around a single goal: keeping costs as low as possible. Components were sourced from the cheapest suppliers, often far away, and stock levels were kept to a minimum, a strategy known as 'just-in-time'.",
      "This approach worked well as long as goods moved smoothly. Yet a series of disruptions, from extreme weather to port closures and sudden spikes in demand, exposed its weaknesses. When a single supplier could not deliver, entire production lines came to a halt.",
      "In response, a growing number of firms are shifting from efficiency alone towards resilience. Some are diversifying their suppliers across several regions; others are holding larger safety stocks of critical parts, or moving part of their production closer to their main markets.",
      "These changes come at a cost. Larger stocks tie up cash, and local production is often more expensive. Critics argue that such costs will eventually be passed on to consumers. Supporters counter that the price of being unable to deliver at all can be far higher.",
      "The emerging consensus is not to abandon global trade, but to accept a slightly higher cost in exchange for greater security, a trade-off that each company must calibrate according to its own risks.",
    ],
    glossary: [{ term: "sourced", fr: "approvisionné, acheté" }, { term: "just-in-time", fr: "flux tendu" }, { term: "come to a halt", fr: "s'arrêter net" }, { term: "resilience", fr: "résilience, capacité de résistance" }, { term: "tie up cash", fr: "immobiliser de la trésorerie" }, { term: "trade-off", fr: "compromis, arbitrage" }],
    questions: [
      ["What was the traditional main goal of supply chains?", ["Resilience", "Keeping costs low", "Local production"], 1, "Premier paragraphe."],
      ["What does 'just-in-time' involve?", ["Keeping minimal stock", "Producing everything locally", "Paying suppliers early"], 0, "« stock levels were kept to a minimum »."],
      ["What did disruptions reveal?", ["The strengths of the system", "Its weaknesses", "Lower prices"], 1, "« exposed its weaknesses »."],
      ["Which is NOT mentioned as a response?", ["Diversifying suppliers", "Holding safety stocks", "Stopping international trade"], 2, "Le dernier paragraphe dit justement de ne pas abandonner le commerce mondial."],
      ["What is the 'emerging consensus'?", ["Abandon global trade", "Accept a slightly higher cost for more security", "Return to just-in-time"], 1, "Dernier paragraphe."],
    ],
    summaryPrompt: "Write a 100-word summary explaining the shift from efficiency to resilience and its costs.",
  }),
  article({
    id: "salary-transparency", title: "Should salaries be public?", level: "B2", category: "Société",
    intro: "Le débat sur la transparence des salaires en entreprise.",
    paragraphs: [
      "In many workplaces, discussing salaries is still considered impolite. Yet pay transparency, from publishing salary ranges in job adverts to sharing pay scales internally, is increasingly on the agenda of companies and lawmakers alike.",
      "Advocates argue that openness helps reduce unjustified pay gaps, including between men and women doing comparable work. When salary ranges are visible, candidates can negotiate on a fairer basis, and employees are better placed to question decisions that seem arbitrary.",
      "Opponents raise several concerns. Publishing exact salaries could create tension between colleagues, especially where pay reflects factors that are difficult to explain, such as negotiation skills or market conditions at the time of hiring. Some managers also fear losing flexibility to reward exceptional performers.",
      "Between these positions lies a range of intermediate options. Many organisations now publish salary bands for each role without revealing individual pay, and explain the criteria used to move within a band. Early evidence suggests that clear criteria matter at least as much as the figures themselves.",
      "Ultimately, transparency may be less about numbers than about trust: employees are more likely to accept differences in pay if they understand, and believe in, the rules behind them.",
    ],
    glossary: [{ term: "salary range / band", fr: "fourchette de salaire" }, { term: "lawmakers", fr: "législateurs" }, { term: "advocates", fr: "défenseurs, partisans" }, { term: "pay gap", fr: "écart de rémunération" }, { term: "arbitrary", fr: "arbitraire" }, { term: "reward", fr: "récompenser" }],
    questions: [
      ["What do advocates say transparency helps reduce?", ["Taxes", "Unjustified pay gaps", "Working hours"], 1, "Deuxième paragraphe."],
      ["Which concern do opponents raise?", ["Tension between colleagues", "Higher taxes", "Fewer job adverts"], 0, "Troisième paragraphe."],
      ["What is an 'intermediate option'?", ["Publishing salary bands without individual pay", "Banning salary discussions", "Paying everyone the same"], 0, "Quatrième paragraphe."],
      ["According to early evidence, what matters a lot?", ["Clear criteria", "Higher salaries", "Secret negotiations"], 0, "« clear criteria matter at least as much as the figures »."],
      ["What is the writer's final point?", ["Transparency is mainly about trust", "Numbers are all that matter", "Salaries should stay secret"], 0, "Dernier paragraphe."],
    ],
    summaryPrompt: "Do you think salaries should be public? Write 120 words with arguments on both sides and your position.",
  }),
  article({
    id: "customer-data", title: "Customer data: asset or liability?", level: "B2", category: "Technologie",
    intro: "Les données clients : une ressource précieuse, mais aussi un risque.",
    paragraphs: [
      "For many companies, customer data has become one of their most valuable assets. Purchase histories, browsing behaviour and preferences allow businesses to personalise offers, anticipate demand and improve their products.",
      "However, the same data can quickly turn into a liability. Every piece of personal information a company stores must be protected, and a single security breach can damage customer trust for years, in addition to potential fines in jurisdictions with strict privacy laws.",
      "There is also a growing awareness among consumers. Many people are willing to share information in exchange for a clear benefit, such as faster delivery or relevant recommendations, but they increasingly resent being tracked without understanding why.",
      "As a result, some firms are adopting a principle sometimes called 'data minimisation': collecting only what they genuinely need, keeping it for a limited time and explaining its use in plain language. Paradoxically, collecting less can make the remaining data more reliable and easier to secure.",
      "The companies that will benefit most from data, it seems, are not necessarily those that collect the most, but those that customers trust the most.",
    ],
    glossary: [{ term: "asset", fr: "atout, actif" }, { term: "liability", fr: "passif, risque, charge" }, { term: "breach", fr: "faille, violation" }, { term: "fines", fr: "amendes" }, { term: "resent", fr: "mal supporter, en vouloir" }, { term: "plain language", fr: "langage clair" }],
    questions: [
      ["Why is customer data valuable?", ["It can be sold to anyone", "It helps personalise offers and improve products", "It reduces taxes"], 1, "Premier paragraphe."],
      ["How can data become a liability?", ["Through security breaches and fines", "By taking up too much space", "By attracting competitors"], 0, "Deuxième paragraphe."],
      ["What do many consumers accept?", ["Sharing data for a clear benefit", "Being tracked without explanation", "Paying for privacy"], 0, "Troisième paragraphe."],
      ["What is 'data minimisation'?", ["Collecting only what is genuinely needed", "Deleting all data", "Storing data abroad"], 0, "Quatrième paragraphe."],
      ["Which companies will benefit most according to the writer?", ["Those that collect the most data", "Those customers trust the most", "The largest companies"], 1, "Dernière phrase."],
    ],
    summaryPrompt: "Explain in 100 words why collecting less data can be a good business strategy.",
  }),
];
