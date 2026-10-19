-- D1 migration 0004: GHBC Academy (courses, lessons, quizzes, certification).
-- Adds the learning/certification data model described in
-- docs/ACADEMY_PLAN.md (operations repo). Content questions are generated from
-- the GS 1207:2018 corpus and always carry clause/requirement provenance.

-- Catalog --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certifications (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'foundation',
  description TEXT,
  price_ghs_minor TEXT NOT NULL DEFAULT '0',
  is_free INTEGER NOT NULL DEFAULT 0,
  prerequisite_slug TEXT,
  exam_questions INTEGER,
  exam_minutes INTEGER,
  exam_pass_percent INTEGER NOT NULL DEFAULT 80,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS academy_courses (
  id TEXT PRIMARY KEY,
  certification_id TEXT NOT NULL REFERENCES certifications(id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  part_no INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (certification_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_academy_courses_cert ON academy_courses(certification_id, sort_order);

CREATE TABLE IF NOT EXISTS academy_lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES academy_courses(id),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body_md TEXT,
  est_minutes INTEGER NOT NULL DEFAULT 10,
  source_clauses_json TEXT,
  source_pages_json TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_course ON academy_lessons(course_id, sort_order);

-- Questions (auto-generated from the corpus; provenance mandatory) -----------
CREATE TABLE IF NOT EXISTS academy_questions (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES academy_courses(id),
  lesson_id TEXT REFERENCES academy_lessons(id),
  kind TEXT NOT NULL,                 -- definition | threshold | scenario | matching
  part_no INTEGER,
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'standard',
  clause_id TEXT,
  requirement_id TEXT,
  page INTEGER,
  content_hash TEXT,
  verification_status TEXT NOT NULL DEFAULT 'extracted',
  is_exam_eligible INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_academy_questions_course ON academy_questions(course_id, kind);
CREATE INDEX IF NOT EXISTS idx_academy_questions_part ON academy_questions(part_no);

-- Learner state --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS academy_enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  certification_id TEXT NOT NULL REFERENCES certifications(id),
  status TEXT NOT NULL DEFAULT 'active',   -- active | completed | withdrawn
  enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  UNIQUE (user_id, certification_id)
);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_user ON academy_enrollments(user_id);

CREATE TABLE IF NOT EXISTS academy_lesson_progress (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL REFERENCES academy_enrollments(id),
  lesson_id TEXT NOT NULL REFERENCES academy_lessons(id),
  completed_at TEXT,
  seconds_spent INTEGER NOT NULL DEFAULT 0,
  UNIQUE (enrollment_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS academy_quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  enrollment_id TEXT REFERENCES academy_enrollments(id),
  course_id TEXT REFERENCES academy_courses(id),
  certification_id TEXT REFERENCES certifications(id),
  mode TEXT NOT NULL DEFAULT 'quiz',       -- quiz | exam
  score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  answers_json TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_academy_attempts_user ON academy_quiz_attempts(user_id, certification_id);

-- Proof ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS academy_certificates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  certification_id TEXT NOT NULL REFERENCES certifications(id),
  serial TEXT NOT NULL UNIQUE,
  recipient_name TEXT NOT NULL,
  issued_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT,
  verify_hash TEXT NOT NULL UNIQUE,
  revoked_at TEXT,
  revoke_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_academy_certificates_user ON academy_certificates(user_id);
