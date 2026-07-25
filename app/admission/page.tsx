import { InnerNav } from "../components";
import { createClient } from "@/utils/supabase/server";
import InstitutionCard from "@/components/InstitutionCard";
import {
  FALLBACK_INSTITUTIONS,
  getFallbackCriteriaRows,
} from "@/src/lib/admission/fallback-data";

export const metadata = {
  title: "المؤسسات المتوافقة | SUCCESS OS",
  description: "فلترة ذكية للجامعات والكليات حسب الجنسية والمعدل الأكاديمي.",
};

interface PageProps {
  searchParams: Promise<{
    nationality?: string;
    gpa?: string;
    type?: string;
  }>;
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

function filterInstitutions(
  institutions: InstitutionRow[],
  studentNationality: string,
  studentGpa: number,
  typeFilter?: string,
) {
  return institutions
    .map((inst) => {
      const matchedCriteria = pickMatchedCriteria(
        inst.admission_criteria,
        studentNationality,
      );
      return { ...inst, matchedCriteria };
    })
    .filter((inst) => {
      if (typeFilter && inst.type !== typeFilter) return false;
      // استبعاد المؤسسة إذا كان معدل الطالب أقل من الحد الأدنى المطلوب
      if (inst.matchedCriteria && studentGpa > 0) {
        return studentGpa >= Number(inst.matchedCriteria.min_gpa);
      }
      // في حال لم يتم إدخال معدل الفلترة حتى الآن — اعرض المؤسسات التي لها شرط مطابق
      return Boolean(inst.matchedCriteria);
    });
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

async function loadInstitutions(): Promise<{
  institutions: InstitutionRow[];
  mode: "supabase" | "preview";
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("institutions").select(`
      id,
      name,
      type,
      logo_url,
      is_partner,
      admission_criteria (
        nationality,
        min_gpa,
        requirements_text
      )
    `);

    if (error || !data) {
      return {
        institutions: fallbackInstitutions(),
        mode: "preview",
        error: error?.message,
      };
    }

    return { institutions: data as InstitutionRow[], mode: "supabase" };
  } catch {
    // بدون مفاتيح Supabase — عرض الكتالوج التجريبي
    return { institutions: fallbackInstitutions(), mode: "preview" };
  }
}

export default async function DiscoveryPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const studentNationality = params.nationality || "Egyptian";
  const studentGpa = parseFloat(params.gpa || "0.0");
  const typeFilter = params.type?.trim() || undefined;

  const { institutions, mode, error: loadError } = await loadInstitutions();

  if (!institutions) {
    return (
      <>
        <InnerNav active="admissions" />
        <div className="py-20 text-center font-medium text-red-500">
          حدث خطأ أثناء تحميل البيانات.
        </div>
      </>
    );
  }

  // الفلترة الذكية (جنسية + معدل، مع تفضيل شرط الجنسية المحددة ثم All)
  const filteredInstitutions = filterInstitutions(
    institutions,
    studentNationality,
    Number.isFinite(studentGpa) ? studentGpa : 0,
    typeFilter,
  );

  return (
    <>
      <InnerNav active="admissions" />
      <main className="min-h-screen bg-[#fff8f8] px-4 py-12 sm:px-6 lg:px-8" dir="rtl">
        <div className="mx-auto max-w-7xl">
          {/* شريط معلومات الفلترة العلوية */}
          <div className="mb-10 rounded-2xl bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] p-8 text-white shadow-xl">
            <h1 className="mb-3 font-[family-name:var(--font-sos-display)] text-2xl font-black sm:text-3xl">
              🎓 المؤسسات المتوافقة مع شروط قبولك
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[#f2dadd]">
              بناءً على جنسيتك ومعدلك الأكاديمي، قمنا بتصفية خياراتك وعرض الجامعات، الكليات
              والمدارس التي تملك فرصة قبول حقيقية ومباشرة فيها مع الشروط الدقيقة لكل مؤسسة.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs">
              <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5">
                🌍 الجنسية المفلترة:{" "}
                <strong className="text-amber-200">{studentNationality}</strong>
              </span>
              {studentGpa > 0 ? (
                <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5">
                  📊 المعدل المرصود:{" "}
                  <strong className="text-amber-200">{studentGpa}</strong>
                </span>
              ) : null}
              {typeFilter ? (
                <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5">
                  النوع: <strong className="text-amber-200">{typeFilter}</strong>
                </span>
              ) : null}
              <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5">
                المصدر: {mode === "supabase" ? "Supabase" : "معاينة محلية"}
              </span>
            </div>
            {loadError && mode === "preview" ? (
              <p className="mt-3 text-xs text-amber-100/90">
                تعذّر الاتصال بقاعدة البيانات — يتم عرض بيانات المعاينة.
              </p>
            ) : null}
          </div>

          {/* شبكة عرض بطاقات الجامعات المفلترة تلقائياً */}
          {filteredInstitutions.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredInstitutions.map((inst) => (
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
            <div className="rounded-2xl border border-dashed border-[#ead9db] bg-white py-20 text-center">
              <p className="font-medium text-[#73636a]">
                للأسف، لا توجد مؤسسات تعليمية تطابق شروط القبول لجنسيتك أو معدلك الحالي.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
