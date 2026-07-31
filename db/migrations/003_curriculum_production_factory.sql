-- GATE 4: Curriculum Production Factory
-- Additive only. Country-agnostic factory tables.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS factory_jobs (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL,
  curriculum_id TEXT,
  inventory_cell_id TEXT,
  book_id TEXT,
  book_version_id TEXT,
  stage_code TEXT,
  grade_code TEXT,
  term_code TEXT,
  pathway_code TEXT,
  subject_code TEXT,
  subject_title TEXT,
  book_type TEXT NOT NULL,
  status TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  assigned_role TEXT,
  assigned_to TEXT,
  locked_by TEXT,
  locked_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  checkpoint_label TEXT,
  checkpoint_json TEXT,
  input_json TEXT,
  output_json TEXT,
  error_log TEXT,
  retry_status TEXT,
  review_decision TEXT,
  version_label TEXT,
  started_at TEXT,
  completed_at TEXT,
  paused INTEGER NOT NULL DEFAULT 0,
  blocker_code TEXT,
  blocker_detail TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(inventory_cell_id, book_type)
);

CREATE INDEX IF NOT EXISTS idx_factory_jobs_status_priority
  ON factory_jobs(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_factory_jobs_country_grade
  ON factory_jobs(country_id, grade_code, term_code);
CREATE INDEX IF NOT EXISTS idx_factory_jobs_blocker
  ON factory_jobs(blocker_code);

CREATE TABLE IF NOT EXISTS factory_job_events (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES factory_jobs(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  role_name TEXT,
  actor TEXT,
  message TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_factory_events_job ON factory_job_events(job_id, created_at);

CREATE TABLE IF NOT EXISTS import_artifacts (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES factory_jobs(id),
  country_id TEXT NOT NULL,
  source_url TEXT,
  local_path TEXT,
  format TEXT NOT NULL, -- pdf | docx | html | json | xml | epub | image | scanned | structured
  checksum_sha256 TEXT,
  byte_size INTEGER,
  page_count INTEGER,
  language_detected TEXT,
  direction_detected TEXT,
  rights_outcome TEXT NOT NULL,
  duplicate_of TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ocr_page_results (
  id TEXT PRIMARY KEY,
  import_artifact_id TEXT NOT NULL REFERENCES import_artifacts(id),
  page_number INTEGER NOT NULL,
  text_extract TEXT,
  confidence REAL NOT NULL DEFAULT 0,
  flags_json TEXT NOT NULL DEFAULT '[]',
  needs_manual_review INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(import_artifact_id, page_number)
);

CREATE TABLE IF NOT EXISTS factory_alerts (
  id TEXT PRIMARY KEY,
  severity TEXT NOT NULL, -- info | warn | critical
  alert_type TEXT NOT NULL,
  job_id TEXT,
  book_id TEXT,
  message TEXT NOT NULL,
  acknowledged INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS factory_dead_letters (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  last_status TEXT,
  error_log TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_completeness_scores (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- lesson | book | country
  entity_id TEXT NOT NULL,
  score REAL NOT NULL,
  breakdown_json TEXT NOT NULL,
  has_critical_blocker INTEGER NOT NULL DEFAULT 0,
  calculated_at TEXT NOT NULL,
  UNIQUE(entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS factory_worker_heartbeats (
  id TEXT PRIMARY KEY,
  worker_name TEXT NOT NULL UNIQUE,
  last_seen_at TEXT NOT NULL,
  current_job_id TEXT,
  meta_json TEXT
);

CREATE TABLE IF NOT EXISTS curriculum_change_events (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL,
  curriculum_id TEXT,
  change_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  status TEXT NOT NULL DEFAULT 'registered',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_generation_records (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  prompt_version TEXT,
  source_context TEXT,
  confidence REAL,
  review_status TEXT NOT NULL DEFAULT 'unreviewed',
  reviewer TEXT,
  corrections TEXT,
  approved INTEGER NOT NULL DEFAULT 0,
  generated_at TEXT NOT NULL
);
