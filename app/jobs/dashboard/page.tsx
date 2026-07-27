"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type JobApplication = {
  id?: string;
  jobTitle?: string;
  title?: string;
  company?: string;
  status?: string;
  createdAt?: string;
  location?: string;
};

const LAUNCH_PADS = [
  {
    id: "profile",
    title: "منصة الإطلاق: ملفك",
    blurb: "سيرة، مهارات، وتفضيلات تظهر لصاحب العمل فقط بما تختاره.",
    href: "/profile?role=jobseeker",
    tone: "from-[#4b0a11] to-[#9e1722]",
  },
  {
    id: "search",
    title: "رادار الوظائف",
    blurb: "طابق مجالَك ودولتك ثم قدّم بثقة.",
    href: "/jobs",
    tone: "from-[#7f121b] to-[#c43a45]",
  },
  {
    id: "tracker",
    title: "برج المتابعة",
    blurb: "كل طلب له حالة واضحة — من التقديم إلى المقابلة.",
    href: "/application-tracker",
    tone: "from-[#6a4d12] to-[#9a711a]",
  },
  {
    id: "passport",
    title: "جواز المهارات",
    blurb: "حوّل إنجازاتك التعليمية إلى إشارات مهنية قابلة للمشاركة.",
    href: "/passport",
    tone: "from-[#301218] to-[#4b0a11]",
  },
] as const;

const SKILL_SUGGESTIONS = [
  "تواصل",
  "تحليل بيانات",
  "لغة إنجليزية",
  "إدارة مشاريع",
  "Excel",
  "خدمة عملاء",
] as const;

/**
 * Careers OS — imaginative job-seeker control cockpit.
 */
export default function JobsControlDashboard(): ReactNode {
  const [name, setName] = useState("يا صائد الفرص");
  const [targetRole, setTargetRole] = useState("محلل بيانات مبتدئ");
  const [scope, setScope] = useState<"داخل الدولة" | "خارج الدولة">("داخل الدولة");
  const [skills, setSkills] = useState<string[]>(["تواصل", "لغة إنجليزية"]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    try {
      const apps = JSON.parse(localStorage.getItem("success-os-job-applications") || "[]");
      setApplications(Array.isArray(apps) ? apps : []);
      const profile = JSON.parse(localStorage.getItem("sos_jobseeker_control") || "{}");
      if (profile.name) setName(profile.name);
      if (profile.targetRole) setTargetRole(profile.targetRole);
      if (profile.scope === "خارج الدولة" || profile.scope === "داخل الدولة") {
        setScope(profile.scope);
      }
      if (Array.isArray(profile.skills) && profile.skills.length) setSkills(profile.skills);
    } catch {
      /* ignore */
    }
  }, []);

  const matchScore = useMemo(() => {
    const base = 42 + skills.length * 8 + (applications.length ? 10 : 0);
    return Math.min(96, base);
  }, [skills, applications]);

  const kpis = [
    { label: "طلبات مرسلة", value: String(applications.length), hint: "من رادار الوظائف" },
    { label: "درجة المطابقة", value: `${matchScore}%`, hint: "تتقدّم مع مهاراتك" },
    { label: "نطاق البحث", value: scope, hint: "داخل / خارج الدولة" },
    {
      label: "حالة الإطلاق",
      value: applications.length ? "في المدار" : "على المنصة",
      hint: "جاهزية التقديم",
    },
  ];

  function toggleSkill(skill: string) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  }

  function saveProfile() {
    localStorage.setItem(
      "sos_jobseeker_control",
      JSON.stringify({
        name,
        targetRole,
        scope,
        skills,
        updatedAt: new Date().toISOString(),
      }),
    );
    setSaved("غرفة القيادة حدّثت مسارك المهني");
    window.setTimeout(() => setSaved(""), 2500);
  }

  return (
    <div className="careers-os min-h-screen text-[#301218]" dir="rtl">
      <style>{`
        .careers-os {
          background:
            radial-gradient(1000px 480px at 10% -20%, rgba(158, 23, 34, 0.18), transparent 55%),
            radial-gradient(800px 400px at 100% 10%, rgba(212, 175, 55, 0.22), transparent 50%),
            linear-gradient(165deg, #1a0c10 0%, #301218 28%, #fff6f4 28.1%, #fff8f8 100%);
        }
        .careers-os .radar-ring { animation: careersSpin 22s linear infinite; }
        .careers-os .pad-card { transition: transform 0.3s ease, filter 0.3s ease; }
        .careers-os .pad-card:hover { transform: translateY(-3px) scale(1.01); filter: brightness(1.05); }
        @keyframes careersSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <header className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#301218] via-[#4b0a11] to-[#9e1722]" />
        <div
          className="radar-ring pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border border-[#f2d77c]/25"
          aria-hidden
        />
        <div
          className="radar-ring pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full border border-white/15"
          aria-hidden
          style={{ animationDuration: "14s" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-9 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#f2d77c]">
            SUCCESS OS · CAREERS OS
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            غرفة قيادة الباحث عن عمل
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
            رادار فرص، منصة إطلاق لملفك، ومتابعة طلبات — مفصولة عن بوابة الطالب حتى تبقى خصوصيتك تحت
            سيطرتك.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/jobs"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#9e1722]"
            >
              افتح رادار الوظائف
            </Link>
            <Link
              href="/profile?role=jobseeker"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              ملفك المهني
            </Link>
            <Link
              href="/jobseeker-portal"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              بوابة الباحث
            </Link>
            <Link
              href="/students/dashboard"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              غرفة الطالب
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-3xl border border-[#ead9db] bg-white p-5 shadow-[0_20px_50px_rgba(48,18,24,0.06)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a711a]">
              إعدادات الإطلاق
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#4b0a11]">من تكون في سوق العمل؟</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[#4b0a11]">اسم العرض المهني</span>
                <input
                  className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[#4b0a11]">الوظيفة المستهدفة</span>
                <input
                  className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["داخل الدولة", "خارج الدولة"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScope(option)}
                  className={`rounded-xl px-3 py-2 text-sm font-bold ${
                    scope === option
                      ? "bg-[#9e1722] text-white"
                      : "border border-[#ead9db] bg-white text-[#4b0a11]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-[#73636a]">
              <strong className="text-[#4b0a11]">{name}</strong> يستهدف{" "}
              <strong className="text-[#4b0a11]">{targetRole}</strong> — النطاق: {scope}
            </p>
            <button
              type="button"
              onClick={saveProfile}
              className="mt-4 rounded-xl bg-[#9e1722] px-4 py-2.5 text-sm font-bold text-white"
            >
              احفظ إعدادات القيادة
            </button>
            {saved ? <p className="mt-2 text-sm text-emerald-800">{saved}</p> : null}
          </article>

          <article className="rounded-3xl border border-[#ead9db] bg-white p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a711a]">
              مهارات الإشارة
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#4b0a11]">اختر ما يظهر في الرادار</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {SKILL_SUGGESTIONS.map((skill) => {
                const on = skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                      on
                        ? "bg-[#4b0a11] text-white"
                        : "border border-[#ead9db] bg-[#fff8f8] text-[#4b0a11]"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#73636a]">
              فصل الخصوصية: السجل الدراسي التفصيلي يبقى في غرفة الطالب. هنا تشارك فقط ما تفعّله.
            </p>
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
              LAUNCH PADS
            </p>
            <h2 className="text-2xl font-bold text-[#4b0a11]">منصات الإطلاق</h2>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            {LAUNCH_PADS.map((pad) => (
              <Link
                key={pad.id}
                href={pad.href}
                className={`pad-card rounded-3xl bg-gradient-to-br ${pad.tone} p-5 text-white`}
              >
                <h3 className="text-lg font-bold">{pad.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/85">{pad.blurb}</p>
                <span className="mt-4 inline-block text-sm font-bold text-[#f2d77c]">انطلق ←</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[#ead9db] bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#4b0a11]">آخر طلباتك</h2>
              <p className="mt-1 text-sm text-[#73636a]">من `success-os-job-applications` على جهازك.</p>
            </div>
            <Link href="/jobs" className="text-sm font-bold text-[#9e1722]">
              قدّم على وظيفة
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {applications.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#ead9db] px-4 py-5 text-sm text-[#73636a]">
                لا طلبات بعد — افتح الرادار وقدّم على أول فرصة تناسب {targetRole}.
              </p>
            ) : (
              applications.slice(0, 8).map((app, idx) => (
                <article
                  key={app.id || `${app.jobTitle}-${idx}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f0e4e6] px-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-bold text-[#4b0a11]">
                      {app.jobTitle || app.title || "وظيفة"}
                    </p>
                    <p className="text-xs text-[#73636a]">
                      {app.company || "شركة"} · {app.status || "مُرسل"} · {app.location || scope}
                    </p>
                  </div>
                  <Link href="/application-tracker" className="font-bold text-[#9e1722]">
                    متابعة
                  </Link>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-[#f0e0a8] bg-[#fffaf0] p-5">
          <h2 className="text-lg font-bold text-[#6a4d12]">حدود الخصوصية مع الطالب</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#73636a]">
            غرفة الطالب للتعلم والحصص. غرفة الباحث للعمل والمقابلات. لا يمرّ السجل الأكاديمي التفصيلي
            إلى صاحب العمل إلا إذا اخترت مشاركته عبر الجواز أو الملف المهني.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/students/dashboard"
              className="rounded-xl border border-[#ead9db] bg-white px-4 py-2 text-sm font-bold text-[#9e1722]"
            >
              غرفة تحكم الطالب
            </Link>
            <Link
              href="/teachers/dashboard"
              className="rounded-xl border border-[#ead9db] bg-white px-4 py-2 text-sm font-bold text-[#9e1722]"
            >
              لوحة المعلم
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
