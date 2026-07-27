"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TeacherExplanation } from "@/src/lib/digital-library/types";

type Props = {
  explanation: TeacherExplanation;
};

/**
 * Timed full teacher explanation panel (≥30 minutes of classroom delivery).
 */
export function TeacherFullExplanation({ explanation }: Props) {
  const [openId, setOpenId] = useState(explanation.segments[0]?.id || "");
  const total = useMemo(
    () => explanation.segments.reduce((n, s) => n + s.minutes, 0),
    [explanation.segments],
  );
  const active = explanation.segments.find((s) => s.id === openId) || explanation.segments[0];
  let cursor = 0;
  const timeline = explanation.segments.map((s) => {
    const start = cursor;
    cursor += s.minutes;
    return { ...s, start, end: cursor };
  });

  return (
    <section
      className="dl-teacher-explain"
      id="teacher-explain"
      aria-labelledby="teacher-explain-title"
      dir="rtl"
    >
      <header className="dl-teacher-explain-head">
        <p className="dl-kicker">Teachers OS · شرح المعلّم الحقيقي</p>
        <h2 id="teacher-explain-title">{explanation.titleAr}</h2>
        <p className="dl-lead">{explanation.subtitleAr}</p>
        <div className="dl-teacher-explain-meta">
          <Link href={explanation.teacherHref}>{explanation.teacherName}</Link>
          <span>
            {explanation.totalMinutes || total} دقيقة · {explanation.segments.length} محطات
          </span>
          {explanation.offerHref ? (
            <Link href={explanation.offerHref}>عرض الحصة · احجز / شاهد</Link>
          ) : null}
        </div>
      </header>

      <div className="dl-teacher-explain-materials">
        <strong>مواد الحصة</strong>
        <ul>
          {explanation.materials.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>

      <ol className="dl-teacher-timeline">
        {timeline.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={s.id === active?.id ? "active" : ""}
              onClick={() => setOpenId(s.id)}
            >
              <b>
                {s.start}–{s.end} د
              </b>
              <span>{s.titleAr}</span>
              <i>{s.minutes} د</i>
            </button>
          </li>
        ))}
      </ol>

      {active ? (
        <article className="dl-teacher-segment" aria-live="polite">
          <header>
            <h3>
              {active.titleAr}{" "}
              <small>
                ({active.minutes} د) · الدقيقة{" "}
                {timeline.find((t) => t.id === active.id)?.start}–
                {timeline.find((t) => t.id === active.id)?.end}
              </small>
            </h3>
            <p>{active.goalAr}</p>
          </header>
          <div className="dl-teacher-script">
            <strong>كلام المعلّم</strong>
            {active.teacherScript.split("\n\n").map((para) => (
              <p key={para.slice(0, 24)}>{para}</p>
            ))}
          </div>
          <div className="dl-teacher-moves">
            <strong>ماذا يفعل الطالب؟</strong>
            <ul>
              {active.studentMoves.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          {active.boardCue ? (
            <p className="dl-teacher-board">
              <strong>سبورة / شاشة:</strong> {active.boardCue}
            </p>
          ) : null}
        </article>
      ) : null}

      <div className="dl-teacher-explain-actions">
        <Link href={explanation.teacherHref}>ملف المعلّم</Link>
        {explanation.offerHref ? <Link href={explanation.offerHref}>عرض 35 دقيقة</Link> : null}
        <a href="#visualizer">ارجع للمجسّم 3D</a>
        <a href="#quiz">انتقل للاختبار</a>
      </div>
    </section>
  );
}
