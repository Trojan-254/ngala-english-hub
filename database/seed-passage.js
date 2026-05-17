const { getDb } = require('./database');

const db = getDb();

console.log('Seeding passages...');

// ============ PASSAGE 1 — Narrative (Topic 16) ====================
const p1 = db.prepare(`
  INSERT OR IGNORE INTO passages
    (topic_id, title, content, word_count, difficulty, source, curriculum)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  16,
  'The Old Man and the River',
  `Mzee Kamau had lived by the river for seventy years. Every morning, before the sun climbed above the acacia trees, he would walk to the water's edge and sit on the smooth grey stone that had been his companion since childhood. The river spoke to him in a language that no school had ever taught — a language of rushing water, of fish breaking the surface, of reeds bending in the morning wind.

His grandchildren did not understand this. They had grown up in Nairobi, in a world of screens and noise, and when they visited during school holidays they would stand at the river's edge for exactly two minutes before returning to their phones. Mzee Kamau watched them and said nothing. He had learned, in seventy years, that some things cannot be taught. They can only be lived.

One morning, a young journalist from the city came to write about the river. She carried a recorder and a notebook and asked Mzee Kamau many questions about water levels and climate change and the future of the community. He answered her questions carefully and honestly. But when she asked him what the river meant to him, he was quiet for a long time.

Finally he said: "You are asking me what my mother means to me. I cannot answer that question with words. I can only show you by the way I sit here every morning, by the way I lower my eyes when I speak of her, by the way I will ask to be buried beside her when my time comes."

The journalist wrote this down. But Mzee Kamau suspected that when she returned to the city, the river would become, once again, just water.`,
  280, 2, 'Original — Ngala English Hub', 'both'
);

console.log('Passage 1 inserted:', p1.lastInsertRowid);

const p1Questions = [
  {
    question_text: 'How long had Mzee Kamau lived by the river?',
    options: JSON.stringify(['A. Fifty years', 'B. Sixty years', 'C. Seventy years', 'D. Eighty years']),
    correct_answer: 'C',
    explanation: 'The passage states explicitly in the first sentence that "Mzee Kamau had lived by the river for seventy years." This is a direct retrieval question — the answer is stated, not implied.',
    xp_reward: 15,
    sort_order: 1
  },
  {
    question_text: "What does Mzee Kamau's comparison of the river to his mother suggest about his relationship with it?",
    options: JSON.stringify([
      'A. He finds the river difficult to understand',
      'B. He has a deep emotional bond with the river that goes beyond words',
      'C. He is afraid of the river like a child fears a parent',
      'D. He believes the river is more important than his family'
    ]),
    correct_answer: 'B',
    explanation: 'When Mzee Kamau says "You are asking me what my mother means to me. I cannot answer that question with words," he conveys that his connection to the river is deeply emotional and personal — too profound to be reduced to a verbal explanation.',
    xp_reward: 15,
    sort_order: 2
  },
  {
    question_text: 'What does the phrase "the river would become, once again, just water" imply about the journalist?',
    options: JSON.stringify([
      'A. She would publish a dishonest article about the river',
      'B. She would forget everything Mzee Kamau told her',
      'C. She would understand the river intellectually but not emotionally',
      'D. She would return to the river with a different attitude'
    ]),
    correct_answer: 'C',
    explanation: 'Mzee Kamau suspects that despite writing down his words, the journalist will reduce the river to a mere physical object once she returns to the city. She can process information intellectually but lacks the lived experience to feel its deeper meaning.',
    xp_reward: 15,
    sort_order: 3
  },
  {
    question_text: 'Which word best describes the tone of this passage?',
    options: JSON.stringify([
      'A. Angry and bitter',
      'B. Celebratory and joyful',
      'C. Reflective and melancholic',
      'D. Humorous and lighthearted'
    ]),
    correct_answer: 'C',
    explanation: 'The passage is written in a quiet, thoughtful register dealing with themes of generational disconnection and things that cannot be communicated across cultural divides. The mood is contemplative, tinged with gentle sadness — making "reflective and melancholic" the most accurate description.',
    xp_reward: 15,
    sort_order: 4
  }
];

// ============= PASSAGE 2 — Expository (Topic 17) ===============
const p2 = db.prepare(`
  INSERT OR IGNORE INTO passages
    (topic_id, title, content, word_count, difficulty, source, curriculum)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  17,
  'The Rise of Mobile Money in Kenya',
  `When mobile money services launched in Kenya in 2007, few predicted the transformation that would follow. Within a decade, more than three-quarters of Kenyan adults were using their phones to send, receive, and save money — a quiet revolution that bypassed traditional banks entirely.

The success of mobile money rests on a simple insight: most Kenyans had phones long before they had bank accounts. By turning every phone into a wallet and every small shop into an agent, providers built a financial network that reached even the most remote villages. A grandmother in Turkana could now receive school fees from her son in Mombasa within seconds.

The ripple effects have been profound. Small businesses pay suppliers without carrying cash. Farmers receive payments instantly at the market. Even informal savings groups now operate digitally. Yet the system is not without its critics. Fraud and high transaction fees remain persistent concerns, and rural users sometimes struggle when network coverage falters.

Still, the Kenyan model has become a global case study, copied from Tanzania to India. It is a reminder that powerful innovation does not always come from rich economies — sometimes it grows where the need is greatest.`,
  210, 2, 'Original — Ngala English Hub', 'both'
);

console.log('Passage 2 inserted:', p2.lastInsertRowid);

const p2Questions = [
  {
    question_text: 'According to the passage, what was the key insight behind the success of mobile money?',
    options: JSON.stringify([
      'A. Kenyans preferred digital payments over cash',
      'B. Most Kenyans had phones before they had bank accounts',
      'C. Mobile money was cheaper than traditional banking',
      'D. The government supported mobile money from the start'
    ]),
    correct_answer: 'B',
    explanation: 'The passage states clearly: "most Kenyans had phones long before they had bank accounts." This was the fundamental insight that drove the mobile money model — meeting people where they already were.',
    xp_reward: 15,
    sort_order: 1
  },
  {
    question_text: 'What is the main purpose of this passage?',
    options: JSON.stringify([
      'A. To argue that mobile money has caused more harm than good',
      'B. To explain how mobile money works technically',
      'C. To describe the impact and spread of mobile money in Kenya',
      'D. To compare Kenya with Tanzania and India'
    ]),
    correct_answer: 'C',
    explanation: 'This is an expository passage — it informs the reader about the origins, spread, impact, and limitations of mobile money in Kenya. It neither argues strongly for or against it, nor focuses primarily on technical mechanisms.',
    xp_reward: 15,
    sort_order: 2
  },
  {
    question_text: 'Which of the following best describes the author\'s attitude toward mobile money?',
    options: JSON.stringify([
      'A. Strongly critical',
      'B. Enthusiastically celebratory',
      'C. Balanced and informative',
      'D. Confused and uncertain'
    ]),
    correct_answer: 'C',
    explanation: 'The author presents both the benefits (financial inclusion, speed, reach) and the drawbacks (fraud, high fees, network problems) without taking a strong personal stance. This balanced approach is characteristic of expository writing.',
    xp_reward: 15,
    sort_order: 3
  }
];

// ─── PASSAGE 3 — Argumentative (Topic 18) ────────────────────
const p3 = db.prepare(`
  INSERT OR IGNORE INTO passages
    (topic_id, title, content, word_count, difficulty, source, curriculum)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  18,
  'Save the Coral Reefs Before It Is Too Late',
  `The coral reefs of the Western Indian Ocean are dying, and the timeline for action is shorter than most policymakers admit. Rising sea temperatures, ocean acidification, and unsustainable fishing have combined to push these ecosystems towards collapse within our lifetimes.

It is tempting to view the crisis as distant — a problem for marine biologists and tourist operators. This view is dangerously wrong. Reefs protect coastlines from storm surges, support fisheries that feed millions, and underpin the tourism economies of countries from Kenya to Mozambique. Their loss would not be ecological alone; it would be social and economic, hitting hardest the communities least responsible for the warming oceans.

Critics argue that conservation costs are too high for developing economies. But the cost of inaction is higher still. Replacing the natural barrier of a healthy reef with engineered sea walls would cost billions, and even then would offer only partial protection. Investment in marine protected areas and locally managed fisheries has, by contrast, shown rapid returns — both ecologically and economically.

We cannot reverse decades of warming overnight. But we can decide whether to act while there is still a reef left to save.`,
  220, 3, 'Original — Ngala English Hub', 'both'
);

console.log('Passage 3 inserted:', p3.lastInsertRowid);

const p3Questions = [
  {
    question_text: 'What is the main argument of this passage?',
    options: JSON.stringify([
      'A. Coral reefs are beautiful and should be protected for tourism',
      'B. Developing countries cannot afford to protect coral reefs',
      'C. Urgent action must be taken to save coral reefs before they are lost',
      'D. Scientists have exaggerated the threat to coral reefs'
    ]),
    correct_answer: 'C',
    explanation: 'The entire passage builds toward the final call to action: "we can decide whether to act while there is still a reef left to save." Every paragraph supports this central argument — that the crisis is real, the consequences are severe, and action is still possible.',
    xp_reward: 15,
    sort_order: 1
  },
  {
    question_text: 'How does the author counter the argument that conservation is too expensive?',
    options: JSON.stringify([
      'A. By saying that rich countries should pay for conservation',
      'B. By arguing that inaction would cost even more in the long run',
      'C. By claiming that conservation has no cost at all',
      'D. By ignoring the argument and changing the subject'
    ]),
    correct_answer: 'B',
    explanation: 'The author directly addresses this counterargument: "the cost of inaction is higher still." They support this by noting that engineered sea walls would cost billions and offer only partial protection, while marine protected areas have shown rapid returns.',
    xp_reward: 15,
    sort_order: 2
  },
  {
    question_text: 'The phrase "hitting hardest the communities least responsible for the warming oceans" suggests that:',
    options: JSON.stringify([
      'A. Poor communities caused the ocean warming and must fix it',
      'B. The communities most affected by reef loss contributed least to climate change',
      'C. Wealthy nations will suffer most from coral reef destruction',
      'D. Local communities should be blamed for overfishing'
    ]),
    correct_answer: 'B',
    explanation: 'This phrase highlights the injustice at the heart of the climate crisis: the communities in developing coastal nations who did little to cause global warming will suffer the worst consequences of reef destruction. This is a common argumentative technique — appealing to fairness.',
    xp_reward: 15,
    sort_order: 3
  }
];

// ─── INSERT ALL QUESTIONS ─────────────────────────────────────
const insertQ = db.prepare(`
  INSERT OR IGNORE INTO passage_questions
    (passage_id, question_text, question_type, options, correct_answer, explanation, xp_reward, sort_order)
  VALUES (?, 'mcq', ?, ?, ?, ?, ?, ?)
`);

// Fix: correct column order
const insertQuestion = db.prepare(`
  INSERT OR IGNORE INTO passage_questions
    (passage_id, question_text, question_type, options, correct_answer, explanation, xp_reward, sort_order)
  VALUES (?, ?, 'mcq', ?, ?, ?, ?, ?)
`);

[
  { passageId: p1.lastInsertRowid, questions: p1Questions },
  { passageId: p2.lastInsertRowid, questions: p2Questions },
  { passageId: p3.lastInsertRowid, questions: p3Questions },
].forEach(({ passageId, questions }) => {
  questions.forEach(q => {
    const result = insertQuestion.run(
      passageId,
      q.question_text,
      q.options,
      q.correct_answer,
      q.explanation,
      q.xp_reward,
      q.sort_order
    );
    console.log(`  Question inserted: ${result.lastInsertRowid} for passage ${passageId}`);
  });
});

console.log('\nSeed complete. Passages and questions are ready.');

