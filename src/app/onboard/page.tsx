"use client";

import { useRouter } from "next/navigation";
import { writeAdmissionProfile } from "@/src/lib/admission/profile-session";
import type { AdmissionProfileInput } from "@/src/types/admission";

/**
 * شاشة تعريف مبسّطة — الجنسية والمعدل فقط.
 * عند الإرسال: تُمرَّر البيانات عبر الرابط إلى لوحة الاكتشاف.
 */
export default function OnboardPage() {
  const router = useRouter();

  const handleStart = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nationality = String(formData.get("nationality") || "").trim();
    const gpa = String(formData.get("gpa") || "").trim();
    if (!nationality || !gpa) return;

    const profile: AdmissionProfileInput = {
      fullName: "",
      nationality,
      gpa: Number(gpa),
      targetDegree: "bachelor",
      major: "General",
    };
    writeAdmissionProfile(profile);

    // مواصفات المنصة: /?nationality=X&gpa=Y → middleware يحوّل إلى /admission
    router.push(
      `/?nationality=${encodeURIComponent(nationality)}&gpa=${encodeURIComponent(gpa)}`,
    );
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#fff8f8] p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#ead9db] bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <span className="text-4xl">🌍</span>
          <h1 className="mt-2 font-[family-name:var(--font-sos-display)] text-2xl font-black text-[#301218]">
            مرحباً بك في منصة التقديم الموحد
          </h1>
          <p className="mt-1 text-sm text-[#73636a]">
            أدخل جنسيتك ومعدلك فقط — سنعرض لك الجامعات المتوافقة فوراً مع شروط قبول حية.
          </p>
        </div>

        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#4d3439]">
              جنسيتك الحالية
            </label>
            <select
              name="nationality"
              required
              defaultValue="Egyptian"
              className="w-full rounded-xl border border-[#ead9db] bg-[#fff8f8] px-4 py-3 text-sm outline-none focus:border-[#9e1722] focus:ring-2 focus:ring-[#9e1722]/20"
            >
              <option value="Egyptian">مصري</option>
              <option value="Syrian">سوري</option>
              <option value="Saudi">سعودي</option>
              <option value="Jordanian">أردني</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#4d3439]">
              معدلك الأكاديمي (مثال: 3.5)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="4"
              name="gpa"
              required
              placeholder="0.00"
              className="w-full rounded-xl border border-[#ead9db] bg-[#fff8f8] px-4 py-3 text-left text-sm outline-none focus:border-[#9e1722] focus:ring-2 focus:ring-[#9e1722]/20"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[#9e1722] py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#7f121b]"
          >
            عرض المؤسسات المتوافقة معي ←
          </button>
        </form>
      </div>
    </main>
  );
}
