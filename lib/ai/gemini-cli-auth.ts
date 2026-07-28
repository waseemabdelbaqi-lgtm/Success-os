import "server-only";

import { spawn } from "node:child_process";
import { promises as fs, existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const STATUS_PATH = "/tmp/gemini-cli-oauth-status.json";
const AUTH_URL_PATH = "/tmp/gemini-oauth-auth-url.txt";
const SCRIPT = join(process.cwd(), "scripts", "gemini-cli-oauth-login.mjs");
const HEALTH_PROMPT = "أجب بكلمة واحدة: جاهز";

type DurableStatus = {
  status?: string;
  authenticated?: boolean;
  authUrl?: string | null;
  accountEmail?: string | null;
  error?: string | null;
  callbackPort?: number;
  expiresAt?: string;
  keepAliveMs?: number;
  curriculumProcessingAllowed?: boolean;
};

function readDurableStatus(): DurableStatus {
  try {
    return JSON.parse(readFileSync(STATUS_PATH, "utf8")) as DurableStatus;
  } catch {
    return {
      status: "idle",
      authenticated: false,
      authUrl: null,
      accountEmail: null,
      error: null,
    };
  }
}

function credsPath(): string {
  return join(homedir(), ".gemini", "oauth_creds.json");
}

export async function getGeminiCliAuthStatus(): Promise<{
  method: "gemini-cli-google-login";
  authenticated: boolean;
  accountEmail: string | null;
  authType: string | null;
  waitingForApproval: boolean;
  authUrl: string | null;
  callbackPort: number | null;
  expiresAt: string | null;
  curriculumProcessingAllowed: boolean;
}> {
  const durable = readDurableStatus();
  const hasCreds = existsSync(credsPath());
  const authenticated = Boolean(durable.authenticated || hasCreds);
  let authUrl = durable.authUrl || null;
  if (!authUrl && durable.status === "waiting_for_google_approval") {
    try {
      authUrl = (await fs.readFile(AUTH_URL_PATH, "utf8")).trim() || null;
    } catch {
      authUrl = null;
    }
  }
  return {
    method: "gemini-cli-google-login",
    authenticated,
    accountEmail: durable.accountEmail || null,
    authType: authenticated ? "oauth-personal" : null,
    waitingForApproval: durable.status === "waiting_for_google_approval",
    authUrl: authenticated ? null : authUrl,
    callbackPort: durable.callbackPort ?? null,
    expiresAt: durable.expiresAt ?? null,
    curriculumProcessingAllowed: false,
  };
}

function killPreviousOauthListeners(): void {
  // Best-effort: stop prior durable login processes.
  try {
    spawn("pkill", ["-f", "scripts/gemini-cli-oauth-login.mjs start"], {
      stdio: "ignore",
    });
  } catch {
    // ignore
  }
}

/**
 * Force a brand-new Google OAuth session (new port + state + URL).
 * Keeps a durable listener alive for 10 minutes outside Next.js.
 */
export async function startGeminiCliGoogleLogin(options?: {
  force?: boolean;
}): Promise<{
  status: "waiting_for_google_approval" | "authenticated";
  authUrl: string | null;
  message: string;
  callbackPort: number | null;
  expiresAt: string | null;
}> {
  const force = options?.force !== false;

  if (!force) {
    const current = await getGeminiCliAuthStatus();
    if (current.authenticated) {
      return {
        status: "authenticated",
        authUrl: null,
        message: "Already authenticated with Google via Gemini CLI credentials.",
        callbackPort: null,
        expiresAt: null,
      };
    }
  }

  killPreviousOauthListeners();
  // Brief pause so the previous listener releases the port/process.
  await new Promise((r) => setTimeout(r, 400));

  // Clear stale status before start.
  try {
    await fs.writeFile(
      STATUS_PATH,
      JSON.stringify({
        status: "starting",
        authenticated: false,
        authUrl: null,
        curriculumProcessingAllowed: false,
      }),
    );
  } catch {
    // ignore
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, "start"], {
      cwd: process.cwd(),
      detached: true,
      stdio: ["ignore", "ignore", "ignore"],
      env: { ...process.env },
    });
    child.unref();
    child.on("error", reject);
    // Give the listener time to bind + write status.
    setTimeout(() => resolve(), 800);
  });

  // Poll briefly for auth URL.
  let authUrl: string | null = null;
  let callbackPort: number | null = null;
  let expiresAt: string | null = null;
  for (let i = 0; i < 20; i += 1) {
    const st = readDurableStatus();
    if (st.authUrl) {
      authUrl = st.authUrl;
      callbackPort = st.callbackPort ?? null;
      expiresAt = st.expiresAt ?? null;
      break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!authUrl) {
    try {
      authUrl = (await fs.readFile(AUTH_URL_PATH, "utf8")).trim();
    } catch {
      authUrl = null;
    }
  }

  if (!authUrl) {
    return {
      status: "waiting_for_google_approval",
      authUrl: null,
      message: "Failed to start Google authorization listener.",
      callbackPort: null,
      expiresAt: null,
    };
  }

  return {
    status: "waiting_for_google_approval",
    authUrl,
    callbackPort,
    expiresAt,
    message:
      "Fresh Google authorization URL ready. Click Continue with Google, then Allow. Listener stays alive for 10 minutes.",
  };
}

export async function completeGeminiCliLoginFromRedirectUrl(
  redirectUrl: string,
): Promise<{ authenticated: boolean; accountEmail: string | null; error: string | null }> {
  return await new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [SCRIPT, "complete-redirect", redirectUrl],
      { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] },
    );
    let out = "";
    let err = "";
    child.stdout.on("data", (c) => {
      out += String(c);
    });
    child.stderr.on("data", (c) => {
      err += String(c);
    });
    child.on("close", () => {
      const st = readDurableStatus();
      if (st.authenticated) {
        resolve({
          authenticated: true,
          accountEmail: st.accountEmail || null,
          error: null,
        });
        return;
      }
      resolve({
        authenticated: false,
        accountEmail: null,
        error: sanitize(
          st.error || err || out || "Failed to complete Google login from redirect URL.",
        ),
      });
    });
  });
}

export async function logoutGeminiCliGoogle(): Promise<{ removed: boolean }> {
  killPreviousOauthListeners();
  try {
    await fs.rm(credsPath(), { force: true });
  } catch {
    // ignore
  }
  try {
    await fs.rm(join(homedir(), ".gemini", "google_accounts.json"), {
      force: true,
    });
  } catch {
    // ignore
  }
  try {
    await fs.writeFile(
      STATUS_PATH,
      JSON.stringify({
        status: "idle",
        authenticated: false,
        authUrl: null,
        accountEmail: null,
        curriculumProcessingAllowed: false,
      }),
    );
  } catch {
    // ignore
  }
  return { removed: true };
}

function sanitize(message: string): string {
  return String(message)
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [REDACTED]")
    .replace(/ya29\.[A-Za-z0-9._\-]+/g, "[REDACTED]")
    .replace(/1\/\/[A-Za-z0-9_\-]+/g, "[REDACTED]")
    .replace(/AIza[0-9A-Za-z_\-]{10,}/g, "[REDACTED]")
    .slice(0, 400);
}

export async function verifyGeminiCliConnection(): Promise<{
  status: "Connected" | "Failed";
  connected: boolean;
  provider: "Google Gemini CLI (Google login)";
  model: string | null;
  response: string | null;
  latencyMs: number;
  accountEmail: string | null;
  error: { code: string; message: string } | null;
}> {
  const started = Date.now();
  const auth = await getGeminiCliAuthStatus();
  if (!auth.authenticated) {
    return {
      status: "Failed",
      connected: false,
      provider: "Google Gemini CLI (Google login)",
      model: null,
      response: null,
      latencyMs: Date.now() - started,
      accountEmail: auth.accountEmail,
      error: {
        code: "NOT_AUTHENTICATED",
        message: "Gemini CLI Google login is not completed yet.",
      },
    };
  }

  const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  const geminiBin = join(
    process.cwd(),
    "node_modules",
    "@google",
    "gemini-cli",
    "bundle",
    "gemini.js",
  );

  try {
    const text = await runGeminiCliPrompt(geminiBin, HEALTH_PROMPT, model);
    const cleaned = text.replace(/[`"'«»]/g, "").replace(/\s+/g, " ").trim();
    if (!cleaned) {
      return {
        status: "Failed",
        connected: false,
        provider: "Google Gemini CLI (Google login)",
        model,
        response: null,
        latencyMs: Date.now() - started,
        accountEmail: auth.accountEmail,
        error: {
          code: "UNEXPECTED_RESPONSE",
          message: "Gemini CLI returned an empty response.",
        },
      };
    }
    return {
      status: "Connected",
      connected: true,
      provider: "Google Gemini CLI (Google login)",
      model,
      response: cleaned.slice(0, 200),
      latencyMs: Date.now() - started,
      accountEmail: auth.accountEmail,
      error: null,
    };
  } catch (err) {
    return {
      status: "Failed",
      connected: false,
      provider: "Google Gemini CLI (Google login)",
      model,
      response: null,
      latencyMs: Date.now() - started,
      accountEmail: auth.accountEmail,
      error: {
        code: "CLI_VERIFY_FAILED",
        message: sanitize(
          err instanceof Error ? err.message : "Gemini CLI verification failed",
        ),
      },
    };
  }
}

function runGeminiCliPrompt(
  geminiBin: string,
  prompt: string,
  model: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [geminiBin, "-p", prompt, "-m", model, "-y"],
      {
        cwd: process.cwd(),
        env: { ...process.env, CI: "1" },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Gemini CLI verification timed out."));
    }, 120_000);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(sanitize(stderr || `CLI exited ${code}`)));
        return;
      }
      const lines = stdout
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .filter((l) => !/^(loaded|loading|gemini|auth|session)/i.test(l));
      resolve(lines[lines.length - 1] || stdout.trim());
    });
  });
}

export async function generateWithGeminiCliAuth(
  prompt: string,
  options: { model?: string; maxOutputTokens?: number } = {},
): Promise<{ text: string; model: string; authMethod: "gemini-cli-google-login" }> {
  const auth = await getGeminiCliAuthStatus();
  if (!auth.authenticated) {
    throw new Error("Gemini CLI Google login required before generation.");
  }
  const model = options.model || process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  const geminiBin = join(
    process.cwd(),
    "node_modules",
    "@google",
    "gemini-cli",
    "bundle",
    "gemini.js",
  );
  const text = await runGeminiCliPrompt(geminiBin, prompt, model);
  return { text, model, authMethod: "gemini-cli-google-login" };
}

export function isCurriculumGenerationAllowed(connected: boolean): boolean {
  return connected === true && process.env.ALLOW_CURRICULUM_GENERATION === "true";
}

export async function getAuthorizedOAuthClient(): Promise<never> {
  throw new Error(
    "Use durable Gemini CLI OAuth status helpers; direct client access is internal.",
  );
}
