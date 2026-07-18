import { z } from "zod";
import { withApiHandler, jsonResponse } from "@/lib/api/handler";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api/response";
import { permissionService } from "@/services/auth/permission.service";
import { userService } from "@/services/auth/user.service";
import { PERMISSIONS } from "@/types/permissions";
import { isValidRole } from "@/types/roles";
import { getSessionFromCookies } from "@/lib/auth/session";
import type { ApiErrorCode } from "@/types/api";
import { API_ERROR_CODES } from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const assignRoleSchema = z.object({
  targetUid: z.string().min(1),
  role: z.string().refine(isValidRole, "Invalid role."),
});

export const POST = withApiHandler(async (request) => {
  const session = await getSessionFromCookies();

  if (!session) {
    return jsonResponse(
      createErrorResponse("UNAUTHORIZED", "Not authenticated."),
      401,
    );
  }

  await permissionService.enforcePermission(PERMISSIONS.ROLES_ASSIGN);

  const body = await request.json();
  const parsed = assignRoleSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(
      createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid role assignment payload.",
        { issues: parsed.error.flatten() },
      ),
      422,
    );
  }

  const result = await userService.assignRole(
    session.uid,
    parsed.data.targetUid,
    parsed.data.role,
  );

  if (!result.ok) {
    const status = result.error.code === "FORBIDDEN" ? 403
      : result.error.code === "NOT_FOUND" ? 404
      : 500;
    const errorCode: ApiErrorCode =
      result.error.code === "FORBIDDEN"
        ? API_ERROR_CODES.FORBIDDEN
        : result.error.code === "NOT_FOUND"
          ? API_ERROR_CODES.NOT_FOUND
          : API_ERROR_CODES.INTERNAL_ERROR;
    return jsonResponse(
      createErrorResponse(errorCode, result.error.message),
      status,
    );
  }

  return jsonResponse(createSuccessResponse(result.data));
});

export const GET = withApiHandler(async () => {
  const result = await permissionService.getAuthenticatedUser();

  if (!result.ok) {
    return jsonResponse(
      createErrorResponse("UNAUTHORIZED", result.error.message),
      401,
    );
  }

  return jsonResponse(
    createSuccessResponse({
      role: result.data.role,
      permissions: result.data.permissions,
      status: result.data.status,
    }),
  );
});
