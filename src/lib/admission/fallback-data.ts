import type { AdmissionProfileInput, Institution } from "@/src/types/admission";

/**
 * Offline / preview catalogue — mirrors seeded rows in
 * supabase/migrations/20260725_admission_funnel.sql
 */
export const FALLBACK_INSTITUTIONS: Institution[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Technical University of Munich",
    type: "university",
    country: "Germany",
    majors: ["Engineering", "Computing", "Sciences"],
    is_partner: true,
    official_email: "studium@tum.de",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "RWTH Aachen University",
    type: "university",
    country: "Germany",
    majors: ["Engineering", "Computing", "Sciences"],
    is_partner: false,
    official_email: "international@rwth-aachen.de",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "University of Jordan",
    type: "university",
    country: "Jordan",
    majors: ["Engineering", "Business", "Medicine", "Sciences"],
    is_partner: true,
    official_email: "admission@ju.edu.jo",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Fontys University of Applied Sciences",
    type: "college",
    country: "Netherlands",
    majors: ["Engineering", "Computing", "Business", "Design"],
    is_partner: true,
    official_email: "international@fontys.nl",
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    name: "Bangkok Patana School",
    type: "school",
    country: "Thailand",
    majors: ["IB", "British Curriculum"],
    is_partner: true,
    official_email: "admissions@patana.ac.th",
  },
];

const CRITERIA: Record<string, Array<{ nationality: string; min_gpa: number; requirements_text: string }>> = {
  "00000000-0000-4000-8000-000000000001": [
    {
      nationality: "Jordan",
      min_gpa: 3.0,
      requirements_text:
        "Non-EU international track via uni-assist/direct. Docs: secondary certificate, passport, proof of funds, German or English language proof.",
    },
    {
      nationality: "All",
      min_gpa: 3.0,
      requirements_text:
        "International applicants: secondary certificate, passport, language proof, proof of funds.",
    },
  ],
  "00000000-0000-4000-8000-000000000002": [
    {
      nationality: "Jordan",
      min_gpa: 2.8,
      requirements_text:
        "Non-EU track via RWTH international office. Non-partner — applications emailed to admissions.",
    },
    {
      nationality: "All",
      min_gpa: 2.8,
      requirements_text: "International GPA floor 2.8. Language proof and passport required.",
    },
  ],
  "00000000-0000-4000-8000-000000000003": [
    {
      nationality: "Jordan",
      min_gpa: 2.5,
      requirements_text: "Jordanian unified admission path. Docs: Tawjihi, national ID.",
    },
    {
      nationality: "Egypt",
      min_gpa: 2.5,
      requirements_text:
        "Non-Jordanian path via studyinjordan.jo. Docs: secondary certificate, passport, equivalency.",
    },
    {
      nationality: "All",
      min_gpa: 2.5,
      requirements_text: "Minimum GPA 2.5. Passport and recognized secondary certificate required.",
    },
  ],
  "00000000-0000-4000-8000-000000000004": [
    {
      nationality: "All",
      min_gpa: 2.5,
      requirements_text: "Applied sciences bachelor/diploma. English proficiency, passport, transcripts.",
    },
  ],
  "00000000-0000-4000-8000-000000000005": [
    {
      nationality: "All",
      min_gpa: 0,
      requirements_text: "K–12 international school admissions. Passport and prior school records.",
    },
  ],
};

function degreeMatchesType(degree: string, type: Institution["type"]) {
  if (degree === "school") return type === "school";
  if (degree === "diploma") return type === "college" || type === "university";
  return type === "university" || type === "college";
}

/** Raw criteria rows for an institution — used by the server discovery page. */
export function getFallbackCriteriaRows(institutionId: string) {
  return (CRITERIA[institutionId] || []).map((c) => ({ ...c }));
}

function pickCriteria(institutionId: string, nationality: string) {
  const rows = CRITERIA[institutionId] || [];
  const normalized = nationality.trim().toLowerCase();
  const aliases: Record<string, string> = {
    egyptian: "egypt",
    egypt: "egypt",
    jordanian: "jordan",
    jordan: "jordan",
  };
  const key = aliases[normalized] || normalized;
  return (
    rows.find((c) => c.nationality.toLowerCase() === key || c.nationality.toLowerCase() === normalized) ||
    rows.find((c) => c.nationality === "All") ||
    null
  );
}

export function filterFallbackInstitutions(profile: AdmissionProfileInput): Institution[] {
  const major = profile.major.toLowerCase();
  const degree = profile.targetDegree;
  const country = (profile.preferredStudyCountry || "").toLowerCase();
  const nationality = profile.nationality;
  const gpa = Number(profile.gpa);

  return FALLBACK_INSTITUTIONS.filter((inst) => {
    if (!degreeMatchesType(degree, inst.type)) return false;
    if (inst.type === "school" && degree !== "school") return false;
    if (degree === "school" && inst.type !== "school") return false;

    if (country && inst.country) {
      const map: Record<string, string> = {
        ألمانيا: "germany",
        الاردن: "jordan",
        الأردن: "jordan",
        هولندا: "netherlands",
        تايلاند: "thailand",
      };
      const mapped = map[profile.preferredStudyCountry || ""] || country;
      if (!inst.country.toLowerCase().includes(mapped) && inst.country.toLowerCase() !== mapped) {
        return false;
      }
    }

    const criteria = pickCriteria(inst.id, nationality);
    if (!criteria) return false;
    if (gpa < criteria.min_gpa) return false;

    const majors = inst.majors || [];
    if (majors.length && degree !== "school") {
      return majors.some(
        (m) => m.toLowerCase().includes(major) || major.includes(m.toLowerCase()),
      );
    }
    return true;
  })
    .map((inst) => {
      const criteria = pickCriteria(inst.id, nationality)!;
      return {
        ...inst,
        criteria: {
          nationality: criteria.nationality,
          min_gpa: criteria.min_gpa,
          requirements_text: criteria.requirements_text,
        },
      };
    })
    .sort((a, b) => Number(b.is_partner) - Number(a.is_partner));
}
