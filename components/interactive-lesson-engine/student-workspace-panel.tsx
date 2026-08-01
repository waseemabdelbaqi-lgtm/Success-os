"use client";

import dynamic from "next/dynamic";
import { useRef, type ReactNode } from "react";
import type {
  LessonSectionId,
  StudentWorkspaceState,
} from "@/types/interactive-lesson-engine";

const RichTextAdapter = dynamic(
  () =>
    import("@/lib/interactive-lesson-engine/adapters/rich-text-adapter").then(
      (m) => m.RichTextAdapter,
    ),
  { ssr: false, loading: () => <div style={{ padding: 8, fontSize: 12 }}>Loading editor…</div> },
);

type Locale = "en" | "ar";

type StudentWorkspacePanelProps = {
  locale?: Locale;
  workspace: StudentWorkspaceState;
  onNotesChange: (notes: string) => void;
  onAddHighlight: (text: string, color: string) => void;
  onAddBookmark: (label: string, sectionId?: LessonSectionId) => void;
  onSaveDrawing: (dataUrl: string) => void;
  onAiAsk: (prompt: string) => void;
  sectionId: LessonSectionId;
  aiReply?: string | null;
};

export function StudentWorkspacePanel({
  locale = "ar",
  workspace,
  onNotesChange,
  onAddHighlight,
  onAddBookmark,
  onSaveDrawing,
  onAiAsk,
  sectionId,
  aiReply,
}: StudentWorkspacePanelProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = "#0f766e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function moveDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function endDraw() {
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) onSaveDrawing(canvas.toDataURL("image/png"));
  }

  return (
    <aside
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        background: "#fff",
        padding: "0.75rem",
      }}
    >
      <h3 style={{ margin: "0 0 0.5rem", fontSize: 15 }}>
        {locale === "ar" ? "مساحة عمل الطالب" : "Student workspace"}
      </h3>

      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
        {locale === "ar" ? "ملاحظات (TipTap)" : "Notes (TipTap)"}
      </div>
      <RichTextAdapter
        value={workspace.notes}
        onChange={onNotesChange}
        dir={locale === "ar" ? "rtl" : "ltr"}
        placeholder={locale === "ar" ? "اكتب ملاحظاتك…" : "Write your notes…"}
      />

      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          style={btn()}
          onClick={() => {
            const text = window.getSelection()?.toString().trim();
            if (text) onAddHighlight(text, "#fde68a");
          }}
        >
          {locale === "ar" ? "تمييز" : "Highlight"}
        </button>
        <button
          type="button"
          style={btn()}
          onClick={() =>
            onAddBookmark(
              locale === "ar" ? `إشارة · ${sectionId}` : `Bookmark · ${sectionId}`,
              sectionId,
            )
          }
        >
          {locale === "ar" ? "إشارة" : "Bookmark"}
        </button>
        <button
          type="button"
          style={btn(true)}
          onClick={() =>
            onAiAsk(
              locale === "ar"
                ? "اشرح لي هذا القسم باختصار"
                : "Explain this section briefly",
            )
          }
        >
          {locale === "ar" ? "اسأل الذكاء الاصطناعي" : "AI Ask"}
        </button>
      </div>

      {aiReply ? (
        <p
          style={{
            marginTop: 8,
            fontSize: 12,
            background: "#ecfdf5",
            borderRadius: 8,
            padding: "0.5rem",
            color: "#115e59",
          }}
        >
          {aiReply}
        </p>
      ) : null}

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
          {locale === "ar" ? "منطقة الرسم" : "Drawing area"}
        </div>
        <canvas
          ref={canvasRef}
          width={280}
          height={140}
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          style={{
            width: "100%",
            border: "1px dashed #94a3b8",
            borderRadius: 8,
            touchAction: "none",
            background: "#f8fafc",
          }}
        />
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
        {locale === "ar" ? "التقدّم المحفوظ" : "Saved progress"}: {workspace.progressPercent}%
      </div>
    </aside>
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
  };
}
