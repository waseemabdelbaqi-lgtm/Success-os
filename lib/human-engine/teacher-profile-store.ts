/**
 * Editable teacher profile store — JSON catalog scalable to hundreds of teachers.
 * Defaults live in content/ai-teachers/profiles/*.json
 * Runtime overrides (admin edits) in .data/ai-teachers/profiles/ when writable.
 */
import fs from "node:fs";
import path from "node:path";
import type { TeacherMindProfile, TeacherProfileId } from "@/types/teacher-mind";

const CONTENT_DIR = path.join(process.cwd(), "content/ai-teachers/profiles");
const OVERRIDE_DIR = path.join(process.cwd(), ".data/ai-teachers/profiles");

function readJson(file: string): TeacherMindProfile | null {
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8")) as TeacherMindProfile;
  } catch {
    return null;
  }
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function listTeacherProfileIds(): TeacherProfileId[] {
  ensureDir(CONTENT_DIR);
  const fromContent = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
  let fromOverride: string[] = [];
  if (fs.existsSync(OVERRIDE_DIR)) {
    fromOverride = fs
      .readdirSync(OVERRIDE_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
  }
  return [...new Set([...fromContent, ...fromOverride])].sort();
}

export function getTeacherProfile(id: TeacherProfileId): TeacherMindProfile {
  const override = readJson(path.join(OVERRIDE_DIR, `${id}.json`));
  if (override) return override;
  const base = readJson(path.join(CONTENT_DIR, `${id}.json`));
  if (base) return base;
  throw new Error(`Teacher profile not found: ${id}`);
}

export function listTeacherProfiles(): TeacherMindProfile[] {
  return listTeacherProfileIds()
    .map((id) => {
      try {
        return getTeacherProfile(id);
      } catch {
        return null;
      }
    })
    .filter((p): p is TeacherMindProfile => Boolean(p && p.enabled !== false));
}

export function saveTeacherProfile(profile: TeacherMindProfile): TeacherMindProfile {
  if (!profile.id) throw new Error("profile.id required");
  const next: TeacherMindProfile = {
    ...profile,
    schema: "success-os.teacher-mind.v1",
    updatedAt: new Date().toISOString(),
  };
  ensureDir(OVERRIDE_DIR);
  const file = path.join(OVERRIDE_DIR, `${next.id}.json`);
  fs.writeFileSync(file, JSON.stringify(next, null, 2), "utf8");
  // Mirror into content if it already exists there (keeps repo defaults editable in cloud)
  const contentFile = path.join(CONTENT_DIR, `${next.id}.json`);
  if (fs.existsSync(CONTENT_DIR)) {
    try {
      fs.writeFileSync(contentFile, JSON.stringify(next, null, 2), "utf8");
    } catch {
      // override dir is enough when content is read-only
    }
  }
  return next;
}

export function resetTeacherProfile(id: TeacherProfileId): TeacherMindProfile {
  const override = path.join(OVERRIDE_DIR, `${id}.json`);
  if (fs.existsSync(override)) fs.unlinkSync(override);
  return getTeacherProfile(id);
}
