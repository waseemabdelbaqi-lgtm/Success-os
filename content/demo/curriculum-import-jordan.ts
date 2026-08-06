/**
 * Demo Jordan curriculum fixture for Curriculum Import Engine.
 * Uses existing Success OS Jordan Grade 5 Science structure — no AI rewrite.
 */
import type { DetectedBook, CurriculumSourceRef } from "@/types/curriculum-import-engine";

export const JORDAN_IMPORT_SOURCE: CurriculumSourceRef = {
  id: "src_jo_nccd_g5_sci_s1",
  type: "curriculum_authority",
  connectorId: "jordan-nccd",
  label: {
    en: "Jordan NCCD — Grade 5 Science Semester 1 (structure baseline)",
    ar: "المركز الوطني لتطوير المناهج — علوم صف خامس فصل 1",
  },
  country: "Jordan",
  curriculum: "Jordan National Curriculum",
  url: "https://nccd.gov.jo",
  authority: "National Center for Curriculum Development (NCCD)",
  license: "structure-reference-only",
  rightsNotes: {
    en: "Unit/lesson structure aligned to official NCCD baseline. Body text is Success OS original — not a copy of protected textbooks.",
    ar: "بنية الوحدات والدروس مطابقة لخط الأساس الرسمي. النص الأصلي لـ SUCCESS OS وليس نسخًا من كتب محمية.",
  },
};

/** Minimal verified structure for import demos — mirrors JO-G5-SCI-S1 hierarchy */
export function buildJordanGrade5ScienceDetectedBook(): DetectedBook {
  return {
    id: "JO-G5-SCI-S1",
    title: {
      en: "Science — Grade 5 — Semester 1",
      ar: "العلوم - الصف الخامس - الفصل الأول",
    },
    checksum: "",
    metadata: {
      country: "Jordan",
      curriculum: "Jordan National Curriculum",
      grade: "Grade 5",
      semester: "Semester 1",
      subject: "Science",
      language: "bilingual",
      edition: "SOS-2026.1",
      keywords: ["ecosystem", "classification", "energy", "elements", "light", "sound"],
      objectives: [
        {
          en: "Understand ecosystems and living/non-living interactions",
          ar: "فهم الأنظمة البيئية وتفاعل الحي وغير الحي",
        },
      ],
      sourceId: JORDAN_IMPORT_SOURCE.id,
      rightsStatus: "verified",
      verificationStatus: "verified",
    },
    units: [
      {
        id: "jo_g5_sci_u1",
        title: { en: "Environment", ar: "البيئة" },
        order: 1,
        overview: {
          en: "Ecosystem components and environmental change.",
          ar: "مكونات النظام البيئي وتغيرات البيئة.",
        },
        lessons: [
          {
            id: "jo_g5_sci_u1_l1",
            title: { en: "Ecosystem concepts", ar: "مفاهيم النظام البيئي" },
            order: 1,
            objectives: [
              {
                en: "Distinguish living and non-living components",
                ar: "تمييز المكونات الحية وغير الحية",
              },
              {
                en: "Explain habitat, population, and community",
                ar: "تفسير الموطن والجماعة والمجتمع الحيوي",
              },
            ],
            keywords: ["ecosystem", "habitat", "population"],
            body: {
              en: "An ecosystem is a place where living things interact with water, air, soil, and light. Each organism needs a habitat. A population is one species; a community includes many species.",
              ar: "النظام البيئي مساحة تتفاعل فيها كائنات حية مع الماء والهواء والتربة والضوء. يحتاج كل كائن إلى موطن. الجماعة أفراد النوع نفسه، والمجتمع الحيوي يضم جماعات لأنواع مختلفة.",
            },
            assets: [],
            references: [
              {
                label: {
                  en: "NCCD curriculum baseline (structure)",
                  ar: "خط أساس منهاج المركز الوطني (بنية)",
                },
                href: "https://nccd.gov.jo",
              },
            ],
          },
          {
            id: "jo_g5_sci_u1_l2",
            title: {
              en: "Effects of environmental change",
              ar: "أثر تغيرات البيئة في الأنظمة البيئية",
            },
            order: 2,
            objectives: [
              {
                en: "Classify natural and human-caused changes",
                ar: "تصنيف التغيرات الطبيعية والبشرية",
              },
            ],
            keywords: ["pollution", "change", "conservation"],
            body: {
              en: "Ecosystems change through drought, floods, pollution, and deforestation. Effects are linked across the system.",
              ar: "تتغير الأنظمة البيئية بفعل الجفاف والفيضانات أو التلوث وقطع الأشجار. الأثر مترابط عبر النظام.",
            },
            assets: [],
            references: [],
          },
        ],
      },
      {
        id: "jo_g5_sci_u2",
        title: { en: "Classification of living things", ar: "تصنيف الكائنات الحية" },
        order: 2,
        overview: {
          en: "Plants, animals, and fungi.",
          ar: "النباتات والحيوانات والفطريات.",
        },
        lessons: [
          {
            id: "jo_g5_sci_u2_l1",
            title: { en: "Plant kingdom", ar: "مملكة النباتات" },
            order: 1,
            objectives: [
              { en: "Describe plant traits", ar: "وصف صفات النباتات" },
            ],
            keywords: ["plants", "photosynthesis"],
            body: {
              en: "Plants usually make their own food using light, water, and carbon dioxide. They differ in seeds, flowers, and transport tissues.",
              ar: "النباتات كائنات حية تصنع غذاءها غالبًا باستخدام الضوء والماء وثاني أكسيد الكربون.",
            },
            assets: [],
            references: [],
          },
        ],
      },
    ],
  };
}
