"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, type ReactNode } from "react";

function fileToDataUrl(file: File): Promise<{ name: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, dataUrl: String(reader.result || "") });
    reader.onerror = () => reject(new Error("FILE_READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

function TeacherRegisterForm(): ReactNode {
  const search = useSearchParams();
  const bySupervisor = useMemo(
    () =>
      search.get("by") === "supervisor" ||
      search.get("mode") === "supervisor",
    [search],
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: string; status: string } | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    city: "",
    country: "الأردن",
    aboutStudent: "",
    bio: "",
    subjects: "فيزياء, كيمياء",
    curricula: "EST, AP",
    languages: "العربية, English",
    experienceYears: "3",
    workAreas: "عمّان",
    photoName: "",
    photoDataUrl: "",
    introVideoName: "",
    introVideoUrl: "",
    introVideoDataUrl: "",
    certificateName: "",
    certificateDataUrl: "",
    idDocumentType: "passport",
    idDocumentName: "",
    idDocumentDataUrl: "",
    supervisorName: "",
  });

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone(null);
    try {
      const action = bySupervisor ? "supervisorRegisterTeacher" : "registerTeacher";
      const res = await fetch("/api/teachers-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          actor: bySupervisor ? form.supervisorName || "supervisor" : form.email,
          registeredByActor: bySupervisor
            ? form.supervisorName || "supervisor"
            : form.email,
          teacher: {
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            nationality: form.nationality,
            city: form.city,
            country: form.country,
            aboutStudent: form.aboutStudent || form.bio,
            bio: form.bio || form.aboutStudent,
            subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
            curricula: form.curricula.split(",").map((s) => s.trim()).filter(Boolean),
            languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
            experienceYears: Number(form.experienceYears) || 0,
            workAreas: form.workAreas.split(",").map((s) => s.trim()).filter(Boolean),
            photoName: form.photoName,
            photoDataUrl: form.photoDataUrl,
            introVideoName: form.introVideoName,
            introVideoUrl: form.introVideoUrl,
            introVideoDataUrl: form.introVideoDataUrl,
            certificateName: form.certificateName,
            certificateDataUrl: form.certificateDataUrl,
            idDocumentType: form.idDocumentType,
            idDocumentName: form.idDocumentName,
            idDocumentDataUrl: form.idDocumentDataUrl,
            registeredBy: bySupervisor ? "supervisor" : "self",
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "REGISTER_FAILED");
      setDone({ id: json.teacher.id, status: json.teacher.status });
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sos_teacher_id", json.teacher.id);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "REGISTER_FAILED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fff8f8] text-[#301218]" dir="rtl">
      <header className="border-b border-[#ead9db] bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] text-white">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f2d77c]">
            SUCCESS OS · TEACHER REGISTRATION
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            {bySupervisor ? "تسجيل معلم عبر المشرف المخوّل" : "تسجيل المعلم"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">
            ارفع صورتك، عرّف عن نفسك للطالب، وأضف فيديو تعريفي + الوثائق. بعد الاعتماد يمكنك إدارة
            العروض والأسعار من لوحة التحكم.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/teachers/dashboard"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#9e1722]"
            >
              لوحة تحكم المعلم
            </Link>
            <Link
              href="/teachers"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              سوق المعلمين
            </Link>
            {!bySupervisor ? (
              <Link
                href="/teachers/register?by=supervisor"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
              >
                تسجيل عبر المشرف
              </Link>
            ) : (
              <Link
                href="/teachers/register"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
              >
                تسجيل ذاتي للمعلم
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        {bySupervisor ? (
          <p className="rounded-xl border border-[#f0e0a8] bg-[#fff8e8] px-4 py-3 text-sm text-[#6a4d12]">
            وضع المشرف: يُعتمد المعلم مباشرة بعد التسجيل ويُربط بحساب المشرف في سجل التدقيق.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {done ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-lg font-bold text-emerald-900">تم التسجيل بنجاح</h2>
            <p className="mt-2 text-sm text-emerald-900/90">
              رقم المعلم: <strong>{done.id}</strong> · الحالة:{" "}
              <strong>{done.status === "approved" ? "معتمد" : "بانتظار المراجعة"}</strong>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/teachers/dashboard?teacherId=${encodeURIComponent(done.id)}`}
                className="rounded-xl bg-[#9e1722] px-4 py-2.5 text-sm font-bold text-white"
              >
                افتح لوحة التحكم
              </Link>
              <Link
                href={`/teachers/${encodeURIComponent(done.id)}`}
                className="rounded-xl border border-[#ead9db] bg-white px-4 py-2.5 text-sm font-bold text-[#9e1722]"
              >
                معاينة صفحة الأسعار والعروض
              </Link>
            </div>
          </section>
        ) : null}

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-[#ead9db] bg-white p-5"
        >
          {bySupervisor ? (
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-[#4b0a11]">اسم المشرف المخوّل</span>
              <input
                required
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={form.supervisorName}
                onChange={(e) => setField("supervisorName", e.target.value)}
                placeholder="مثال: مشرف المنطقة / Employees OS"
              />
            </label>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["fullName", "الاسم الكامل", true],
                ["email", "البريد", true],
                ["phone", "الهاتف", true],
                ["nationality", "الجنسية", false],
                ["city", "المدينة", false],
                ["country", "الدولة", false],
                ["experienceYears", "سنوات الخبرة", false],
                ["subjects", "المواد (فاصلة)", false],
                ["curricula", "المناهج التي تدرّسها", false],
                ["languages", "اللغات", false],
                ["workAreas", "مناطق العمل", false],
              ] as const
            ).map(([key, label, required]) => (
              <label key={key} className="text-sm">
                <span className="mb-1 block font-semibold text-[#4b0a11]">{label}</span>
                <input
                  required={required}
                  className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                />
              </label>
            ))}
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#4b0a11]">
              عرّف عن نفسك للطالب
            </span>
            <textarea
              required
              rows={4}
              className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
              value={form.aboutStudent}
              onChange={(e) => setField("aboutStudent", e.target.value)}
              placeholder="أسلوبك، خبرتك، وكيف تساعد الطالب…"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-[#4b0a11]">صورة شخصية للمعلم</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const { name, dataUrl } = await fileToDataUrl(file);
                setForm((prev) => ({
                  ...prev,
                  photoName: name,
                  photoDataUrl: dataUrl,
                }));
              }}
            />
            <span className="mt-1 block text-xs text-[#73636a]">
              {form.photoName || "لم تُرفع صورة بعد"}
            </span>
            {form.photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.photoDataUrl}
                alt="معاينة الصورة"
                className="mt-2 h-24 w-24 rounded-full object-cover"
              />
            ) : null}
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-[#4b0a11]">
                فيديو تعريفي (رفع ملف صغير أو رابط)
              </span>
              <input
                type="file"
                accept="video/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  // Large videos: keep filename only; optional tiny dataUrl when small.
                  if (file.size > 180000) {
                    setForm((prev) => ({
                      ...prev,
                      introVideoName: file.name,
                      introVideoDataUrl: "",
                    }));
                    return;
                  }
                  const { name, dataUrl } = await fileToDataUrl(file);
                  setForm((prev) => ({
                    ...prev,
                    introVideoName: name,
                    introVideoDataUrl: dataUrl,
                  }));
                }}
              />
              <span className="mt-1 block text-xs text-[#73636a]">
                {form.introVideoName || "اختياري — فيديو تعريفي"}
              </span>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-[#4b0a11]">
                رابط فيديو تعريفي (اختياري)
              </span>
              <input
                className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={form.introVideoUrl}
                onChange={(e) => setField("introVideoUrl", e.target.value)}
                placeholder="https://…"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-[#4b0a11]">الشهادة</span>
              <input
                required
                type="file"
                accept="image/*,.pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const { name, dataUrl } = await fileToDataUrl(file);
                  setForm((prev) => ({
                    ...prev,
                    certificateName: name,
                    certificateDataUrl: dataUrl,
                  }));
                }}
              />
              <span className="mt-1 block text-xs text-[#73636a]">
                {form.certificateName || "مطلوب"}
              </span>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-[#4b0a11]">جواز / هوية</span>
              <select
                className="mb-2 w-full rounded-xl border border-[#ead9db] px-3 py-2"
                value={form.idDocumentType}
                onChange={(e) => setField("idDocumentType", e.target.value)}
              >
                <option value="passport">جواز سفر</option>
                <option value="national_id">هوية شخصية</option>
              </select>
              <input
                required
                type="file"
                accept="image/*,.pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const { name, dataUrl } = await fileToDataUrl(file);
                  setForm((prev) => ({
                    ...prev,
                    idDocumentName: name,
                    idDocumentDataUrl: dataUrl,
                  }));
                }}
              />
              <span className="mt-1 block text-xs text-[#73636a]">
                {form.idDocumentName || "مطلوب"}
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#9e1722] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy
              ? "جاري الحفظ…"
              : bySupervisor
                ? "تسجيل واعتماد المعلم"
                : "إرسال طلب التسجيل"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function TeacherRegisterPage(): ReactNode {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fff8f8] p-8 text-[#301218]" dir="rtl">
          جاري التحميل…
        </div>
      }
    >
      <TeacherRegisterForm />
    </Suspense>
  );
}
