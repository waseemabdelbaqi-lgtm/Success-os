"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  InteractiveLessonDefinition,
  LessonLocale,
  SceneDefinition,
  VisualEvent,
} from "@/src/lib/interactive-lesson/types";
import { useLessonProgress } from "@/src/components/interactive-lesson/useLessonProgress";

function normalizeTypeAnswer(value: string) {
  return value.replace(/[^\d]/g, "").trim();
}

function isCorrect(scene: SceneDefinition, answer: unknown): boolean {
  if (scene.interactionType === "type") {
    return normalizeTypeAnswer(String(answer ?? "")) === normalizeTypeAnswer(String(scene.correctAnswer));
  }
  if (scene.interactionType === "arrange") {
    const expected = scene.correctAnswer as number[];
    const got = answer as number[];
    return Array.isArray(got) && expected.length === got.length && expected.every((v, i) => v === got[i]);
  }
  return Number(answer) === Number(scene.correctAnswer);
}

export function useLessonEngine(lesson: InteractiveLessonDefinition, storageKey: string) {
  const { progress, hydrated, patch, reset } = useLessonProgress(lesson.lessonId, storageKey);
  const [sceneElapsedMs, setSceneElapsedMs] = useState(0);
  const [activeEvents, setActiveEvents] = useState<VisualEvent[]>([]);
  const [muted, setMuted] = useState(false);
  const [slow, setSlow] = useState(false);
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [feedbackText, setFeedbackText] = useState("");
  const [clockOn, setClockOn] = useState(false);
  const [playbackId, setPlaybackId] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAtRef = useRef(0);
  const sceneRef = useRef<SceneDefinition | null>(null);
  const modeRef = useRef<"playing" | "reexplain">("playing");
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const locale: LessonLocale = progress.locale;
  const scene = lesson.scenes[Math.min(progress.sceneIndex, lesson.scenes.length - 1)];
  sceneRef.current = scene;

  const interactiveScenes = useMemo(
    () => lesson.scenes.filter((s) => s.completionRule === "interaction"),
    [lesson.scenes],
  );

  const masteryPercent = useMemo(() => {
    if (!interactiveScenes.length) return 100;
    return Math.round((progress.correctCount / interactiveScenes.length) * 100);
  }, [interactiveScenes.length, progress.correctCount]);

  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  }, []);

  const playAudioFor = useCallback(
    async (s: SceneDefinition) => {
      const src = s.audio?.[locale];
      if (!src || muted) return;
      if (!audioRef.current) audioRef.current = new Audio();
      const a = audioRef.current;
      a.src = src;
      a.playbackRate = slow ? 0.85 : 1;
      try {
        await a.play();
      } catch {
        /* wait for gesture */
      }
    },
    [locale, muted, slow],
  );

  const finishAutoScene = useCallback(() => {
    const p = progressRef.current;
    const s = lesson.scenes[p.sceneIndex];
    if (!s) return;
    if (s.completionRule === "interaction") {
      setClockOn(false);
      stopAudio();
      patch({ phase: "awaiting_interaction" });
      return;
    }
    if (s.completionRule === "continue" || s.sceneType === "result") {
      setClockOn(false);
      stopAudio();
      patch({
        phase: "completed",
        completedAt: new Date().toISOString(),
        masteryPercent: Math.round(
          (p.correctCount / Math.max(1, interactiveScenes.length)) * 100,
        ),
      });
      return;
    }
    const next = p.sceneIndex + 1;
    if (next >= lesson.scenes.length) {
      setClockOn(false);
      patch({ phase: "completed", completedAt: new Date().toISOString() });
      return;
    }
    patch({ sceneIndex: next, phase: "playing" });
  }, [interactiveScenes.length, lesson.scenes, patch, stopAudio]);

  // animation clock
  useEffect(() => {
    if (!clockOn) return;
    startedAtRef.current = performance.now();
    let raf = 0;
    const loop = () => {
      const s = sceneRef.current;
      if (!s) return;
      const ms = performance.now() - startedAtRef.current;
      setSceneElapsedMs(ms);
      const timeline =
        modeRef.current === "reexplain" && s.easierVisualTimeline
          ? s.easierVisualTimeline
          : s.visualTimeline;
      setActiveEvents(timeline.filter((e) => e.atMs <= ms));
      const duration =
        modeRef.current === "reexplain" && s.easierVisualTimeline
          ? Math.max(...s.easierVisualTimeline.map((e) => e.atMs), 1000) + 2200
          : s.durationMs;
      if (ms >= duration) {
        setClockOn(false);
        if (modeRef.current === "reexplain") {
          stopAudio();
          patch({ phase: "awaiting_interaction" });
          setFeedbackText("");
        } else {
          finishAutoScene();
        }
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [clockOn, playbackId, finishAutoScene, patch, stopAudio]);

  // start playback whenever phase becomes playing/reexplain
  useEffect(() => {
    if (!hydrated) return;
    if (progress.phase === "playing" || progress.phase === "reexplain") {
      modeRef.current = progress.phase === "reexplain" ? "reexplain" : "playing";
      setFeedbackText("");
      setActiveEvents([]);
      setSceneElapsedMs(0);
      setPlaybackId((n) => n + 1);
      setClockOn(true);
      void playAudioFor(scene);
    }
  }, [hydrated, playAudioFor, progress.phase, progress.sceneIndex, scene]);

  const start = useCallback(() => {
    patch({ phase: "playing", sceneIndex: progress.sceneIndex || 0 });
  }, [patch, progress.sceneIndex]);

  const pause = useCallback(() => {
    setClockOn(false);
    stopAudio();
    patch({ phase: "ready" });
  }, [patch, stopAudio]);

  const nextScene = useCallback(() => {
    const next = progress.sceneIndex + 1;
    if (next >= lesson.scenes.length) {
      patch({
        phase: "completed",
        completedAt: new Date().toISOString(),
        masteryPercent,
      });
      return;
    }
    setFeedbackText("");
    patch({ sceneIndex: next, phase: "playing" });
  }, [lesson.scenes.length, masteryPercent, patch, progress.sceneIndex]);

  const prevScene = useCallback(() => {
    const prev = Math.max(0, progress.sceneIndex - 1);
    setFeedbackText("");
    patch({ sceneIndex: prev, phase: "playing" });
  }, [patch, progress.sceneIndex]);

  const replay = useCallback(() => {
    setFeedbackText("");
    patch({ phase: "playing" });
    setPlaybackId((n) => n + 1);
    setClockOn(true);
    modeRef.current = "playing";
    void playAudioFor(scene);
  }, [patch, playAudioFor, scene]);

  const submitAnswer = useCallback(
    (answer: unknown) => {
      if (!scene || scene.completionRule !== "interaction") return;
      if (progress.phase !== "awaiting_interaction" && progress.phase !== "hint") return;

      const attempts = (progress.attemptByScene[scene.sceneId] || 0) + 1;
      const ok = isCorrect(scene, answer);
      const attemptByScene = { ...progress.attemptByScene, [scene.sceneId]: attempts };
      const answers = { ...progress.answers, [scene.sceneId]: answer };

      if (ok) {
        const prev = progress.answers[scene.sceneId];
        const prevOk = prev !== undefined && isCorrect(scene, prev);
        const correctCount = prevOk ? progress.correctCount : progress.correctCount + 1;
        setFeedbackText(scene.correctFeedback?.[locale] || "");
        patch({
          attemptByScene,
          answers,
          correctCount,
          phase: "feedback_correct",
          masteryPercent: Math.round((correctCount / Math.max(1, interactiveScenes.length)) * 100),
        });
        window.setTimeout(() => {
          const p = progressRef.current;
          const n = p.sceneIndex + 1;
          if (n >= lesson.scenes.length) {
            patch({ phase: "completed", completedAt: new Date().toISOString() });
          } else {
            setFeedbackText("");
            patch({ sceneIndex: n, phase: "playing" });
          }
        }, 1200);
        return;
      }

      const incorrectCount = progress.incorrectCount + 1;
      if (attempts === 1) {
        setFeedbackText(scene.firstHint?.[locale] || scene.incorrectFeedback?.[locale] || "");
        patch({ attemptByScene, answers, incorrectCount, phase: "hint" });
        return;
      }

      setFeedbackText(scene.secondExplanation?.[locale] || "");
      patch({ attemptByScene, answers, incorrectCount, phase: "reexplain" });
    },
    [interactiveScenes.length, lesson.scenes.length, locale, patch, progress, scene],
  );

  const dismissHint = useCallback(() => {
    setFeedbackText("");
    patch({ phase: "awaiting_interaction" });
  }, [patch]);

  const setLocale = useCallback(
    (next: LessonLocale) => {
      patch({ locale: next });
    },
    [patch],
  );

  return {
    lesson,
    scene,
    progress,
    hydrated,
    sceneElapsedMs,
    activeEvents,
    muted,
    setMuted,
    slow,
    setSlow,
    subtitlesOn,
    setSubtitlesOn,
    feedbackText,
    masteryPercent,
    locale,
    start,
    pause,
    resume: start,
    nextScene,
    prevScene,
    replay,
    submitAnswer,
    dismissHint,
    setLocale,
    reset,
  };
}
