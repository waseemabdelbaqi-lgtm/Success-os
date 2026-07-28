import {
  assertGeminiSetupAccess,
} from "@/lib/ai/gemini";
import {
  getGeminiCliAuthStatus,
  logoutGeminiCliGoogle,
  startGeminiCliGoogleLogin,
  verifyGeminiCliConnection,
  isCurriculumGenerationAllowed,
} from "@/lib/ai/gemini-cli-auth";
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

/**
 * GET /api/admin/ai/gemini/setup
 * Safe Gemini CLI Google-login status + optional health (never returns tokens).
 */
export async function GET(request: Request): Promise<Response> {
  const denied = await assertGeminiSetupAccess(request);
  if (denied) return denied;

  const rate = checkRateLimit(`gemini-cli-status:${clientKey(request)}`);
  if (!rate.allowed) {
    return json(
      { ok: false, error: { code: "RATE_LIMIT", message: "Rate limit exceeded." } },
      429,
      getRateLimitHeaders(rate),
    );
  }

  const auth = await getGeminiCliAuthStatus();
  let health = null as Awaited<ReturnType<typeof verifyGeminiCliConnection>> | null;
  if (auth.authenticated) {
    health = await verifyGeminiCliConnection();
  }

  return json(
    {
      ok: true,
      method: "gemini-cli-google-login",
      configured: auth.authenticated,
      authenticated: auth.authenticated,
      accountEmail: auth.accountEmail,
      authType: auth.authType,
      waitingForApproval: auth.waitingForApproval,
      authUrl: auth.authUrl,
      localDevelopment: true,
      gitignored: true,
      credentialStore: "~/.gemini/oauth_creds.json (never committed)",
      curriculumProcessingAllowed: isCurriculumGenerationAllowed(
        Boolean(health?.connected),
      ),
      health: health
        ? {
            status: health.status,
            connected: health.connected,
            model: health.model,
            response: health.response,
            latencyMs: health.latencyMs,
            error: health.error,
          }
        : null,
    },
    200,
    getRateLimitHeaders(rate),
  );
}

/**
 * POST /api/admin/ai/gemini/setup
 * Actions: start_google_login | test | (legacy save rejected)
 */
export async function POST(request: Request): Promise<Response> {
  const denied = await assertGeminiSetupAccess(request);
  if (denied) return denied;

  const rate = checkRateLimit(`gemini-cli-write:${clientKey(request)}`);
  if (!rate.allowed) {
    return json(
      { ok: false, error: { code: "RATE_LIMIT", message: "Rate limit exceeded." } },
      429,
      getRateLimitHeaders(rate),
    );
  }

  let body: { action?: unknown; apiKey?: unknown } = {};
  try {
    body = (await request.json()) as { action?: unknown; apiKey?: unknown };
  } catch {
    body = {};
  }

  // Reject legacy API-key paste flow — replaced by Google login.
  if (typeof body.apiKey === "string") {
    body.apiKey = undefined;
    return json(
      {
        ok: false,
        error: {
          code: "API_KEY_FLOW_DISABLED",
          message:
            "Manual API keys are disabled. Use official Gemini CLI Google login instead.",
        },
      },
      400,
      getRateLimitHeaders(rate),
    );
  }

  const action = typeof body.action === "string" ? body.action : "start_google_login";

  if (action === "test") {
    const health = await verifyGeminiCliConnection();
    return json(
      {
        ok: health.connected,
        method: "gemini-cli-google-login",
        accountEmail: health.accountEmail,
        curriculumProcessingAllowed: isCurriculumGenerationAllowed(health.connected),
        health: {
          status: health.status,
          connected: health.connected,
          model: health.model,
          response: health.response,
          latencyMs: health.latencyMs,
          error: health.error,
        },
      },
      health.connected ? 200 : 503,
      getRateLimitHeaders(rate),
    );
  }

  if (action === "start_google_login" || action === "save" || action === "restart") {
    const started = await startGeminiCliGoogleLogin({ force: true });
    return json(
      {
        ok: true,
        method: "gemini-cli-google-login",
        status: started.status,
        authUrl: started.authUrl,
        callbackPort: started.callbackPort,
        expiresAt: started.expiresAt,
        message: started.message,
        pauseForUser: started.status === "waiting_for_google_approval",
        curriculumProcessingAllowed: false,
      },
      200,
      getRateLimitHeaders(rate),
    );
  }

  if (action === "complete_from_redirect") {
    const { completeGeminiCliLoginFromRedirectUrl } = await import(
      "@/lib/ai/gemini-cli-auth"
    );
    const redirectUrl =
      typeof (body as { redirectUrl?: unknown }).redirectUrl === "string"
        ? (body as { redirectUrl: string }).redirectUrl
        : "";
    const done = await completeGeminiCliLoginFromRedirectUrl(redirectUrl);
    let health = null as Awaited<
      ReturnType<typeof verifyGeminiCliConnection>
    > | null;
    if (done.authenticated) {
      health = await verifyGeminiCliConnection();
    }
    return json(
      {
        ok: done.authenticated,
        method: "gemini-cli-google-login",
        accountEmail: done.accountEmail,
        error: done.error ? { code: "OAUTH_COMPLETE_FAILED", message: done.error } : null,
        curriculumProcessingAllowed: isCurriculumGenerationAllowed(
          Boolean(health?.connected),
        ),
        health: health
          ? {
              status: health.status,
              connected: health.connected,
              model: health.model,
              response: health.response,
              latencyMs: health.latencyMs,
              error: health.error,
            }
          : null,
      },
      done.authenticated ? 200 : 400,
      getRateLimitHeaders(rate),
    );
  }

  return json(
    { ok: false, error: { code: "BAD_REQUEST", message: "Unknown action." } },
    400,
    getRateLimitHeaders(rate),
  );
}

/**
 * DELETE /api/admin/ai/gemini/setup — logout / remove local CLI OAuth credentials.
 */
export async function DELETE(request: Request): Promise<Response> {
  const denied = await assertGeminiSetupAccess(request);
  if (denied) return denied;

  const rate = checkRateLimit(`gemini-cli-delete:${clientKey(request)}`);
  if (!rate.allowed) {
    return json(
      { ok: false, error: { code: "RATE_LIMIT", message: "Rate limit exceeded." } },
      429,
      getRateLimitHeaders(rate),
    );
  }

  const result = await logoutGeminiCliGoogle();
  return json(
    {
      ok: result.removed,
      removed: result.removed,
      method: "gemini-cli-google-login",
      configured: false,
      curriculumProcessingAllowed: false,
      health: {
        status: "Failed",
        connected: false,
        model: null,
        response: null,
        latencyMs: 0,
        error: {
          code: "NOT_AUTHENTICATED",
          message: "Gemini CLI Google login credentials were removed.",
        },
      },
    },
    200,
    getRateLimitHeaders(rate),
  );
}
