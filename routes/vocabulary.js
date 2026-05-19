const express = require('express');
const router = express.Router();
const { getDb } = require('../database/database');
const { requireAuth } = require('../middleware/auth');

// GET vocabulary topics
router.get('/topics', requireAuth, (req, res) => {
  const db = getDb();

  const topics = db.prepare(`
    SELECT t.*,
      COUNT(v.id) as word_count
    FROM topics t
    LEFT JOIN vocabulary v ON v.topic_tag = t.title AND v.is_active = 1
    WHERE t.module_id = (SELECT id FROM modules WHERE slug = 'vocabulary')
      AND t.is_active = 1
    GROUP BY t.id
    ORDER BY t.sort_order ASC
  `).all();

  res.json({ topics });
});

// GET words due for review today (SM-2)
router.get('/due', requireAuth, (req, res) => {
  const db = getDb();

  const due = db.prepare(`
    SELECT * FROM vw_vocab_due_today WHERE user_id = ?
  `).all(req.user.id);

  // If no reviews scheduled yet, return fresh words
  if (due.length === 0) {
    const fresh = db.prepare(`
      SELECT v.*
      FROM vocabulary v
      WHERE v.is_active = 1
        AND v.id NOT IN (
          SELECT vocab_id FROM vocab_reviews WHERE user_id = ?
        )
      ORDER BY v.difficulty ASC, RANDOM()
      LIMIT 10
    `).all(req.user.id);

    return res.json({ words: fresh, is_new: true });
  }

  res.json({ words: due, is_new: false });
});

// START a vocabulary session
router.post('/session/start', requireAuth, (req, res) => {
  const db = getDb();
  const { topic_id, limit = 10 } = req.body;

  let words;

  if (topic_id) {
    // Get topic title to match topic_tag
    const topic = db.prepare(`SELECT title FROM topics WHERE id = ?`).get(topic_id);

    words = db.prepare(`
      SELECT v.*
      FROM vocabulary v
      WHERE v.topic_tag = ?
        AND v.is_active = 1
      ORDER BY RANDOM()
      LIMIT ?
    `).all(topic?.title || '', Math.min(limit, 20));
  } else {
    // Get due words or fresh words
    words = db.prepare(`
      SELECT v.*
      FROM vocabulary v
      WHERE v.is_active = 1
        AND (
          v.id IN (
            SELECT vocab_id FROM vocab_reviews
            WHERE user_id = ? AND next_review <= date('now')
          )
          OR v.id NOT IN (
            SELECT vocab_id FROM vocab_reviews WHERE user_id = ?
          )
        )
      ORDER BY RANDOM()
      LIMIT ?
    `).all(req.user.id, req.user.id, Math.min(limit, 20));
  }

  if (words.length === 0) {
    return res.status(404).json({
      error: 'No words available. Your teacher may need to add vocabulary words.'
    });
  }

  const session = db.prepare(`
    INSERT INTO quiz_sessions (user_id, module_slug, topic_id, total_q)
    VALUES (?, 'vocabulary', ?, ?)
  `).run(req.user.id, topic_id || null, words.length);

  res.json({
    session_id: session.lastInsertRowid,
    words
  });
});

// SUBMIT a vocabulary rating (SM-2 algorithm)
router.post('/rate', requireAuth, (req, res) => {
  const db = getDb();
  const { vocab_id, rating, session_id } = req.body;

  // rating: 'forgot' = 0, 'hard' = 3, 'got' = 5
  const qualityMap = { forgot: 0, hard: 3, got: 5 };
  const quality = qualityMap[rating] ?? 3;

  if (!vocab_id || !rating) {
    return res.status(400).json({ error: 'vocab_id and rating are required' });
  }

  // Get existing review record
  const existing = db.prepare(`
    SELECT * FROM vocab_reviews WHERE user_id = ? AND vocab_id = ?
  `).get(req.user.id, vocab_id);

  let ease_factor = existing?.ease_factor ?? 2.5;
  let interval = existing?.interval_days ?? 1;
  let review_count = existing?.review_count ?? 0;

  // SM-2 algorithm
  if (quality >= 3) {
    if (review_count === 0) interval = 1;
    else if (review_count === 1) interval = 6;
    else interval = Math.round(interval * ease_factor);

    ease_factor = Math.max(1.3,
      ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    );
    review_count++;
  } else {
    // Forgot — reset
    interval = 1;
    review_count = 0;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  const nextReviewStr = nextReview.toISOString().split('T')[0];

  if (existing) {
    db.prepare(`
      UPDATE vocab_reviews SET
        ease_factor   = ?,
        interval_days = ?,
        next_review   = ?,
        review_count  = ?,
        last_reviewed = date('now')
      WHERE user_id = ? AND vocab_id = ?
    `).run(ease_factor, interval, nextReviewStr, review_count, req.user.id, vocab_id);
  } else {
    db.prepare(`
      INSERT INTO vocab_reviews
        (user_id, vocab_id, ease_factor, interval_days, next_review, review_count, last_reviewed)
      VALUES (?, ?, ?, ?, ?, ?, date('now'))
    `).run(req.user.id, vocab_id, ease_factor, interval, nextReviewStr, review_count);
  }

  // Award XP for 'got'
  const xp = quality === 5 ? 5 : quality === 3 ? 2 : 0;
  if (xp > 0) {
    db.prepare(`UPDATE users SET xp_total = xp_total + ? WHERE id = ?`)
      .run(xp, req.user.id);
    db.prepare(`INSERT INTO xp_history (user_id, xp_change, reason) VALUES (?, ?, ?)`)
      .run(req.user.id, xp, `Vocabulary review — word ${vocab_id}`);

    // Log as attempt
    db.prepare(`
      INSERT INTO attempts
        (user_id, vocab_id, module_slug, answer_given, is_correct, xp_earned)
      VALUES (?, ?, 'vocabulary', ?, ?, ?)
    `).run(req.user.id, vocab_id, rating, quality >= 3 ? 1 : 0, xp);
  }

  res.json({
    next_review: nextReviewStr,
    interval_days: interval,
    xp_earned: xp
  });
});

// GET vocabulary progress
router.get('/progress', requireAuth, (req, res) => {
  const db = getDb();

  const mastered = db.prepare(`
    SELECT COUNT(*) as count FROM vocab_reviews
    WHERE user_id = ? AND review_count >= 3
  `).get(req.user.id);

  const due_today = db.prepare(`
    SELECT COUNT(*) as count FROM vw_vocab_due_today WHERE user_id = ?
  `).get(req.user.id);

  const total = db.prepare(`SELECT COUNT(*) as count FROM vocabulary WHERE is_active = 1`).get();

  res.json({
    mastered: mastered.count,
    due_today: due_today.count,
    total: total.count
  });
});

module.exports = router;
