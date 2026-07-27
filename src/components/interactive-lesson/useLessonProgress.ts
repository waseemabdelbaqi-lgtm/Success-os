"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  LessonLocale,
  LessonProgressState,
  LessonEnginePhase,
} from "@/src/lib/interactive-lesson/types";

const PREFIX = "success-os:interactive-lesson:";

function emptyProgress(lessonId: string, locale: LessonLocale): LessonProgressState {
  const now = new Date().toISOString();
  return {
    lessonId,
    sceneIndex: 0,
    phase: "ready",
    attemptByScene: {},
    answers: {},
    correctCount: 0,
    incorrectCount: 0,
    startedAt: now,
    updatedAt: now,
    masteryPercent: 0,
    locale,
  };
}

export function useLessonProgress(lessonId: string, storageKey: string) {
  const key = `${PREFIX}${storageKey}:${lessonId}`;
  const [progress, setProgress] = useState<LessonProgressState>(() => emptyProgress(lessonId, "ar"));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as LessonProgressState;
        if (parsed?.lessonId === lessonId) setProgress(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [key, lessonId]);

  const save = useCallback(
    (next: LessonProgressState) => {
      const stamped = { ...next, updatedAt: new Date().toISOString() };
      setProgress(stamped);
      try {
        localStorage.setItem(key, JSON.stringify(stamped));
      } catch {
        /* ignore quota */
      }
    },
    [key],
  );

  const reset = useCallback(() => {
    const fresh = emptyProgress(lessonId, progress.locale);
    save(fresh);
  }, [lessonId, progress.locale, save]);

  const patch = useCallback(
    (partial: Partial<LessonProgressState>) => {
      save({ ...progress, ...partial });
    },
    [progress, save],
  );

  const setPhase = useCallback(
    (phase: LessonEnginePhase) => patch({ phase }),
    [patch],
  );

  return { progress, hydrated, save, patch, setPhase, reset };
}
