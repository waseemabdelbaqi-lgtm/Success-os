"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type Extraction = {
  id: string;
  teacherId?: string;
  sourceName?: string;
  curriculum?: string;
  subject?: string;
  summary?: string;
  createdAt?: string;
  extracted?: {
    topics?: string[];
    strengths?: string[];
    teachingStyle?: string;
    suggestedOfferTitles?: string[];
  };
};

/**
 * Platform-only tools: supervisor teacher registration + AI video extraction archive.
 * Not linked from student-facing surfaces as a public feature.
 */
export default function TeachersPlatformToolsPage(): ReactNode {
  const [actorRole, setActorRole] = useState("supervisor");
  const [teacherId, setTeacherId] = useState("");
  const [sourceName, setSourceName] = useState("intro-video");
  const [curriculum, setCurriculum] = useState("");
  const [subject, setSubject] = useState("");
  const [aboutHint, setAboutHint] = useState("");
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const qs = new URLSearchParams({
      view: "platform-ai",
      actorRole,
    });
    if (teacherId) qs.set("teacherId", teacherId);
    const res = await fetch(`/api/teachers-os?${qs}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || "LOAD_FAILED");
    setExtractions(json.extractions || []);
  }, [actorRole, teacherId]);

  useEffect(() => {
    load().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "LOAD_FAILED"),
    );
  }, [load]);

  async function extract() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/teachers-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "platformExtractFromVideo",
          actorRole,
          teacherId,
          sourceName,
          curriculum,
          subject,
          aboutHint,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "EXTRACT_FAILED");
      setMessage("تم الاستخلاص وأُرشف داخلياً — ملك للمنصة فقط.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "EXTRACT_FAILED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fff8f8] text-[#301218]" dir="rtl">
      <header className="border-b border-[#ead9db] bg-gradient-to-br from-[#301218] via-[#4b0a11] to-[#7f121b] text-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f2d77c]">
            PLATFORM INTERNAL · TEACHERS OS
          </p>
          <h1 className="mt-2 text-3xl font-semibold">أدوات المنصة — المعلمون</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/85">
            تسجيل المعلمين عبر المشرف المخوّل، واستخلاص معلومات الفيديوهات بالذكاء الاصطناعي —
            خاصية تعود للمنصة فقط ولا تُعرض للطالب أو المعلم.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/teachers/register?by=supervisor"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#9e1722]"
            >
              تسجيل معلم عبر المشرف
            </Link>
            <Link
              href="/dashboard/teachers"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              Teachers OS
            </Link>
            <Link
              href="/dashboard/super-admin"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              المشرف الأعلى
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </p>
        ) : null}

        <section className="rounded-2xl border border-[#ead9db] bg-white p-5">
          <h2 className="text-lg font-bold text-[#4b0a11]">استخلاص من فيديو المعلم</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-semibold">دور المنصة</span>
              <select
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={actorRole}
                onChange={(e) => setActorRole(e.target.value)}
              >
                <option value="supervisor">مشرف</option>
                <option value="super_admin">مشرف أعلى</option>
                <option value="platform_ai">محرك المنصة</option>
                <option value="employees_os">موظفو OS</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold">رقم المعلم</span>
              <input
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value.trim())}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold">اسم مصدر الفيديو</span>
              <input
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold">المنهج</span>
              <input
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold">المادة</span>
              <input
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label className="sm:col-span-2 text-sm">
              <span className="mb-1 block font-semibold">نص مساعد / تلميح من الفيديو</span>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={aboutHint}
                onChange={(e) => setAboutHint(e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            disabled={busy || !teacherId}
            onClick={extract}
            className="mt-4 rounded-xl bg-[#4b0a11] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? "جاري الاستخلاص…" : "تشغيل استخلاص المنصة"}
          </button>
        </section>

        <section className="rounded-2xl border border-[#ead9db] bg-white p-5">
          <h2 className="text-lg font-bold text-[#4b0a11]">أرشيف الاستخلاص الداخلي</h2>
          <p className="mt-1 text-sm text-[#73636a]">visibility: platform_internal</p>
          <div className="mt-4 space-y-3">
            {extractions.length === 0 ? (
              <p className="text-sm text-[#73636a]">لا سجلات بعد.</p>
            ) : (
              extractions.map((row) => (
                <article
                  key={row.id}
                  className="rounded-xl border border-[#f0e4e6] px-4 py-3 text-sm"
                >
                  <p className="font-bold text-[#4b0a11]">
                    {row.sourceName || "video"} · معلم {row.teacherId}
                  </p>
                  <p className="mt-1 text-[#73636a]">{row.summary}</p>
                  {row.extracted?.suggestedOfferTitles?.length ? (
                    <p className="mt-2 text-xs text-[#9a711a]">
                      عناوين مقترحة: {row.extracted.suggestedOfferTitles.join(" · ")}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
