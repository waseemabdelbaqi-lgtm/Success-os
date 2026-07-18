"use client";

import { useCallback, useEffect, useState } from "react";
import { studentDataService } from "@/services/student/student-data.service";
import type {
  BookProgress,
  LessonBookmark,
  LessonNote,
  ReadingHistoryEntry,
  SavedBook,
  StudentProfile,
  TextHighlight,
} from "@/types/student-portal";

export function useStudentData() {
  const [bookmarks, setBookmarks] = useState<LessonBookmark[]>([]);
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [history, setHistory] = useState<ReadingHistoryEntry[]>([]);
  const [bookProgress, setBookProgress] = useState<BookProgress[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setBookmarks(studentDataService.getBookmarks());
    setNotes(studentDataService.getNotes());
    setHighlights(studentDataService.getHighlights());
    setSavedBooks(studentDataService.getSavedBooks());
    setHistory(studentDataService.getReadingHistory());
    setBookProgress(studentDataService.getBookProgressList());
    setProfile(studentDataService.getProfile());
    setHydrated(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    hydrated,
    bookmarks,
    notes,
    highlights,
    savedBooks,
    history,
    bookProgress,
    profile,
    refresh,
    addBookmark: (...args: Parameters<typeof studentDataService.addBookmark>) => {
      const result = studentDataService.addBookmark(...args);
      refresh();
      return result;
    },
    removeBookmark: (id: string) => {
      studentDataService.removeBookmark(id);
      refresh();
    },
    addNote: (...args: Parameters<typeof studentDataService.addNote>) => {
      const result = studentDataService.addNote(...args);
      refresh();
      return result;
    },
    updateNote: (id: string, content: string) => {
      studentDataService.updateNote(id, content);
      refresh();
    },
    deleteNote: (id: string) => {
      studentDataService.deleteNote(id);
      refresh();
    },
    addHighlight: (
      ...args: Parameters<typeof studentDataService.addHighlight>
    ) => {
      const result = studentDataService.addHighlight(...args);
      refresh();
      return result;
    },
    toggleSavedBook: (bookId: string) => {
      const result = studentDataService.toggleSavedBook(bookId);
      refresh();
      return result;
    },
    isBookSaved: (bookId: string) =>
      studentDataService.isBookSaved(bookId),
    isBookmarked: (bookId: string, unitId: string, lessonId: string) =>
      studentDataService.isBookmarked(bookId, unitId, lessonId),
    addHistory: (
      ...args: Parameters<typeof studentDataService.addReadingHistory>
    ) => {
      studentDataService.addReadingHistory(...args);
      refresh();
    },
    updateProgress: (
      ...args: Parameters<typeof studentDataService.updateBookProgress>
    ) => {
      const result = studentDataService.updateBookProgress(...args);
      refresh();
      return result;
    },
    markComplete: (
      ...args: Parameters<typeof studentDataService.markLessonComplete>
    ) => {
      const result = studentDataService.markLessonComplete(...args);
      refresh();
      return result;
    },
    saveProfile: (next: StudentProfile) => {
      studentDataService.saveProfile(next);
      refresh();
    },
    getBookProgress: (bookId: string) =>
      studentDataService.getBookProgress(bookId),
  };
}
