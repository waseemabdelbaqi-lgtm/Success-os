"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type Offer = {
  id: string;
  title: string;
  type: string;
  subject?: string;
  curriculum?: string;
  description?: string;
  price: number;
  currency: string;
  durationMinutes: number;
  area?: string;
  travelMode?: string;
  recordingName?: string;
};

type TeacherCard = {
  id: string;
  fullName: string;
  city?: string;
  country?: string;
  aboutStudent?: string;
  subjects?: string[];
  curricula?: string[];
  languages?: string[];
  experienceYears?: number;
  workAreas?: string[];
  photoDataUrl?: string;
  introVideoName?: string;
  introVideoUrl?: string;
  status: string;
};

function typeLabel(type: string) {
  if (type === "recorded") return "حصة مسجلة";
  if (type === "online") return "أونلاين عبر المنصة";
  if (type === "in_person") return "وجاهي فردي";
  return type;
}

/**
 * Public teacher preview — about, intro video, prices & offers before booking.
 */
export default function TeacherPreviewPage(): ReactNode {
  const params = useParams<{ teacherId: string }>();
  const teacherId = params?.teacherId;
  const [teacher, setTeacher] = useState<TeacherCard | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!teacherId) return;
    fetch(`/api/teachers-os?view=preview&teacherId=${encodeURIComponent(teacherId)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error || "NOT_FOUND");
        setTeacher(json.preview.teacher);
        setOffers(json.preview.offers || []);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "LOAD_FAILED"),
      );
  }, [teacherId]);

  return (
    <div className="min-h-screen bg-[#fff8f8] text-[#301218]" dir="rtl">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-3 text-sm font-bold">
          <Link href="/teachers" className="text-[#9e1722]">
            ← سوق المعلمين
          </Link>
          <Link href="/teachers/dashboard" className="text-[#73636a]">
            لوحة المعلم
          </Link>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {!teacher && !error ? (
          <p className="text-sm text-[#73636a]">جاري تحميل ملف المعلم…</p>
        ) : null}

        {teacher ? (
          <>
            <section className="overflow-hidden rounded-3xl border border-[#ead9db] bg-white">
              <div className="bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] px-6 py-8 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f2d77c]">
                  TEACHER PREVIEW · SUCCESS OS
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-5">
                  {teacher.photoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={teacher.photoDataUrl}
                      alt={teacher.fullName}
                      className="h-24 w-24 rounded-full border-2 border-white/40 object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/15 text-3xl font-bold">
                      {teacher.fullName.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-semibold sm:text-4xl">{teacher.fullName}</h1>
                    <p className="mt-1 text-sm text-white/85">
                      {(teacher.subjects || []).join(" · ") || "معلم معتمد"}
                      {teacher.city ? ` · ${teacher.city}` : ""}
                      {teacher.country ? `، ${teacher.country}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[#f2d77c]">
                      خبرة {teacher.experienceYears || 0} سنة · مناهج:{" "}
                      {(teacher.curricula || []).join("، ") || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-6 py-6">
                <div>
                  <h2 className="text-lg font-bold text-[#4b0a11]">عن المعلم</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#73636a]">
                    {teacher.aboutStudent || "سيضيف المعلم تعريفاً قريباً."}
                  </p>
                </div>

                {(teacher.introVideoUrl || teacher.introVideoName) && (
                  <div>
                    <h2 className="text-lg font-bold text-[#4b0a11]">فيديو تعريفي</h2>
                    {teacher.introVideoUrl ? (
                      <div className="mt-2 aspect-video overflow-hidden rounded-2xl bg-black">
                        <iframe
                          title="فيديو تعريفي"
                          src={teacher.introVideoUrl}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[#73636a]">
                        فيديو مرفوع على المنصة: {teacher.introVideoName}
                      </p>
                    )}
                  </div>
                )}

                {(teacher.workAreas || []).length ? (
                  <p className="text-sm text-[#73636a]">
                    مناطق العمل: {(teacher.workAreas || []).join(" · ")}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="mt-8">
              <header className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a711a]">
                  PRICES & OFFERS
                </p>
                <h2 className="text-2xl font-bold text-[#4b0a11]">الأسعار والعروض</h2>
                <p className="mt-1 text-sm text-[#73636a]">
                  اطّلع على التفاصيل قبل الحجز. عمولة المنصة تُخصم داخلياً من المعلم.
                </p>
              </header>

              {offers.length === 0 ? (
                <p className="rounded-2xl border border-[#ead9db] bg-white px-4 py-5 text-sm text-[#73636a]">
                  لا توجد عروض منشورة حالياً لهذا المعلم.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {offers.map((offer) => (
                    <article
                      key={offer.id}
                      className="rounded-2xl border border-[#ead9db] bg-white p-5"
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a711a]">
                        {typeLabel(offer.type)}
                        {offer.curriculum ? ` · ${offer.curriculum}` : ""}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-[#4b0a11]">{offer.title}</h3>
                      <p className="mt-1 text-sm text-[#73636a]">
                        {offer.subject || "—"} · {offer.durationMinutes} دقيقة
                        {offer.area ? ` · ${offer.area}` : ""}
                      </p>
                      {offer.description ? (
                        <p className="mt-2 line-clamp-3 text-sm text-[#73636a]">
                          {offer.description}
                        </p>
                      ) : null}
                      {offer.recordingName ? (
                        <p className="mt-2 text-xs text-[#9e1722]">
                          حصة مسجلة: {offer.recordingName}
                        </p>
                      ) : null}
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <strong className="text-xl text-[#4b0a11]">
                          {offer.price} {offer.currency}
                        </strong>
                        <Link
                          href={`/teachers/offers/${offer.id}`}
                          className="rounded-xl bg-[#9e1722] px-4 py-2 text-sm font-bold text-white"
                        >
                          تفاصيل الحجز
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
