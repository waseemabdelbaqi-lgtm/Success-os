-- GATE 2: Success OS Interactive Book Engine
-- Migration 001 — core curriculum + book + student annotation schema
-- Non-destructive: additive tables only. Does not touch Firebase/auth tables.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS curriculum_versions (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL DEFAULT 'Jordan',
  curriculum TEXT NOT NULL DEFAULT 'national',
  version_label TEXT NOT NULL,
  authority TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS academic_years (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS educational_stages (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL REFERENCES educational_stages(id),
  code TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  age_profile TEXT NOT NULL DEFAULT 'grades_1_3',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(stage_id, code)
);

CREATE TABLE IF NOT EXISTS semesters (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS pathways (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(code)
);

CREATE TABLE IF NOT EXISTS book_series (
  id TEXT PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  subject_id TEXT REFERENCES subjects(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  series_id TEXT REFERENCES book_series(id),
  curriculum_version_id TEXT REFERENCES curriculum_versions(id),
  academic_year_id TEXT REFERENCES academic_years(id),
  stage_id TEXT REFERENCES educational_stages(id),
  grade_id TEXT REFERENCES grades(id),
  semester_id TEXT REFERENCES semesters(id),
  pathway_id TEXT REFERENCES pathways(id),
  subject_id TEXT REFERENCES subjects(id),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  book_type TEXT NOT NULL DEFAULT 'student',
  official_source_url TEXT,
  inventory_cell_id TEXT,
  completeness_claim TEXT NOT NULL DEFAULT 'not_complete',
  gate1_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS book_versions (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id),
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  edition_label TEXT,
  language TEXT NOT NULL DEFAULT 'ar',
  published_at TEXT,
  replaces_version_id TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(book_id, version_number)
);

CREATE TABLE IF NOT EXISTS book_sources (
  id TEXT PRIMARY KEY,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  name TEXT NOT NULL,
  url TEXT,
  authority_type TEXT,
  usage TEXT,
  license TEXT,
  verification_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS book_rights (
  id TEXT PRIMARY KEY,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  rights_status TEXT NOT NULL,
  notes TEXT,
  classified_by TEXT,
  classified_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS book_parts (
  id TEXT PRIMARY KEY,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  position INTEGER NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(book_version_id, position)
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  part_id TEXT REFERENCES book_parts(id),
  position INTEGER NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(book_version_id, position)
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units(id),
  position INTEGER NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  estimated_minutes INTEGER,
  difficulty TEXT,
  editorial_status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(unit_id, position)
);

CREATE TABLE IF NOT EXISTS lesson_sections (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  position INTEGER NOT NULL,
  code TEXT,
  title_ar TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(lesson_id, position)
);

CREATE TABLE IF NOT EXISTS book_pages (
  id TEXT PRIMARY KEY,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  lesson_id TEXT REFERENCES lessons(id),
  position INTEGER NOT NULL,
  official_page_label TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(book_version_id, position)
);

CREATE TABLE IF NOT EXISTS content_blocks (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  section_id TEXT REFERENCES lesson_sections(id),
  page_id TEXT REFERENCES book_pages(id),
  position INTEGER NOT NULL,
  type TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ar',
  direction TEXT NOT NULL DEFAULT 'rtl',
  content_json TEXT NOT NULL,
  config_json TEXT,
  source_id TEXT,
  official_page_reference TEXT,
  rights_status TEXT NOT NULL DEFAULT 'sos_original_aligned',
  accessibility_text TEXT,
  review_status TEXT NOT NULL DEFAULT 'DRAFT',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(lesson_id, position)
);

CREATE TABLE IF NOT EXISTS learning_outcomes (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  position INTEGER NOT NULL,
  statement_ar TEXT NOT NULL,
  official_note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lesson_skills (
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  skill_id TEXT NOT NULL REFERENCES skills(id),
  PRIMARY KEY (lesson_id, skill_id)
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  book_version_id TEXT REFERENCES book_versions(id),
  kind TEXT NOT NULL,
  uri TEXT NOT NULL,
  alt_text TEXT,
  rights_status TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  block_id TEXT REFERENCES content_blocks(id),
  position INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  instructions_ar TEXT NOT NULL,
  outcome_id TEXT REFERENCES learning_outcomes(id),
  difficulty TEXT NOT NULL DEFAULT 'basic',
  max_attempts INTEGER NOT NULL DEFAULT 3,
  points REAL NOT NULL DEFAULT 10,
  mastery_weight REAL NOT NULL DEFAULT 1,
  config_json TEXT,
  source_note TEXT,
  review_status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id),
  position INTEGER NOT NULL,
  prompt_ar TEXT NOT NULL,
  kind TEXT NOT NULL,
  config_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS answer_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id),
  position INTEGER NOT NULL,
  label_ar TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id),
  answer_kind TEXT NOT NULL,
  value_json TEXT NOT NULL,
  units TEXT,
  tolerance REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS answer_explanations (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id),
  explanation_ar TEXT NOT NULL,
  step_by_step_ar TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hints (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id),
  level INTEGER NOT NULL,
  text_ar TEXT NOT NULL,
  UNIQUE(question_id, level)
);

CREATE TABLE IF NOT EXISTS rubrics (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id),
  criteria_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS citations (
  id TEXT PRIMARY KEY,
  book_version_id TEXT REFERENCES book_versions(id),
  block_id TEXT REFERENCES content_blocks(id),
  citation_text TEXT NOT NULL,
  url TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_tasks (
  id TEXT PRIMARY KEY,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  review_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  assignee TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_comments (
  id TEXT PRIMARY KEY,
  review_task_id TEXT NOT NULL REFERENCES review_tasks(id),
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  approval_type TEXT NOT NULL,
  decision TEXT NOT NULL,
  reviewer TEXT NOT NULL,
  comments TEXT,
  decided_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS published_versions (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id),
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  published_by TEXT,
  published_at TEXT NOT NULL,
  notes TEXT,
  UNIQUE(book_id, book_version_id)
);

CREATE TABLE IF NOT EXISTS student_book_progress (
  id TEXT PRIMARY KEY,
  student_key TEXT NOT NULL,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  last_lesson_id TEXT,
  last_page_id TEXT,
  last_block_id TEXT,
  mode TEXT NOT NULL DEFAULT 'lesson',
  updated_at TEXT NOT NULL,
  UNIQUE(student_key, book_version_id)
);

CREATE TABLE IF NOT EXISTS student_lesson_progress (
  id TEXT PRIMARY KEY,
  student_key TEXT NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  status TEXT NOT NULL DEFAULT 'started',
  accuracy REAL,
  time_spent_sec INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(student_key, lesson_id)
);

CREATE TABLE IF NOT EXISTS student_answers (
  id TEXT PRIMARY KEY,
  student_key TEXT NOT NULL,
  question_id TEXT NOT NULL REFERENCES questions(id),
  attempt INTEGER NOT NULL DEFAULT 1,
  response_json TEXT NOT NULL,
  is_correct INTEGER,
  hint_level INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS student_mastery (
  id TEXT PRIMARY KEY,
  student_key TEXT NOT NULL,
  lesson_id TEXT REFERENCES lessons(id),
  outcome_id TEXT REFERENCES learning_outcomes(id),
  skill_id TEXT REFERENCES skills(id),
  score REAL NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS student_bookmarks (
  id TEXT PRIMARY KEY,
  student_key TEXT NOT NULL,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  lesson_id TEXT,
  page_id TEXT,
  block_id TEXT,
  label TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS student_highlights (
  id TEXT PRIMARY KEY,
  student_key TEXT NOT NULL,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  block_id TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow',
  range_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS student_notes (
  id TEXT PRIMARY KEY,
  student_key TEXT NOT NULL,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  lesson_id TEXT,
  page_id TEXT,
  block_id TEXT,
  note_type TEXT NOT NULL DEFAULT 'personal',
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS student_annotations (
  id TEXT PRIMARY KEY,
  student_key TEXT NOT NULL,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  page_id TEXT,
  block_id TEXT,
  stroke_json TEXT NOT NULL,
  tool TEXT NOT NULL DEFAULT 'pen',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS teacher_assignments (
  id TEXT PRIMARY KEY,
  teacher_key TEXT NOT NULL,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  lesson_id TEXT REFERENCES lessons(id),
  group_label TEXT,
  start_at TEXT,
  due_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  book_id TEXT REFERENCES books(id),
  status TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS validation_reports (
  id TEXT PRIMARY KEY,
  book_version_id TEXT NOT NULL REFERENCES book_versions(id),
  passed INTEGER NOT NULL,
  report_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS curriculum_coverage (
  id TEXT PRIMARY KEY,
  inventory_cell_id TEXT NOT NULL,
  book_id TEXT REFERENCES books(id),
  status TEXT NOT NULL,
  notes TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(inventory_cell_id)
);

CREATE TABLE IF NOT EXISTS production_jobs (
  id TEXT PRIMARY KEY,
  book_id TEXT REFERENCES books(id),
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  checkpoint TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS production_checkpoints (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES production_jobs(id),
  label TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_books_grade_subject ON books(grade_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_units_book_version ON units(book_version_id, position);
CREATE INDEX IF NOT EXISTS idx_lessons_unit ON lessons(unit_id, position);
CREATE INDEX IF NOT EXISTS idx_blocks_lesson ON content_blocks(lesson_id, position);
CREATE INDEX IF NOT EXISTS idx_blocks_search ON content_blocks(type, language);
CREATE INDEX IF NOT EXISTS idx_student_progress_book ON student_book_progress(student_key, book_version_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_q ON student_answers(student_key, question_id);
CREATE INDEX IF NOT EXISTS idx_highlights_student ON student_highlights(student_key, book_version_id);
CREATE INDEX IF NOT EXISTS idx_notes_student ON student_notes(student_key, book_version_id);
