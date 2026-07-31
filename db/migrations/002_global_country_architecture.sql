-- GATE 3: Global country / curriculum architecture (additive, country-agnostic)
-- Does not destroy Gate 2 book-engine tables or Firebase data.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  iso_code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_native TEXT,
  region TEXT,
  subregion TEXT,
  flag_emoji TEXT,
  default_language TEXT NOT NULL DEFAULT 'en',
  supported_languages_json TEXT NOT NULL DEFAULT '["en"]',
  currency_code TEXT,
  timezone TEXT,
  status TEXT NOT NULL DEFAULT 'inactive', -- inactive | onboarding | active | archived
  student_visible INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS education_authorities (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL REFERENCES countries(id),
  authority_type TEXT NOT NULL, -- ministry | curriculum | examination | accreditation | regional
  name_ar TEXT,
  name_en TEXT NOT NULL,
  official_website TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS curricula (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL REFERENCES countries(id),
  authority_id TEXT REFERENCES education_authorities(id),
  code TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT NOT NULL,
  ownership TEXT NOT NULL DEFAULT 'public', -- public | private | international
  scope TEXT NOT NULL DEFAULT 'national', -- national | regional | state | province
  supported_languages_json TEXT NOT NULL DEFAULT '["en"]',
  status TEXT NOT NULL DEFAULT 'draft',
  official_source_url TEXT,
  rights_profile_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(country_id, code)
);

CREATE TABLE IF NOT EXISTS curriculum_version_meta (
  id TEXT PRIMARY KEY,
  curriculum_id TEXT NOT NULL REFERENCES curricula(id),
  version_label TEXT NOT NULL,
  effective_from TEXT,
  effective_to TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(curriculum_id, version_label)
);

CREATE TABLE IF NOT EXISTS academic_calendars (
  id TEXT PRIMARY KEY,
  curriculum_id TEXT NOT NULL REFERENCES curricula(id),
  academic_year_label TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  term_count INTEGER NOT NULL DEFAULT 2,
  term_names_json TEXT NOT NULL DEFAULT '[]',
  holiday_structure_json TEXT,
  is_current INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(curriculum_id, academic_year_label)
);

CREATE TABLE IF NOT EXISTS terminology_entries (
  id TEXT PRIMARY KEY,
  country_id TEXT REFERENCES countries(id),
  curriculum_id TEXT REFERENCES curricula(id),
  canonical_key TEXT NOT NULL, -- grade | term | subject | pathway | textbook | national_exam | kindergarten
  label_ar TEXT,
  label_en TEXT,
  label_native TEXT,
  singular TEXT,
  plural TEXT,
  direction TEXT NOT NULL DEFAULT 'ltr',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(country_id, curriculum_id, canonical_key)
);

CREATE TABLE IF NOT EXISTS translation_records (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_key TEXT NOT NULL,
  locale TEXT NOT NULL,
  original_language TEXT,
  text_value TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'ltr',
  translation_status TEXT NOT NULL DEFAULT 'draft', -- draft | reviewed | approved | rejected
  translator TEXT,
  reviewer TEXT,
  version_label TEXT,
  fallback_language TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(entity_type, entity_id, field_key, locale, version_label)
);

CREATE TABLE IF NOT EXISTS source_profiles (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL REFERENCES countries(id),
  curriculum_id TEXT REFERENCES curricula(id),
  authority_id TEXT REFERENCES education_authorities(id),
  profile_name TEXT NOT NULL,
  ministry_urls_json TEXT,
  curriculum_authority_urls_json TEXT,
  textbook_repository_urls_json TEXT,
  open_data_urls_json TEXT,
  examination_urls_json TEXT,
  teacher_guide_urls_json TEXT,
  licensing_info TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS rights_classifications (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL REFERENCES countries(id),
  resource_id TEXT,
  resource_type TEXT NOT NULL DEFAULT 'book',
  authority_name TEXT,
  curriculum_id TEXT REFERENCES curricula(id),
  edition_label TEXT,
  academic_year_label TEXT,
  source_url TEXT,
  direct_file_url TEXT,
  rights_owner TEXT,
  license TEXT,
  permitted_actions_json TEXT NOT NULL DEFAULT '[]',
  territory_restrictions TEXT,
  commercial_use_status TEXT,
  modification_status TEXT,
  attribution_requirements TEXT,
  outcome TEXT NOT NULL DEFAULT 'rights_review_required',
  -- authorized_full_reuse | authorized_display | authorized_adaptation | link_only |
  -- original_companion_required | rights_review_required | restricted | unavailable
  verification_date TEXT,
  reviewer TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS assessment_profiles (
  id TEXT PRIMARY KEY,
  curriculum_id TEXT NOT NULL REFERENCES curricula(id),
  name_en TEXT NOT NULL,
  name_ar TEXT,
  grading_scale_json TEXT NOT NULL DEFAULT '{}',
  passing_score TEXT,
  assessment_types_json TEXT NOT NULL DEFAULT '[]',
  national_examination_label TEXT,
  continuous_assessment INTEGER NOT NULL DEFAULT 1,
  qualification_requirements TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS educational_structure_nodes (
  id TEXT PRIMARY KEY,
  curriculum_id TEXT NOT NULL REFERENCES curricula(id),
  parent_id TEXT,
  node_type TEXT NOT NULL, -- stage | grade | year | level | term | pathway
  code TEXT NOT NULL,
  label_ar TEXT,
  label_en TEXT NOT NULL,
  age_range TEXT,
  compulsory INTEGER NOT NULL DEFAULT 1,
  entry_requirements TEXT,
  exit_qualification TEXT,
  next_node_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE(curriculum_id, node_type, code)
);

CREATE TABLE IF NOT EXISTS inventory_matrix_cells (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL REFERENCES countries(id),
  curriculum_id TEXT NOT NULL REFERENCES curricula(id),
  curriculum_version_label TEXT,
  academic_year_label TEXT,
  stage_code TEXT,
  grade_code TEXT,
  term_code TEXT,
  pathway_code TEXT,
  field_code TEXT,
  subject_code TEXT,
  subject_title_ar TEXT,
  subject_title_en TEXT,
  book_type TEXT NOT NULL,
  official_title_ar TEXT,
  official_title_en TEXT,
  edition_label TEXT,
  source_url TEXT,
  discovery_source TEXT,
  subject_list_status TEXT NOT NULL DEFAULT 'not_discovered',
  rights_status TEXT NOT NULL DEFAULT 'rights_review_required',
  matrix_status TEXT NOT NULL DEFAULT 'NOT_DISCOVERED',
  blocker TEXT,
  structured_book_id TEXT,
  expected_units INTEGER,
  expected_lessons INTEGER,
  expected_pages INTEGER,
  expected_activities INTEGER,
  expected_exercises INTEGER,
  completeness_claim TEXT NOT NULL DEFAULT 'not_complete',
  verification_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_inventory_country_status
  ON inventory_matrix_cells(country_id, matrix_status);
CREATE INDEX IF NOT EXISTS idx_inventory_grade_subject
  ON inventory_matrix_cells(country_id, grade_code, subject_code, book_type);

CREATE TABLE IF NOT EXISTS country_onboarding_sessions (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL REFERENCES countries(id),
  current_step INTEGER NOT NULL DEFAULT 1,
  step_payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress | validation | approved | rejected
  activated_for_students INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS global_readiness_checks (
  id TEXT PRIMARY KEY,
  check_key TEXT NOT NULL UNIQUE,
  passed INTEGER NOT NULL DEFAULT 0,
  evidence TEXT,
  checked_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jordan_audit_snapshots (
  id TEXT PRIMARY KEY,
  snapshot_json TEXT NOT NULL,
  verdict TEXT NOT NULL,
  next_country_ready INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Extend Gate 2 production_jobs for Gate 3 queue fields (additive columns).
ALTER TABLE production_jobs ADD COLUMN job_type TEXT;
ALTER TABLE production_jobs ADD COLUMN priority INTEGER DEFAULT 100;
ALTER TABLE production_jobs ADD COLUMN attempts INTEGER DEFAULT 0;
ALTER TABLE production_jobs ADD COLUMN max_attempts INTEGER DEFAULT 5;
ALTER TABLE production_jobs ADD COLUMN checkpoint_json TEXT;
ALTER TABLE production_jobs ADD COLUMN error_log TEXT;
ALTER TABLE production_jobs ADD COLUMN locked_by TEXT;
ALTER TABLE production_jobs ADD COLUMN locked_at TEXT;
ALTER TABLE production_jobs ADD COLUMN book_version_id TEXT;
ALTER TABLE production_jobs ADD COLUMN notes TEXT;

CREATE INDEX IF NOT EXISTS idx_production_jobs_status ON production_jobs(status, priority);
CREATE INDEX IF NOT EXISTS idx_countries_status ON countries(status, student_visible);
