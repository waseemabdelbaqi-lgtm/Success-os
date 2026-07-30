"use client";

import { useMemo, useState, type DragEvent, type ReactNode } from "react";
import type {
  ContentBlockType,
  InteractiveLessonPackage,
  InteractiveSlide,
  LessonSectionId,
  LocaleText,
} from "@/types/interactive-lesson-engine";
import {
  CONTENT_BLOCK_TYPES,
  LESSON_SECTION_ORDER,
  LESSON_SECTION_LABELS,
} from "@/types/interactive-lesson-engine";
import { createBlock, listBlockLibrary } from "@/lib/interactive-lesson-engine/block-library";
import { getLocalized } from "@/lib/interactive-lesson-engine";
import {
  bumpPackageVersion,
  listVersionHistory,
  setPublishState,
} from "@/lib/interactive-lesson-engine/core/versioning";
import { InteractiveLessonViewer } from "./interactive-lesson-viewer";

type AdminLessonEditorProps = {
  initial: InteractiveLessonPackage;
};

type BuilderTab = "blocks" | "slides" | "structure" | "versions";

/**
 * Admin Lesson Builder — create/reorder blocks & hierarchy, preview, version, publish.
 * Curriculum-agnostic: no country import, no AI generation.
 */
export function AdminLessonEditor({ initial }: AdminLessonEditorProps): ReactNode {
  const [draft, setDraft] = useState<InteractiveLessonPackage>(initial);
  const [sectionId, setSectionId] = useState<LessonSectionId>("overview");
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<BuilderTab>("blocks");
  const [dragId, setDragId] = useState<string | null>(null);
  const library = useMemo(() => listBlockLibrary(), []);
  const history = useMemo(() => listVersionHistory(draft), [draft]);

  function apply(next: InteractiveLessonPackage, noticeText?: string) {
    setDraft(next);
    if (noticeText) setNotice(noticeText);
  }

  function bump(note: string) {
    apply(bumpPackageVersion(draft, note, "admin"), note);
  }

  function addBlock(type: ContentBlockType) {
    const block = createBlock(type, {
      title: { en: type, ar: type },
      text: {
        en: `New ${type} block`,
        ar: `كتلة ${type} جديدة`,
      },
      table:
        type === "table"
          ? {
              headers: [
                { en: "A", ar: "أ" },
                { en: "B", ar: "ب" },
              ],
              rows: [
                [
                  { en: "1", ar: "١" },
                  { en: "2", ar: "٢" },
                ],
              ],
            }
          : undefined,
      code:
        type === "code"
          ? { language: "javascript", source: "console.log('Success OS');\n" }
          : undefined,
      items:
        type === "timeline" || type === "accordion" || type === "tabs"
          ? [
              {
                id: "item_1",
                title: { en: "Item 1", ar: "عنصر 1" },
                body: { en: "Details", ar: "تفاصيل" },
              },
            ]
          : undefined,
      placeholderStatus:
        type.includes("placeholder") || type === "video_placeholder"
          ? "planned"
          : undefined,
    });
    const next = bumpPackageVersion(
      {
        ...draft,
        sections: {
          ...draft.sections,
          [sectionId]: [...(draft.sections[sectionId] || []), block],
        },
      },
      `Added block ${type} to ${sectionId}`,
      "admin",
    );
    apply(next, `Added ${type}`);
  }

  function removeBlock(blockId: string) {
    apply(
      bumpPackageVersion(
        {
          ...draft,
          sections: {
            ...draft.sections,
            [sectionId]: (draft.sections[sectionId] || []).filter((b) => b.id !== blockId),
          },
        },
        `Removed block ${blockId}`,
        "admin",
      ),
    );
  }

  function moveBlock(blockId: string, dir: -1 | 1) {
    const list = [...(draft.sections[sectionId] || [])];
    const idx = list.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= list.length) return;
    const tmp = list[idx]!;
    list[idx] = list[next]!;
    list[next] = tmp;
    apply(
      bumpPackageVersion(
        { ...draft, sections: { ...draft.sections, [sectionId]: list } },
        `Reordered blocks in ${sectionId}`,
        "admin",
      ),
    );
  }

  function onDropReorder(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const list = [...(draft.sections[sectionId] || [])];
    const from = list.findIndex((b) => b.id === dragId);
    const to = list.findIndex((b) => b.id === targetId);
    if (from < 0 || to < 0) {
      setDragId(null);
      return;
    }
    const [item] = list.splice(from, 1);
    if (!item) {
      setDragId(null);
      return;
    }
    list.splice(to, 0, item);
    apply(
      bumpPackageVersion(
        { ...draft, sections: { ...draft.sections, [sectionId]: list } },
        `Drag-reorder in ${sectionId}`,
        "admin",
      ),
      "Reordered via drag & drop",
    );
    setDragId(null);
  }

  function setStatus(status: InteractiveLessonPackage["status"]) {
    apply(setPublishState(draft, status, "admin"), `Status: ${status}`);
  }

  function createSlide() {
    const order = (draft.slides?.length || 0) + 1;
    const slide: InteractiveSlide = {
      id: `slide_${Date.now()}`,
      order,
      title: { en: `Slide ${order}`, ar: `شريحة ${order}` },
      kind: "concept",
      blocks: [
        createBlock("rich_text", {
          text: { en: "New slide content", ar: "محتوى شريحة جديدة" },
        }),
      ],
    };
    apply(
      bumpPackageVersion(
        { ...draft, slides: [...(draft.slides || []), slide] },
        `Created slide ${slide.id}`,
        "admin",
      ),
      `Slide ${order} created`,
    );
  }

  function createEmptyLessonShell(kind: "book" | "unit" | "lesson") {
    const at = new Date().toISOString();
    const title: LocaleText =
      kind === "book"
        ? { en: "New Book Shell", ar: "هيكل كتاب جديد" }
        : kind === "unit"
          ? { en: "New Unit Shell", ar: "هيكل وحدة جديدة" }
          : { en: "New Lesson", ar: "درس جديد" };
    const id = `${kind}_${Date.now()}`;
    apply(
      bumpPackageVersion(
        {
          ...draft,
          id: kind === "lesson" ? id : draft.id,
          title: kind === "lesson" ? title : draft.title,
          source: {
            ...draft.source,
            kind: "admin",
            ...(kind === "book" ? { bookId: id } : {}),
            ...(kind === "unit" ? { unitId: id } : {}),
            ...(kind === "lesson" ? { lessonId: id } : {}),
          },
          engineMeta: {
            ...(draft.engineMeta || {}),
            lastCreatedShell: { kind, id, at },
          },
          createdAt: kind === "lesson" ? at : draft.createdAt,
        },
        `Created ${kind} shell ${id}`,
        "admin",
      ),
      `Created ${kind} shell`,
    );
  }

  if (preview) {
    return (
      <div>
        <div style={{ padding: "0.75rem 1rem", display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setPreview(false)} style={btn(true)}>
            Back to editor
          </button>
        </div>
        <InteractiveLessonViewer pkg={draft} locale="en" />
      </div>
    );
  }

  return (
    <div dir="ltr" style={{ maxWidth: 1100, margin: "0 auto", padding: "1.25rem 1rem" }}>
      <header style={{ marginBottom: "1rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.45rem" }}>Interactive Lesson Admin Builder</h1>
        <p style={{ color: "#64748b", margin: "0.35rem 0 0", fontSize: 13 }}>
          Foundation builder — create book/unit/lesson shells, blocks, slides; version & publish.
          No curriculum import, no AI generation.
        </p>
        <p style={{ fontSize: 12, color: "#0f766e", margin: "0.35rem 0 0" }}>
          {draft.id} · v{draft.version} · {draft.status}
          {notice ? ` · ${notice}` : ""}
        </p>
      </header>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button type="button" style={btn(true)} onClick={() => setPreview(true)}>
          Preview
        </button>
        <button type="button" style={btn()} onClick={() => setStatus("draft")}>
          Unpublish / Draft
        </button>
        <button type="button" style={btn()} onClick={() => setStatus("preview")}>
          Preview status
        </button>
        <button type="button" style={btn()} onClick={() => setStatus("published")}>
          Publish
        </button>
        <button type="button" style={btn()} onClick={() => setStatus("unpublished")}>
          Unpublish
        </button>
        <button type="button" style={btn()} onClick={() => bump("Manual version bump")}>
          Bump version
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {(
          [
            ["blocks", "Blocks"],
            ["slides", "Slides"],
            ["structure", "Book / Unit / Lesson"],
            ["versions", "Version history"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" style={btn(tab === id)} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "structure" ? (
        <section style={card()}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Hierarchy shells</h2>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            Creates curriculum-agnostic IDs on the package source — no national content imported.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={btn()} onClick={() => createEmptyLessonShell("book")}>
              Create book shell
            </button>
            <button type="button" style={btn()} onClick={() => createEmptyLessonShell("unit")}>
              Create unit shell
            </button>
            <button type="button" style={btn()} onClick={() => createEmptyLessonShell("lesson")}>
              Create lesson
            </button>
          </div>
          <pre style={{ fontSize: 11, background: "#f8fafc", padding: 8, borderRadius: 8, overflow: "auto" }}>
            {JSON.stringify(draft.source, null, 2)}
          </pre>
        </section>
      ) : null}

      {tab === "slides" ? (
        <section style={card()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ marginTop: 0, fontSize: 16 }}>Slides ({draft.slides?.length || 0})</h2>
            <button type="button" style={btn(true)} onClick={createSlide}>
              Add slide
            </button>
          </div>
          <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 13 }}>
            {(draft.slides || []).map((s) => (
              <li key={s.id}>
                {s.order}. {getLocalized(s.title, "en")} · {s.blocks.length} blocks
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "versions" ? (
        <section style={card()}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Version history</h2>
          <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 12, color: "#475569" }}>
            {history
              .slice()
              .reverse()
              .map((c, i) => (
                <li key={`${c.at}-${i}`}>
                  v{c.version} · {c.at} — {c.note} {c.by ? `(${c.by})` : ""}
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {tab === "blocks" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr 240px",
            gap: 12,
          }}
          className="ile-admin-grid"
        >
          <style>{`
            @media (max-width: 900px) {
              .ile-admin-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>

          <aside style={card()}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Sections</div>
            {LESSON_SECTION_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setSectionId(id)}
                style={{
                  ...btn(sectionId === id),
                  display: "block",
                  width: "100%",
                  marginBottom: 4,
                  textAlign: "left",
                }}
              >
                {getLocalized(LESSON_SECTION_LABELS[id], "en")}
              </button>
            ))}
          </aside>

          <section style={card()}>
            <h2 style={{ marginTop: 0, fontSize: 16 }}>
              {getLocalized(LESSON_SECTION_LABELS[sectionId], "en")} blocks
            </h2>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 0 }}>
              Drag rows to reorder · Up/Down buttons also work
            </p>
            {(draft.sections[sectionId] || []).map((b) => (
              <div
                key={b.id}
                draggable
                onDragStart={() => setDragId(b.id)}
                onDragOver={(e: DragEvent) => e.preventDefault()}
                onDrop={() => onDropReorder(b.id)}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "0.55rem",
                  marginBottom: 8,
                  cursor: "grab",
                  background: dragId === b.id ? "#f0fdfa" : "#fff",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {b.type} · {b.id}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {getLocalized(b.text, "en").slice(0, 100)}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button type="button" style={btn()} onClick={() => moveBlock(b.id, -1)}>
                    Up
                  </button>
                  <button type="button" style={btn()} onClick={() => moveBlock(b.id, 1)}>
                    Down
                  </button>
                  <button type="button" style={btn()} onClick={() => removeBlock(b.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {!((draft.sections[sectionId] || []).length) ? (
              <p style={{ color: "#94a3b8", fontSize: 13 }}>No blocks — add from library.</p>
            ) : null}
          </section>

          <aside style={card()}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Block library</div>
            {CONTENT_BLOCK_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                style={{
                  ...btn(),
                  display: "block",
                  width: "100%",
                  marginBottom: 4,
                  textAlign: "left",
                }}
                title={getLocalized(library.find((x) => x.type === type)?.description, "en")}
              >
                + {type}
              </button>
            ))}
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function btn(active = false): React.CSSProperties {
  return {
    border: "1px solid #cbd5e1",
    background: active ? "#0f766e" : "#fff",
    color: active ? "#fff" : "#0f172a",
    borderRadius: 8,
    padding: "0.35rem 0.55rem",
    cursor: "pointer",
    fontSize: 12,
  };
}

function card(): React.CSSProperties {
  return {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    background: "#fff",
    padding: "0.75rem",
  };
}
