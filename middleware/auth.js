const { getDb } = require('../database/database');

function requireAuth(req, res, next) {
    const db = getDb();
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
        return res.status(401).json({ error: 'Unauthorized: No session ID provided' });
    }

    const session = db.prepare(`
    SELECT s.*, u.id as user_id, u.username, u.display_name, 
           u.role, u.class_group, u.curriculum, u.xp_total, u.level
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? 
      AND s.expires_at > datetime('now')
      AND u.is_active = 1
  `).get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session '});
  }

  req.user = {
    id: session.user_id,
    username: session.username,
    display_name: session.display_name,
    role: session.role,
    class_group: session.class_group,
    curriculum: session.curriculum,
    xp_total: session.xp_total,
    level: session.level
  };

  next();
}

function requireTeacher(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user.role !== 'teacher' ) {
            return res.status(403).json({ error: 'Teacher access required'});
        }
        next();
    });
}

module.exports = { requireAuth, requireTeacher };