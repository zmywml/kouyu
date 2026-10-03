PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
  display_name TEXT NOT NULL,
  class_id TEXT NOT NULL REFERENCES classes(id),
  student_id TEXT REFERENCES students(id),
  teacher_id TEXT REFERENCES teachers(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at INTEGER NOT NULL,
  CHECK (
    (role = 'student' AND student_id IS NOT NULL AND teacher_id IS NULL) OR
    (role = 'teacher' AND teacher_id IS NOT NULL AND student_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_accounts_class_role ON accounts(class_id, role, status);

INSERT OR IGNORE INTO students (id, class_id, display_name, created_at, last_seen_at) VALUES
  ('student-001', 'english-speaking-lab', '林晓雨', unixepoch() * 1000, unixepoch() * 1000),
  ('student-002', 'english-speaking-lab', '陈一鸣', unixepoch() * 1000, unixepoch() * 1000),
  ('student-003', 'english-speaking-lab', '周可欣', unixepoch() * 1000, unixepoch() * 1000);

INSERT OR IGNORE INTO student_profiles (student_id, active_lesson, words_json, updated_at) VALUES
  ('student-001', 'airport', '[]', unixepoch() * 1000),
  ('student-002', 'campus', '[]', unixepoch() * 1000),
  ('student-003', 'opinion', '[]', unixepoch() * 1000);

INSERT OR IGNORE INTO teachers (id, display_name, created_at) VALUES
  ('teacher-001', '王老师', unixepoch() * 1000),
  ('teacher-002', '李老师', unixepoch() * 1000);

-- 初始密码仅用于首次验收。password_hash 使用 PBKDF2-SHA256、120000 次迭代。
INSERT OR IGNORE INTO accounts (
  id, username, password_salt, password_hash, role, display_name, class_id, student_id, teacher_id, status, created_at
) VALUES
  ('account-student-001', 'student01', 'c7c690e961057449279be05457c67250', '689453036787701108f14713e0c092a966f9dc1889fc105734e2ccba6c29e243', 'student', '林晓雨', 'english-speaking-lab', 'student-001', NULL, 'active', unixepoch() * 1000),
  ('account-student-002', 'student02', 'f7a0f6039cdab1edc75ba745b3fdf119', '79217c644c164da5a5c72bef18860794178c93ba466f6a03e45b452513e57382', 'student', '陈一鸣', 'english-speaking-lab', 'student-002', NULL, 'active', unixepoch() * 1000),
  ('account-student-003', 'student03', '7e2948469a3d2f4b231de87c6cab2cf1', '101620d7c94e6c6e3c71515e38bd3a46ceae395b772ecb53b9a97124f5739062', 'student', '周可欣', 'english-speaking-lab', 'student-003', NULL, 'active', unixepoch() * 1000),
  ('account-teacher-001', 'teacher01', 'e80967de14a7a876eceeea5be348a70b', '50e461a4c335166f1aff3c326bffa216faa7670ff198801753c9e4f1cc52d1c7', 'teacher', '王老师', 'english-speaking-lab', NULL, 'teacher-001', 'active', unixepoch() * 1000),
  ('account-teacher-002', 'teacher02', '5931c33aa98f7e97933cc49b6add4527', '4b5c66905d1ff344272b2f29a07cea0a076e9a648f26e50b350d00467ed37a56', 'teacher', '李老师', 'english-speaking-lab', NULL, 'teacher-002', 'active', unixepoch() * 1000);
