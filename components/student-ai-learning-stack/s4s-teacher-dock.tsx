"use client";

import { useState, useTransition, type CSSProperties, type ReactNode } from "react";
import {
  buildReExplainSequence,
  type ReExplainSequence,
} from "@/lib/student-ai-learning-stack/re-explain";
import { S4sReExplainFlow } from "./s4s-re-explain-flow";

type Locale = "en" | "ar";

type S4sTeacherDockProps = {
  locale?: Locale;
  topicEn?: string;
  topicAr?: string;
  onJumpSection?: (sectionId: string) => void;
};

const dock: CSSProperties = {
  position: "fixed",
  bottom: 18,
  insetInlineEnd: 18,
  zIndex: 70,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "flex-end",
};

/**
 * Persistent teacher entry on an open lesson.
 * Student can say "I don't understand this" → re-explain sequence.
 */
export function S4sTeacherDock({
  locale = "en",
  topicEn = "Fractions",
  topicAr = "الكسور",
  onJumpSection,
}: S4sTeacherDockProps): ReactNode {
  const [sequence, setSequence] = useState<ReExplainSequence | null>(null);
  const [pending, startTransition] = useTransition();

  const startReExplain = () => {
    startTransition(async () => {
      try {
        const qs = new URLSearchParams({
          action: "re-explain",
          topicEn,
          topicAr,
          utterance: "I don't understand this.",
        });
        const res = await fetch(`/api/student-ai-learning-stack?${qs.toString()}`);
        const data = await res.json();
        if (data.ok && data.sequence) {
          setSequence(data.sequence as ReExplainSequence);
          return;
        }
      } catch {
        // fall through to local builder
      }
      setSequence(
        buildReExplainSequence({
          topicEn,
          topicAr,
          studentUtterance: "I don't understand this.",
        }),
      );
    });
  };

  return (
    <>
      <div style={dock} data-s4s-teacher-dock="true">
        <button
          type="button"
          disabled={pending}
          onClick={() => startReExplain()}
          style={{
            background: "#0f766e",
            color: "#fff",
            border: 0,
            borderRadius: 999,
            padding: "0.7rem 1.05rem",
            fontWeight: 650,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(15, 118, 110, 0.35)",
          }}
        >
          {locale === "ar" ? "لا أفهم هذا" : "I don't understand this"}
        </button>
      </div>

      {sequence ? (
        <S4sReExplainFlow
          sequence={sequence}
          locale={locale}
          onClose={() => setSequence(null)}
          onJumpSection={onJumpSection}
        />
      ) : null}
    </>
  );
}
