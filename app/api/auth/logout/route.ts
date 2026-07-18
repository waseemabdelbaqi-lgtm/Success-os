import { cookies } from "next/headers";
import { withApiHandler, jsonResponse } from "@/lib/api/handler";
import { createSuccessResponse } from "@/lib/api/response";
import {
  buildClearSessionCookieHeader,
  revokeSession,
} from "@/lib/auth/session";
import {
  buildClearSessionMetaCookieHeader,
} from "@/lib/auth/session-meta";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withApiHandler(async () => {
  const cookieStore = await cookies();
  const env = getServerEnv();
  const sessionCookie = cookieStore.get(env.auth.sessionCookieName)?.value;

  if (sessionCookie) {
    await revokeSession(sessionCookie);
  }

  const response = jsonResponse(createSuccessResponse({ signedOut: true }));

  response.headers.append("Set-Cookie", buildClearSessionCookieHeader());
  response.headers.append(
    "Set-Cookie",
    buildClearSessionMetaCookieHeader(env.auth.secureCookies),
  );

  return response;
});
