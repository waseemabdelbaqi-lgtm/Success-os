import type { ServiceError, ServiceResult } from "@/types";
import { AppError, logger } from "@/lib/logger";

export abstract class BaseService {
  protected readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  protected success<T>(data: T): ServiceResult<T> {
    return { ok: true, data };
  }

  protected failure(
    code: string,
    message: string,
    cause?: unknown,
  ): ServiceResult<never> {
    logger.error(`${this.serviceName} operation failed`, {
      code,
      message,
      cause: cause instanceof Error ? cause.message : cause,
    });

    return {
      ok: false,
      error: { code, message, cause },
    };
  }

  protected wrapError(error: unknown, fallbackCode: string): ServiceError {
    if (error instanceof AppError) {
      return {
        code: error.code,
        message: error.message,
        cause: error,
      };
    }

    if (error instanceof Error) {
      return {
        code: fallbackCode,
        message: error.message,
        cause: error,
      };
    }

    return {
      code: fallbackCode,
      message: "An unexpected error occurred.",
      cause: error,
    };
  }
}
