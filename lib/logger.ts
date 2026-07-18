import type { LogLevel } from "@/types";

type LogContext = Record<string, unknown>;

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function getConfiguredLevel(): LogLevel {
  const level = process.env.LOG_LEVEL;

  if (
    level === "debug" ||
    level === "info" ||
    level === "warn" ||
    level === "error"
  ) {
    return level;
  }

  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function shouldLog(level: LogLevel): boolean {
  const configuredLevel = getConfiguredLevel();
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[configuredLevel];
}

function serializeContext(context?: LogContext): LogContext | undefined {
  if (!context) {
    return undefined;
  }

  return context;
}

function writeLog(
  level: LogLevel,
  message: string,
  context?: LogContext,
): void {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(serializeContext(context) ?? {}),
  };

  const output = JSON.stringify(payload);

  switch (level) {
    case "debug":
    case "info":
      console.warn(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "error":
      console.error(output);
      break;
    default:
      console.warn(output);
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    writeLog("debug", message, context);
  },
  info(message: string, context?: LogContext): void {
    writeLog("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    writeLog("warn", message, context);
  },
  error(message: string, context?: LogContext): void {
    writeLog("error", message, context);
  },
};

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly details?: Record<string, unknown>;

  constructor(options: {
    code: string;
    message: string;
    statusCode?: number;
    isOperational?: boolean;
    details?: Record<string, unknown>;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = "AppError";
    this.code = options.code;
    this.statusCode = options.statusCode ?? 500;
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;
  }
}

export function toAppError(error: unknown, fallbackCode = "INTERNAL_ERROR"): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError({
      code: fallbackCode,
      message: error.message,
      cause: error,
    });
  }

  return new AppError({
    code: fallbackCode,
    message: "An unexpected error occurred.",
    cause: error,
  });
}
