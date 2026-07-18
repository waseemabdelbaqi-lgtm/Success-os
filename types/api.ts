import type { ApiErrorResponse, ApiResponse } from "@/types";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiRouteContext<TParams extends Record<string, string> = Record<string, string>> = {
  params: Promise<TParams>;
};

export type ApiHandlerResult<T> = ApiResponse<T> | ApiErrorResponse;

export const API_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export type HealthCheckResponse = {
  status: "ok" | "degraded" | "error";
  version: string;
  environment: string;
  timestamp: string;
  services: {
    firebase: "ok" | "error" | "unknown";
  };
};
