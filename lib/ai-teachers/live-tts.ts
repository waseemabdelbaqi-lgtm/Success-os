/**
 * Live neural TTS for Sara / Ali — per spoken line with prosody + duration.
 * Voice IDs / rate / pitch come from Configuration Layer (src/ai-teacher).
 */
import "server-only";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolveTeacherVoice } from "@/src/ai-teacher/config";

const CACHE_DIR = path.join(process.cwd(), ".data/ai-teachers/tts");

export type LiveTtsTeacher = "sara" | "ali";

function voiceIdFor(teacherId: LiveTtsTeacher, locale?: string | null): string {
  return resolveTeacherVoice(teacherId, locale).voiceId;
}

/** Prosody style — changes rate/pitch so tone follows teaching act. */
export type TtsStyle =
  | "hook"
  | "explain"
  | "write"
  | "check"
  | "celebrate"
  | "remediate"
  | "default";

const STYLE_PROSODY: Record<TtsStyle, { rate: string; pitch: string }> = {
  hook: { rate: "-4%", pitch: "+2Hz" },
  explain: { rate: "-6%", pitch: "+0Hz" },
  write: { rate: "-9%", pitch: "-1Hz" },
  check: { rate: "-3%", pitch: "+1Hz" },
  celebrate: { rate: "+0%", pitch: "+3Hz" },
  remediate: { rate: "-12%", pitch: "-2Hz" },
  default: { rate: "-6%", pitch: "+0Hz" },
};

/** Prosody bias derived from Configuration Layer speechRate / pitch. */
function applyTeacherProsody(
  teacherId: LiveTtsTeacher,
  base: { rate: string; pitch: string },
): { rate: string; pitch: string } {
  const cfg = resolveTeacherVoice(teacherId);
  const rateDelta = Math.round((cfg.speechRate - 1) * 100);
  const pitchDelta = Math.round((cfg.pitch - 1) * 20);
  const rateN = Number(String(base.rate).replace("%", "")) + rateDelta;
  const pitchN = Number(String(base.pitch).replace("Hz", "")) + pitchDelta;
  const rate = `${rateN >= 0 ? "+" : ""}${rateN}%`;
  const pitch = `${pitchN >= 0 ? "+" : ""}${pitchN}Hz`;
  return { rate, pitch };
}

export function styleFromContentAct(act?: string | null): TtsStyle {
  if (!act) return "default";
  if (act === "greet_hook") return "hook";
  if (act === "ask_check") return "check";
  if (act === "celebrate") return "celebrate";
  if (
    act === "write_law" ||
    act === "write_board" ||
    act === "draw_diagram" ||
    act === "count_sequence"
  ) {
    return "write";
  }
  if (act.includes("remediat") || act === "explain_concept") return "explain";
  return "default";
}

function ensureCacheDir() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export function ttsCacheKey(
  teacherId: LiveTtsTeacher,
  text: string,
  style: TtsStyle,
  locale?: string | null,
): string {
  // Include voice id so dialect changes never reuse the wrong cache.
  const norm = text.replace(/\s+/g, " ").trim().slice(0, 500);
  const p = STYLE_PROSODY[style] || STYLE_PROSODY.default;
  const applied = applyTeacherProsody(teacherId, p);
  const voice = voiceIdFor(teacherId, locale);
  return crypto
    .createHash("sha1")
    .update(`${teacherId}|${voice}|${applied.rate}|${applied.pitch}|${norm}|v6`)
    .digest("hex");
}

export function ttsCachePath(key: string): string {
  return path.join(CACHE_DIR, `${key}.mp3`);
}

function measureMp3DurationMs(filePath: string): number {
  const py = `
from mutagen.mp3 import MP3
import sys
print(int(MP3(sys.argv[1]).info.length * 1000))
`.trim();
  const r = spawnSync("python3", ["-c", py, filePath], { encoding: "utf8" });
  if (r.status === 0) {
    const n = Number(String(r.stdout).trim());
    if (Number.isFinite(n) && n > 100) return n;
  }
  // Fallback: 48kbps mono ADTS estimate
  const bytes = fs.statSync(filePath).size;
  return Math.max(400, Math.round((bytes * 8) / 48));
}

function synthesizeWithPython(
  teacherId: LiveTtsTeacher,
  text: string,
  style: TtsStyle,
  outFile: string,
  locale?: string | null,
): void {
  const voice = voiceIdFor(teacherId, locale);
  const prosody = applyTeacherProsody(
    teacherId,
    STYLE_PROSODY[style] || STYLE_PROSODY.default,
  );
  const script = `
import asyncio, edge_tts, sys
text, voice, rate, pitch, out = sys.argv[1:6]
async def main():
    await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(out)
asyncio.run(main())
`.trim();

  const result = spawnSync(
    "python3",
    [
      "-c",
      script,
      text.slice(0, 500),
      voice,
      prosody.rate,
      prosody.pitch,
      outFile,
    ],
    { encoding: "utf8", timeout: 90_000 },
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

export function ensureLiveTtsMp3(
  teacherId: LiveTtsTeacher,
  text: string,
  style: TtsStyle = "default",
  locale?: string | null,
): {
  key: string;
  filePath: string;
  cached: boolean;
  bytes: number;
  durationMs: number;
  style: TtsStyle;
  voice: string;
} {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) throw new Error("empty TTS text");
  const id: LiveTtsTeacher = teacherId === "ali" ? "ali" : "sara";
  const st = STYLE_PROSODY[style] ? style : "default";
  ensureCacheDir();
  const key = ttsCacheKey(id, clean, st, locale);
  const filePath = ttsCachePath(key);
  let cached = false;
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 500) {
    cached = true;
  } else {
    synthesizeWithPython(id, clean, st, filePath, locale);
  }
  const durationMs = measureMp3DurationMs(filePath);
  return {
    key,
    filePath,
    cached,
    bytes: fs.statSync(filePath).size,
    durationMs,
    style: st,
    voice: voiceIdFor(id, locale),
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

/** Natural pause after a line (ms) — varies by style for breathing room. */
export function pauseAfterStyle(style: TtsStyle): number {
  if (style === "check") return 650;
  if (style === "write") return 520;
  if (style === "celebrate") return 450;
  if (style === "remediate") return 580;
  if (style === "hook") return 420;
  return 400;
}
