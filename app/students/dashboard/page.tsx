"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type Purchase = {
  id: string;
  item?: string;
  subject?: string;
  service?: string;
  kind?: string;
  duration?: string;
  status?: string;
};

type Wallet = { balance: number; history?: unknown[] };

const ORBITS = [
  {
    id: "learn",
    title: "مدار التعلم",
    blurb: "موادك والحصص والمعلم الذكي في مسار واحد.",
    href: "/start-journey?portal=student",
    accent: "#f2d77c",
  },
  {
    id: "library",
    title: "مكتبة النجوم",
    blurb: "مكتبة رقمية عالمية + دروس تفاعلية/3D مربوطة بمعلّم حقيقي.",
    href: "/digital-library",
    accent: "#ffd9a0",
  },
  {
    id: "curriculum",
    title: "المناهج الحية",
    blurb: "تصفّح outlines واربط فصلك بمسار تعلم واضح.",
    href: "/curriculum",
    accent: "#f0c48a",
  },
  {
    id: "teachers",
    title: "معلموك البشريون",
    blurb: "عروض مباشرة ومسجلة من Teachers OS.",
    href: "/teachers",
    accent: "#f6c1a8",
  },
  {
    id: "passport",
    title: "جواز النجاح",
    blurb: "إنجازاتك تتحول إلى جواز تعليمي حي.",
    href: "/passport",
    accent: "#e8c96a",
  },
] as const;

const QUESTS = [
  { id: "q1", label: "افتح مادة واحدة هذا الأسبوع", href: "/start-journey?portal=student" },
  { id: "q2", label: "اسأل المعلم الذكي سؤالاً صعباً", href: "/tutor" },
  { id: "q3", label: "احجز حصة أو شاهد عرض معلم", href: "/teachers" },
  { id: "q3b", label: "افتح درساً تفاعلياً من المكتبة", href: "/digital-library" },
  { id: "q4", label: "حدّث الجواز التعليمي", href: "/passport" },
] as const;

/**
 * Students OS — imaginative learner control room.
 */
export default function StudentsControlDashboard(): ReactNode {
  const [name, setName] = useState("يا بطل التعلم");
  const [dream, setDream] = useState("أتفوق في الفيزياء وأفتح باب الجامعة التي أحلم بها");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [wallet, setWallet] = useState<Wallet>({ balance: 0 });
  const [liveOffers, setLiveOffers] = useState(0);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    try {
      setPurchases(JSON.parse(localStorage.getItem("success-os-purchases") || "[]"));
      setWallet(JSON.parse(localStorage.getItem("success-os-points") || '{"balance":0}'));
      const profile = JSON.parse(localStorage.getItem("sos_student_control") || "{}");
      if (profile.name) setName(profile.name);
      if (profile.dream) setDream(profile.dream);
    } catch {
      /* ignore */
    }
    fetch("/api/teachers-os?view=marketplace", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setLiveOffers((json.offers || []).length);
      })
      .catch(() => {});
  }, []);

  const activeMaterials = useMemo(
    () =>
      purchases.filter(
        (x) => x.service === "حصص مسجلة" || x.kind === "assistant" || Boolean(x.subject),
      ),
    [purchases],
  );

  const kpis = [
    { label: "مواد مفعّلة", value: String(activeMaterials.length || 0), hint: "رحلتك الجارية" },
    { label: "نقاط SUCCESS", value: String(wallet.balance || 0), hint: "30 نقطة = مادة 3 أشهر" },
    { label: "عروض معلمين", value: String(liveOffers), hint: "حية الآن في السوق" },
    {
      label: "طاقة الأسبوع",
      value: activeMaterials.length ? "مشعّة" : "بانتظار الشرارة",
      hint: "من خيالك إلى إنجازك",
    },
  ];

  function saveProfile() {
    localStorage.setItem(
      "sos_student_control",
      JSON.stringify({ name, dream, updatedAt: new Date().toISOString() }),
    );
    setSaved("حُفظ حلمك في غرفة التحكم");
    window.setTimeout(() => setSaved(""), 2500);
  }

  return (
    <div className="students-os min-h-screen text-[#301218]" dir="rtl">
      <style>{`
        .students-os {
          background:
            radial-gradient(1200px 500px at 90% -10%, rgba(242, 215, 124, 0.28), transparent 55%),
            radial-gradient(900px 420px at 0% 20%, rgba(158, 23, 34, 0.14), transparent 50%),
            linear-gradient(180deg, #fff8f4 0%, #fff5f6 40%, #f7f1f2 100%);
        }
        .students-os .hero-glow { animation: studentsPulse 7s ease-in-out infinite; }
        .students-os .orbit-card { transition: transform 0.35s ease, box-shadow 0.35s ease; }
        .students-os .orbit-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(75, 10, 17, 0.12);
        }
        .students-os .constellation { animation: studentsDrift 18s linear infinite; }
        @keyframes studentsPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
        @keyframes studentsDrift { from { transform: translateX(0); } to { transform: translateX(-40px); } }
      `}</style>

      <header className="relative overflow-hidden border-b border-[#ead9db] bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] text-white">
        <div
          className="hero-glow pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-[#f2d77c]/25 blur-3xl"
          aria-hidden
        />
        <div
          className="constellation pointer-events-none absolute inset-x-0 bottom-0 h-24 opacity-30"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 10% 40%, #f2d77c 1px, transparent 1.5px), radial-gradient(circle at 30% 70%, #fff 1px, transparent 1.5px), radial-gradient(circle at 55% 30%, #f2d77c 1px, transparent 1.5px), radial-gradient(circle at 80% 60%, #fff 1px, transparent 1.5px)",
            backgroundSize: "180px 80px",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-9 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#f2d77c]">
            SUCCESS OS · STUDENTS OS
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            غرفة تحكم الطالب — حيث يتحول الحلم إلى مسار
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
            ليست لوحة أرقام فقط. هذه بوصلتك داخل المنصة: مواد، كتب، معلمون، ومعلم ذكي يرافق خيالك حتى
            يصبح نتيجة.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/start-journey?portal=student"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#9e1722]"
            >
              ابدأ رحلة مادة
            </Link>
            <Link
              href="/tutor"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              المعلم الذكي
            </Link>
            <Link
              href="/teachers"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              سوق المعلمين
            </Link>
            <Link
              href="/student-portal"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              البوابة البسيطة
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-[#ead9db] bg-white/90 p-5 backdrop-blur">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a711a]">
              هوية الرحلة
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#4b0a11]">من أنت في SUCCESS OS؟</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-1">
                <span className="mb-1 block font-semibold text-[#4b0a11]">اسمك في اللوحة</span>
                <input
                  className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="text-sm sm:col-span-1">
                <span className="mb-1 block font-semibold text-[#4b0a11]">حلمك هذا الفصل</span>
                <input
                  className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                  value={dream}
                  onChange={(e) => setDream(e.target.value)}
                />
              </label>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#73636a]">
              مرحباً <strong className="text-[#4b0a11]">{name}</strong> — بوصلتك: {dream}
            </p>
            <button
              type="button"
              onClick={saveProfile}
              className="mt-4 rounded-xl bg-[#9e1722] px-4 py-2.5 text-sm font-bold text-white"
            >
              احفظ الحلم في اللوحة
            </button>
            {saved ? <p className="mt-2 text-sm text-emerald-800">{saved}</p> : null}
          </article>

          <article className="rounded-3xl border border-[#f0e0a8] bg-gradient-to-br from-[#fff8e8] to-white p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a711a]">
              مهمة الأسبوع
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#4b0a11]">مهام تُشعل التقدم</h2>
            <ul className="mt-4 space-y-2">
              {QUESTS.map((q) => (
                <li key={q.id}>
                  <Link
                    href={q.href}
                    className="flex items-center justify-between rounded-xl border border-[#f0e0a8] bg-white/80 px-3 py-2.5 text-sm font-semibold text-[#4b0a11] transition hover:border-[#9e1722]"
                  >
                    <span>{q.label}</span>
                    <span className="text-[#9e1722]">←</span>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <article
              key={kpi.label}
              className="rounded-2xl border border-[#ead9db] bg-white px-4 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a711a]">
                {kpi.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-[#4b0a11]">{kpi.value}</p>
              <p className="mt-1 text-xs text-[#73636a]">{kpi.hint}</p>
            </article>
          ))}
        </section>

        <section>
          <header className="mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a711a]">
              LEARNING CONSTELLATION
            </p>
            <h2 className="text-2xl font-bold text-[#4b0a11]">مدارات غرفة التحكم</h2>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            {ORBITS.map((orbit) => (
              <Link
                key={orbit.id}
                href={orbit.href}
                className="orbit-card rounded-3xl border border-[#ead9db] bg-white p-5"
                style={{ borderTopColor: orbit.accent, borderTopWidth: 3 }}
              >
                <h3 className="text-lg font-bold text-[#4b0a11]">{orbit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#73636a]">{orbit.blurb}</p>
                <span className="mt-4 inline-block text-sm font-bold text-[#9e1722]">
                  ادخل المدار ←
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[#ead9db] bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#4b0a11]">موادك المفعّلة</h2>
              <p className="mt-1 text-sm text-[#73636a]">من السوق إلى مكتبتك الشخصية.</p>
            </div>
            <Link href="/start-journey?portal=student" className="text-sm font-bold text-[#9e1722]">
              + مادة جديدة
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {activeMaterials.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#ead9db] px-4 py-5 text-sm text-[#73636a]">
                لا مواد بعد — ابدأ رحلتك واختر صفاً ومادة لتضيء هذه الغرفة.
              </p>
            ) : (
              activeMaterials.slice(0, 6).map((item) => (
                <article
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f0e4e6] px-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-bold text-[#4b0a11]">
                      {item.subject || item.item || "مادة"}
                    </p>
                    <p className="text-xs text-[#73636a]">
                      {item.duration || "—"} · {item.status || "مفعّلة"}
                    </p>
                  </div>
                  <Link
                    href={`/student/material?id=${encodeURIComponent(item.id)}`}
                    className="font-bold text-[#9e1722]"
                  >
                    افتح
                  </Link>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/class-booking", title: "الحصص المباشرة", desc: "مواعيدك وحجوزاتك" },
            { href: "/student-journey", title: "خطة رحلتي", desc: "خريطة التعلم الأسبوعية" },
            { href: "/jobs/dashboard", title: "مساري المهني لاحقاً", desc: "غرفة الباحثين عن عمل" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-[#ead9db] bg-white/80 px-4 py-4 transition hover:border-[#9e1722]"
            >
              <h3 className="font-bold text-[#4b0a11]">{item.title}</h3>
              <p className="mt-1 text-sm text-[#73636a]">{item.desc}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
