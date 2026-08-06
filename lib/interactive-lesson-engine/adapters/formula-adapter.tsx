"use client";

/**
 * FormulaAdapter — KaTeX display for math / chemistry / physics formulas.
 * Replaceable: swap implementation for MathLive (editable) or MathJax without changing callers.
 */
import { useMemo, type ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

type FormulaAdapterProps = {
  formula: string;
  displayMode?: boolean;
  stemDomain?: "math" | "chemistry" | "physics" | "biology" | "general";
  fallbackText?: string;
};

export function FormulaAdapter({
  formula,
  displayMode = true,
  stemDomain = "math",
  fallbackText,
}: FormulaAdapterProps): ReactNode {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode,
        strict: "ignore",
        trust: false,
      });
    } catch {
      return null;
    }
  }, [formula, displayMode]);

  if (!html) {
    return (
      <div
        dir="ltr"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          background: "#0f172a",
          color: "#e2e8f0",
          borderRadius: 10,
          padding: "0.85rem 1rem",
          overflowX: "auto",
        }}
        aria-label="formula-fallback"
      >
        {fallbackText || formula}
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      data-adapter="katex"
      data-stem-domain={stemDomain}
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "0.85rem 1rem",
        overflowX: "auto",
      }}
      aria-label={`${stemDomain} formula`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export const FORMULA_ADAPTER_META = {
  id: "katex",
  replaceWith: ["mathlive", "mathjax"],
  license: "MIT",
  monthlyCostUsd: 0,
};
