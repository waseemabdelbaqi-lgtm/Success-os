import Link from "next/link";
import { redirect } from "next/navigation";
import { InnerNav } from "../components";
import { createClient } from "@/utils/supabase/server";
import InstitutionCard from "@/components/InstitutionCard";
import { getOrScrapeCriteria } from "@/actions/fetchAdmissionCriteria";
import { FALLBACK_INSTITUTIONS } from "@/src/lib/admission/fallback-data";

export const metadata = {
  title: "فحص شروط القبول الذكي | SUCCESS OS",
  description: "جمع ومطابقة شروط القبول تلقائياً حسب الجنسية والمعدل.",
};

interface PageProps {
  searchParams: Promise<{ nationality?: string; gpa?: string }>;
}

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
    // جلب كافة المؤسسات التعليمية المسجلة
    const { data: institutions } = await supabase
      .from("institutions")
      .select("id, name, type, logo_url, is_partner");

    if (!institutions) {
      return FALLBACK_INSTITUTIONS.map((inst) => ({
        id: inst.id,
        name: inst.name,
        type: inst.type,
        logo_url: inst.logo_url,
        is_partner: inst.is_partner,
      }));
    }

    return institutions as InstitutionRow[];
  } catch {
    return FALLBACK_INSTITUTIONS.map((inst) => ({
      id: inst.id,
      name: inst.name,
      type: inst.type,
      logo_url: inst.logo_url,
      is_partner: inst.is_partner,
    }));
  }
}

export default async function DiscoveryPage({ searchParams }: PageProps) {
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

  if (!institutions.length) {
    return (
      <>
        <InnerNav active="admissions" />
        <div className="py-20 text-center text-[#73636a]" dir="rtl">
          جاري جلب البيانات من النظام...
        </div>
      </>
    );
  }

  // معالجة وفحص الشروط وتحديثها تلقائياً من الويب لكل جامعة بناءً على جنسية الطالب
  const processedInstitutions = await Promise.all(
    institutions.map(async (inst) => {
      // استدعاء الوكيل الذكي: يبحث بالداتا بيز، وإن لم يجد، يذهب للويب فوراً ويحفظها
      const matchedCriteria = await getOrScrapeCriteria(
        inst.id,
        inst.name,
        studentNationality,
      );
      return { ...inst, matchedCriteria };
    }),
  );

  // تصفية وعرض الجامعات التي تتوافق مع معدل الطالب فقط بعد جلب شروطها الحية
  const filtered = processedInstitutions.filter((inst) => {
    if (inst.matchedCriteria) {
      return studentGpa >= Number(inst.matchedCriteria.min_gpa);
    }
    return true;
  });

  return (
    <>
      <InnerNav active="admissions" />
      <main className="min-h-screen bg-[#fff8f8] px-4 py-12 sm:px-6 lg:px-8" dir="rtl">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] p-8 text-white shadow-xl sm:flex-row sm:items-center">
            <div>
              <h1 className="mb-2 font-[family-name:var(--font-sos-display)] text-2xl font-black sm:text-3xl">
                🤖 فحص شروط القبول الذكي والمباشر
              </h1>
              <p className="max-w-xl text-sm text-[#f2dadd]">
                تقوم المنصة الآن بجمع ومطابقة شروط القبول تلقائياً من المواقع الرسمية للجامعات
                المحدثة لجنسيتك الحالية:{" "}
                <span className="font-bold text-amber-200">{studentNationality}</span>
                {" · "}
                معدل{" "}
                <span className="font-bold text-amber-200">{studentGpa}</span>
                {" · "}
                <span className="font-bold text-amber-200">{filtered.length}</span> مؤسسة
                متوافقة.
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
                        }
                      : null
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#ead9db] bg-white py-20 text-center shadow-inner">
              <p className="font-medium text-[#73636a]">
                عذراً، الشروط الحالية المستخرجة لهذه الجنسية تتطلب معدلاً أعلى من معدلك الحالي.
              </p>
              <Link
                href="/onboard"
                className="mt-4 inline-block text-sm font-bold text-[#9e1722] underline"
              >
                تغيير المعدل أو الجنسية
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
