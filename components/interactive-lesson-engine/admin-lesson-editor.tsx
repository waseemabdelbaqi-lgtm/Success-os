"use client";

import { useMemo, useState, type ReactNode } from "react";
import type {
  ContentBlockType,
  InteractiveLessonPackage,
  LessonSectionId,
} from "@/types/interactive-lesson-engine";
import {
  CONTENT_BLOCK_TYPES,
  LESSON_SECTION_ORDER,
  LESSON_SECTION_LABELS,
} from "@/types/interactive-lesson-engine";
import { createBlock, listBlockLibrary } from "@/lib/interactive-lesson-engine/block-library";
import { getLocalized } from "@/lib/interactive-lesson-engine";
import { InteractiveLessonViewer } from "./interactive-lesson-viewer";

type AdminLessonEditorProps = {
  initial: InteractiveLessonPackage;
};

/**
 * Admin foundation editor: create/reorder sections, add/remove block types,
 * preview, version, publish/unpublish, track changelog. No curriculum import.
 */
export function AdminLessonEditor({ initial }: AdminLessonEditorProps): ReactNode {
  const [draft, setDraft] = useState<InteractiveLessonPackage>(initial);
  const [sectionId, setSectionId] = useState<LessonSectionId>("overview");
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const library = useMemo(() => listBlockLibrary(), []);

  function bumpVersion(note: string) {
    const at = new Date().toISOString();
    setDraft((d) => ({
      ...d,
      version: d.version + 1,
      updatedAt: at,
      changelog: [...(d.changelog || []), { at, note, by: "admin" }],
    }));
  }

  function addBlock(type: ContentBlockType) {
    const block = createBlock(type, {
      title: { en: type, ar: type },
      text: {
        en: `New ${type} block`,
        ar: `كتلة ${type} جديدة`,
      },
      placeholderStatus:
        type.includes("placeholder") || type === "video_placeholder"
          ? "planned"
          : undefined,
    });
    setDraft((d) => ({
      ...d,
      sections: {
        ...d.sections,
        [sectionId]: [...(d.sections[sectionId] || []), block],
      },
    }));
    bumpVersion(`Added block ${type} to ${sectionId}`);
    setNotice(`Added ${type}`);
  }

  function removeBlock(blockId: string) {
    setDraft((d) => ({
      ...d,
      sections: {
        ...d.sections,
        [sectionId]: (d.sections[sectionId] || []).filter((b) => b.id !== blockId),
      },
    }));
    bumpVersion(`Removed block ${blockId}`);
  }

  function moveBlock(blockId: string, dir: -1 | 1) {
    setDraft((d) => {
      const list = [...(d.sections[sectionId] || [])];
      const idx = list.findIndex((b) => b.id === blockId);
      if (idx < 0) return d;
      const next = idx + dir;
      if (next < 0 || next >= list.length) return d;
      const tmp = list[idx];
      const swap = list[next];
      if (!tmp || !swap) return d;
      list[idx] = swap;
      list[next] = tmp;
      return {
        ...d,
        sections: { ...d.sections, [sectionId]: list },
      };
    });
    bumpVersion(`Reordered blocks in ${sectionId}`);
  }

  function setStatus(status: InteractiveLessonPackage["status"]) {
    setDraft((d) => ({ ...d, status }));
    bumpVersion(`Status → ${status}`);
    setNotice(`Status: ${status}`);
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
        <h1 style={{ margin: 0, fontSize: "1.45rem" }}>Interactive Lesson Admin Editor</h1>
        <p style={{ color: "#64748b", margin: "0.35rem 0 0", fontSize: 13 }}>
          Foundation editor — no curriculum import, no AI video generation.
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
      </div>

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
              style={{ ...btn(sectionId === id), display: "block", width: "100%", marginBottom: 4, textAlign: "left" }}
            >
              {getLocalized(LESSON_SECTION_LABELS[id], "en")}
            </button>
          ))}
        </aside>

        <section style={card()}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>
            {getLocalized(LESSON_SECTION_LABELS[sectionId], "en")} blocks
          </h2>
          {(draft.sections[sectionId] || []).map((b) => (
            <div
              key={b.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "0.55rem",
                marginBottom: 8,
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
              style={{ ...btn(), display: "block", width: "100%", marginBottom: 4, textAlign: "left" }}
              title={getLocalized(library.find((x) => x.type === type)?.description, "en")}
            >
              + {type}
            </button>
          ))}
        </aside>
      </div>

      <section style={{ ...card(), marginTop: 12 }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Change log</h3>
        <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 12, color: "#475569" }}>
          {(draft.changelog || [])
            .slice()
            .reverse()
            .slice(0, 12)
            .map((c, i) => (
              <li key={`${c.at}-${i}`}>
                {c.at} — {c.note} {c.by ? `(${c.by})` : ""}
              </li>
            ))}
        </ul>
      </section>
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
