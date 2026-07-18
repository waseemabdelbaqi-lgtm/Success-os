export const APP_NAME = "Success OS";

export const APP_DESCRIPTION =
  "A premium digital academy for curriculum books, lesson summaries, and full reading experiences.";

export const DEFAULT_PAGE_SIZE = 20;

export const MAX_PAGE_SIZE = 100;

export const API_VERSION = "v1";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  verifyEmail: "/verify-email",
  dashboard: "/dashboard",
  student: {
    dashboard: "/student/dashboard",
    books: "/student/books",
    bookmarks: "/student/bookmarks",
    notes: "/student/notes",
    readingHistory: "/student/reading-history",
    profile: "/student/profile",
  },
  api: {
    health: "/api/health",
    auth: {
      session: "/api/auth/session",
      logout: "/api/auth/logout",
      register: "/api/auth/register",
      role: "/api/auth/role",
    },
  },
} as const;

export const AUTH_ROUTES = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.verifyEmail,
] as const;

export const PROTECTED_ROUTE_PREFIX = "/dashboard";
export const STUDENT_ROUTE_PREFIX = "/student";

export const PROTECTED_ROUTES = [
  PROTECTED_ROUTE_PREFIX,
  STUDENT_ROUTE_PREFIX,
] as const;

export const PUBLIC_ROUTES = [ROUTES.home, ...AUTH_ROUTES] as const;

export const COOKIE_NAMES = {
  session: "__session",
  sessionMeta: "__session_meta",
} as const;

export const CACHE_TAGS = {
  user: "user",
  session: "session",
} as const;

export const RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 100,
  authMaxRequests: 20,
} as const;

export const PASSWORD_MIN_LENGTH = 8;

export const ROLE_ASSIGNMENT_ROLES = [
  "super_admin",
  "owner",
  "admin",
] as const;
