import "server-only";

import { existsSync, readFileSync, writeFileSync, accessSync, constants } from "node:fs";
import { join } from "node:path";

const ENV_LOCAL_NAME = ".env.local";
const KEY_NAME = "GEMINI_API_KEY";

function projectRoot(): string {
  return process.cwd();
}

export function getEnvLocalPath(): string {
  return join(projectRoot(), ENV_LOCAL_NAME);
}

export function isLocalDevelopmentEnvironment(): boolean {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_APP_ENV === "production") {
    return false;
  }
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
  return appEnv === "development" || appEnv === "test" || process.env.NODE_ENV !== "production";
}

function isPlaceholder(value: string): boolean {
  return !value || /^your_gemini_api_key$/i.test(value) || /^change-?me$/i.test(value);
}

function parseEnvLocal(): { lines: string[]; keyIndex: number; value: string | null } {
  const path = getEnvLocalPath();
  if (!existsSync(path)) {
    return { lines: [], keyIndex: -1, value: null };
  }
  const raw = readFileSync(path, "utf8");
  const lines = raw.split(/\r?\n/);
  let keyIndex = -1;
  let value: string | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (/^\s*#/.test(line)) continue;
    const match = line.match(/^\s*GEMINI_API_KEY\s*=\s*(.*)$/);
    if (!match) continue;
    keyIndex = i;
    let v = (match[1] ?? "").trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    value = v;
    break;
  }
  return { lines, keyIndex, value };
}

/** Returns the key for server-side use only. Never send to clients. */
export function readGeminiApiKeySecure(): string | null {
  const fromEnv = process.env.GEMINI_API_KEY?.trim() || "";
  if (fromEnv && !isPlaceholder(fromEnv)) {
    return fromEnv;
  }

  if (!isLocalDevelopmentEnvironment()) {
    return null;
  }

  try {
    const { value } = parseEnvLocal();
    if (value && !isPlaceholder(value)) {
      // Hydrate process env so the running Next process can use it without restart.
      process.env.GEMINI_API_KEY = value;
      return value;
    }
  } catch {
    return null;
  }
  return null;
}

export function isGeminiApiKeyConfigured(): boolean {
  return Boolean(readGeminiApiKeySecure());
}

export function canWriteEnvLocal(): { ok: boolean; reason?: string } {
  if (!isLocalDevelopmentEnvironment()) {
    return { ok: false, reason: "Not a local development environment." };
  }
  const path = getEnvLocalPath();
  try {
    if (existsSync(path)) {
      accessSync(path, constants.W_OK);
    } else {
      accessSync(projectRoot(), constants.W_OK);
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: `Cannot write ${ENV_LOCAL_NAME} in this runtime.`,
    };
  }
}

function validateKeyShape(apiKey: string): { ok: true; key: string } | { ok: false; message: string } {
  const key = apiKey.trim();
  if (!key) {
    return { ok: false, message: "API key is empty." };
  }
  if (key.length < 20 || key.length > 256) {
    return { ok: false, message: "API key length looks invalid." };
  }
  if (/[\r\n]/.test(key)) {
    return { ok: false, message: "API key must be a single line." };
  }
  if (/\s/.test(key)) {
    return { ok: false, message: "API key must not contain spaces." };
  }
  if (isPlaceholder(key)) {
    return { ok: false, message: "Placeholder values are not allowed." };
  }
  return { ok: true, key };
}

export type SaveGeminiKeyResult =
  | {
      saved: true;
      file: string;
      configured: true;
      requiresManualPaste: false;
    }
  | {
      saved: false;
      file: string;
      configured: boolean;
      requiresManualPaste: true;
      reason: string;
    }
  | {
      saved: false;
      file: string;
      configured: boolean;
      requiresManualPaste: false;
      reason: string;
    };

/**
 * Persist GEMINI_API_KEY to .env.local for local development.
 * Never logs or returns the key value.
 */
export function saveGeminiApiKeyToEnvLocal(apiKey: string): SaveGeminiKeyResult {
  const file = ENV_LOCAL_NAME;
  const validated = validateKeyShape(apiKey);
  if (!validated.ok) {
    return {
      saved: false,
      file,
      configured: isGeminiApiKeyConfigured(),
      requiresManualPaste: false,
      reason: validated.message,
    };
  }

  const writable = canWriteEnvLocal();
  if (!writable.ok) {
    return {
      saved: false,
      file,
      configured: isGeminiApiKeyConfigured(),
      requiresManualPaste: true,
      reason: writable.reason || "Automatic write unavailable.",
    };
  }

  try {
    const path = getEnvLocalPath();
    const { lines, keyIndex } = parseEnvLocal();
    const nextLine = `${KEY_NAME}=${validated.key}`;
    const next = [...lines];
    if (keyIndex >= 0) {
      next[keyIndex] = nextLine;
    } else {
      if (next.length > 0 && next[next.length - 1] !== "") {
        next.push("");
      }
      next.push("# Google Gemini (server only — never commit)");
      next.push(nextLine);
      next.push("");
    }
    writeFileSync(path, next.join("\n"), { encoding: "utf8", mode: 0o600 });
    process.env.GEMINI_API_KEY = validated.key;
    return {
      saved: true,
      file,
      configured: true,
      requiresManualPaste: false,
    };
  } catch {
    return {
      saved: false,
      file,
      configured: isGeminiApiKeyConfigured(),
      requiresManualPaste: true,
      reason: `Failed to write ${ENV_LOCAL_NAME}. Paste the configuration line manually.`,
    };
  }
}

export type RemoveGeminiKeyResult = {
  removed: boolean;
  file: string;
  configured: boolean;
  reason?: string;
};

export function removeGeminiApiKeyFromEnvLocal(): RemoveGeminiKeyResult {
  const file = ENV_LOCAL_NAME;
  if (!isLocalDevelopmentEnvironment()) {
    return {
      removed: false,
      file,
      configured: isGeminiApiKeyConfigured(),
      reason: "Key removal is allowed only in local development.",
    };
  }

  try {
    const path = getEnvLocalPath();
    if (!existsSync(path)) {
      delete process.env.GEMINI_API_KEY;
      return { removed: true, file, configured: false };
    }
    const { lines, keyIndex } = parseEnvLocal();
    if (keyIndex < 0) {
      delete process.env.GEMINI_API_KEY;
      return { removed: true, file, configured: false };
    }
    const next = [...lines];
    next.splice(keyIndex, 1);
    // Drop an immediately preceding comment we added.
    if (keyIndex > 0 && /Google Gemini/i.test(next[keyIndex - 1] || "")) {
      next.splice(keyIndex - 1, 1);
    }
    writeFileSync(path, next.join("\n"), { encoding: "utf8", mode: 0o600 });
    delete process.env.GEMINI_API_KEY;
    return { removed: true, file, configured: false };
  } catch {
    return {
      removed: false,
      file,
      configured: isGeminiApiKeyConfigured(),
      reason: `Failed to update ${ENV_LOCAL_NAME}.`,
    };
  }
}

export function getGeminiSetupStatus() {
  const writable = canWriteEnvLocal();
  const configured = isGeminiApiKeyConfigured();
  return {
    provider: "Google Gemini" as const,
    configured,
    localDevelopment: isLocalDevelopmentEnvironment(),
    canAutoWrite: writable.ok,
    autoWriteReason: writable.ok ? null : writable.reason || null,
    envFile: ENV_LOCAL_NAME,
    envFileAbsolute: getEnvLocalPath(),
    gitignored: true,
    officialKeyPage: "https://aistudio.google.com/apikey",
    curriculumProcessingAllowed: false,
    healthPath: "/api/admin/ai/gemini/health",
  };
}
