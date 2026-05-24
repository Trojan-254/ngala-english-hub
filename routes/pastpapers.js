const express = require('express');
const router = express.Router();
const { getDb } = require('../database/database');
const { requireAuth } = require('../middleware/auth');

// GET all past papers
router.get('/', requireAuth, (req, res) => {
  const db = getDb();

  const papers = db.prepare(`
    SELECT pp.*,
      COUNT(q.id) as question_count
    FROM past_papers pp
    LEFT JOIN questions q ON q.past_paper_id = pp.id AND q.is_active = 1
    WHERE pp.is_active = 1
    GROUP BY pp.id
    ORDER BY pp.year DESC, pp.paper_number ASC
  `).all();

  res.json({ papers });
});

// START a past paper session
router.post('/session/start', requireAuth, (req, res) => {
  const db = getDb();
  const { paper_id } = req.body;

  if (!paper_id) return res.status(400).json({ error: 'paper_id is required' });

  const paper = db.prepare(`SELECT * FROM past_papers WHERE id = ? AND is_active = 1`).get(paper_id);
  if (!paper) return res.status(404).json({ error: 'Past paper not found' });

  const questions = db.prepare(`
    SELECT id, question_text, question_type, options, xp_reward,
           difficulty, source, max_marks
    FROM questions
    WHERE past_paper_id = ? AND is_active = 1
    ORDER BY id ASC
  `).all(paper_id);

  if (questions.length === 0) {
    return res.status(404).json({ error: 'No questions found for this paper' });
  }

  const parsed = questions.map(q => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : null
  }));

  // Get topic_id for this paper
  const topic = db.prepare(`
    SELECT id FROM topics WHERE title = ?
  `).get(paper.title);

  const session = db.prepare(`
    INSERT INTO quiz_sessions (user_id, module_slug, topic_id, total_q)
    VALUES (?, 'pastpapers', ?, ?)
  `).run(req.user.id, topic?.id || null, parsed.length);

  res.json({
    session_id: session.lastInsertRowid,
    paper,
    questions: parsed,
    duration_seconds: (paper.duration_minutes || 150) * 60
  });
});

// SUBMIT a single answer (called per question or on final submit)
router.post('/answer', requireAuth, (req, res) => {
  const db = getDb();
  const {
    question_id,
    session_id,
    answer,          // for MCQ — the selected option
    open_answer,     // for open-ended — the typed response
    time_taken_ms
  } = req.body;

  if (!question_id || !session_id) {
    return res.status(400).json({ error: 'question_id and session_id are required' });
  }

  const question = db.prepare(`SELECT * FROM questions WHERE id = ?`).get(question_id);
  if (!question) return res.status(404).json({ error: 'Question not found' });

  const session = db.prepare(`SELECT * FROM quiz_sessions WHERE id = ? AND user_id = ?`)
    .get(session_id, req.user.id);
  if (!session) return res.status(403).json({ error: 'Invalid session' });

  let is_correct = 0;
  //let xp_earned = 0;
  let marking_status = null;

  if (question.question_type === 'mcq') {
    // Auto-mark MCQ
    is_correct = answer?.toString().trim().toUpperCase() ===
      question.correct_answer?.toString().trim().toUpperCase() ? 1 : 0;
    const previousCorrect = db.prepare(`
      SELECT id FROM attempts
      WHERE user_id = ? AND question_id = ? AND is_correct = 1
    `).get(req.user.id, question_id);
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

  } else {
    // Open-ended — submit for teacher marking
    marking_status = 'pending';
    is_correct = 0; // unknown until marked
    xp_earned = 0;
  }

  // Check if already answered this question in this session
  const existing = db.prepare(`
    SELECT id FROM attempts
    WHERE user_id = ? AND question_id = ? AND module_slug = 'pastpapers'
  `).get(req.user.id, question_id);

  if (existing) {
    // Update existing answer
    db.prepare(`
      UPDATE attempts SET
        answer_given    = ?,
        open_answer     = ?,
        is_correct      = ?,
        xp_earned       = ?,
        marking_status  = ?,
        time_taken_ms   = ?
      WHERE id = ?
    `).run(
      answer || null,
      open_answer || null,
      is_correct,
      xp_earned,
      marking_status,
      time_taken_ms || null,
      existing.id
    );
  } else {
    db.prepare(`
      INSERT INTO attempts
        (user_id, question_id, module_slug, answer_given, open_answer,
         is_correct, xp_earned, marking_status, max_marks, time_taken_ms)
      VALUES (?, ?, 'pastpapers', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      question_id,
      answer || null,
      open_answer || null,
      is_correct,
      xp_earned,
      marking_status,
      question.max_marks || null,
      time_taken_ms || null
    );
  }

  // Award XP for MCQ
  if (xp_earned > 0) {
    db.prepare(`UPDATE users SET xp_total = xp_total + ? WHERE id = ?`)
      .run(xp_earned, req.user.id);
    db.prepare(`INSERT INTO xp_history (user_id, xp_change, reason) VALUES (?, ?, ?)`)
      .run(req.user.id, xp_earned, `Past paper MCQ correct — Q${question_id}`);
  }

  res.json({
    is_correct: question.question_type === 'mcq' ? is_correct === 1 : null,
    correct_answer: question.question_type === 'mcq' ? question.correct_answer : null,
    explanation: question.question_type === 'mcq' ? question.explanation : null,
    xp_earned,
    marking_status,
    message: question.question_type !== 'mcq'
      ? 'Your answer has been submitted for teacher marking'
      : undefined
  });
});

// SUBMIT full paper (called when timer ends or student clicks submit)
router.post('/session/submit', requireAuth, (req, res) => {
  const db = getDb();
  const { session_id, answers, time_taken_seconds } = req.body;

  if (!session_id) return res.status(400).json({ error: 'session_id is required' });

  const session = db.prepare(`SELECT * FROM quiz_sessions WHERE id = ? AND user_id = ?`)
    .get(session_id, req.user.id);
  if (!session) return res.status(403).json({ error: 'Invalid session' });

  // Process all answers if provided as bulk
  if (answers && typeof answers === 'object') {
    const questions = db.prepare(`
      SELECT q.* FROM questions q
      JOIN quiz_sessions qs ON qs.id = ?
      WHERE q.is_active = 1
    `).all(session_id);

    // This is handled by the /answer endpoint called per question
    // Here we just close the session
  }

  // Count results for this session
  const results = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN is_correct = 1 AND marking_status IS NULL THEN 1 ELSE 0 END) as auto_correct,
      SUM(CASE WHEN marking_status = 'pending' THEN 1 ELSE 0 END) as pending_marking,
      SUM(xp_earned) as xp_earned
    FROM attempts
    WHERE user_id = ? AND module_slug = 'pastpapers'
      AND created_at >= datetime('now', '-3 hours')
  `).get(req.user.id);

  // Close session
  db.prepare(`
    UPDATE quiz_sessions SET
      ended_at  = datetime('now'),
      completed = 1,
      score     = ?,
      xp_earned = ?
    WHERE id = ?
  `).run(results.auto_correct || 0, results.xp_earned || 0, session_id);

  const pct = results.total > 0
    ? Math.round((results.auto_correct / (results.total - results.pending_marking)) * 100)
    : 0;

  const grade = pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'E';

  res.json({
    score: results.auto_correct || 0,
    total: results.total || 0,
    pending_marking: results.pending_marking || 0,
    accuracy: pct,
    grade,
    xp_earned: results.xp_earned || 0,
    message: results.pending_marking > 0
      ? `${results.pending_marking} open-ended answer(s) are pending teacher review`
      : 'Paper submitted successfully'
  });
});

// GET student's past paper results
router.get('/results', requireAuth, (req, res) => {
  const db = getDb();

  const results = db.prepare(`
    SELECT
      qs.id as session_id,
      qs.started_at,
      qs.ended_at,
      qs.score,
      qs.total_q,
      qs.xp_earned,
      pp.title as paper_title,
      pp.year,
      pp.paper_number
    FROM quiz_sessions qs
    LEFT JOIN past_papers pp ON pp.title = (
      SELECT title FROM topics WHERE id = qs.topic_id
    )
    WHERE qs.user_id = ?
      AND qs.module_slug = 'pastpapers'
      AND qs.completed = 1
    ORDER BY qs.started_at DESC
  `).all(req.user.id);

  res.json({ results });
});

module.exports = router;
