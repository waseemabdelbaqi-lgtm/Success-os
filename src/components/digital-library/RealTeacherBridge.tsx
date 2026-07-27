"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TeacherMatch = {
  id: string;
  fullName: string;
  subjects?: string[];
  curricula?: string[];
  city?: string;
  country?: string;
  aboutStudent?: string;
  href: string;
  offers?: Array<{
    id: string;
    title: string;
    type: string;
    price: number;
    currency: string;
    href: string;
  }>;
};

type Props = {
  subjects?: string[];
  curricula?: string[];
  lessonTitle?: string;
  initialTeachers?: TeacherMatch[];
};

const TYPE_AR: Record<string, string> = {
  recorded: "مسجّل",
  online: "أونلاين",
  in_person: "حضوري",
};

/**
 * Bridges interactive/3D library lessons to real human Teachers OS offers.
 */
export function RealTeacherBridge({
  subjects = [],
  curricula = [],
  lessonTitle = "",
  initialTeachers = [],
}: Props) {
  const [teachers, setTeachers] = useState<TeacherMatch[]>(initialTeachers);
  const [loading, setLoading] = useState(!initialTeachers.length);

  useEffect(() => {
    if (initialTeachers.length) return;
    const params = new URLSearchParams({ view: "teachers" });
    if (subjects.length) params.set("subjects", subjects.join(","));
    if (curricula.length) params.set("curricula", curricula.join(","));
    fetch(`/api/curriculum-os?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setTeachers(json.teachers || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subjects, curricula, initialTeachers.length]);

  return (
    <section className="dl-teacher-bridge" id="real-teacher" aria-labelledby="real-teacher-title">
      <div className="dl-teacher-bridge-head">
        <p className="dl-kicker">SUCCESS OS · معلّم حقيقي</p>
        <h2 id="real-teacher-title">الدرس التفاعلي أداة — والمعلّم إنسان</h2>
        <p>
          وحدات 3D والاختبار والمساحة الذكية تساعدك تفهم. الشرح الحي، الحصص المسجّلة، والمتابعة
          تكون من معلّم معتمد في Teachers OS
          {lessonTitle ? ` · مرتبط بـ «${lessonTitle}»` : ""}.
        </p>
      </div>

      {loading ? (
        <p className="dl-teacher-empty">نجلب المعلّمين المناسبين…</p>
      ) : teachers.length ? (
        <div className="dl-teacher-grid">
          {teachers.map((t) => (
            <article key={t.id} className="dl-teacher-card">
              <header>
                <strong>{t.fullName}</strong>
                <span>
                  {[t.city, t.country].filter(Boolean).join(" · ") || "متاح عبر المنصة"}
                </span>
              </header>
              <p>{(t.aboutStudent || "معلّم معتمد في SUCCESS OS.").slice(0, 160)}</p>
              <div className="dl-teacher-tags">
                {(t.subjects || []).slice(0, 4).map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              {t.offers?.length ? (
                <ul className="dl-teacher-offers">
                  {t.offers.map((o) => (
                    <li key={o.id}>
                      <Link href={o.href}>
                        {o.title} · {TYPE_AR[o.type] || o.type} · {o.price} {o.currency}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link className="dl-teacher-cta" href={t.href}>
                ملف المعلّم
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="dl-teacher-empty">
          <p>لا يوجد معلّم مطابق بعد لهذا المسار — سجّل كمعلّم أو تصفّح السوق.</p>
          <div className="dl-teacher-actions">
            <Link href="/teachers">سوق المعلّمين</Link>
            <Link href="/teachers/register">انضم كمعلّم حقيقي</Link>
          </div>
        </div>
      )}

      <div className="dl-teacher-actions">
        <Link href="/curriculum">رفع / إدارة المناهج</Link>
        <Link href="/digital-library">المكتبة الرقمية العالمية</Link>
      </div>
    </section>
  );
}
