/**
 * Cross-platform .env.local loader for AIOS CLI (Windows PowerShell + macOS/Linux).
 * Never logs secret values.
 */
import fs from "node:fs";
import path from "node:path";
import { config as dotenvConfig } from "dotenv";

let loaded = false;

export function loadAiosEnv({ root = process.cwd(), override = false } = {}) {
  if (loaded && !override) return { loaded: true, files: [] };
  const files = [];
  const candidates = [".env.local", ".env"];
  for (const name of candidates) {
    const full = path.join(root, name);
    if (!fs.existsSync(full)) continue;
    dotenvConfig({ path: full, override: false });
    files.push(name);
  }
  // Normalize aliases without duplicating secrets into files
  if (!process.env.OPENAI_API_KEY && process.env.OPENAI_CONTENT_API_KEY) {
    process.env.OPENAI_API_KEY = process.env.OPENAI_CONTENT_API_KEY;
  }
  if (!process.env.ANTHROPIC_API_KEY && process.env.CLAUDE_API_KEY) {
    process.env.ANTHROPIC_API_KEY = process.env.CLAUDE_API_KEY;
  }
  if (!process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY =
      process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  }
  if (!process.env.OPENAI_MODEL && process.env.OPENAI_TEXT_MODEL) {
    process.env.OPENAI_MODEL = process.env.OPENAI_TEXT_MODEL;
  }
  // Safety defaults
  if (!process.env.AIOS_AUTO_COMMIT) process.env.AIOS_AUTO_COMMIT = "false";
  if (!process.env.MASTER_ORCHESTRATOR_AUTO_COMMIT) {
    process.env.MASTER_ORCHESTRATOR_AUTO_COMMIT = "false";
  }
  if (!process.env.AIOS_EXECUTION_MODE) process.env.AIOS_EXECUTION_MODE = "review";
  loaded = true;
  return { loaded: true, files };
}

export function envPresent(key) {
  const v = process.env[key];
  return Boolean(v && String(v).trim() && !String(v).startsWith("change-me"));
}

export function firstPresent(keys) {
  for (const k of keys) {
    if (envPresent(k)) return k;
  }
  return null;
}
