"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

type Match = {
  score: number;
  reasons: string[];
  partner: {
    id: string;
    type: string;
    typeLabel?: string;
    orgName: string;
    country?: string;
    city?: string;
    about?: string;
    programs?: string[];
    openRoles?: string[];
    courses?: string[];
    isPlatformPartner?: boolean;
  };
};

/**
 * Student / job-seeker discovery — find the right partner for your search.
 */
export default function PartnersDiscoverPage(): ReactNode {
  const [audience, setAudience] = useState<"student" | "jobseeker">("student");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [need, setNeed] = useState("");
  const [type, setType] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState("");

  async function search() {
    setError("");
    const qs = new URLSearchParams({
      view: "discover",
      audience,
      query,
      country,
      need,
      type: audience === "jobseeker" ? "employer" : type,
    });
    const res = await fetch(`/api/partners-os?${qs}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json.error || "SEARCH_FAILED");
      return;
    }
    setMatches(json.matches || []);
  }

  useEffect(() => {
    search().catch(() => {});
    // initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience]);

  return (
    <div className="min-h-screen bg-[#fff8f8] text-[#301218]" dir="rtl">
      <header className="border-b border-[#ead9db] bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f2d77c]">
            SUCCESS OS · PARTNER MATCH
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            ابحث عن الشريك المناسب
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/85">
            للطالب: جامعات ومدارس ومراكز. للباحث عن عمل: شركات توظف. المطابقة تعتمد على احتياجك
            ودولتك والبرامج/الوظائف المنشورة.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/admissions"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#9e1722]"
            >
              مسار قبول الجامعات
            </Link>
            <Link
              href="/partners/dashboard"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              لوحة الشريك
            </Link>
            <Link
              href="/jobs/dashboard"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              غرفة الباحث
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-[#ead9db] bg-white p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAudience("student")}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                audience === "student"
                  ? "bg-[#9e1722] text-white"
                  : "border border-[#ead9db] text-[#4b0a11]"
              }`}
            >
              أنا طالب
            </button>
            <button
              type="button"
              onClick={() => setAudience("jobseeker")}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                audience === "jobseeker"
                  ? "bg-[#9e1722] text-white"
                  : "border border-[#ead9db] text-[#4b0a11]"
              }`}
            >
              أنا باحث عن عمل
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block font-semibold">بحث</span>
              <input
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اسم أو تخصص أو وظيفة"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold">الدولة</span>
              <input
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="الأردن"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold">
                {audience === "jobseeker" ? "الوظيفة المطلوبة" : "التخصص / الاحتياج"}
              </span>
              <input
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                placeholder={audience === "jobseeker" ? "محلل بيانات" : "هندسة حاسوب"}
              />
            </label>
            {audience === "student" ? (
              <label className="text-sm">
                <span className="mb-1 block font-semibold">نوع الشريك</span>
                <select
                  className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="">الكل</option>
                  <option value="university">جامعة</option>
                  <option value="college">كلية</option>
                  <option value="school">مدرسة</option>
                  <option value="center">مركز</option>
                </select>
              </label>
            ) : (
              <div className="flex items-end">
                <p className="rounded-xl bg-[#fff8f8] px-3 py-2 text-sm text-[#73636a]">
                  يُعرض أصحاب العمل فقط
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => search()}
            className="mt-4 rounded-xl bg-[#9e1722] px-4 py-2.5 text-sm font-bold text-white"
          >
            طابق الشركاء
          </button>
        </section>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <section className="grid gap-3">
          {matches.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#ead9db] bg-white px-4 py-6 text-sm text-[#73636a]">
              لا نتائج بعد — جرّب كلمات أوسع أو اترك الفلاتر فارغة.
            </p>
          ) : (
            matches.map((m) => (
              <article
                key={m.partner.id}
                className="rounded-2xl border border-[#ead9db] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a711a]">
                      {m.partner.typeLabel || m.partner.type}
                      {m.partner.isPlatformPartner ? " · شريك منصة" : ""}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-[#4b0a11]">
                      {m.partner.orgName}
                    </h2>
                    <p className="mt-1 text-sm text-[#73636a]">
                      {[m.partner.city, m.partner.country].filter(Boolean).join("، ")}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-[#73636a]">
                      {m.partner.about}
                    </p>
                    <p className="mt-2 text-xs text-[#9a711a]">
                      {(m.partner.programs || m.partner.courses || m.partner.openRoles || [])
                        .slice(0, 4)
                        .join(" · ")}
                    </p>
                    {m.reasons.length ? (
                      <p className="mt-2 text-xs text-[#73636a]">
                        لماذا ظهر: {m.reasons.join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-bold text-[#9e1722]">{m.score}%</p>
                    <p className="text-xs text-[#9a711a]">درجة المطابقة</p>
                    <Link
                      href={`/partners/${m.partner.id}`}
                      className="mt-3 inline-block rounded-xl bg-[#9e1722] px-4 py-2 text-sm font-bold text-white"
                    >
                      عرض التفاصيل
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
