#!/usr/bin/env node
/**
 * Durable Gemini CLI Google OAuth listener.
 * Survives Next.js hot reloads. Never prints tokens.
 *
 * Usage:
 *   node scripts/gemini-cli-oauth-login.mjs start
 *   node scripts/gemini-cli-oauth-login.mjs status
 *   node scripts/gemini-cli-oauth-login.mjs complete-redirect "<url>"
 */
import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

const STATUS_PATH = "/tmp/gemini-cli-oauth-status.json";
const AUTH_URL_PATH = "/tmp/gemini-oauth-auth-url.txt";
const SESSION_PATH = "/tmp/gemini-cli-oauth-session.json";
const KEEP_ALIVE_MS = 10 * 60 * 1000;

const OAUTH_SCOPE = [
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];
const SUCCESS_URL =
  "https://developers.google.com/gemini-code-assist/auth_success_gemini";
const FAILURE_URL =
  "https://developers.google.com/gemini-code-assist/auth_failure_gemini";

function loadOfficialClient() {
  const bundleDir = join(
    process.cwd(),
    "node_modules",
    "@google",
    "gemini-cli",
    "bundle",
  );
  for (const name of readdirSync(bundleDir)) {
    if (!name.startsWith("chunk-") || !name.endsWith(".js")) continue;
    const source = readFileSync(join(bundleDir, name), "utf8");
    const id = source.match(/OAUTH_CLIENT_ID\s*=\s*"([^"]+)"/);
    const secret = source.match(/OAUTH_CLIENT_SECRET\s*=\s*"([^"]+)"/);
    if (id?.[1] && secret?.[1]) {
      return { clientId: id[1], clientSecret: secret[1] };
    }
  }
  throw new Error("Could not load Gemini CLI OAuth client from package.");
}

function geminiHome() {
  return join(homedir(), ".gemini");
}

function writeStatus(patch) {
  let prev = {};
  try {
    prev = JSON.parse(readFileSync(STATUS_PATH, "utf8"));
  } catch {
    prev = {};
  }
  const next = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  // Never persist tokens in status.
  delete next.accessToken;
  delete next.refreshToken;
  delete next.tokens;
  writeFileSync(STATUS_PATH, JSON.stringify(next, null, 2));
  return next;
}

function readStatus() {
  try {
    return JSON.parse(readFileSync(STATUS_PATH, "utf8"));
  } catch {
    return {
      status: "idle",
      authUrl: null,
      authenticated: false,
      accountEmail: null,
      error: null,
    };
  }
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const srv = createNetServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
    srv.on("error", reject);
  });
}

async function cacheAccountEmail(email) {
  mkdirSync(geminiHome(), { recursive: true });
  writeFileSync(
    join(geminiHome(), "google_accounts.json"),
    JSON.stringify({ active: email, accounts: [email] }, null, 2),
    { mode: 0o600 },
  );
}

async function writeSettings() {
  mkdirSync(geminiHome(), { recursive: true });
  const path = join(geminiHome(), "settings.json");
  let existing = {};
  try {
    existing = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    existing = {};
  }
  existing.security = existing.security || {};
  existing.security.auth = existing.security.auth || {};
  existing.security.auth.selectedType = "oauth-personal";
  writeFileSync(path, JSON.stringify(existing, null, 2), { mode: 0o600 });
}

async function cacheCredentials(tokens) {
  mkdirSync(geminiHome(), { recursive: true });
  writeFileSync(join(geminiHome(), "oauth_creds.json"), JSON.stringify(tokens), {
    mode: 0o600,
  });
}

async function fetchEmail(client) {
  try {
    const { token } = await client.getAccessToken();
    if (!token) return null;
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.email || null;
  } catch {
    return null;
  }
}

async function finalize(client, tokens) {
  await cacheCredentials(tokens);
  await writeSettings();
  const email = await fetchEmail(client);
  if (email) await cacheAccountEmail(email);
  try {
    rmSync(SESSION_PATH, { force: true });
  } catch {
    // ignore
  }
  writeStatus({
    status: "authenticated",
    authenticated: true,
    authUrl: null,
    accountEmail: email,
    error: null,
    completedAt: new Date().toISOString(),
    curriculumProcessingAllowed: false,
  });
  return email;
}

async function startFresh() {
  // Kill reuse: always new port + state.
  const { clientId, clientSecret } = loadOfficialClient();
  const client = new OAuth2Client({ clientId, clientSecret });
  const port = await getAvailablePort();
  const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
  const state = randomBytes(32).toString("hex");
  const authUrl = client.generateAuthUrl({
    redirect_uri: redirectUri,
    access_type: "offline",
    scope: OAUTH_SCOPE,
    state,
    prompt: "consent",
  });

  writeFileSync(AUTH_URL_PATH, `${authUrl}\n`);
  writeFileSync(
    SESSION_PATH,
    JSON.stringify({ redirectUri, state, port, startedAt: Date.now() }),
    { mode: 0o600 },
  );
  // Store only non-secret session coordination fields in status.
  writeStatus({
    status: "waiting_for_google_approval",
    authenticated: false,
    authUrl,
    accountEmail: null,
    error: null,
    callbackPort: port,
    expiresAt: new Date(Date.now() + KEEP_ALIVE_MS).toISOString(),
    keepAliveMs: KEEP_ALIVE_MS,
    curriculumProcessingAllowed: false,
  });

  const server = createServer(async (req, res) => {
    try {
      if (!req.url || !req.url.includes("/oauth2callback")) {
        res.writeHead(301, { Location: FAILURE_URL });
        res.end();
        return;
      }
      const qs = new URL(req.url, "http://127.0.0.1").searchParams;
      if (qs.get("error")) {
        res.writeHead(301, { Location: FAILURE_URL });
        res.end();
        writeStatus({
          status: "failed",
          authenticated: false,
          error: `Google OAuth error: ${qs.get("error")}`,
        });
        server.close();
        process.exit(1);
        return;
      }
      if (qs.get("state") !== state) {
        res.end("State mismatch");
        writeStatus({
          status: "failed",
          authenticated: false,
          error: "OAuth state mismatch",
        });
        server.close();
        process.exit(1);
        return;
      }
      const code = qs.get("code");
      if (!code) {
        writeStatus({
          status: "failed",
          authenticated: false,
          error: "No authorization code",
        });
        res.writeHead(301, { Location: FAILURE_URL });
        res.end();
        server.close();
        process.exit(1);
        return;
      }
      const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
      client.setCredentials(tokens);
      const email = await finalize(client, tokens);
      res.writeHead(301, { Location: SUCCESS_URL });
      res.end();
      // Safe log only.
      console.log(
        JSON.stringify({
          event: "authenticated",
          accountEmail: email,
          callbackCaptured: true,
        }),
      );
      server.close();
      process.exit(0);
    } catch (err) {
      writeStatus({
        status: "failed",
        authenticated: false,
        error: String(err?.message || err).slice(0, 300),
      });
      try {
        res.writeHead(301, { Location: FAILURE_URL });
        res.end();
      } catch {
        // ignore
      }
      server.close();
      process.exit(1);
    }
  });

  await new Promise((resolve, reject) => {
    server.listen(port, "127.0.0.1", resolve);
    server.on("error", reject);
  });

  console.log(
    JSON.stringify({
      event: "waiting_for_google_approval",
      callbackPort: port,
      keepAliveMinutes: 10,
      authUrl,
    }),
  );

  setTimeout(() => {
    writeStatus({
      status: "failed",
      authenticated: false,
      authUrl: null,
      error: "Authentication timed out after 10 minutes.",
    });
    try {
      server.close();
    } catch {
      // ignore
    }
    console.log(JSON.stringify({ event: "timeout" }));
    process.exit(1);
  }, KEEP_ALIVE_MS).unref();
}

async function completeFromRedirect(redirectUrl) {
  if (!existsSync(SESSION_PATH)) {
    writeStatus({
      status: "failed",
      authenticated: false,
      error: "No active OAuth session. Start again.",
    });
    process.exit(1);
  }
  const session = JSON.parse(readFileSync(SESSION_PATH, "utf8"));
  const { clientId, clientSecret } = loadOfficialClient();
  const client = new OAuth2Client({ clientId, clientSecret });
  const parsed = new URL(redirectUrl.trim());
  if (parsed.searchParams.get("state") !== session.state) {
    writeStatus({
      status: "failed",
      authenticated: false,
      error: "OAuth state mismatch. Start again.",
    });
    process.exit(1);
  }
  const code = parsed.searchParams.get("code");
  if (!code) {
    writeStatus({
      status: "failed",
      authenticated: false,
      error: "Authorization code missing from redirect URL.",
    });
    process.exit(1);
  }
  const { tokens } = await client.getToken({
    code,
    redirect_uri: session.redirectUri,
  });
  client.setCredentials(tokens);
  const email = await finalize(client, tokens);
  console.log(
    JSON.stringify({
      event: "authenticated",
      accountEmail: email,
      via: "redirect_url_paste",
    }),
  );
}

const cmd = process.argv[2] || "status";
if (cmd === "start") {
  await startFresh();
} else if (cmd === "status") {
  console.log(JSON.stringify(readStatus(), null, 2));
} else if (cmd === "complete-redirect") {
  const url = process.argv[3] || "";
  await completeFromRedirect(url);
} else {
  console.error("Unknown command");
  process.exit(1);
}
