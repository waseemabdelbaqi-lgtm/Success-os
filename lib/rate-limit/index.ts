import { RATE_LIMIT } from "@/lib/constants";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * In-memory rate limiter placeholder for development.
 * Replace with Redis/Upstash for multi-instance production deployments.
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const existing = requestCounts.get(key);

  if (!existing || now >= existing.resetAt) {
    requestCounts.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT.windowMs,
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT.maxRequests - 1,
      resetAt: now + RATE_LIMIT.windowMs,
    };
  }

  if (existing.count >= RATE_LIMIT.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  requestCounts.set(key, existing);

  return {
    allowed: true,
    remaining: RATE_LIMIT.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
