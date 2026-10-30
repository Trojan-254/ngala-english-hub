const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { randomBytes } = require('crypto');
const { getDb } = require('../database/database');
const { requireAuth } = require('../middleware/auth');

const SALT_ROUNDS = 10;
const SESSION_DURATION_DAYS = 7;
const MIN_PASSWORD_LENGTH = 6;
const ALLOWED_CURRICULA = ['844', 'CBE'];
const { INDEPENDENT_GROUP } = require('../services/groups');

function generateSessionId() {
  return randomBytes(32).toString('hex');
}

function getExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DURATION_DAYS);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

// ===== registration ===========
router.post('/register', (req, res) => {
  const db = getDb();
  const { username, display_name, password, class_code } = req.body;
  // Teacher accounts are created by an admin (scripts/create-admin.js), never self-registered.
  const role = 'student';

  if (!username || !display_name || !password) {
    return res.status(400).json({ error: 'Username, display name and password are required' });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }
  if (username.length < 3 || !/^[a-z0-9_]+$/i.test(username)) {
    return res.status(400).json({ error: 'Username must be at least 3 characters: letters, numbers and underscores only' });
  }

  // Open enrolment: any student can join.
  // With a valid class code they join that teacher's class; without one they
  // join the 'Independent' group, which teacher dashboards do not list.
  let class_group = null;
  let curriculum = null;

  if (role !== 'teacher') {
    if (class_code && class_code.trim()) {
      const code = db.prepare(`
        SELECT * FROM class_codes
        WHERE code = ?
          AND is_active = 1
          AND expires_at > datetime('now')
      `).get(class_code.toUpperCase().trim());

      if (!code) {
        return res.status(400).json({ error: 'That class code is invalid or has expired. Check it with your teacher, or leave it blank to join on your own.' });
      }

      class_group = code.class_group;
      curriculum = code.curriculum;
    } else {
      class_group = INDEPENDENT_GROUP;
      curriculum = ALLOWED_CURRICULA.includes(req.body.curriculum) ? req.body.curriculum : 'CBE';
    }
  }

  // Check username taken
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const password_hash = bcrypt.hashSync(password, SALT_ROUNDS);

  const result = db.prepare(`
    INSERT INTO users (username, display_name, password_hash, role, class_group, curriculum)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    username.toLowerCase().trim(),
    display_name.trim(),
    password_hash,
    role === 'teacher' ? 'teacher' : 'student',
    class_group,
    curriculum
  );

  const sessionId = generateSessionId();
  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)
  `).run(sessionId, result.lastInsertRowid, getExpiryDate());

  const user = db.prepare(`
    SELECT id, username, display_name, role, class_group, curriculum, xp_total, level
    FROM users WHERE id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ sessionId, user });
});

// ======== login ========
router.post('/login', (req, res) => {
  const db = getDb();
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare(`
    SELECT * FROM users WHERE username = ? AND is_active = 1
  `).get(username.toLowerCase().trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Update last login
  db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).run(user.id);

  // Create session
  const sessionId = generateSessionId();
  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(sessionId, user.id, getExpiryDate());

  res.json({
    sessionId,
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: user.role,
      class_group: user.class_group,
      curriculum: user.curriculum,
      xp_total: user.xp_total,
      level: user.level
    }
  });
});

// ============= logout ================
router.post('/logout', requireAuth, (req, res) => {
  const db = getDb();
  const sessionId = req.headers['x-session-id'];
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  res.json({ message: 'Logged out successfully' });
});

// ========== forgot password ===============
router.post('/forgot-password', (req, res) => {
  const db = getDb();
})

  // TO-DO

// ============ get the current user ================
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
