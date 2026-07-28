/**
 * Curriculum Ingestion Engine — SQLite store (Postgres-swappable via DATABASE_URL later).
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../..");
export const DATA_ROOT = path.join(ROOT, "data/curriculum-ingestion");
export const DB_PATH = process.env.CURRICULUM_DB_PATH || path.join(DATA_ROOT, "db/ingestion.sqlite");
export const STORAGE_ROOT =
  process.env.CURRICULUM_STORAGE_ROOT || path.join(DATA_ROOT, "storage");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(STORAGE_ROOT, { recursive: true });

let _db;

export function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(db) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS countries (
    code TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ar TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    country_code TEXT NOT NULL,
    adapter TEXT NOT NULL,
    name TEXT NOT NULL,
    catalog_url TEXT,
    rights_default TEXT NOT NULL,
    status TEXT NOT NULL,
    last_error TEXT,
    last_discovered_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(country_code) REFERENCES countries(code)
  );

  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    country_code TEXT NOT NULL,
    source_id TEXT NOT NULL,
    curriculum TEXT,
    stage TEXT,
    grade TEXT,
    grade_code TEXT,
    semester TEXT,
    subject TEXT,
    book_type TEXT,
    title TEXT NOT NULL,
    title_ar TEXT,
    edition TEXT,
    academic_year TEXT,
    official_url TEXT,
    catalog_url TEXT,
    rights_status TEXT NOT NULL,
    status TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    page_count INTEGER DEFAULT 0,
    sha256 TEXT,
    storage_key TEXT,
    language TEXT,
    last_error TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(source_id) REFERENCES sources(id)
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    book_id TEXT,
    country_code TEXT,
    status TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    progress REAL DEFAULT 0,
    payload_json TEXT,
    result_json TEXT,
    error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    started_at TEXT,
    finished_at TEXT
  );

  CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    title TEXT NOT NULL,
    start_page INTEGER,
    end_page INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    unit_id TEXT,
    title TEXT NOT NULL,
    start_page INTEGER,
    end_page INTEGER,
    objectives_json TEXT,
    concepts_json TEXT,
    status TEXT NOT NULL DEFAULT 'DISCOVERED',
    created_at TEXT NOT NULL,
    FOREIGN KEY(book_id) REFERENCES books(id),
    FOREIGN KEY(unit_id) REFERENCES units(id)
  );

  CREATE TABLE IF NOT EXISTS sample_lessons (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    lesson_id TEXT,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    content_json TEXT NOT NULL,
    source_pages TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS engine_metrics (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  `);
}

export function nowIso() {
  return new Date().toISOString();
}

export function upsertCountry(code, nameEn, nameAr = "") {
  const db = getDb();
  db.prepare(
    `INSERT INTO countries(code,name_en,name_ar,created_at) VALUES(?,?,?,?)
     ON CONFLICT(code) DO UPDATE SET name_en=excluded.name_en, name_ar=excluded.name_ar`,
  ).run(code, nameEn, nameAr, nowIso());
}

export function upsertSource(row) {
  const db = getDb();
  db.prepare(
    `INSERT INTO sources(id,country_code,adapter,name,catalog_url,rights_default,status,last_error,last_discovered_at,created_at)
     VALUES(@id,@country_code,@adapter,@name,@catalog_url,@rights_default,@status,@last_error,@last_discovered_at,@created_at)
     ON CONFLICT(id) DO UPDATE SET
       status=excluded.status,
       last_error=excluded.last_error,
       last_discovered_at=excluded.last_discovered_at,
       catalog_url=excluded.catalog_url`,
  ).run({ last_error: null, last_discovered_at: null, ...row, created_at: row.created_at || nowIso() });
}

const PROGRESS_STATUSES = new Set([
  "QUEUED",
  "DOWNLOADING",
  "VERIFIED",
  "EXTRACTING",
  "STRUCTURED",
  "AI_DRAFT",
  "REVIEW_REQUIRED",
  "APPROVED",
  "PUBLISHED",
]);

export function upsertBook(row) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM books WHERE id=?`).get(row.id);
  const ts = nowIso();
  if (existing) {
    // Preserve download/processing progress when rediscovering catalog metadata.
    const keepProgress = PROGRESS_STATUSES.has(existing.status);
    db.prepare(
      `UPDATE books SET
        title=@title, title_ar=@title_ar, grade=@grade, grade_code=@grade_code, semester=@semester,
        subject=@subject, book_type=@book_type, edition=@edition, academic_year=@academic_year,
        official_url=@official_url, catalog_url=@catalog_url, rights_status=@rights_status,
        status=@status, language=@language, last_error=@last_error,
        metadata_json=@metadata_json, updated_at=@updated_at
       WHERE id=@id`,
    ).run({
      language: "ar",
      last_error: null,
      metadata_json: "{}",
      title_ar: null,
      edition: null,
      academic_year: null,
      ...row,
      official_url: row.official_url || existing.official_url,
      status: keepProgress ? existing.status : row.status,
      last_error: keepProgress ? existing.last_error : row.last_error,
      updated_at: ts,
    });
  } else {
    db.prepare(
      `INSERT INTO books(
        id,country_code,source_id,curriculum,stage,grade,grade_code,semester,subject,book_type,
        title,title_ar,edition,academic_year,official_url,catalog_url,rights_status,status,
        file_size,page_count,sha256,storage_key,language,last_error,metadata_json,created_at,updated_at
      ) VALUES(
        @id,@country_code,@source_id,@curriculum,@stage,@grade,@grade_code,@semester,@subject,@book_type,
        @title,@title_ar,@edition,@academic_year,@official_url,@catalog_url,@rights_status,@status,
        @file_size,@page_count,@sha256,@storage_key,@language,@last_error,@metadata_json,@created_at,@updated_at
      )`,
    ).run({
      curriculum: "Jordanian National Curriculum",
      stage: null,
      grade_code: null,
      semester: null,
      subject: null,
      book_type: "Student Book",
      title_ar: null,
      edition: null,
      academic_year: null,
      official_url: null,
      catalog_url: null,
      file_size: 0,
      page_count: 0,
      sha256: null,
      storage_key: null,
      language: "ar",
      last_error: null,
      metadata_json: "{}",
      ...row,
      created_at: ts,
      updated_at: ts,
    });
  }
}

export function updateBook(id, patch) {
  const db = getDb();
  const keys = Object.keys(patch);
  if (!keys.length) return;
  const sets = keys.map((k) => `${k}=@${k}`).join(", ");
  db.prepare(`UPDATE books SET ${sets}, updated_at=@updated_at WHERE id=@id`).run({
    ...patch,
    id,
    updated_at: nowIso(),
  });
}

export function insertJob(row) {
  const db = getDb();
  const ts = nowIso();
  db.prepare(
    `INSERT INTO jobs(id,type,book_id,country_code,status,attempts,max_attempts,progress,payload_json,result_json,error,created_at,updated_at,started_at,finished_at)
     VALUES(@id,@type,@book_id,@country_code,@status,@attempts,@max_attempts,@progress,@payload_json,@result_json,@error,@created_at,@updated_at,@started_at,@finished_at)`,
  ).run({
    book_id: null,
    country_code: null,
    attempts: 0,
    max_attempts: 5,
    progress: 0,
    payload_json: "{}",
    result_json: null,
    error: null,
    started_at: null,
    finished_at: null,
    ...row,
    created_at: ts,
    updated_at: ts,
  });
}

export function updateJob(id, patch) {
  const db = getDb();
  const keys = Object.keys(patch);
  const sets = keys.map((k) => `${k}=@${k}`).join(", ");
  db.prepare(`UPDATE jobs SET ${sets}, updated_at=@updated_at WHERE id=@id`).run({
    ...patch,
    id,
    updated_at: nowIso(),
  });
}

export function getMetrics() {
  const db = getDb();
  const count = (sql, params = []) => db.prepare(sql).get(...params)?.c || 0;
  return {
    countries: count(`SELECT COUNT(*) AS c FROM countries`),
    sources: count(`SELECT COUNT(*) AS c FROM sources`),
    jordanBooksDiscovered: count(`SELECT COUNT(*) AS c FROM books WHERE country_code='JO'`),
    downloadableBooks: count(
      `SELECT COUNT(*) AS c FROM books WHERE rights_status IN ('OPEN_LICENSE','PUBLIC_DOMAIN') AND official_url IS NOT NULL AND official_url != ''`,
    ),
    blockedBooks: count(`SELECT COUNT(*) AS c FROM books WHERE status='SOURCE_ACCESS_BLOCKED'`),
    rightsRestrictedBooks: count(`SELECT COUNT(*) AS c FROM books WHERE rights_status='OFFICIAL_REFERENCE_ONLY' OR rights_status='RIGHTS_RESTRICTED'`),
    verifiedBooks: count(`SELECT COUNT(*) AS c FROM books WHERE status='VERIFIED' OR status IN ('EXTRACTING','STRUCTURED','AI_DRAFT','REVIEW_REQUIRED','APPROVED','PUBLISHED')`),
    processedBooks: count(`SELECT COUNT(*) AS c FROM books WHERE status IN ('STRUCTURED','AI_DRAFT','REVIEW_REQUIRED','APPROVED','PUBLISHED')`),
    detectedUnits: count(`SELECT COUNT(*) AS c FROM units`),
    detectedLessons: count(`SELECT COUNT(*) AS c FROM lessons`),
    jobsQueued: count(`SELECT COUNT(*) AS c FROM jobs WHERE status IN ('QUEUED','RUNNING')`),
    jobsFailed: count(`SELECT COUNT(*) AS c FROM jobs WHERE status='FAILED'`),
    jobsCompleted: count(`SELECT COUNT(*) AS c FROM jobs WHERE status='COMPLETED'`),
    storageBytes: sumStorage(),
    sampleLessons: count(`SELECT COUNT(*) AS c FROM sample_lessons`),
  };
}

function sumStorage() {
  let total = 0;
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else total += fs.statSync(p).size;
    }
  };
  walk(STORAGE_ROOT);
  return total;
}

export function listBooks(filter = {}) {
  const db = getDb();
  let sql = `SELECT * FROM books WHERE 1=1`;
  const params = [];
  if (filter.country_code) {
    sql += ` AND country_code=?`;
    params.push(filter.country_code);
  }
  if (filter.status) {
    sql += ` AND status=?`;
    params.push(filter.status);
  }
  sql += ` ORDER BY grade_code, subject, book_type, title`;
  return db.prepare(sql).all(...params);
}

export function getBook(id) {
  return getDb().prepare(`SELECT * FROM books WHERE id=?`).get(id);
}

export function listJobs(limit = 50) {
  return getDb()
    .prepare(`SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?`)
    .all(limit);
}

export function saveSampleLesson(row) {
  const db = getDb();
  const ts = nowIso();
  db.prepare(
    `INSERT INTO sample_lessons(id,book_id,lesson_id,title,status,content_json,source_pages,created_at,updated_at)
     VALUES(@id,@book_id,@lesson_id,@title,@status,@content_json,@source_pages,@created_at,@updated_at)
     ON CONFLICT(id) DO UPDATE SET content_json=excluded.content_json, status=excluded.status, updated_at=excluded.updated_at`,
  ).run({ lesson_id: null, source_pages: "", ...row, created_at: ts, updated_at: ts });
}

export function getLatestSampleLesson() {
  return getDb()
    .prepare(`SELECT * FROM sample_lessons ORDER BY updated_at DESC LIMIT 1`)
    .get();
}
