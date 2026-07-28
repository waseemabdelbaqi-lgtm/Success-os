"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { InteractiveLesson } from "@/src/lib/sos-lesson-engine/schema/types";
import { TeacherLiveController } from "@/src/components/sos-lesson-engine/TeacherLiveController";

function LiveLessonInner() {
  const sp = useSearchParams();
  const lessonId = sp.get("lessonId") || "sos-il-jo-g1-math-u0-l1-numbers-123";
  const [lesson, setLesson] = useState<InteractiveLesson | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/sos-lesson-engine?view=lesson&id=${encodeURIComponent(lessonId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setLesson(j.lesson);
        else setErr("الدرس غير موجود");
      })
      .catch(() => setErr("تعذّر التحميل"));
  }, [lessonId]);

  if (err) return <main dir="rtl" style={{ padding: 24 }}>{err}</main>;
  if (!lesson) return <main dir="rtl" style={{ padding: 24 }}>جاري التحميل…</main>;
  return <TeacherLiveController lesson={lesson} />;
}

export default function TeacherLiveLessonPage() {
  return (
    <Suspense fallback={<main dir="rtl" style={{ padding: 24 }}>جاري التحميل…</main>}>
      <LiveLessonInner />
    </Suspense>
  );
}
