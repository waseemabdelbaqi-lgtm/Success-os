import {
  assertGeminiSetupAccess,
  verifyGeminiConnection,
} from "@/lib/ai/gemini";
import {
  getGeminiSetupStatus,
  removeGeminiApiKeyFromEnvLocal,
  saveGeminiApiKeyToEnvLocal,
} from "@/lib/ai/gemini-local-env";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientKey(request: Request): string {
  const xf = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return xf || request.headers.get("x-real-ip") || "loopback";
}

function json(data: unknown, status = 200, extra?: Record<string, string>) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...extra },
  });
}

function publicHealth(result: Awaited<ReturnType<typeof verifyGeminiConnection>>) {
  if (result.connected) {
    return {
      status: "Connected" as const,
      connected: true,
      model: result.model,
      response: result.response,
      latencyMs: result.latencyMs,
      error: null,
    };
  }
  return {
    status: "Failed" as const,
    connected: false,
    model: result.model,
    response: null as null,
    latencyMs: result.latencyMs,
    error: result.error,
  };
}

/** GET — safe status only (never returns the API key). */
export async function GET(request: Request): Promise<Response> {
  const denied = await assertGeminiSetupAccess(request);
  if (denied) return denied;

  const rate = checkRateLimit(`gemini-setup-status:${clientKey(request)}`);
  if (!rate.allowed) {
    return json(
      { ok: false, error: { code: "RATE_LIMIT", message: "Rate limit exceeded." } },
      429,
      getRateLimitHeaders(rate),
    );
  }

  const status = getGeminiSetupStatus();
  let health = null as ReturnType<typeof publicHealth> | null;
  if (status.configured) {
    health = publicHealth(await verifyGeminiConnection());
  }

  return json(
    {
      ok: true,
      configured: status.configured,
      localDevelopment: status.localDevelopment,
      canAutoWrite: status.canAutoWrite,
      envFile: status.envFile,
      gitignored: status.gitignored,
      officialKeyPage: "https://aistudio.google.com/apikey",
      curriculumProcessingAllowed: false,
      health,
    },
    200,
    getRateLimitHeaders(rate),
  );
}

/**
 * POST — save API key to .env.local, hydrate process.env, run Arabic health test.
 * Body: { apiKey: string } | { action: "test" }
 * Never returns the key.
 */
export async function POST(request: Request): Promise<Response> {
  const denied = await assertGeminiSetupAccess(request);
  if (denied) return denied;

  const rate = checkRateLimit(`gemini-setup-write:${clientKey(request)}`);
  if (!rate.allowed) {
    return json(
      { ok: false, error: { code: "RATE_LIMIT", message: "Rate limit exceeded." } },
      429,
      getRateLimitHeaders(rate),
    );
  }

  let body: { apiKey?: unknown; action?: unknown } = {};
  try {
    body = (await request.json()) as { apiKey?: unknown; action?: unknown };
  } catch {
    return json(
      { ok: false, error: { code: "BAD_REQUEST", message: "JSON body required." } },
      400,
      getRateLimitHeaders(rate),
    );
  }

  const action = typeof body.action === "string" ? body.action : "save";

  if (action === "test") {
    const health = publicHealth(await verifyGeminiConnection());
    return json(
      {
        ok: health.connected,
        status: health.status,
        connected: health.connected,
        model: health.model,
        response: health.response,
        latencyMs: health.latencyMs,
        error: health.error,
        curriculumProcessingAllowed: false,
        health,
      },
      health.connected ? 200 : 503,
      getRateLimitHeaders(rate),
    );
  }

  // Reject leftover OAuth actions.
  if (
    action === "start_google_login" ||
    action === "restart" ||
    action === "complete_from_redirect"
  ) {
    return json(
      {
        ok: false,
        error: {
          code: "OAUTH_DISABLED",
          message: "Gemini CLI OAuth was removed. Paste an API key instead.",
        },
      },
      400,
      getRateLimitHeaders(rate),
    );
  }

  if (typeof body.apiKey !== "string") {
    return json(
      { ok: false, error: { code: "BAD_REQUEST", message: "apiKey is required." } },
      400,
      getRateLimitHeaders(rate),
    );
  }

  const save = saveGeminiApiKeyToEnvLocal(body.apiKey);
  body.apiKey = undefined;

  if (!save.saved) {
    return json(
      {
        ok: false,
        saved: false,
        requiresManualPaste: save.requiresManualPaste,
        envFile: save.file,
        reason: "reason" in save ? save.reason : "Save failed.",
        status: "Failed",
        connected: false,
        model: null,
        response: null,
        latencyMs: 0,
        curriculumProcessingAllowed: false,
        health: null,
      },
      save.requiresManualPaste ? 503 : 400,
      getRateLimitHeaders(rate),
    );
  }

  const health = publicHealth(await verifyGeminiConnection());
  return json(
    {
      ok: health.connected,
      saved: true,
      status: health.status,
      connected: health.connected,
      model: health.model,
      response: health.response,
      latencyMs: health.latencyMs,
      error: health.error,
      curriculumProcessingAllowed: false,
      health,
    },
    health.connected ? 200 : 502,
    getRateLimitHeaders(rate),
  );
}

/** DELETE — remove GEMINI_API_KEY from .env.local / process.env */
export async function DELETE(request: Request): Promise<Response> {
  const denied = await assertGeminiSetupAccess(request);
  if (denied) return denied;

  const rate = checkRateLimit(`gemini-setup-delete:${clientKey(request)}`);
  if (!rate.allowed) {
    return json(
      { ok: false, error: { code: "RATE_LIMIT", message: "Rate limit exceeded." } },
      429,
      getRateLimitHeaders(rate),
    );
  }

  const result = removeGeminiApiKeyFromEnvLocal();
  return json(
    {
      ok: result.removed,
      removed: result.removed,
      configured: false,
      status: "Failed",
      connected: false,
      curriculumProcessingAllowed: false,
      health: {
        status: "Failed",
        connected: false,
        model: null,
        response: null,
        latencyMs: 0,
        error: {
          code: "GEMINI_API_KEY_MISSING",
          message: "GEMINI_API_KEY was removed.",
        },
      },
    },
    result.removed ? 200 : 500,
    getRateLimitHeaders(rate),
  );
}
