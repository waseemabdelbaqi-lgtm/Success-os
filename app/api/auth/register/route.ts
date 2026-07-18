import { z } from "zod";
import { withApiHandler, jsonResponse } from "@/lib/api/handler";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/response";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { userService } from "@/services/auth/user.service";
import { isValidRole, SELF_REGISTERABLE_ROLES } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";
import type { AuthProvider } from "@/types/auth";
import { generateRequestId } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const registerSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().nullable(),
  role: z.string().refine(isValidRole, "Invalid role."),
  registrationProvider: z.enum([
    "password",
    "google.com",
    "apple.com",
    "github.com",
  ]),
  isOAuth: z.boolean().optional().default(false),
});

export const POST = withApiHandler(async (request) => {
  const requestId = generateRequestId();
  const rateLimit = checkRateLimit(`register:${request.headers.get("x-forwarded-for") ?? requestId}`);

  if (!rateLimit.allowed) {
    const response = jsonResponse(
      createErrorResponse("RATE_LIMITED", "Too many registration attempts."),
      429,
    );
    Object.entries(getRateLimitHeaders(rateLimit)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(
      createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid registration payload.",
        { issues: parsed.error.flatten() },
      ),
      422,
    );
  }

  const { uid, email, displayName, role, registrationProvider, isOAuth } =
    parsed.data;

  if (!isOAuth && !SELF_REGISTERABLE_ROLES.includes(role)) {
    return jsonResponse(
      createErrorResponse(
        "FORBIDDEN",
        "This role cannot be self-assigned during registration.",
      ),
      403,
    );
  }

  const effectiveRole = isOAuth ? USER_ROLES.JOB_SEEKER : role;

  const existing = await userService.getUserProfile(uid);

  if (existing.ok && existing.data) {
    return jsonResponse(
      createSuccessResponse({
        uid: existing.data.uid,
        role: existing.data.role,
        existing: true,
      }),
    );
  }

  const result = await userService.ensureUserProfile(
    uid,
    email,
    displayName,
    registrationProvider as AuthProvider,
    effectiveRole,
  );

  if (!result.ok) {
    return jsonResponse(
      createErrorResponse("INTERNAL_ERROR", result.error.message),
      500,
    );
  }

  return jsonResponse(
    createSuccessResponse({
      uid: result.data.uid,
      role: result.data.role,
      existing: false,
    }),
    201,
  );
});
