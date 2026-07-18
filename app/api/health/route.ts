import { withApiHandler, jsonResponse } from "@/lib/api/handler";
import { createSuccessResponse } from "@/lib/api/response";
import { API_VERSION } from "@/lib/constants";
import type { HealthCheckResponse } from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function checkFirebaseHealth(): Promise<HealthCheckResponse["services"]["firebase"]> {
  try {
    const hasAdminConfig =
      Boolean(process.env.FIREBASE_PROJECT_ID) &&
      Boolean(process.env.FIREBASE_CLIENT_EMAIL) &&
      Boolean(process.env.FIREBASE_PRIVATE_KEY);

    if (!hasAdminConfig) {
      return "unknown";
    }

    const { getFirebaseAdminAuth } = await import("@/lib/firebase/admin");
    await getFirebaseAdminAuth().listUsers(1);
    return "ok";
  } catch {
    return "error";
  }
}

export const GET = withApiHandler(async () => {
  const firebaseStatus = await checkFirebaseHealth();

  const payload: HealthCheckResponse = {
    status: firebaseStatus === "error" ? "degraded" : "ok",
    version: API_VERSION,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
    timestamp: new Date().toISOString(),
    services: {
      firebase: firebaseStatus,
    },
  };

  return jsonResponse(createSuccessResponse(payload));
});
