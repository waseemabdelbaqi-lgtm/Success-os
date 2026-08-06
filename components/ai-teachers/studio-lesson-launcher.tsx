"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { StudioLessonPlan } from "@/types/digital-human-studio";

type Props = {
  lessonId: string;
  title: string;
  titleAr?: string;
  subject?: string;
  grade?: string;
  texts?: string[];
  preferredTeacherId?: "sara" | "ali";
};

/**
 * Auto-plans a Digital Human Studio session when a lesson opens.
 */
export function StudioLessonLauncher({
  lessonId,
  title,
  titleAr,
  subject,
  grade,
  texts = [],
  preferredTeacherId,
}: Props) {
  const [plan, setPlan] = useState<StudioLessonPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const textsKey = texts.join("\n");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const payloadTexts = textsKey ? textsKey.split("\n") : [titleAr || title];
    fetch("/api/digital-human-studio?action=plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        title,
        titleAr,
        subject,
        grade,
        texts: payloadTexts,
        preferredTeacherId,
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.success) throw new Error(json.error?.message || "plan failed");
        setPlan(json.data as StudioLessonPlan);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId, title, titleAr, subject, grade, preferredTeacherId, textsKey]);

  if (loading) {
    return (
      <div style={bar}>
        جاري توليد المعلم الرقمي وتحليل الدرس…
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div style={bar}>
        تعذّر تخطيط الاستوديو —{" "}
        <Link href="/ai-teacher" style={{ color: "#ffd84a" }}>
          ادخل مع سارة وعلي
        </Link>
      </div>
    );
  }

  const teacher = plan.cast.id === "ali" ? "ali" : "sara";
  const hrefStudio = `/ai-teacher?teacher=${teacher}`;

  return (
    <div style={bar}>
      <div>
        <strong style={{ color: "#ffd84a" }}>{plan.cast.displayNameAr}</strong>
        {" · "}
        جاهز لشرح الدرس داخل الاستوديو
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link
          href={hrefStudio}
          style={{
            background: "linear-gradient(120deg,#f0e4d0,#d8c4a0)",
            color: "#1a1208",
            fontWeight: 900,
            textDecoration: "none",
            padding: "10px 16px",
            borderRadius: 12,
          }}
        >
          ابدأ الحصة مع {plan.cast.displayNameAr}
        </Link>
      </div>
    </div>
  );
}

const bar: CSSProperties = {
  maxWidth: 1200,
  margin: "0.75rem auto",
  padding: "12px 14px",
  borderRadius: 14,
  background: "linear-gradient(90deg,#121826,#1a2438)",
  color: "#f3f0e7",
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  fontFamily: "'Noto Kufi Arabic', sans-serif",
  fontSize: 14,
};
