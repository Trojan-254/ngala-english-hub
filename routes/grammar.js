/**
 * Grammar Module Routes
 * 
 * This module handles all routes related to the Grammar learning module, including:
 * - Fetching grammar topics
 * - Starting quiz sessions
 * - Submitting answers
 * - Calculating levels
 * - Getting user progress
 * 
 * All routes require authentication and are designed to work with the frontend's quiz flow and progress tracking.
 * 
 * Written by SAMWUEL SIMIYU(EB01/PU/40792/21). STUDENT TEACHER ON TEACHING PRACTICE FROM PWANI UNIVERSITY.
 */
const express = require('express');
const router = express.Router();
const { getDb } = require('../database/database');
const { requireAuth } = require('../middleware/auth');
const { evaluateAndAwardBadges } = require('../services/badgeEngine');

// =================== get topics ==================
// Returns all grammar topics, filtered by curriculum if provided
router.get('/topics', requireAuth, (req, res) => {
  const db = getDb();
  const { curriculum } = req.query;

  let query = `
    SELECT t.*,
      COUNT(DISTINCT q.id) as question_count,
      COUNT(DISTINCT a.id) as attempt_count,
      ROUND(SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(a.id), 0), 1) as my_accuracy
    FROM topics t
    LEFT JOIN questions q ON q.topic_id = t.id AND q.is_active = 1
    LEFT JOIN attempts a ON a.question_id = q.id AND a.user_id = ?
    WHERE t.module_id = (SELECT id FROM modules WHERE slug = 'grammar')
      AND t.is_active = 1
  `;

  const params = [req.user.id];

  if (curriculum) {
    query += ` AND (t.curriculum = ? OR t.curriculum = 'both')`;
    params.push(curriculum);
  }

  query += ` GROUP BY t.id ORDER BY t.sort_order ASC`;

  const topics = db.prepare(query).all(...params);
  res.json({ topics });
});

// ============= start session ================
// Creates a quiz session and returns questions for a topic
router.post('/session/start', requireAuth, (req, res) => {
  const db = getDb();
  const { topic_id, limit = 10 } = req.body;

  if (!topic_id) {
    return res.status(400).json({ error: 'topic_id is required' });
  }

  // Verify topic exists and belongs to grammar module
  const topic = db.prepare(`
    SELECT t.* FROM topics t
    JOIN modules m ON t.module_id = m.id
    WHERE t.id = ? AND m.slug = 'grammar' AND t.is_active = 1
  `).get(topic_id);

  if (!topic) {
    return res.status(404).json({ error: 'Topic not found' });
  }

  // Fetch questions — randomised, respect curriculum
  const questions = db.prepare(`
    SELECT id, question_text, question_type, options, difficulty, xp_reward
    FROM questions
    WHERE topic_id = ?
      AND is_active = 1
      AND (curriculum = ? OR curriculum = 'both')
    ORDER BY RANDOM()
    LIMIT ?
  `).all(topic_id, req.user.curriculum || 'both', Math.min(limit, 20));

  if (questions.length === 0) {
    return res.status(404).json({ error: 'No questions available for this topic' });
  }

  // Parse options JSON for each question
  const parsed = questions.map(q => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : []
  }));

  // Create quiz session record
  const session = db.prepare(`
    INSERT INTO quiz_sessions (user_id, module_slug, topic_id, total_q)
    VALUES (?, 'grammar', ?, ?)
  `).run(req.user.id, topic_id, parsed.length);

  res.json({
    session_id: session.lastInsertRowid,
    topic,
    questions: parsed
  });
});

// ================= submit answer =================
router.post('/answer', requireAuth, (req, res) => {
  const db = getDb();
  const { question_id, answer, session_id, time_taken_ms } = req.body;

  if (!question_id || answer === undefined || !session_id) {
    return res.status(400).json({ error: 'question_id, answer and session_id are required' });
  }

  // Get question with correct answer and explanation
  const question = db.prepare(`
    SELECT * FROM questions WHERE id = ? AND is_active = 1
  `).get(question_id);

  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  // Verify session belongs to this user
  const quizSession = db.prepare(`
    SELECT * FROM quiz_sessions WHERE id = ? AND user_id = ?
  `).get(session_id, req.user.id);

  if (!quizSession) {
    return res.status(403).json({ error: 'Invalid session' });
  }

  const is_correct = answer.toString().trim().toUpperCase() ===
    question.correct_answer.toString().trim().toUpperCase() ? 1 : 0;

  const previousCorrect = db.prepare(`
     SELECT id from attempts
     WHERE user.id = ? AND question_id = ? AND is_correct = 1
  `).get(req.user.id, question_id);

  // award only if this is the first attempt
  const xp_earned = (is_correct && !previousCorrect) ? question.xp_reward : 0;

  // Evaluate badges after every answer
  const newBadges = evaluateAndAwardBadges(req.user.id);

  res.json({
    is_correct: is_correct === 1,
    correct_answer: question.correct_answer,
    explanation: question.explanation,
    xp_earned,
    new_xp,
    new_level,
    levelled_up,
    new_badges: newBadges  
  });

  // Log the attempt
  db.prepare(`
    INSERT INTO attempts 
      (user_id, question_id, module_slug, answer_given, is_correct, time_taken_ms, xp_earned)
    VALUES (?, ?, 'grammar', ?, ?, ?, ?)
  `).run(req.user.id, question_id, answer.toString(), is_correct, time_taken_ms || null, xp_earned);

  // Award XP  correct attempt
  let new_xp = req.user.xp_total;
  let new_level = req.user.level;
  let levelled_up = false;

  if (is_correct && xp_earned > 0) {
    db.prepare(`
      UPDATE users SET xp_total = xp_total + ? WHERE id = ?
    `).run(xp_earned, req.user.id);

    db.prepare(`
      INSERT INTO xp_history (user_id, xp_change, reason)
      VALUES (?, ?, ?)
    `).run(req.user.id, xp_earned, `Correct answer — grammar question ${question_id}`);

    // Check level up
    const updated = db.prepare(`SELECT xp_total FROM users WHERE id = ?`).get(req.user.id);
    new_xp = updated.xp_total;
    new_level = calculateLevel(new_xp);

    if (new_level > req.user.level) {
      db.prepare(`UPDATE users SET level = ? WHERE id = ?`).run(new_level, req.user.id);
      levelled_up = true;
    }
  }

  // Update quiz session score
  db.prepare(`
    UPDATE quiz_sessions 
    SET score = score + ?,
        xp_earned = xp_earned + ?
    WHERE id = ?
  `).run(is_correct, xp_earned, session_id);

  // Emit leaderboard update via Socket.io
  const io = req.app.get('io');
  if (io && req.user.class_group) {
    const leaderboard = db.prepare(`
      SELECT display_name, weekly_xp, level
      FROM vw_weekly_leaderboard
      LIMIT 10
    `).all();
    io.to(req.user.class_group).emit('leaderboard:update', leaderboard);
  }

  res.json({
    is_correct: is_correct === 1,
    correct_answer: question.correct_answer,
    explanation: question.explanation,
    xp_earned,
    new_xp,
    new_level,
    levelled_up
  });
});

// ============= end session ================
router.post('/session/end', requireAuth, (req, res) => {
  const db = getDb();
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }

  const quizSession = db.prepare(`
    SELECT * FROM quiz_sessions WHERE id = ? AND user_id = ?
  `).get(session_id, req.user.id);

  if (!quizSession) {
    return res.status(403).json({ error: 'Invalid session' });
  }

  db.prepare(`
    UPDATE quiz_sessions 
    SET ended_at = datetime('now'), completed = 1
    WHERE id = ?
  `).run(session_id);

  const accuracy = quizSession.total_q > 0
    ? Math.round((quizSession.score / quizSession.total_q) * 100)
    : 0;

  res.json({
    score: quizSession.score,
    total: quizSession.total_q,
    accuracy,
    xp_earned: quizSession.xp_earned
  });
});

// ================ get progress =================
router.get('/progress', requireAuth, (req, res) => {
  const db = getDb();

  const progress = db.prepare(`
    SELECT * FROM vw_student_module_progress
    WHERE user_id = ? AND module_slug = 'grammar'
  `).get(req.user.id);

  const topicBreakdown = db.prepare(`
  SELECT
    t.title as topic,
    t.id as topic_id,
    COUNT(a.id) as attempts,
    SUM(a.is_correct) as correct,
    ROUND(SUM(a.is_correct) * 100.0 / COUNT(a.id), 1) as accuracy_pct
  FROM attempts a
  JOIN questions q ON a.question_id = q.id
  JOIN topics t ON q.topic_id = t.id
  WHERE a.user_id = ?
    AND a.module_slug = 'grammar'
    AND a.is_correct IS NOT NULL
  GROUP BY t.id
  HAVING attempts >= 3
    AND accuracy_pct < 70
  ORDER BY accuracy_pct ASC
  LIMIT 5
`).all(req.user.id);

  res.json({ progress, topic_breakdown: topicBreakdown });
});

// ============ level calculator ===========
function calculateLevel(xp) {
  if (xp >= 10000) return 5; // Griot
  if (xp >= 3000)  return 4; // Scholar
  if (xp >= 1000)  return 3; // Wordsmith
  if (xp >= 300)   return 2; // Scribe
  return 1;                  // Apprentice
}

module.exports = router;
