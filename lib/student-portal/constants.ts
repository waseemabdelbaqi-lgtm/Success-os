export const STUDENT_ROUTE_PREFIX = "/student";

export const STUDENT_ROUTES = {
  dashboard: `${STUDENT_ROUTE_PREFIX}/dashboard`,
  books: `${STUDENT_ROUTE_PREFIX}/books`,
  courses: `${STUDENT_ROUTE_PREFIX}/courses`,
  interactiveLessons: `${STUDENT_ROUTE_PREFIX}/interactive-lessons`,
  bookmarks: `${STUDENT_ROUTE_PREFIX}/bookmarks`,
  notes: `${STUDENT_ROUTE_PREFIX}/notes`,
  highlights: `${STUDENT_ROUTE_PREFIX}/highlights`,
  favorites: `${STUDENT_ROUTE_PREFIX}/favorites`,
  assistant: `${STUDENT_ROUTE_PREFIX}/assistant`,
  notifications: `${STUDENT_ROUTE_PREFIX}/notifications`,
  settings: `${STUDENT_ROUTE_PREFIX}/settings`,
  readingHistory: `${STUDENT_ROUTE_PREFIX}/reading-history`,
  profile: `${STUDENT_ROUTE_PREFIX}/profile`,
  book: (bookId: string) =>
    `${STUDENT_ROUTE_PREFIX}/books/${encodeURIComponent(bookId)}`,
  read: (bookId: string) =>
    `${STUDENT_ROUTE_PREFIX}/books/${encodeURIComponent(bookId)}/read`,
  course: (courseId: string) =>
    `${STUDENT_ROUTE_PREFIX}/courses/${encodeURIComponent(courseId)}`,
  courseLesson: (courseId: string, unitId: string, lessonId: string) =>
    `${STUDENT_ROUTE_PREFIX}/courses/${encodeURIComponent(courseId)}/units/${encodeURIComponent(unitId)}/lessons/${encodeURIComponent(lessonId)}`,
  subject: (subjectId: string, bookId?: string) => {
    const base = `${STUDENT_ROUTE_PREFIX}/subjects/${encodeURIComponent(subjectId)}`;
    return bookId
      ? `${base}?bookId=${encodeURIComponent(bookId)}`
      : base;
  },
  predictor: (bookId: string, lesson?: string) => {
    const base = `${STUDENT_ROUTE_PREFIX}/predictor?bookId=${encodeURIComponent(bookId)}`;
    return lesson
      ? `${base}&lesson=${encodeURIComponent(lesson)}`
      : base;
  },
  unit: (bookId: string, unitId: string) =>
    `${STUDENT_ROUTE_PREFIX}/books/${encodeURIComponent(bookId)}/units/${encodeURIComponent(unitId)}`,
  lesson: (bookId: string, unitId: string, lessonId: string) =>
    `${STUDENT_ROUTE_PREFIX}/books/${encodeURIComponent(bookId)}/units/${encodeURIComponent(unitId)}/lessons/${encodeURIComponent(lessonId)}`,
} as const;

export const STUDENT_PORTAL_ACCESS_ROLES = [
  "student",
  "super_admin",
  "owner",
  "admin",
] as const;

export const STORAGE_KEYS = {
  progress: "success-os:student:progress",
  bookProgress: "success-os:student:book-progress",
  bookmarks: "success-os:student:bookmarks",
  notes: "success-os:student:notes",
  highlights: "success-os:student:highlights",
  savedBooks: "success-os:student:saved-books",
  readingHistory: "success-os:student:reading-history",
  readingSettings: "success-os:student:reading-settings",
  profile: "success-os:student:profile",
} as const;

export const FONT_SIZE = {
  min: 14,
  max: 24,
  default: 16,
  step: 2,
} as const;

export const HIGHLIGHT_COLORS = [
  { id: "yellow", value: "#fef08a", label: "Yellow" },
  { id: "green", value: "#bbf7d0", label: "Green" },
  { id: "blue", value: "#bfdbfe", label: "Blue" },
  { id: "pink", value: "#fbcfe8", label: "Pink" },
] as const;
