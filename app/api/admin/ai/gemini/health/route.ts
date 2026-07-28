import {
  assertGeminiHealthAccess,
  verifyGeminiConnection,
} from "@/lib/ai/gemini";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tight limiter — health probe only, not a generation API. */
const HEALTH_RATE = {
  windowMs: 60_000,
  maxRequests: 5,
} as const;

const healthCounts = new Map<string, { count: number; resetAt: number }>();

function checkHealthRateLimit(key: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const existing = healthCounts.get(key);
  if (!existing || now >= existing.resetAt) {
    healthCounts.set(key, { count: 1, resetAt: now + HEALTH_RATE.windowMs });
    return {
      allowed: true,
      remaining: HEALTH_RATE.maxRequests - 1,
      resetAt: now + HEALTH_RATE.windowMs,
    };
  }
  if (existing.count >= HEALTH_RATE.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  healthCounts.set(key, existing);
  return {
    allowed: true,
    remaining: HEALTH_RATE.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

function clientKey(request: Request): string {
  const xf = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return xf || request.headers.get("x-real-ip") || "loopback";
}

/**
 * GET /api/admin/ai/gemini/health
 * Temporary protected Gemini connection probe.
 * Does not accept prompts and is not a public generation endpoint.
 */
export async function GET(request: Request): Promise<Response> {
  const denied = await assertGeminiHealthAccess(request);
  if (denied) return denied;

  const rate = checkHealthRateLimit(`gemini-health:${clientKey(request)}`);
  if (!rate.allowed) {
    return Response.json(
      {
        connected: false,
        provider: "Google Gemini",
        model: null,
        response: null,
        latencyMs: 0,
        error: {
          code: "RATE_LIMIT",
          message: "Gemini health-check rate limit exceeded.",
        },
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          ...getRateLimitHeaders(rate),
        },
      },
    );
  }

  // Shared app rate limit as a second belt.
  const globalRate = checkRateLimit(`gemini-health-global:${clientKey(request)}`);
  if (!globalRate.allowed) {
    return Response.json(
      {
        connected: false,
        provider: "Google Gemini",
        model: null,
        response: null,
        latencyMs: 0,
        error: {
          code: "RATE_LIMIT",
          message: "API rate limit exceeded.",
        },
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          ...getRateLimitHeaders(globalRate),
        },
      },
    );
  }

  const result = await verifyGeminiConnection();

  if (result.connected) {
    return Response.json(
      {
        connected: true,
        provider: result.provider,
        model: result.model,
        response: result.response,
        latencyMs: result.latencyMs,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          ...getRateLimitHeaders(rate),
        },
      },
    );
  }

  const status =
    result.error.code === "GEMINI_API_KEY_MISSING"
      ? 503
      : result.error.code === "INVALID_KEY"
        ? 401
        : result.error.code === "RATE_LIMIT" || result.error.code === "QUOTA_EXHAUSTED"
          ? 429
          : result.error.code === "NETWORK_FAILURE"
            ? 502
            : 503;

  return Response.json(
    {
      connected: false,
      provider: result.provider,
      model: result.model,
      response: null,
      latencyMs: result.latencyMs,
      error: result.error,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...getRateLimitHeaders(rate),
      },
    },
  );
}

export async function POST(): Promise<Response> {
  return Response.json(
    {
      connected: false,
      provider: "Google Gemini",
      model: null,
      response: null,
      latencyMs: 0,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Only GET is allowed. This is not a generation endpoint.",
      },
    },
    { status: 405, headers: { Allow: "GET", "Cache-Control": "no-store" } },
  );
}
