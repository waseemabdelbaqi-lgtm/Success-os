"use client";

import { useCallback, useEffect, useState } from "react";

export type BookAnnotationState = {
  bookmarks: string[];
  highlights: Array<{ blockId: string; color: string; text: string }>;
  notes: Array<{ id: string; blockId?: string; lessonId: string; text: string; updatedAt: string }>;
  handwriting: Record<string, string>; // blockId -> dataURL
  progress: {
    lastLessonId: string | null;
    lastBlockId: string | null;
    completedLessonIds: string[];
    percent: number;
  };
  updatedAt: string;
};

const EMPTY: BookAnnotationState = {
  bookmarks: [],
  highlights: [],
  notes: [],
  handwriting: {},
  progress: {
    lastLessonId: null,
    lastBlockId: null,
    completedLessonIds: [],
    percent: 0,
  },
  updatedAt: new Date(0).toISOString(),
};

function key(bookId: string) {
  return `success-os:jordan-book:${bookId}`;
}

function read(bookId: string): BookAnnotationState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(key(bookId));
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) } as BookAnnotationState;
  } catch {
    return { ...EMPTY };
  }
}

function write(bookId: string, state: BookAnnotationState) {
  localStorage.setItem(key(bookId), JSON.stringify({ ...state, updatedAt: new Date().toISOString() }));
}

/**
 * Guest-safe local annotations. Login gate can wrap persist later;
 * preview works without auth; saving uses localStorage for pilot.
 */
export function useBookAnnotations(bookId: string, totalLessons: number) {
  const [state, setState] = useState<BookAnnotationState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read(bookId));
    setReady(true);
  }, [bookId]);

  const persist = useCallback(
    (updater: (prev: BookAnnotationState) => BookAnnotationState) => {
      setState((prev) => {
        const next = updater(prev);
        write(bookId, next);
        return next;
      });
    },
    [bookId],
  );

  const toggleBookmark = useCallback(
    (lessonId: string) => {
      persist((prev) => {
        const has = prev.bookmarks.includes(lessonId);
        return {
          ...prev,
          bookmarks: has ? prev.bookmarks.filter((id) => id !== lessonId) : [...prev.bookmarks, lessonId],
        };
      });
    },
    [persist],
  );

  const addHighlight = useCallback(
    (blockId: string, text: string, color = "#f2d77c") => {
      persist((prev) => ({
        ...prev,
        highlights: [...prev.highlights.filter((h) => h.blockId !== blockId), { blockId, color, text }],
      }));
    },
    [persist],
  );

  const removeHighlight = useCallback(
    (blockId: string) => {
      persist((prev) => ({
        ...prev,
        highlights: prev.highlights.filter((h) => h.blockId !== blockId),
      }));
    },
    [persist],
  );

  const upsertNote = useCallback(
    (lessonId: string, text: string, blockId?: string) => {
      persist((prev) => {
        const existing = prev.notes.find((n) => n.lessonId === lessonId && n.blockId === blockId);
        if (existing) {
          return {
            ...prev,
            notes: prev.notes.map((n) =>
              n.id === existing.id ? { ...n, text, updatedAt: new Date().toISOString() } : n,
            ),
          };
        }
        return {
          ...prev,
          notes: [
            ...prev.notes,
            {
              id: `note-${Date.now()}`,
              lessonId,
              blockId,
              text,
              updatedAt: new Date().toISOString(),
            },
          ],
        };
      });
    },
    [persist],
  );

  const saveHandwriting = useCallback(
    (blockId: string, dataUrl: string) => {
      persist((prev) => ({
        ...prev,
        handwriting: { ...prev.handwriting, [blockId]: dataUrl },
      }));
    },
    [persist],
  );

  const markProgress = useCallback(
    (lessonId: string, blockId: string | null, completed = false) => {
      persist((prev) => {
        const completedLessonIds = completed
          ? Array.from(new Set([...prev.progress.completedLessonIds, lessonId]))
          : prev.progress.completedLessonIds;
        const percent =
          totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0;
        return {
          ...prev,
          progress: {
            lastLessonId: lessonId,
            lastBlockId: blockId,
            completedLessonIds,
            percent,
          },
        };
      });
    },
    [persist, totalLessons],
  );

  return {
    ready,
    state,
    toggleBookmark,
    addHighlight,
    removeHighlight,
    upsertNote,
    saveHandwriting,
    markProgress,
  };
}
