"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, type ReactNode } from "react";
import type { ContentBlock } from "@/types/interactive-lesson-engine";
import { getLocalized } from "@/lib/interactive-lesson-engine";
import { isPlaceholderBlock } from "@/lib/interactive-lesson-engine/block-library";
import { FormulaAdapter } from "@/lib/interactive-lesson-engine/adapters/formula-adapter";

const DiagramAdapter = dynamic(
  () =>
    import("@/lib/interactive-lesson-engine/adapters/diagram-adapter").then((m) => m.DiagramAdapter),
  { ssr: false, loading: () => <div style={{ padding: 12, color: "#64748b" }}>Loading diagram…</div> },
);

const Scene3dAdapter = dynamic(
  () =>
    import("@/lib/interactive-lesson-engine/adapters/scene-3d-adapter").then((m) => m.Scene3dAdapter),
  { ssr: false, loading: () => <div style={{ padding: 12, color: "#64748b" }}>Loading 3D…</div> },
);

const PdfAdapter = dynamic(
  () => import("@/lib/interactive-lesson-engine/adapters/pdf-adapter").then((m) => m.PdfAdapter),
  { ssr: false, loading: () => <div style={{ padding: 12, color: "#64748b" }}>Loading PDF…</div> },
);

type Locale = "en" | "ar";

type BlockRendererProps = {
  block: ContentBlock;
  locale?: Locale;
  lazy?: boolean;
};

function MiniChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
      {values.map((v, i) => (
        <div key={labels[i] || i} style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              height: `${Math.round((v / max) * 100)}%`,
              minHeight: 4,
              background: "linear-gradient(180deg,#14b8a6,#0f766e)",
              borderRadius: 6,
            }}
            title={`${labels[i]}: ${v}`}
          />
          <div style={{ fontSize: 10, marginTop: 4, color: "#64748b" }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

export function BlockRenderer({
  block,
  locale = "ar",
  lazy = true,
}: BlockRendererProps): ReactNode {
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const placeholder = isPlaceholderBlock(block);

  const title = getLocalized(block.title, locale);
  const text = getLocalized(block.text, locale);
  const chart = useMemo(() => block.chart, [block.chart]);
  const mermaidSource =
    block.mermaidSource ||
    (typeof block.meta?.mermaid === "string" ? block.meta.mermaid : "") ||
    (block.type === "mermaid_diagram" ? text : "");

  return (
    <article
      data-block-type={block.type}
      data-placeholder={placeholder ? "true" : "false"}
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "0.85rem",
        background: placeholder ? "#f8fafc" : "#fff",
        marginBottom: 10,
      }}
    >
      {title ? <h4 style={{ margin: "0 0 0.5rem", fontSize: 15 }}>{title}</h4> : null}

      {block.type === "rich_text" || block.type === "notes" || block.type === "ai_explanation" ? (
        <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{text}</p>
      ) : null}

      {block.type === "formula" && block.formula ? (
        <FormulaAdapter
          formula={block.formula}
          stemDomain={block.stemDomain || "math"}
          fallbackText={text}
        />
      ) : null}

      {block.type === "image" ? (
        block.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.src}
            alt={getLocalized(block.alt, locale) || title}
            loading={lazy ? "lazy" : "eager"}
            style={{ maxWidth: "100%", borderRadius: 8 }}
          />
        ) : (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748b", fontSize: 13 }}>
            {text || (locale === "ar" ? "موضع صورة" : "Image placeholder")}
          </div>
        )
      ) : null}

      {block.type === "svg_diagram" && block.svgMarkup ? (
        <div
          dangerouslySetInnerHTML={{ __html: block.svgMarkup }}
          style={{ overflow: "auto" }}
          role="img"
          aria-label={title || "diagram"}
        />
      ) : null}

      {block.type === "mermaid_diagram" && mermaidSource ? (
        <DiagramAdapter source={mermaidSource} title={title} />
      ) : null}

      {block.type === "interactive_chart" && chart ? (
        <MiniChart labels={chart.labels} values={chart.values} />
      ) : null}

      {block.type === "audio" ? (
        block.mediaUrl ? (
          <audio controls preload="none" src={block.mediaUrl} style={{ width: "100%" }} />
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            {locale === "ar" ? "موضع صوت" : "Audio placeholder"}
          </p>
        )
      ) : null}

      {block.type === "embedded_media" ||
      block.type === "video_placeholder" ||
      block.type === "simulation_placeholder" ? (
        <div
          style={{
            aspectRatio: block.type === "video_placeholder" ? "16 / 9" : "auto",
            minHeight: 120,
            borderRadius: 10,
            background: "#0f172a",
            color: "#e2e8f0",
            display: "grid",
            placeItems: "center",
            padding: "1rem",
            textAlign: "center",
            fontSize: 13,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              {block.type.replace(/_/g, " ")}
              {block.placeholderStatus ? ` · ${block.placeholderStatus}` : ""}
            </div>
            <p style={{ margin: 0, opacity: 0.85 }}>{text}</p>
          </div>
        </div>
      ) : null}

      {block.type === "scene_3d" ? (
        <Scene3dAdapter
          title={title}
          description={text}
          variant={
            (block.meta?.variant as "molecule" | "orbit" | "lab" | "generic") || "molecule"
          }
        />
      ) : null}

      {block.type === "pdf_document" ? (
        block.src ? (
          <PdfAdapter src={block.src} title={title} page={Number(block.meta?.page || 1)} />
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: "#b45309" }}>
            {locale === "ar"
              ? "أضف مصدر PDF في src لعرض الصفحة."
              : "Set block.src to a PDF URL to render the page."}
          </p>
        )
      ) : null}

      {block.type === "downloadable_resource" ? (
        <div style={{ fontSize: 13 }}>
          <div>{text}</div>
          {block.downloadUrl ? (
            <a href={block.downloadUrl} style={{ color: "#0f766e" }}>
              {locale === "ar" ? "تنزيل" : "Download"}
            </a>
          ) : (
            <span style={{ color: "#94a3b8" }}>
              {locale === "ar" ? "الملف غير جاهز" : "File not ready"}
            </span>
          )}
          {block.protected ? (
            <span style={{ marginInlineStart: 8, color: "#b45309" }}>
              {locale === "ar" ? "محمي" : "protected"}
            </span>
          ) : null}
        </div>
      ) : null}

      {block.type === "quick_question" && block.question ? (
        <div>
          <p style={{ fontWeight: 600 }}>{getLocalized(block.question.prompt, locale)}</p>
          <div style={{ display: "grid", gap: 6 }}>
            {(block.question.options || []).map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelected(idx)}
                style={{
                  textAlign: "start",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "0.45rem 0.65rem",
                  background: selected === idx ? "#0f766e" : "#fff",
                  color: selected === idx ? "#fff" : "#0f172a",
                  cursor: "pointer",
                }}
              >
                {getLocalized(opt, locale)}
              </button>
            ))}
          </div>
          <button
            type="button"
            style={{
              marginTop: 8,
              border: "1px solid #0f766e",
              background: "#0f766e",
              color: "#fff",
              borderRadius: 8,
              padding: "0.35rem 0.7rem",
              cursor: "pointer",
            }}
            onClick={() => setRevealed(true)}
          >
            {locale === "ar" ? "تحقق" : "Check"}
          </button>
          {revealed ? (
            <p style={{ marginTop: 8, fontSize: 13, color: "#0f766e" }}>
              {selected === block.question.answerIndex
                ? locale === "ar"
                  ? "صحيح"
                  : "Correct"
                : locale === "ar"
                  ? "راجع الإجابة"
                  : "Review"}
              {block.question.explanation
                ? ` — ${getLocalized(block.question.explanation, locale)}`
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {block.type === "internal_nav" ? (
        <a href={block.href || "#"} style={{ color: "#0f766e", fontWeight: 600 }}>
          {text || title || (locale === "ar" ? "انتقال" : "Go")}
        </a>
      ) : null}

      {block.type === "external_reference" ? (
        <div style={{ fontSize: 13 }}>
          {block.href ? (
            <a
              href={block.href}
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: "#0f766e" }}
            >
              {text || title || block.href}
            </a>
          ) : (
            <span>{text}</span>
          )}
          {block.legalNote ? (
            <p style={{ margin: "0.35rem 0 0", color: "#94a3b8", fontSize: 11 }}>
              {getLocalized(block.legalNote, locale)}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
