import type { FreeTopic, PronunciationDrill, Scenario, ScenarioStep } from "./types";

type Step = [tutor: string, tutorFr: string, expect: string, minWords: number, hint: string, model: string];

/** `expect` : groupes séparés par « ; », variantes par « / ». */
function steps(list: Step[]): ScenarioStep[] {
  return list.map(([tutor, tutorFr, expect, minWords, hint, model]) => ({
    tutor,
    tutorFr,
    expect: expect ? expect.split(";").map((g) => g.split("/").map((x) => x.trim())) : [],
    minWords,
    hint,
    model,
  }));
}

export const SCENARIOS: Scenario[] = [
  {
    id: "introduce-yourself", title: "Se présenter", titleEn: "Introducing yourself", level: "A2", category: "social",
    goal: "Vous présenter : nom, ville, métier, loisirs, raisons d'apprendre l'anglais.",
    setting: "Vous rencontrez Alex, un collègue britannique, lors d'un événement.", tutorRole: "Alex, colleague from London",
    phrases: [{ en: "Nice to meet you.", fr: "Enchanté(e)." }, { en: "I'm from…", fr: "Je viens de…" }, { en: "I work as a…", fr: "Je travaille comme…" }, { en: "In my free time, I…", fr: "Pendant mon temps libre, je…" }],
    steps: steps([
      ["Hi! I don't think we've met. I'm Alex. What's your name?", "Salut ! Je crois qu'on ne s'est pas encore rencontrés. Moi c'est Alex. Comment tu t'appelles ?", "my name/i am/i'm/call me", 3, "Donnez votre prénom : « My name is… » / « I'm… ». Ajoutez « Nice to meet you ».", "Hi Alex, I'm Julie. Nice to meet you."],
      ["Nice to meet you too. Where are you from?", "Enchanté aussi. Tu viens d'où ?", "from/live/born", 4, "« I'm from… » + ville/pays. Vous pouvez ajouter où vous vivez maintenant.", "I'm from Lyon, but I live in Bordeaux now."],
      ["Oh, lovely. And what do you do?", "Ah, super. Et tu fais quoi dans la vie ?", "work/am a/i'm a/study/student/job/manager/engineer", 5, "« I work as a… » / « I'm a… » (n'oubliez pas a/an devant le métier).", "I'm a sales manager. I work for a wine company."],
      ["Interesting! What do you like doing in your free time?", "Intéressant ! Qu'est-ce que tu aimes faire pendant ton temps libre ?", "like/love/enjoy/play/go", 6, "« I like / I enjoy + -ing ».", "I enjoy running and I love cooking for my friends."],
      ["And why are you learning English?", "Et pourquoi apprends-tu l'anglais ?", "because/for/to/want/need", 6, "Utilisez « because » ou « to + verbe » : « I'm learning English to… ».", "I'm learning English because I want to work with international clients."],
    ]),
  },
  {
    id: "restaurant", title: "Commander au restaurant", titleEn: "Ordering at a restaurant", level: "A2", category: "daily",
    goal: "Réserver, commander, poser une question sur un plat et demander l'addition.",
    setting: "Vous dînez dans un restaurant à Londres.", tutorRole: "Waiter",
    phrases: [{ en: "Could I have…?", fr: "Pourrais-je avoir… ?" }, { en: "I'd like…", fr: "Je voudrais…" }, { en: "What do you recommend?", fr: "Que recommandez-vous ?" }, { en: "Could we have the bill, please?", fr: "L'addition, s'il vous plaît." }],
    steps: steps([
      ["Good evening! Do you have a reservation?", "Bonsoir ! Vous avez une réservation ?", "yes/no/reservation/table/booked/name", 4, "« Yes, a table for two under the name… » ou « No, do you have a table for two? »", "Yes, I booked a table for two under the name Martin."],
      ["Here's the menu. Can I get you something to drink?", "Voici la carte. Je vous sers quelque chose à boire ?", "like/have/could/please/water/wine/juice", 4, "« I'd like… » / « Could I have…, please? » — restez poli.", "I'd like a glass of red wine and some water, please."],
      ["Are you ready to order?", "Vous êtes prêt(e) à commander ?", "like/have/'ll have/will have/could", 5, "Commandez une entrée et un plat : « For the starter, I'll have… ».", "Yes, I'll have the soup as a starter and the chicken for the main course."],
      ["How would you like your steak? Oh sorry, you ordered chicken. Any allergies I should know about?", "Quelle cuisson pour le steak ? Ah pardon, vous avez pris le poulet. Des allergies à signaler ?", "allergic/allergies/no/nothing/yes", 3, "« I'm allergic to… » ou « No, no allergies, thanks. »", "No allergies, thank you. But I don't eat pork."],
      ["Did you enjoy your meal? Can I get you anything else?", "Le repas vous a plu ? Je vous apporte autre chose ?", "bill/check/delicious/enjoyed/thank", 5, "Faites un compliment et demandez l'addition : « Could we have the bill, please? »", "It was delicious, thank you. Could we have the bill, please?"],
    ]),
  },
  {
    id: "hotel-booking", title: "Réserver un hôtel", titleEn: "Booking a hotel room", level: "A2", category: "travel",
    goal: "Réserver une chambre par téléphone : dates, type de chambre, prix, petit déjeuner.",
    setting: "Vous appelez un hôtel à Dublin.", tutorRole: "Hotel receptionist",
    phrases: [{ en: "I'd like to book a room.", fr: "Je voudrais réserver une chambre." }, { en: "for three nights", fr: "pour trois nuits" }, { en: "Is breakfast included?", fr: "Le petit déjeuner est-il compris ?" }],
    steps: steps([
      ["Good morning, Riverside Hotel. How can I help you?", "Bonjour, Riverside Hotel. Que puis-je pour vous ?", "book/reserve/room", 5, "« I'd like to book a room, please. »", "Good morning. I'd like to book a room, please."],
      ["Certainly. For which dates?", "Bien sûr. Pour quelles dates ?", "from/to/until/nights/march/april/may/june/july/august/monday/friday", 5, "« From the 12th to the 15th of May » ou « for three nights from Friday ».", "From the 12th to the 15th of May, so three nights."],
      ["Would you like a single or a double room?", "Une chambre simple ou double ?", "single/double/twin", 3, "« A double room, please. »", "A double room, please, for two people."],
      ["That's 140 euros per night. Is that okay?", "C'est 140 euros la nuit. Ça vous va ?", "breakfast/included/okay/fine/yes/cheaper", 4, "Acceptez et posez une question : « Is breakfast included? »", "Yes, that's fine. Is breakfast included?"],
      ["Yes, breakfast is included. Could I have your name and email address?", "Oui, le petit déjeuner est inclus. Votre nom et votre adresse email ?", "name/is/email/my", 4, "Donnez votre nom et épelez si nécessaire : « My name is… It's spelt… »", "My name is Paul Bernard, and my email is paul.bernard@example.com."],
    ]),
  },
  {
    id: "airport", title: "À l'aéroport", titleEn: "At the airport", level: "A2", category: "travel",
    goal: "S'enregistrer, gérer un retard et demander des informations.",
    setting: "Vous êtes à l'aéroport de Manchester, votre vol est retardé.", tutorRole: "Airline agent",
    phrases: [{ en: "My flight has been delayed.", fr: "Mon vol a été retardé." }, { en: "Will I miss my connection?", fr: "Vais-je rater ma correspondance ?" }, { en: "aisle / window seat", fr: "place couloir / hublot" }],
    steps: steps([
      ["Hello. Can I see your passport and booking reference, please?", "Bonjour. Votre passeport et votre référence de réservation, s'il vous plaît ?", "here/is/passport", 3, "« Here you are. » / « Here's my passport. »", "Here you are. This is my passport and my booking reference."],
      ["Do you have any bags to check in?", "Avez-vous des bagages à enregistrer ?", "yes/no/bag/suitcase/one/only", 3, "« Just one suitcase » / « No, only hand luggage. »", "Yes, just one suitcase."],
      ["Would you prefer a window or an aisle seat?", "Préférez-vous une place hublot ou couloir ?", "window/aisle", 3, "« A window seat, please. »", "A window seat, please, if possible."],
      ["I'm afraid your flight is delayed by two hours.", "Je suis désolé, votre vol a deux heures de retard.", "connection/miss/what/can/when/compensation", 5, "Demandez les conséquences : « Will I miss my connection in Amsterdam? »", "Oh no. Will I miss my connection in Amsterdam?"],
      ["Don't worry, we've rebooked you on a later connection. Here's a voucher for a meal.", "Ne vous inquiétez pas, nous vous avons replacé sur une correspondance plus tardive. Voici un bon pour un repas.", "thank/thanks/where/kind", 3, "Remerciez et demandez où se trouve la porte d'embarquement.", "Thank you very much. Which gate does it leave from?"],
    ]),
  },
  {
    id: "friends-chat", title: "Discuter avec des amis", titleEn: "Catching up with a friend", level: "B1", category: "social",
    goal: "Raconter des nouvelles, une expérience passée et réagir avec naturel.",
    setting: "Vous retrouvez Sam, une amie canadienne, après plusieurs mois.", tutorRole: "Sam, an old friend",
    phrases: [{ en: "It's been ages!", fr: "Ça fait une éternité !" }, { en: "What have you been up to?", fr: "Qu'est-ce que tu deviens ?" }, { en: "You won't believe what happened…", fr: "Tu ne vas pas croire ce qui s'est passé…" }],
    steps: steps([
      ["Hey! It's been ages! How have you been?", "Hé ! Ça fait une éternité ! Comment ça va depuis ?", "good/great/fine/busy/been", 5, "Répondez au present perfect : « I've been really busy… »", "I've been great, thanks, but really busy with work."],
      ["What have you been up to lately?", "Qu'est-ce que tu as fait ces derniers temps ?", "have/started/been/moved/changed/joined", 8, "Present perfect pour des nouvelles récentes : « I've started… », « I've moved… »", "I've started a new job and I've also joined a running club."],
      ["Did you go anywhere nice this summer?", "Tu es allé(e) quelque part de sympa cet été ?", "went/visited/stayed/spent/didn't", 10, "Past simple : « I went to… We stayed… »", "Yes, I went to Portugal with my sister. We stayed in a small house by the sea."],
      ["That sounds amazing! What was the best part?", "Génial ! Qu'est-ce qui était le mieux ?", "best/was/because/loved", 8, "« The best part was… because… »", "The best part was the food. We ate fresh fish every day."],
      ["We should meet up more often. Are you free next weekend?", "On devrait se voir plus souvent. Tu es libre le week-end prochain ?", "yes/free/sure/saturday/sunday/busy/how about/let's", 6, "Acceptez et proposez un plan : « How about going to… ? »", "Sure, I'm free on Saturday. How about having brunch together?"],
    ]),
  },
  {
    id: "job-interview", title: "Entretien d'embauche", titleEn: "Job interview", level: "B1", category: "work",
    goal: "Parler de votre parcours, de vos qualités, d'une réussite et de vos motivations.",
    setting: "Entretien en visio avec une entreprise internationale.", tutorRole: "HR manager",
    phrases: [{ en: "I have X years of experience in…", fr: "J'ai X ans d'expérience dans…" }, { en: "One of my strengths is…", fr: "L'un de mes points forts est…" }, { en: "I'm particularly interested in…", fr: "Je suis particulièrement intéressé(e) par…" }],
    steps: steps([
      ["Thank you for joining us. Could you tell me a little about yourself?", "Merci d'être avec nous. Pourriez-vous vous présenter brièvement ?", "years/experience/worked/work/studied/i am/i'm", 15, "Parcours en 2-3 phrases : formation, expérience (present perfect), poste actuel.", "I studied business in Bordeaux and I've worked in sales for six years. I'm currently an account manager."],
      ["What would you say are your main strengths?", "Quels sont vos principaux points forts ?", "strength/i am/i'm/good at/able/organised/reliable", 12, "Donnez une qualité ET un exemple concret.", "One of my strengths is that I'm very organised. For example, I manage forty client accounts without missing deadlines."],
      ["Can you describe a challenge you faced at work and how you dealt with it?", "Décrivez une difficulté rencontrée au travail et comment vous l'avez gérée.", "was/had/decided/so/managed/result", 20, "Méthode STAR au past simple : situation, tâche, action, résultat.", "Last year, a major client was unhappy with our delays. I organised weekly calls and as a result, we kept the contract."],
      ["Why do you want to work for us?", "Pourquoi voulez-vous travailler chez nous ?", "because/interested/would like/want/opportunity", 12, "Motivation : l'entreprise + ce que vous apportez.", "I'm particularly interested in your international projects, and I'd like to use my languages and sales experience."],
      ["Do you have any questions for us?", "Avez-vous des questions ?", "?/what/how/could/would", 6, "Posez une vraie question : formation, équipe, prochaines étapes.", "Yes, could you tell me more about the team I would be working with?"],
    ]),
  },
  {
    id: "defend-opinion", title: "Défendre une opinion", titleEn: "Defending an opinion", level: "B1", category: "opinion",
    goal: "Donner un avis, le justifier, réagir à un contre-argument et conclure.",
    setting: "Débat amical : faut-il interdire les voitures dans le centre-ville ?", tutorRole: "Debate partner",
    phrases: [{ en: "In my opinion…", fr: "À mon avis…" }, { en: "I see your point, but…", fr: "Je comprends, mais…" }, { en: "That's why I think…", fr: "C'est pourquoi je pense…" }],
    steps: steps([
      ["Some people want to ban cars from city centres. What's your opinion?", "Certains veulent interdire les voitures en centre-ville. Quel est ton avis ?", "think/opinion/believe/agree/disagree", 10, "Annoncez clairement votre position : « In my opinion… / I think… ».", "In my opinion, it's a good idea, but only if public transport is good."],
      ["Why do you think that?", "Pourquoi penses-tu cela ?", "because/since/as/reason", 15, "Deux arguments reliés : « First… Moreover… ».", "First, because it reduces pollution. Moreover, the streets become safer and quieter for families."],
      ["But what about shops? They might lose customers.", "Et les commerces ? Ils pourraient perdre des clients.", "but/however/point/true/although", 15, "Concédez puis répondez : « I see your point, but… ».", "I see your point, but people walking or cycling often stop more often in local shops."],
      ["And elderly people who can't walk far?", "Et les personnes âgées qui ne peuvent pas beaucoup marcher ?", "could/should/would/solution/exception/buses/taxis", 12, "Proposez une solution avec could/should.", "That's true. The city should offer free shuttle buses and allow exceptions for people with disabilities."],
      ["So, to sum up, what's your final position?", "Alors, pour résumer, quelle est ta position finale ?", "to sum up/so/overall/in conclusion/all in all", 12, "Concluez avec un connecteur de conclusion.", "To sum up, I think we should reduce cars in the centre, but with good alternatives for everyone."],
    ]),
  },
  {
    id: "news-discussion", title: "Discuter de l'actualité", titleEn: "Discussing the news", level: "B2", category: "opinion",
    goal: "Résumer une information, nuancer, comparer avec votre pays et anticiper ses conséquences.",
    setting: "Conversation sur le télétravail et ses effets sur les villes.", tutorRole: "Journalist friend",
    phrases: [{ en: "From what I've read…", fr: "D'après ce que j'ai lu…" }, { en: "It's hard to say, but…", fr: "C'est difficile à dire, mais…" }, { en: "In the long run…", fr: "À long terme…" }],
    steps: steps([
      ["I've been reading that remote work is changing city centres. Have you noticed anything?", "J'ai lu que le télétravail transforme les centres-villes. Tu as remarqué quelque chose ?", "have/noticed/seen/seems/fewer/more/empty", 15, "Present perfect + observation concrète.", "Yes, I've noticed that some offices near my home are half empty, and a few cafés have closed."],
      ["Do you think it's a positive or a negative change?", "Selon toi, c'est un changement positif ou négatif ?", "both/positive/negative/on the one hand/on the other hand/however", 20, "Nuancez : les deux côtés avec on the one hand / on the other hand.", "On the one hand, people save time and money. On the other hand, local businesses suffer and teams may feel isolated."],
      ["How is the situation in France compared with other countries?", "Comment est la situation en France par rapport à d'autres pays ?", "france/compared/whereas/while/more/less/similar", 15, "Comparez avec whereas / compared with.", "In France, many companies allow two days a week, whereas in some countries fully remote jobs are more common."],
      ["What do you think will happen in the next ten years?", "Que va-t-il se passer selon toi dans les dix prochaines années ?", "will/might/could/probably/likely", 15, "Prévisions nuancées : will probably, might, is likely to.", "I think offices will probably become smaller, and some might be turned into flats."],
      ["Interesting. What should cities do about it?", "Intéressant. Que devraient faire les villes ?", "should/could/need to/ought to", 15, "Recommandations avec should / could.", "Cities should encourage mixed areas with housing, shops and coworking spaces so that centres stay lively."],
    ]),
  },

  /* ---------- Business ---------- */
  {
    id: "present-company", title: "Présenter une entreprise", titleEn: "Presenting a company", level: "B1", category: "business",
    goal: "Présenter une entreprise : activité, chiffres clés, clients, points forts.",
    setting: "Vous présentez votre entreprise (réelle ou imaginaire) à un partenaire potentiel.", tutorRole: "Potential partner",
    phrases: [{ en: "We specialise in…", fr: "Nous sommes spécialisés dans…" }, { en: "We were founded in…", fr: "Nous avons été fondés en…" }, { en: "Our main clients are…", fr: "Nos principaux clients sont…" }],
    steps: steps([
      ["Thanks for meeting me. So, what does your company do?", "Merci de me recevoir. Alors, que fait votre entreprise ?", "we/specialise/provide/offer/sell/company", 10, "« We specialise in… / We provide… for… »", "We specialise in renting and managing holiday flats for property owners."],
      ["How long have you been in business?", "Depuis combien de temps existez-vous ?", "since/for/founded/years/started", 8, "Present perfect + since/for, ou « We were founded in… ».", "We were founded in 2021, so we've been in business for about four years."],
      ["Who are your main customers?", "Qui sont vos principaux clients ?", "clients/customers/mainly/mostly/owners/companies", 10, "Décrivez votre cible avec mainly / mostly.", "Our clients are mainly private owners who don't have time to manage their properties."],
      ["What makes you different from your competitors?", "Qu'est-ce qui vous distingue de vos concurrents?", "unlike/different/than/more/better/only/our", 12, "Comparatifs + unique selling point.", "Unlike many competitors, we offer a monthly report and we are available seven days a week."],
      ["What are your plans for the next two years?", "Quels sont vos projets pour les deux prochaines années ?", "going to/plan/will/aim/hope/expand", 10, "Projets : going to, plan to, aim to.", "We're planning to expand to two other cities and to hire three new people."],
    ]),
  },
  {
    id: "team-meeting", title: "Participer à une réunion", titleEn: "Taking part in a meeting", level: "B2", category: "business",
    goal: "Donner un point d'avancement, exprimer un désaccord poliment et proposer une action.",
    setting: "Réunion d'équipe internationale en visio sur le lancement d'un produit.", tutorRole: "Project manager (chair)",
    phrases: [{ en: "Can I just come in here?", fr: "Puis-je intervenir ?" }, { en: "I'm not sure I agree.", fr: "Je ne suis pas sûr d'être d'accord." }, { en: "Shall we agree on…?", fr: "Pouvons-nous convenir de… ?" }],
    steps: steps([
      ["Let's start with updates. Where are you with the marketing campaign?", "Commençons par les points d'avancement. Où en êtes-vous de la campagne marketing ?", "have/finished/done/working/almost/still", 15, "Present perfect / continuous : ce qui est fait, ce qui reste.", "We've finished the visuals and we're still working on the social media plan. It should be ready by Friday."],
      ["Great. The sales team suggests launching two weeks earlier. What do you think?", "Super. L'équipe commerciale propose de lancer deux semaines plus tôt. Qu'en pensez-vous ?", "not sure/concern/i see/understand/however/but/risk", 15, "Désaccord diplomate : I see the point, but… / I'm a bit concerned that…", "I see the point, but I'm a bit concerned that we won't have enough time to test the campaign properly."],
      ["What would you propose instead?", "Que proposeriez-vous à la place ?", "could/suggest/propose/how about/what if/perhaps", 15, "Proposition : We could… / I'd suggest + -ing.", "I'd suggest launching a small pilot in one market first, and then launching everywhere on the original date."],
      ["That sounds reasonable. Who could take care of the pilot?", "Ça semble raisonnable. Qui pourrait s'occuper du pilote ?", "i can/i could/i will/i'll/happy to/take care", 8, "Portez-vous volontaire : « I'd be happy to take care of it. »", "I'd be happy to take care of it with Lisa from the sales team."],
      ["Perfect. Can you summarise the action points?", "Parfait. Pouvez-vous résumer les actions à mener ?", "so/first/will/by/then/to sum up", 15, "Résumé : who does what by when.", "So, I'll organise the pilot with Lisa by next Monday, and we'll share the results before the launch."],
    ]),
  },
  {
    id: "negotiate-contract", title: "Négocier un contrat", titleEn: "Negotiating a contract", level: "B2", category: "business",
    goal: "Négocier prix, volumes et conditions en restant ferme et courtois.",
    setting: "Vous achetez des services à un fournisseur qui vous présente son devis.", tutorRole: "Supplier sales director",
    phrases: [{ en: "If you could…, we would…", fr: "Si vous pouviez…, nous…" }, { en: "That's a bit higher than we expected.", fr: "C'est un peu plus élevé que prévu." }, { en: "Let's meet halfway.", fr: "Coupons la poire en deux." }],
    steps: steps([
      ["So, you've seen our quote. What do you think?", "Vous avez vu notre devis. Qu'en pensez-vous ?", "higher/expensive/expected/budget/price", 12, "Restez poli mais clair : « It's a bit higher than we expected. »", "Thank you. To be honest, it's a bit higher than we expected for our budget."],
      ["Our prices reflect the quality of our service. What figure did you have in mind?", "Nos prix reflètent la qualité de notre service. Quel montant aviez-vous en tête ?", "around/about/percent/%/lower/euros/thousand", 10, "Proposez un chiffre précis avec justification.", "We were thinking of around ten percent lower, especially as this is a long-term contract."],
      ["Ten percent is difficult. We could do five if you sign for two years.", "Dix pour cent, c'est difficile. Nous pourrions faire cinq si vous signez pour deux ans.", "if/would/could/agree/accept/provided", 15, "Conditionnel de négociation : « If you could…, we would… ».", "If you could include the training sessions, we would agree to a two-year contract at five percent."],
      ["Training would normally cost extra. What about payment terms?", "La formation est normalement en supplément. Et pour les conditions de paiement ?", "days/thirty/sixty/forty-five/45/60/30/terms", 10, "Négociez les délais : « We usually pay at 60 days. »", "We usually pay at sixty days. Could we meet halfway at forty-five?"],
      ["Forty-five days is acceptable. Shall we put that in writing?", "Quarante-cinq jours, c'est acceptable. On met cela par écrit ?", "yes/great/i will/i'll/send/summary/email", 10, "Concluez et proposez un écrit récapitulatif.", "Great. I'll send you an email summarising the terms we agreed today."],
    ]),
  },
  {
    id: "investor-pitch", title: "Présenter un projet à un investisseur", titleEn: "Pitching to an investor", level: "B2", category: "business",
    goal: "Présenter un projet : problème, solution, marché, besoin de financement.",
    setting: "Vous avez cinq minutes avec un business angel.", tutorRole: "Investor",
    phrases: [{ en: "The problem we're solving is…", fr: "Le problème que nous résolvons est…" }, { en: "Our target market is…", fr: "Notre marché cible est…" }, { en: "We're looking to raise…", fr: "Nous cherchons à lever…" }],
    steps: steps([
      ["You have five minutes. What problem are you solving?", "Vous avez cinq minutes. Quel problème résolvez-vous ?", "problem/difficult/hard/spend/lose/can't/cannot", 15, "Commencez par un problème concret de vrais clients.", "Many property owners lose money because they don't have time to manage short-term rentals properly."],
      ["And what's your solution?", "Et votre solution ?", "we/our/platform/service/offer/help", 15, "Solution claire, bénéfice pour le client.", "We offer a complete service: listing, guest communication and cleaning, with a transparent monthly report."],
      ["How big is your market?", "Quelle est la taille de votre marché ?", "market/thousand/owners/region/city/segment/estimate", 12, "Restez précis et prudent : « We estimate… in our region ».", "We're focusing on one city first. We estimate there are a few thousand owners in our segment, but we need to confirm this."],
      ["Why should I believe you can do it?", "Pourquoi devrais-je croire que vous en êtes capables ?", "experience/have/team/already/clients/since", 15, "Crédibilité : expérience, premiers résultats (sans inventer de chiffres).", "Our team has experience in hospitality and sales, and we have already signed our first clients."],
      ["How much are you looking for, and what will you use it for?", "Combien cherchez-vous, et pour quoi faire ?", "raise/looking for/need/use/spend/hire", 15, "Montant + utilisation précise.", "We're looking to raise 150,000 euros, mainly to hire two people and improve our booking software."],
    ]),
  },
  {
    id: "present-results", title: "Présenter des résultats financiers", titleEn: "Presenting financial results", level: "B2", category: "business",
    goal: "Décrire des chiffres, des évolutions et expliquer leurs causes.",
    setting: "Vous présentez les résultats trimestriels (fictifs) à votre direction.", tutorRole: "Board member",
    phrases: [{ en: "Revenue rose by…", fr: "Le chiffre d'affaires a augmenté de…" }, { en: "This is mainly due to…", fr: "Cela s'explique principalement par…" }, { en: "We expect…", fr: "Nous prévoyons…" }],
    steps: steps([
      ["Let's start. How did we do this quarter overall?", "Commençons. Comment s'est passé ce trimestre globalement ?", "rose/increased/grew/fell/decreased/went up/went down/by", 12, "Verbes de tendance + by + pourcentage.", "Overall, revenue rose by eight percent compared with the same quarter last year."],
      ["What drove that result?", "Qu'est-ce qui explique ce résultat ?", "due to/because/thanks to/driven/mainly", 12, "Causes : mainly due to / thanks to.", "This is mainly due to strong online sales and two new corporate clients."],
      ["And costs? I see the margin is lower.", "Et les coûts ? Je vois que la marge est plus faible.", "however/costs/because/due to/increase/higher", 15, "Expliquez honnêtement : however + cause.", "That's right. Our margin fell slightly because of higher energy and transport costs."],
      ["What are you doing about it?", "Que faites-vous pour y remédier ?", "we are/we're/we have/we've/plan/reduce/renegotiating/reducing/cutting", 15, "Actions en cours (present continuous / present perfect).", "We're renegotiating our transport contracts and we've reduced some overheads."],
      ["What's your forecast for next quarter?", "Quelle est votre prévision pour le prochain trimestre ?", "expect/forecast/should/likely/probably/cautious", 12, "Prévision prudente — aucune garantie.", "We expect stable sales, but we're cautious because demand is uncertain."],
    ]),
  },
  {
    id: "advise-client", title: "Conseiller un client", titleEn: "Advising a client", level: "B2", category: "business",
    goal: "Comprendre le besoin d'un client, poser des questions et recommander une solution sans promettre de résultat.",
    setting: "Un client hésite entre deux offres de votre entreprise.", tutorRole: "Hesitant client",
    phrases: [{ en: "May I ask what's most important to you?", fr: "Puis-je vous demander ce qui compte le plus pour vous ?" }, { en: "Based on what you've told me…", fr: "D'après ce que vous m'avez dit…" }, { en: "I can't guarantee…, but…", fr: "Je ne peux pas garantir…, mais…" }],
    steps: steps([
      ["I'm not sure which option to choose. They both look good.", "Je ne sais pas quelle option choisir. Elles ont l'air bien toutes les deux.", "what/?/how/important/need/could you", 8, "Posez une question ouverte sur ses besoins.", "I understand. May I ask what is most important to you: price, flexibility or support?"],
      ["Mainly flexibility. I travel a lot and my needs change every month.", "Surtout la flexibilité. Je voyage beaucoup et mes besoins changent chaque mois.", "based on/then/would/recommend/suggest/advise", 12, "Recommandation : Based on what you've told me, I'd recommend…", "Based on what you've told me, I'd recommend the flexible plan, because you can change it every month."],
      ["But it's more expensive, isn't it?", "Mais elle est plus chère, non ?", "yes/slightly/however/but/although/worth", 12, "Admettez puis justifiez la valeur.", "Yes, it's slightly more expensive. However, you won't pay any fees when you change your plan."],
      ["Can you guarantee I'll save money?", "Pouvez-vous me garantir que je vais économiser ?", "can't/cannot/guarantee/depends/however/but", 12, "Honnêteté : pas de garantie, expliquez de quoi cela dépend.", "I can't guarantee that, because it depends on how you use it. But I can show you a comparison based on last year."],
      ["Okay, that would help. What's the next step?", "D'accord, ça m'aiderait. Quelle est la prochaine étape ?", "will/'ll/send/next/call/email", 10, "Proposez une suite concrète.", "I'll send you the comparison today, and we can have a short call on Thursday to decide."],
    ]),
  },
  {
    id: "international-call", title: "Réunion internationale", titleEn: "International conference call", level: "B2", category: "business",
    goal: "Gérer une visio : se faire répéter, clarifier, reformuler et vérifier la compréhension.",
    setting: "Visio avec des collègues de Singapour, Toronto et Berlin.", tutorRole: "Colleague in Singapore",
    phrases: [{ en: "Sorry, you broke up. Could you repeat that?", fr: "Désolé, ça a coupé. Pouvez-vous répéter ?" }, { en: "Just to clarify, do you mean…?", fr: "Pour être sûr, vous voulez dire… ?" }, { en: "So if I understand correctly…", fr: "Si je comprends bien…" }],
    steps: steps([
      ["Hi everyone, can you all hear me? … Sorry, the connection is bad today.", "Bonjour à tous, vous m'entendez ? … Désolé, la connexion est mauvaise aujourd'hui.", "sorry/repeat/hear/broke up/again/could", 6, "Signalez le problème et demandez de répéter poliment.", "Sorry, you broke up a little. Could you repeat that, please?"],
      ["Sure. I said we need the figures by the end of the week, our time.", "Bien sûr. J'ai dit que nous avons besoin des chiffres d'ici la fin de semaine, heure locale.", "clarify/mean/do you mean/friday/which/time", 8, "Clarifiez : « Just to clarify, do you mean Friday, Singapore time? »", "Just to clarify, do you mean Friday evening, Singapore time?"],
      ["Yes, Friday 6 pm Singapore time. Is that feasible for your team?", "Oui, vendredi 18 h heure de Singapour. Est-ce faisable pour votre équipe ?", "yes/should/feasible/possible/but/however/morning", 10, "Calculez le décalage (Singapour = Paris + 6 ou 7 h) et répondez.", "That's 11 am in Paris, so it should be feasible, but it would be easier on Friday afternoon."],
      ["Okay, let's say Friday 9 pm Singapore time, then. Anything else?", "D'accord, disons vendredi 21 h heure de Singapour. Autre chose ?", "so/understand/correctly/summarise/means", 12, "Reformulez la décision pour vérifier.", "So if I understand correctly, we'll send the figures by 2 pm Paris time on Friday."],
      ["Exactly. Thanks, everyone. Talk next week!", "Exactement. Merci à tous. À la semaine prochaine !", "thank/thanks/bye/next week/talk", 4, "Clôturez poliment.", "Thanks, everyone. Have a good week, talk soon!"],
    ]),
  },
];

/* ---------- Conversation libre (mode hors IA) ---------- */

export const FREE_TOPICS: FreeTopic[] = [
  {
    id: "daily-life", title: "Ma vie quotidienne", level: "A2",
    questions: [
      "What does a typical day look like for you?",
      "What time do you usually get up, and why?",
      "How do you get to work or school?",
      "What do you usually have for lunch?",
      "What do you like doing in the evening?",
      "What did you do last weekend?",
    ],
  },
  {
    id: "travel", title: "Voyages", level: "A2",
    questions: [
      "What's the best trip you've ever taken?",
      "Do you prefer the beach or the mountains? Why?",
      "Where would you like to go next year?",
      "What do you always pack in your suitcase?",
      "Have you ever had a problem while travelling?",
    ],
  },
  {
    id: "work-life", title: "Travail et études", level: "B1",
    questions: [
      "What do you like most about your job or studies?",
      "What was your first job, and what did you learn from it?",
      "Would you prefer to work from home or in an office? Why?",
      "What skills would you like to develop in the next few years?",
      "Describe a colleague or teacher who inspired you.",
      "What would your dream job be, and why?",
    ],
  },
  {
    id: "technology", title: "Technologie", level: "B1",
    questions: [
      "How much time do you spend on your phone every day?",
      "Which app could you not live without? Why?",
      "Do you think social media makes people happier or less happy?",
      "How has technology changed the way you work?",
      "Should children have smartphones? At what age?",
    ],
  },
  {
    id: "society", title: "Société et opinions", level: "B2",
    questions: [
      "Do you think cities should be car-free? Why or why not?",
      "What are the advantages and disadvantages of living in a big city?",
      "Should university education be free for everyone?",
      "Is it the responsibility of individuals or governments to fight climate change?",
      "How will artificial intelligence change education?",
      "What would you change in your country's work culture?",
    ],
  },
  {
    id: "business", title: "Business et entrepreneuriat", level: "B2",
    questions: [
      "If you started a business, what would it be?",
      "What makes a good manager, in your opinion?",
      "How do you handle a difficult client or colleague?",
      "Is it better to work for a large company or a start-up?",
      "What is the most important quality for an entrepreneur?",
      "How should a company deal with negative online reviews?",
    ],
  },
];

/** Relances génériques utilisées par le professeur hors IA. */
export const FOLLOW_UPS = {
  short: ["Can you tell me a bit more?", "Why do you think that?", "Could you give me an example?", "How did that make you feel?"],
  good: ["That's interesting.", "I see what you mean.", "Good point.", "Thanks for sharing that."],
  reasons: ["What's the main reason for that?", "Do you think most people agree with you?", "Has your opinion changed over time?"],
};

/* ---------- Prononciation ---------- */

export const DRILLS: PronunciationDrill[] = [
  {
    id: "th", title: "Le son TH", focus: "/θ/ et /ð/",
    explanation: "Placez le bout de la langue entre les dents et soufflez. /θ/ est sourd (think), /ð/ est sonore (this). Ne remplacez pas par « s » ou « z ».",
    pairs: [["think", "sink"], ["three", "free"], ["thank", "sank"], ["they", "day"], ["with", "wiz"]],
    sentences: ["I think there are three things to do.", "Thank you for the weather report.", "This is the other one."],
  },
  {
    id: "short-long-i", title: "I court / I long", focus: "/ɪ/ et /iː/",
    explanation: "/ɪ/ (ship) est court et relâché ; /iː/ (sheep) est long et tendu, comme un « i » français prolongé.",
    pairs: [["ship", "sheep"], ["live", "leave"], ["bit", "beat"], ["fill", "feel"], ["sit", "seat"]],
    sentences: ["Please sit in this seat.", "I live here, but I'll leave soon.", "Fill in the form if you feel ready."],
  },
  {
    id: "h-sound", title: "Le H aspiré", focus: "/h/",
    explanation: "En anglais, le h se prononce presque toujours : expirez comme pour faire de la buée sur une vitre. Exceptions : hour, honest, honour.",
    pairs: [["hair", "air"], ["heat", "eat"], ["hold", "old"], ["hand", "and"]],
    sentences: ["How are you? Happy holidays!", "He has a house on the hill.", "I'll be here in an hour, honestly."],
  },
  {
    id: "word-stress", title: "L'accent de mot", focus: "syllabe accentuée",
    explanation: "Chaque mot anglais a une syllabe accentuée, plus forte et plus longue. Une erreur d'accent gêne plus la compréhension qu'un son imparfait.",
    sentences: ["PHOtograph, phoTOgrapher, photoGRAPHic.", "I'd like to deVElop my comMUnication skills.", "The ecoNOmy is a comPLEX TOpic."],
  },
  {
    id: "ed-endings", title: "Les terminaisons -ed", focus: "/t/, /d/, /ɪd/",
    explanation: "-ed se prononce /ɪd/ seulement après t ou d (wanted, needed). Sinon /t/ (worked, stopped) ou /d/ (played, called). Jamais « é ».",
    pairs: [["worked", "wanted"], ["played", "needed"], ["stopped", "started"]],
    sentences: ["I worked late and watched a film.", "She wanted to visit and needed a map.", "We played, laughed and talked all night."],
  },
  {
    id: "w-v", title: "W et V", focus: "/w/ et /v/",
    explanation: "/w/ : lèvres arrondies, comme « ou » rapide (west). /v/ : dents du haut sur la lèvre inférieure (vest).",
    pairs: [["west", "vest"], ["wine", "vine"], ["wet", "vet"], ["while", "vile"]],
    sentences: ["We visited a very old winery.", "What will you wear on Wednesday?", "Victor works in a village near Woking."],
  },
  {
    id: "linking", title: "Liaisons et rythme", focus: "connected speech",
    explanation: "Les natifs relient les mots : « turn_it_off », « an_apple », et réduisent les petits mots (to → /tə/, and → /ən/). Imiter ce rythme améliore aussi la compréhension orale.",
    sentences: ["Can I have a cup of tea?", "What do you want to do?", "Turn it off and on again."],
  },
  {
    id: "business-phrases", title: "Phrases de réunion", focus: "fluidité professionnelle",
    explanation: "Répétez ces formules jusqu'à les dire sans réfléchir : elles vous donneront du temps pour penser pendant une réunion.",
    sentences: ["Could you clarify what you mean by that?", "I see your point, but I'm not entirely convinced.", "Let me get back to you on that by Friday.", "Shall we move on to the next item on the agenda?"],
  },
];
