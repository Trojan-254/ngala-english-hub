const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { randomBytes } = require('crypto');
const { getDb } = require('../database/database');
const { requireAuth } = require('../middleware/auth');

const SALT_ROUNDS = 10;
const SESSION_DURATION_DAYS = 7;

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
  const { username, display_name, password, role, class_group, curriculum } = req.body;

  // ========= Validation =========
  if (!username || !display_name || !password) {
    return res.status(400).json({ error: 'Username, display name and password are required' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  // Check username taken
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
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
    class_group || null,
    curriculum || null
  );

  const sessionId = generateSessionId();
  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
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