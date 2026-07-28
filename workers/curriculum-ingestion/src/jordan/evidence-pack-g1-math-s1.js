/**
 * Curriculum Evidence Pack — Jordan · Grade 1 · Mathematics · Semester 1
 * LEGAL ORIGINAL-CONTENT MODE scaffolding.
 *
 * Rules:
 * - Every claim has URL + access date + confidence.
 * - Do NOT invent official unit/lesson titles as VERIFIED.
 * - OpenStax is never a Jordan source.
 */
import { JORDAN_OFFICIAL_SOURCE_REGISTRY } from "./official-source-registry.js";

export const EVIDENCE_PACK_ID = "jo-g1-math-s1-evidence-v1";
export const TARGET = Object.freeze({
  country: "Jordan",
  countryAr: "الأردن",
  curriculum: "المنهاج الوطني الأردني",
  grade: "الصف 1",
  gradeCode: "1",
  subject: "الرياضيات",
  semester: "الفصل الدراسي الأول",
  productName:
    "كتاب Success OS التفاعلي المتوافق مع نتاجات المنهاج الأردني",
  productNameNote:
    "ليس نسخة رقمية من كتاب الوزارة/المركز الوطني، ولا يُعاد نشر نصوص أو صور NCCD.",
});

export function buildEvidencePackSkeleton({ diagnosticsByUrl = {}, generatedAt = new Date().toISOString() } = {}) {
  const withAccess = (source) => {
    const d = diagnosticsByUrl[source.url] || null;
    return {
      ...source,
      accessedAt: d?.accessedAt || generatedAt,
      accessResult: d?.reason || "NOT_PROBED",
      accessReasonType: d?.reasonType || "NOT_PROBED",
      confidence:
        d?.reasonType === "OK"
          ? "VERIFIED"
          : source.type === "official-textbook-pdf" || source.type === "grade-catalog"
            ? "PARTIAL"
            : "PARTIAL",
    };
  };

  const officialSources = JORDAN_OFFICIAL_SOURCE_REGISTRY.map(withAccess);

  const claims = [
    {
      id: "claim-framework-name",
      claim: "اسم الإطار الرسمي المرجعي للمبحث: الإطار الخاص ومعايير ومؤشرات أداء مبحث الرياضيات",
      url: "https://www.nccd.gov.jo/AR/List/__%D8%A7%D9%84%D8%A3%D8%B7%D8%B1____",
      accessedAt: diagnosticsByUrl["https://www.nccd.gov.jo/AR/List/__%D8%A7%D9%84%D8%A3%D8%B7%D8%B1____"]?.accessedAt || generatedAt,
      accessResult:
        diagnosticsByUrl["https://www.nccd.gov.jo/AR/List/__%D8%A7%D9%84%D8%A3%D8%B7%D8%B1____"]?.reason ||
        "NOT_PROBED",
      confidence: "PARTIAL",
      note: "عنوان الإطار منشور في فهرس أطر NCCD. النص الكامل للنتاجات لم يُستخرج حياً بسبب TLS_RESET.",
    },
    {
      id: "claim-book-identity",
      claim:
        "هوية الكتاب الرسمي: الرياضيات — الصف الأول — الفصل الدراسي الأول — كتاب الطالب (MA.01.ST.BOOK_WEB.pdf)",
      url: "https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/MA.01.ST.BOOK_WEB.pdf",
      catalogUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
      accessedAt:
        diagnosticsByUrl[
          "https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/MA.01.ST.BOOK_WEB.pdf"
        ]?.accessedAt || generatedAt,
      accessResult:
        diagnosticsByUrl[
          "https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/MA.01.ST.BOOK_WEB.pdf"
        ]?.reason || "NOT_PROBED",
      confidence: "PARTIAL",
      note: "هوية الكتالوج/اسم الملف مؤكدة من أعمال سابقة على فهرس NCCD؛ التنزيل الحي فشل بـ TLS_RESET.",
    },
    {
      id: "claim-g1-subjects",
      claim: "قائمة مواد الصف الأول تشمل الرياضيات ضمن فهرس TextBooksGrade/68",
      url: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
      accessedAt:
        diagnosticsByUrl["https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68"]?.accessedAt ||
        generatedAt,
      accessResult:
        diagnosticsByUrl["https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68"]?.reason ||
        "NOT_PROBED",
      confidence: "PARTIAL",
      note: "قائمة المواد محفوظة من مواءمة سابقة للفهرس الرسمي؛ إعادة الجلب الحي غير متاحة حالياً.",
    },
  ];

  // Proposed Success OS curriculum map — NOT official NCCD TOC.
  // Admin must approve before any lesson generation.
  const proposedMapForReview = [
    {
      id: "unit-prop-1",
      kind: "unit",
      title: "الأعداد حتى 10 (مقترح Success OS للمراجعة)",
      officialClaim: false,
      confidence: "UNVERIFIED",
      status: "PENDING_REVIEW",
      note: "عنوان مقترح للتوافق التربوي العام — ليس عنوان وحدة رسمي مستخرجاً من كتاب/إطار NCCD.",
      outcomes: [
        {
          id: "out-prop-1a",
          text: "يعدّ المتعلم مجموعة حتى 10 عناصر (مقترح للمراجعة)",
          confidence: "UNVERIFIED",
          status: "PENDING_REVIEW",
          officialClaim: false,
        },
        {
          id: "out-prop-1b",
          text: "يقارن مجموعتين باستخدام أكثر/أقل/يساوي (مقترح للمراجعة)",
          confidence: "UNVERIFIED",
          status: "PENDING_REVIEW",
          officialClaim: false,
        },
      ],
      lessons: [
        {
          id: "lesson-prop-1-1",
          title: "نعدّ الأشياء من حولنا (مقترح)",
          confidence: "UNVERIFIED",
          status: "PENDING_REVIEW",
          officialClaim: false,
        },
      ],
    },
    {
      id: "unit-prop-2",
      kind: "unit",
      title: "الجمع ضمن 10 (مقترح Success OS للمراجعة)",
      officialClaim: false,
      confidence: "UNVERIFIED",
      status: "PENDING_REVIEW",
      note: "مقترح تربوي أصلي — يحتاج مطابقة مع نتاجات الإطار الخاص للرياضيات بعد الوصول الرسمي.",
      outcomes: [
        {
          id: "out-prop-2a",
          text: "يجمع مجموعتين صغيرتين ضمن 10 (مقترح للمراجعة)",
          confidence: "UNVERIFIED",
          status: "PENDING_REVIEW",
          officialClaim: false,
        },
      ],
      lessons: [
        {
          id: "lesson-prop-2-1",
          title: "نجمع الأشياء معاً (مقترح)",
          confidence: "UNVERIFIED",
          status: "PENDING_REVIEW",
          officialClaim: false,
        },
      ],
    },
  ];

  const gaps = [
    "النص الكامل للإطار الخاص بمبحث الرياضيات غير متاح حياً من شبكة الـ Worker (TLS_RESET).",
    "نتاجات التعلم الرسمية الخاصة بالصف الأول / الفصل الأول غير مستخرجة من مصدر رسمي حي → جميع النتاجات الحالية UNVERIFIED.",
    "عناوين الوحدات والدروس الرسمية من كتاب الطالب غير متاحة → 0 VERIFIED units/lessons.",
    "ملف PDF الرسمي غير قابل للتنزيل من هذه الشبكة → لا استخراج صفحات.",
    "يلزم مراجعة تربوية بشرية لاعتماد خريطة Success OS المقترحة قبل أي توليد درس.",
  ];

  const verifiedLearningOutcomes = claims.filter(
    (c) => c.confidence === "VERIFIED" && c.id.includes("outcome"),
  );
  const verifiedUnits = [];
  const verifiedLessons = [];

  const autoGate = {
    hasOfficialSources: officialSources.length > 0,
    verifiedJordanSources: officialSources.filter((s) => s.confidence === "VERIFIED").length,
    verifiedLearningOutcomes: verifiedLearningOutcomes.length,
    verifiedUnits: verifiedUnits.length,
    verifiedLessons: verifiedLessons.length,
    jordanFilesVerified: 0,
    openStaxExcluded: true,
    lessonGenerationAllowed: false,
    reason:
      "EVIDENCE_INCOMPLETE: no live-verified Jordan units/lessons/outcomes; admin approval of curriculum map required; LEGAL ORIGINAL-CONTENT MODE active.",
  };

  return {
    id: EVIDENCE_PACK_ID,
    version: 1,
    status: "PENDING_ADMIN_APPROVAL",
    mode: "LEGAL_ORIGINAL_CONTENT_MODE",
    target: TARGET,
    generatedAt,
    officialSources,
    claims,
    proposedMapForReview,
    gaps,
    counts: {
      officialEvidenceSources: officialSources.length,
      verifiedLearningOutcomes: verifiedLearningOutcomes.length,
      verifiedUnits: verifiedUnits.length,
      verifiedLessons: verifiedLessons.length,
      proposedUnits: proposedMapForReview.length,
      proposedLessons: proposedMapForReview.reduce((n, u) => n + (u.lessons?.length || 0), 0),
      proposedOutcomes: proposedMapForReview.reduce((n, u) => n + (u.outcomes?.length || 0), 0),
    },
    autoGate,
    rights: {
      republishNccdTextOrImages: false,
      storeFullOfficialPdf: false,
      originalSuccessOsContentOnly: true,
      productLabel: TARGET.productName,
    },
  };
}

export function canApproveCurriculumMap(pack, reviews = {}) {
  if (!pack?.autoGate) return { ok: false, reason: "MISSING_PACK" };
  // Admin may approve proposed map for LEGAL ORIGINAL-CONTENT MODE even when
  // official units are unverified — but must explicitly accept gaps.
  const units = pack.proposedMapForReview || [];
  for (const u of units) {
    if (reviews[u.id] !== "accepted") {
      return { ok: false, reason: `UNIT_NOT_ACCEPTED:${u.id}` };
    }
    for (const o of u.outcomes || []) {
      if (reviews[o.id] !== "accepted") {
        return { ok: false, reason: `OUTCOME_NOT_ACCEPTED:${o.id}` };
      }
    }
  }
  if (!reviews.__acceptGaps) {
    return { ok: false, reason: "GAPS_NOT_ACKNOWLEDGED" };
  }
  return { ok: true, reason: null };
}

export function jordanContentPass(metrics) {
  return Boolean(
    metrics?.verifiedJordanSources > 0 &&
      metrics?.officialJordanUnits > 0 &&
      metrics?.officialJordanLessons > 0 &&
      metrics?.sampleLessonJordanTraceable &&
      metrics?.curriculumMapStatus === "APPROVED" &&
      metrics?.sampleLessonStatus === "APPROVED",
  );
}
