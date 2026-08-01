"use client";

import type { ReactNode } from "react";
import type { LessonFilters } from "@/types/interactive-lesson-engine";

type Locale = "en" | "ar";

type FiltersBarProps = {
  filters: LessonFilters;
  onChange: (next: LessonFilters) => void;
  locale?: Locale;
  options?: {
    countries?: string[];
    curricula?: string[];
    grades?: string[];
    subjects?: string[];
    languages?: string[];
    difficulties?: string[];
  };
};

const FIELDS: { key: keyof LessonFilters; en: string; ar: string }[] = [
  { key: "country", en: "Country", ar: "الدولة" },
  { key: "curriculum", en: "Curriculum", ar: "المنهج" },
  { key: "qualification", en: "Qualification", ar: "المؤهل" },
  { key: "grade", en: "Grade", ar: "الصف" },
  { key: "subject", en: "Subject", ar: "المادة" },
  { key: "unit", en: "Unit", ar: "الوحدة" },
  { key: "lesson", en: "Lesson", ar: "الدرس" },
  { key: "language", en: "Language", ar: "اللغة" },
  { key: "difficulty", en: "Difficulty", ar: "الصعوبة" },
];

export function FiltersBar({
  filters,
  onChange,
  locale = "ar",
  options = {},
}: FiltersBarProps): ReactNode {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 8,
        marginBottom: 12,
      }}
    >
      {FIELDS.map((f) => {
        const list =
          f.key === "country"
            ? options.countries
            : f.key === "curriculum"
              ? options.curricula
              : f.key === "grade"
                ? options.grades
                : f.key === "subject"
                  ? options.subjects
                  : f.key === "language"
                    ? options.languages
                    : f.key === "difficulty"
                      ? options.difficulties
                      : undefined;
        return (
          <label key={f.key} style={{ fontSize: 11, color: "#64748b" }}>
            {locale === "ar" ? f.ar : f.en}
            {list?.length ? (
              <select
                value={String(filters[f.key] || "")}
                onChange={(e) =>
                  onChange({ ...filters, [f.key]: e.target.value || undefined })
                }
                style={inputStyle()}
              >
                <option value="">—</option>
                {list.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={String(filters[f.key] || "")}
                onChange={(e) =>
                  onChange({ ...filters, [f.key]: e.target.value || undefined })
                }
                style={inputStyle()}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    marginTop: 4,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "0.35rem 0.5rem",
    fontSize: 12,
    color: "#0f172a",
  };
}
