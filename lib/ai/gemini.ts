import "server-only";

import { GoogleGenAI } from "@google/genai";
import { timingSafeEqual } from "node:crypto";
import { readGeminiApiKeySecure } from "@/lib/ai/gemini-local-env";

/** Fixed connection probe — never accept caller-supplied prompts here. */
export const GEMINI_HEALTH_PROMPT = "أجب بكلمة واحدة: جاهز";

/** Prefer currently available stable Gemini models (first success wins). */
const STABLE_MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-2.5-pro",
] as const;

export type GeminiHealthSuccess = {
  connected: true;
  provider: "Google Gemini";
  model: string;
  response: string;
  latencyMs: number;
};

export type GeminiHealthFailure = {
  connected: false;
  provider: "Google Gemini";
  model: string | null;
  response: null;
  latencyMs: number;
  error: {
    code:
      | "GEMINI_API_KEY_MISSING"
      | "INVALID_KEY"
      | "QUOTA_EXHAUSTED"
      | "RATE_LIMIT"
      | "MODEL_UNAVAILABLE"
      | "NETWORK_FAILURE"
      | "UNEXPECTED_RESPONSE"
      | "UNKNOWN";
    message: string;
  };
};

export type GeminiHealthResult = GeminiHealthSuccess | GeminiHealthFailure;

function readApiKey(): string | null {
  return readGeminiApiKeySecure();
}

/** Strip secrets from any error text before returning or logging. */
export function sanitizeGeminiErrorText(text: string, apiKey?: string | null): string {
  let out = String(text || "");
  if (apiKey && apiKey.length > 8) {
    out = out.split(apiKey).join("[REDACTED]");
  }
  out = out.replace(/AIza[0-9A-Za-z_-]{10,}/g, "[REDACTED]");
  out = out.replace(/key=[^&\s]+/gi, "key=[REDACTED]");
  return out.slice(0, 500);
}

function classifyGeminiError(
  err: unknown,
  apiKey: string | null,
): GeminiHealthFailure["error"] {
  const raw =
    err instanceof Error
      ? `${err.name}: ${err.message}`
      : typeof err === "string"
        ? err
        : "Unexpected Gemini error";
  const message = sanitizeGeminiErrorText(raw, apiKey);
  const lower = message.toLowerCase();
  const status =
    typeof err === "object" && err && "status" in err
      ? Number((err as { status?: number }).status)
      : typeof err === "object" && err && "code" in err
        ? Number((err as { code?: number }).code)
        : NaN;

  if (
    status === 401 ||
    status === 403 ||
    /api[_ ]?key|invalid.?key|permission.?denied|unauthoriz|forbidden|credentials/i.test(
      lower,
    )
  ) {
    return { code: "INVALID_KEY", message: "Gemini API key was rejected." };
  }
  if (status === 429 || /rate.?limit|resource.?exhausted|too many requests/i.test(lower)) {
    return { code: "RATE_LIMIT", message: "Gemini rate limit reached. Retry later." };
  }
  if (/quota|billing|exceeded your current quota/i.test(lower)) {
    return { code: "QUOTA_EXHAUSTED", message: "Gemini quota exhausted." };
  }
  if (
    status === 404 ||
    /not found|model .* unavailable|is not found|unsupported model/i.test(lower)
  ) {
    return { code: "MODEL_UNAVAILABLE", message: "Requested Gemini model is unavailable." };
  }
  if (
    /fetch failed|econnreset|enotfound|etimedout|network|socket|dns|unavailable/i.test(
      lower,
    )
  ) {
    return { code: "NETWORK_FAILURE", message: "Network failure reaching Gemini API." };
  }
  return { code: "UNKNOWN", message };
}

function createClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

async function discoverPreferredModel(ai: GoogleGenAI): Promise<string[]> {
  const discovered: string[] = [];
  try {
    const pager = await ai.models.list({ config: { pageSize: 50 } });
    for await (const model of pager) {
      const name = String(model.name || "")
        .replace(/^models\//, "")
        .trim();
      if (!name) continue;
      if (!/gemini/i.test(name)) continue;
      if (/embed|imagen|tts|live|robotics/i.test(name)) continue;
      discovered.push(name);
    }
  } catch {
    // Listing is best-effort; fall back to stable candidates.
  }

  const preferred = [
    ...STABLE_MODEL_CANDIDATES.filter((m) => discovered.includes(m)),
    ...STABLE_MODEL_CANDIDATES.filter((m) => !discovered.includes(m)),
    ...discovered.filter((m) => !STABLE_MODEL_CANDIDATES.includes(m as (typeof STABLE_MODEL_CANDIDATES)[number])),
  ];

  return Array.from(new Set(preferred));
}

function normalizeProbeResponse(text: string): string {
  return text
    .replace(/[`"'«»]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Server-only Gemini connection probe.
 * Uses a fixed Arabic prompt and never accepts arbitrary generation input.
 */
export async function verifyGeminiConnection(): Promise<GeminiHealthResult> {
  const started = Date.now();
  const apiKey = readApiKey();

  if (!apiKey) {
    return {
      connected: false,
      provider: "Google Gemini",
      model: null,
      response: null,
      latencyMs: Date.now() - started,
      error: {
        code: "GEMINI_API_KEY_MISSING",
        message: "GEMINI_API_KEY is not set in the server environment.",
      },
    };
  }

  const ai = createClient(apiKey);
  const candidates = await discoverPreferredModel(ai);
  let lastModelError: unknown = null;
  let lastModel: string | null = null;

  for (const model of candidates) {
    lastModel = model;
    try {
      const result = await ai.models.generateContent({
        model,
        contents: GEMINI_HEALTH_PROMPT,
        config: {
          temperature: 0,
          maxOutputTokens: 16,
        },
      });

      const text = normalizeProbeResponse(String(result.text ?? ""));
      const latencyMs = Date.now() - started;

      if (!text) {
        return {
          connected: false,
          provider: "Google Gemini",
          model,
          response: null,
          latencyMs,
          error: {
            code: "UNEXPECTED_RESPONSE",
            message: "Gemini returned an empty response.",
          },
        };
      }

      return {
        connected: true,
        provider: "Google Gemini",
        model,
        response: text,
        latencyMs,
      };
    } catch (err) {
      lastModelError = err;
      const classified = classifyGeminiError(err, apiKey);
      if (classified.code === "MODEL_UNAVAILABLE") {
        continue;
      }
      return {
        connected: false,
        provider: "Google Gemini",
        model,
        response: null,
        latencyMs: Date.now() - started,
        error: classified,
      };
    }
  }

  return {
    connected: false,
    provider: "Google Gemini",
    model: lastModel,
    response: null,
    latencyMs: Date.now() - started,
    error: lastModelError
      ? classifyGeminiError(lastModelError, apiKey)
      : {
          code: "MODEL_UNAVAILABLE",
          message: "No available Gemini model accepted the health probe.",
        },
  };
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isLoopbackRequest(request: Request): boolean {
  const url = new URL(request.url);
  const host = (url.hostname || "").toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return true;
  }

  const xf = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (xf === "127.0.0.1" || xf === "::1") return true;

  return false;
}

/**
 * Protects the Gemini health route from public use as a generation endpoint.
 * - Requires ADMIN_AI_HEALTH_TOKEN header when configured
 * - Otherwise restricts to loopback
 * - When FEATURE_AUTH_ENABLED, also requires elevated admin session
 */
export async function assertGeminiHealthAccess(
  request: Request,
): Promise<Response | null> {
  const configuredToken = process.env.ADMIN_AI_HEALTH_TOKEN?.trim();
  const provided =
    request.headers.get("x-admin-ai-health-token")?.trim() ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    "";

  if (configuredToken) {
    if (!provided || !safeEqual(provided, configuredToken)) {
      return Response.json(
        {
          connected: false,
          provider: "Google Gemini",
          model: null,
          response: null,
          latencyMs: 0,
          error: { code: "UNAUTHORIZED", message: "Admin health token required." },
        },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
  } else if (!isLoopbackRequest(request)) {
    return Response.json(
      {
        connected: false,
        provider: "Google Gemini",
        model: null,
        response: null,
        latencyMs: 0,
        error: {
          code: "FORBIDDEN",
          message:
            "Gemini health check is restricted to loopback unless ADMIN_AI_HEALTH_TOKEN is set.",
        },
      },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (process.env.FEATURE_AUTH_ENABLED === "true") {
    try {
      const { getSessionFromCookies } = await import("@/lib/auth/session");
      const { USER_ROLES } = await import("@/types/roles");
      const session = await getSessionFromCookies();
      const elevated = new Set<string>([
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.OWNER,
        USER_ROLES.ADMIN,
      ]);
      if (!session || !elevated.has(session.role)) {
        return Response.json(
          {
            connected: false,
            provider: "Google Gemini",
            model: null,
            response: null,
            latencyMs: 0,
            error: { code: "FORBIDDEN", message: "Admin session required." },
          },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        );
      }
    } catch {
      return Response.json(
        {
          connected: false,
          provider: "Google Gemini",
          model: null,
          response: null,
          latencyMs: 0,
          error: { code: "UNAUTHORIZED", message: "Admin session required." },
        },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  // Reject attempts to turn this into a public generator.
  const url = new URL(request.url);
  if (
    url.searchParams.has("prompt") ||
    url.searchParams.has("text") ||
    url.searchParams.has("input") ||
    url.searchParams.has("q")
  ) {
    return Response.json(
      {
        connected: false,
        provider: "Google Gemini",
        model: null,
        response: null,
        latencyMs: 0,
        error: {
          code: "FORBIDDEN",
          message: "Custom prompts are not allowed on the Gemini health endpoint.",
        },
      },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  return null;
}

/**
 * Protects Gemini setup wizard mutations: local development only.
 * Unlike the health probe, this may run behind a local preview tunnel.
 * When FEATURE_AUTH_ENABLED, requires an elevated admin session.
 * When ADMIN_AI_HEALTH_TOKEN is set, requires that token.
 */
export async function assertGeminiSetupAccess(
  request: Request,
): Promise<Response | null> {
  const { isLocalDevelopmentEnvironment } = await import("@/lib/ai/gemini-local-env");
  if (!isLocalDevelopmentEnvironment()) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Gemini setup wizard is available only in local development.",
        },
      },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const configuredToken = process.env.ADMIN_AI_HEALTH_TOKEN?.trim();
  const provided =
    request.headers.get("x-admin-ai-health-token")?.trim() ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    "";

  if (configuredToken) {
    if (!provided || !safeEqual(provided, configuredToken)) {
      return Response.json(
        {
          ok: false,
          error: { code: "UNAUTHORIZED", message: "Admin health token required." },
        },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  if (process.env.FEATURE_AUTH_ENABLED === "true") {
    try {
      const { getSessionFromCookies } = await import("@/lib/auth/session");
      const { USER_ROLES } = await import("@/types/roles");
      const session = await getSessionFromCookies();
      const elevated = new Set<string>([
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.OWNER,
        USER_ROLES.ADMIN,
      ]);
      if (!session || !elevated.has(session.role)) {
        return Response.json(
          {
            ok: false,
            error: { code: "FORBIDDEN", message: "Admin session required." },
          },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        );
      }
    } catch {
      return Response.json(
        {
          ok: false,
          error: { code: "UNAUTHORIZED", message: "Admin session required." },
        },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  // Setup is not a generation endpoint — reject prompt query attempts.
  const url = new URL(request.url);
  if (
    url.searchParams.has("prompt") ||
    url.searchParams.has("text") ||
    url.searchParams.has("input") ||
    url.searchParams.has("q")
  ) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Custom prompts are not allowed on the Gemini setup endpoint.",
        },
      },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  return null;
}
