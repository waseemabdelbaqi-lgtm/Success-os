"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type Offer = {
  id: string;
  title: string;
  type: string;
  subject?: string;
  curriculum?: string;
  price: number;
  currency: string;
  durationMinutes: number;
  status: string;
  recordingName?: string;
};

type Teacher = {
  id: string;
  fullName: string;
  status: string;
  email: string;
  aboutStudent?: string;
  photoDataUrl?: string;
  introVideoName?: string;
  introVideoUrl?: string;
  subjects?: string[];
  curricula?: string[];
};

type Snapshot = {
  platformPercent: number;
  teacher: Teacher | null;
  offers: Offer[];
  sales: {
    bookingsCount: number;
    gross: number;
    platformFee: number;
    teacherNet: number;
  } | null;
};

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
  if (type === "online") return "أونلاين";
  if (type === "in_person") return "وجاهي";
  return type;
}

function TeacherDashboardInner(): ReactNode {
  const search = useSearchParams();
  const [teacherId, setTeacherId] = useState("");
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [offerForm, setOfferForm] = useState({
    type: "recorded",
    title: "",
    subject: "",
    curriculum: "",
    description: "",
    price: "20",
    durationMinutes: "45",
    recordingName: "",
    recordingUrl: "",
    recordingDataUrl: "",
    status: "published",
  });

  useEffect(() => {
    const fromQuery = search.get("teacherId") || "";
    const fromStorage =
      typeof window !== "undefined"
        ? window.localStorage.getItem("sos_teacher_id") || ""
        : "";
    setTeacherId(fromQuery || fromStorage);
  }, [search]);

  const load = useCallback(async () => {
    if (!teacherId) {
      setData(null);
      return;
    }
    setError("");
    const res = await fetch(
      `/api/teachers-os?teacherId=${encodeURIComponent(teacherId)}`,
      { cache: "no-store" },
    );
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || "LOAD_FAILED");
    setData(json as Snapshot);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sos_teacher_id", teacherId);
    }
  }, [teacherId]);

  useEffect(() => {
    load().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "LOAD_FAILED"),
    );
  }, [load]);

  async function saveOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!teacherId) {
      setError("أدخل رقم المعلم أولاً");
      return;
    }
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/teachers-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsertOffer",
          offer: {
            teacherId,
            ...offerForm,
            price: Number(offerForm.price),
            durationMinutes: Number(offerForm.durationMinutes),
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "SAVE_FAILED");
      setMessage("تم حفظ العرض / الحصة");
      setOfferForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        recordingName: "",
        recordingUrl: "",
        recordingDataUrl: "",
      }));
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "SAVE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  const teacher = data?.teacher;
  const kpis = useMemo(
    () => [
      { label: "نسبة المنصة", value: `${data?.platformPercent ?? 10}%` },
      { label: "صافي أرباحك", value: data?.sales ? `${data.sales.teacherNet} JOD` : "—" },
      { label: "المبيعات", value: data?.sales ? `${data.sales.gross} JOD` : "—" },
      {
        label: "عروض منشورة",
        value: (data?.offers || []).filter((o) => o.status === "published").length,
      },
    ],
    [data],
  );

  return (
    <div className="min-h-screen bg-[#fff8f8] text-[#301218]" dir="rtl">
      <header className="border-b border-[#ead9db] bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f2d77c]">
            SUCCESS OS · TEACHER CONTROL
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">لوحة تحكم المعلم</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/85">
            إدارة التعريف، الحصص المسجلة، الأسعار والعروض، ومتابعة الأرباح بعد خصم المنصة.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/teachers/register"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#9e1722]"
            >
              تسجيل معلم
            </Link>
            {teacherId ? (
              <Link
                href={`/teachers/${encodeURIComponent(teacherId)}`}
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
              >
                معاينة أسعاري وعروضي
              </Link>
            ) : null}
            <Link
              href="/dashboard/teachers"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              Teachers OS الكامل
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
        <label className="block rounded-2xl border border-[#ead9db] bg-white p-4 text-sm">
          <span className="mb-1 block font-semibold text-[#4b0a11]">رقم المعلم</span>
          <div className="flex flex-wrap gap-2">
            <input
              className="min-w-[220px] flex-1 rounded-xl border border-[#ead9db] px-3 py-2"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value.trim())}
              placeholder="الصق رقم المعلم بعد التسجيل"
            />
            <button
              type="button"
              onClick={() => load().catch(() => {})}
              className="rounded-xl bg-[#9e1722] px-4 py-2 font-bold text-white"
            >
              تحديث
            </button>
          </div>
        </label>

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

        {teacher ? (
          <section className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="rounded-2xl border border-[#ead9db] bg-white p-4 text-center">
              {teacher.photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={teacher.photoDataUrl}
                  alt={teacher.fullName}
                  className="mx-auto h-28 w-28 rounded-full object-cover"
                />
              ) : (
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#f3e4e6] text-2xl font-bold text-[#9e1722]">
                  {teacher.fullName.slice(0, 1)}
                </div>
              )}
              <h2 className="mt-3 text-lg font-bold text-[#4b0a11]">{teacher.fullName}</h2>
              <p className="text-xs text-[#73636a]">
                {teacher.status === "approved" ? "معتمد" : "بانتظار المراجعة"}
              </p>
            </div>
            <div className="rounded-2xl border border-[#ead9db] bg-white p-5">
              <h3 className="font-bold text-[#4b0a11]">تعريفك للطالب</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#73636a]">
                {teacher.aboutStudent || "لم تُضف تعريفاً بعد — عدّل من صفحة التسجيل."}
              </p>
              <p className="mt-3 text-xs text-[#9a711a]">
                فيديو تعريفي: {teacher.introVideoName || teacher.introVideoUrl || "غير مرفوع"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/teachers/register`}
                  className="text-sm font-bold text-[#9e1722]"
                >
                  تحديث الملف / الصورة / الفيديو
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <p className="rounded-xl border border-[#ead9db] bg-white px-4 py-3 text-sm text-[#73636a]">
            لا يوجد ملف معلم محمّل.{" "}
            <Link href="/teachers/register" className="font-bold text-[#9e1722]">
              سجّل الآن
            </Link>
          </p>
        )}

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

        <section className="rounded-2xl border border-[#ead9db] bg-white p-5">
          <h2 className="text-lg font-bold text-[#4b0a11]">إضافة حصة / عرض سعر</h2>
          <p className="mt-1 text-sm text-[#73636a]">
            يمكن رفع حصص مسجلة لأي منهج تستطيع تدريسه، أو عروض أونلاين/وجاهي.
          </p>
          <form onSubmit={saveOffer} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-semibold">نوع العرض</span>
              <select
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={offerForm.type}
                onChange={(e) =>
                  setOfferForm((prev) => ({ ...prev, type: e.target.value }))
                }
              >
                <option value="recorded">حصة مسجلة</option>
                <option value="online">أونلاين عبر المنصة</option>
                <option value="in_person">وجاهي</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold">العنوان</span>
              <input
                required
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={offerForm.title}
                onChange={(e) =>
                  setOfferForm((prev) => ({ ...prev, title: e.target.value }))
                }
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
              <span className="mb-1 block font-semibold">المنهج</span>
              <input
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={offerForm.curriculum}
                onChange={(e) =>
                  setOfferForm((prev) => ({ ...prev, curriculum: e.target.value }))
                }
                placeholder="EST / AP / IGCSE…"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold">السعر</span>
              <input
                required
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
              <span className="mb-1 block font-semibold">المدة (دقيقة)</span>
              <input
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
            {offerForm.type === "recorded" ? (
              <>
                <label className="text-sm">
                  <span className="mb-1 block font-semibold">ملف الحصة المسجلة</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 180000) {
                        setOfferForm((prev) => ({
                          ...prev,
                          recordingName: file.name,
                          recordingDataUrl: "",
                        }));
                        return;
                      }
                      const { name, dataUrl } = await fileToDataUrl(file);
                      setOfferForm((prev) => ({
                        ...prev,
                        recordingName: name,
                        recordingDataUrl: dataUrl,
                      }));
                    }}
                  />
                  <span className="mt-1 block text-xs text-[#73636a]">
                    {offerForm.recordingName || "مطلوب للحصة المسجلة"}
                  </span>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-semibold">رابط التسجيل (اختياري)</span>
                  <input
                    className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                    value={offerForm.recordingUrl}
                    onChange={(e) =>
                      setOfferForm((prev) => ({
                        ...prev,
                        recordingUrl: e.target.value,
                      }))
                    }
                  />
                </label>
              </>
            ) : null}
            <label className="sm:col-span-2 text-sm">
              <span className="mb-1 block font-semibold">وصف العرض</span>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={offerForm.description}
                onChange={(e) =>
                  setOfferForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="sm:col-span-2 rounded-xl bg-[#9e1722] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? "جاري الحفظ…" : "نشر العرض"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-[#ead9db] bg-white p-5">
          <h2 className="text-lg font-bold text-[#4b0a11]">عروضي الحالية</h2>
          <div className="mt-3 space-y-2">
            {(data?.offers || []).length === 0 ? (
              <p className="text-sm text-[#73636a]">لا توجد عروض بعد.</p>
            ) : (
              (data?.offers || []).map((offer) => (
                <article
                  key={offer.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f0e4e6] px-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-bold text-[#4b0a11]">{offer.title}</p>
                    <p className="text-xs text-[#73636a]">
                      {typeLabel(offer.type)} · {offer.curriculum || "—"} ·{" "}
                      {offer.durationMinutes} د · {offer.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <strong>
                      {offer.price} {offer.currency}
                    </strong>
                    <Link
                      href={`/teachers/offers/${offer.id}`}
                      className="font-bold text-[#9e1722]"
                    >
                      معاينة
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

export default function TeacherDashboardPage(): ReactNode {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fff8f8] p-8" dir="rtl">
          جاري التحميل…
        </div>
      }
    >
      <TeacherDashboardInner />
    </Suspense>
  );
}
