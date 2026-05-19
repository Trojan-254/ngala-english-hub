const express = require('express');
const router = express.Router();
const { getDb } = require('../database/database');
const { requireTeacher } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════
// GRAMMAR QUESTIONS
// ═══════════════════════════════════════════════════════════════

// GET all questions for a topic
router.get('/questions', requireTeacher, (req, res) => {
  const db = getDb();
  const { topic_id, module_slug } = req.query;

  let query = `
    SELECT q.*, t.title as topic_title, m.slug as module_slug
    FROM questions q
    JOIN topics t ON q.topic_id = t.id
    JOIN modules m ON t.module_id = m.id
    WHERE q.is_active = 1
  `;

  const params = [];
  if (topic_id) {
    query += ` AND q.topic_id = ?`;
    params.push(topic_id);
  }
  if (module_slug) {
    query += ` AND m.slug = ?`;
    params.push(module_slug);
  }

  query += ` ORDER BY q.created_at DESC`;

  const questions = db.prepare(query).all(...params);
  const parsed = questions.map(q => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : []
  }));

  res.json({ questions: parsed });
});

// POST — create a new question
router.post('/questions', requireTeacher, (req, res) => {
  const db = getDb();
  const {
    topic_id,
    question_text,
    question_type,
    options,
    correct_answer,
    explanation,
    xp_reward,
    difficulty,
    source,
    curriculum,
    max_marks
  } = req.body;

  if (!topic_id || !question_text || !question_type) {
    return res.status(400).json({ error: 'topic_id, question_text and question_type are required' });
  }

  if (question_type === 'mcq' && (!options || options.length < 2)) {
    return res.status(400).json({ error: 'MCQ questions require at least 2 options' });
  }

  if (question_type === 'mcq' && !correct_answer) {
    return res.status(400).json({ error: 'MCQ questions require a correct_answer' });
  }

  const result = db.prepare(`
    INSERT INTO questions
      (topic_id, question_text, question_type, options, correct_answer, explanation,
       xp_reward, difficulty, source, curriculum, max_marks, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    topic_id,
    question_text.trim(),
    question_type,
    options ? JSON.stringify(options) : null,
    correct_answer || null,
    explanation ? explanation.trim() : null,
    xp_reward || 10,
    difficulty || 1,
    source || null,
    curriculum || 'both',
    max_marks || null
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    message: 'Question created successfully'
  });
});

// PUT — edit a question
router.put('/questions/:id', requireTeacher, (req, res) => {
  const db = getDb();
  const {
    question_text,
    question_type,
    options,
    correct_answer,
    explanation,
    xp_reward,
    difficulty,
    source,
    curriculum,
    max_marks
  } = req.body;

  const existing = db.prepare(`SELECT id FROM questions WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Question not found' });

  db.prepare(`
    UPDATE questions SET
      question_text  = ?,
      question_type  = ?,
      options        = ?,
      correct_answer = ?,
      explanation    = ?,
      xp_reward      = ?,
      difficulty     = ?,
      source         = ?,
      curriculum     = ?,
      max_marks      = ?
    WHERE id = ?
  `).run(
    question_text,
    question_type,
    options ? JSON.stringify(options) : null,
    correct_answer || null,
    explanation || null,
    xp_reward || 10,
    difficulty || 1,
    source || null,
    curriculum || 'both',
    max_marks || null,
    req.params.id
  );

  res.json({ message: 'Question updated successfully' });
});

// DELETE — soft delete
router.delete('/questions/:id', requireTeacher, (req, res) => {
  const db = getDb();
  db.prepare(`UPDATE questions SET is_active = 0 WHERE id = ?`).run(req.params.id);
  res.json({ message: 'Question deleted successfully' });
});

// ═══════════════════════════════════════════════════════════════
// PASSAGES (Reading Comprehension)
// ═══════════════════════════════════════════════════════════════

router.get('/passages', requireTeacher, (req, res) => {
  const db = getDb();
  const { topic_id } = req.query;

  let query = `
    SELECT p.*, t.title as topic_title,
      COUNT(pq.id) as question_count
    FROM passages p
    JOIN topics t ON p.topic_id = t.id
    LEFT JOIN passage_questions pq ON pq.passage_id = p.id
    WHERE p.is_active = 1
  `;

  const params = [];
  if (topic_id) {
    query += ` AND p.topic_id = ?`;
    params.push(topic_id);
  }

  query += ` GROUP BY p.id ORDER BY p.created_at DESC`;

  const passages = db.prepare(query).all(...params);
  res.json({ passages });
});

router.post('/passages', requireTeacher, (req, res) => {
  const db = getDb();
  const { topic_id, title, content, difficulty, source, curriculum } = req.body;

  if (!topic_id || !title || !content) {
    return res.status(400).json({ error: 'topic_id, title and content are required' });
  }

  const wordCount = content.trim().split(/\s+/).length;

  const result = db.prepare(`
    INSERT INTO passages
      (topic_id, title, content, word_count, difficulty, source, curriculum, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    topic_id,
    title.trim(),
    content.trim(),
    wordCount,
    difficulty || 1,
    source || null,
    curriculum || 'both'
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    word_count: wordCount,
    message: 'Passage created successfully'
  });
});

router.put('/passages/:id', requireTeacher, (req, res) => {
  const db = getDb();
  const { title, content, difficulty, source, curriculum } = req.body;

  const wordCount = content ? content.trim().split(/\s+/).length : null;

  db.prepare(`
    UPDATE passages SET
      title      = COALESCE(?, title),
      content    = COALESCE(?, content),
      word_count = COALESCE(?, word_count),
      difficulty = COALESCE(?, difficulty),
      source     = COALESCE(?, source),
      curriculum = COALESCE(?, curriculum)
    WHERE id = ?
  `).run(title, content, wordCount, difficulty, source, curriculum, req.params.id);

  res.json({ message: 'Passage updated successfully' });
});

router.delete('/passages/:id', requireTeacher, (req, res) => {
  const db = getDb();
  db.prepare(`UPDATE passages SET is_active = 0 WHERE id = ?`).run(req.params.id);
  res.json({ message: 'Passage deleted' });
});

// Passage questions
router.post('/passages/:id/questions', requireTeacher, (req, res) => {
  const db = getDb();
  const {
    question_text,
    question_type,
    options,
    correct_answer,
    explanation,
    xp_reward,
    sort_order,
    max_marks
  } = req.body;

  if (!question_text || !question_type) {
    return res.status(400).json({ error: 'question_text and question_type are required' });
  }

  const result = db.prepare(`
    INSERT INTO passage_questions
      (passage_id, question_text, question_type, options, correct_answer,
       explanation, xp_reward, sort_order, max_marks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.id,
    question_text.trim(),
    question_type,
    options ? JSON.stringify(options) : null,
    correct_answer || null,
    explanation || null,
    xp_reward || 15,
    sort_order || 0,
    max_marks || null
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    message: 'Question added to passage'
  });
});

router.delete('/passages/:passageId/questions/:questionId', requireTeacher, (req, res) => {
  const db = getDb();
  db.prepare(`DELETE FROM passage_questions WHERE id = ? AND passage_id = ?`)
    .run(req.params.questionId, req.params.passageId);
  res.json({ message: 'Question deleted' });
});

// ═══════════════════════════════════════════════════════════════
// PAST PAPERS
// ═══════════════════════════════════════════════════════════════

router.get('/past-papers', requireTeacher, (req, res) => {
  const db = getDb();

  const papers = db.prepare(`
    SELECT pp.*,
      COUNT(q.id) as question_count,
      SUM(CASE WHEN q.question_type = 'mcq' THEN 1 ELSE 0 END) as mcq_count,
      SUM(CASE WHEN q.question_type != 'mcq' THEN 1 ELSE 0 END) as open_count
    FROM past_papers pp
    LEFT JOIN topics t ON t.title LIKE '%' || pp.year || '%'
    LEFT JOIN questions q ON q.topic_id = t.id AND q.past_paper_id = pp.id
    WHERE pp.is_active = 1
    GROUP BY pp.id
    ORDER BY pp.year DESC, pp.paper_number ASC
  `).all();

  res.json({ papers });
});

router.post('/past-papers', requireTeacher, (req, res) => {
  const db = getDb();
  const { title, year, paper_number, subject, description, duration_minutes } = req.body;

  if (!title || !year || !paper_number) {
    return res.status(400).json({ error: 'title, year and paper_number are required' });
  }

  const result = db.prepare(`
    INSERT INTO past_papers (title, year, paper_number, subject, description, duration_minutes, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(
    title.trim(),
    year,
    paper_number,
    subject || 'English',
    description || null,
    duration_minutes || 150
  );

  // Auto-create a topic for this paper so questions can be linked
  const topicResult = db.prepare(`
    INSERT OR IGNORE INTO topics
      (module_id, title, description, curriculum, difficulty, sort_order)
    VALUES (
      (SELECT id FROM modules WHERE slug = 'pastpapers'),
      ?, ?, '844', 2, ?
    )
  `).run(
    title.trim(),
    description || `${title} questions`,
    year
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    topic_id: topicResult.lastInsertRowid,
    message: 'Past paper created successfully'
  });
});

router.delete('/past-papers/:id', requireTeacher, (req, res) => {
  const db = getDb();
  db.prepare(`UPDATE past_papers SET is_active = 0 WHERE id = ?`).run(req.params.id);
  res.json({ message: 'Paper deleted' });
});

// Add question to past paper
router.post('/past-papers/:id/questions', requireTeacher, (req, res) => {
  const db = getDb();
  const {
    question_text,
    question_type,
    options,
    correct_answer,
    explanation,
    difficulty,
    source,
    xp_reward,
    max_marks
  } = req.body;

  if (!question_text || !question_type) {
    return res.status(400).json({ error: 'question_text and question_type are required' });
  }

  // Get or create the topic for this paper
  const paper = db.prepare(`SELECT * FROM past_papers WHERE id = ?`).get(req.params.id);
  if (!paper) return res.status(404).json({ error: 'Past paper not found' });

  let topic = db.prepare(`
    SELECT id FROM topics
    WHERE module_id = (SELECT id FROM modules WHERE slug = 'pastpapers')
      AND title = ?
  `).get(paper.title);

  if (!topic) {
    const t = db.prepare(`
      INSERT INTO topics (module_id, title, curriculum, difficulty, sort_order)
      VALUES ((SELECT id FROM modules WHERE slug = 'pastpapers'), ?, '844', 2, ?)
    `).run(paper.title, paper.year);
    topic = { id: t.lastInsertRowid };
  }

  const result = db.prepare(`
    INSERT INTO questions
      (topic_id, past_paper_id, question_text, question_type, options,
       correct_answer, explanation, xp_reward, difficulty, source,
       curriculum, max_marks, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '844', ?, 1)
  `).run(
    topic.id,
    req.params.id,
    question_text.trim(),
    question_type,
    options ? JSON.stringify(options) : null,
    correct_answer || null,
    explanation || null,
    xp_reward || 20,
    difficulty || 2,
    source || paper.title,
    max_marks || null
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    message: 'Question added to past paper'
  });
});

// ═══════════════════════════════════════════════════════════════
// VOCABULARY
// ═══════════════════════════════════════════════════════════════

router.get('/vocabulary', requireTeacher, (req, res) => {
  const db = getDb();
  const { topic_id } = req.query;

  let query = `SELECT v.*, t.title as topic_title FROM vocabulary v
    LEFT JOIN topics t ON t.id = ?
    WHERE v.is_active = 1`;

  const params = [topic_id || null];
  if (topic_id) {
    query += ` AND v.topic_tag = (SELECT title FROM topics WHERE id = ?)`;
    params.push(topic_id);
  }

  query += ` ORDER BY v.created_at DESC LIMIT 100`;

  const words = db.prepare(query).all(...params);
  res.json({ words });
});

router.post('/vocabulary', requireTeacher, (req, res) => {
  const db = getDb();
  const {
    word,
    definition,
    part_of_speech,
    example_sentence,
    synonym,
    antonym,
    difficulty,
    topic_tag,
    curriculum
  } = req.body;

  if (!word || !definition || !part_of_speech || !example_sentence) {
    return res.status(400).json({
      error: 'word, definition, part_of_speech and example_sentence are required'
    });
  }

  const existing = db.prepare(`SELECT id FROM vocabulary WHERE word = ?`).get(word.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'This word already exists in the vocabulary bank' });
  }

  const result = db.prepare(`
    INSERT INTO vocabulary
      (word, definition, part_of_speech, example_sentence, synonym, antonym,
       difficulty, topic_tag, curriculum, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    word.toLowerCase().trim(),
    definition.trim(),
    part_of_speech.trim(),
    example_sentence.trim(),
    synonym || null,
    antonym || null,
    difficulty || 1,
    topic_tag || 'academic',
    curriculum || 'both'
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    message: 'Word added to vocabulary bank'
  });
});

router.put('/vocabulary/:id', requireTeacher, (req, res) => {
  const db = getDb();
  const {
    word, definition, part_of_speech, example_sentence,
    synonym, antonym, difficulty, topic_tag, curriculum
  } = req.body;

  db.prepare(`
    UPDATE vocabulary SET
      word            = COALESCE(?, word),
      definition      = COALESCE(?, definition),
      part_of_speech  = COALESCE(?, part_of_speech),
      example_sentence = COALESCE(?, example_sentence),
      synonym         = COALESCE(?, synonym),
      antonym         = COALESCE(?, antonym),
      difficulty      = COALESCE(?, difficulty),
      topic_tag       = COALESCE(?, topic_tag),
      curriculum      = COALESCE(?, curriculum)
    WHERE id = ?
  `).run(
    word, definition, part_of_speech, example_sentence,
    synonym, antonym, difficulty, topic_tag, curriculum,
    req.params.id
  );

  res.json({ message: 'Word updated' });
});

router.delete('/vocabulary/:id', requireTeacher, (req, res) => {
  const db = getDb();
  db.prepare(`UPDATE vocabulary SET is_active = 0 WHERE id = ?`).run(req.params.id);
  res.json({ message: 'Word deleted' });
});

// ═══════════════════════════════════════════════════════════════
// OPEN-ENDED MARKING QUEUE
// ═══════════════════════════════════════════════════════════════

// Get all pending open-ended answers for teacher to mark
router.get('/marking-queue', requireTeacher, (req, res) => {
  const db = getDb();
  const { status = 'pending' } = req.query;

  const queue = db.prepare(`
    SELECT
      a.id as attempt_id,
      a.open_answer,
      a.marking_status,
      a.marks_awarded,
      a.max_marks,
      a.teacher_feedback,
      a.created_at,
      u.display_name as student_name,
      u.class_group,
      q.question_text,
      q.explanation as model_answer,
      q.max_marks as question_max_marks,
      pp.title as paper_title
    FROM attempts a
    JOIN users u ON a.user_id = u.id
    JOIN questions q ON a.question_id = q.id
    LEFT JOIN past_papers pp ON q.past_paper_id = pp.id
    WHERE a.marking_status = ?
      AND a.open_answer IS NOT NULL
    ORDER BY a.created_at ASC
  `).all(status);

  res.json({ queue });
});

// Submit marks for an open-ended answer
router.post('/marking-queue/:attemptId/mark', requireTeacher, (req, res) => {
  const db = getDb();
  const { marks_awarded, feedback } = req.body;

  if (marks_awarded === undefined) {
    return res.status(400).json({ error: 'marks_awarded is required' });
  }

  const attempt = db.prepare(`SELECT * FROM attempts WHERE id = ?`).get(req.params.attemptId);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

  const is_correct = attempt.max_marks
    ? marks_awarded >= attempt.max_marks * 0.5
    : marks_awarded > 0;

  const xp_earned = is_correct ? (marks_awarded * 2) : 0;

  db.prepare(`
    UPDATE attempts SET
      marks_awarded    = ?,
      teacher_feedback = ?,
      marking_status   = 'marked',
      is_correct       = ?,
      xp_earned        = ?
    WHERE id = ?
  `).run(marks_awarded, feedback || null, is_correct ? 1 : 0, xp_earned, req.params.attemptId);

  // Award XP to student
  if (xp_earned > 0) {
    db.prepare(`UPDATE users SET xp_total = xp_total + ? WHERE id = ?`)
      .run(xp_earned, attempt.user_id);

    db.prepare(`INSERT INTO xp_history (user_id, xp_change, reason) VALUES (?, ?, ?)`)
      .run(attempt.user_id, xp_earned, `Marked open answer — attempt ${req.params.attemptId}`);
  }

  res.json({ message: 'Answer marked successfully', xp_awarded: xp_earned });
});

module.exports = router;
