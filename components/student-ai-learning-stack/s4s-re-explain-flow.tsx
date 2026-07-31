"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { ReExplainSequence } from "@/lib/student-ai-learning-stack/re-explain";

type Locale = "en" | "ar";

type S4sReExplainFlowProps = {
  sequence: ReExplainSequence;
  locale?: Locale;
  onClose: () => void;
  onUnderstood?: () => void;
  onStillConfused?: () => void;
  /** Jump ILE section when a step has a hint */
  onJumpSection?: (sectionId: string) => void;
};

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 90,
  padding: "1rem",
};

const panel: CSSProperties = {
  width: "min(520px, 100%)",
  background: "linear-gradient(165deg, #fff 0%, #f0fdfa 60%, #ecfeff 100%)",
  border: "1px solid #99f6e4",
  borderRadius: 16,
  padding: "1.25rem 1.35rem",
  boxShadow: "0 20px 44px rgba(15, 23, 42, 0.2)",
  color: "#0f172a",
};

/**
 * Walks: Student utterance → Teacher → Animation → Drawing → Example → Question → Check
 */
export function S4sReExplainFlow({
  sequence,
  locale = "en",
  onClose,
  onUnderstood,
  onStillConfused,
  onJumpSection,
}: S4sReExplainFlowProps): ReactNode {
  const [stepIndex, setStepIndex] = useState(0);
  const step = sequence.steps[stepIndex]!;
  const isLast = stepIndex >= sequence.steps.length - 1;
  const dir = locale === "ar" ? "rtl" : "ltr";

  const title = locale === "ar" ? step.title.ar : step.title.en;
  const body = locale === "ar" ? step.body.ar : step.body.en;
  const bodyLines = useMemo(() => body.split("\n"), [body]);

  const next = () => {
    if (step.ileSectionHint) onJumpSection?.(step.ileSectionHint);
    if (isLast) return;
    setStepIndex((i) => Math.min(i + 1, sequence.steps.length - 1));
  };

  const back = () => setStepIndex((i) => Math.max(0, i - 1));

  return (
    <div
      style={overlay}
      role="dialog"
      aria-modal="true"
      aria-label="S4S re-explain"
      data-s4s-re-explain="true"
      dir={dir}
    >
      <div style={panel}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "center",
          }}
        >
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
            {locale === "ar" ? "معلم Success 4 Sure الذكي" : "S4S Intelligence Teacher"}
          </p>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {stepIndex + 1} / {sequence.steps.length}
          </span>
        </div>

        {/* Path chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: "0.75rem",
          }}
        >
          {sequence.steps.map((s, i) => (
            <span
              key={s.id}
              style={{
                fontSize: 11,
                padding: "0.2rem 0.45rem",
                borderRadius: 999,
                border: "1px solid",
                borderColor: i === stepIndex ? "#0f766e" : "#e2e8f0",
                background: i === stepIndex ? "#ccfbf1" : i < stepIndex ? "#f0fdfa" : "#fff",
                color: i <= stepIndex ? "#0f766e" : "#94a3b8",
              }}
            >
              {locale === "ar" ? s.title.ar : s.title.en}
            </span>
          ))}
        </div>

        <h2 style={{ margin: "1rem 0 0.5rem", fontSize: 18 }}>{title}</h2>
        <div style={{ fontSize: 16, lineHeight: 1.55, color: "#334155" }}>
          {bodyLines.map((line) => (
            <p key={line} style={{ margin: "0 0 0.4rem" }}>
              {line}
            </p>
          ))}
        </div>

        {step.id === "animation" ? (
          <div
            aria-hidden
            style={{
              marginTop: "0.85rem",
              height: 88,
              borderRadius: 12,
              background:
                "linear-gradient(90deg, #ccfbf1 0%, #99f6e4 40%, #5eead4 70%, #ccfbf1 100%)",
              backgroundSize: "200% 100%",
              animation: "s4s-reexplain-pulse 2.2s ease-in-out infinite",
              border: "1px solid #5eead4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f766e",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {locale === "ar" ? "حركة توضيحية" : "Motion explanation"}
          </div>
        ) : null}

        {step.id === "drawing" ? (
          <p style={{ fontSize: 12, color: "#64748b", margin: "0.75rem 0 0" }}>
            {locale === "ar"
              ? "استخدم لوحة الرسم في مساحة عمل الطالب بجانب الدرس."
              : "Use the drawing canvas in the student workspace beside the lesson."}
          </p>
        ) : null}

        {step.kind === "check" ? (
          <div style={{ display: "flex", gap: 8, marginTop: "1.15rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                onUnderstood?.();
                onClose();
              }}
              style={btnPrimary}
            >
              {locale === "ar" ? "نعم، فهمت" : "Yes, I understand"}
            </button>
            <button
              type="button"
              onClick={() => {
                onStillConfused?.();
                setStepIndex(2); // restart from Animation
              }}
              style={btnSecondary}
            >
              {locale === "ar" ? "ما زلت محتارًا" : "Still confused"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, marginTop: "1.15rem", flexWrap: "wrap" }}>
            <button type="button" onClick={next} style={btnPrimary}>
              {locale === "ar" ? "التالي" : "Next"}
            </button>
            <button
              type="button"
              onClick={back}
              disabled={stepIndex === 0}
              style={{ ...btnSecondary, opacity: stepIndex === 0 ? 0.5 : 1 }}
            >
              {locale === "ar" ? "رجوع" : "Back"}
            </button>
            <button type="button" onClick={onClose} style={btnGhost}>
              {locale === "ar" ? "إغلاق" : "Close"}
            </button>
          </div>
        )}

        <style>{`
          @keyframes s4s-reexplain-pulse {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </div>
    </div>
  );
}

const btnPrimary: CSSProperties = {
  flex: "1 1 120px",
  background: "#0f766e",
  color: "#fff",
  border: 0,
  borderRadius: 10,
  padding: "0.6rem 0.85rem",
  fontWeight: 600,
  cursor: "pointer",
};

const btnSecondary: CSSProperties = {
  flex: "1 1 120px",
  background: "#fff",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "0.6rem 0.85rem",
  fontWeight: 600,
  cursor: "pointer",
};

const btnGhost: CSSProperties = {
  background: "transparent",
  color: "#64748b",
  border: 0,
  borderRadius: 10,
  padding: "0.6rem 0.85rem",
  cursor: "pointer",
};
