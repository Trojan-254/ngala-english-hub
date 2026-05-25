const { getDb } = require('../database/database');

// Badge condition evaluators
const evaluators = {
  attempt_count: (userId, condition) => {
    const db = getDb();
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM attempts WHERE user_id = ?
    `).get(userId);
    return result.count >= condition.threshold;
  },

  streak: (userId, condition) => {
    const db = getDb();
    // Count consecutive days with activity
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM attempts
        WHERE user_id = ?
          AND DATE(created_at) = DATE('now', ? || ' days')
      `).get(userId, `-${i}`);
      if (result.count > 0) streak++;
      else break;
    }
    return streak >= condition.threshold;
  },

  consecutive_correct: (userId, condition) => {
    const db = getDb();
    const recent = db.prepare(`
      SELECT is_correct FROM attempts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, condition.threshold);
    return recent.length >= condition.threshold && recent.every(a => a.is_correct === 1);
  },

  perfect_score: (userId, condition) => {
    const db = getDb();
    const sessions = db.prepare(`
      SELECT score, total_q FROM quiz_sessions
      WHERE user_id = ?
        AND module_slug = ?
        AND completed = 1
        AND total_q > 0
    `).all(userId, condition.module);
    return sessions.some(s => s.score === s.total_q);
  },

  timed_completion: (userId, condition) => {
    const db = getDb();
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM quiz_sessions
      WHERE user_id = ?
        AND module_slug = ?
        AND completed = 1
    `).get(userId, condition.module);
    return result.count > 0;
  },

  paper_completed: (userId, condition) => {
    const db = getDb();
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM quiz_sessions
      WHERE user_id = ?
        AND module_slug = 'pastpapers'
        AND completed = 1
    `).get(userId);
    return result.count > 0;
  },

  vocab_learned: (userId, condition) => {
    const db = getDb();
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM vocab_reviews
      WHERE user_id = ? AND review_count >= 1
    `).get(userId);
    return result.count >= condition.threshold;
  },

  sustained_accuracy: (userId, condition) => {
    const db = getDb();
    const result = db.prepare(`
      SELECT COUNT(*) as total, SUM(is_correct) as correct
      FROM attempts WHERE user_id = ?
    `).get(userId);
    if (!result || result.total < condition.min_attempts) return false;
    return (result.correct / result.total * 100) >= condition.accuracy;
  },

  level: (userId, condition) => {
    const db = getDb();
    const user = db.prepare(`SELECT level FROM users WHERE id = ?`).get(userId);
    return user && user.level >= condition.threshold;
  },

  module_diversity: (userId, condition) => {
    const db = getDb();
    const result = db.prepare(`
      SELECT COUNT(DISTINCT module_slug) as count
      FROM quiz_sessions
      WHERE user_id = ? AND completed = 1
    `).get(userId);
    return result.count >= condition.threshold;
  },

  time_of_day: (userId, condition) => {
    const db = getDb();
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM attempts
      WHERE user_id = ?
        AND CAST(strftime('%H', created_at) AS INTEGER) >= ?
    `).get(userId, condition.hour_after);
    return result.count > 0;
  },

  retry_success: (userId, condition) => {
    const db = getDb();
    // Find questions answered wrong then correct
    const result = db.prepare(`
      SELECT question_id FROM attempts
      WHERE user_id = ? AND is_correct = 0
      INTERSECT
      SELECT question_id FROM attempts
      WHERE user_id = ? AND is_correct = 1
    `).all(userId, userId);
    return result.length > 0;
  },

  // New badges
  module_first: (userId, condition) => {
    const db = getDb();
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM attempts
      WHERE user_id = ? AND module_slug = ?
    `).get(userId, condition.module);
    return result.count >= 1;
  },

  all_modules_tried: (userId, condition) => {
    const db = getDb();
    const result = db.prepare(`
      SELECT COUNT(DISTINCT module_slug) as count
      FROM attempts WHERE user_id = ?
    `).get(userId);
    return result.count >= 4;
  },

  questions_milestone: (userId, condition) => {
    const db = getDb();
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM attempts WHERE user_id = ?
    `).get(userId);
    return result.count >= condition.threshold;
  },
};

// Check and award all unearned badges for a user
// Returns array of newly awarded badges
function evaluateAndAwardBadges(userId) {
  const db = getDb();

  const allBadges = db.prepare(`SELECT * FROM badges`).all();
  const earnedSlugs = new Set(
    db.prepare(`
      SELECT b.slug FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = ?
    `).all(userId).map(b => b.slug)
  );

  const newlyEarned = [];

  for (const badge of allBadges) {
    if (earnedSlugs.has(badge.slug)) continue;

    let condition;
    try {
      condition = JSON.parse(badge.condition);
    } catch {
      continue;
    }

    const evaluator = evaluators[condition.type];
    if (!evaluator) continue;

    try {
      const earned = evaluator(userId, condition);
      if (earned) {
        db.prepare(`
          INSERT OR IGNORE INTO user_badges (user_id, badge_id)
          VALUES (?, ?)
        `).run(userId, badge.id);
        newlyEarned.push({
          slug: badge.slug,
          title: badge.title,
          description: badge.description,
          icon: badge.icon
        });
      }
    } catch (err) {
      console.error(`Badge eval error for ${badge.slug}:`, err.message);
    }
  }

  return newlyEarned;
}

module.exports = { evaluateAndAwardBadges };

