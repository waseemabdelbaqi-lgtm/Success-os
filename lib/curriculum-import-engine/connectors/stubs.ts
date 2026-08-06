import type { SourceConnector } from "./types";
import type { CurriculumSourceRef } from "@/types/curriculum-import-engine";

function stubConnector(
  id: string,
  type: SourceConnector["type"],
  label: { en: string; ar: string },
): SourceConnector {
  return {
    id,
    type,
    label,
    modular: true,
    countries: ["*"],
    async discover(): Promise<CurriculumSourceRef[]> {
      return [];
    },
    async loadBook() {
      return null;
    },
  };
}

export const ministryEducationConnector = stubConnector(
  "ministry-of-education",
  "ministry_of_education",
  { en: "Ministry of Education", ar: "وزارة التربية والتعليم" },
);

export const curriculumAuthorityConnector = stubConnector(
  "curriculum-authority",
  "curriculum_authority",
  { en: "Curriculum Authority", ar: "هيئة المناهج" },
);

export const oerConnector = stubConnector("oer", "oer", {
  en: "Open Educational Resources",
  ar: "موارد تعليمية مفتوحة",
});

export const licensedPublisherConnector = stubConnector(
  "licensed-publisher",
  "licensed_publisher",
  { en: "Licensed Publisher", ar: "ناشر مرخّص" },
);

export const openTextbookConnector = stubConnector("open-textbook", "open_textbook", {
  en: "Open Textbooks",
  ar: "كتب مفتوحة",
});

export const internalSuccessOsConnector = stubConnector(
  "internal-success-os",
  "internal_success_os",
  { en: "Internal Success OS Content", ar: "محتوى SUCCESS OS الداخلي" },
);
