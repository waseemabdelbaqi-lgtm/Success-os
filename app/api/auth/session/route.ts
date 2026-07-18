import { z } from "zod";
import { withApiHandler, jsonResponse } from "@/lib/api/handler";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/response";
import {
  buildSessionCookieHeader,
} from "@/lib/auth/session";
import {
  buildSessionMetaCookieHeader,
} from "@/lib/auth/session-meta";
import { authService } from "@/services/auth/auth.service";
import { getServerEnv } from "@/lib/env";
import { getRoleDashboardPath } from "@/types/roles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const sessionRequestSchema = z.object({
  idToken: z.string().min(1, "ID token is required."),
});

export const POST = withApiHandler(async (request) => {
  const body = await request.json();
  const parsed = sessionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(
      createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid session request payload.",
        { issues: parsed.error.flatten() },
      ),
      422,
    );
  }

  const result = await authService.createSessionFromIdToken(parsed.data.idToken);

  if (!result.ok) {
    return jsonResponse(
      createErrorResponse("UNAUTHORIZED", result.error.message),
      401,
    );
  }

  const env = getServerEnv();

  const response = jsonResponse(
    createSuccessResponse({
      uid: result.data.session.uid,
      email: result.data.session.email,
      emailVerified: result.data.session.emailVerified,
      role: result.data.session.role,
      permissions: result.data.session.permissions,
      status: result.data.session.status,
      dashboardPath: getRoleDashboardPath(result.data.user.role),
    }),
  );

  response.headers.append(
    "Set-Cookie",
    buildSessionCookieHeader(result.data.sessionCookie, result.data.maxAge),
  );
  response.headers.append(
    "Set-Cookie",
    buildSessionMetaCookieHeader(
      result.data.sessionMetaCookie,
      result.data.maxAge,
      env.auth.secureCookies,
    ),
  );

  return response;
});

export const GET = withApiHandler(async () => {
  const result = await authService.getCurrentUser();

  if (!result.ok) {
    return jsonResponse(
      createErrorResponse("INTERNAL_ERROR", result.error.message),
      500,
    );
  }

  if (!result.data) {
    return jsonResponse(
      createErrorResponse("UNAUTHORIZED", "Not authenticated."),
      401,
    );
  }

  return jsonResponse(createSuccessResponse(result.data));
});
