"use client";

import { useEffect, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import type { S4sTeacherGreeting } from "@/lib/student-ai-learning-stack/s4s-intelligence-teacher";

type Locale = "en" | "ar";

type S4sIntelligenceTeacherProps = {
  locale?: Locale;
  studentName?: string;
  /** Stable key so greeting shows once per lesson open in the session */
  lessonKey: string;
  onReviewFirst?: () => void;
  onContinue?: () => void;
};

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 80,
  padding: "1rem",
};

const panel: CSSProperties = {
  width: "min(440px, 100%)",
  background: "linear-gradient(165deg, #f8fafc 0%, #ecfdf5 55%, #f0fdfa 100%)",
  border: "1px solid #99f6e4",
  borderRadius: 16,
  padding: "1.35rem 1.4rem 1.2rem",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
  color: "#0f172a",
};

function storageKey(lessonKey: string) {
  return `s4s-teacher-dismissed:${lessonKey}`;
}

/**
 * Appears when a student opens a lesson.
 * Student → Open Lesson → S4S Intelligence Teacher appears
 */
export function S4sIntelligenceTeacher({
  locale = "en",
  studentName = "Ahmad",
  lessonKey,
  onReviewFirst,
  onContinue,
}: S4sIntelligenceTeacherProps): ReactNode {
  const [greeting, setGreeting] = useState<S4sTeacherGreeting | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(storageKey(lessonKey))) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      try {
        const qs = new URLSearchParams({
          action: "greeting",
          studentName,
          locale,
        });
        const res = await fetch(`/api/student-ai-learning-stack?${qs.toString()}`);
        const data = await res.json();
        if (data.ok && data.greeting) {
          setGreeting(data.greeting as S4sTeacherGreeting);
          setOpen(true);
        }
      } catch {
        // Fail closed — lesson still opens without teacher overlay
        setOpen(false);
      }
    });
  }, [lessonKey, studentName, locale]);

  const dismiss = (reviewed: boolean) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(storageKey(lessonKey), reviewed ? "review" : "continue");
    }
    setOpen(false);
    if (reviewed) onReviewFirst?.();
    else onContinue?.();
  };

  if (!open || !greeting) return null;

  const dir = locale === "ar" ? "rtl" : "ltr";
  const lines =
    locale === "ar"
      ? greeting.displayAr.split("\n")
      : greeting.displayEn.split("\n");

  return (
    <div
      style={overlay}
      role="dialog"
      aria-modal="true"
      aria-label={locale === "ar" ? greeting.teacherName.ar : greeting.teacherName.en}
      data-s4s-intelligence-teacher="true"
      dir={dir}
    >
      <div style={panel}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#0f766e",
            fontWeight: 700,
          }}
        >
          {locale === "ar" ? greeting.teacherName.ar : greeting.teacherName.en}
        </p>
        <div style={{ marginTop: "0.85rem", fontSize: 17, lineHeight: 1.55 }}>
          <p style={{ margin: "0 0 0.65rem", fontWeight: 650 }}>{lines[0]}</p>
          <p style={{ margin: "0 0 0.65rem", color: "#334155" }}>{lines[1]}</p>
          <p style={{ margin: 0, color: "#0f766e", fontWeight: 600 }}>{lines[2]}</p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            disabled={pending}
            onClick={() => dismiss(true)}
            style={{
              flex: "1 1 140px",
              background: "#0f766e",
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "0.65rem 0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {locale === "ar" ? "نعم، راجع الكسور" : "Yes, review Fractions"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => dismiss(false)}
            style={{
              flex: "1 1 140px",
              background: "#fff",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: "0.65rem 0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {locale === "ar" ? greeting.ctaContinue.ar : greeting.ctaContinue.en}
          </button>
        </div>
      </div>
    </div>
  );
}
