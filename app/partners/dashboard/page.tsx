"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

const TYPES = [
  { id: "university", label: "جامعة" },
  { id: "college", label: "كلية" },
  { id: "school", label: "مدرسة" },
  { id: "center", label: "مركز تعليمي" },
  { id: "employer", label: "صاحب عمل / توظيف" },
] as const;

type Partner = Record<string, unknown> & {
  id: string;
  type: string;
  status: string;
  orgName: string;
  completeness?: number;
};

function PartnersDashboardInner(): ReactNode {
  const search = useSearchParams();
  const [partnerId, setPartnerId] = useState("");
  const [type, setType] = useState<string>("university");
  const [partner, setPartner] = useState<Partner | null>(null);
  const [schema, setSchema] = useState<{
    requiredFields: { key: string; labelAr: string; required: boolean }[];
    whatPartnerSees: string[];
    whatAudienceSees: string[];
  } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({
    orgName: "",
    contactName: "",
    email: "",
    phone: "",
    country: "الأردن",
    city: "",
    about: "",
    website: "",
    admissionsRequirements: "",
    programs: "",
    degrees: "بكالوريوس",
    languages: "العربية, English",
    tuitionRange: "",
    applicationChannel: "تقديم عبر SUCCESS OS",
    deadline: "",
    seats: "",
    educationSystems: "",
    gradesOffered: "",
    annualFee: "",
    courses: "",
    certificateTypes: "",
    accreditationBody: "",
    licenseNumber: "",
    coursePrice: "",
    industry: "",
    openRoles: "",
    jobRequirements: "",
    workLocations: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fromQuery = search.get("partnerId") || "";
    const typeQuery = search.get("type") || "";
    const fromStorage =
      typeof window !== "undefined"
        ? window.localStorage.getItem("sos_partner_id") || ""
        : "";
    setPartnerId(fromQuery || fromStorage);
    if (typeQuery) setType(typeQuery);
  }, [search]);

  const loadSchema = useCallback(async (t: string) => {
    const res = await fetch(`/api/partners-os?view=schema&type=${encodeURIComponent(t)}`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (json.ok) setSchema(json);
  }, []);

  const loadPartner = useCallback(async () => {
    if (!partnerId) {
      setPartner(null);
      return;
    }
    const res = await fetch(
      `/api/partners-os?partnerId=${encodeURIComponent(partnerId)}`,
      { cache: "no-store" },
    );
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || "LOAD_FAILED");
    if (json.partner) {
      setPartner(json.partner);
      setType(json.partner.type);
      const p = json.partner as Record<string, unknown>;
      setForm((prev) => ({
        ...prev,
        orgName: String(p.orgName || ""),
        contactName: String(p.contactName || ""),
        email: String(p.email || ""),
        phone: String(p.phone || ""),
        country: String(p.country || prev.country),
        city: String(p.city || ""),
        about: String(p.about || ""),
        website: String(p.website || ""),
        admissionsRequirements: String(p.admissionsRequirements || ""),
        programs: Array.isArray(p.programs) ? p.programs.join(", ") : "",
        degrees: Array.isArray(p.degrees) ? p.degrees.join(", ") : prev.degrees,
        languages: Array.isArray(p.languages)
          ? p.languages.join(", ")
          : prev.languages,
        tuitionRange: String(p.tuitionRange || ""),
        applicationChannel: String(p.applicationChannel || prev.applicationChannel),
        deadline: String(p.deadline || ""),
        seats: p.seats != null ? String(p.seats) : "",
        educationSystems: Array.isArray(p.educationSystems)
          ? p.educationSystems.join(", ")
          : "",
        gradesOffered: Array.isArray(p.gradesOffered)
          ? p.gradesOffered.join(", ")
          : "",
        annualFee: String(p.annualFee || ""),
        courses: Array.isArray(p.courses) ? p.courses.join(", ") : "",
        certificateTypes: Array.isArray(p.certificateTypes)
          ? p.certificateTypes.join(", ")
          : "",
        accreditationBody: String(p.accreditationBody || ""),
        licenseNumber: String(p.licenseNumber || ""),
        coursePrice: String(p.coursePrice || ""),
        industry: String(p.industry || ""),
        openRoles: Array.isArray(p.openRoles) ? p.openRoles.join(", ") : "",
        jobRequirements: String(p.jobRequirements || ""),
        workLocations: Array.isArray(p.workLocations)
          ? p.workLocations.join(", ")
          : "",
      }));
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sos_partner_id", json.partner.id);
      }
    }
  }, [partnerId]);

  useEffect(() => {
    loadSchema(type).catch(() => {});
  }, [type, loadSchema]);

  useEffect(() => {
    loadPartner().catch((e: unknown) =>
      setError(e instanceof Error ? e.message : "LOAD_FAILED"),
    );
  }, [loadPartner]);

  const listFields = useMemo(() => {
    const keys = new Set((schema?.requiredFields || []).map((f) => f.key));
    return (schema?.requiredFields || []).filter((f) => keys.has(f.key));
  }, [schema]);

  function split(v: string) {
    return v
      .split(/[,،\n]/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  async function save(publish = false) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload: Record<string, unknown> = {
        id: partnerId || undefined,
        type,
        orgName: form.orgName,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        country: form.country,
        city: form.city,
        about: form.about,
        website: form.website,
        admissionsRequirements: form.admissionsRequirements,
        programs: split(form.programs),
        degrees: split(form.degrees),
        languages: split(form.languages),
        tuitionRange: form.tuitionRange,
        applicationChannel: form.applicationChannel,
        deadline: form.deadline,
        seats: Number(form.seats) || 0,
        educationSystems: split(form.educationSystems),
        gradesOffered: split(form.gradesOffered),
        annualFee: form.annualFee,
        courses: split(form.courses),
        certificateTypes: split(form.certificateTypes),
        accreditationBody: form.accreditationBody,
        licenseNumber: form.licenseNumber,
        coursePrice: form.coursePrice,
        industry: form.industry,
        openRoles: split(form.openRoles),
        jobRequirements: form.jobRequirements,
        workLocations: split(form.workLocations),
        status: publish ? "published" : partner?.status || "draft",
      };

      const res = await fetch("/api/partners-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upsertPartner", partner: payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "SAVE_FAILED");

      let saved = json.partner as Partner;
      if (publish) {
        const pub = await fetch("/api/partners-os", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "publishPartner",
            partnerId: saved.id,
            actor: form.email || form.orgName,
          }),
        });
        const pubJson = await pub.json();
        if (!pub.ok || !pubJson.ok) throw new Error(pubJson.error || "PUBLISH_FAILED");
        saved = pubJson.partner;
      }

      setPartnerId(saved.id);
      setPartner(saved);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sos_partner_id", saved.id);
      }
      setMessage(publish ? "نُشر ملفك — يظهر الآن في اكتشاف الشركاء" : "حُفظت المسودة");
      await loadPartner();
    } catch (e) {
      setError(e instanceof Error ? e.message : "SAVE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fff8f8] text-[#301218]" dir="rtl">
      <header className="border-b border-[#ead9db] bg-gradient-to-br from-[#301218] via-[#4b0a11] to-[#9e1722] text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f2d77c]">
            SUCCESS OS · PARTNERS OS
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">لوحة تحكم الشريك</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/85">
            عبّئ معلومات جهتك، انشر صفحة المعاينة، وشوف كيف يراك الطالب أو الباحث عن العمل عند
            البحث عن شريك مناسب.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/partners/discover"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#9e1722]"
            >
              اكتشاف الشركاء (عرض الطالب)
            </Link>
            <Link
              href="/admissions"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              قبول الجامعات
            </Link>
            <Link
              href="/join-us"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold"
            >
              بوابة الانضمام
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
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

        <section className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-[#ead9db] bg-white px-4 py-4">
            <p className="text-xs font-semibold text-[#9a711a]">اكتمال الملف</p>
            <p className="mt-2 text-3xl font-bold text-[#4b0a11]">
              {partner?.completeness ?? 0}%
            </p>
          </article>
          <article className="rounded-2xl border border-[#ead9db] bg-white px-4 py-4">
            <p className="text-xs font-semibold text-[#9a711a]">الحالة</p>
            <p className="mt-2 text-xl font-bold text-[#4b0a11]">
              {partner?.status === "published" ? "منشور" : partner ? "مسودة" : "جديد"}
            </p>
          </article>
          <article className="rounded-2xl border border-[#ead9db] bg-white px-4 py-4">
            <p className="text-xs font-semibold text-[#9a711a]">رقم الشريك</p>
            <p className="mt-2 break-all text-sm font-bold text-[#4b0a11]">
              {partnerId || "سيُنشأ عند الحفظ"}
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-[#ead9db] bg-white p-5">
            <h2 className="font-bold text-[#4b0a11]">ماذا ترى أنت كشريك؟</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5 text-sm text-[#73636a]">
              {(schema?.whatPartnerSees || []).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-[#f0e0a8] bg-[#fffaf0] p-5">
            <h2 className="font-bold text-[#6a4d12]">ماذا يرى الطالب / الباحث؟</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5 text-sm text-[#73636a]">
              {(schema?.whatAudienceSees || []).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-2xl border border-[#ead9db] bg-white p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`rounded-xl px-3 py-2 text-sm font-bold ${
                  type === t.id
                    ? "bg-[#9e1722] text-white"
                    : "border border-[#ead9db] text-[#4b0a11]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {listFields.map((field) => {
              const isLong = [
                "about",
                "admissionsRequirements",
                "jobRequirements",
              ].includes(field.key);
              const value = form[field.key] ?? "";
              return (
                <label
                  key={field.key}
                  className={`text-sm ${isLong ? "sm:col-span-2" : ""}`}
                >
                  <span className="mb-1 block font-semibold text-[#4b0a11]">
                    {field.labelAr}
                    {field.required ? " *" : ""}
                  </span>
                  {isLong ? (
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                      value={value}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                    />
                  ) : (
                    <input
                      className="w-full rounded-xl border border-[#ead9db] px-3 py-2"
                      value={value}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={
                        ["programs", "courses", "openRoles", "gradesOffered"].includes(
                          field.key,
                        )
                          ? "افصل بفاصلة"
                          : ""
                      }
                    />
                  )}
                </label>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => save(false)}
              className="rounded-xl border border-[#ead9db] bg-white px-4 py-2.5 text-sm font-bold text-[#4b0a11] disabled:opacity-60"
            >
              حفظ مسودة
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => save(true)}
              className="rounded-xl bg-[#9e1722] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              نشر للطلاب / الباحثين
            </button>
            {partnerId ? (
              <Link
                href={`/partners/${encodeURIComponent(partnerId)}`}
                className="rounded-xl border border-[#ead9db] px-4 py-2.5 text-sm font-bold text-[#9e1722]"
              >
                معاينة صفحتك العامة
              </Link>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function PartnersDashboardPage(): ReactNode {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fff8f8] p-8" dir="rtl">
          جاري التحميل…
        </div>
      }
    >
      <PartnersDashboardInner />
    </Suspense>
  );
}
