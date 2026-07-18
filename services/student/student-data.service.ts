import { STORAGE_KEYS } from "@/lib/student-portal/constants";
import type {
  BookProgress,
  LessonBookmark,
  LessonNote,
  LessonProgress,
  ReadingHistoryEntry,
  SavedBook,
  StudentProfile,
  StudentReadingSettings,
  TextHighlight,
} from "@/types/student-portal";

function isClient(): boolean {
  return typeof window !== "undefined";
}

function readStorage<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (!isClient()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class StudentDataService {
  getReadingSettings(): StudentReadingSettings {
    return readStorage<StudentReadingSettings>(STORAGE_KEYS.readingSettings, {
      fontSize: 16,
      theme: "light",
      locale: "en",
      direction: "ltr",
    });
  }

  saveReadingSettings(settings: StudentReadingSettings): void {
    writeStorage(STORAGE_KEYS.readingSettings, settings);
  }

  getProfile(): StudentProfile {
    return readStorage<StudentProfile>(STORAGE_KEYS.profile, {
      countryId: "sa",
      systemId: "sa-national",
      curriculumId: "sa-general",
      gradeId: "g10",
      subjectIds: ["math", "science"],
    });
  }

  saveProfile(profile: StudentProfile): void {
    writeStorage(STORAGE_KEYS.profile, profile);
  }

  getBookmarks(): LessonBookmark[] {
    return readStorage<LessonBookmark[]>(STORAGE_KEYS.bookmarks, []);
  }

  addBookmark(
    bookId: string,
    unitId: string,
    lessonId: string,
    label?: string,
  ): LessonBookmark {
    const bookmarks = this.getBookmarks();
    const existing = bookmarks.find(
      (b) =>
        b.bookId === bookId &&
        b.unitId === unitId &&
        b.lessonId === lessonId,
    );

    if (existing) return existing;

    const bookmark: LessonBookmark = {
      id: generateId(),
      bookId,
      unitId,
      lessonId,
      label,
      createdAt: new Date().toISOString(),
    };

    writeStorage(STORAGE_KEYS.bookmarks, [bookmark, ...bookmarks]);
    return bookmark;
  }

  removeBookmark(id: string): void {
    writeStorage(
      STORAGE_KEYS.bookmarks,
      this.getBookmarks().filter((b) => b.id !== id),
    );
  }

  isBookmarked(bookId: string, unitId: string, lessonId: string): boolean {
    return this.getBookmarks().some(
      (b) =>
        b.bookId === bookId &&
        b.unitId === unitId &&
        b.lessonId === lessonId,
    );
  }

  getNotes(): LessonNote[] {
    return readStorage<LessonNote[]>(STORAGE_KEYS.notes, []);
  }

  addNote(
    bookId: string,
    unitId: string,
    lessonId: string,
    content: string,
  ): LessonNote {
    const note: LessonNote = {
      id: generateId(),
      bookId,
      unitId,
      lessonId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeStorage(STORAGE_KEYS.notes, [note, ...this.getNotes()]);
    return note;
  }

  updateNote(id: string, content: string): void {
    const notes = this.getNotes().map((note) =>
      note.id === id
        ? { ...note, content, updatedAt: new Date().toISOString() }
        : note,
    );
    writeStorage(STORAGE_KEYS.notes, notes);
  }

  deleteNote(id: string): void {
    writeStorage(
      STORAGE_KEYS.notes,
      this.getNotes().filter((n) => n.id !== id),
    );
  }

  getHighlights(): TextHighlight[] {
    return readStorage<TextHighlight[]>(STORAGE_KEYS.highlights, []);
  }

  addHighlight(
    bookId: string,
    unitId: string,
    lessonId: string,
    text: string,
    color: string,
  ): TextHighlight {
    const highlight: TextHighlight = {
      id: generateId(),
      bookId,
      unitId,
      lessonId,
      text,
      color,
      createdAt: new Date().toISOString(),
    };
    writeStorage(STORAGE_KEYS.highlights, [highlight, ...this.getHighlights()]);
    return highlight;
  }

  getHighlightsForLesson(
    bookId: string,
    unitId: string,
    lessonId: string,
  ): TextHighlight[] {
    return this.getHighlights().filter(
      (h) =>
        h.bookId === bookId &&
        h.unitId === unitId &&
        h.lessonId === lessonId,
    );
  }

  getSavedBooks(): SavedBook[] {
    return readStorage<SavedBook[]>(STORAGE_KEYS.savedBooks, []);
  }

  toggleSavedBook(bookId: string): boolean {
    const saved = this.getSavedBooks();
    const exists = saved.find((s) => s.bookId === bookId);

    if (exists) {
      writeStorage(
        STORAGE_KEYS.savedBooks,
        saved.filter((s) => s.bookId !== bookId),
      );
      return false;
    }

    writeStorage(STORAGE_KEYS.savedBooks, [
      { bookId, savedAt: new Date().toISOString() },
      ...saved,
    ]);
    return true;
  }

  isBookSaved(bookId: string): boolean {
    return this.getSavedBooks().some((s) => s.bookId === bookId);
  }

  getReadingHistory(): ReadingHistoryEntry[] {
    return readStorage<ReadingHistoryEntry[]>(STORAGE_KEYS.readingHistory, []);
  }

  addReadingHistory(
    bookId: string,
    unitId: string,
    lessonId: string,
    durationMinutes = 0,
  ): void {
    const entry: ReadingHistoryEntry = {
      id: generateId(),
      bookId,
      unitId,
      lessonId,
      visitedAt: new Date().toISOString(),
      durationMinutes,
    };

    const history = [
      entry,
      ...this.getReadingHistory().filter(
        (h) =>
          !(
            h.bookId === bookId &&
            h.unitId === unitId &&
            h.lessonId === lessonId
          ),
      ),
    ].slice(0, 50);

    writeStorage(STORAGE_KEYS.readingHistory, history);
  }

  getBookProgressList(): BookProgress[] {
    return readStorage<BookProgress[]>(STORAGE_KEYS.bookProgress, []);
  }

  getBookProgress(bookId: string): BookProgress | null {
    return this.getBookProgressList().find((p) => p.bookId === bookId) ?? null;
  }

  updateBookProgress(
    bookId: string,
    unitId: string,
    lessonId: string,
    totalLessons: number,
    completed = false,
  ): BookProgress {
    const now = new Date().toISOString();
    const existing = this.getBookProgress(bookId);
    const completedLessons = new Set(existing?.completedLessons ?? []);

    if (completed) {
      completedLessons.add(`${unitId}:${lessonId}`);
    }

    const progressPercent = Math.round(
      (completedLessons.size / Math.max(totalLessons, 1)) * 100,
    );

    const updated: BookProgress = {
      bookId,
      completedLessons: [...completedLessons],
      lastLessonId: lessonId,
      lastUnitId: unitId,
      lastReadAt: now,
      progressPercent,
    };

    const list = this.getBookProgressList().filter((p) => p.bookId !== bookId);
    writeStorage(STORAGE_KEYS.bookProgress, [updated, ...list]);
    return updated;
  }

  markLessonComplete(
    bookId: string,
    unitId: string,
    lessonId: string,
    totalLessons: number,
  ): BookProgress {
    return this.updateBookProgress(
      bookId,
      unitId,
      lessonId,
      totalLessons,
      true,
    );
  }

  getLessonProgress(
    bookId: string,
    unitId: string,
    lessonId: string,
  ): LessonProgress | null {
    const bookProgress = this.getBookProgress(bookId);
    if (!bookProgress) return null;

    const key = `${unitId}:${lessonId}`;
    const completed = bookProgress.completedLessons.includes(key);

    return {
      bookId,
      unitId,
      lessonId,
      completed,
      progressPercent: completed ? 100 : 50,
      lastReadAt: bookProgress.lastReadAt,
    };
  }
}

export const studentDataService = new StudentDataService();
