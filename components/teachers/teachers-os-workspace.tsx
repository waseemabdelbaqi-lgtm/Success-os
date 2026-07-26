"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type Teacher = {
  id: string;
  status: string;
  fullName: string;
  email: string;
  phone: string;
  nationality?: string;
  city?: string;
  country?: string;
  bio?: string;
  subjects?: string[];
  languages?: string[];
  experienceYears?: number;
  certificateName?: string;
  idDocumentType?: string;
  idDocumentName?: string;
  workAreas?: string[];
};

type Offer = {
  id: string;
  teacherId: string;
  status: string;
  type: string;
  title: string;
  subject?: string;
  description?: string;
  price: number;
  currency: string;
  durationMinutes: number;
  area?: string;
  travelMode?: string;
  meetingProvider?: string;
  meetingUrl?: string;
  recordingName?: string;
  scheduleSlots?: { id: string; day: string; startTime: string; endTime: string }[];
};

type Booking = {
  id: string;
  status: string;
  studentName: string;
  scheduledAt?: string;
  gross: number;
  platformFee: number;
  teacherNet: number;
  offerSnapshot?: { title?: string; type?: string };
};

type Absence = {
  id: string;
  status: string;
  bookingId: string;
  reportedBy: string;
  reporterName?: string;
  reason?: string;
  decision?: string;
  decidedBy?: string;
};

type Snapshot = {
  platformPercent: number;
  teacher: Teacher | null;
  offers: Offer[];
  sales: {
    platformPercent: number;
    bookingsCount: number;
    gross: number;
    platformFee: number;
    teacherNet: number;
    bookings: Booking[];
  } | null;
  absences: Absence[];
  pendingAbsences: Absence[];
  teachers: Teacher[];
};

const TABS = [
  { id: "overview", label: "نظرة عامة" },
  { id: "register", label: "التسجيل والوثائق" },
  { id: "offers", label: "عروضي وحصصي" },
  { id: "sales", label: "المبيعات والأرباح" },
  { id: "absences", label: "التخلف والإشراف" },
] as const;

function fileToDataUrl(file: File): Promise<{ name: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, dataUrl: String(reader.result || "") });
    reader.onerror = () => reject(new Error("FILE_READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

function typeLabel(type: string) {
  if (type === "recorded") return "حصة مسجلة";
  if (type === "online") return "أونلاين عبر المنصة";
  if (type === "in_person") return "وجاهي فردي";
  return type;
}

function travelLabel(mode?: string) {
  if (mode === "teacher_to_student") return "المعلم يذهب للطالب";
  if (mode === "student_to_teacher") return "الطالب يأتي للمعلم";
  if (mode === "both") return "متاح للجهتين";
  return "—";
}

/**
 * Teachers OS — highest-level teacher operating workspace.
 */
export function TeachersOsWorkspace(): ReactNode {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");
  const [teacherId, setTeacherId] = useState("");
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    city: "",
    country: "الأردن",
    bio: "",
    subjects: "فيزياء, كيمياء",
    languages: "العربية, English",
    experienceYears: "3",
    workAreas: "عمّان, الزرقاء",
    certificateName: "",
    certificateDataUrl: "",
    idDocumentType: "passport",
    idDocumentName: "",
    idDocumentDataUrl: "",
  });

  const [offerForm, setOfferForm] = useState({
    type: "online",
    title: "",
    subject: "",
    description: "",
    price: "25",
    durationMinutes: "60",
    area: "",
    exactLocationNote: "",
    travelMode: "both",
    meetingProvider: "platform_zoom",
    meetingUrl: "",
    recordingName: "",
    recordingDataUrl: "",
    day: "الأحد",
    startTime: "16:00",
    endTime: "17:00",
    status: "published",
  });

  const load = useCallback(async () => {
    setError("");
    const qs = teacherId ? `?teacherId=${encodeURIComponent(teacherId)}` : "";
    const res = await fetch(`/api/teachers-os${qs}`, { cache: "no-store" });
    const json = (await res.json()) as Snapshot & { ok?: boolean; error?: string };
    if (!res.ok || json.ok === false) throw new Error(json.error || "LOAD_FAILED");
    setData(json);
    if (json.teacher) {
      setTeacherId(json.teacher.id);
      setProfile((prev) => ({
        ...prev,
        fullName: json.teacher?.fullName || prev.fullName,
        email: json.teacher?.email || prev.email,
        phone: json.teacher?.phone || prev.phone,
        nationality: json.teacher?.nationality || prev.nationality,
        city: json.teacher?.city || prev.city,
        country: json.teacher?.country || prev.country,
        bio: json.teacher?.bio || prev.bio,
        subjects: (json.teacher?.subjects || []).join(", ") || prev.subjects,
        languages: (json.teacher?.languages || []).join(", ") || prev.languages,
        experienceYears: String(json.teacher?.experienceYears ?? prev.experienceYears),
        workAreas: (json.teacher?.workAreas || []).join(", ") || prev.workAreas,
        certificateName: json.teacher?.certificateName || prev.certificateName,
        idDocumentType: json.teacher?.idDocumentType || prev.idDocumentType,
        idDocumentName: json.teacher?.idDocumentName || prev.idDocumentName,
      }));
    }
  }, [teacherId]);

  useEffect(() => {
    load().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "LOAD_FAILED"),
    );
  }, [load]);

  async function post(action: string, payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/teachers-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "ACTION_FAILED");
      setMessage("تم الحفظ بنجاح");
      if (json.teacher?.id) setTeacherId(json.teacher.id);
      await load();
      return json;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ACTION_FAILED");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const platformPercent = data?.platformPercent ?? 10;
  const activeTeacher = data?.teacher;

  const kpis = useMemo(
    () => [
      {
        label: "نسبة المنصة",
        value: `${platformPercent}%`,
      },
      {
        label: "صافي أرباحك",
        value: data?.sales ? `${data.sales.teacherNet} JOD` : "—",
      },
      {
        label: "إجمالي المبيعات",
        value: data?.sales ? `${data.sales.gross} JOD` : "—",
      },
      {
        label: "عروض منشورة",
        value: (data?.offers || []).filter((o) => o.status === "published").length,
      },
    ],
    [data, platformPercent],
  );

  return (
    <div className="min-h-screen bg-[#fff8f8] text-[#301218]" dir="rtl">
      <header className="border-b border-[#ead9db] bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f2d77c]">
            SUCCESS OS · TEACHERS OS
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-sos-display)] text-3xl font-semibold sm:text-5xl">
            لوحات المعلمين — تشغيل كامل للحصص والمبيعات
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/85 sm:text-base">
            سجّل وثائقك، ارفع الحصص المسجلة، حدّد أونلاين أو وجاهي مع السعر والمدة والمنطقة، اربط
            Zoom عبر المنصة، وتابع أرباحك بعد خصم {platformPercent}% للمنصة. التخلف يُرفع للمشرف
            للقرار.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/teachers"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#9e1722]"
            >
              سوق المعلمين (عرض الطالب)
            </Link>
            <Link
              href="/dashboard/super-admin"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              لوحة المشرف
            </Link>
            <Link
              href="/teacher-portal"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              البوابة القديمة
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
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
            </article>
          ))}
        </section>

        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${
                tab === item.id
                  ? "bg-[#9e1722] text-white"
                  : "border border-[#ead9db] bg-white text-[#4b0a11]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-[#ead9db] bg-white p-5">
              <h2 className="text-lg font-bold text-[#4b0a11]">حالة المعلم</h2>
              {activeTeacher ? (
                <div className="mt-3 space-y-2 text-sm text-[#73636a]">
                  <p>
                    <strong className="text-[#301218]">{activeTeacher.fullName}</strong> ·{" "}
                    {activeTeacher.email}
                  </p>
                  <p>
                    الحالة:{" "}
                    <span className="font-bold text-[#9e1722]">
                      {activeTeacher.status === "approved"
                        ? "معتمد"
                        : "بانتظار مراجعة المشرف"}
                    </span>
                  </p>
                  <p>المواد: {(activeTeacher.subjects || []).join(" · ") || "—"}</p>
                  <p>مناطق العمل: {(activeTeacher.workAreas || []).join(" · ") || "—"}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#73636a]">
                  لم تُكمل التسجيل بعد. ابدأ من تبويب «التسجيل والوثائق».
                </p>
              )}
            </article>
            <article className="rounded-2xl border border-[#ead9db] bg-white p-5">
              <h2 className="text-lg font-bold text-[#4b0a11]">ماذا تقدر تعمل هنا؟</h2>
              <ul className="mt-3 list-disc space-y-2 pr-5 text-sm text-[#73636a]">
                <li>رفع شهادة + جواز/هوية وتسجيل كامل كـ معلم</li>
                <li>رفع حصص مسجلة وتحديد سعرها</li>
                <li>حصص أونلاين عبر المنصة + رابط Zoom</li>
                <li>وجاهي: أنت للطالب / الطالب لك / الجهتين + المنطقة والسعر</li>
                <li>تحديد المواعيد ومدة الحصة</li>
                <li>مشاهدة المبيعات وصافي الربح بعد خصم {platformPercent}%</li>
                <li>التبليغ عن التخلف → قرار المشرف</li>
              </ul>
            </article>
          </section>
        ) : null}

        {tab === "register" ? (
          <section className="rounded-2xl border border-[#ead9db] bg-white p-5">
            <h2 className="text-lg font-bold text-[#4b0a11]">تسجيل المعلم والوثائق</h2>
            <p className="mt-1 text-sm text-[#73636a]">
              مطلوب: معلومات كاملة + شهادة + صورة جواز أو هوية قبل اعتمادك من المشرف.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["fullName", "الاسم الكامل"],
                  ["email", "البريد"],
                  ["phone", "الهاتف"],
                  ["nationality", "الجنسية"],
                  ["city", "المدينة"],
                  ["country", "الدولة"],
                  ["experienceYears", "سنوات الخبرة"],
                  ["subjects", "المواد (مفصولة بفاصلة)"],
                  ["languages", "اللغات"],
                  ["workAreas", "مناطق العمل الدقيقة"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-sm">
                  <span className="mb-1 block font-semibold text-[#4b0a11]">{label}</span>
                  <input
                    className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                    value={profile[key]}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </label>
              ))}
              <label className="sm:col-span-2 text-sm">
                <span className="mb-1 block font-semibold text-[#4b0a11]">نبذة عنك</span>
                <textarea
                  className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[#4b0a11]">
                  نوع وثيقة الهوية
                </span>
                <select
                  className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                  value={profile.idDocumentType}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, idDocumentType: e.target.value }))
                  }
                >
                  <option value="passport">جواز سفر</option>
                  <option value="national_id">هوية شخصية</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-[#4b0a11]">
                  صورة الجواز / الهوية
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const { name, dataUrl } = await fileToDataUrl(file);
                    setProfile((prev) => ({
                      ...prev,
                      idDocumentName: name,
                      idDocumentDataUrl: dataUrl,
                    }));
                  }}
                />
                <span className="mt-1 block text-xs text-[#73636a]">
                  {profile.idDocumentName || "لم يُرفع بعد"}
                </span>
              </label>
              <label className="sm:col-span-2 text-sm">
                <span className="mb-1 block font-semibold text-[#4b0a11]">الشهادة</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const { name, dataUrl } = await fileToDataUrl(file);
                    setProfile((prev) => ({
                      ...prev,
                      certificateName: name,
                      certificateDataUrl: dataUrl,
                    }));
                  }}
                />
                <span className="mt-1 block text-xs text-[#73636a]">
                  {profile.certificateName || "لم تُرفع بعد"}
                </span>
              </label>
            </div>
            <button
              type="button"
              disabled={busy}
              className="mt-4 rounded-xl bg-[#9e1722] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              onClick={() =>
                post("registerTeacher", {
                  payload: {
                    id: teacherId || undefined,
                    ...profile,
                    subjects: profile.subjects.split(",").map((s) => s.trim()).filter(Boolean),
                    languages: profile.languages.split(",").map((s) => s.trim()).filter(Boolean),
                    workAreas: profile.workAreas.split(",").map((s) => s.trim()).filter(Boolean),
                    experienceYears: Number(profile.experienceYears) || 0,
                  },
                })
              }
            >
              حفظ التسجيل وإرسال للمراجعة
            </button>
            {activeTeacher?.status === "pending_review" ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                بانتظار اعتماد المشرف.{" "}
                <button
                  type="button"
                  className="font-bold text-[#9e1722] underline"
                  onClick={() =>
                    post("approveTeacher", {
                      teacherId: activeTeacher.id,
                      actor: "super_admin",
                    })
                  }
                >
                  اعتماد سريع (معاينة مشرف)
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {tab === "offers" ? (
          <section className="space-y-4">
            <article className="rounded-2xl border border-[#ead9db] bg-white p-5">
              <h2 className="text-lg font-bold text-[#4b0a11]">إنشاء / تحديث عرض حصة</h2>
              <p className="mt-1 text-sm text-[#73636a]">
                أنت تختار ما يناسبك ويعرض للطالب قبل الحجز: النوع، السعر، المدة، المنطقة، والمواعيد.
              </p>
              {!teacherId ? (
                <p className="mt-3 text-sm text-red-700">أكمل التسجيل أولًا.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold">نوع الحصة</span>
                    <select
                      className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                      value={offerForm.type}
                      onChange={(e) =>
                        setOfferForm((prev) => ({ ...prev, type: e.target.value }))
                      }
                    >
                      <option value="recorded">حصة مسجلة (رفع من عندك)</option>
                      <option value="online">أونلاين عبر المنصة + Zoom</option>
                      <option value="in_person">وجاهي فردي</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold">العنوان</span>
                    <input
                      className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                      value={offerForm.title}
                      onChange={(e) =>
                        setOfferForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="مثال: مراجعة كهرباء EST"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold">المادة</span>
                    <input
                      className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                      value={offerForm.subject}
                      onChange={(e) =>
                        setOfferForm((prev) => ({ ...prev, subject: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold">السعر (JOD)</span>
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                      value={offerForm.price}
                      onChange={(e) =>
                        setOfferForm((prev) => ({ ...prev, price: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold">مدة الحصة (دقيقة)</span>
                    <input
                      type="number"
                      min="15"
                      className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                      value={offerForm.durationMinutes}
                      onChange={(e) =>
                        setOfferForm((prev) => ({
                          ...prev,
                          durationMinutes: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold">يوم الموعد</span>
                    <input
                      className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                      value={offerForm.day}
                      onChange={(e) =>
                        setOfferForm((prev) => ({ ...prev, day: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold">من الساعة</span>
                    <input
                      type="time"
                      className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                      value={offerForm.startTime}
                      onChange={(e) =>
                        setOfferForm((prev) => ({ ...prev, startTime: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold">إلى الساعة</span>
                    <input
                      type="time"
                      className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                      value={offerForm.endTime}
                      onChange={(e) =>
                        setOfferForm((prev) => ({ ...prev, endTime: e.target.value }))
                      }
                    />
                  </label>

                  {offerForm.type === "online" ? (
                    <>
                      <label className="text-sm">
                        <span className="mb-1 block font-semibold">شبكة التواصل</span>
                        <select
                          className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                          value={offerForm.meetingProvider}
                          onChange={(e) =>
                            setOfferForm((prev) => ({
                              ...prev,
                              meetingProvider: e.target.value,
                            }))
                          }
                        >
                          <option value="platform_zoom">المنصة + Zoom</option>
                          <option value="platform_only">داخل المنصة فقط</option>
                        </select>
                      </label>
                      <label className="text-sm">
                        <span className="mb-1 block font-semibold">رابط Zoom / الاجتماع</span>
                        <input
                          className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                          value={offerForm.meetingUrl}
                          onChange={(e) =>
                            setOfferForm((prev) => ({ ...prev, meetingUrl: e.target.value }))
                          }
                          placeholder="https://zoom.us/j/..."
                        />
                      </label>
                    </>
                  ) : null}

                  {offerForm.type === "in_person" ? (
                    <>
                      <label className="text-sm">
                        <span className="mb-1 block font-semibold">المنطقة بالضبط</span>
                        <input
                          className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                          value={offerForm.area}
                          onChange={(e) =>
                            setOfferForm((prev) => ({ ...prev, area: e.target.value }))
                          }
                          placeholder="مثال: عمّان — عبدون"
                        />
                      </label>
                      <label className="text-sm">
                        <span className="mb-1 block font-semibold">اتجاه التنقل</span>
                        <select
                          className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                          value={offerForm.travelMode}
                          onChange={(e) =>
                            setOfferForm((prev) => ({
                              ...prev,
                              travelMode: e.target.value,
                            }))
                          }
                        >
                          <option value="teacher_to_student">المعلم يذهب للطالب</option>
                          <option value="student_to_teacher">الطالب يأتي للمعلم</option>
                          <option value="both">متاح للجهتين</option>
                        </select>
                      </label>
                      <label className="sm:col-span-2 text-sm">
                        <span className="mb-1 block font-semibold">ملاحظة موقع إضافية</span>
                        <input
                          className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                          value={offerForm.exactLocationNote}
                          onChange={(e) =>
                            setOfferForm((prev) => ({
                              ...prev,
                              exactLocationNote: e.target.value,
                            }))
                          }
                        />
                      </label>
                    </>
                  ) : null}

                  {offerForm.type === "recorded" ? (
                    <label className="sm:col-span-2 text-sm">
                      <span className="mb-1 block font-semibold">رفع الحصة المسجلة</span>
                      <input
                        type="file"
                        accept="video/*,.mp4,.mov,.webm"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const { name, dataUrl } = await fileToDataUrl(file);
                          setOfferForm((prev) => ({
                            ...prev,
                            recordingName: name,
                            recordingDataUrl: dataUrl,
                          }));
                        }}
                      />
                      <span className="mt-1 block text-xs text-[#73636a]">
                        {offerForm.recordingName || "لم يُرفع ملف بعد"}
                      </span>
                    </label>
                  ) : null}

                  <label className="sm:col-span-2 text-sm">
                    <span className="mb-1 block font-semibold">وصف العرض للطالب</span>
                    <textarea
                      className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                      rows={3}
                      value={offerForm.description}
                      onChange={(e) =>
                        setOfferForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                    />
                  </label>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !teacherId}
                  className="rounded-xl bg-[#9e1722] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  onClick={() =>
                    post("publishOffer", {
                      payload: {
                        teacherId,
                        type: offerForm.type,
                        title: offerForm.title,
                        subject: offerForm.subject,
                        description: offerForm.description,
                        price: Number(offerForm.price),
                        durationMinutes: Number(offerForm.durationMinutes),
                        area: offerForm.area,
                        exactLocationNote: offerForm.exactLocationNote,
                        travelMode: offerForm.travelMode,
                        meetingProvider: offerForm.meetingProvider,
                        meetingUrl: offerForm.meetingUrl,
                        recordingName: offerForm.recordingName,
                        recordingDataUrl: offerForm.recordingDataUrl,
                        status: "published",
                        scheduleSlots: [
                          {
                            day: offerForm.day,
                            startTime: offerForm.startTime,
                            endTime: offerForm.endTime,
                          },
                        ],
                      },
                    })
                  }
                >
                  نشر العرض للطالب
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-[#ead9db] bg-white p-5">
              <h2 className="text-lg font-bold text-[#4b0a11]">عروضي الحالية</h2>
              <div className="mt-3 space-y-3">
                {(data?.offers || []).length === 0 ? (
                  <p className="text-sm text-[#73636a]">لا توجد عروض بعد.</p>
                ) : (
                  (data?.offers || []).map((offer) => (
                    <div
                      key={offer.id}
                      className="rounded-xl border border-[#f0e4e6] px-4 py-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-[#301218]">{offer.title}</strong>
                        <span className="font-bold text-[#9e1722]">
                          {offer.price} {offer.currency} · {offer.durationMinutes} د
                        </span>
                      </div>
                      <p className="mt-1 text-[#73636a]">
                        {typeLabel(offer.type)}
                        {offer.type === "in_person"
                          ? ` · ${travelLabel(offer.travelMode)} · ${offer.area || "—"}`
                          : ""}
                        {offer.type === "online"
                          ? ` · ${offer.meetingProvider === "platform_zoom" ? "منصة + Zoom" : "المنصة"}`
                          : ""}
                        {offer.type === "recorded"
                          ? ` · ملف: ${offer.recordingName || "—"}`
                          : ""}
                      </p>
                      <p className="mt-1 text-xs text-[#9a711a]">
                        الحالة: {offer.status === "published" ? "منشور" : offer.status}
                      </p>
                      <Link
                        href={`/teachers/offers/${offer.id}`}
                        className="mt-2 inline-block font-bold text-[#9e1722]"
                      >
                        معاينة كما يراها الطالب ←
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        ) : null}

        {tab === "sales" ? (
          <section className="rounded-2xl border border-[#ead9db] bg-white p-5">
            <h2 className="text-lg font-bold text-[#4b0a11]">المبيعات والأرباح</h2>
            <p className="mt-1 text-sm text-[#73636a]">
              صافي ربحك = السعر − نسبة المنصة ({platformPercent}%).
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#ead9db] p-4">
                <p className="text-xs text-[#9a711a]">إجمالي المبيعات</p>
                <p className="mt-1 text-2xl font-bold">{data?.sales?.gross ?? 0} JOD</p>
              </div>
              <div className="rounded-xl border border-[#ead9db] p-4">
                <p className="text-xs text-[#9a711a]">خصم المنصة</p>
                <p className="mt-1 text-2xl font-bold">{data?.sales?.platformFee ?? 0} JOD</p>
              </div>
              <div className="rounded-xl border border-[#ead9db] p-4">
                <p className="text-xs text-[#9a711a]">صافي أرباحك</p>
                <p className="mt-1 text-2xl font-bold text-[#9e1722]">
                  {data?.sales?.teacherNet ?? 0} JOD
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {(data?.sales?.bookings || []).length === 0 ? (
                <p className="text-sm text-[#73636a]">لا حجوزات بعد.</p>
              ) : (
                data?.sales?.bookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f0e4e6] px-3 py-2 text-sm"
                  >
                    <span>
                      {b.offerSnapshot?.title || "حصة"} · {b.studentName}
                    </span>
                    <span className="font-bold">
                      صافي {b.teacherNet} / إجمالي {b.gross}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}

        {tab === "absences" ? (
          <section className="space-y-4">
            <article className="rounded-2xl border border-[#ead9db] bg-white p-5">
              <h2 className="text-lg font-bold text-[#4b0a11]">تبليغ تخلف عن حصة</h2>
              <p className="mt-1 text-sm text-[#73636a]">
                الطالب أو المعلم يبلّغ — والقرار يعود لصاحب الصلاحية (المشرف).
              </p>
              <div className="mt-3 space-y-2">
                {(data?.sales?.bookings || []).slice(0, 8).map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f0e4e6] px-3 py-2 text-sm"
                  >
                    <span>
                      {b.offerSnapshot?.title} · {b.studentName}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-[#ead9db] px-3 py-1 font-semibold"
                        onClick={() =>
                          post("reportAbsence", {
                            payload: {
                              bookingId: b.id,
                              reportedBy: "teacher",
                              reporterName: activeTeacher?.fullName || "معلم",
                              reason: "تخلف عن الموعد",
                            },
                          })
                        }
                      >
                        تبليغ كمعلم
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-[#ead9db] px-3 py-1 font-semibold"
                        onClick={() =>
                          post("reportAbsence", {
                            payload: {
                              bookingId: b.id,
                              reportedBy: "student",
                              reporterName: b.studentName,
                              reason: "المعلم لم يحضر",
                            },
                          })
                        }
                      >
                        تبليغ كطالب
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-[#ead9db] bg-white p-5">
              <h2 className="text-lg font-bold text-[#4b0a11]">قرارات المشرف</h2>
              <div className="mt-3 space-y-3">
                {(data?.pendingAbsences || []).length === 0 ? (
                  <p className="text-sm text-[#73636a]">لا بلاغات معلّقة.</p>
                ) : (
                  (data?.pendingAbsences || []).map((a) => (
                    <div key={a.id} className="rounded-xl border border-[#f0e4e6] px-3 py-3 text-sm">
                      <p>
                        بلاغ من <strong>{a.reportedBy}</strong>
                        {a.reporterName ? ` (${a.reporterName})` : ""}: {a.reason}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {["refund", "reschedule", "warn", "dismiss"].map((decision) => (
                          <button
                            key={decision}
                            type="button"
                            className="rounded-lg bg-[#9e1722] px-3 py-1.5 text-xs font-bold text-white"
                            onClick={() =>
                              post("decideAbsence", {
                                absenceId: a.id,
                                decision,
                                decidedBy: "super_admin",
                                decisionNote: `قرار مشرف: ${decision}`,
                              })
                            }
                          >
                            {decision === "refund"
                              ? "استرداد"
                              : decision === "reschedule"
                                ? "إعادة جدولة"
                                : decision === "warn"
                                  ? "إنذار"
                                  : "رفض البلاغ"}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="font-bold text-[#4b0a11]">سجل البلاغات</h3>
                {(data?.absences || []).map((a) => (
                  <p key={a.id} className="text-xs text-[#73636a]">
                    {a.id.slice(0, 8)} · {a.status}
                    {a.decision ? ` · قرار: ${a.decision} بواسطة ${a.decidedBy}` : ""}
                  </p>
                ))}
              </div>
            </article>
          </section>
        ) : null}
      </main>
    </div>
  );
}
