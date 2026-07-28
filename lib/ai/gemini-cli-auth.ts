import "server-only";

import { createServer, type Server } from "node:http";
import { createServer as createNetServer } from "node:net";
import { promises as fs, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { OAuth2Client } from "google-auth-library";

/**
 * Load the official Gemini CLI OAuth client configuration from the installed
 * @google/gemini-cli package at runtime (do not hardcode secrets in source).
 */
function loadOfficialGeminiCliOauthClient(): { clientId: string; clientSecret: string } {
  const bundleDir = join(process.cwd(), "node_modules", "@google", "gemini-cli", "bundle");
  const chunks = readdirSync(bundleDir).filter(
    (name) => name.startsWith("chunk-") && name.endsWith(".js"),
  );
  if (!chunks.length) {
    throw new Error("Official @google/gemini-cli bundle not found. Run npm install.");
  }
  for (const chunk of chunks) {
    const source = readFileSync(join(bundleDir, chunk), "utf8");
    const idMatch = source.match(/OAUTH_CLIENT_ID\s*=\s*"([^"]+)"/);
    const secretMatch = source.match(/OAUTH_CLIENT_SECRET\s*=\s*"([^"]+)"/);
    if (idMatch?.[1] && secretMatch?.[1]) {
      return { clientId: idMatch[1], clientSecret: secretMatch[1] };
    }
  }
  throw new Error("Could not load Gemini CLI OAuth client from installed package.");
}

const OAUTH_SCOPE = [
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const GEMINI_DIR = ".gemini";
const OAUTH_FILE = "oauth_creds.json";
const SETTINGS_FILE = "settings.json";
const GOOGLE_ACCOUNTS_FILE = "google_accounts.json";
const AUTH_TYPE = "oauth-personal";

const SIGN_IN_SUCCESS_URL =
  "https://developers.google.com/gemini-code-assist/auth_success_gemini";
const SIGN_IN_FAILURE_URL =
  "https://developers.google.com/gemini-code-assist/auth_failure_gemini";

const HEALTH_PROMPT = "أجب بكلمة واحدة: جاهز";

type AuthSession = {
  status: "idle" | "waiting_for_google_approval" | "authenticated" | "failed";
  authUrl: string | null;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
  accountEmail: string | null;
  server: Server | null;
  pendingClient: OAuth2Client | null;
  pendingRedirectUri: string | null;
  pendingState: string | null;
};

const globalStore = globalThis as typeof globalThis & {
  __sosGeminiCliAuth?: AuthSession;
};

function session(): AuthSession {
  if (!globalStore.__sosGeminiCliAuth) {
    globalStore.__sosGeminiCliAuth = {
      status: "idle",
      authUrl: null,
      startedAt: null,
      completedAt: null,
      error: null,
      accountEmail: null,
      server: null,
      pendingClient: null,
      pendingRedirectUri: null,
      pendingState: null,
    };
  }
  return globalStore.__sosGeminiCliAuth;
}

function geminiHome(): string {
  return join(homedir(), GEMINI_DIR);
}

export function getOAuthCredsPath(): string {
  return join(geminiHome(), OAUTH_FILE);
}

function settingsPath(): string {
  return join(geminiHome(), SETTINGS_FILE);
}

function accountsPath(): string {
  return join(geminiHome(), GOOGLE_ACCOUNTS_FILE);
}

/** Never log or return raw tokens — only presence/metadata. */
export async function getGeminiCliAuthStatus(): Promise<{
  method: "gemini-cli-google-login";
  authenticated: boolean;
  accountEmail: string | null;
  authType: string | null;
  waitingForApproval: boolean;
  authUrl: string | null;
  curriculumProcessingAllowed: boolean;
}> {
  const s = session();
  const email = await readCachedEmail();
  const authenticated = await hasUsableOAuthCredentials();
  return {
    method: "gemini-cli-google-login",
    authenticated,
    accountEmail: email || s.accountEmail,
    authType: authenticated ? AUTH_TYPE : null,
    waitingForApproval: s.status === "waiting_for_google_approval",
    authUrl: s.status === "waiting_for_google_approval" ? s.authUrl : null,
    curriculumProcessingAllowed: false,
  };
}

async function readCachedEmail(): Promise<string | null> {
  try {
    const raw = await fs.readFile(accountsPath(), "utf8");
    const parsed = JSON.parse(raw) as { active?: string; accounts?: string[] };
    if (parsed.active) return parsed.active;
    if (Array.isArray(parsed.accounts) && parsed.accounts[0]) return parsed.accounts[0];
  } catch {
    // ignore
  }
  return null;
}

async function hasUsableOAuthCredentials(): Promise<boolean> {
  try {
    const client = await getAuthorizedOAuthClient();
    const token = await client.getAccessToken();
    return Boolean(token.token);
  } catch {
    return false;
  }
}

async function ensureGeminiDir(): Promise<void> {
  await fs.mkdir(geminiHome(), { recursive: true });
}

async function writeSettingsOauthPersonal(): Promise<void> {
  await ensureGeminiDir();
  let existing: Record<string, unknown> = {};
  try {
    existing = JSON.parse(await fs.readFile(settingsPath(), "utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    existing = {};
  }
  const security = (existing.security as Record<string, unknown>) || {};
  const auth = (security.auth as Record<string, unknown>) || {};
  auth.selectedType = AUTH_TYPE;
  security.auth = auth;
  existing.security = security;
  await fs.writeFile(settingsPath(), JSON.stringify(existing, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
}

async function cacheCredentials(tokens: Record<string, unknown>): Promise<void> {
  await ensureGeminiDir();
  // Write credentials exactly as Gemini CLI does — never log contents.
  await fs.writeFile(getOAuthCredsPath(), JSON.stringify(tokens), {
    encoding: "utf8",
    mode: 0o600,
  });
}

async function cacheAccountEmail(email: string): Promise<void> {
  await ensureGeminiDir();
  await fs.writeFile(
    accountsPath(),
    JSON.stringify({ active: email, accounts: [email] }, null, 2),
    { encoding: "utf8", mode: 0o600 },
  );
}

async function fetchAccountEmail(client: OAuth2Client): Promise<string | null> {
  try {
    const { token } = await client.getAccessToken();
    if (!token) return null;
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: string };
    return data.email || null;
  } catch {
    return null;
  }
}

function getAvailablePort(): Promise<number> {
  const forced = process.env.OAUTH_CALLBACK_PORT;
  if (forced) {
    const n = Number(forced);
    if (!Number.isFinite(n) || n <= 0) {
      return Promise.reject(new Error("Invalid OAUTH_CALLBACK_PORT"));
    }
    return Promise.resolve(n);
  }
  return new Promise((resolve, reject) => {
    const srv = createNetServer();
    srv.listen(0, () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
    srv.on("error", reject);
  });
}

export async function getAuthorizedOAuthClient(): Promise<OAuth2Client> {
  const oauthClient = loadOfficialGeminiCliOauthClient();
  const client = new OAuth2Client({
    clientId: oauthClient.clientId,
    clientSecret: oauthClient.clientSecret,
  });
  const raw = await fs.readFile(getOAuthCredsPath(), "utf8");
  const creds = JSON.parse(raw) as Record<string, unknown>;
  client.setCredentials(creds);
  client.on("tokens", (tokens) => {
    void cacheCredentials({ ...creds, ...tokens }).catch(() => undefined);
  });
  const { token } = await client.getAccessToken();
  if (!token) {
    throw new Error("No usable Gemini CLI OAuth access token.");
  }
  return client;
}

/**
 * Start official Gemini CLI Google-login (OAuth web) flow.
 * Opens/returns the Google authorization URL; waits for Allow callback.
 */
export async function startGeminiCliGoogleLogin(): Promise<{
  status: "waiting_for_google_approval" | "authenticated";
  authUrl: string | null;
  message: string;
}> {
  if (await hasUsableOAuthCredentials()) {
    const email = await readCachedEmail();
    const s = session();
    s.status = "authenticated";
    s.accountEmail = email;
    s.authUrl = null;
    s.error = null;
    return {
      status: "authenticated",
      authUrl: null,
      message: "Already authenticated with Google via Gemini CLI credentials.",
    };
  }

  const s = session();
  if (s.status === "waiting_for_google_approval" && s.authUrl) {
    return {
      status: "waiting_for_google_approval",
      authUrl: s.authUrl,
      message:
        "Google approval page is ready. Click Allow in the browser, then return here.",
    };
  }

  if (s.server) {
    try {
      s.server.close();
    } catch {
      // ignore
    }
    s.server = null;
  }

  await writeSettingsOauthPersonal();

  const oauthClient = loadOfficialGeminiCliOauthClient();
  const client = new OAuth2Client({
    clientId: oauthClient.clientId,
    clientSecret: oauthClient.clientSecret,
  });

  const port = await getAvailablePort();
  const host = process.env.OAUTH_CALLBACK_HOST || "127.0.0.1";
  const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
  const state = randomBytes(32).toString("hex");
  const authUrl = client.generateAuthUrl({
    redirect_uri: redirectUri,
    access_type: "offline",
    scope: OAUTH_SCOPE,
    state,
    prompt: "consent",
  });

  const loginComplete = new Promise<void>((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        if (!req.url || req.url.indexOf("/oauth2callback") === -1) {
          res.writeHead(301, { Location: SIGN_IN_FAILURE_URL });
          res.end();
          reject(new Error("Unexpected OAuth callback path."));
          return;
        }
        const qs = new URL(req.url, "http://127.0.0.1").searchParams;
        if (qs.get("error")) {
          res.writeHead(301, { Location: SIGN_IN_FAILURE_URL });
          res.end();
          reject(
            new Error(
              `Google OAuth error: ${qs.get("error")} ${qs.get("error_description") || ""}`.trim(),
            ),
          );
          return;
        }
        if (qs.get("state") !== state) {
          res.end("State mismatch");
          reject(new Error("OAuth state mismatch."));
          return;
        }
        const code = qs.get("code");
        if (!code) {
          reject(new Error("No authorization code received."));
          return;
        }
        const { tokens } = await client.getToken({
          code,
          redirect_uri: redirectUri,
        });
        client.setCredentials(tokens);
        await cacheCredentials(tokens as unknown as Record<string, unknown>);
        const email = await fetchAccountEmail(client);
        if (email) {
          await cacheAccountEmail(email);
          s.accountEmail = email;
        }
        await writeSettingsOauthPersonal();
        res.writeHead(301, { Location: SIGN_IN_SUCCESS_URL });
        res.end();
        s.status = "authenticated";
        s.completedAt = Date.now();
        s.authUrl = null;
        s.error = null;
        resolve();
      } catch (err) {
        try {
          res.writeHead(301, { Location: SIGN_IN_FAILURE_URL });
          res.end();
        } catch {
          // ignore
        }
        s.status = "failed";
        s.error = err instanceof Error ? err.message : "OAuth failed";
        reject(err);
      } finally {
        server.close();
        s.server = null;
      }
    });

    server.listen(port, host);
    s.server = server;
    server.on("error", (err) => {
      s.status = "failed";
      s.error = err.message;
      reject(err);
    });
  });

  s.status = "waiting_for_google_approval";
  s.authUrl = authUrl;
  s.startedAt = Date.now();
  s.error = null;
  s.pendingClient = client;
  s.pendingRedirectUri = redirectUri;
  s.pendingState = state;

  // Best-effort local browser open (may no-op in cloud).
  try {
    const opener =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
          ? "start"
          : "xdg-open";
    spawn(opener, [authUrl], { stdio: "ignore", detached: true }).unref();
  } catch {
    // ignore — URL is returned for the user to open
  }

  // Persist URL for the agent/UI without secrets.
  try {
    await fs.writeFile(
      "/tmp/gemini-oauth-auth-url.txt",
      `${authUrl}\n`,
      "utf8",
    );
  } catch {
    // ignore
  }

  // Do not await forever here — callers poll status. Background wait updates session.
  void loginComplete.catch(() => undefined);

  return {
    status: "waiting_for_google_approval",
    authUrl,
    message:
      "Open the Google authorization page and click Allow. Authentication will finish automatically after approval.",
  };
}

/**
 * Complete OAuth when the browser redirected to localhost but this runtime
 * is remote (connection refused). Accepts the full redirect URL from the
 * address bar — never an API key.
 */
export async function completeGeminiCliLoginFromRedirectUrl(
  redirectUrl: string,
): Promise<{ authenticated: boolean; accountEmail: string | null; error: string | null }> {
  const s = session();
  const client = s.pendingClient;
  const expectedState = s.pendingState;
  const redirectUri = s.pendingRedirectUri;
  if (!client || !expectedState || !redirectUri) {
    return {
      authenticated: false,
      accountEmail: null,
      error: "No active Google login session. Start Connect Gemini again.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(redirectUrl.trim());
  } catch {
    return {
      authenticated: false,
      accountEmail: null,
      error: "Invalid redirect URL.",
    };
  }

  if (parsed.searchParams.get("state") !== expectedState) {
    return {
      authenticated: false,
      accountEmail: null,
      error: "OAuth state mismatch. Start Connect Gemini again.",
    };
  }
  const code = parsed.searchParams.get("code");
  if (!code) {
    return {
      authenticated: false,
      accountEmail: null,
      error: "Authorization code missing from redirect URL.",
    };
  }

  try {
    const { tokens } = await client.getToken({
      code,
      redirect_uri: redirectUri,
    });
    client.setCredentials(tokens);
    await cacheCredentials(tokens as unknown as Record<string, unknown>);
    const email = await fetchAccountEmail(client);
    if (email) {
      await cacheAccountEmail(email);
      s.accountEmail = email;
    }
    await writeSettingsOauthPersonal();
    if (s.server) {
      try {
        s.server.close();
      } catch {
        // ignore
      }
    }
    s.server = null;
    s.status = "authenticated";
    s.completedAt = Date.now();
    s.authUrl = null;
    s.error = null;
    s.pendingClient = null;
    s.pendingRedirectUri = null;
    s.pendingState = null;
    return { authenticated: true, accountEmail: email, error: null };
  } catch (err) {
    const message = sanitizeAuthError(
      err instanceof Error ? err.message : "Failed to complete Google login",
    );
    s.status = "failed";
    s.error = message;
    return { authenticated: false, accountEmail: null, error: message };
  }
}

export async function waitForGeminiCliLogin(timeoutMs = 5 * 60 * 1000): Promise<{
  authenticated: boolean;
  accountEmail: string | null;
  error: string | null;
}> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await hasUsableOAuthCredentials()) {
      const email = await readCachedEmail();
      const s = session();
      s.status = "authenticated";
      s.accountEmail = email;
      s.authUrl = null;
      return { authenticated: true, accountEmail: email, error: null };
    }
    const s = session();
    if (s.status === "failed") {
      return { authenticated: false, accountEmail: null, error: s.error };
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return {
    authenticated: false,
    accountEmail: null,
    error: "Authentication timed out waiting for Google approval.",
  };
}

export async function logoutGeminiCliGoogle(): Promise<{ removed: boolean }> {
  const s = session();
  if (s.server) {
    try {
      s.server.close();
    } catch {
      // ignore
    }
  }
  s.server = null;
  s.status = "idle";
  s.authUrl = null;
  s.accountEmail = null;
  s.error = null;
  try {
    await fs.rm(getOAuthCredsPath(), { force: true });
  } catch {
    // ignore
  }
  try {
    await fs.rm(accountsPath(), { force: true });
  } catch {
    // ignore
  }
  return { removed: true };
}

/**
 * Verify authentication with a real Arabic Gemini request via official CLI headless mode.
 * Never prints tokens.
 */
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
  const email = await readCachedEmail();

  if (!(await hasUsableOAuthCredentials())) {
    return {
      status: "Failed",
      connected: false,
      provider: "Google Gemini CLI (Google login)",
      model: null,
      response: null,
      latencyMs: Date.now() - started,
      accountEmail: email,
      error: {
        code: "NOT_AUTHENTICATED",
        message: "Gemini CLI Google login is not completed yet.",
      },
    };
  }

  await writeSettingsOauthPersonal();

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
        accountEmail: email,
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
      accountEmail: email,
      error: null,
    };
  } catch (err) {
    const message = sanitizeAuthError(
      err instanceof Error ? err.message : "Gemini CLI verification failed",
    );
    return {
      status: "Failed",
      connected: false,
      provider: "Google Gemini CLI (Google login)",
      model,
      response: null,
      latencyMs: Date.now() - started,
      accountEmail: email,
      error: { code: "CLI_VERIFY_FAILED", message },
    };
  }
}

function sanitizeAuthError(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [REDACTED]")
    .replace(/ya29\.[A-Za-z0-9._\-]+/g, "[REDACTED]")
    .replace(/1\/\/[A-Za-z0-9_\-]+/g, "[REDACTED]")
    .replace(/AIza[0-9A-Za-z_\-]{10,}/g, "[REDACTED]")
    .slice(0, 400);
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
        env: {
          ...process.env,
          // Prefer cached Google login; do not force API key mode.
          CI: "1",
        },
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
      const combined = `${stdout}\n${stderr}`;
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(sanitizeAuthError(combined || `CLI exited ${code}`)));
        return;
      }
      // Take the last non-empty line-ish content as the model answer.
      const lines = stdout
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .filter((l) => !/^(loaded|loading|gemini|auth|session)/i.test(l));
      resolve(lines[lines.length - 1] || stdout.trim());
    });
  });
}

/**
 * Generate text using authenticated Gemini (OAuth CLI credentials).
 * Used by the curriculum processor bridge — does not start generation pipelines itself.
 */
export async function generateWithGeminiCliAuth(
  prompt: string,
  options: { model?: string; maxOutputTokens?: number } = {},
): Promise<{ text: string; model: string; authMethod: "gemini-cli-google-login" }> {
  if (!(await hasUsableOAuthCredentials())) {
    throw new Error("Gemini CLI Google login required before generation.");
  }
  const model = options.model || process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  const client = await getAuthorizedOAuthClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Missing Gemini OAuth access token.");

  // Prefer Gemini Developer API with the OAuth access token when available.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: options.maxOutputTokens ?? 2048,
      },
    }),
  });

  if (!res.ok) {
    // Fallback: official CLI headless invocation.
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

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
    "";
  if (!text.trim()) {
    throw new Error("Empty Gemini response.");
  }
  return { text, model, authMethod: "gemini-cli-google-login" };
}

export function isCurriculumGenerationAllowed(connected: boolean): boolean {
  // Explicit gate — do not begin curriculum generation until health passes.
  return connected === true && process.env.ALLOW_CURRICULUM_GENERATION === "true";
}
