"use client";

/**
 * ILE Component Library — reusable curriculum-agnostic UI primitives.
 */
import { useState, type CSSProperties, type ReactNode } from "react";
import { locText, type IleLocale } from "@/lib/interactive-lesson-engine/core/i18n";
import type { LocaleText } from "@/types/interactive-lesson-engine";

type Common = { locale?: IleLocale; title?: LocaleText | string; className?: string };

export function FormulaViewer({
  formula,
  locale = "en",
}: { formula: string; locale?: IleLocale }): ReactNode {
  // Display shell — KaTeX adapter used by BlockRenderer for live math.
  return (
    <div data-ile-component="formula-viewer" dir="ltr" style={box()}>
      <code style={{ fontSize: 16 }}>{formula}</code>
      <div style={{ fontSize: 11, color: "var(--ile-text-muted)", marginTop: 4 }}>
        {locale === "ar" ? "عارض المعادلات" : "Formula viewer"}
      </div>
    </div>
  );
}

export function DiagramViewer({
  children,
  title,
  locale = "en",
}: Common & { children?: ReactNode }): ReactNode {
  return (
    <figure data-ile-component="diagram-viewer" style={box()}>
      {title ? <figcaption style={cap()}>{locText(title as LocaleText, locale)}</figcaption> : null}
      <div>{children}</div>
    </figure>
  );
}

export function ImageViewer({
  src,
  alt,
  locale = "en",
}: {
  src?: string | null;
  alt?: LocaleText | string;
  locale?: IleLocale;
}): ReactNode {
  const a = typeof alt === "string" ? alt : locText(alt, locale);
  if (!src) {
    return (
      <div data-ile-component="image-viewer" style={{ ...box(), textAlign: "center", color: "#64748b" }}>
        {locale === "ar" ? "لا صورة" : "No image"}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img data-ile-component="image-viewer" src={src} alt={a} loading="lazy" style={{ maxWidth: "100%", borderRadius: 8 }} />
  );
}

export function InteractiveTable({
  headers,
  rows,
  locale = "en",
}: {
  headers: LocaleText[];
  rows: LocaleText[][];
  locale?: IleLocale;
}): ReactNode {
  return (
    <div data-ile-component="interactive-table" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={th()}>
                {locText(h, locale)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} style={td()}>
                  {locText(cell, locale)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Timeline({
  items,
  locale = "en",
}: {
  items: { id: string; title: LocaleText; body: LocaleText }[];
  locale?: IleLocale;
}): ReactNode {
  return (
    <ol data-ile-component="timeline" style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {items.map((item, i) => (
        <li key={item.id} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--ile-primary, #0f766e)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            {i + 1}
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{locText(item.title, locale)}</div>
            <div style={{ fontSize: 13, color: "#475569" }}>{locText(item.body, locale)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Accordion({
  items,
  locale = "en",
}: {
  items: { id: string; title: LocaleText; body: LocaleText }[];
  locale?: IleLocale;
}): ReactNode {
  return (
    <div data-ile-component="accordion">
      {items.map((item) => (
        <details key={item.id} style={{ ...box(), marginBottom: 8 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>{locText(item.title, locale)}</summary>
          <p style={{ margin: "0.5rem 0 0", fontSize: 13 }}>{locText(item.body, locale)}</p>
        </details>
      ))}
    </div>
  );
}

export function Tabs({
  items,
  locale = "en",
}: {
  items: { id: string; title: LocaleText; body: LocaleText }[];
  locale?: IleLocale;
}): ReactNode {
  const [active, setActive] = useState(items[0]?.id);
  const current = items.find((i) => i.id === active) || items[0];
  return (
    <div data-ile-component="tabs">
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item.id)}
            style={{
              border: "1px solid #cbd5e1",
              background: item.id === active ? "#0f766e" : "#fff",
              color: item.id === active ? "#fff" : "#0f172a",
              borderRadius: 8,
              padding: "0.3rem 0.55rem",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {locText(item.title, locale)}
          </button>
        ))}
      </div>
      {current ? <div style={box()}>{locText(current.body, locale)}</div> : null}
    </div>
  );
}

export function Callout({
  children,
  tone = "info",
  title,
  locale = "en",
}: Common & { children: ReactNode; tone?: "info" | "success" }): ReactNode {
  const bg = tone === "success" ? "#ecfdf5" : "#eff6ff";
  const border = tone === "success" ? "#99f6e4" : "#bfdbfe";
  return (
    <aside data-ile-component="callout" style={{ ...box(), background: bg, borderColor: border }}>
      {title ? <div style={{ fontWeight: 700, marginBottom: 4 }}>{locText(title as LocaleText, locale)}</div> : null}
      <div style={{ fontSize: 13 }}>{children}</div>
    </aside>
  );
}

export function WarningBlock({
  children,
  title,
  locale = "en",
}: Common & { children: ReactNode }): ReactNode {
  return (
    <aside
      data-ile-component="warning"
      role="alert"
      style={{ ...box(), background: "#fffbeb", borderColor: "#fcd34d" }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>
        {title ? locText(title as LocaleText, locale) : locale === "ar" ? "تحذير" : "Warning"}
      </div>
      <div style={{ fontSize: 13 }}>{children}</div>
    </aside>
  );
}

export function DefinitionBlock({
  term,
  meaning,
  title,
  children,
  locale = "en",
}: {
  term?: LocaleText | string;
  meaning?: LocaleText | string;
  title?: LocaleText | string;
  children?: ReactNode;
  locale?: IleLocale;
}): ReactNode {
  const termText = locText((term || title) as LocaleText, locale);
  const meaningNode = children ?? locText(meaning as LocaleText, locale);
  return (
    <dl data-ile-component="definition" style={box()}>
      {termText ? <dt style={{ fontWeight: 700 }}>{termText}</dt> : null}
      <dd style={{ margin: "0.35rem 0 0", fontSize: 13 }}>{meaningNode}</dd>
    </dl>
  );
}

export function ExampleBlock({
  title,
  body,
  children,
  locale = "en",
}: {
  title?: LocaleText | string;
  body?: LocaleText | string;
  children?: ReactNode;
  locale?: IleLocale;
}): ReactNode {
  return (
    <div data-ile-component="example" style={{ ...box(), borderStyle: "dashed" }}>
      <div style={{ fontSize: 11, color: "#0f766e", fontWeight: 700, marginBottom: 4 }}>
        {title ? locText(title as LocaleText, locale) : locale === "ar" ? "مثال" : "Example"}
      </div>
      <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
        {children ?? locText(body as LocaleText, locale)}
      </div>
    </div>
  );
}

export function PracticeBlock({ children }: { children: ReactNode }): ReactNode {
  return (
    <div data-ile-component="practice" style={{ ...box(), background: "#f0fdfa" }}>
      {children}
    </div>
  );
}

export function MediaBlock({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}): ReactNode {
  return (
    <div data-ile-component="media" style={box()}>
      {label ? <div style={cap()}>{label}</div> : null}
      {children}
    </div>
  );
}

function box(): CSSProperties {
  return {
    border: "1px solid var(--ile-border, #e2e8f0)",
    borderRadius: "var(--ile-radius-md, 10px)",
    padding: "0.75rem",
    background: "var(--ile-surface, #fff)",
  };
}
function cap(): CSSProperties {
  return { fontSize: 12, color: "#64748b", marginBottom: 6 };
}
function th(): CSSProperties {
  return {
    textAlign: "start",
    padding: "0.45rem",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
  };
}
function td(): CSSProperties {
  return { padding: "0.45rem", borderBottom: "1px solid #f1f5f9" };
}
