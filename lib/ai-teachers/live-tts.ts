/**
 * Live neural TTS for Sara / Ali — per spoken line (demo proof path).
 * Uses edge-tts (ar-JO-SanaNeural / ar-JO-TaimNeural). Cached under .data/
 */
import "server-only";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const VOICES = {
  sara: "ar-JO-SanaNeural",
  ali: "ar-JO-TaimNeural",
} as const;

const RATE = "-5%";
const CACHE_DIR = path.join(process.cwd(), ".data/ai-teachers/tts");

export type LiveTtsTeacher = keyof typeof VOICES;

function ensureCacheDir() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export function ttsCacheKey(teacherId: LiveTtsTeacher, text: string): string {
  const norm = text.replace(/\s+/g, " ").trim().slice(0, 500);
  return crypto
    .createHash("sha1")
    .update(`${teacherId}|${VOICES[teacherId]}|${RATE}|${norm}`)
    .digest("hex");
}

export function ttsCachePath(key: string): string {
  return path.join(CACHE_DIR, `${key}.mp3`);
}

function synthesizeWithPython(
  teacherId: LiveTtsTeacher,
  text: string,
  outFile: string,
): void {
  const voice = VOICES[teacherId];
  const script = `
import asyncio, edge_tts, sys
text = sys.argv[1]
voice = sys.argv[2]
rate = sys.argv[3]
out = sys.argv[4]
async def main():
    await edge_tts.Communicate(text, voice, rate=rate).save(out)
asyncio.run(main())
`.trim();

  const result = spawnSync(
    "python3",
    ["-c", script, text.slice(0, 500), voice, RATE, outFile],
    { encoding: "utf8", timeout: 60_000 },
  );
  if (result.status !== 0) {
    throw new Error(
      `edge-tts failed: ${result.stderr || result.stdout || "unknown"}`,
    );
  }
  if (!fs.existsSync(outFile) || fs.statSync(outFile).size < 500) {
    throw new Error("edge-tts produced empty audio");
  }
}

/**
 * Ensure MP3 exists for this teacher+text; return absolute path.
 */
export function ensureLiveTtsMp3(
  teacherId: LiveTtsTeacher,
  text: string,
): { key: string; filePath: string; cached: boolean; bytes: number } {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) throw new Error("empty TTS text");
  const id: LiveTtsTeacher = teacherId === "ali" ? "ali" : "sara";
  ensureCacheDir();
  const key = ttsCacheKey(id, clean);
  const filePath = ttsCachePath(key);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 500) {
    return {
      key,
      filePath,
      cached: true,
      bytes: fs.statSync(filePath).size,
    };
  }
  synthesizeWithPython(id, clean, filePath);
  return {
    key,
    filePath,
    cached: false,
    bytes: fs.statSync(filePath).size,
  };
}

export function readLiveTtsMp3(key: string): Buffer | null {
  const filePath = ttsCachePath(key.replace(/[^a-f0-9]/gi, ""));
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

export function publicTtsUrl(key: string): string {
  return `/api/ai-teachers/tts?id=${encodeURIComponent(key)}`;
}
