"use client";

/**
 * DiagramAdapter — Mermaid for timelines, flowcharts, sequence diagrams.
 * Replaceable: React Flow / Excalidraw for interactive graph editing later.
 */
import { useEffect, useId, useState, type ReactNode } from "react";

type DiagramAdapterProps = {
  source: string;
  title?: string;
};

export function DiagramAdapter({ source, title }: DiagramAdapterProps): ReactNode {
  const reactId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "neutral",
          fontFamily: "inherit",
        });
        const id = `ile_mmd_${reactId}_${Math.random().toString(36).slice(2, 7)}`;
        const { svg: rendered } = await mermaid.render(id, source);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(String((err as Error)?.message || err));
          setSvg(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, reactId]);

  if (error) {
    return (
      <pre
        data-adapter="mermaid-fallback"
        style={{
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          borderRadius: 10,
          padding: "0.75rem",
          fontSize: 12,
          overflow: "auto",
        }}
      >
        {title ? `${title}\n` : ""}
        {source}
        {"\n\n"}
        {error}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div style={{ padding: "1rem", color: "#64748b", fontSize: 13 }} aria-busy="true">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      data-adapter="mermaid"
      role="img"
      aria-label={title || "diagram"}
      style={{ overflow: "auto", background: "#fff", borderRadius: 10, padding: 8 }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export const DIAGRAM_ADAPTER_META = {
  id: "mermaid",
  replaceWith: ["react-flow", "excalidraw"],
  license: "MIT",
  monthlyCostUsd: 0,
};
