"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type Partner = {
  id: string;
  type: string;
  typeLabel?: string;
  status: string;
  orgName: string;
  country?: string;
  city?: string;
  about?: string;
  website?: string;
  programs?: string[];
  degrees?: string[];
  languages?: string[];
  admissionsRequirements?: string;
  tuitionRange?: string;
  applicationChannel?: string;
  deadline?: string;
  seats?: number;
  educationSystems?: string[];
  gradesOffered?: string[];
  annualFee?: string;
  courses?: string[];
  certificateTypes?: string[];
  accreditationBody?: string;
  industry?: string;
  openRoles?: string[];
  jobRequirements?: string;
  workLocations?: string[];
  isPlatformPartner?: boolean;
};

export default function PartnerPublicPreviewPage(): ReactNode {
  const params = useParams<{ partnerId: string }>();
  const partnerId = params?.partnerId;
  const [partner, setPartner] = useState<Partner | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!partnerId) return;
    fetch(`/api/partners-os?view=preview&partnerId=${encodeURIComponent(partnerId)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error || "NOT_FOUND");
        setPartner(json.partner);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "LOAD_FAILED"),
      );
  }, [partnerId]);

  const isEmployer = partner?.type === "employer";

  return (
    <div className="min-h-screen bg-[#fff8f8] text-[#301218]" dir="rtl">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-3 text-sm font-bold">
          <Link href="/partners/discover" className="text-[#9e1722]">
            ← اكتشاف الشركاء
          </Link>
          <Link href="/admissions" className="text-[#73636a]">
            قبول الجامعات
          </Link>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {partner ? (
          <article className="overflow-hidden rounded-3xl border border-[#ead9db] bg-white">
            <header className="bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] px-6 py-8 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f2d77c]">
                {partner.typeLabel || partner.type}
                {partner.isPlatformPartner ? " · شريك منصة" : ""}
              </p>
              <h1 className="mt-2 text-3xl font-semibold">{partner.orgName}</h1>
              <p className="mt-2 text-sm text-white/85">
                {[partner.city, partner.country].filter(Boolean).join("، ")}
              </p>
            </header>

            <div className="space-y-5 px-6 py-6">
              <section>
                <h2 className="text-lg font-bold text-[#4b0a11]">عن الجهة</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#73636a]">
                  {partner.about || "—"}
                </p>
              </section>

              {!isEmployer && (partner.programs || []).length ? (
                <section>
                  <h2 className="text-lg font-bold text-[#4b0a11]">البرامج / التخصصات</h2>
                  <p className="mt-2 text-sm text-[#73636a]">
                    {(partner.programs || []).join(" · ")}
                  </p>
                </section>
              ) : null}

              {!isEmployer && partner.admissionsRequirements ? (
                <section>
                  <h2 className="text-lg font-bold text-[#4b0a11]">شروط القبول</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[#73636a]">
                    {partner.admissionsRequirements}
                  </p>
                </section>
              ) : null}

              {(partner.courses || []).length ? (
                <section>
                  <h2 className="text-lg font-bold text-[#4b0a11]">الدورات</h2>
                  <p className="mt-2 text-sm text-[#73636a]">
                    {(partner.courses || []).join(" · ")}
                  </p>
                </section>
              ) : null}

              {(partner.gradesOffered || []).length ? (
                <section>
                  <h2 className="text-lg font-bold text-[#4b0a11]">الصفوف والأنظمة</h2>
                  <p className="mt-2 text-sm text-[#73636a]">
                    صفوف: {(partner.gradesOffered || []).join("، ")}
                    <br />
                    أنظمة: {(partner.educationSystems || []).join(" · ") || "—"}
                    <br />
                    رسوم: {partner.annualFee || "—"}
                  </p>
                </section>
              ) : null}

              {isEmployer ? (
                <section>
                  <h2 className="text-lg font-bold text-[#4b0a11]">الوظائف والشروط</h2>
                  <p className="mt-2 text-sm text-[#73636a]">
                    القطاع: {partner.industry || "—"}
                    <br />
                    وظائف: {(partner.openRoles || []).join(" · ") || "—"}
                    <br />
                    مواقع: {(partner.workLocations || []).join(" · ") || "—"}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[#73636a]">
                    {partner.jobRequirements}
                  </p>
                </section>
              ) : null}

              {!isEmployer ? (
                <section className="rounded-2xl bg-[#fff8f8] px-4 py-3 text-sm text-[#73636a]">
                  <p>قناة التقديم: {partner.applicationChannel || "عبر المنصة"}</p>
                  <p>الرسوم: {partner.tuitionRange || partner.annualFee || "—"}</p>
                  <p>الموعد: {partner.deadline || "—"}</p>
                  {partner.seats ? <p>مقاعد تقريبية: {partner.seats}</p> : null}
                </section>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {isEmployer ? (
                  <Link
                    href="/jobs"
                    className="rounded-xl bg-[#9e1722] px-4 py-2.5 text-sm font-bold text-white"
                  >
                    تصفح الوظائف وقدّم
                  </Link>
                ) : (
                  <Link
                    href="/admissions"
                    className="rounded-xl bg-[#9e1722] px-4 py-2.5 text-sm font-bold text-white"
                  >
                    ابدأ مسار القبول
                  </Link>
                )}
                {partner.website ? (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-[#ead9db] px-4 py-2.5 text-sm font-bold text-[#4b0a11]"
                  >
                    موقع الجهة
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        ) : !error ? (
          <p className="text-sm text-[#73636a]">جاري التحميل…</p>
        ) : null}
      </main>
    </div>
  );
}
