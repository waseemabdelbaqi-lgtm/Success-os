"use client";

import { useState , type CSSProperties } from "react";
import type { InteractiveLesson, LessonStageId } from "@/src/lib/sos-lesson-engine/schema/types";

type Props = {
  lesson: InteractiveLesson;
  studentKey: string;
  stageId: LessonStageId;
};

export function AITutorPanel({ lesson, studentKey, stageId }: Props) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [log, setLog] = useState<Array<{ role: "user" | "tutor"; text: string; flag?: string }>>([]);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!msg.trim() || busy) return;
    const userMessage = msg.trim();
    setMsg("");
    setLog((l) => [...l, { role: "user", text: userMessage }]);
    setBusy(true);
    try {
      const res = await fetch("/api/sos-lesson-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ai_tutor",
          lessonId: lesson.id,
          studentKey,
          stageId,
          userMessage,
          attemptMade: false,
        }),
      });
      const json = await res.json();
      setLog((l) => [
        ...l,
        {
          role: "tutor",
          text: json.replyAr || "تعذّر الرد",
          flag: json.needsTeacherReview ? "يحتاج مراجعة معلم" : json.confidence,
        },
      ]);
    } catch {
      setLog((l) => [...l, { role: "tutor", text: "خطأ في الاتصال بالمساعد." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={wrap}>
      <button type="button" style={toggle} onClick={() => setOpen((o) => !o)}>
        {open ? "إغلاق مساعد الدرس" : "اسأل المساعد الذكي (ضمن الدرس فقط)"}
      </button>
      {open && (
        <div style={panel}>
          <p style={policy}>
            المساعد يستخدم فقط محتوى الدرس المعتمد. لا إنترنت مفتوح · لا كشف إجابة قبل المحاولة · لا فيديو معلّم
            آلي.
          </p>
          <div style={logBox}>
            {log.map((row, i) => (
              <div key={i} style={row.role === "user" ? userBubble : tutorBubble}>
                {row.text}
                {row.flag ? <div style={flag}>{row.flag}</div> : null}
              </div>
            ))}
          </div>
          <div style={row}>
            <input
              style={input}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="مثال: بسّط الشرح / أعطني تلميحاً / مثال من الحياة"
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button type="button" style={btn} disabled={busy} onClick={send}>
              إرسال
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const wrap: CSSProperties = { marginTop: 16 };
const toggle: CSSProperties = {
  background: "#4b0a11",
  color: "#f2d77c",
  border: 0,
  borderRadius: 10,
  padding: "0.55rem 0.9rem",
  fontWeight: 800,
  cursor: "pointer",
};
const panel: CSSProperties = {
  marginTop: 8,
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.2)",
  borderRadius: 14,
  padding: 12,
};
const policy: CSSProperties = { fontSize: 12, color: "#6b3a40", fontWeight: 700 };
const logBox: CSSProperties = { maxHeight: 220, overflow: "auto", display: "grid", gap: 8 };
const userBubble: CSSProperties = {
  background: "rgba(158,23,34,.08)",
  borderRadius: 10,
  padding: 8,
  justifySelf: "end",
  maxWidth: "90%",
};
const tutorBubble: CSSProperties = {
  background: "rgba(242,215,124,.35)",
  borderRadius: 10,
  padding: 8,
  justifySelf: "start",
  maxWidth: "90%",
};
const flag: CSSProperties = { fontSize: 11, marginTop: 4, opacity: 0.8 };
const row: CSSProperties = { display: "flex", gap: 8, marginTop: 8 };
const input: CSSProperties = {
  flex: 1,
  borderRadius: 8,
  border: "1px solid rgba(158,23,34,.25)",
  padding: "0.5rem 0.7rem",
};
const btn: CSSProperties = {
  background: "#9e1722",
  color: "#fff",
  border: 0,
  borderRadius: 8,
  padding: "0.5rem 0.8rem",
  fontWeight: 800,
  cursor: "pointer",
};
