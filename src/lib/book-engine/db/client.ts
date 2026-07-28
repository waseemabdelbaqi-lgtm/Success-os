import Database from "better-sqlite3";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = path.join(process.cwd(), "data/book-engine");
const DB_PATH = path.join(DATA_DIR, "book-engine.sqlite");
const MIGRATIONS_DIR = path.join(process.cwd(), "db/migrations");

let _db: Database.Database | null = null;

export function getBookEngineDb(): Database.Database {
  if (_db) return _db;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("foreign_keys = ON");
  _db.pragma("journal_mode = WAL");
  return _db;
}

export function applyMigrations(): { applied: string[]; dbPath: string } {
  const db = getBookEngineDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
  const applied = new Set(
    (db.prepare("SELECT id FROM schema_migrations").all() as Array<{ id: string }>).map((r) => r.id),
  );
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const newly: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const tx = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)").run(
        file,
        new Date().toISOString(),
      );
    });
    tx();
    newly.push(file);
  }
  return { applied: newly, dbPath: DB_PATH };
}

export function uuid(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function tableExists(name: string): boolean {
  const db = getBookEngineDb();
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(name) as { name?: string } | undefined;
  return Boolean(row?.name);
}

export function listTables(): string[] {
  const db = getBookEngineDb();
  return (
    db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as Array<{
      name: string;
    }>
  ).map((r) => r.name);
}
