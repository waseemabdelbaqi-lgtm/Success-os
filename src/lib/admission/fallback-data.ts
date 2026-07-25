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
  // MENA demo universities (2026 criteria) — mirrors 20260725_mena_institutions_seed.sql
  {
    id: "00000000-0000-4000-8000-000000000011",
    name: "جامعة الملك سعود - الرياض",
    type: "university",
    country: "Saudi Arabia",
    majors: ["Engineering", "Medicine", "Sciences", "Business"],
    is_partner: true,
    official_email: "admission@ksu.edu.sa",
    logo_url: "https://ksu.edu.sa",
  },
  {
    id: "00000000-0000-4000-8000-000000000012",
    name: "جامعة القاهرة - مصر",
    type: "university",
    country: "Egypt",
    majors: ["Engineering", "Computing", "Medicine", "Arts"],
    is_partner: false,
    official_email: "foreign.students@cu.edu.eg",
    logo_url: "https://cu.edu.eg",
  },
  {
    id: "00000000-0000-4000-8000-000000000013",
    name: "الجامعة الأردنية - عمان",
    type: "university",
    country: "Jordan",
    majors: ["Engineering", "Pharmacy", "Computing", "Sciences"],
    is_partner: false,
    official_email: "intl.students@ju.edu.jo",
    logo_url: "https://ju.edu.jo",
  },
  {
    id: "00000000-0000-4000-8000-000000000014",
    name: "جامعة بهتشه شهير اسطنبول",
    type: "university",
    country: "Turkey",
    majors: ["Engineering", "Business", "Medicine", "Computing", "Design"],
    is_partner: true,
    official_email: "international@bau.edu.tr",
    logo_url: "https://bau.edu.tr",
  },
  {
    id: "00000000-0000-4000-8000-000000000015",
    name: "جامعة الشارقة - الإمارات",
    type: "university",
    country: "United Arab Emirates",
    majors: ["Engineering", "Medicine", "Business", "Sciences"],
    is_partner: false,
    official_email: "admissions@sharjah.ac.ae",
    logo_url: "https://sharjah.ac.ae",
  },
  {
    id: "00000000-0000-4000-8000-000000000016",
    name: "جامعة قطر - الدوحة",
    type: "university",
    country: "Qatar",
    majors: ["Engineering", "Medicine", "Business", "Law", "Sciences"],
    is_partner: false,
    official_email: "admission@qu.edu.qa",
    logo_url: "https://qu.edu.qa",
  },
  {
    id: "00000000-0000-4000-8000-000000000017",
    name: "جامعة مالايا - ماليزيا",
    type: "university",
    country: "Malaysia",
    majors: ["Engineering", "Medicine", "Computing", "Sciences", "Business"],
    is_partner: true,
    official_email: "international@um.edu.my",
    logo_url: "https://um.edu.my",
  },
  {
    id: "00000000-0000-4000-8000-000000000018",
    name: "جامعة قازان الفيدرالية - روسيا",
    type: "university",
    country: "Russia",
    majors: ["Medicine", "Engineering", "Sciences", "Languages"],
    is_partner: false,
    official_email: "admission@kpfu.ru",
    logo_url: "https://kpfu.ru",
  },
];

type FallbackCriteria = {
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
};

const CRITERIA: Record<string, FallbackCriteria[]> = {
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
  "00000000-0000-4000-8000-000000000011": [
    {
      nationality: "Egyptian",
      min_gpa: 3.2,
      requirements_text:
        "يتطلب القبول للطلاب المصريين شهادة الثانوية العامة مصدقة من الخارجية المصرية والسفارة السعودية، مع فحص طبي معتمد وخلو سوابق من وزارة الداخلية لتأشيرة الدخول.",
      avg_living_cost: "350$ - 500$ شهرياً (شامل السكن والطعام المتوسط)",
      deadline_date: "2026-08-25",
      is_accredited_in_home_country: true,
    },
    {
      nationality: "Syrian",
      min_gpa: 3.2,
      requirements_text:
        "القبول متاح عبر نظام المنح الخارجية للوافدين، يشترط ألا يتجاوز السن 25 عاماً، وتوفير صلة قرابة (محرم نظامي) للطالبات الإناث بالمملكة.",
      is_accredited_in_home_country: true,
      max_age_allowed: 25,
      requires_embassy_letter: false,
      requires_security_clearance: true,
    },
  ],
  "00000000-0000-4000-8000-000000000012": [
    {
      nationality: "Saudi",
      min_gpa: 2.5,
      requirements_text:
        "التقديم متاح عبر الإدارة العامة للوافدين بمصر، يتطلب دفع رسوم القيد السنوية البالغة 1500 دولار للمرة الأولى، وتصديق الشهادة الثانوية من الملحقية الثقافية المصرية بالرياض.",
      avg_living_cost: "150$ - 300$ شهرياً (معيشة اقتصادية جداً للطلاب)",
      deadline_date: "2026-09-10",
      is_accredited_in_home_country: true,
    },
    {
      nationality: "Jordanian",
      min_gpa: 2.5,
      requirements_text:
        "القبول فوري لتخصصات الهندسة والحاسبات بمعدل لا يقل عن 65%، يتطلب توفير شهادة ميلاد أصلية وصورة جواز السفر معتمدة من السفارة الأردنية بالقاهرة.",
      is_accredited_in_home_country: true,
    },
    {
      nationality: "Kuwaiti",
      min_gpa: 2.5,
      requirements_text:
        "يشترط إحضار موافقة رسمية وخطاب عدم ممانعة من المكتب الثقافي الكويتي بالقاهرة مصدقاً وموجهاً للكلية.",
      requires_embassy_letter: true,
      requires_security_clearance: false,
      is_accredited_in_home_country: true,
    },
  ],
  "00000000-0000-4000-8000-000000000013": [
    {
      nationality: "Egyptian",
      min_gpa: 2.8,
      requirements_text:
        "القبول عبر البرنامج الدولي بالجامعة، الحد الأدنى للهندسة والصيدلة هو 80% وللتخصصات الأخرى 60%، يشترط مراجعة مكتب الفحص الأمني للوافدين في عمان فور الدخول لإتمام الإقامة.",
    },
    {
      nationality: "Iraqi",
      min_gpa: 3.2,
      requirements_text:
        "يتطلب القبول في البرنامج الدولي تصديق وثيقة الثانوية من وزارة التربية العراقية والخارجية، والحد الأدنى للطب البشري 90% والهندسة 80%.",
      avg_living_cost: "400$ - 600$ شهرياً (عمان)",
      deadline_date: "2026-09-15",
      is_accredited_in_home_country: true,
    },
  ],
  "00000000-0000-4000-8000-000000000014": [
    {
      nationality: "Syrian",
      min_gpa: 2.0,
      requirements_text:
        "القبول بالشهادة الثانوية مباشرة بدون اختبارات قبول. يشترط فقط حيازة جواز سفر ساري وعمل معادلة شهادة Denklik بعد الوصول.",
      avg_living_cost: "350$ - 500$ شهرياً (إسطنبول)",
      deadline_date: "2026-09-30",
      is_accredited_in_home_country: true,
    },
    {
      nationality: "Iraqi",
      min_gpa: 2.0,
      requirements_text:
        "القبول بالشهادة الثانوية العراقية مباشرة بدون يوس، ويشترط الخضوع لسنة اللغة التحضيرية وعمل معادلة Denklik بالقنصلية التركية.",
      requires_embassy_letter: false,
      requires_security_clearance: false,
      alternative_exam_required: "TÖMER/IELTS",
      is_accredited_in_home_country: true,
    },
  ],
  "00000000-0000-4000-8000-000000000015": [
    {
      nationality: "Yemeni",
      min_gpa: 3.5,
      requirements_text:
        "يشترط شهادة آيلتس 5.5 أكاديمية بشكل فوري، مع رفع درجات اختبار EmSAT الوطني بمعدل لا يقل عن 1100 في الرياضيات والفيزياء.",
      alternative_exam_required: "IELTS 5.5 + EmSAT",
      avg_living_cost: "800$ - 1200$ شهرياً",
      deadline_date: "2026-08-15",
      is_accredited_in_home_country: true,
    },
  ],
  "00000000-0000-4000-8000-000000000017": [
    {
      nationality: "Syrian",
      min_gpa: 3.0,
      requirements_text:
        "القبول يعتمد على درجات المواد العلمية (فوق 70% في الرياضيات). يشترط الخضوع للفحص الطبي الإلزامي لوزارة الهجرة EMGS للحصول على موافقة الفيزا (VAL).",
      max_age_allowed: 28,
      alternative_exam_required: "EMGS Medical Check",
      avg_living_cost: "400$ - 600$ شهرياً",
      deadline_date: "2026-09-01",
      is_accredited_in_home_country: true,
    },
  ],
  "00000000-0000-4000-8000-000000000018": [
    {
      nationality: "Egyptian",
      min_gpa: 2.0,
      requirements_text:
        "القبول مباشر بمعدل ثانوية يبدأ من 60% للقطاع الطبي. يشترط رفع شهادة فحص HIV مترجمة للروسية، واجتياز السنة التحضيرية للغة (Pre-University Russian Course).",
      alternative_exam_required: "HIV Test + Russian Year",
      avg_living_cost: "250$ - 400$ شهرياً",
      deadline_date: "2026-10-15",
      is_accredited_in_home_country: true,
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
    syrian: "syria",
    syria: "syria",
    saudi: "saudi",
    "saudi arabian": "saudi",
    iraqi: "iraq",
    iraq: "iraq",
    kuwaiti: "kuwait",
    kuwait: "kuwait",
    yemeni: "yemen",
    yemen: "yemen",
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
