PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id),
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS student_profiles (
  student_id TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  diagnostic_json TEXT,
  active_lesson TEXT NOT NULL DEFAULT 'airport',
  words_json TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_progress (
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  step TEXT NOT NULL,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (student_id, lesson_id, step)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id),
  lesson_id TEXT NOT NULL,
  title TEXT NOT NULL,
  instruction TEXT NOT NULL,
  due_at TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_by TEXT NOT NULL DEFAULT 'teacher',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  reflection TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS homework_submissions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  draft_id TEXT NOT NULL REFERENCES drafts(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at INTEGER NOT NULL,
  UNIQUE (task_id, draft_id)
);

CREATE TABLE IF NOT EXISTS grading_results (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE REFERENCES homework_submissions(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL DEFAULT 'teacher',
  offset_seconds INTEGER NOT NULL DEFAULT 0,
  feedback TEXT NOT NULL,
  score REAL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_tasks_class ON tasks(class_id, status);
CREATE INDEX IF NOT EXISTS idx_drafts_student ON drafts(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON homework_submissions(student_id, submitted_at DESC);

INSERT OR IGNORE INTO classes (id, name, created_at)
VALUES ('english-speaking-lab', '英语口语练习班', unixepoch() * 1000);

INSERT OR IGNORE INTO tasks (
  id, class_id, lesson_id, title, instruction, due_at, status, created_by, created_at
) VALUES (
  'starter', 'english-speaking-lab', 'airport', '旅行沟通 · 第一次口语练习',
  '完成精听、跟读和情景练习，提交一段你满意的录音。', NULL, 'published', 'system', unixepoch() * 1000
);
