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

function json(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...extraHeaders },
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
    response: null,
    latencyMs: result.latencyMs,
    error: result.error,
  };
}

/**
 * GET /api/admin/ai/gemini/setup
 * Safe status only — never returns the API key.
 */
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
      ...status,
      curriculumProcessingAllowed: Boolean(health?.connected),
      health,
    },
    200,
    getRateLimitHeaders(rate),
  );
}

/**
 * POST /api/admin/ai/gemini/setup
 * Body: { apiKey: string, action?: "save" | "test" }
 * Saves to .env.local (local only), hydrates process.env, runs health test.
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
        saved: false,
        requiresManualPaste: false,
        envFile: ".env.local",
        curriculumProcessingAllowed: health.connected,
        health,
      },
      health.connected ? 200 : 503,
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
  // Clear the request body reference from local scope as much as practical.
  body.apiKey = undefined;

  if (!save.saved) {
    return json(
      {
        ok: false,
        saved: false,
        requiresManualPaste: save.requiresManualPaste,
        envFile: save.file,
        reason: "reason" in save ? save.reason : "Save failed.",
        configured: save.configured,
        curriculumProcessingAllowed: false,
        health: null,
        // Client builds the copy line from its own input — server never echoes the key.
        manualPasteHint:
          save.requiresManualPaste
            ? `أنشئ أو افتح الملف ${save.file} في جذر المشروع وألصق سطر الإعداد الذي يظهر في الصفحة.`
            : null,
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
      requiresManualPaste: false,
      envFile: save.file,
      configured: true,
      processEnvUpdated: true,
      restartRecommended: false,
      curriculumProcessingAllowed: health.connected,
      health,
      message: health.connected
        ? "تم حفظ المفتاح واختبار الاتصال بنجاح."
        : "تم حفظ المفتاح لكن اختبار الاتصال فشل.",
    },
    health.connected ? 200 : 502,
    getRateLimitHeaders(rate),
  );
}

/**
 * DELETE /api/admin/ai/gemini/setup
 * Removes GEMINI_API_KEY from .env.local and process.env.
 */
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
      envFile: result.file,
      configured: result.configured,
      curriculumProcessingAllowed: false,
      reason: result.reason || null,
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
