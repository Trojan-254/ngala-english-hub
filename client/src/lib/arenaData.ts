export interface Topic {
  id: number;
  title: string;
  difficulty: 1 | 2 | 3;
  question_count: number;
  my_accuracy: number | null;
}

export interface Question {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  xp_reward: number;
}

export interface VocabCategory {
  id: number;
  name: string;
  total: number;
  mastered: number;
  due_today: number;
}

export interface VocabWord {
  id: number;
  word: string;
  definition: string;
  part_of_speech: string;
  example_sentence: string;
  synonym: string;
  antonym: string;
}

export interface Passage {
  id: number;
  title: string;
  type: string;
  content: string;
  word_count: number;
  difficulty: 1 | 2 | 3;
  question_count: number;
  completed: boolean;
  accuracy?: number;
}

export interface PastPaper {
  id: number;
  title: string;
  year: number;
  paper_number: 1 | 2;
  description: string;
  duration_minutes: number;
  question_count: number;
  attempted: boolean;
  score?: number;
  date_attempted?: string;
}

export const grammarTopics: Topic[] = [
  { id: 1, title: "Present Tenses", difficulty: 1, question_count: 12, my_accuracy: 82 },
  { id: 2, title: "Past Tenses", difficulty: 1, question_count: 12, my_accuracy: 71 },
  { id: 3, title: "Future Forms", difficulty: 2, question_count: 10, my_accuracy: 58 },
  { id: 4, title: "Articles (a/an/the)", difficulty: 1, question_count: 15, my_accuracy: 44 },
  { id: 5, title: "Subject–Verb Concord", difficulty: 2, question_count: 14, my_accuracy: 39 },
  { id: 6, title: "Prepositions", difficulty: 2, question_count: 18, my_accuracy: 62 },
  { id: 7, title: "Conditionals", difficulty: 3, question_count: 12, my_accuracy: null },
  { id: 8, title: "Reported Speech", difficulty: 3, question_count: 10, my_accuracy: 48 },
  { id: 9, title: "Active & Passive Voice", difficulty: 2, question_count: 12, my_accuracy: 67 },
  { id: 10, title: "Modal Verbs", difficulty: 2, question_count: 14, my_accuracy: null },
  { id: 11, title: "Phrasal Verbs", difficulty: 3, question_count: 16, my_accuracy: 55 },
  { id: 12, title: "Pronouns", difficulty: 1, question_count: 10, my_accuracy: 88 },
  { id: 13, title: "Adjectives & Adverbs", difficulty: 1, question_count: 12, my_accuracy: 76 },
  { id: 14, title: "Conjunctions", difficulty: 2, question_count: 12, my_accuracy: 64 },
  { id: 15, title: "Punctuation", difficulty: 1, question_count: 10, my_accuracy: null },
];

export const sampleQuestions: Question[] = [
  { id: 1, question_text: "She ___ to school every morning before sunrise.", options: ["walk", "walks", "walking", "is walk"], correct_answer: "walks", explanation: "With third-person singular subjects (he/she/it) in the simple present tense, the verb takes an -s ending.", xp_reward: 10 },
  { id: 2, question_text: "By the time we arrived, the match ___ already started.", options: ["has", "had", "have", "was"], correct_answer: "had", explanation: "Past perfect ('had + past participle') describes an action completed before another past action.", xp_reward: 10 },
  { id: 3, question_text: "Neither the teacher nor the students ___ ready for the exam.", options: ["was", "is", "were", "are"], correct_answer: "were", explanation: "With 'neither...nor', the verb agrees with the closer subject — 'students' (plural) → 'were'.", xp_reward: 10 },
  { id: 4, question_text: "If I ___ you, I would apologise immediately.", options: ["am", "was", "were", "be"], correct_answer: "were", explanation: "In the second conditional, we use 'were' for all subjects in the if-clause to express hypothetical situations.", xp_reward: 10 },
  { id: 5, question_text: "The book ___ on the table belongs to Amina.", options: ["lay", "lays", "lying", "laid"], correct_answer: "lying", explanation: "'Lying' is the present participle of 'lie' (to recline), used here as a reduced relative clause.", xp_reward: 10 },
];

export const vocabCategories: VocabCategory[] = [
  { id: 1, name: "Academic Words", total: 120, mastered: 45, due_today: 8 },
  { id: 2, name: "Idioms & Expressions", total: 80, mastered: 22, due_today: 5 },
  { id: 3, name: "KCSE High-Frequency", total: 200, mastered: 110, due_today: 0 },
  { id: 4, name: "Synonyms & Antonyms", total: 90, mastered: 30, due_today: 3 },
  { id: 5, name: "Confusing Pairs", total: 60, mastered: 18, due_today: 4 },
  { id: 6, name: "Coastal Kenyan Context", total: 50, mastered: 35, due_today: 0 },
];

export const vocabWords: VocabWord[] = [
  { id: 1, word: "Resilient", part_of_speech: "adjective", definition: "Able to recover quickly from difficulties; tough.", example_sentence: "The resilient fishing community rebuilt after the storm.", synonym: "Tough", antonym: "Fragile" },
  { id: 2, word: "Ubiquitous", part_of_speech: "adjective", definition: "Present, appearing, or found everywhere.", example_sentence: "Mobile money is ubiquitous in Kenya.", synonym: "Omnipresent", antonym: "Rare" },
  { id: 3, word: "Pragmatic", part_of_speech: "adjective", definition: "Dealing with things sensibly and realistically.", example_sentence: "She took a pragmatic approach to the problem.", synonym: "Practical", antonym: "Idealistic" },
  { id: 4, word: "Eloquent", part_of_speech: "adjective", definition: "Fluent and persuasive in speaking or writing.", example_sentence: "His eloquent speech moved the audience.", synonym: "Articulate", antonym: "Inarticulate" },
];

export const passages: Passage[] = [
  {
    id: 1, title: "The Mangrove Keepers", type: "Narrative", difficulty: 1, word_count: 320, question_count: 5, completed: true, accuracy: 75,
    content: "The mangrove forests along the Kenyan coast have stood for centuries, their tangled roots holding the shoreline together against the tireless tide. For Juma, a young fisherman from Gazi Bay, these trees were more than scenery — they were family.\n\nEvery morning before dawn, he paddled his small dhow through the narrow water channels carved between the mangroves. The roots brushed against the hull like outstretched fingers, and the smell of salt and damp earth filled the air. Juma had learned from his grandfather that the mangroves were nurseries — without them, the fish would vanish, and so would the fishermen.\n\nIn recent years, however, the forests had begun to thin. Outsiders came with axes for charcoal, and developers eyed the coastline for hotels. Juma joined a community group that planted seedlings each weekend, knee-deep in the warm mud. Slowly, painfully, the forest was returning. He sometimes wondered whether their efforts were enough — but every time he saw a young fish dart between the new shoots, he had his answer.",
  },
  {
    id: 2, title: "The Rise of Mobile Money", type: "Expository", difficulty: 2, word_count: 410, question_count: 6, completed: false,
    content: "When mobile money services launched in Kenya in 2007, few predicted the transformation that would follow. Within a decade, more than three-quarters of Kenyan adults were using their phones to send, receive, and save money — a quiet revolution that bypassed traditional banks entirely.\n\nThe success of mobile money rests on a simple insight: most Kenyans had phones long before they had bank accounts. By turning every phone into a wallet and every small shop into an agent, providers built a financial network that reached even the most remote villages. A grandmother in Turkana could now receive school fees from her son in Mombasa within seconds.\n\nThe ripple effects have been profound. Small businesses pay suppliers without carrying cash. Farmers receive payments instantly at the market. Even informal savings groups now operate digitally. Yet the system is not without its critics. Fraud and high transaction fees remain persistent concerns, and rural users sometimes struggle when network coverage falters.\n\nStill, the Kenyan model has become a global case study, copied from Tanzania to India. It is a reminder that powerful innovation does not always come from rich economies — sometimes it grows where the need is greatest.",
  },
  {
    id: 3, title: "Climate Change and the Coral Reefs", type: "Argumentative", difficulty: 3, word_count: 480, question_count: 7, completed: false,
    content: "The coral reefs of the Western Indian Ocean are dying, and the timeline for action is shorter than most policymakers admit. Rising sea temperatures, ocean acidification, and unsustainable fishing have combined to push these ecosystems towards collapse within our lifetimes.\n\nIt is tempting to view the crisis as distant — a problem for marine biologists and tourist operators. This view is dangerously wrong. Reefs protect coastlines from storm surges, support fisheries that feed millions, and underpin the tourism economies of countries from Kenya to Mozambique. Their loss would not be ecological alone; it would be social and economic, hitting hardest the communities least responsible for the warming oceans.\n\nCritics argue that conservation costs are too high for developing economies. But the cost of inaction is higher still. Replacing the natural barrier of a healthy reef with engineered sea walls would cost billions, and even then would offer only partial protection. Investment in marine protected areas and locally managed fisheries has, by contrast, shown rapid returns — both ecologically and economically.\n\nWe cannot reverse decades of warming overnight. But we can decide whether to act while there is still a reef left to save.",
  },
];

export const passageQuestions: Question[] = [
  { id: 101, question_text: "According to the passage, why are mangroves important to Juma's community?", options: ["They provide timber for boats", "They serve as nurseries for fish", "They attract tourists to the bay", "They are sacred religious sites"], correct_answer: "They serve as nurseries for fish", explanation: "The passage states 'the mangroves were nurseries — without them, the fish would vanish, and so would the fishermen.'", xp_reward: 15 },
  { id: 102, question_text: "What is the author's tone towards the conservation efforts?", options: ["Cynical", "Cautiously hopeful", "Indifferent", "Triumphant"], correct_answer: "Cautiously hopeful", explanation: "Words like 'slowly, painfully, the forest was returning' and Juma's wondering 'whether their efforts were enough' express cautious hope.", xp_reward: 15 },
];

export const pastPapers: PastPaper[] = [
  { id: 1, title: "KCSE 2023 · Paper 1", year: 2023, paper_number: 1, description: "Functional writing, cloze test, and oral skills.", duration_minutes: 150, question_count: 40, attempted: false },
  { id: 2, title: "KCSE 2023 · Paper 2", year: 2023, paper_number: 2, description: "Comprehension, literary appreciation, grammar.", duration_minutes: 150, question_count: 40, attempted: true, score: 64, date_attempted: "12 Apr" },
  { id: 3, title: "KCSE 2022 · Paper 1", year: 2022, paper_number: 1, description: "Functional writing, cloze test, and oral skills.", duration_minutes: 150, question_count: 40, attempted: false },
  { id: 4, title: "KCSE 2022 · Paper 2", year: 2022, paper_number: 2, description: "Comprehension, literary appreciation, grammar.", duration_minutes: 150, question_count: 40, attempted: false },
  { id: 5, title: "KCSE 2021 · Paper 1", year: 2021, paper_number: 1, description: "Functional writing, cloze test, and oral skills.", duration_minutes: 150, question_count: 40, attempted: true, score: 72, date_attempted: "28 Mar" },
];

export const moduleStats = {
  grammar: { attempts: 184, accuracy: 67, xp: 1240 },
  vocabulary: { attempts: 96, accuracy: 78, xp: 620 },
  comprehension: { attempts: 18, accuracy: 75, xp: 340 },
  pastpapers: { attempts: 2, accuracy: 68, xp: 250 },
};

export const accuracyColor = (acc: number | null): "primary" | "red" | "gold" | "green" => {
  if (acc === null) return "primary";
  if (acc < 50) return "red";
  if (acc <= 65) return "gold";
  return "green";
};
