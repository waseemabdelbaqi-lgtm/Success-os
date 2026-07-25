"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Criteria {
  min_gpa: number;
  requirements_text: string;
  avg_living_cost?: string | null;
  deadline_date?: string | null;
  is_accredited_in_home_country?: boolean | null;
}

export interface InstitutionCardProps {
  id: string;
  name: string;
  type: "university" | "college" | "school";
  logo_url?: string | null;
  is_partner: boolean;
  matchedCriteria: Criteria | null;
  /** Optional profile fields forwarded to /api/checkout for Stripe mode */
  userId?: string;
  customerEmail?: string;
  fullName?: string;
  nationality?: string;
  gpa?: number;
  targetDegree?: string;
  major?: string;
}

/**
 * بطاقة مؤسسة تعليمية — التقديم يوجّه الطالب مباشرة إلى جلسة دفع Stripe ($5)
 */
export default function InstitutionCard({
  id,
  name,
  type,
  logo_url,
  is_partner,
  matchedCriteria,
  userId,
  customerEmail,
  fullName,
  nationality,
  gpa,
  targetDegree,
  major,
}: InstitutionCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    try {
      // استدعاء Route Handler لتوليد جلسة الدفع
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionId: id,
          userId,
          customerEmail,
          fullName,
          nationality,
          gpa,
          targetDegree,
          major,
        }),
      });

      const data = (await response.json()) as {
        url?: string;
        error?: string;
        mode?: string;
      };

      if (data.url) {
        try {
          sessionStorage.setItem("sos_paid_institution", id);
        } catch {
          // ignore private-mode / SSR edge cases
        }

        // Stripe Hosted Checkout is absolute; preview unlocks use same-origin paths
        if (/^https?:\/\//i.test(data.url)) {
          window.location.href = data.url;
        } else {
          router.push(data.url);
        }
        return;
      }

      alert(data.error || "حدث خطأ أثناء الانتقال لبوابة الدفع");
    } catch (error) {
      console.error("Payment redirect error:", error);
      alert("فشل الاتصال بخادم الدفع");
    } finally {
      setLoading(false);
    }
  };

  const typeLabels = { university: "جامعة", college: "كلية", school: "مدرسة" } as const;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-[#ead9db] bg-white p-6 shadow-md transition-all hover:shadow-lg">
      <div>
        {/* ترويسة بطاقة المؤسسة التعليمية */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              is_partner
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {is_partner ? "⚡ شريك رسمي (تواصل فوري)" : "✉️ تقديم خارجي عبر البريد"}
          </span>
          <span className="rounded-md bg-[#fff8f8] px-2.5 py-1 text-xs text-[#73636a]">
            {typeLabels[type]}
          </span>
        </div>

        <div className="mb-4 flex items-center gap-4">
          {logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote institution logos
            <img
              src={logo_url}
              alt={name}
              className="h-14 w-14 rounded-lg object-cover bg-[#fff8f8]"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#fff0f1] text-xl font-bold text-[#9e1722]">
              {name.charAt(0)}
            </div>
          )}
          <h3 className="text-lg font-bold text-[#301218]">{name}</h3>
        </div>

        {/* عرض الشروط المخصصة لجنسية الطالب المقبولة فقط */}
        <div className="mb-6 rounded-lg bg-[#fff8f8] p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#4d3439]">
            📋 شروط القبول لجنسيتك:
          </p>
          {matchedCriteria ? (
            <div className="space-y-1.5 text-xs text-[#73636a]">
              <p>
                • الحد الأدنى للمعدل المطلـوب:{" "}
                <span className="font-bold text-[#9e1722]">{matchedCriteria.min_gpa}</span>
              </p>
              {matchedCriteria.avg_living_cost ? (
                <p>
                  • متوسط تكلفة المعيشة:{" "}
                  <span className="font-semibold text-[#4d3439]">
                    {matchedCriteria.avg_living_cost}
                  </span>
                </p>
              ) : null}
              {matchedCriteria.deadline_date ? (
                <p>
                  • آخر موعد للتقديم:{" "}
                  <span className="font-semibold text-[#4d3439]" dir="ltr">
                    {matchedCriteria.deadline_date}
                  </span>
                </p>
              ) : null}
              {typeof matchedCriteria.is_accredited_in_home_country === "boolean" ? (
                <p>
                  • الاعتراف في بلدك:{" "}
                  <span
                    className={
                      matchedCriteria.is_accredited_in_home_country
                        ? "font-semibold text-green-700"
                        : "font-semibold text-amber-700"
                    }
                  >
                    {matchedCriteria.is_accredited_in_home_country
                      ? "معتمدة ✓"
                      : "يُرجى التحقق من الاعتراف"}
                  </span>
                </p>
              ) : null}
              <p className="whitespace-pre-line leading-relaxed">
                • {matchedCriteria.requirements_text}
              </p>
            </div>
          ) : (
            <p className="text-xs italic text-[#73636a]">يتم تطبيق الشروط العامة للمؤسسة.</p>
          )}
        </div>
      </div>

      {/* نافذة التقديم وبوابة الدفع */}
      <button
        type="button"
        onClick={handleApply}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#9e1722] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#7f121b] disabled:opacity-50"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            <span>التقديم والذهاب لنافذة الدفع</span>
            <span className="rounded bg-[#7f121b] px-2 py-0.5 text-xs font-bold text-white">5$</span>
          </>
        )}
      </button>
    </div>
  );
}
