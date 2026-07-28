"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type Offer = {
  id: string;
  teacherId: string;
  title: string;
  type: string;
  subject?: string;
  description?: string;
  price: number;
  currency: string;
  durationMinutes: number;
  area?: string;
  exactLocationNote?: string;
  travelMode?: string;
  meetingProvider?: string;
  meetingUrl?: string;
  recordingName?: string;
  scheduleSlots?: { day: string; startTime: string; endTime: string }[];
  status: string;
};

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
 * Student-facing offer details — everything before booking.
 */
export default function TeacherOfferDetailPage(): ReactNode {
  const params = useParams<{ offerId: string }>();
  const offerId = params?.offerId;
  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState("");
  const [bookingMsg, setBookingMsg] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  useEffect(() => {
    if (!offerId) return;
    fetch(`/api/teachers-os?view=offer&offerId=${encodeURIComponent(offerId)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error || "NOT_FOUND");
        setOffer(json.offer);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "LOAD_FAILED"),
      );
  }, [offerId]);

  async function book() {
    setBookingMsg("");
    setError("");
    const res = await fetch("/api/teachers-os", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "createBooking",
        payload: {
          offerId,
          studentName: studentName || "طالب",
          studentEmail,
          scheduledAt: new Date().toISOString(),
        },
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json.error || "BOOKING_FAILED");
      return;
    }
    setBookingMsg(
      `تم الحجز. صافي المعلم ${json.booking.teacherNet} بعد خصم المنصة ${json.booking.platformPercent}% (${json.booking.platformFee}).`,
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f8] text-[#301218]" dir="rtl">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/teachers" className="text-sm font-bold text-[#9e1722]">
          ← سوق المعلمين
        </Link>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {!offer && !error ? (
          <p className="mt-8 text-sm text-[#73636a]">جاري التحميل…</p>
        ) : null}
        {offer ? (
          <article className="mt-6 rounded-3xl border border-[#ead9db] bg-white p-6 shadow-[0_16px_40px_rgba(75,10,17,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a711a]">
              تفاصيل العرض للطالب
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-sos-display)] text-3xl font-semibold text-[#4b0a11]">
              {offer.title}
            </h1>
            <p className="mt-2 text-sm text-[#73636a]">{offer.description || "—"}</p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-xl border border-[#f0e4e6] p-3">
                <dt className="text-[#9a711a]">النوع</dt>
                <dd className="mt-1 font-bold">{typeLabel(offer.type)}</dd>
              </div>
              <div className="rounded-xl border border-[#f0e4e6] p-3">
                <dt className="text-[#9a711a]">السعر والمدة</dt>
                <dd className="mt-1 font-bold">
                  {offer.price} {offer.currency} · {offer.durationMinutes} دقيقة
                </dd>
              </div>
              <div className="rounded-xl border border-[#f0e4e6] p-3">
                <dt className="text-[#9a711a]">المادة</dt>
                <dd className="mt-1 font-bold">{offer.subject || "—"}</dd>
              </div>
              {offer.type === "online" ? (
                <div className="rounded-xl border border-[#f0e4e6] p-3">
                  <dt className="text-[#9a711a]">الأونلاين</dt>
                  <dd className="mt-1 font-bold">
                    {offer.meetingProvider === "platform_zoom"
                      ? "عبر المنصة مع ربط Zoom"
                      : "داخل المنصة"}
                  </dd>
                  {offer.meetingUrl ? (
                    <dd className="mt-1 text-xs break-all text-[#73636a]">
                      رابط الاجتماع يُفعَّل بعد التأكيد: {offer.meetingUrl}
                    </dd>
                  ) : null}
                </div>
              ) : null}
              {offer.type === "in_person" ? (
                <>
                  <div className="rounded-xl border border-[#f0e4e6] p-3">
                    <dt className="text-[#9a711a]">المنطقة</dt>
                    <dd className="mt-1 font-bold">{offer.area || "—"}</dd>
                    {offer.exactLocationNote ? (
                      <dd className="mt-1 text-xs text-[#73636a]">
                        {offer.exactLocationNote}
                      </dd>
                    ) : null}
                  </div>
                  <div className="rounded-xl border border-[#f0e4e6] p-3">
                    <dt className="text-[#9a711a]">التنقل</dt>
                    <dd className="mt-1 font-bold">{travelLabel(offer.travelMode)}</dd>
                  </div>
                </>
              ) : null}
              {offer.type === "recorded" ? (
                <div className="rounded-xl border border-[#f0e4e6] p-3">
                  <dt className="text-[#9a711a]">الحصة المسجلة</dt>
                  <dd className="mt-1 font-bold">{offer.recordingName || "ملف مرفوع"}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-5">
              <h2 className="font-bold text-[#4b0a11]">المواعيد المتاحة</h2>
              <ul className="mt-2 space-y-1 text-sm text-[#73636a]">
                {(offer.scheduleSlots || []).map((slot, i) => (
                  <li key={`${slot.day}-${i}`}>
                    {slot.day}: {slot.startTime} – {slot.endTime}
                  </li>
                ))}
                {(offer.scheduleSlots || []).length === 0 ? <li>—</li> : null}
              </ul>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-xl border border-[#ead9db] px-3 py-2 text-sm"
                placeholder="اسمك"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
              <input
                className="rounded-xl border border-[#ead9db] px-3 py-2 text-sm"
                placeholder="بريدك"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={book}
              className="mt-4 w-full rounded-xl bg-[#9e1722] px-4 py-3 text-sm font-bold text-white"
            >
              احجز هذه الحصة
            </button>
            {bookingMsg ? (
              <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                {bookingMsg}
              </p>
            ) : null}
            <p className="mt-4 text-xs text-[#73636a]">
              في حال التخلف عن الحصة يمكن للطالب أو المعلم التبليغ، والقرار يعود للمشرف.
            </p>
          </article>
        ) : null}
      </main>
    </div>
  );
}
