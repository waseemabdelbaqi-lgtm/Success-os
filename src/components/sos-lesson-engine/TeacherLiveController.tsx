"use client";

import { useEffect, useState , type CSSProperties } from "react";
import type { InteractiveLesson, LessonStageId, LiveSession } from "@/src/lib/sos-lesson-engine/schema/types";
import { REQUIRED_STAGE_ORDER } from "@/src/lib/sos-lesson-engine/schema/types";
import { LessonJourneyPlayer } from "@/src/components/sos-lesson-engine/LessonJourneyPlayer";

type Props = {
  lesson: InteractiveLesson;
  teacherKey?: string;
};

const LABELS: Record<LessonStageId, string> = {
  identity: "هوية",
  hook: "تمهيد",
  prerequisite: "متطلبات",
  objectives: "أهداف",
  vocabulary: "مفردات",
  explanation: "شرح",
  guided_practice: "موجّه",
  interactive_activity: "نشاط",
  real_life: "حياة",
  collaboration: "تعاون",
  independent_practice: "مستقل",
  assessment: "تقييم",
  results: "نتائج",
  reflection: "تأمل",
  next_step: "التالي",
};

export function TeacherLiveController({ lesson, teacherKey = "teacher-1" }: Props) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [joinName, setJoinName] = useState("طالب");
  const [joinCode, setJoinCode] = useState("");
  const [role, setRole] = useState<"teacher" | "student">("teacher");

  async function create() {
    const res = await fetch("/api/sos-lesson-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_live", lessonId: lesson.id, teacherKey }),
    });
    const json = await res.json();
    if (json.ok) setSession(json.session);
  }

  async function patch(p: Partial<LiveSession>) {
    if (!session) return;
    const res = await fetch("/api/sos-lesson-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_live", sessionId: session.id, patch: p }),
    });
    const json = await res.json();
    if (json.ok) setSession(json.session);
  }

  async function join() {
    const res = await fetch("/api/sos-lesson-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "join_live",
        joinCode: joinCode.toUpperCase(),
        displayName: joinName,
        participantId: `stu-${Date.now()}`,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setSession(json.session);
      setRole("student");
    }
  }

  useEffect(() => {
    if (!session || session.status === "ended") return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/sos-lesson-engine?view=live&id=${session.id}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setSession(json.session);
    }, 2000);
    return () => clearInterval(t);
  }, [session?.id, session?.status]);

  const dist = (() => {
    if (!session?.activeQuestionId) return [] as Array<{ answer: string; n: number }>;
    const map = new Map<string, number>();
    for (const r of session.responses.filter((x) => x.questionId === session.activeQuestionId)) {
      map.set(r.answer, (map.get(r.answer) || 0) + 1);
    }
    return [...map.entries()].map(([answer, n]) => ({ answer, n }));
  })();

  return (
    <div style={wrap} dir="rtl">
      <h1 style={h1}>جلسة مباشرة — تحكم المعلّم</h1>
      <p style={note}>
        وضع Teacher-paced أصلي في Success OS. لا تُعرض أسماء الطلاب ذوي الأداء المنخفض علناً — التوزيع مجهول
        الهوية.
      </p>

      {!session && role === "teacher" && (
        <div style={row}>
          <button type="button" style={btn} onClick={create}>
            ابدأ جلسة من هذا الدرس
          </button>
          <span>أو انضم كطالب:</span>
          <input style={input} value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="رمز" />
          <input style={input} value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="اسم العرض" />
          <button type="button" style={btnGhost} onClick={join}>
            انضم
          </button>
        </div>
      )}

      {session && (
        <div style={card}>
          <p>
            الرمز: <strong style={{ fontSize: 28 }}>{session.joinCode}</strong> · الحالة: {session.status} ·
            المشاركون: {session.participants.length}
          </p>
          {role === "teacher" && (
            <div style={row}>
              <button type="button" style={btn} onClick={() => patch({ status: "live" })}>
                بث مباشر
              </button>
              <button type="button" style={btnGhost} onClick={() => patch({ status: "paused" })}>
                إيقاف مؤقت
              </button>
              <button type="button" style={btnGhost} onClick={() => patch({ status: "ended" })}>
                إنهاء
              </button>
              <button
                type="button"
                style={btnGhost}
                onClick={() => patch({ lockStudentNav: !session.lockStudentNav })}
              >
                {session.lockStudentNav ? "فتح تنقّل الطلاب" : "قفل تنقّل الطلاب"}
              </button>
            </div>
          )}
          {role === "teacher" && (
            <div style={row}>
              {REQUIRED_STAGE_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  style={{ ...chip, ...(session.currentStageId === s ? chipOn : {}) }}
                  onClick={() => patch({ currentStageId: s })}
                >
                  {LABELS[s]}
                </button>
              ))}
            </div>
          )}
          {dist.length > 0 && (
            <div>
              <h3>توزيع إجابات مجهول</h3>
              <ul>
                {dist.map((d) => (
                  <li key={d.answer}>
                    خيار/إجابة: {d.answer} — {d.n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {session && (
        <LessonJourneyPlayer
          lesson={lesson}
          teacherLockedStage={session.lockStudentNav || role === "student" ? session.currentStageId : null}
        />
      )}
    </div>
  );
}

const wrap: CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "1rem",
  fontFamily: '"IBM Plex Sans Arabic",Tahoma,sans-serif',
  color: "#2a0c10",
};
const h1: CSSProperties = { color: "#4b0a11" };
const note: CSSProperties = { color: "#6b3a40", fontWeight: 700 };
const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 10 };
const btn: CSSProperties = {
  background: "#9e1722",
  color: "#fff",
  border: 0,
  borderRadius: 10,
  padding: "0.5rem 0.85rem",
  fontWeight: 800,
  cursor: "pointer",
};
const btnGhost: CSSProperties = {
  ...btn,
  background: "#fff",
  color: "#9e1722",
  border: "1px solid rgba(158,23,34,.3)",
};
const input: CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(158,23,34,.25)",
  padding: "0.45rem 0.65rem",
};
const card: CSSProperties = {
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.16)",
  borderRadius: 14,
  padding: 12,
  marginBottom: 12,
};
const chip: CSSProperties = {
  border: "1px solid rgba(158,23,34,.2)",
  background: "#fff",
  borderRadius: 999,
  padding: "0.25rem 0.55rem",
  cursor: "pointer",
  fontSize: 12,
};
const chipOn: CSSProperties = { background: "#9e1722", color: "#fff" };
