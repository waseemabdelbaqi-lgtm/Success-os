import Link from "next/link";
import { redirect } from "next/navigation";
import InstitutionCard from "@/components/InstitutionCard";
import { getOrScrapeCriteria } from "@/actions/fetchAdmissionCriteria";
import { createClient } from "@/utils/supabase/server";
import { FALLBACK_INSTITUTIONS } from "@/src/lib/admission/fallback-data";

/**
 * لوحة الاكتشاف الذكية — قلب منصة التقديم الموحد.
 * تُعرض عبر `/admission` (ومسار `/?nationality&gpa` يُحوَّل إليها عبر middleware).
 */
export type DiscoverySearchParams = Promise<{
  nationality?: string;
  gpa?: string;
}>;

type InstitutionRow = {
  id: string;
  name: string;
  type: string;
  logo_url?: string | null;
  is_partner: boolean;
};

async function loadInstitutions(): Promise<InstitutionRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("institutions")
      .select("id, name, type, logo_url, is_partner");
    if (data?.length) return data as InstitutionRow[];
  } catch {
    // preview catalogue
  }
  return FALLBACK_INSTITUTIONS.map((inst) => ({
    id: inst.id,
    name: inst.name,
    type: inst.type,
    logo_url: inst.logo_url,
    is_partner: inst.is_partner,
  }));
}

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: DiscoverySearchParams;
}) {
  const params = await searchParams;

  if (!params.nationality || !params.gpa) {
    redirect("/onboard");
  }

  const studentNationality = params.nationality;
  const studentGpa = parseFloat(params.gpa);
  if (!Number.isFinite(studentGpa)) {
    redirect("/onboard");
  }

  const institutions = await loadInstitutions();

  // وكيل الشروط الذكي لكل مؤسسة (Cache → Tavily → OpenAI → Save)
  const processed = await Promise.all(
    institutions.map(async (inst) => {
      const matchedCriteria = await getOrScrapeCriteria(
        inst.id,
        inst.name,
        studentNationality,
      );
      return { ...inst, matchedCriteria };
    }),
  );

  const filtered = processed.filter((inst) => {
    if (inst.matchedCriteria) {
      return studentGpa >= Number(inst.matchedCriteria.min_gpa);
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-[#fff8f8] px-4 py-12 sm:px-6 lg:px-8" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] p-8 text-white shadow-xl sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f2dadd]">
              SUCCESS OS · التقديم الموحد
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-sos-display)] text-2xl font-black sm:text-3xl">
              🤖 فحص شروط القبول الذكي والمباشر
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#f2dadd]">
              نجمع شروط القبول من المصادر الرسمية (Tavily) ونلخّصها بالعربية (OpenAI) لجنسيتك:{" "}
              <span className="font-bold text-amber-200">{studentNationality}</span>
              {" · "}معدل{" "}
              <span className="font-bold text-amber-200">{studentGpa}</span>
              {" · "}
              <span className="font-bold text-amber-200">{filtered.length}</span> مؤسسة متوافقة.
            </p>
          </div>
          <Link
            href="/onboard"
            className="self-start rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-center text-xs text-white transition-all hover:bg-white/20 sm:self-center"
          >
            🔄 تغيير الجنسية أو المعدل
          </Link>
        </div>

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
                matchedCriteria={
                  inst.matchedCriteria
                    ? {
                        min_gpa: Number(inst.matchedCriteria.min_gpa),
                        requirements_text: inst.matchedCriteria.requirements_text,
                        avg_living_cost: inst.matchedCriteria.avg_living_cost,
                        deadline_date: inst.matchedCriteria.deadline_date
                          ? String(inst.matchedCriteria.deadline_date).slice(0, 10)
                          : null,
                        is_accredited_in_home_country:
                          inst.matchedCriteria.is_accredited_in_home_country,
                        max_age_allowed: inst.matchedCriteria.max_age_allowed,
                        requires_embassy_letter:
                          inst.matchedCriteria.requires_embassy_letter,
                        requires_security_clearance:
                          inst.matchedCriteria.requires_security_clearance,
                        alternative_exam_required:
                          inst.matchedCriteria.alternative_exam_required,
                      }
                    : null
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#ead9db] bg-white py-20 text-center shadow-inner">
            <p className="font-medium text-[#73636a]">
              عذراً، الشروط المستخرجة لهذه الجنسية تتطلب معدلاً أعلى من معدلك الحالي.
            </p>
            <Link
              href="/onboard"
              className="mt-4 inline-block text-sm font-bold text-[#9e1722] underline"
            >
              تعديل المعدل أو الجنسية
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
