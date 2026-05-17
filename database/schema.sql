-- ============================================================
-- CORE TABLES
-- ============================================================

-- Users (both students and teachers share this table)
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,          -- e.g. "john_doe" or "teacher1"
  display_name  TEXT NOT NULL,                 -- Full name shown on leaderboard
  password_hash TEXT NOT NULL,                 -- bcrypt hash, never plaintext
  role          TEXT NOT NULL DEFAULT 'student', -- 'student' | 'teacher'
  class_group   TEXT,                          -- e.g. "Form 3A", "Grade 10B"
  curriculum    TEXT,                          -- '844' | 'CBE'
  xp_total      INTEGER NOT NULL DEFAULT 0,
  level         INTEGER NOT NULL DEFAULT 1,
  is_active     INTEGER NOT NULL DEFAULT 1,    -- soft delete flag
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

-- Sessions (manual session management, no cookies library needed)
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,                 -- random 32-char hex string
  user_id    INTEGER NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- CONTENT TABLES
-- ============================================================

-- Modules (the four pillars)
CREATE TABLE IF NOT EXISTS modules (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,            -- 'grammar' | 'comprehension' | 'pastpapers' | 'vocabulary'
  title       TEXT NOT NULL,
  description TEXT,
  icon        TEXT,                            -- emoji or icon name
  is_active   INTEGER NOT NULL DEFAULT 1
);

-- Topics (organises questions within modules)
CREATE TABLE IF NOT EXISTS topics (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id   INTEGER NOT NULL REFERENCES modules(id),
  title       TEXT NOT NULL,
  description TEXT,
  curriculum  TEXT DEFAULT 'both',
  difficulty  INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  UNIQUE(module_id, title)
);

-- Questions (grammar drills and past paper questions live here)
CREATE TABLE IF NOT EXISTS questions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id       INTEGER NOT NULL REFERENCES topics(id),
  question_text  TEXT NOT NULL,
  question_type  TEXT NOT NULL,                -- 'mcq' | 'fill_blank' | 'reorder'
  options        TEXT,                         -- JSON array: ["A","B","C","D"]
  correct_answer TEXT NOT NULL,                -- "A" or index or exact text
  explanation    TEXT NOT NULL,                -- WHY the answer is correct - critical for learning
  xp_reward      INTEGER NOT NULL DEFAULT 10,
  difficulty     INTEGER NOT NULL DEFAULT 1,
  source         TEXT,                         -- e.g. "KCSE 2019 Paper 1 Q3"
  curriculum     TEXT DEFAULT 'both',          -- '844' | 'CBE' | 'both'
  is_active      INTEGER NOT NULL DEFAULT 1,
  past_paper_id  INTEGER REFERENCES past_papers(id),
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Passages (for Reading Comprehension module)
CREATE TABLE IF NOT EXISTS passages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id    INTEGER NOT NULL REFERENCES topics(id),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,                   -- full passage text
  word_count  INTEGER,
  difficulty  INTEGER NOT NULL DEFAULT 1,
  source      TEXT,                            -- attribution
  curriculum  TEXT DEFAULT 'both',
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Passage Questions (questions tied to a specific passage)
CREATE TABLE IF NOT EXISTS passage_questions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  passage_id     INTEGER NOT NULL REFERENCES passages(id),
  question_text  TEXT NOT NULL,
  question_type  TEXT NOT NULL DEFAULT 'mcq',
  options        TEXT,                         -- JSON
  correct_answer TEXT NOT NULL,
  explanation    TEXT NOT NULL,
  xp_reward      INTEGER NOT NULL DEFAULT 15,
  sort_order     INTEGER NOT NULL DEFAULT 0
);

-- Vocabulary (for Vocabulary Builder module)
CREATE TABLE IF NOT EXISTS vocabulary (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  word          TEXT NOT NULL UNIQUE,
  definition    TEXT NOT NULL,
  part_of_speech TEXT NOT NULL,               -- noun, verb, adjective, etc.
  example_sentence TEXT NOT NULL,
  synonym       TEXT,                          -- comma-separated
  antonym       TEXT,
  difficulty    INTEGER NOT NULL DEFAULT 1,
  topic_tag     TEXT,                          -- e.g. "academic", "literary", "formal"
  curriculum    TEXT DEFAULT 'both',
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Past Papers (metadata for the Past Paper module)
CREATE TABLE IF NOT EXISTS past_papers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL UNIQUE,
  year         INTEGER NOT NULL,
  paper_number INTEGER NOT NULL,
  subject      TEXT NOT NULL DEFAULT 'English',
  description  TEXT,
  is_active    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Past Paper Questions link to the questions table via topic_id
-- but also carry a paper reference
-- ALTER TABLE questions ADD COLUMN past_paper_id INTEGER REFERENCES past_papers(id);

-- ============================================================
-- PROGRESS TRACKING TABLES
-- ============================================================

-- Every attempt at any question is logged here
CREATE TABLE IF NOT EXISTS attempts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  question_id    INTEGER REFERENCES questions(id),         -- NULL if passage question
  passage_q_id   INTEGER REFERENCES passage_questions(id), -- NULL if regular question
  vocab_id       INTEGER REFERENCES vocabulary(id),        -- NULL if not vocab
  module_slug    TEXT NOT NULL,
  answer_given   TEXT NOT NULL,
  is_correct     INTEGER NOT NULL,                         -- 0 or 1
  time_taken_ms  INTEGER,                                  -- response time in milliseconds
  xp_earned      INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Session-level tracking (a "quiz session" - one sitting)
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  module_slug  TEXT NOT NULL,
  topic_id     INTEGER REFERENCES topics(id),
  started_at   TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at     TEXT,
  score        INTEGER DEFAULT 0,
  total_q      INTEGER DEFAULT 0,
  xp_earned    INTEGER DEFAULT 0,
  completed    INTEGER NOT NULL DEFAULT 0             -- 0 | 1
);

-- Vocabulary review tracking (spaced repetition data)
CREATE TABLE IF NOT EXISTS vocab_reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  vocab_id      INTEGER NOT NULL REFERENCES vocabulary(id),
  ease_factor   REAL NOT NULL DEFAULT 2.5,             -- SM-2 algorithm
  interval_days INTEGER NOT NULL DEFAULT 1,
  next_review   TEXT NOT NULL,                         -- date string
  review_count  INTEGER NOT NULL DEFAULT 0,
  last_reviewed TEXT,
  UNIQUE(user_id, vocab_id)
);

-- XP History (audit trail for all XP changes)
CREATE TABLE IF NOT EXISTS xp_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  xp_change   INTEGER NOT NULL,                        -- positive or negative
  reason      TEXT NOT NULL,                           -- human readable reason
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Badges (master list)
CREATE TABLE IF NOT EXISTS badges (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  condition   TEXT NOT NULL                            -- JSON describing unlock condition
);

-- User Badges (earned badges)
CREATE TABLE IF NOT EXISTS user_badges (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  badge_id   INTEGER NOT NULL REFERENCES badges(id),
  earned_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, badge_id)                            -- can't earn same badge twice
);

-- ============================================================
-- CLASSROOM / TEACHER FEATURES
-- ============================================================

-- Class Challenges (teacher triggers these from dashboard)
CREATE TABLE IF NOT EXISTS challenges (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id  INTEGER NOT NULL REFERENCES users(id),
  module_slug TEXT NOT NULL,
  topic_id    INTEGER REFERENCES topics(id),
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',         -- 'pending'|'active'|'ended'
  started_at  TEXT,
  ended_at    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Teacher Notes (teacher can leave notes on student performance)
CREATE TABLE IF NOT EXISTS teacher_notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  note       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


CREATE TABLE IF NOT EXISTS class_codes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL UNIQUE,
  class_group TEXT NOT NULL,
  curriculum  TEXT NOT NULL,
  created_by  INTEGER NOT NULL REFERENCES users(id),
  expires_at  TEXT NOT NULL,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);


-- ============================================================
-- INDEXES (performance on a slow lab machine matters)
-- ============================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_class_group ON users(class_group);
CREATE INDEX IF NOT EXISTS idx_users_xp_total ON users(xp_total DESC);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Questions
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_curriculum ON questions(curriculum);
CREATE INDEX IF NOT EXISTS idx_questions_past_paper_id ON questions(past_paper_id);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON questions(is_active);

-- Passages
CREATE INDEX IF NOT EXISTS idx_passages_topic_id ON passages(topic_id);
CREATE INDEX IF NOT EXISTS idx_passages_difficulty ON passages(difficulty);

-- Passage Questions
CREATE INDEX IF NOT EXISTS idx_passage_questions_passage_id ON passage_questions(passage_id);

-- Vocabulary
CREATE INDEX IF NOT EXISTS idx_vocabulary_difficulty ON vocabulary(difficulty);
CREATE INDEX IF NOT EXISTS idx_vocabulary_topic_tag ON vocabulary(topic_tag);
CREATE INDEX IF NOT EXISTS idx_vocabulary_curriculum ON vocabulary(curriculum);

-- Attempts (most queried table — index everything useful)
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_module_slug ON attempts(module_slug);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_attempts_is_correct ON attempts(is_correct);
CREATE INDEX IF NOT EXISTS idx_attempts_user_module ON attempts(user_id, module_slug);
CREATE INDEX IF NOT EXISTS idx_attempts_user_correct ON attempts(user_id, is_correct);

-- Quiz Sessions
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_module_slug ON quiz_sessions(module_slug);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_started_at ON quiz_sessions(started_at);

-- Vocab Reviews
CREATE INDEX IF NOT EXISTS idx_vocab_reviews_user_id ON vocab_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_reviews_next_review ON vocab_reviews(next_review);
CREATE INDEX IF NOT EXISTS idx_vocab_reviews_user_vocab ON vocab_reviews(user_id, vocab_id);

-- XP History
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_created_at ON xp_history(created_at);

-- User Badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Challenges
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_teacher_id ON challenges(teacher_id);

-- Teacher Notes
CREATE INDEX IF NOT EXISTS idx_teacher_notes_student_id ON teacher_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notes_teacher_id ON teacher_notes(teacher_id);

-- ============================================================
-- SEED DATA — Modules (inserted once on first run)
-- ============================================================

INSERT OR IGNORE INTO modules (slug, title, description, icon) VALUES
  ('grammar',        'Grammar Drills',         'Targeted grammar practice with instant feedback',         '⚔️'),
  ('comprehension',  'Reading Comprehension',  'Structured passage reading and analysis exercises',       '🗺️'),
  ('pastpapers',     'Past Papers',            'Timed KCSE examination practice with model answers',      '📜'),
  ('vocabulary',     'Vocabulary Builder',     'Daily word learning with spaced repetition',              '🔤');

-- ============================================================
-- SEED DATA — Topics
-- ============================================================

-- Grammar Topics (curriculum: both — serve 8-4-4 and CBE)
INSERT OR IGNORE INTO topics (module_id, title, description, curriculum, difficulty, sort_order) VALUES
  (1, 'Simple Present Tense',         'Habits, facts, and routines',                    'both', 1, 1),
  (1, 'Simple Past Tense',            'Completed actions in the past',                  'both', 1, 2),
  (1, 'Present Continuous Tense',     'Actions happening right now',                    'both', 1, 3),
  (1, 'Past Continuous Tense',        'Actions ongoing at a past point',                'both', 2, 4),
  (1, 'Present Perfect Tense',        'Past actions with present relevance',            'both', 2, 5),
  (1, 'Past Perfect Tense',           'Actions completed before another past action',   'both', 3, 6),
  (1, 'Future Tenses',                'Will, going to, and future continuous',          'both', 2, 7),
  (1, 'Subject-Verb Agreement',       'Singular and plural concord rules',              'both', 2, 8),
  (1, 'Articles',                     'Correct use of a, an, and the',                  'both', 1, 9),
  (1, 'Prepositions',                 'In, on, at, by, with and their usage',           'both', 2, 10),
  (1, 'Reported Speech',              'Direct to indirect speech transformation',       'both', 3, 11),
  (1, 'Relative Clauses',             'Who, which, that, whose',                        'both', 3, 12),
  (1, 'Conjunctions',                 'Coordinating and subordinating conjunctions',    'both', 2, 13),
  (1, 'Question Tags',                'Forming correct question tags',                  'both', 2, 14),
  (1, 'Passive Voice',                'Active to passive transformation',               'both', 3, 15);

-- Reading Comprehension Topics
INSERT OR IGNORE INTO topics (module_id, title, description, curriculum, difficulty, sort_order) VALUES
  (2, 'Narrative Passages',     'Story-based texts — identifying plot and character',   'both', 1, 1),
  (2, 'Expository Passages',    'Informational texts — main idea and detail',           'both', 2, 2),
  (2, 'Argumentative Passages', 'Opinion texts — identifying claims and evidence',      'both', 3, 3),
  (2, 'Literary Passages',      'Prose extracts from literature set books',             '844',  3, 4),
  (2, 'CBE Competency Texts',   'Real-world texts aligned to CBE learning areas',      'CBE',  2, 5);

-- Past Papers Topics
INSERT OR IGNORE INTO topics (module_id, title, description, curriculum, difficulty, sort_order) VALUES
  (3, 'KCSE 2019 Paper 1', 'Full paper — Grammar, Cloze, Oral',                         '844', 2, 1),
  (3, 'KCSE 2020 Paper 1', 'Full paper — Grammar, Cloze, Oral',                         '844', 2, 2),
  (3, 'KCSE 2021 Paper 1', 'Full paper — Grammar, Cloze, Oral',                         '844', 2, 3),
  (3, 'KCSE 2022 Paper 1', 'Full paper — Grammar, Cloze, Oral',                         '844', 2, 4),
  (3, 'KCSE 2023 Paper 1', 'Full paper — Grammar, Cloze, Oral',                         '844', 3, 5),
  (3, 'KCSE 2019 Paper 2', 'Full paper — Reading, Writing, Literary Appreciation',      '844', 3, 6),
  (3, 'KCSE 2020 Paper 2', 'Full paper — Reading, Writing, Literary Appreciation',      '844', 3, 7),
  (3, 'KCSE 2021 Paper 2', 'Full paper — Reading, Writing, Literary Appreciation',      '844', 3, 8),
  (3, 'KCSE 2022 Paper 2', 'Full paper — Reading, Writing, Literary Appreciation',      '844', 3, 9),
  (3, 'KCSE 2023 Paper 2', 'Full paper — Reading, Writing, Literary Appreciation',      '844', 3, 10);

-- Vocabulary Topics
INSERT OR IGNORE INTO topics (module_id, title, description, curriculum, difficulty, sort_order) VALUES
  (4, 'Academic Vocabulary',   'Words common in formal writing and examinations',       'both', 2, 1),
  (4, 'Literary Terms',        'Terms used in Literature analysis and appreciation',   'both', 2, 2),
  (4, 'Formal Register',       'Words for formal speech and professional writing',     'both', 2, 3),
  (4, 'Idiomatic Expressions', 'Common English idioms and their meanings',             'both', 3, 4),
  (4, 'Synonyms and Antonyms', 'Expanding vocabulary through word relationships',      'both', 1, 5),
  (4, 'CBE Core Vocabulary',   'Words central to CBE competency-based discussions',    'CBE',  2, 6);

-- ============================================================
-- SEED DATA — Badges (master list)
-- ============================================================

INSERT OR IGNORE INTO badges (slug, title, description, icon, condition) VALUES
  ('first_answer',     'First Step',       'Answered your first question',                           '👣', '{"type":"attempt_count","threshold":1}'),
  ('streak_3',         'On a Roll',        '3-day login streak',                                     '🔥', '{"type":"streak","threshold":3}'),
  ('streak_7',         'Week Warrior',     '7-day login streak',                                     '🗓️', '{"type":"streak","threshold":7}'),
  ('streak_10',        'Streak Master',    '10 correct answers in a row',                            '⚡', '{"type":"consecutive_correct","threshold":10}'),
  ('grammar_ninja',    'Grammar Ninja',    '100% score on any grammar drill',                        '🥋', '{"type":"perfect_score","module":"grammar"}'),
  ('speed_reader',     'Speed Reader',     'Completed a comprehension passage under the time limit', '💨', '{"type":"timed_completion","module":"comprehension"}'),
  ('exam_warrior',     'Exam Warrior',     'Completed a full past paper',                            '⚔️', '{"type":"paper_completed","module":"pastpapers"}'),
  ('vocab_25',         'Word Collector',   'Learned 25 vocabulary words',                            '📚', '{"type":"vocab_learned","threshold":25}'),
  ('vocab_100',        'Lexicon Builder',  'Learned 100 vocabulary words',                           '📖', '{"type":"vocab_learned","threshold":100}'),
  ('accuracy_80',      'Sharp Mind',       'Maintained 80% accuracy over 50 questions',              '🎯', '{"type":"sustained_accuracy","accuracy":80,"min_attempts":50}'),
  ('level_3',          'Wordsmith',        'Reached Level 3',                                        '🖊️', '{"type":"level","threshold":3}'),
  ('level_5',          'Griot',            'Reached the highest level — Level 5',                    '🌍', '{"type":"level","threshold":5}'),
  ('all_modules',      'All-Rounder',      'Completed at least one session in all four modules',     '🏅', '{"type":"module_diversity","threshold":4}'),
  ('night_owl',        'Night Owl',        'Studied after 8pm',                                      '🦉', '{"type":"time_of_day","hour_after":20}'),
  ('comeback_kid',     'Comeback Kid',     'Retried a failed quiz and passed it',                    '💪', '{"type":"retry_success"}');

-- ============================================================
-- SEED DATA — Past Papers metadata
-- ============================================================

INSERT OR IGNORE INTO past_papers (title, year, paper_number, subject, description) VALUES
  ('KCSE 2019 English Paper 1', 2019, 1, 'English', 'Grammar, Cloze Test, Oral Skills'),
  ('KCSE 2019 English Paper 2', 2019, 2, 'English', 'Reading, Writing, Literary Appreciation'),
  ('KCSE 2020 English Paper 1', 2020, 1, 'English', 'Grammar, Cloze Test, Oral Skills'),
  ('KCSE 2020 English Paper 2', 2020, 2, 'English', 'Reading, Writing, Literary Appreciation'),
  ('KCSE 2021 English Paper 1', 2021, 1, 'English', 'Grammar, Cloze Test, Oral Skills'),
  ('KCSE 2021 English Paper 2', 2021, 2, 'English', 'Reading, Writing, Literary Appreciation'),
  ('KCSE 2022 English Paper 1', 2022, 1, 'English', 'Grammar, Cloze Test, Oral Skills'),
  ('KCSE 2022 English Paper 2', 2022, 2, 'English', 'Reading, Writing, Literary Appreciation'),
  ('KCSE 2023 English Paper 1', 2023, 1, 'English', 'Grammar, Cloze Test, Oral Skills'),
  ('KCSE 2023 English Paper 2', 2023, 2, 'English', 'Reading, Writing, Literary Appreciation');

-- ============================================================
-- SEED DATA — Sample Vocabulary (starter pack, 20 words)
-- ============================================================

INSERT OR IGNORE INTO vocabulary (word, definition, part_of_speech, example_sentence, synonym, antonym, difficulty, topic_tag) VALUES
  ('eloquent',     'Fluent and persuasive in speaking or writing',                          'adjective', 'She gave an eloquent speech that moved the entire assembly.',          'articulate, expressive',   'inarticulate',      2, 'academic'),
  ('ambiguous',    'Open to more than one interpretation; unclear',                          'adjective', 'The question was ambiguous and confused most candidates.',              'vague, unclear',           'clear, explicit',   2, 'academic'),
  ('concede',      'To admit that something is true after resisting it',                     'verb',      'He finally conceded that his argument had a flaw.',                    'acknowledge, admit',       'deny, refute',      2, 'academic'),
  ('frivolous',    'Not having any serious purpose or value',                                'adjective', 'The judge dismissed the frivolous complaint immediately.',              'trivial, petty',           'serious, important', 2, 'academic'),
  ('protagonist',  'The main character in a literary work',                                  'noun',      'The protagonist of the novel faces many moral dilemmas.',              'hero, central character',  'antagonist',        1, 'literary'),
  ('antagonist',   'A person who opposes or is hostile to the main character',               'noun',      'The antagonist manipulates everyone around the protagonist.',          'villain, opponent',        'protagonist',       1, 'literary'),
  ('metaphor',     'A figure of speech describing something as though it were something else','noun',     'Life is a journey is a common metaphor.',                              'analogy, symbol',          'literal statement', 1, 'literary'),
  ('irony',        'The expression of meaning through language of opposite tendency',        'noun',      'It was ironic that the fire station burned down.',                     'sarcasm, paradox',         '',                  2, 'literary'),
  ('verbose',      'Using more words than necessary, wordy',                                 'adjective', 'The verbose essay lost marks for lack of conciseness.',                'wordy, long-winded',       'concise, brief',    3, 'academic'),
  ('tenacious',    'Holding firmly to something, persistent',                                'adjective', 'Her tenacious studying paid off when results were released.',          'persistent, determined',   'irresolute, weak',  2, 'academic'),
  ('inference',    'A conclusion reached based on evidence and reasoning',                   'noun',      'From the text, we can make the inference that the character is guilty.','deduction, conclusion',    'assumption',        2, 'academic'),
  ('contradict',   'To deny the truth of a statement by asserting the opposite',             'verb',      'The witness contradicted the defendant in court.',                     'deny, dispute',            'confirm, agree',    1, 'academic'),
  ('empathy',      'The ability to understand and share feelings of another',                'noun',      'A good teacher shows empathy toward struggling students.',              'compassion, understanding', 'indifference',     1, 'academic'),
  ('hypothesis',   'A proposed explanation made on the basis of limited evidence',           'noun',      'The scientist tested her hypothesis through careful experiments.',     'theory, proposition',      'fact, certainty',   3, 'academic'),
  ('narrate',      'To give an account of events, to tell a story',                          'verb',      'The student was asked to narrate the events of the short story.',      'recount, tell',            '',                  1, 'literary'),
  ('cynical',      'Believing that people are motivated purely by self-interest',            'adjective', 'His cynical view of politics made him distrust all leaders.',          'skeptical, distrustful',   'optimistic, naive', 3, 'academic'),
  ('persevere',    'To continue in a course of action despite difficulty',                   'verb',      'You must persevere through challenges to achieve your goals.',         'persist, endure',          'give up, quit',     1, 'academic'),
  ('allude',       'To suggest or call attention to indirectly',                             'verb',      'The poem alludes to the biblical story of creation.',                  'hint, suggest',            'state directly',    3, 'literary'),
  ('coherent',     'Logical and consistent, forming a unified whole',                        'adjective', 'Your essay must be coherent with a clear beginning, middle and end.',  'logical, consistent',      'incoherent, jumbled',2,'academic'),
  ('elaborate',    'To develop or present a theory or idea in detail',                       'verb',      'Please elaborate on your answer to score full marks.',                 'expand, detail',           'summarise',         1, 'academic');

-- ============================================================
-- SEED DATA — Sample Grammar Questions (10 starters)
-- ============================================================

INSERT OR IGNORE INTO questions (topic_id, question_text, question_type, options, correct_answer, explanation, xp_reward, difficulty, source, curriculum) VALUES
  (2, 'Which sentence uses the Simple Past Tense correctly?',
   'mcq',
   '["A. She go to school yesterday.", "B. She went to school yesterday.", "C. She goes to school yesterday.", "D. She has go to school yesterday."]',
   'B',
   'Simple Past Tense uses the past form of the verb. \"Went\" is the past form of \"go\". The other options either use the wrong tense form or mix tenses incorrectly.',
   10, 1, 'Grammar Foundation', 'both'),

  (8, 'Choose the correct sentence:',
   'mcq',
   '["A. The committee have made their decision.", "B. The committee has made its decision.", "C. The committee have made its decision.", "D. The committee has made their decision."]',
   'B',
   '\"Committee\" is a collective noun treated as singular in formal Kenyan English, so it takes \"has\" and \"its\". This is a very common KCSE trap question.',
   10, 2, 'KCSE 2021 Paper 1', '844'),

  (9, 'Fill in the blank: She is _____ honest woman who works _____ hospital.',
   'mcq',
   '["A. a / in a", "B. an / in a", "C. an / in the", "D. a / in the"]',
   'B',
   '\"An\" is used before vowel sounds — \"honest\" starts with a silent H so sounds like it begins with \"o\". \"A hospital\" uses \"a\" because H in hospital is pronounced. But she works \"in a hospital\" (any hospital, not a specific one).',
   10, 2, 'Grammar Foundation', 'both'),

  (10, 'Which preposition correctly completes the sentence? She has been waiting _____ two hours.',
   'mcq',
   '["A. since", "B. for", "C. during", "D. from"]',
   'B',
   '\"For\" is used with a period/duration of time (two hours, three days, a week). \"Since\" is used with a specific point in time (since morning, since 2019). This distinction is heavily tested in KCSE.',
   10, 1, 'Grammar Foundation', 'both'),

  (11, 'Change to reported speech: John said, "I will finish the work tomorrow."',
   'mcq',
   '["A. John said he will finish the work tomorrow.", "B. John said he would finish the work the following day.", "C. John said he would finish the work tomorrow.", "D. John said he will finish the work the following day."]',
   'B',
   'In reported speech: (1) \"will\" becomes \"would\" — backshift of tense. (2) \"tomorrow\" becomes \"the following day\" — time expression changes. Both changes must happen for a correct answer.',
   15, 3, 'KCSE 2022 Paper 1', '844'),

  (14, 'Add the correct question tag: She hasn''t eaten yet, _____?',
   'mcq',
   '["A. hasn\''t she", "B. has she", "C. had she", "D. didn\''t she"]',
   'B',
   'Question tags use the opposite auxiliary verb and reverse the polarity. The main clause is negative (hasn\''t), so the tag must be positive (has). The subject pronoun \"she\" is retained.',
   10, 2, 'Grammar Foundation', 'both'),

  (15, 'Rewrite in passive voice: The teacher marked all the scripts last night.',
   'mcq',
   '["A. All the scripts were mark by the teacher last night.", "B. All the scripts are marked by the teacher last night.", "C. All the scripts were marked by the teacher last night.", "D. All the scripts has been marked by the teacher last night."]',
   'C',
   'Passive voice formula: Object + was/were + past participle + by + subject. \"Marked\" is the past participle of \"mark\". Since the action is past, we use \"were\" (plural subject: scripts).',
   15, 3, 'KCSE 2023 Paper 1', '844'),

  (1, 'Which sentence is in the Simple Present Tense?',
   'mcq',
   '["A. He was reading a book.", "B. He reads a book every evening.", "C. He has read the book.", "D. He will read the book."]',
   'B',
   'Simple Present Tense expresses habits and routines. \"Reads\" (third person singular: he/she/it + verb+s) shows a habitual action. The other options are Past Continuous, Present Perfect, and Future respectively.',
   10, 1, 'Grammar Foundation', 'both'),

  (5, 'Which sentence uses Present Perfect correctly?',
   'mcq',
   '["A. I have saw that film last week.", "B. I saw that film last week.", "C. I have seen that film before.", "D. I had seen that film before."]',
   'C',
   'Present Perfect = have/has + past participle. \"Seen\" is the past participle of \"see\". Option A is wrong (\"saw\" is not a past participle). Option B is Simple Past. Option D is Past Perfect. Crucially, Present Perfect does NOT use specific past time expressions like \"last week\" — that forces Simple Past.',
   15, 2, 'Grammar Foundation', 'both'),

  (13, 'Choose the correct conjunction: She studied hard _____ she failed the exam.',
   'mcq',
   '["A. so", "B. because", "C. yet", "D. since"]',
   'C',
   '\"Yet\" is a contrastive conjunction showing unexpected result — she studied hard but unexpectedly failed. \"So\" implies result in the same direction. \"Because\" implies she failed CAUSED the studying. \"Since\" implies time or reason but doesn\''t fit the contrast here.',
   10, 2, 'Grammar Foundation', 'both');

-- ============================================================
-- PRAGMAS — run these on every connection open
-- (Put in your database.js initialization code, not here)
-- ============================================================



-- ============================================================
-- VIEWS — pre-built queries for the teacher dashboard
-- ============================================================

-- Class performance overview per module
CREATE VIEW IF NOT EXISTS vw_class_performance AS
SELECT
  u.class_group,
  u.curriculum,
  a.module_slug,
  COUNT(a.id)                                          AS total_attempts,
  SUM(a.is_correct)                                    AS correct_answers,
  ROUND(SUM(a.is_correct) * 100.0 / COUNT(a.id), 1)   AS accuracy_pct,
  ROUND(AVG(a.time_taken_ms) / 1000.0, 1)             AS avg_response_sec
FROM attempts a
JOIN users u ON a.user_id = u.id
WHERE u.role = 'student'
  AND u.is_active = 1
GROUP BY u.class_group, u.curriculum, a.module_slug;

-- Weak topics — where students are getting less than 60% correct
CREATE VIEW IF NOT EXISTS vw_weak_topics AS
SELECT
  t.title                                              AS topic_title,
  m.title                                              AS module_title,
  u.class_group,
  COUNT(a.id)                                          AS total_attempts,
  ROUND(SUM(a.is_correct) * 100.0 / COUNT(a.id), 1)   AS accuracy_pct
FROM attempts a
JOIN questions q  ON a.question_id = q.id
JOIN topics t     ON q.topic_id = t.id
JOIN modules m    ON t.module_id = m.id
JOIN users u      ON a.user_id = u.id
WHERE u.role = 'student'
  AND u.is_active = 1
GROUP BY t.id, u.class_group
HAVING accuracy_pct < 60
   AND total_attempts >= 5
ORDER BY accuracy_pct ASC;

-- Weekly leaderboard
CREATE VIEW IF NOT EXISTS vw_weekly_leaderboard AS
SELECT
  u.id,
  u.display_name,
  u.class_group,
  u.level,
  COALESCE(SUM(a.xp_earned), 0)  AS weekly_xp,
  COUNT(a.id)                    AS attempts_this_week
FROM users u
LEFT JOIN attempts a
  ON a.user_id = u.id
  AND a.created_at >= datetime('now', '-7 days')
WHERE u.role = 'student'
  AND u.is_active = 1
GROUP BY u.id
ORDER BY weekly_xp DESC;

-- Student progress per module (for student dashboard)
CREATE VIEW IF NOT EXISTS vw_student_module_progress AS
SELECT
  a.user_id,
  a.module_slug,
  COUNT(a.id)                                         AS total_attempts,
  SUM(a.is_correct)                                   AS correct,
  ROUND(SUM(a.is_correct) * 100.0 / COUNT(a.id), 1)  AS accuracy_pct,
  COALESCE(SUM(a.xp_earned), 0)                       AS xp_from_module,
  MAX(a.created_at)                                   AS last_activity
FROM attempts a
GROUP BY a.user_id, a.module_slug;

-- Vocabulary due for review today (spaced repetition queue)
CREATE VIEW IF NOT EXISTS vw_vocab_due_today AS
SELECT
  vr.user_id,
  v.id         AS vocab_id,
  v.word,
  v.definition,
  v.part_of_speech,
  v.example_sentence,
  v.difficulty,
  vr.ease_factor,
  vr.interval_days,
  vr.review_count
FROM vocab_reviews vr
JOIN vocabulary v ON vr.vocab_id = v.id
WHERE vr.next_review <= date('now')
  AND v.is_active = 1
ORDER BY vr.next_review ASC;

-- ============================================================
-- WHERE TO SOURCE PAST PAPERS
-- ============================================================

/*
PRIMARY SOURCES (free, legitimate, reliable):

1. KNEC Official Website — knec.ac.ke
   - Has past papers going back to 2015
   - Download as PDF, manually transcribe questions into the database
   - This is the authoritative source — use this first

2. Kenya National Examinations Council via KICD — kicd.ac.ke
   - Curriculum designs and some past assessment materials

3. Free Kenyan education sites (verify before using):
   - kcse-online.com          — large question bank, free
   - kenyaplex.com            — past papers organized by subject and year
   - elimu.net                — past papers + marking schemes
   - schoolsnetkenya.com      — comprehensive past paper archive
   - mwalimuplus.com          — teacher-oriented, includes marking schemes

4. Physical copies from school:
   - Ask the cooperating teacher for past paper booklets
   - The school almost certainly has printed KCSE 2019-2023 papers in the staffroom
   - These are the most reliable — photocopy and transcribe

TRANSCRIPTION STRATEGY:
  - Do NOT try to enter all questions at once
  - Enter 10 questions per sitting
  - Always enter the explanation/marking scheme alongside the question
  - Tag each question with source e.g. "KCSE 2022 Paper 1 Q4"
  - Start with 2022 and 2023 — most relevant to current Form 3 and 4 students

MARKING SCHEMES:
  - Always source the official KNEC marking scheme alongside each paper
  - The explanation column in the questions table IS the marking scheme
  - Write explanations that teach, not just state the answer
*/
