node -e "
const { getDb } = require('./database/database');
const db = getDb();

const newBadges = [
  ['grammar_first',  'Grammar Initiate',  'Answered your first grammar question',      '⚔️',  '{\"type\":\"module_first\",\"module\":\"grammar\"}'],
  ['reading_first',  'First Reader',      'Completed your first reading passage',      '📖',  '{\"type\":\"module_first\",\"module\":\"comprehension\"}'],
  ['vocab_first',    'Word Apprentice',   'Reviewed your first vocabulary word',       '🔤',  '{\"type\":\"module_first\",\"module\":\"vocabulary\"}'],
  ['papers_first',   'Exam Entrant',      'Attempted your first past paper',           '📜',  '{\"type\":\"paper_completed\",\"module\":\"pastpapers\"}'],
  ['all_modules',    'All-Rounder',       'Tried all four learning modules',           '🏅',  '{\"type\":\"all_modules_tried\"}'],
  ['questions_10',   'Getting Started',   'Answered 10 questions',                     '🌱',  '{\"type\":\"questions_milestone\",\"threshold\":10}'],
  ['questions_50',   'Dedicated Learner', 'Answered 50 questions',                     '💪',  '{\"type\":\"questions_milestone\",\"threshold\":50}'],
  ['questions_100',  'Century Scholar',   'Answered 100 questions',                    '💯',  '{\"type\":\"questions_milestone\",\"threshold\":100}'],
  ['comeback_kid',   'Comeback Kid',      'Retried a question and got it right',       '💪',  '{\"type\":\"retry_success\"}'],
  ['night_owl',      'Night Owl',         'Studied after 8pm',                         '🦉',  '{\"type\":\"time_of_day\",\"hour_after\":20}'],
];

const stmt = db.prepare('INSERT OR IGNORE INTO badges (slug, title, description, icon, condition) VALUES (?, ?, ?, ?, ?)');
newBadges.forEach(b => {
  const r = stmt.run(...b);
  console.log(r.changes > 0 ? 'Inserted: ' + b[0] : 'Already exists: ' + b[0]);
});
console.log('Done');
"
