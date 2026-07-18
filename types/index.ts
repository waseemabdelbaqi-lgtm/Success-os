export type AppEnvironment = "development" | "staging" | "production" | "test";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type ApiResponse<T = unknown> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ApiMeta = {
  requestId?: string;
  timestamp?: string;
  pagination?: PaginationMeta;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedRequest = {
  page?: number;
  pageSize?: number;
};

export type SortDirection = "asc" | "desc";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };

export type ServiceError = {
  code: string;
  message: string;
  cause?: unknown;
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
