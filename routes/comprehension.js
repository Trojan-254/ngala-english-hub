const express = require('express');
const router = express.Router();
const { getDb } = require('../database/database');
const { requireAuth } = require('../middleware/auth');

// ─── GET TOPICS ───────────────────────────────────────────────
router.get('/topics', requireAuth, (req, res) => {
  const db = getDb();
  const { curriculum } = req.query;

  let query = `
    SELECT t.*,
      COUNT(p.id) as passage_count
    FROM topics t
    LEFT JOIN passages p ON p.topic_id = t.id AND p.is_active = 1
    WHERE t.module_id = (SELECT id FROM modules WHERE slug = 'comprehension')
      AND t.is_active = 1
  `;

  const params = [];
  if (curriculum) {
    query += ` AND (t.curriculum = ? OR t.curriculum = 'both')`;
    params.push(curriculum);
  }

  query += ` GROUP BY t.id ORDER BY t.sort_order ASC`;

  const topics = db.prepare(query).all(...params);
  res.json({ topics });
});

// ─── GET PASSAGES FOR A TOPIC ─────────────────────────────────
router.get('/passages', requireAuth, (req, res) => {
  const db = getDb();
  const { topic_id } = req.query;

  if (!topic_id) {
    return res.status(400).json({ error: 'topic_id is required' });
  }

  const passages = db.prepare(`
    SELECT
      p.id, p.title, p.word_count, p.difficulty,
      p.source, p.curriculum,
      COUNT(pq.id) as question_count
    FROM passages p
    LEFT JOIN passage_questions pq ON pq.passage_id = p.id
    WHERE p.topic_id = ?
      AND p.is_active = 1
    GROUP BY p.id
    ORDER BY p.difficulty ASC
  `).all(topic_id);

  res.json({ passages });
});

// ─── START PASSAGE SESSION ────────────────────────────────────
router.post('/session/start', requireAuth, (req, res) => {
  const db = getDb();
  const { passage_id } = req.body;

  if (!passage_id) {
    return res.status(400).json({ error: 'passage_id is required' });
  }

  const passage = db.prepare(`
    SELECT * FROM passages WHERE id = ? AND is_active = 1
  `).get(passage_id);

  if (!passage) {
    return res.status(404).json({ error: 'Passage not found' });
  }

  const questions = db.prepare(`
    SELECT id, question_text, question_type, options, xp_reward, sort_order
    FROM passage_questions
    WHERE passage_id = ?
    ORDER BY sort_order ASC
  `).all(passage_id);

  if (questions.length === 0) {
    return res.status(404).json({ error: 'No questions found for this passage' });
  }

  const parsed = questions.map(q => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : []
  }));

  const session = db.prepare(`
    INSERT INTO quiz_sessions (user_id, module_slug, topic_id, total_q)
    VALUES (?, 'comprehension', ?, ?)
  `).run(req.user.id, passage.topic_id, parsed.length);

  res.json({
    session_id: session.lastInsertRowid,
    passage: {
      id: passage.id,
      title: passage.title,
      content: passage.content,
      word_count: passage.word_count,
      difficulty: passage.difficulty,
      source: passage.source
    },
    questions: parsed,
    time_limit_seconds: calculateTimeLimit(passage.word_count, parsed.length)
  });
});

// ─── SUBMIT ANSWER ────────────────────────────────────────────
router.post('/answer', requireAuth, (req, res) => {
  const db = getDb();
  const { passage_question_id, answer, session_id, time_taken_ms } = req.body;

  if (!passage_question_id || answer === undefined || !session_id) {
    return res.status(400).json({
      error: 'passage_question_id, answer and session_id are required'
    });
  }

  const question = db.prepare(`
    SELECT * FROM passage_questions WHERE id = ?
  `).get(passage_question_id);

  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const quizSession = db.prepare(`
    SELECT * FROM quiz_sessions WHERE id = ? AND user_id = ?
  `).get(session_id, req.user.id);

  if (!quizSession) {
    return res.status(403).json({ error: 'Invalid session' });
  }

  const is_correct = answer.toString().trim().toUpperCase() ===
    question.correct_answer.toString().trim().toUpperCase() ? 1 : 0;

  // Check if student already answered this question correctly before
  const previousCorrect = db.prepare(`
    SELECT id FROM attempts
    WHERE user_id = ? AND question_id = ? AND is_correct = 1
  `).get(req.user.id, question_id);

  // Award XP only if first correct attempt
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
    new_badges: newBadges  // ← send newly earned badges to frontend
  });

  db.prepare(`
    INSERT INTO attempts
      (user_id, passage_q_id, module_slug, answer_given, is_correct, time_taken_ms, xp_earned)
    VALUES (?, ?, 'comprehension', ?, ?, ?, ?)
  `).run(req.user.id, passage_question_id, answer.toString(), is_correct, time_taken_ms || null, xp_earned);

  let new_xp = req.user.xp_total;
  let new_level = req.user.level;
  let levelled_up = false;

  if (is_correct && xp_earned > 0) {
    db.prepare(`UPDATE users SET xp_total = xp_total + ? WHERE id = ?`)
      .run(xp_earned, req.user.id);

    db.prepare(`INSERT INTO xp_history (user_id, xp_change, reason) VALUES (?, ?, ?)`)
      .run(req.user.id, xp_earned, `Correct answer — comprehension question ${passage_question_id}`);

    const updated = db.prepare(`SELECT xp_total FROM users WHERE id = ?`).get(req.user.id);
    new_xp = updated.xp_total;
    new_level = calculateLevel(new_xp);

    if (new_level > req.user.level) {
      db.prepare(`UPDATE users SET level = ? WHERE id = ?`).run(new_level, req.user.id);
      levelled_up = true;
    }
  }

  db.prepare(`
    UPDATE quiz_sessions
    SET score = score + ?,
        xp_earned = xp_earned + ?
    WHERE id = ?
  `).run(is_correct, xp_earned, session_id);

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

// ─── END SESSION ──────────────────────────────────────────────
router.post('/session/end', requireAuth, (req, res) => {
  const db = getDb();
  const { session_id, time_taken_seconds } = req.body;

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
    xp_earned: quizSession.xp_earned,
    speed_bonus: false
  });
});

// ============ PROGRESS =============
router.get('/progress', requireAuth, (req, res) => {
  const db = getDb();

  const progress = db.prepare(`
    SELECT * FROM vw_student_module_progress
    WHERE user_id = ? AND module_slug = 'comprehension'
  `).get(req.user.id);

  const passageHistory = db.prepare(`
    SELECT
      qs.score,
      qs.total_q,
      ROUND(qs.score * 100.0 / NULLIF(qs.total_q, 0), 1) as accuracy_pct,
      qs.xp_earned,
      qs.started_at
    FROM quiz_sessions qs
    WHERE qs.user_id = ?
      AND qs.module_slug = 'comprehension'
      AND qs.completed = 1
    ORDER BY qs.started_at DESC
    LIMIT 10
  `).all(req.user.id);

  res.json({ progress, passage_history: passageHistory });
});

function calculateTimeLimit(word_count, question_count) {
  const reading_seconds = word_count ? Math.ceil((word_count / 200) * 60) : 120;
  const question_seconds = question_count * 45;
  return reading_seconds + question_seconds;
}

function calculateLevel(xp) {
  if (xp >= 10000) return 5;
  if (xp >= 3000)  return 4;
  if (xp >= 1000)  return 3;
  if (xp >= 300)   return 2;
  return 1;
}

module.exports = router;

