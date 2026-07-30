/**
 * RIGHTS_ENGINE — provenance and license gates. Never copies protected prose.
 */
import type { CurriculumSourceRef, RightsStatus } from "@/types/curriculum-import-engine";

export type RightsDecision = {
  status: RightsStatus;
  allowedToCompile: boolean;
  allowedToPublish: boolean;
  license: string;
  notes: { en: string; ar: string };
};

const REJECTED_LICENSES = new Set(["rejected", "forbidden", "all-rights-reserved-copy"]);

export function evaluateRights(source: CurriculumSourceRef): RightsDecision {
  const license = String(source.license || "unknown").toLowerCase();
  if (REJECTED_LICENSES.has(license) || !source.authority) {
    return {
      status: "rejected",
      allowedToCompile: false,
      allowedToPublish: false,
      license,
      notes: {
        en: "Rights rejected — missing authority or forbidden license.",
        ar: "رُفضت الحقوق — سلطة مفقودة أو ترخيص ممنوع.",
      },
    };
  }

  if (
    license.includes("structure-reference") ||
    license.includes("oer") ||
    license.includes("internal") ||
    source.type === "internal_success_os" ||
    source.type === "oer" ||
    source.type === "open_textbook"
  ) {
    return {
      status: "verified",
      allowedToCompile: true,
      allowedToPublish: true,
      license,
      notes: source.rightsNotes || {
        en: "Rights verified for structure/OER/internal compilation into ILE packages.",
        ar: "حقوق موثّقة لتجميع البنية/OER/الداخلي إلى حزم ILE.",
      },
    };
  }

  if (source.type === "licensed_publisher") {
    return {
      status: "restricted",
      allowedToCompile: true,
      allowedToPublish: false,
      license,
      notes: {
        en: "Licensed publisher — compile allowed; publish requires explicit clearance.",
        ar: "ناشر مرخّص — التجميع مسموح؛ النشر يحتاج تصريحًا صريحًا.",
      },
    };
  }

  return {
    status: "unknown",
    allowedToCompile: false,
    allowedToPublish: false,
    license,
    notes: {
      en: "Unknown rights — cannot publish.",
      ar: "حقوق غير معروفة — لا يمكن النشر.",
    },
  };
}
