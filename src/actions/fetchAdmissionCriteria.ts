"use server";

/**
 * Live web gathering + AI processing for nationality-specific admission criteria.
 *
 * Flow:
 * 1) Check Supabase `admission_criteria` for institution + nationality
 * 2) If missing → Tavily search official-style requirements
 * 3) Summarize with OpenAI gpt-4o-mini (Arabic, structured)
 * 4) Cache in Supabase for future students, then return
 *
 * Without Tavily/OpenAI/Supabase keys, a safe offline mock is used (preview mode).
 */

import { createClient } from "@/utils/supabase/server";
import { getFallbackCriteriaRows } from "@/src/lib/admission/fallback-data";
import { summarizeAdmissionCriteria } from "@/src/lib/admission/openai-criteria";
import { searchTavily } from "@/src/lib/admission/tavily";

export type ScrapedCriteria = {
  id?: string;
  institution_id?: string;
  nationality: string;
  min_gpa: number;
  requirements_text: string;
  avg_living_cost?: string | null;
  deadline_date?: string | null;
  is_accredited_in_home_country?: boolean | null;
  max_age_allowed?: number | null;
  requires_embassy_letter?: boolean | null;
  requires_security_clearance?: boolean | null;
  alternative_exam_required?: string | null;
  source?: "cache" | "tavily+openai" | "mock";
};

function mockCriteria(universityName: string, nationality: string): ScrapedCriteria {
  const key = nationality.trim().toLowerCase();
  const min_gpa =
    key === "egyptian" || key === "egypt"
      ? 3.0
      : key === "syrian" || key === "syria"
        ? 2.8
        : key === "saudi" || key === "saudi arabian"
          ? 2.7
          : key === "jordanian" || key === "jordan"
            ? 2.5
            : 2.5;

  return {
    nationality,
    min_gpa,
    source: "mock",
    requirements_text: `بناءً على تقدير أولي لشروط القبول في ${universityName} لجنسية (${nationality}):
1. شهادة الثانوية العامة مصدقة من وزارة الخارجية والسفارة.
2. إثبات كفاءة اللغة الإنجليزية (IELTS 6.0 أو ما يعادلها) ما لم تكن الدراسة السابقة بالإنجليزية.
3. جواز سفر ساري ورسالة دعم/عدم ممانعة عند الحاجة من الملحقية الثقافية.
4. إثبات القدرة المالية للتأشيرة والدراسة.

ملاحظة: فعّل TAVILY_API_KEY و OPENAI_API_KEY لجلب الشروط الحية من المواقع الرسمية.`,
  };
}

async function gatherLiveCriteria(
  universityName: string,
  nationality: string,
): Promise<ScrapedCriteria | null> {
  const searchQuery = `admission requirements for ${nationality} students at ${universityName} official website`;

  try {
    const tavily = await searchTavily(searchQuery);
    const snippets = [
      tavily?.answer ? `Answer: ${tavily.answer}` : "",
      ...(tavily?.results || []).map(
        (r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content}`,
      ),
    ]
      .filter(Boolean)
      .join("\n\n");

    if (snippets) {
      const ai = await summarizeAdmissionCriteria({
        universityName,
        nationality,
        searchQuery,
        snippets,
      });
      if (ai) {
        return {
          nationality,
          min_gpa: ai.min_gpa,
          requirements_text: ai.requirements_text,
          source: "tavily+openai",
        };
      }
    }
  } catch (error) {
    console.error("Live gather failed:", error);
  }

  // Offline / keys missing → deterministic mock so the funnel never breaks
  return mockCriteria(universityName, nationality);
}

/**
 * الوكيل الذكي: قاعدة البيانات أولاً، ثم Tavily + OpenAI، ثم الحفظ للطلاب اللاحقين.
 */
export async function getOrScrapeCriteria(
  institutionId: string,
  institutionName: string,
  nationality: string,
): Promise<ScrapedCriteria | null> {
  const trimmedNationality = nationality.trim();
  if (!institutionId || !trimmedNationality) return null;

  try {
    const supabase = await createClient();

    // 1) Cache hit
    const { data: existing } = await supabase
      .from("admission_criteria")
      .select("*")
      .eq("institution_id", institutionId)
      .ilike("nationality", trimmedNationality)
      .maybeSingle();

    if (existing) {
      return { ...(existing as ScrapedCriteria), source: "cache" };
    }

    // Also accept common aliases already seeded (e.g. Egypt vs Egyptian)
    const aliases = nationalityAliases(trimmedNationality);
    for (const alias of aliases) {
      if (alias.toLowerCase() === trimmedNationality.toLowerCase()) continue;
      const { data: aliasHit } = await supabase
        .from("admission_criteria")
        .select("*")
        .eq("institution_id", institutionId)
        .ilike("nationality", alias)
        .maybeSingle();
      if (aliasHit) {
        return { ...(aliasHit as ScrapedCriteria), source: "cache" };
      }
    }

    // 2) Live web + AI
    const scraped = await gatherLiveCriteria(institutionName, trimmedNationality);
    if (!scraped) return null;

    // 3) Persist for future loads
    const { data: saved, error } = await supabase
      .from("admission_criteria")
      .upsert(
        {
          institution_id: institutionId,
          nationality: trimmedNationality,
          min_gpa: scraped.min_gpa,
          requirements_text: scraped.requirements_text,
        },
        { onConflict: "institution_id,nationality" },
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error("Failed to cache criteria:", error.message);
      return { institution_id: institutionId, ...scraped };
    }

    return {
      ...((saved as ScrapedCriteria) || { institution_id: institutionId, ...scraped }),
      source: scraped.source,
    };
  } catch {
    // Preview mode without Supabase — prefer seeded MENA/demo criteria, then mock/live
    const seeded = getFallbackCriteriaRows(institutionId);
    const aliases = nationalityAliases(trimmedNationality).map((a) => a.toLowerCase());
    const hit =
      seeded.find((c) => aliases.includes(c.nationality.toLowerCase())) ||
      seeded.find((c) => c.nationality === "All");
    if (hit) {
      return {
        institution_id: institutionId,
        nationality: hit.nationality,
        min_gpa: hit.min_gpa,
        requirements_text: hit.requirements_text,
        avg_living_cost: hit.avg_living_cost ?? null,
        deadline_date: hit.deadline_date ?? null,
        is_accredited_in_home_country: hit.is_accredited_in_home_country ?? true,
        max_age_allowed: hit.max_age_allowed ?? null,
        requires_embassy_letter: hit.requires_embassy_letter ?? false,
        requires_security_clearance: hit.requires_security_clearance ?? false,
        alternative_exam_required: hit.alternative_exam_required ?? null,
        source: "cache",
      };
    }
    return gatherLiveCriteria(institutionName, trimmedNationality);
  }
}

/** Alias kept for callers that import the action module name as the function. */
export async function fetchAdmissionCriteria(
  institutionId: string,
  institutionName: string,
  nationality: string,
) {
  return getOrScrapeCriteria(institutionId, institutionName, nationality);
}

function nationalityAliases(nationality: string): string[] {
  const key = nationality.trim().toLowerCase();
  const map: Record<string, string[]> = {
    egyptian: ["Egyptian", "Egypt"],
    egypt: ["Egypt", "Egyptian"],
    jordanian: ["Jordanian", "Jordan"],
    jordan: ["Jordan", "Jordanian"],
    syrian: ["Syrian", "Syria"],
    syria: ["Syria", "Syrian"],
    saudi: ["Saudi", "Saudi Arabian"],
    "saudi arabian": ["Saudi Arabian", "Saudi"],
    iraqi: ["Iraqi", "Iraq"],
    iraq: ["Iraq", "Iraqi"],
    kuwaiti: ["Kuwaiti", "Kuwait"],
    kuwait: ["Kuwait", "Kuwaiti"],
    yemeni: ["Yemeni", "Yemen"],
    yemen: ["Yemen", "Yemeni"],
    moroccan: ["Moroccan", "Morocco"],
    morocco: ["Morocco", "Moroccan"],
  };
  return map[key] || [nationality];
}
