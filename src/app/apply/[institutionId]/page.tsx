"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitApplication } from "@/actions/submitApplication";
import {
  readAdmissionProfile,
  readPaymentUnlock,
  writePaymentUnlock,
} from "@/src/lib/admission/profile-session";

interface PageProps {
  params: Promise<{ institutionId: string }>;
  searchParams: Promise<{
    success?: string;
    paid?: string;
    session_id?: string;
    payment_id?: string;
    unlock_token?: string;
    preview?: string;
  }>;
}

/**
 * صفحة التقديم الموحد — تُفتح فقط بعد دفع رسوم الـ $5 عبر Stripe (أو معاينة آمنة)
 */
export default function ApplyPage({ params, searchParams }: PageProps) {
  const router = useRouter();
  const { institutionId } = use(params);
  const query = use(searchParams);

  const paidOk = query.success === "true" || query.paid === "1";

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [unlockToken, setUnlockToken] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function confirmUnlock() {
      if (!paidOk) {
        setChecking(false);
        return;
      }

      try {
        if (query.session_id) {
          const res = await fetch("/api/checkout/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: query.session_id }),
          });
          const data = (await res.json()) as {
            paymentId?: string;
            unlockToken?: string;
            status?: string;
          };
          if (
            !cancelled &&
            data.status === "completed" &&
            data.paymentId &&
            data.unlockToken
          ) {
            setPaymentId(data.paymentId);
            setUnlockToken(data.unlockToken);
            writePaymentUnlock({
              paymentId: data.paymentId,
              unlockToken: data.unlockToken,
              institutionId,
            });
            setUnlocked(true);
            setChecking(false);
            return;
          }
        }

        if (query.payment_id && query.unlock_token) {
          const res = await fetch("/api/checkout/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: query.payment_id }),
          });
          const data = (await res.json()) as { status?: string };
          if (!cancelled && data.status === "completed") {
            setPaymentId(query.payment_id);
            setUnlockToken(query.unlock_token);
            writePaymentUnlock({
              paymentId: query.payment_id,
              unlockToken: query.unlock_token,
              institutionId,
            });
            setUnlocked(true);
            setChecking(false);
            return;
          }
        }

        const stored = readPaymentUnlock(institutionId);
        if (!cancelled && stored) {
          setPaymentId(stored.paymentId);
          setUnlockToken(stored.unlockToken);
          setUnlocked(true);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    void confirmUnlock();
    return () => {
      cancelled = true;
    };
  }, [
    institutionId,
    paidOk,
    query.payment_id,
    query.session_id,
    query.unlock_token,
  ]);

  // التأكد من أن الطالب قادم من بوابة دفع ناجحة عبر Stripe
  if (!paidOk) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#fff8f8] p-4 text-center"
        dir="rtl"
      >
        <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 shadow-md">
          <div className="mb-3 text-4xl text-red-500">⚠️</div>
          <h2 className="mb-2 text-xl font-bold text-[#301218]">وصول غير مصرح به</h2>
          <p className="mb-6 text-sm text-[#73636a]">
            يجب إتمام رسوم الخدمة البالغة 5 دولار أولاً قبل رفع المستندات وتعبئة بيانات التقديم.
          </p>
          <button
            type="button"
            onClick={() => router.push("/admission")}
            className="rounded-xl bg-[#9e1722] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#7f121b]"
          >
            العودة للمؤسسات ودفع الرسوم
          </button>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f8] text-sm text-[#73636a]" dir="rtl">
        جاري التحقق من عملية الدفع…
      </div>
    );
  }

  if (!unlocked || !paymentId || !unlockToken) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#fff8f8] p-4 text-center"
        dir="rtl"
      >
        <div className="max-w-md rounded-2xl border border-amber-100 bg-white p-8 shadow-md">
          <h2 className="mb-2 text-xl font-bold text-[#301218]">لم يكتمل تأكيد الدفع بعد</h2>
          <p className="mb-6 text-sm text-[#73636a]">
            إذا أنهيت الدفع للتو، انتظر لحظات ثم أعد المحاولة. وإلا ارجع لصفحة المؤسسات وأكمل رسوم الـ
            $5.
          </p>
          <button
            type="button"
            onClick={() => router.push("/admission")}
            className="rounded-xl bg-[#9e1722] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#7f121b]"
          >
            العودة للمؤسسات
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("paymentId", paymentId);
      formData.set("unlockToken", unlockToken);

      const profile = readAdmissionProfile();
      if (profile) {
        formData.set("fullName", profile.fullName || "Applicant");
        if (profile.email) formData.set("email", profile.email);
        if (profile.phone) formData.set("phone", profile.phone);
        formData.set("nationality", profile.nationality);
        formData.set("gpa", String(profile.gpa));
        formData.set("targetDegree", profile.targetDegree);
        formData.set("major", profile.major);
        if (profile.userId) formData.set("userId", profile.userId);
      }

      // استدعاء الـ Server Action للمسار المزدوج (مع رفع الملفات إلى التخزين)
      const result = await submitApplication(formData, institutionId);

      if (result?.success) {
        setMessage(
          "🎉 تم إرسال طلبك بنجاح! تم توجيه الطلب آلياً إلى الجهة المعنية وسيتواصل معك النظام بالاشعارات.",
        );
        setTimeout(() => router.push("/admission"), 4000);
      } else {
        setMessage(`❌ خطأ: ${result?.error || "فشل في إرسال المستندات"}`);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "فشل في إرسال المستندات";
      setMessage(`❌ خطأ: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fff8f8] px-4 py-12 sm:px-6 lg:px-8" dir="rtl">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#ead9db] bg-white p-8 shadow-sm">
        {/* ترويسة الصفحة وثيقة النجاح المالي */}
        <div className="mb-6 border-b border-[#ead9db] pb-6">
          <div className="mb-3 flex w-fit items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
            <span>✓</span> تم تأكيد دفع رسوم معالجة الخدمة (5.00$ USD)
          </div>
          <h1 className="font-[family-name:var(--font-sos-display)] text-2xl font-black text-[#301218]">
            📄 استمارة رفع المستندات وبيانات التقديم
          </h1>
          <p className="mt-1 text-sm text-[#73636a]">
            يرجى رفع المستندات الرسمية المطلوبة لاستكمال إرسال ملفك للجامعة.
          </p>
        </div>

        {/* نموذج التقديم الموحد */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#4d3439]">
              📄 كشف الدرجات الأكاديمي الحالي (Transcript)
            </label>
            <div className="rounded-xl border-2 border-dashed border-[#ead9db] bg-[#fff8f8] p-4 text-center transition-colors hover:border-[#9e1722]">
              <input
                type="file"
                name="transcript"
                accept=".pdf,.jpg,.png"
                required
                className="block w-full text-xs text-[#73636a] file:ml-4 file:rounded-lg file:border-0 file:bg-[#fff0f1] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#9e1722] hover:file:bg-[#f2dadd]"
              />
              <p className="mt-2 text-[11px] text-[#73636a]">
                الملفات المدعومة: PDF, JPG, PNG بمساحة لا تتعدى 5 ميجابايت.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#4d3439]">
              🛂 نسخة واضحة من جواز السفر (Passport)
            </label>
            <div className="rounded-xl border-2 border-dashed border-[#ead9db] bg-[#fff8f8] p-4 text-center transition-colors hover:border-[#9e1722]">
              <input
                type="file"
                name="passport"
                accept=".pdf,.jpg,.png"
                required
                className="block w-full text-xs text-[#73636a] file:ml-4 file:rounded-lg file:border-0 file:bg-[#fff0f1] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#9e1722] hover:file:bg-[#f2dadd]"
              />
              <p className="mt-2 text-[11px] text-[#73636a]">
                تأكد من أن البيانات وتاريخ الصلاحية واضح تماماً للمراجعة.
              </p>
            </div>
          </div>

          {message ? (
            <div
              className={`rounded-xl p-4 text-sm font-medium ${
                message.includes("❌")
                  ? "border border-red-100 bg-red-50 text-red-700"
                  : "border border-green-100 bg-green-50 text-green-700"
              }`}
            >
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#9e1722] px-4 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#7f121b] disabled:opacity-50"
          >
            {uploading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>جاري معالجة المستندات وإرسال الملف...</span>
              </>
            ) : (
              <span>تأكيد التقديم النهائي وإرسال المعاملة</span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
