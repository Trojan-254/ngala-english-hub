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
// ─── STREAK DATA ──────────────────────────────────────────────
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

module.exports = router;
