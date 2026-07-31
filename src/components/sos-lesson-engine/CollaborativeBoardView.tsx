"use client";

import { useEffect, useState , type CSSProperties } from "react";
import type { CollaborativeBoard } from "@/src/lib/sos-lesson-engine/schema/types";

type Props = {
  lessonId: string;
  promptAr: string;
  boardType: CollaborativeBoard["boardType"];
  moderationRequired: boolean;
  anonymousAllowed: boolean;
  studentKey: string;
};

export function CollaborativeBoardView({
  lessonId,
  promptAr,
  boardType,
  moderationRequired,
  anonymousAllowed,
  studentKey,
}: Props) {
  const [board, setBoard] = useState<CollaborativeBoard | null>(null);
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [msg, setMsg] = useState("");

  async function reload() {
    const res = await fetch(
      `/api/sos-lesson-engine?view=board&lessonId=${encodeURIComponent(lessonId)}`,
      { cache: "no-store" },
    );
    const json = await res.json();
    if (json.ok) setBoard(json.board);
  }

  useEffect(() => {
    fetch("/api/sos-lesson-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ensure_board",
        lessonId,
        promptAr,
        boardType,
        moderationRequired,
      }),
    }).then(() => reload());
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function post() {
    if (!text.trim()) return;
    const res = await fetch("/api/sos-lesson-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "board_post",
        lessonId,
        authorKey: studentKey,
        displayName: anonymous ? "طالب anonym" : "طالب",
        anonymous,
        bodyAr: text.trim(),
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setBoard(json.board);
      setText("");
      setMsg(moderationRequired ? "أُرسل للمراجعة قبل النشر." : "تم النشر.");
    }
  }

  const visible = board?.posts.filter((p) => p.approved) || [];

  return (
    <div>
      <p style={badge}>لوحة تعاون Success OS · {boardType}</p>
      <p style={prompt}>{promptAr}</p>
      <div style={wall}>
        {visible.length === 0 && <p style={{ color: "#6b3a40" }}>لا منشورات بعد — كن أول من يشارك فكرة مناسبة.</p>}
        {visible.map((p) => (
          <article key={p.id} style={card}>
            <strong>{p.anonymous ? "مشاركة صفّية" : p.displayName}</strong>
            <p>{p.bodyAr}</p>
          </article>
        ))}
      </div>
      <textarea
        style={area}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="اكتب فكرة قصيرة مناسبة للعمر"
        maxLength={500}
      />
      {anonymousAllowed && (
        <label style={{ display: "block", marginBottom: 8 }}>
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> مشاركة
          دون إظهار الاسم للزملاء
        </label>
      )}
      <button type="button" style={btn} onClick={post}>
        نشر على اللوحة
      </button>
      {msg && <p>{msg}</p>}
    </div>
  );
}

const badge: CSSProperties = { color: "#9e1722", fontWeight: 900 };
const prompt: CSSProperties = { fontWeight: 700 };
const wall: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
  gap: 10,
  margin: "0.8rem 0",
};
const card: CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(158,23,34,.15)",
  borderRadius: 12,
  padding: "0.7rem",
};
const area: CSSProperties = {
  width: "100%",
  minHeight: 70,
  borderRadius: 10,
  border: "1px solid rgba(158,23,34,.25)",
  padding: 8,
};
const btn: CSSProperties = {
  background: "#9e1722",
  color: "#fff",
  border: 0,
  borderRadius: 10,
  padding: "0.55rem 0.9rem",
  fontWeight: 800,
  cursor: "pointer",
};
