"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type {
  InteractiveLessonPackage,
  LearningMode,
  LessonOutlineNode,
  LessonSectionId,
} from "@/types/interactive-lesson-engine";
import {
  LESSON_SECTION_LABELS,
  LEARNING_MODE_LABELS,
} from "@/types/interactive-lesson-engine";
import { getLocalized } from "@/lib/interactive-lesson-engine";

type Locale = "en" | "ar";

type LessonNavigationProps = {
  pkg: InteractiveLessonPackage;
  locale?: Locale;
  mode: LearningMode;
  onModeChange: (mode: LearningMode) => void;
  sectionId: LessonSectionId;
  onSectionChange: (id: LessonSectionId) => void;
  sections: LessonSectionId[];
  outlines: {
    lesson: LessonOutlineNode;
    unit?: LessonOutlineNode;
    book?: LessonOutlineNode;
  };
  progressPercent: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
};

export function LessonNavigation({
  pkg,
  locale = "ar",
  mode,
  onModeChange,
  sectionId,
  onSectionChange,
  sections,
  outlines,
  progressPercent,
  searchQuery,
  onSearchChange,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: LessonNavigationProps): ReactNode {
  return (
    <div
      data-ile-nav="true"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(255,255,255,0.96)",
        borderBottom: "1px solid #e2e8f0",
        backdropFilter: "blur(8px)",
        padding: "0.65rem 0.75rem",
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
        {outlines.book ? (
          <>
            <Link href={outlines.book.href || "#"} style={{ color: "#0f766e" }}>
              {getLocalized(outlines.book.title, locale)}
            </Link>
            {" / "}
          </>
        ) : null}
        {outlines.unit ? (
          <>
            <span>{getLocalized(outlines.unit.title, locale)}</span>
            {" / "}
          </>
        ) : null}
        <strong style={{ color: "#0f172a" }}>{getLocalized(pkg.title, locale)}</strong>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" disabled={!canPrev} onClick={onPrev} style={btn()}>
            {locale === "ar" ? "السابق" : "Previous"}
          </button>
          <button type="button" disabled={!canNext} onClick={onNext} style={btn(true)}>
            {locale === "ar" ? "التالي" : "Next"}
          </button>
        </div>

        <div style={{ flex: 1, minWidth: 160, maxWidth: 280 }}>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={locale === "ar" ? "بحث في الدرس…" : "Search lesson…"}
            aria-label="search"
            style={{
              width: "100%",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "0.4rem 0.65rem",
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ minWidth: 120 }}>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: "#e2e8f0",
              overflow: "hidden",
            }}
            aria-label="progress"
          >
            <div
              style={{
                width: `${Math.min(100, progressPercent)}%`,
                height: "100%",
                background: "linear-gradient(90deg,#14b8a6,#0f766e)",
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            {progressPercent}%
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {(Object.keys(LEARNING_MODE_LABELS) as LearningMode[]).map((m) => (
          <button key={m} type="button" onClick={() => onModeChange(m)} style={btn(mode === m)}>
            {getLocalized(LEARNING_MODE_LABELS[m], locale)}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          marginTop: 8,
          paddingBottom: 2,
        }}
        role="navigation"
        aria-label="lesson outline"
      >
        {sections.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onSectionChange(id)}
            style={btn(sectionId === id)}
          >
            {getLocalized(LESSON_SECTION_LABELS[id], locale)}
          </button>
        ))}
      </div>

      {(outlines.unit || outlines.book) && (
        <details style={{ marginTop: 8, fontSize: 12 }}>
          <summary style={{ cursor: "pointer", color: "#0f766e" }}>
            {locale === "ar" ? "مخطط الوحدة / الكتاب" : "Unit / Book outline"}
          </summary>
          {outlines.unit?.children?.map((l) => (
            <div key={l.id} style={{ padding: "0.2rem 0" }}>
              {l.href ? (
                <Link href={l.href} style={{ color: "#334155" }}>
                  {getLocalized(l.title, locale)}
                </Link>
              ) : (
                getLocalized(l.title, locale)
              )}
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

function btn(active = false): React.CSSProperties {
  return {
    border: "1px solid #cbd5e1",
    background: active ? "#0f766e" : "#fff",
    color: active ? "#fff" : "#0f172a",
    borderRadius: 8,
    padding: "0.3rem 0.55rem",
    cursor: "pointer",
    fontSize: 12,
    whiteSpace: "nowrap",
  };
}
