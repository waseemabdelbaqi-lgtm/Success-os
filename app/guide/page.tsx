"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { companionLog } from "@/components/ai/companion-guide-beacon";

type EventRow = {
  id: string;
  createdAt: string;
  type: string;
  path?: string;
  title?: string;
  detail?: string;
  source?: string;
};

type Milestone = {
  id: string;
  title: string;
  status: string;
  path?: string;
  note?: string;
  tier?: string;
};

type VerifyResult = {
  id: string;
  labelAr?: string;
  path: string;
  ok: boolean;
  status: number;
  ms: number;
  error?: string;
};

type Snapshot = {
  protocol: {
    version: string;
    nameAr: string;
    principles: string[];
    operatingLoop: string[];
  };
  session: {
    id: string;
    label?: string;
    eventCount?: number;
    lastPath?: string;
  };
  events: EventRow[];
  milestones: Milestone[];
  verification: {
    id: string;
    createdAt: string;
    score: number;
    passed: number;
    failed: number;
    total: number;
    results: VerifyResult[];
  } | null;
  narrative: string;
  surfaces: { id: string; labelAr: string; path: string; tier: string }[];
};

/**
 * Living Partner Guide — continuous recording + verification co-pilot.
 */
export default function CompanionGuidePage(): ReactNode {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [aiNarrative, setAiNarrative] = useState("");
  const [note, setNote] = useState("");
  const [actor, setActor] = useState("Waseem · Partner");

  const load = useCallback(async (sid?: string) => {
    setError("");
    const qs = sid ? `?sessionId=${encodeURIComponent(sid)}` : "";
    const res = await fetch(`/api/ai-guide${qs}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || "LOAD_FAILED");
    setSnapshot(json.snapshot);
    setSessionId(json.snapshot.session.id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sos_companion_session_id", json.snapshot.session.id);
    }
  }, []);

  useEffect(() => {
    const sid =
      typeof window !== "undefined"
        ? window.localStorage.getItem("sos_companion_session_id") || ""
        : "";
    const savedActor =
      typeof window !== "undefined"
        ? window.localStorage.getItem("sos_companion_actor") || ""
        : "";
    if (savedActor) setActor(savedActor);
    load(sid || undefined).catch((e: unknown) =>
      setError(e instanceof Error ? e.message : "LOAD_FAILED"),
    );
  }, [load]);

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sos_companion_actor", actor);
      }
      const res = await fetch("/api/ai-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          sessionId,
          actor,
          ...payload,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "ACTION_FAILED");
      if (json.narrative) setAiNarrative(json.narrative);
      if (json.report) {
        setMessage(
          `تحقق: ${json.report.score}% — نجح ${json.report.passed} / فشل ${json.report.failed}`,
        );
      } else {
        setMessage("تم");
      }
      await load(sessionId || json.session?.id);
      return json;
    } catch (e) {
      setError(e instanceof Error ? e.message : "ACTION_FAILED");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    if (!note.trim()) return;
    await companionLog({
      type: "partner_note",
      path: "/guide",
      title: "ملاحظة شريك",
      detail: note.trim(),
    });
    setNote("");
    await load(sessionId);
    setMessage("سُجّلت ملاحظتك في الدليل الحي");
  }

  const v = snapshot?.verification;

  return (
    <div className="guide-os min-h-screen text-[#301218]" dir="rtl">
      <style>{`
        .guide-os {
          background:
            radial-gradient(900px 420px at 100% 0%, rgba(242,215,124,.22), transparent 55%),
            radial-gradient(800px 380px at 0% 30%, rgba(158,23,34,.12), transparent 50%),
            linear-gradient(180deg,#1a0c10 0%,#4b0a11 22%,#fff7f5 22.05%,#fff8f8 100%);
        }
        .guide-os .pulse-line { animation: guidePulse 3.2s ease-in-out infinite; }
        @keyframes guidePulse { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>

      <header className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#301218] via-[#4b0a11] to-[#9e1722]" />
        <div className="pulse-line pointer-events-none absolute left-8 top-8 h-2 w-40 rounded-full bg-[#f2d77c]/70" />
        <div className="relative mx-auto max-w-6xl px-4 py-9 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#f2d77c]">
            SUCCESS OS · LIVING PARTNER GUIDE · AI COMPANION
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            دليل الشريك الحي — يسجّل معك ويتأكد معك
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
            مش مجرد شات. هذه طبقة ذكاء تظل توثّق كل خطوة بناء، تتحقق من الأسطح الحرجة، وتقرأ لك أين
            وصلنا كشريك — عشان نشتغل بمستوى عالي وما نضيّع ذاكرة المنظومة.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => post("verify")}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#9e1722] disabled:opacity-60"
            >
              {busy ? "جاري…" : "تحقق من كل شيء مرة ثانية"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => post("narrate", { question: "وين وصلنا وما التالي؟" })}
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              سرد ذكي للحالة
            </button>
            <Link
              href="/students/dashboard"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              غرفة الطالب
            </Link>
            <Link
              href="/jobs/dashboard"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              غرفة الباحث
            </Link>
            <Link
              href="/teachers/dashboard"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              لوحة المعلم
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
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

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-[#ead9db] bg-white p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a711a]">
              أين نحن الآن
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#4b0a11]">سرد الدليل</h2>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#73636a]">
              {aiNarrative || snapshot?.narrative || "جاري تحميل السجل…"}
            </pre>
            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-semibold text-[#4b0a11]">اسم الشريك في السجل</span>
              <input
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={actor}
                onChange={(e) => setActor(e.target.value)}
              />
            </label>
          </article>

          <article className="rounded-3xl border border-[#f0e0a8] bg-[#fffaf0] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a711a]">
              {snapshot?.protocol.nameAr || "بروتوكول الشراكة"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#4b0a11]">
              كيف بنحترف مع بعض
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pr-5 text-sm text-[#73636a]">
              {(snapshot?.protocol.operatingLoop || []).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <ul className="mt-4 space-y-2 text-sm text-[#4b0a11]">
              {(snapshot?.protocol.principles || []).slice(0, 3).map((p) => (
                <li key={p} className="rounded-xl bg-white/80 px-3 py-2">
                  {p}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "أحداث الجلسة",
              value: String(snapshot?.session.eventCount ?? "—"),
            },
            {
              label: "درجة التحقق",
              value: v ? `${v.score}%` : "—",
            },
            {
              label: "معالم منجزة",
              value: String(
                (snapshot?.milestones || []).filter((m) => m.status === "done").length,
              ),
            },
            {
              label: "آخر مسار",
              value: snapshot?.session.lastPath || "—",
            },
          ].map((kpi) => (
            <article
              key={kpi.label}
              className="rounded-2xl border border-[#ead9db] bg-white px-4 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a711a]">
                {kpi.label}
              </p>
              <p className="mt-2 break-all text-xl font-bold text-[#4b0a11]">{kpi.value}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-[#ead9db] bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#4b0a11]">تقرير التحقق الأخير</h2>
              <p className="mt-1 text-sm text-[#73636a]">
                {v
                  ? `${v.createdAt} · ${v.passed}/${v.total} ناجح`
                  : "اضغط «تحقق من كل شيء مرة ثانية» لتشغيل البوابة."}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(v?.results || snapshot?.surfaces || []).map((row) => {
              const r = row as VerifyResult & { labelAr?: string; path: string; ok?: boolean };
              const okFlag = typeof r.ok === "boolean" ? r.ok : undefined;
              return (
                <div
                  key={r.id || r.path}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[#f0e4e6] px-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-bold text-[#4b0a11]">{r.labelAr || r.path}</p>
                    <p className="text-xs text-[#73636a]">{r.path}</p>
                  </div>
                  {okFlag === undefined ? (
                    <span className="text-xs text-[#9a711a]">بانتظار تحقق</span>
                  ) : okFlag ? (
                    <span className="font-bold text-emerald-700">OK {r.status}</span>
                  ) : (
                    <span className="font-bold text-red-700">FAIL {r.status || "—"}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#ead9db] bg-white p-5">
            <h2 className="text-lg font-bold text-[#4b0a11]">معالم البناء</h2>
            <div className="mt-3 space-y-2">
              {(snapshot?.milestones || []).map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-[#f0e4e6] px-3 py-3 text-sm"
                >
                  <p className="font-bold text-[#4b0a11]">{m.title}</p>
                  <p className="text-xs text-[#73636a]">
                    {m.note} {m.path ? `· ${m.path}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-[#ead9db] bg-white p-5">
            <h2 className="text-lg font-bold text-[#4b0a11]">سجل الأحداث الحي</h2>
            <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto">
              {(snapshot?.events || []).length === 0 ? (
                <p className="text-sm text-[#73636a]">
                  تنقّل في المنصة — البيكون يسجّل زياراتك تلقائياً.
                </p>
              ) : (
                (snapshot?.events || []).map((e) => (
                  <div
                    key={e.id}
                    className="rounded-xl border border-[#f0e4e6] px-3 py-2.5 text-sm"
                  >
                    <p className="font-bold text-[#4b0a11]">
                      {e.title || e.type}{" "}
                      <span className="text-xs font-normal text-[#9a711a]">{e.type}</span>
                    </p>
                    <p className="text-xs text-[#73636a]">
                      {e.path || "—"} · {new Date(e.createdAt).toLocaleString("ar")}
                    </p>
                    {e.detail ? (
                      <p className="mt-1 text-xs text-[#73636a]">{e.detail}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 space-y-2">
              <textarea
                rows={3}
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2 text-sm"
                placeholder="اكتب ملاحظة شريك لتُسجَّل في الدليل…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                type="button"
                onClick={saveNote}
                className="rounded-xl bg-[#9e1722] px-4 py-2.5 text-sm font-bold text-white"
              >
                سجّل الملاحظة
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
