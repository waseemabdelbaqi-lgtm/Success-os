/**
 * Cross-curriculum mapping seed — demonstrates relationships, does not copy curricula.
 * All references use Global IDs. No country-specific platform hardcoding.
 *
 * Example pathway:
 *   Jordan Grade 8 Science
 *   → IGCSE Combined Science
 *   → AP Biology
 *   → US NGSS
 *   → IB MYP Science
 *   → Cambridge Lower Secondary
 *   → Future AI Recommendations (placeholder node only)
 */
import type {
  CurriculumMappingRecord,
  GlobalAssessmentObjectiveRecord,
  GlobalCompetencyRecord,
  GlobalLearningObjectiveRecord,
  GlobalStandardRecord,
  MappedEntityRef,
  MappingEvidenceSource,
  SkillGraphEdge,
} from "@/types/universal-curriculum-mapping";
import type { LocaleText } from "@/types/interactive-lesson-engine";

function L(en: string, ar: string): LocaleText {
  return { en, ar };
}

function evidence(
  id: string,
  kind: MappingEvidenceSource["kind"],
  en: string,
  ar: string,
  href?: string,
): MappingEvidenceSource {
  return {
    id,
    kind,
    label: L(en, ar),
    href,
    retrievedAt: "2026-07-30",
  };
}

/** Stable demo Global IDs for cross-curriculum entities (append-only). */
export const UCE_ENTITY_IDS = {
  // Countries
  ctrJordan: "CTR-00001",
  ctrUSA: "CTR-00002",
  ctrUK: "CTR-00003",
  ctrIntl: "CTR-00004",
  // Curricula
  curJordanNational: "CUR-00001",
  curIGCSE: "CUR-00002",
  curAP: "CUR-00003",
  curNGSS: "CUR-00004",
  curIBMYP: "CUR-00005",
  curCambridgeLS: "CUR-00006",
  // Grades
  grdJo8: "GRD-00010",
  grdIgCse: "GRD-00011",
  grdAp: "GRD-00012",
  grdNgssMs: "GRD-00013",
  grdIbMyp3: "GRD-00014",
  grdCamLs8: "GRD-00015",
  // Subjects (reuse Global Subject Registry where possible)
  subScience: "SUB-00002",
  subBiology: "SUB-00005",
  // Lessons (mapping nodes — not full ILE content)
  lsnJoG8SciCells: "LSN-01001",
  lsnIgCseCells: "LSN-01002",
  lsnApBioCells: "LSN-01003",
  lsnNgssCells: "LSN-01004",
  lsnIbMypCells: "LSN-01005",
  lsnCamLsCells: "LSN-01006",
  lsnFutureAiRec: "LSN-01999",
  // Skills
  sklObservation: "SKL-00015",
  sklScientificThinking: "SKL-00016",
  sklCriticalThinking: "SKL-00008",
  // Objectives / standards / etc.
  objCellStructure: "OBJ-00001",
  objLivingSystems: "OBJ-00002",
  cmpScientificInquiry: "CMP-00001",
  stdNgssMsLs1: "STD-00001",
  stdIgCseBio1: "STD-00002",
  asoDescribeCell: "ASO-00001",
} as const;

export const UCE_ENTITY_CATALOG: MappedEntityRef[] = [
  {
    globalId: UCE_ENTITY_IDS.lsnJoG8SciCells,
    kind: "lesson",
    label: L("Jordan G8 Science — Cell structure", "الأردن صف 8 علوم — تركيب الخلية"),
    hierarchicalId: "JO-NATIONAL-G08-SCI-B01-U01-L01",
    countryGlobalId: UCE_ENTITY_IDS.ctrJordan,
    curriculumGlobalId: UCE_ENTITY_IDS.curJordanNational,
    subjectGlobalId: UCE_ENTITY_IDS.subScience,
    language: "ar",
  },
  {
    globalId: UCE_ENTITY_IDS.lsnIgCseCells,
    kind: "lesson",
    label: L("IGCSE Combined Science — Cells", "IGCSE العلوم المشتركة — الخلايا"),
    countryGlobalId: UCE_ENTITY_IDS.ctrUK,
    curriculumGlobalId: UCE_ENTITY_IDS.curIGCSE,
    subjectGlobalId: UCE_ENTITY_IDS.subScience,
    language: "en",
  },
  {
    globalId: UCE_ENTITY_IDS.lsnApBioCells,
    kind: "lesson",
    label: L("AP Biology — Cell structure", "AP Biology — تركيب الخلية"),
    countryGlobalId: UCE_ENTITY_IDS.ctrUSA,
    curriculumGlobalId: UCE_ENTITY_IDS.curAP,
    subjectGlobalId: UCE_ENTITY_IDS.subBiology,
    language: "en",
  },
  {
    globalId: UCE_ENTITY_IDS.lsnNgssCells,
    kind: "lesson",
    label: L("US NGSS — From molecules to organisms", "NGSS — من الجزيئات إلى الكائنات"),
    countryGlobalId: UCE_ENTITY_IDS.ctrUSA,
    curriculumGlobalId: UCE_ENTITY_IDS.curNGSS,
    subjectGlobalId: UCE_ENTITY_IDS.subScience,
    language: "en",
  },
  {
    globalId: UCE_ENTITY_IDS.lsnIbMypCells,
    kind: "lesson",
    label: L("IB MYP Science — Cells", "IB MYP العلوم — الخلايا"),
    countryGlobalId: UCE_ENTITY_IDS.ctrIntl,
    curriculumGlobalId: UCE_ENTITY_IDS.curIBMYP,
    subjectGlobalId: UCE_ENTITY_IDS.subScience,
    language: "en",
  },
  {
    globalId: UCE_ENTITY_IDS.lsnCamLsCells,
    kind: "lesson",
    label: L("Cambridge Lower Secondary — Cells", "Cambridge المرحلة الإعدادية — الخلايا"),
    countryGlobalId: UCE_ENTITY_IDS.ctrUK,
    curriculumGlobalId: UCE_ENTITY_IDS.curCambridgeLS,
    subjectGlobalId: UCE_ENTITY_IDS.subScience,
    language: "en",
  },
  {
    globalId: UCE_ENTITY_IDS.lsnFutureAiRec,
    kind: "lesson",
    label: L("Future AI Recommendations (placeholder)", "توصيات الذكاء الاصطناعي المستقبلية (عنصر نائب)"),
    language: "en",
  },
];

function map(
  n: number,
  relation: CurriculumMappingRecord["relation"],
  sourceId: string,
  targetId: string,
  confidence: number,
  evidenceList: MappingEvidenceSource[],
  notesEn: string,
  notesAr: string,
): CurriculumMappingRecord {
  const source = UCE_ENTITY_CATALOG.find((e) => e.globalId === sourceId)!;
  const target = UCE_ENTITY_CATALOG.find((e) => e.globalId === targetId)!;
  return {
    globalId: `MAP-${String(n).padStart(5, "0")}`,
    relation,
    source,
    target,
    confidence,
    evidence: evidenceList,
    notes: L(notesEn, notesAr),
    active: true,
    createdAt: "2026-07-30T00:00:00.000Z",
  };
}

const eCells = evidence(
  "ev_cells_framework",
  "standards_framework",
  "Cell biology topic alignment across secondary science frameworks",
  "مواءمة موضوع بيولوجيا الخلية عبر أطر العلوم الثانوية",
);

export const UCE_MAPPING_SEED: CurriculumMappingRecord[] = [
  map(
    1,
    "equivalent",
    UCE_ENTITY_IDS.lsnJoG8SciCells,
    UCE_ENTITY_IDS.lsnIgCseCells,
    0.86,
    [eCells, evidence("ev_igcse", "exam_board_spec", "Cambridge IGCSE Combined Science topic list", "قائمة موضوعات IGCSE")],
    "Jordan G8 Science cell topic ≈ IGCSE Combined Science cells",
    "موضوع الخلية في علوم الصف 8 ≈ خلايا IGCSE",
  ),
  map(
    2,
    "partially_equivalent",
    UCE_ENTITY_IDS.lsnIgCseCells,
    UCE_ENTITY_IDS.lsnApBioCells,
    0.72,
    [eCells, evidence("ev_ap", "exam_board_spec", "AP Biology Unit 2 Cell Structure", "AP Biology الوحدة 2")],
    "IGCSE cells partially cover AP Biology cell structure depth",
    "خلايا IGCSE تغطي جزئيًا عمق تركيب الخلية في AP",
  ),
  map(
    3,
    "related",
    UCE_ENTITY_IDS.lsnApBioCells,
    UCE_ENTITY_IDS.lsnNgssCells,
    0.8,
    [eCells, evidence("ev_ngss", "standards_framework", "NGSS MS-LS1 From Molecules to Organisms", "NGSS MS-LS1")],
    "AP Biology cells related to NGSS MS-LS1 performance expectations",
    "خلايا AP مرتبطة بتوقعات أداء NGSS MS-LS1",
  ),
  map(
    4,
    "equivalent",
    UCE_ENTITY_IDS.lsnNgssCells,
    UCE_ENTITY_IDS.lsnIbMypCells,
    0.78,
    [eCells, evidence("ev_ib", "exam_board_spec", "IB MYP Sciences guide — cells", "دليل IB MYP للعلوم — الخلايا")],
    "NGSS cell concepts ≈ IB MYP Science cells",
    "مفاهيم الخلية في NGSS ≈ خلايا IB MYP",
  ),
  map(
    5,
    "continuation",
    UCE_ENTITY_IDS.lsnIbMypCells,
    UCE_ENTITY_IDS.lsnCamLsCells,
    0.74,
    [eCells, evidence("ev_cam", "publisher", "Cambridge Lower Secondary Science stage 8", "Cambridge المرحلة 8")],
    "IB MYP cells continue themes introduced in Cambridge Lower Secondary",
    "خلايا IB MYP تتابع موضوعات Cambridge Lower Secondary",
  ),
  map(
    6,
    "related",
    UCE_ENTITY_IDS.lsnCamLsCells,
    UCE_ENTITY_IDS.lsnFutureAiRec,
    0.4,
    [evidence("ev_ai_placeholder", "internal_analysis", "Reserved for future AI recommendation engine", "محجوز لمحرك توصيات الذكاء الاصطناعي")],
    "Placeholder link for future AI recommendations — no AI content generated",
    "رابط نائب لتوصيات الذكاء الاصطناعي — لا توليد محتوى",
  ),
  map(
    7,
    "prerequisite",
    UCE_ENTITY_IDS.lsnCamLsCells,
    UCE_ENTITY_IDS.lsnJoG8SciCells,
    0.65,
    [eCells],
    "Cambridge LS cell foundations can precede denser national G8 treatments",
    "أساسيات خلايا Cambridge قد تسبق معالجة الصف 8 الوطنية",
  ),
  map(
    8,
    "advanced",
    UCE_ENTITY_IDS.lsnJoG8SciCells,
    UCE_ENTITY_IDS.lsnApBioCells,
    0.7,
    [eCells],
    "AP Biology is an advanced continuation of G8 cell concepts",
    "AP Biology امتداد متقدم لمفاهيم الخلية في الصف 8",
  ),
  map(
    9,
    "replacement",
    UCE_ENTITY_IDS.lsnCamLsCells,
    UCE_ENTITY_IDS.lsnIbMypCells,
    0.55,
    [evidence("ev_replace", "internal_analysis", "Programme pathway replacement example", "مثال استبدال مسار برنامج")],
    "Example: IB MYP cells may replace Cambridge LS cells in a programme switch",
    "مثال: خلايا IB MYP قد تستبدل خلايا Cambridge عند تبديل البرنامج",
  ),
  map(
    10,
    "historical_version",
    UCE_ENTITY_IDS.lsnJoG8SciCells,
    UCE_ENTITY_IDS.lsnJoG8SciCells,
    0.9,
    [evidence("ev_hist", "official_curriculum", "Prior academic-year edition placeholder", "عنصر نائب لنسخة سنة دراسية سابقة")],
    "Historical version hook — same lesson identity across curriculum editions",
    "ربط النسخة التاريخية — نفس هوية الدرس عبر طبعات المنهاج",
  ),
];

export const UCE_OBJECTIVE_SEED: GlobalLearningObjectiveRecord[] = [
  {
    globalId: UCE_ENTITY_IDS.objCellStructure,
    code: "OBJ_CELL_STRUCTURE",
    statement: L(
      "Describe the basic structure of a plant and animal cell",
      "وصف التركيب الأساسي لخلية نباتية وخلية حيوانية",
    ),
    skillIds: [UCE_ENTITY_IDS.sklObservation, UCE_ENTITY_IDS.sklScientificThinking],
    lessonIds: [
      UCE_ENTITY_IDS.lsnJoG8SciCells,
      UCE_ENTITY_IDS.lsnIgCseCells,
      UCE_ENTITY_IDS.lsnIbMypCells,
      UCE_ENTITY_IDS.lsnCamLsCells,
    ],
    assessmentObjectiveIds: [UCE_ENTITY_IDS.asoDescribeCell],
    digitalBookIds: [],
    videoIds: [],
    aiTutorReady: false,
    subjectGlobalIds: [UCE_ENTITY_IDS.subScience, UCE_ENTITY_IDS.subBiology],
    keywords: ["cell", "organelle", "membrane", "خلية"],
    bloomLevel: "understand",
    active: true,
  },
  {
    globalId: UCE_ENTITY_IDS.objLivingSystems,
    code: "OBJ_LIVING_SYSTEMS",
    statement: L(
      "Explain how cells contribute to living systems",
      "شرح كيف تساهم الخلايا في الأنظمة الحية",
    ),
    skillIds: [UCE_ENTITY_IDS.sklScientificThinking, UCE_ENTITY_IDS.sklCriticalThinking],
    lessonIds: [
      UCE_ENTITY_IDS.lsnNgssCells,
      UCE_ENTITY_IDS.lsnApBioCells,
      UCE_ENTITY_IDS.lsnJoG8SciCells,
    ],
    assessmentObjectiveIds: [],
    digitalBookIds: [],
    videoIds: [],
    aiTutorReady: false,
    subjectGlobalIds: [UCE_ENTITY_IDS.subScience, UCE_ENTITY_IDS.subBiology],
    keywords: ["systems", "organism", "cell", "أنظمة"],
    bloomLevel: "analyze",
    active: true,
  },
];

export const UCE_COMPETENCY_SEED: GlobalCompetencyRecord[] = [
  {
    globalId: UCE_ENTITY_IDS.cmpScientificInquiry,
    code: "CMP_SCIENTIFIC_INQUIRY",
    name: L("Scientific Inquiry", "الاستقصاء العلمي"),
    objectiveIds: [UCE_ENTITY_IDS.objCellStructure, UCE_ENTITY_IDS.objLivingSystems],
    skillIds: [UCE_ENTITY_IDS.sklObservation, UCE_ENTITY_IDS.sklScientificThinking],
    active: true,
  },
];

export const UCE_STANDARD_SEED: GlobalStandardRecord[] = [
  {
    globalId: UCE_ENTITY_IDS.stdNgssMsLs1,
    code: "MS-LS1",
    framework: "NGSS",
    name: L("From Molecules to Organisms: Structures and Processes", "من الجزيئات إلى الكائنات"),
    objectiveIds: [UCE_ENTITY_IDS.objCellStructure, UCE_ENTITY_IDS.objLivingSystems],
    active: true,
  },
  {
    globalId: UCE_ENTITY_IDS.stdIgCseBio1,
    code: "IGCSE-CS-CELLS",
    framework: "IGCSE",
    name: L("Combined Science — Cells", "العلوم المشتركة — الخلايا"),
    objectiveIds: [UCE_ENTITY_IDS.objCellStructure],
    active: true,
  },
];

export const UCE_ASSESSMENT_OBJECTIVE_SEED: GlobalAssessmentObjectiveRecord[] = [
  {
    globalId: UCE_ENTITY_IDS.asoDescribeCell,
    code: "ASO_DESCRIBE_CELL",
    statement: L(
      "Identify and label major cell structures",
      "تحديد وتسمية التراكيب الرئيسية للخلية",
    ),
    objectiveIds: [UCE_ENTITY_IDS.objCellStructure],
    skillIds: [UCE_ENTITY_IDS.sklObservation],
    active: true,
  },
];

export const UCE_SKILL_GRAPH_EDGE_SEED: SkillGraphEdge[] = [
  {
    skillId: UCE_ENTITY_IDS.sklObservation,
    lessonGlobalId: UCE_ENTITY_IDS.lsnJoG8SciCells,
    lessonHierarchicalId: "JO-NATIONAL-G08-SCI-B01-U01-L01",
    countryGlobalId: UCE_ENTITY_IDS.ctrJordan,
    curriculumGlobalId: UCE_ENTITY_IDS.curJordanNational,
    subjectGlobalId: UCE_ENTITY_IDS.subScience,
    weight: 1,
  },
  {
    skillId: UCE_ENTITY_IDS.sklObservation,
    lessonGlobalId: UCE_ENTITY_IDS.lsnIgCseCells,
    countryGlobalId: UCE_ENTITY_IDS.ctrUK,
    curriculumGlobalId: UCE_ENTITY_IDS.curIGCSE,
    subjectGlobalId: UCE_ENTITY_IDS.subScience,
    weight: 1,
  },
  {
    skillId: UCE_ENTITY_IDS.sklScientificThinking,
    lessonGlobalId: UCE_ENTITY_IDS.lsnApBioCells,
    countryGlobalId: UCE_ENTITY_IDS.ctrUSA,
    curriculumGlobalId: UCE_ENTITY_IDS.curAP,
    subjectGlobalId: UCE_ENTITY_IDS.subBiology,
    weight: 1,
  },
  {
    skillId: UCE_ENTITY_IDS.sklScientificThinking,
    lessonGlobalId: UCE_ENTITY_IDS.lsnNgssCells,
    countryGlobalId: UCE_ENTITY_IDS.ctrUSA,
    curriculumGlobalId: UCE_ENTITY_IDS.curNGSS,
    subjectGlobalId: UCE_ENTITY_IDS.subScience,
    weight: 1,
  },
  {
    skillId: UCE_ENTITY_IDS.sklCriticalThinking,
    lessonGlobalId: UCE_ENTITY_IDS.lsnIbMypCells,
    countryGlobalId: UCE_ENTITY_IDS.ctrIntl,
    curriculumGlobalId: UCE_ENTITY_IDS.curIBMYP,
    subjectGlobalId: UCE_ENTITY_IDS.subScience,
    weight: 0.8,
  },
  {
    skillId: UCE_ENTITY_IDS.sklObservation,
    lessonGlobalId: UCE_ENTITY_IDS.lsnCamLsCells,
    countryGlobalId: UCE_ENTITY_IDS.ctrUK,
    curriculumGlobalId: UCE_ENTITY_IDS.curCambridgeLS,
    subjectGlobalId: UCE_ENTITY_IDS.subScience,
    weight: 1,
  },
];

export const UCE_EXAMPLE_PATHWAY = {
  title: "Jordan G8 Science → cross-curriculum equivalents → future AI recommendations",
  steps: [
    { label: "Jordan Grade 8 Science", globalId: UCE_ENTITY_IDS.lsnJoG8SciCells, kind: "lesson" },
    { label: "IGCSE Combined Science", globalId: UCE_ENTITY_IDS.lsnIgCseCells, kind: "lesson" },
    { label: "AP Biology", globalId: UCE_ENTITY_IDS.lsnApBioCells, kind: "lesson" },
    { label: "US NGSS", globalId: UCE_ENTITY_IDS.lsnNgssCells, kind: "lesson" },
    { label: "IB MYP Science", globalId: UCE_ENTITY_IDS.lsnIbMypCells, kind: "lesson" },
    { label: "Cambridge Lower Secondary", globalId: UCE_ENTITY_IDS.lsnCamLsCells, kind: "lesson" },
    { label: "Future AI Recommendations", globalId: UCE_ENTITY_IDS.lsnFutureAiRec, kind: "placeholder" },
  ],
};
