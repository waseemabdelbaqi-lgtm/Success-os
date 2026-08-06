"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { InteractiveSlide } from "@/types/interactive-lesson-engine";
import { getLocalized } from "@/lib/interactive-lesson-engine";
import { BlockRenderer } from "./block-renderer";

type Locale = "en" | "ar";

type SlideEngineProps = {
  slides: InteractiveSlide[];
  locale?: Locale;
  presentation?: boolean;
  virtualize?: boolean;
  onSlideChange?: (index: number) => void;
};

/**
 * Interactive Slide System — modular blocks per slide.
 * Virtualizes to a window of nearby slides for large lessons.
 */
export function SlideEngine({
  slides,
  locale = "ar",
  presentation = false,
  virtualize = true,
  onSlideChange,
}: SlideEngineProps): ReactNode {
  const [index, setIndex] = useState(0);
  const sorted = useMemo(
    () => [...slides].sort((a, b) => a.order - b.order),
    [slides],
  );
  const current = sorted[index] || sorted[0];

  useEffect(() => {
    setIndex(0);
  }, [slides]);

  useEffect(() => {
    onSlideChange?.(index);
  }, [index, onSlideChange]);

  useEffect(() => {
    if (!presentation) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        setIndex((i) => Math.min(sorted.length - 1, i + 1));
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === "Home") setIndex(0);
      if (e.key === "End") setIndex(Math.max(0, sorted.length - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presentation, sorted.length]);

  const windowSlides = useMemo(() => {
    if (!virtualize || sorted.length <= 8) return sorted.map((s, i) => ({ s, i }));
    const start = Math.max(0, index - 1);
    const end = Math.min(sorted.length, index + 2);
    return sorted.slice(start, end).map((s, offset) => ({ s, i: start + offset }));
  }, [sorted, index, virtualize]);

  if (!sorted.length || !current) {
    return (
      <p style={{ color: "#64748b" }}>
        {locale === "ar" ? "لا شرائح بعد" : "No slides yet"}
      </p>
    );
  }

  return (
    <div data-slide-engine="true">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, color: "#64748b" }}>
          {locale === "ar" ? "شريحة" : "Slide"} {index + 1} / {sorted.length}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            disabled={index <= 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            style={navBtn()}
          >
            {locale === "ar" ? "السابق" : "Prev"}
          </button>
          <button
            type="button"
            disabled={index >= sorted.length - 1}
            onClick={() => setIndex((i) => Math.min(sorted.length - 1, i + 1))}
            style={navBtn(true)}
          >
            {locale === "ar" ? "التالي" : "Next"}
          </button>
        </div>
      </div>

      <div
        style={{
          borderRadius: 14,
          background: presentation
            ? "linear-gradient(145deg,#042f2e,#0f766e)"
            : "linear-gradient(145deg,#ecfdf5,#f0f9ff)",
          color: presentation ? "#ecfdf5" : "#0f172a",
          padding: presentation ? "1.5rem" : "1rem",
          minHeight: presentation ? 280 : 200,
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: presentation ? 26 : 18 }}>
          {getLocalized(current.title, locale)}
        </h3>
        {(virtualize ? windowSlides.filter((x) => x.i === index) : [{ s: current, i: index }]).map(
          ({ s }) =>
            s ? (
              <div key={s.id}>
                {s.blocks.map((block) => (
                  <div key={block.id} style={{ color: presentation ? "#0f172a" : undefined }}>
                    <BlockRenderer block={block} locale={locale} lazy={!presentation} />
                  </div>
                ))}
              </div>
            ) : null,
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 10,
          overflowX: "auto",
          paddingBottom: 4,
        }}
        role="tablist"
        aria-label="slides"
      >
        {sorted.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => setIndex(i)}
            style={{
              ...navBtn(i === index),
              whiteSpace: "nowrap",
              fontSize: 11,
            }}
          >
            {i + 1}. {getLocalized(s.title, locale).slice(0, 18)}
          </button>
        ))}
      </div>
    </div>
  );
}

function navBtn(active = false): React.CSSProperties {
  return {
    border: "1px solid #cbd5e1",
    background: active ? "#0f766e" : "#fff",
    color: active ? "#fff" : "#0f172a",
    borderRadius: 8,
    padding: "0.35rem 0.65rem",
    cursor: "pointer",
    fontSize: 13,
  };
}
