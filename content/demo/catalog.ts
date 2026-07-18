import type {
  BookDefinition,
  BookFilters,
  Country,
  Curriculum,
  DemoContentMeta,
  EducationalSystem,
  Grade,
  PortalLocale,
  Subject,
} from "@/types/student-portal";

export const DEMO_CONTENT_META: DemoContentMeta = {
  isDemo: true,
  source: "demo-catalog",
  version: "1.0.0",
  disclaimer:
    "This is sample educational content for interface testing only. It is not official curriculum data.",
};

export const DEMO_COUNTRIES: Country[] = [
  {
    id: "sa",
    code: "SA",
    name: { en: "Saudi Arabia", ar: "المملكة العربية السعودية" },
  },
  {
    id: "ae",
    code: "AE",
    name: { en: "United Arab Emirates", ar: "الإمارات العربية المتحدة" },
  },
  {
    id: "us",
    code: "US",
    name: { en: "United States", ar: "الولايات المتحدة" },
  },
];

export const DEMO_SYSTEMS: EducationalSystem[] = [
  {
    id: "sa-national",
    countryId: "sa",
    type: "national",
    name: { en: "Saudi National Curriculum", ar: "المنهج الوطني السعودي" },
  },
  {
    id: "ae-national",
    countryId: "ae",
    type: "national",
    name: { en: "UAE National Curriculum", ar: "المنهج الوطني الإماراتي" },
  },
  {
    id: "cambridge-igcse",
    countryId: "us",
    type: "international",
    name: { en: "Cambridge IGCSE", ar: "كامبريدج IGCSE" },
  },
  {
    id: "ib-myp",
    countryId: "us",
    type: "international",
    name: { en: "IB Middle Years Programme", ar: "برنامج السنوات المتوسطة IB" },
  },
];

export const DEMO_CURRICULA: Curriculum[] = [
  {
    id: "sa-general",
    systemId: "sa-national",
    name: { en: "General Track", ar: "المسار العام" },
  },
  {
    id: "ae-general",
    systemId: "ae-national",
    name: { en: "General Education", ar: "التعليم العام" },
  },
  {
    id: "igcse-core",
    systemId: "cambridge-igcse",
    name: { en: "IGCSE Core", ar: "IGCSE الأساسي" },
  },
  {
    id: "ib-myp-sciences",
    systemId: "ib-myp",
    name: { en: "MYP Sciences", ar: "علوم MYP" },
  },
];

export const DEMO_GRADES: Grade[] = [
  { id: "g8", curriculumId: "ae-general", level: 8, name: { en: "Grade 8", ar: "الصف الثامن" } },
  { id: "g9", curriculumId: "igcse-core", level: 9, name: { en: "Grade 9", ar: "الصف التاسع" } },
  { id: "g10", curriculumId: "sa-general", level: 10, name: { en: "Grade 10", ar: "الصف العاشر" } },
  { id: "g10-ib", curriculumId: "ib-myp-sciences", level: 10, name: { en: "MYP Year 4", ar: "السنة الرابعة MYP" } },
];

export const DEMO_SUBJECTS: Subject[] = [
  { id: "math", name: { en: "Mathematics", ar: "الرياضيات" }, icon: "∑" },
  { id: "science", name: { en: "Science", ar: "العلوم" }, icon: "⚗" },
  { id: "arabic", name: { en: "Arabic Language", ar: "اللغة العربية" }, icon: "أ" },
  { id: "english", name: { en: "English Language", ar: "اللغة الإنجليزية" }, icon: "A" },
  { id: "physics", name: { en: "Physics", ar: "الفيزياء" }, icon: "Φ" },
];

function lesson(
  id: string,
  order: number,
  titleEn: string,
  titleAr: string,
  summaryEn: string,
  summaryAr: string,
): import("@/types/student-portal").LessonDefinition {
  return {
    id,
    order,
    title: { en: titleEn, ar: titleAr },
    summary: { en: summaryEn, ar: summaryAr },
    objectives: {
      en: [
        `Understand the core ideas of ${titleEn}`,
        `Apply concepts from ${titleEn} to structured examples`,
        `Summarize key vocabulary and definitions`,
      ],
      ar: [
        `فهم الأفكار الأساسية في ${titleAr}`,
        `تطبيق مفاهيم ${titleAr} على أمثلة منظمة`,
        `تلخيص المفردات والتعريفات الأساسية`,
      ],
    },
    content: {
      en: `${summaryEn}\n\nThis lesson introduces foundational concepts with worked explanations, visual supports, and concise notes. Students should read each section carefully, review the definitions, and use the summary to reinforce understanding.`,
      ar: `${summaryAr}\n\nيقدم هذا الدرس المفاهيم الأساسية مع شروحات عملية ودعم بصري وملاحظات موجزة. يجب على الطلاب قراءة كل قسم بعناية ومراجعة التعريفات واستخدام الملخص لتعزيز الفهم.`,
    },
    keyConcepts: {
      en: ["Core principle", "Applied reasoning", "Concept linkage"],
      ar: ["المبدأ الأساسي", "التفكير التطبيقي", "الربط بين المفاهيم"],
    },
    definitions: {
      en: [
        { term: "Concept", meaning: "An abstract idea that organizes understanding." },
        { term: "Application", meaning: "Using knowledge in a specific context." },
      ],
      ar: [
        { term: "المفهوم", meaning: "فكرة مجردة تنظم الفهم." },
        { term: "التطبيق", meaning: "استخدام المعرفة في سياق محدد." },
      ],
    },
    importantNotes: {
      en: ["Review definitions before moving to the next lesson.", "Use bookmarks for sections you want to revisit."],
      ar: ["راجع التعريفات قبل الانتقال إلى الدرس التالي.", "استخدم الإشارات المرجعية للأقسام التي تريد إعادة زيارتها."],
    },
    diagrams: [
      {
        id: `${id}-diagram-1`,
        type: "diagram",
        title: { en: "Concept Map", ar: "خريطة المفاهيم" },
        description: {
          en: "A structured diagram showing how lesson ideas connect to prior knowledge.",
          ar: "مخطط منظم يوضح كيف ترتبط أفكار الدرس بالمعرفة السابقة.",
        },
      },
    ],
    references: {
      en: ["Demo Curriculum Guide 2025", "Success OS Sample Scope & Sequence"],
      ar: ["دليل المنهج التجريبي 2025", "نموذج النطاق والتسلسل - Success OS"],
    },
    estimatedMinutes: 20,
  };
}

export const DEMO_BOOKS: BookDefinition[] = [
  {
    id: "book-math-sa-g10",
    slug: "mathematics-grade-10-saudi",
    title: { en: "Mathematics Grade 10", ar: "الرياضيات الصف العاشر" },
    description: {
      en: "A demo mathematics textbook covering algebra, functions, and introductory statistics for Grade 10 students following the Saudi national curriculum.",
      ar: "كتاب رياضيات تجريبي يغطي الجبر والدوال والإحصاء التمهيدي للصف العاشر وفق المنهج الوطني السعودي.",
    },
    coverColor: "#1e3a5f",
    coverLabel: "MATH",
    countryId: "sa",
    systemId: "sa-national",
    curriculumId: "sa-general",
    gradeId: "g10",
    subjectId: "math",
    language: "ar",
    direction: "rtl",
    bookType: "textbook",
    version: "2025.1",
    updatedAt: "2025-01-15",
    tags: ["algebra", "functions", "statistics"],
    units: [
      {
        id: "unit-algebra",
        order: 1,
        title: { en: "Unit 1: Algebra Foundations", ar: "الوحدة 1: أساسيات الجبر" },
        description: {
          en: "Expressions, equations, and inequalities.",
          ar: "التعابير والمعادلات والمتباينات.",
        },
        lessons: [
          lesson("lesson-linear-equations", 1, "Linear Equations", "المعادلات الخطية", "Solve and interpret linear equations in one variable.", "حل وتفسير المعادلات الخطية في متغير واحد."),
          lesson("lesson-quadratic-intro", 2, "Introduction to Quadratics", "مقدمة في المعادلات التربيعية", "Recognize quadratic patterns and standard form.", "التعرف على الأنماط التربيعية والصيغة القياسية."),
        ],
      },
      {
        id: "unit-functions",
        order: 2,
        title: { en: "Unit 2: Functions", ar: "الوحدة 2: الدوال" },
        description: {
          en: "Function notation, domain, range, and graphs.",
          ar: "تدوين الدوال والمجال والمدى والرسوم البيانية.",
        },
        lessons: [
          lesson("lesson-function-notation", 1, "Function Notation", "تدوين الدوال", "Understand f(x) notation and evaluate functions.", "فهم تدوين f(x) وتقييم الدوال."),
          lesson("lesson-graphing", 2, "Graphing Functions", "تمثيل الدوال بيانياً", "Plot and interpret basic function graphs.", "رسم وتفسير الرسوم البيانية للدوال الأساسية."),
        ],
      },
    ],
  },
  {
    id: "book-science-igcse-g9",
    slug: "science-igcse-grade-9",
    title: { en: "Cambridge Science Grade 9", ar: "علوم كامبريدج الصف التاسع" },
    description: {
      en: "A demo integrated science book for IGCSE preparation with biology, chemistry, and physics units.",
      ar: "كتاب علوم تجريبي متكامل للتحضير لـ IGCSE يتضمن وحدات الأحياء والكيمياء والفيزياء.",
    },
    coverColor: "#14532d",
    coverLabel: "SCI",
    countryId: "us",
    systemId: "cambridge-igcse",
    curriculumId: "igcse-core",
    gradeId: "g9",
    subjectId: "science",
    language: "en",
    direction: "ltr",
    bookType: "textbook",
    version: "2025.2",
    updatedAt: "2025-02-01",
    tags: ["biology", "chemistry", "physics"],
    units: [
      {
        id: "unit-cell-biology",
        order: 1,
        title: { en: "Unit 1: Cell Biology", ar: "الوحدة 1: علم الخلية" },
        description: {
          en: "Cell structure, specialization, and transport.",
          ar: "تركيب الخلية وتخصصها ونقل المواد.",
        },
        lessons: [
          lesson("lesson-cell-structure", 1, "Cell Structure", "تركيب الخلية", "Identify organelles and describe their functions.", "تحديد العضيات ووصف وظائفها."),
          lesson("lesson-cell-transport", 2, "Cell Transport", "نقل المواد في الخلية", "Compare diffusion, osmosis, and active transport.", "مقارنة الانتشار والتركيز الأسموزي والنقل النشط."),
        ],
      },
      {
        id: "unit-chemistry",
        order: 2,
        title: { en: "Unit 2: Particles & Reactions", ar: "الوحدة 2: الجسيمات والتفاعلات" },
        description: {
          en: "Particle model, elements, compounds, and reactions.",
          ar: "نموذج الجسيمات والعناصر والمركبات والتفاعلات.",
        },
        lessons: [
          lesson("lesson-particle-model", 1, "Particle Model", "نموذج الجسيمات", "Explain states of matter using particle theory.", "شرح حالات المادة باستخدام نظرية الجسيمات."),
        ],
      },
    ],
  },
  {
    id: "book-arabic-ae-g8",
    slug: "arabic-language-grade-8-uae",
    title: { en: "Arabic Language Grade 8", ar: "اللغة العربية الصف الثامن" },
    description: {
      en: "A demo Arabic language book focusing on reading comprehension, grammar, and written expression.",
      ar: "كتاب لغة عربية تجريبي يركز على الفهم القرائي والقواعد والتعبير الكتابي.",
    },
    coverColor: "#7c2d12",
    coverLabel: "عربي",
    countryId: "ae",
    systemId: "ae-national",
    curriculumId: "ae-general",
    gradeId: "g8",
    subjectId: "arabic",
    language: "ar",
    direction: "rtl",
    bookType: "textbook",
    version: "2024.3",
    updatedAt: "2024-11-20",
    tags: ["grammar", "reading", "writing"],
    units: [
      {
        id: "unit-reading",
        order: 1,
        title: { en: "Unit 1: Reading Skills", ar: "الوحدة 1: مهارات القراءة" },
        description: {
          en: "Strategies for close reading and summarizing.",
          ar: "استراتيجيات القراءة المتأنية والتلخيص.",
        },
        lessons: [
          lesson("lesson-main-idea", 1, "Main Idea & Details", "الفكرة الرئيسة والتفاصيل", "Identify main ideas and supporting details in nonfiction texts.", "تحديد الأفكار الرئيسة والتفاصيل الداعمة في النصوص غير الخيالية."),
          lesson("lesson-summary", 2, "Summarizing Texts", "تلخيص النصوص", "Write concise summaries using key points.", "كتابة ملخصات موجزة باستخدام النقاط الأساسية."),
        ],
      },
    ],
  },
  {
    id: "book-physics-ib-g10",
    slug: "physics-myp-year-4",
    title: { en: "Physics MYP Year 4", ar: "الفيزياء السنة الرابعة MYP" },
    description: {
      en: "A demo physics reference book for IB MYP with mechanics and energy units.",
      ar: "كتاب مرجعي تجريبي للفيزياء لبرنامج IB MYP يتضمن الميكانيكا والطاقة.",
    },
    coverColor: "#312e81",
    coverLabel: "PHY",
    countryId: "us",
    systemId: "ib-myp",
    curriculumId: "ib-myp-sciences",
    gradeId: "g10-ib",
    subjectId: "physics",
    language: "en",
    direction: "ltr",
    bookType: "reference",
    version: "2025.1",
    updatedAt: "2025-01-08",
    tags: ["mechanics", "energy"],
    units: [
      {
        id: "unit-mechanics",
        order: 1,
        title: { en: "Unit 1: Mechanics", ar: "الوحدة 1: الميكانيكا" },
        description: {
          en: "Motion, forces, and Newton's laws.",
          ar: "الحركة والقوى وقوانين نيوتن.",
        },
        lessons: [
          lesson("lesson-motion", 1, "Describing Motion", "وصف الحركة", "Use displacement, velocity, and acceleration to describe motion.", "استخدام الإزاحة والسرعة والتسارع لوصف الحركة."),
          lesson("lesson-forces", 2, "Forces & Equilibrium", "القوى والاتزان", "Analyze force diagrams and net force.", "تحليل مخططات القوى والقوة المحصلة."),
        ],
      },
    ],
  },
];

export function getLocalizedText(
  record: Record<PortalLocale, string>,
  locale: PortalLocale,
): string {
  return record[locale] ?? record.en;
}

export function getAllDemoVersions(): string[] {
  return [...new Set(DEMO_BOOKS.map((book) => book.version))].sort();
}

export function filterDemoBooks(
  books: BookDefinition[],
  filters: BookFilters,
): BookDefinition[] {
  return books.filter((book) => {
    if (filters.countryId && book.countryId !== filters.countryId) return false;
    if (filters.systemId && book.systemId !== filters.systemId) return false;
    if (filters.curriculumId && book.curriculumId !== filters.curriculumId) return false;
    if (filters.gradeId && book.gradeId !== filters.gradeId) return false;
    if (filters.subjectId && book.subjectId !== filters.subjectId) return false;
    if (filters.language && book.language !== filters.language) return false;
    if (filters.bookType && book.bookType !== filters.bookType) return false;
    if (filters.version && book.version !== filters.version) return false;

    if (filters.systemType) {
      const system = DEMO_SYSTEMS.find((item) => item.id === book.systemId);
      if (!system || system.type !== filters.systemType) return false;
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      const haystack = [
        book.title.en,
        book.title.ar,
        book.description.en,
        book.description.ar,
        ...book.tags,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}
