import type { Institution } from "@/src/types/admission";
import type { AdmissionProfileInput } from "@/src/types/admission";

/**
 * Offline / preview catalogue used when Supabase env vars are absent.
 * Mirrors seeded rows in supabase/migrations/20260725_admission_funnel.sql
 * and maps onto the existing SUCCESS OS nationality research where possible.
 */
export const FALLBACK_INSTITUTIONS: Institution[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "tum",
    name: "Technical University of Munich",
    kind: "university",
    country: "Germany",
    city: "Munich",
    majors: ["Engineering", "Computing", "Sciences", "هندسة", "حوسبة", "علوم"],
    degrees: ["bachelor", "master", "phd"],
    is_partner: true,
    official_email: "studium@tum.de",
    website: "https://www.tum.de",
    min_gpa: 3.0,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "rwth",
    name: "RWTH Aachen University",
    kind: "university",
    country: "Germany",
    city: "Aachen",
    majors: ["Engineering", "Computing", "Sciences", "هندسة", "حوسبة", "علوم"],
    degrees: ["bachelor", "master", "phd"],
    is_partner: false,
    official_email: "international@rwth-aachen.de",
    website: "https://www.rwth-aachen.de",
    min_gpa: 2.8,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "ju",
    name: "University of Jordan",
    kind: "university",
    country: "Jordan",
    city: "Amman",
    majors: ["Engineering", "Business", "Medicine", "Sciences", "هندسة", "أعمال", "طب وصحة", "علوم"],
    degrees: ["bachelor", "master", "phd"],
    is_partner: true,
    official_email: "admission@ju.edu.jo",
    website: "https://www.ju.edu.jo",
    min_gpa: 2.5,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    slug: "fontys",
    name: "Fontys University of Applied Sciences",
    kind: "college",
    country: "Netherlands",
    city: "Eindhoven",
    majors: ["Engineering", "Computing", "Business", "Design", "هندسة", "حوسبة", "أعمال"],
    degrees: ["bachelor", "diploma"],
    is_partner: true,
    official_email: "international@fontys.nl",
    website: "https://fontys.edu",
    min_gpa: 2.5,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    slug: "patana",
    name: "Bangkok Patana School",
    kind: "school",
    country: "Thailand",
    city: "Bangkok",
    majors: ["IB", "British Curriculum"],
    degrees: ["school"],
    is_partner: true,
    official_email: "admissions@patana.ac.th",
    website: "https://www.patana.ac.th",
    min_gpa: 0,
  },
];

const CRITERIA: Record<string, Record<string, Institution["criteria"]>> = {
  tum: {
    Jordan: {
      nationality: "Jordan",
      title: "Non-EU international track",
      channel: "uni-assist / direct",
      fees_note: "No tuition at most public unis; semester fee applies",
      visa_note: "National D visa / residence",
      docs: ["Secondary certificate", "Passport", "Proof of funds", "Language proof"],
      summary: "Jordanian nationals follow the international / uni-assist path for TUM.",
    },
    Germany: {
      nationality: "Germany",
      title: "Domestic / EU track",
      channel: "Hochschulstart or direct",
      fees_note: "Semester contribution only",
      visa_note: "No student visa for EU/DE",
      docs: ["Abitur or equivalent", "ID"],
      summary: "German / EU applicants use domestic channels.",
    },
  },
  rwth: {
    Jordan: {
      nationality: "Jordan",
      title: "Non-EU international track",
      channel: "Direct international office",
      fees_note: "Semester fee + living costs",
      visa_note: "Student residence permit",
      docs: ["Secondary certificate", "Passport", "Language proof"],
      summary: "Non-partner route — applications are emailed to RWTH admissions.",
    },
  },
  ju: {
    Jordan: {
      nationality: "Jordan",
      title: "Unified admission (Jordanian)",
      channel: "Unified Admission Unit",
      fees_note: "Public tuition bands",
      visa_note: "N/A",
      docs: ["Tawjihi", "National ID"],
      summary: "Jordanian citizens use the national unified admission path.",
    },
    Egypt: {
      nationality: "Egypt",
      title: "International / non-Jordanian",
      channel: "studyinjordan.jo",
      fees_note: "International fee schedule",
      visa_note: "Study residency",
      docs: ["Secondary certificate", "Passport", "Equivalency"],
      summary: "Non-Jordanian applicants use the international unified portal.",
    },
  },
};

export function filterFallbackInstitutions(profile: AdmissionProfileInput): Institution[] {
  const major = profile.major.toLowerCase();
  const degree = profile.targetDegree;
  const country = (profile.preferredStudyCountry || "").toLowerCase();
  const nationality = profile.nationality;

  return FALLBACK_INSTITUTIONS.filter((inst) => {
    if (country && !inst.country.toLowerCase().includes(country) && inst.country.toLowerCase() !== country) {
      // allow Arabic country labels loosely
      const map: Record<string, string> = {
        ألمانيا: "germany",
        الاردن: "jordan",
        الأردن: "jordan",
        هولندا: "netherlands",
        تايلاند: "thailand",
      };
      const mapped = map[profile.preferredStudyCountry || ""] || "";
      if (mapped && inst.country.toLowerCase() !== mapped) return false;
      if (!mapped && profile.preferredStudyCountry) {
        if (!inst.country.toLowerCase().includes(country)) return false;
      }
    }
    if (degree === "school") return inst.kind === "school";
    if (degree === "diploma") return inst.kind === "college" || inst.kind === "university";
    if (inst.kind === "school") return false;
    if (!inst.degrees.includes(degree) && degree) return false;
    if (Number(profile.gpa) < Number(inst.min_gpa || 0)) return false;
    return inst.majors.some(
      (m) => m.toLowerCase().includes(major) || major.includes(m.toLowerCase()),
    );
  })
    .map((inst) => ({
      ...inst,
      criteria:
        CRITERIA[inst.slug]?.[nationality] ||
        CRITERIA[inst.slug]?.Jordan ||
        {
          nationality,
          title: `${nationality} applicant track`,
          channel: inst.is_partner ? "SUCCESS OS partner channel" : "Official email",
          fees_note: "Confirm on institution site",
          visa_note: nationality === inst.country ? "Usually not required" : "Student visa likely",
          docs: ["Passport", "Transcripts", "Language proof"],
          summary: `Admission conditions for ${nationality} applicants at ${inst.name}.`,
        },
    }))
    .sort((a, b) => Number(b.is_partner) - Number(a.is_partner));
}
