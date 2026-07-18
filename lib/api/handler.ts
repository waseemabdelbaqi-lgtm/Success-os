import { NextResponse } from "next/server";
import type { ApiErrorResponse, ApiResponse } from "@/types";
import { errorToResponse } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/utils";

type RouteHandler<TContext = unknown> = (
  request: Request,
  context: TContext,
) => Promise<Response>;

export function withApiHandler<TContext = unknown>(
  handler: RouteHandler<TContext>,
): RouteHandler<TContext> {
  return async (request, context) => {
    const requestId = generateRequestId();
    const startedAt = Date.now();

    try {
      const response = await handler(request, context);

      logger.info("API request completed", {
        requestId,
        method: request.method,
        url: request.url,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });

      return response;
    } catch (error) {
      const { body, status } = errorToResponse(error);

      logger.error("API request failed", {
        requestId,
        method: request.method,
        url: request.url,
        status,
        durationMs: Date.now() - startedAt,
        error: body.error.message,
      });

      return jsonResponse(body, status, { requestId });
    }
  };
}

export function jsonResponse<T>(
  data: ApiResponse<T> | ApiErrorResponse,
  status = 200,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}
