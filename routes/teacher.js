const express = require('express');
const router = express.Router();
const { getDb } = require('../database/database');
const { requireTeacher } = require('../middleware/auth');

// ─── OVERVIEW ─────────────────────────────────────────────────
// Top-level stats for the teacher dashboard header
router.get('/overview', requireTeacher, (req, res) => {
  const db = getDb();

  const totalStudents = db.prepare(`
    SELECT COUNT(*) as count FROM users
    WHERE role = 'student' AND is_active = 1
  `).get();

  const classGroups = db.prepare(`
    SELECT COUNT(DISTINCT class_group) as count FROM users
    WHERE role = 'student' AND is_active = 1 AND class_group IS NOT NULL
  `).get();

  const weeklyAttempts = db.prepare(`
    SELECT
      COUNT(*) as total_attempts,
      SUM(is_correct) as correct,
      ROUND(SUM(is_correct) * 100.0 / NULLIF(COUNT(*), 0), 1) as accuracy_pct
    FROM attempts
    WHERE created_at >= datetime('now', '-7 days')
  `).get();

  const mostAttempted = db.prepare(`
    SELECT module_slug, COUNT(*) as attempts
    FROM attempts
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY module_slug
    ORDER BY attempts DESC
    LIMIT 1
  `).get();

  const activeToday = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM attempts
    WHERE created_at >= datetime('now', 'start of day')
  `).get();

  res.json({
    total_students: totalStudents.count,
    class_groups: classGroups.count,
    weekly_accuracy: weeklyAttempts.accuracy_pct ?? 0,
    weekly_attempts: weeklyAttempts.total_attempts ?? 0,
    most_attempted_module: mostAttempted?.module_slug ?? null,
    active_today: activeToday.count,
  });
});

// ─── STUDENTS ─────────────────────────────────────────────────
// All students with their progress summary
router.get('/students', requireTeacher, (req, res) => {
  const db = getDb();
  const { class_group } = req.query;

  let query = `
    SELECT
      u.id,
      u.username,
      u.display_name,
      u.class_group,
      u.curriculum,
      u.xp_total,
      u.level,
      u.is_active,
      u.last_login_at,
      u.created_at,
      COUNT(a.id) as total_attempts,
      SUM(a.is_correct) as correct_answers,
      ROUND(SUM(a.is_correct) * 100.0 / NULLIF(COUNT(a.id), 0), 1) as overall_accuracy
    FROM users u
    LEFT JOIN attempts a ON a.user_id = u.id
    WHERE u.role = 'student'
  `;

  const params = [];
  if (class_group) {
    query += ` AND u.class_group = ?`;
    params.push(class_group);
  }

  query += ` GROUP BY u.id ORDER BY u.class_group, u.xp_total DESC`;

  const students = db.prepare(query).all(...params);

  // Per-module accuracy for each student
  const moduleAccuracy = db.prepare(`
    SELECT
      user_id,
      module_slug,
      COUNT(*) as attempts,
      ROUND(SUM(is_correct) * 100.0 / COUNT(*), 1) as accuracy
    FROM attempts
    WHERE user_id = ?
    GROUP BY module_slug
  `);

  const enriched = students.map(s => ({
    ...s,
    modules: moduleAccuracy.all(s.id).reduce((acc, m) => {
      acc[m.module_slug] = { attempts: m.attempts, accuracy: m.accuracy };
      return acc;
    }, {})
  }));

  res.json({ students: enriched });
});

// ─── WEAK TOPICS ──────────────────────────────────────────────
// Class-wide weak areas — topics with lowest accuracy
router.get('/weak-topics', requireTeacher, (req, res) => {
  const db = getDb();
  const { class_group } = req.query;

  let query = `
    SELECT
      t.title as topic,
      m.title as module,
      m.slug as module_slug,
      COUNT(a.id) as total_attempts,
      SUM(a.is_correct) as correct,
      ROUND(SUM(a.is_correct) * 100.0 / COUNT(a.id), 1) as accuracy_pct,
      COUNT(DISTINCT a.user_id) as students_attempted
    FROM attempts a
    JOIN questions q ON a.question_id = q.id
    JOIN topics t ON q.topic_id = t.id
    JOIN modules m ON t.module_id = m.id
    JOIN users u ON a.user_id = u.id
    WHERE u.role = 'student'
      AND a.question_id IS NOT NULL
  `;

  const params = [];
  if (class_group) {
    query += ` AND u.class_group = ?`;
    params.push(class_group);
  }

  query += `
    GROUP BY t.id
    HAVING total_attempts >= 5
    ORDER BY accuracy_pct ASC
    LIMIT 10
  `;

  const topics = db.prepare(query).all(...params);
  res.json({ weak_topics: topics });
});

// ─── MODULE STATS ─────────────────────────────────────────────
// Class-wide performance per module
router.get('/module-stats', requireTeacher, (req, res) => {
  const db = getDb();
  const { class_group } = req.query;

  let query = `
    SELECT
      a.module_slug,
      COUNT(a.id) as total_attempts,
      SUM(a.is_correct) as correct,
      ROUND(SUM(a.is_correct) * 100.0 / COUNT(a.id), 1) as accuracy_pct,
      COUNT(DISTINCT a.user_id) as unique_students,
      ROUND(AVG(a.time_taken_ms) / 1000.0, 1) as avg_response_sec
    FROM attempts a
    JOIN users u ON a.user_id = u.id
    WHERE u.role = 'student'
  `;

  const params = [];
  if (class_group) {
    query += ` AND u.class_group = ?`;
    params.push(class_group);
  }

  query += ` GROUP BY a.module_slug ORDER BY total_attempts DESC`;

  const stats = db.prepare(query).all(...params);
  res.json({ module_stats: stats });
});

// ─── CLASS GROUPS ─────────────────────────────────────────────
// List of all class groups for filter dropdown
router.get('/class-groups', requireTeacher, (req, res) => {
  const db = getDb();

  const groups = db.prepare(`
    SELECT DISTINCT class_group, curriculum,
      COUNT(*) as student_count
    FROM users
    WHERE role = 'student'
      AND is_active = 1
      AND class_group IS NOT NULL
    GROUP BY class_group
    ORDER BY class_group
  `).all();

  res.json({ class_groups: groups });
});

// ─── LEADERBOARD (teacher view — all time) ────────────────────
router.get('/leaderboard', requireTeacher, (req, res) => {
  const db = getDb();
  const { class_group } = req.query;

  let query = `
    SELECT
      u.id,
      u.display_name,
      u.class_group,
      u.level,
      u.xp_total,
      COALESCE(w.weekly_xp, 0) as weekly_xp
    FROM users u
    LEFT JOIN vw_weekly_leaderboard w ON w.id = u.id
    WHERE u.role = 'student' AND u.is_active = 1
  `;

  const params = [];
  if (class_group) {
    query += ` AND u.class_group = ?`;
    params.push(class_group);
  }

  query += ` ORDER BY u.xp_total DESC LIMIT 50`;

  const leaderboard = db.prepare(query).all(...params);
  res.json({ leaderboard });
});

// ─── TRIGGER CLASS CHALLENGE ──────────────────────────────────
router.post('/challenge', requireTeacher, (req, res) => {
  const db = getDb();
  const { module_slug, topic_id, title, class_group } = req.body;

  if (!module_slug || !title) {
    return res.status(400).json({ error: 'module_slug and title are required' });
  }

  const challenge = db.prepare(`
    INSERT INTO challenges (teacher_id, module_slug, topic_id, title, status, started_at)
    VALUES (?, ?, ?, ?, 'active', datetime('now'))
  `).run(req.user.id, module_slug, topic_id || null, title);

  // Broadcast to all students in the class group via Socket.io
  const io = req.app.get('io');
  if (io) {
    const payload = {
      challenge_id: challenge.lastInsertRowid,
      module_slug,
      topic_id,
      title,
      triggered_by: req.user.display_name,
    };

    if (class_group) {
      io.to(class_group).emit('challenge:start', payload);
    } else {
      io.emit('challenge:start', payload);
    }
  }

  res.json({
    challenge_id: challenge.lastInsertRowid,
    message: `Challenge "${title}" triggered successfully`,
  });
});

// ─── CLASS CODES ──────────────────────────────────────────────
router.get('/codes', requireTeacher, (req, res) => {
  const db = getDb();

  const codes = db.prepare(`
    SELECT
      cc.*,
      COUNT(u.id) as students_registered
    FROM class_codes cc
    LEFT JOIN users u ON u.class_group = cc.class_group AND u.role = 'student'
    WHERE cc.created_by = ?
    GROUP BY cc.id
    ORDER BY cc.created_at DESC
  `).all(req.user.id);

  res.json({ codes });
});

router.post('/codes', requireTeacher, (req, res) => {
  const db = getDb();
  const { code, class_group, curriculum, expires_days = 90 } = req.body;

  if (!code || !class_group || !curriculum) {
    return res.status(400).json({ error: 'code, class_group and curriculum are required' });
  }

  // Check code not already taken
  const existing = db.prepare(`SELECT id FROM class_codes WHERE code = ?`).get(code);
  if (existing) {
    return res.status(409).json({ error: 'That code is already taken. Choose another.' });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expires_days);

  const result = db.prepare(`
    INSERT INTO class_codes (code, class_group, curriculum, created_by, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    code.toUpperCase().trim(),
    class_group.trim(),
    curriculum,
    req.user.id,
    expiresAt.toISOString().replace('T', ' ').substring(0, 19)
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    code: code.toUpperCase().trim(),
    class_group,
    curriculum,
    message: 'Class code created successfully',
  });
});

router.delete('/codes/:id', requireTeacher, (req, res) => {
  const db = getDb();

  const code = db.prepare(`
    SELECT * FROM class_codes WHERE id = ? AND created_by = ?
  `).get(req.params.id, req.user.id);

  if (!code) {
    return res.status(404).json({ error: 'Code not found' });
  }

  db.prepare(`UPDATE class_codes SET is_active = 0 WHERE id = ?`).run(req.params.id);
  res.json({ message: 'Code deactivated successfully' });
});

// ─── STUDENT MANAGEMENT ───────────────────────────────────────
router.patch('/students/:id', requireTeacher, (req, res) => {
  const db = getDb();
  const { is_active } = req.body;

  if (is_active === undefined) {
    return res.status(400).json({ error: 'is_active is required' });
  }

  const student = db.prepare(`
    SELECT * FROM users WHERE id = ? AND role = 'student'
  `).get(req.params.id);

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  db.prepare(`UPDATE users SET is_active = ? WHERE id = ?`)
    .run(is_active ? 1 : 0, req.params.id);

  res.json({
    message: `Student ${is_active ? 'activated' : 'deactivated'} successfully`
  });
});

// ─── STUDENT NOTES ────────────────────────────────────────────
router.post('/students/:id/notes', requireTeacher, (req, res) => {
  const db = getDb();
  const { note } = req.body;

  if (!note) {
    return res.status(400).json({ error: 'note is required' });
  }

  const result = db.prepare(`
    INSERT INTO teacher_notes (teacher_id, student_id, note)
    VALUES (?, ?, ?)
  `).run(req.user.id, req.params.id, note);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Note saved' });
});

router.get('/students/:id/notes', requireTeacher, (req, res) => {
  const db = getDb();

  const notes = db.prepare(`
    SELECT tn.*, u.display_name as teacher_name
    FROM teacher_notes tn
    JOIN users u ON tn.teacher_id = u.id
    WHERE tn.student_id = ?
    ORDER BY tn.created_at DESC
  `).all(req.params.id);

  res.json({ notes });
});

module.exports = router;
