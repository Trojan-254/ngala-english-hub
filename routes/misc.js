const express = require('express');
const router = express.Router();
const { getDb } = require('../database/database');
const { requireAuth } = require('../middleware/auth');

// =========== WORD OF THE DAY ============
// Same word for everyone on a given day — rotates daily
router.get('/word-of-day', requireAuth, (req, res) => {
  const db = getDb();

  const words = db.prepare(`
    SELECT id, word, definition, part_of_speech, example_sentence, synonym, antonym
    FROM vocabulary
    WHERE is_active = 1
    ORDER BY id ASC
  `).all();

  if (words.length === 0) {
    return res.status(404).json({ error: 'No vocabulary words found' });
  }

  // Pick word based on day of year — rotates daily, same for all students
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  const word = words[dayOfYear % words.length];

  res.json({ word });
});

// Add word of day to student's list
router.post('/word-list/add', requireAuth, (req, res) => {
  const db = getDb();
  const { vocab_id } = req.body;

  if (!vocab_id) return res.status(400).json({ error: 'vocab_id is required' });

  try {
    db.prepare(`
      INSERT INTO word_list (user_id, vocab_id) VALUES (?, ?)
    `).run(req.user.id, vocab_id);
    res.json({ message: 'Word added to your list' });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Word already in your list' });
    }
    throw e;
  }
});

// Get student's word list
router.get('/word-list', requireAuth, (req, res) => {
  const db = getDb();
  const words = db.prepare(`
    SELECT v.*, wl.created_at as added_at
    FROM word_list wl
    JOIN vocabulary v ON wl.vocab_id = v.id
    WHERE wl.user_id = ?
    ORDER BY wl.created_at DESC
  `).all(req.user.id);
  res.json({ words });
});

// ========= WEEKLY LEADERBOARD (REST fallback for initial load) ===========
router.get('/leaderboard/weekly', requireAuth, (req, res) => {
  const db = getDb();

  const leaderboard = db.prepare(`
    SELECT * FROM vw_weekly_leaderboard
    LIMIT 10
  `).all();

  res.json({ leaderboard });
});

// ========= STREAK DATA =========
// Returns last 7 days — whether the student had any activity each day
// ======= STREAK DATA =============
router.get('/streak', requireAuth, (req, res) => {
  const db = getDb();

  // Get attempt dates for the last 14 days (enough to cover current week)
  const attempts = db.prepare(`
    SELECT DATE(created_at) as day, COUNT(*) as count
    FROM attempts
    WHERE user_id = ?
      AND created_at >= DATE('now', '-13 days')
    GROUP BY DATE(created_at)
  `).all(req.user.id);

  const activeDays = new Set(attempts.map(a => a.day));

  // Find the most recent Monday
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);

  // Build Mon–Sun for current week
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const days = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const isFuture = d > today;

    days.push({
      label: dayLabels[i],
      date: dateStr,
      done: activeDays.has(dateStr),
      today: dateStr === todayStr,
      future: isFuture
    });
  }

  // Calculate current streak — count consecutive days with activity going back from today
  const todayStr = today.toISOString().split('T')[0];
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (activeDays.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }

  res.json({ days, streak });
});

// ========== FULL PROGRESS SUMMARY ======================
router.get('/progress', requireAuth, (req, res) => {
  const db = getDb();

  const modules = db.prepare(`
    SELECT
      module_slug,
      COUNT(*) as total_attempts,
      SUM(is_correct) as correct,
      ROUND(SUM(is_correct) * 100.0 / COUNT(*), 1) as accuracy_pct,
      SUM(xp_earned) as xp_earned,
      MAX(created_at) as last_activity
    FROM attempts
    WHERE user_id = ?
    GROUP BY module_slug
  `).all(req.user.id);

  const badges = db.prepare(`
    SELECT b.slug, b.title, b.description, b.icon, ub.earned_at
    FROM user_badges ub
    JOIN badges b ON ub.badge_id = b.id
    WHERE ub.user_id = ?
    ORDER BY ub.earned_at DESC
  `).all(req.user.id);

  const xpHistory = db.prepare(`
    SELECT xp_change, reason, created_at
    FROM xp_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(req.user.id);

  const weeklyXp = db.prepare(`
    SELECT COALESCE(SUM(xp_change), 0) as total
    FROM xp_history
    WHERE user_id = ?
      AND created_at >= datetime('now', '-7 days')
  `).get(req.user.id);

  const vocabProgress = db.prepare(`
    SELECT
      COUNT(*) as words_reviewed,
      SUM(CASE WHEN review_count >= 3 THEN 1 ELSE 0 END) as words_mastered
    FROM vocab_reviews
    WHERE user_id = ?
  `).get(req.user.id);

  res.json({
    user: {
      id: req.user.id,
      display_name: req.user.display_name,
      level: req.user.level,
      xp_total: req.user.xp_total,
      weekly_xp: weeklyXp.total
    },
    modules,
    badges,
    xp_history: xpHistory,
    vocab: vocabProgress
  });
});

module.exports = router;
