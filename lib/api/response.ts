import type { ApiErrorResponse, ApiResponse } from "@/types";
import type { ApiErrorCode } from "@/types/api";
import { AppError } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";

export function createSuccessResponse<T>(
  data: T,
  meta?: ApiResponse<T>["meta"],
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

export function errorToResponse(error: unknown): {
  body: ApiErrorResponse;
  status: number;
} {
  const appError = error instanceof AppError ? error : new AppError({
    code: "INTERNAL_ERROR",
    message: error instanceof Error ? error.message : "Internal server error.",
    statusCode: 500,
    cause: error,
  });

  return {
    status: appError.statusCode,
    body: createErrorResponse(
      appError.code as ApiErrorCode,
      appError.message,
      appError.details,
    ),
  };
}

export function getHttpStatusFromErrorCode(code: ApiErrorCode): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "VALIDATION_ERROR":
      return 422;
    case "RATE_LIMITED":
      return 429;
    case "SERVICE_UNAVAILABLE":
      return 503;
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}
