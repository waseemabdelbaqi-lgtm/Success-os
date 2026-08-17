import { createHash } from "node:crypto";

export interface ProviderRateLimitResult { allowed: boolean; remaining: number; resetAt: number; mode: "firestore" | "memory"; }
const memory = new Map<string, { count: number; resetAt: number }>();

function firebaseConfigured() {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

function requesterKey(request: Request, scope: string): string {
  const identity = request.headers.get("x-user-id") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  return createHash("sha256").update(`${scope}:${identity}`).digest("hex");
}

function consumeMemory(key: string, maxRequests: number, windowMs: number): ProviderRateLimitResult {
  const now = Date.now();
  const current = memory.get(key);
  if (!current || now >= current.resetAt) {
    const resetAt = now + windowMs;
    memory.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt, mode: "memory" };
  }
  if (current.count >= maxRequests) return { allowed: false, remaining: 0, resetAt: current.resetAt, mode: "memory" };
  current.count += 1;
  return { allowed: true, remaining: maxRequests - current.count, resetAt: current.resetAt, mode: "memory" };
}

export async function checkProviderRateLimit(request: Request, scope: string, maxRequests: number, windowMs = 60_000): Promise<ProviderRateLimitResult> {
  const key = requesterKey(request, scope);
  if (!firebaseConfigured()) return consumeMemory(key, maxRequests, windowMs);
  const { getAdminFirestore } = await import("@/lib/firebase/firestore");
  const db = getAdminFirestore();
  const ref = db.collection("ai_teacher_rate_limits").doc(key);
  const result = await db.runTransaction(async (transaction) => {
    const now = Date.now();
    const snapshot = await transaction.get(ref);
    const data = snapshot.data() as { count?: number; resetAt?: number } | undefined;
    if (!snapshot.exists || !data?.resetAt || now >= data.resetAt) {
      const resetAt = now + windowMs;
      transaction.set(ref, { count: 1, resetAt, updatedAt: new Date(now).toISOString() });
      return { allowed: true, remaining: maxRequests - 1, resetAt };
    }
    const count = data.count ?? 0;
    if (count >= maxRequests) return { allowed: false, remaining: 0, resetAt: data.resetAt };
    transaction.update(ref, { count: count + 1, updatedAt: new Date(now).toISOString() });
    return { allowed: true, remaining: maxRequests - count - 1, resetAt: data.resetAt };
  });
  return { ...result, mode: "firestore" };
}

export function rateLimitHeaders(result: ProviderRateLimitResult): Record<string, string> {
  return { "X-RateLimit-Remaining": String(result.remaining), "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)), "X-RateLimit-Mode": result.mode };
}

