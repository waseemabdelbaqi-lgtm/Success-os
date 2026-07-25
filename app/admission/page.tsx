import Link from "next/link";
import { redirect } from "next/navigation";
import { InnerNav } from "../components";
import { createClient } from "@/utils/supabase/server";
import InstitutionCard from "@/components/InstitutionCard";
import {
  FALLBACK_INSTITUTIONS,
  getFallbackCriteriaRows,
} from "@/src/lib/admission/fallback-data";

export const metadata = {
  title: "فرصك التعليمية | SUCCESS OS",
  description: "فلترة ذكية للجامعات والكليات حسب الجنسية والمعدل الأكاديمي.",
};

interface PageProps {
  searchParams: Promise<{ nationality?: string; gpa?: string; type?: string }>;
}

type CriteriaRow = {
  nationality: string;
  min_gpa: number;
  requirements_text: string;
};

type InstitutionRow = {
  id: string;
  name: string;
  type: string;
  logo_url?: string | null;
  is_partner: boolean;
  admission_criteria?: CriteriaRow[] | null;
};

function normalizeNationalityKey(value: string): string {
  const normalized = value.trim().toLowerCase();
  const aliases: Record<string, string> = {
    egyptian: "egypt",
    egypt: "egypt",
    jordanian: "jordan",
    jordan: "jordan",
    syrian: "syria",
    syria: "syria",
    saudi: "saudi",
    "saudi arabian": "saudi",
  };
  return aliases[normalized] || normalized;
}

function pickMatchedCriteria(
  criteria: CriteriaRow[] | null | undefined,
  studentNationality: string,
): CriteriaRow | null {
  const rows = criteria || [];
  const key = normalizeNationalityKey(studentNationality);
  const exact = rows.find((c) => normalizeNationalityKey(c.nationality) === key);
  if (exact) return exact;
  return rows.find((c) => c.nationality === "All") || null;
}

function fallbackInstitutions(): InstitutionRow[] {
  return FALLBACK_INSTITUTIONS.map((inst) => ({
    id: inst.id,
    name: inst.name,
    type: inst.type,
    logo_url: inst.logo_url,
    is_partner: inst.is_partner,
    admission_criteria: getFallbackCriteriaRows(inst.id),
  }));
}

async function loadInstitutions(): Promise<InstitutionRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("institutions").select(`
      id, name, type, logo_url, is_partner,
      admission_criteria (nationality, min_gpa, requirements_text)
    `);
    if (!data) return fallbackInstitutions();
    return data as InstitutionRow[];
  } catch {
    return fallbackInstitutions();
  }
}

export default async function DiscoveryPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // فحص أمني وتجربة مستخدم سهلة: إذا لم يدخل بياناته، أعد توجيهه لصفحة تعبئة الجنسية والمعدل فوراً
  if (!params.nationality || !params.gpa) {
    redirect("/onboard");
  }

  const studentNationality = params.nationality;
  const studentGpa = parseFloat(params.gpa);
  const typeFilter = params.type?.trim() || undefined;

  if (!Number.isFinite(studentGpa)) {
    redirect("/onboard");
  }

  const institutions = await loadInstitutions();

  // الفلترة الذكية والمطابقة (تفضيل شرط الجنسية ثم All)
  const filtered = institutions
    .map((inst) => {
      const matchedCriteria = pickMatchedCriteria(
        inst.admission_criteria,
        studentNationality,
      );
      return { ...inst, matchedCriteria };
    })
    .filter((inst) => {
      if (typeFilter && inst.type !== typeFilter) return false;
      // عرض الجامعة فقط إذا كان معدل الطالب أعلى أو يساوي الحد الأدنى المطلوب لجنسيته
      if (inst.matchedCriteria) {
        return studentGpa >= Number(inst.matchedCriteria.min_gpa);
      }
      return false;
    });

  return (
    <>
      <InnerNav active="admissions" />
      <main className="min-h-screen bg-[#fff8f8] px-4 py-12 sm:px-6 lg:px-8" dir="rtl">
        <div className="mx-auto max-w-7xl">
          {/* هيدر مخصص يشعر الطالب بالراحة والأمان */}
          <div className="mb-10 flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] p-8 text-white shadow-xl sm:flex-row sm:items-center">
            <div>
              <h1 className="mb-2 font-[family-name:var(--font-sos-display)] text-2xl font-black sm:text-3xl">
                ✨ فرصك التعليمية المتاحة حالياً
              </h1>
              <p className="max-w-xl text-sm text-[#f2dadd]">
                لقد قمنا بفحص شروط القبول لـ{" "}
                <span className="font-bold text-amber-200">{filtered.length}</span> مؤسسة
                وتصفيتها بناءً على بياناتك الأكاديمية وجنسيتك (
                <strong className="text-amber-200">{studentNationality}</strong> · معدل{" "}
                <strong className="text-amber-200">{studentGpa}</strong>).
              </p>
            </div>
            <Link
              href="/onboard"
              className="self-start rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs text-white transition-all hover:bg-white/20 sm:self-center"
            >
              🔄 تعديل الجنسية أو المعدل
            </Link>
          </div>

          {/* عرض النتائج المفلترة */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((inst) => (
                <InstitutionCard
                  key={inst.id}
                  id={inst.id}
                  name={inst.name}
                  type={inst.type as "university" | "college" | "school"}
                  logo_url={inst.logo_url ?? undefined}
                  is_partner={inst.is_partner}
                  matchedCriteria={inst.matchedCriteria}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#ead9db] bg-white py-20 text-center">
              <p className="font-medium text-[#73636a]">
                لا توجد مؤسسات تطابق شروط جنسيتك أو معدلك حالياً.
              </p>
              <Link
                href="/onboard"
                className="mt-4 inline-block text-sm font-bold text-[#9e1722] underline"
              >
                تعديل بياناتك والمحاولة مجدداً
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
