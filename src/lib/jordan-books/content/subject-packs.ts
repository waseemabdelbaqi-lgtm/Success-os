/**
 * Multi-unit Success OS companion packs for verified / indexed curriculum cells.
 * Original explanations only — not republication of official textbooks.
 * Unit titles marked NEEDS VERIFICATION until NCCD edition TOC is confirmed.
 */
import { buildCompanionBook, type CompanionBookSeed, type CompanionUnitSeed } from "@/src/lib/jordan-books/content/companion-factory";
import type { BookRecord } from "@/src/lib/jordan-books/schema/types";

type PackMeta = {
  id: string;
  grade: string;
  gradeAr: string;
  semester: string;
  semesterAr: string;
  stage: string;
  subject: string;
  subjectAr: string;
  officialSourceUrl: string;
  band: "kg" | "lower" | "upper" | "secondary";
};

type Theme = { titleAr: string; titleEn: string; focus: string };

function themesFor(subjectSlug: string, band: PackMeta["band"]): Theme[] {
  const map: Record<string, Theme[]> = {
    math: [
      { titleAr: "الأعداد والعدّ", titleEn: "Numbers and Counting", focus: "العدّ والقراءة والكتابة الرمزية للأعداد" },
      { titleAr: "الجمع والطرح", titleEn: "Addition and Subtraction", focus: "عمليات الجمع والطرح بتمثيلات ملموسة" },
      { titleAr: "الأنماط والقياس", titleEn: "Patterns and Measurement", focus: "الأنماط الطولية والقياس غير المعياري" },
      { titleAr: "الأشكال والموقع", titleEn: "Shapes and Position", focus: "الأشكال ثنائية الأبعاد والموقع النسبي" },
    ],
    arabic: [
      { titleAr: "الاستماع والمحادثة", titleEn: "Listening and Speaking", focus: "فهم المسموع والتعبير الشفوي" },
      { titleAr: "الحروف والقراءة", titleEn: "Letters and Reading", focus: "تمييز الحروف والقراءة المقطعية" },
      { titleAr: "الكتابة والإملاء", titleEn: "Writing and Spelling", focus: "رسم الحروف والكلمات القصيرة" },
      { titleAr: "الفهم والتعبير", titleEn: "Comprehension and Expression", focus: "فهم نص قصير والتعبير بجملة" },
    ],
    english: [
      { titleAr: "Sounds and Letters", titleEn: "Sounds and Letters", focus: "phonics and letter recognition" },
      { titleAr: "Words and Meaning", titleEn: "Words and Meaning", focus: "core vocabulary in context" },
      { titleAr: "Listening and Speaking", titleEn: "Listening and Speaking", focus: "classroom phrases and listening" },
      { titleAr: "Reading and Writing", titleEn: "Reading and Writing", focus: "simple words and sentences" },
    ],
    science: [
      { titleAr: "الإنسان والصحة", titleEn: "Humans and Health", focus: "الحواس والحاجات والعادات الصحية" },
      { titleAr: "الكائنات الحية", titleEn: "Living Things", focus: "نباتات وحيوانات وحاجاتها" },
      { titleAr: "المادة والطاقة", titleEn: "Matter and Energy", focus: "مواد يومية وتغيّرات بسيطة" },
      { titleAr: "الأرض والبيئة", titleEn: "Earth and Environment", focus: "الطقس والموارد والعناية بالبيئة" },
    ],
    islamic: [
      { titleAr: "العقيدة والآداب", titleEn: "Belief and Manners", focus: "أركان الإيمان والآداب الإسلامية" },
      { titleAr: "العبادات", titleEn: "Worship", focus: "مفاهيم الطهارة والصلاة المناسبة للعمر" },
      { titleAr: "القصص والقيم", titleEn: "Stories and Values", focus: "قصص أنبياء وقيم أخلاقية" },
      { titleAr: "القرآن والحديث", titleEn: "Quran and Hadith", focus: "سور قصيرة وأحاديث يسيرة — مراجع رسمية لاحقاً" },
    ],
    social: [
      { titleAr: "الأسرة والمدرسة", titleEn: "Family and School", focus: "أدوار الأسرة وقواعد المدرسة" },
      { titleAr: "الوطن والمجتمع", titleEn: "Homeland and Community", focus: "رموز الوطن والتعايش" },
      { titleAr: "الزمان والمكان", titleEn: "Time and Place", focus: "تسلسل زمني بسيط وخريطة محلية" },
      { titleAr: "المواطنة", titleEn: "Citizenship", focus: "الحقوق والواجبات البسيطة" },
    ],
    digital: [
      { titleAr: "أجهزة وآمنة", titleEn: "Devices and Safety", focus: "أجزاء الجهاز والاستخدام الآمن" },
      { titleAr: "معلومات وتنظيم", titleEn: "Information and Organization", focus: "ملفات وصور وتنظيم بسيط" },
      { titleAr: "تفكير حسابي", titleEn: "Computational Thinking", focus: "خطوات وخوارزميات يومية" },
      { titleAr: "إبداع رقمي", titleEn: "Digital Creation", focus: "رسم أو قصة رقمية بسيطة" },
    ],
    pe: [
      { titleAr: "الإحماء والحركة", titleEn: "Warm-up and Movement", focus: "إحماء آمن وحركات أساسية" },
      { titleAr: "المهارات الحركية", titleEn: "Motor Skills", focus: "جري وتوازن ورمي آمن" },
      { titleAr: "الألعاب التعاونية", titleEn: "Cooperative Games", focus: "قواعد اللعب والتعاون" },
      { titleAr: "الصحة واللياقة", titleEn: "Health and Fitness", focus: "نشاط يومي ونظافة شخصية" },
    ],
    arts: [
      { titleAr: "الخط واللون", titleEn: "Line and Color", focus: "خطوط وألوان وتعبير بصري" },
      { titleAr: "الصوت والإيقاع", titleEn: "Sound and Rhythm", focus: "إيقاع وتصفيق وغناء بسيط" },
      { titleAr: "المسرح الصغير", titleEn: "Mini Drama", focus: "تمثيل جملة وشخصية" },
      { titleAr: "معرض الأعمال", titleEn: "Portfolio", focus: "اختيار عمل والتأمل فيه" },
    ],
    "kg-developmental": [
      { titleAr: "الذات والعواطف", titleEn: "Self and Emotions", focus: "التعرف على المشاعر والتعبير الآمن" },
      { titleAr: "اللعب والتفكير", titleEn: "Play and Thinking", focus: "حل مشكلات عبر اللعب" },
      { titleAr: "اللغة المبكرة", titleEn: "Early Language", focus: "كلمات وجمل قصيرة في سياق" },
      { titleAr: "الاستعداد المدرسي", titleEn: "School Readiness", focus: "روتين واستقلالية ومهارات دقيقة" },
    ],
    vocational: [
      { titleAr: "سلامة الورشة", titleEn: "Workshop Safety", focus: "قواعد السلامة والأدوات الأساسية" },
      { titleAr: "أدوات وإجراءات", titleEn: "Tools and Procedures", focus: "خطوات عمل مرتبة" },
      { titleAr: "مشروع عملي", titleEn: "Practical Project", focus: "مشروع بسيط بقائمة تحقق" },
      { titleAr: "جودة وإنجاز", titleEn: "Quality and Finish", focus: "مراجعة العمل والتوثيق" },
    ],
    finance: [
      { titleAr: "المال والاحتياج", titleEn: "Money and Needs", focus: "تمييز الحاجة والرغبة" },
      { titleAr: "الادخار", titleEn: "Saving", focus: "أهداف ادخار بسيطة" },
      { titleAr: "الإنفاق الواعي", titleEn: "Wise Spending", focus: "مقارنة خيارات" },
      { titleAr: "حقوق المستهلك", titleEn: "Consumer Rights", focus: "سلوك مستهلك مسؤول" },
    ],
    physics: [
      { titleAr: "الحركة والقوى", titleEn: "Motion and Forces", focus: "وصف الحركة والقوى اليومية" },
      { titleAr: "الطاقة", titleEn: "Energy", focus: "أشكال الطاقة وتحولاتها" },
      { titleAr: "الموجات والضوء", titleEn: "Waves and Light", focus: "مفاهيم أولية للضوء والصوت" },
      { titleAr: "الكهرباء والمغناطيسية", titleEn: "Electricity and Magnetism", focus: "دارات بسيطة وسلامة" },
    ],
    chemistry: [
      { titleAr: "المادة وخصائصها", titleEn: "Matter and Properties", focus: "حالات المادة وخصائص قابلة للقياس" },
      { titleAr: "الذرة والجدول", titleEn: "Atom and Periodic Table", focus: "مقدمة للتركيب الذري" },
      { titleAr: "التفاعلات", titleEn: "Reactions", focus: "أدلة حدوث تفاعل كيميائي" },
      { titleAr: "السلامة المخبرية", titleEn: "Lab Safety", focus: "رموز الخطر وإجراءات الأمان" },
    ],
    biology: [
      { titleAr: "الخلية والحياة", titleEn: "Cell and Life", focus: "خصائص الكائنات الحية" },
      { titleAr: "أجهزة الجسم", titleEn: "Body Systems", focus: "وظائف أساسية لأجهزة مختارة" },
      { titleAr: "الوراثة والتنوع", titleEn: "Genetics and Diversity", focus: "تنوع الصفات" },
      { titleAr: "النظام البيئي", titleEn: "Ecosystems", focus: "علاقات الغذاء والبيئة" },
    ],
    earth: [
      { titleAr: "الأرض والفضاء", titleEn: "Earth and Space", focus: "موقع الأرض ودوراتها" },
      { titleAr: "الصخور والمعادن", titleEn: "Rocks and Minerals", focus: "تصنيف أولي" },
      { titleAr: "الطقس والمناخ", titleEn: "Weather and Climate", focus: "عناصر الطقس" },
      { titleAr: "الموارد والبيئة", titleEn: "Resources and Environment", focus: "حماية الموارد" },
    ],
    history: [
      { titleAr: "مفهوم التاريخ", titleEn: "What Is History", focus: "مصدر وزمن وحدث" },
      { titleAr: "حضارات المنطقة", titleEn: "Regional Civilizations", focus: "محطات حضارية مختارة" },
      { titleAr: "الدولة والمجتمع", titleEn: "State and Society", focus: "تطور مؤسسات" },
      { titleAr: "قراءة المصادر", titleEn: "Reading Sources", focus: "تمييز مصدر أولي وثانوي" },
    ],
    geography: [
      { titleAr: "الخرائط", titleEn: "Maps", focus: "اتجاهات ورموز خريطة" },
      { titleAr: "تضاريس الأردن", titleEn: "Jordan Landforms", focus: "مناطق طبيعية" },
      { titleAr: "السكان والموارد", titleEn: "Population and Resources", focus: "توزيع بسيط" },
      { titleAr: "قضايا بيئية", titleEn: "Environmental Issues", focus: "مشكلة وحل محلي" },
    ],
    civic: [
      { titleAr: "الهوية والمواطنة", titleEn: "Identity and Citizenship", focus: "انتماء ومسؤولية" },
      { titleAr: "الحقوق والواجبات", titleEn: "Rights and Duties", focus: "أمثلة صفية ومجتمعية" },
      { titleAr: "مؤسسات الدولة", titleEn: "State Institutions", focus: "تعريف مبسّط لأدوار" },
      { titleAr: "المشاركة", titleEn: "Participation", focus: "حوار واحترام الرأي" },
    ],
    "jordan-history": [
      { titleAr: "جذور الوطن", titleEn: "Roots of the Homeland", focus: "محطات تأسيسية" },
      { titleAr: "الدولة الهاشمية", titleEn: "Hashemite State", focus: "محطات سياسية واجتماعية" },
      { titleAr: "الإنجازات الوطنية", titleEn: "National Achievements", focus: "تعليم وصحة وبنية" },
      { titleAr: "المواطن والتاريخ", titleEn: "Citizen and History", focus: "قيمة الذاكرة الوطنية" },
    ],
    "arabic-literature": [
      { titleAr: "النصوص الأدبية", titleEn: "Literary Texts", focus: "قراءة نص أدبي وتحليله" },
      { titleAr: "البلاغة والأساليب", titleEn: "Rhetoric", focus: "صور وأساليب تعبير" },
      { titleAr: "الشعر", titleEn: "Poetry", focus: "وزن وموسيقى الشعر — تمهيد" },
      { titleAr: "الكتابة الإبداعية", titleEn: "Creative Writing", focus: "مقالة أو خاطرة منظمة" },
    ],
    "arabic-grammar": [
      { titleAr: "النحو الأساسي", titleEn: "Core Grammar", focus: "أبواب نحوية مختارة" },
      { titleAr: "الصرف", titleEn: "Morphology", focus: "اشتقاق وتصريف" },
      { titleAr: "الإعراب", titleEn: "Parsing", focus: "إعراب جمل نموذجية" },
      { titleAr: "التطبيق الكتابي", titleEn: "Writing Application", focus: "تصحيح أخطاء شائعة" },
    ],
    philosophy: [
      { titleAr: "ما الفلسفة؟", titleEn: "What Is Philosophy", focus: "أسئلة وقيم التفكير" },
      { titleAr: "المعرفة والحقيقة", titleEn: "Knowledge and Truth", focus: "مصادر المعرفة" },
      { titleAr: "الأخلاق", titleEn: "Ethics", focus: "فعل مسؤول" },
      { titleAr: "المجتمع والإنسان", titleEn: "Society and Human", focus: "علاقة الفرد والمجتمع" },
    ],
    psychology: [
      { titleAr: "مدخل علم النفس", titleEn: "Intro to Psychology", focus: "موضوع العلم ومنهجه" },
      { titleAr: "النمو والتعلم", titleEn: "Growth and Learning", focus: "مراحل ونظريات مبسطة" },
      { titleAr: "الشخصية والدوافع", titleEn: "Personality and Motivation", focus: "مفاهيم أساسية" },
      { titleAr: "الصحة النفسية", titleEn: "Mental Health", focus: "وعي ودعم" },
    ],
    "math-business": [
      { titleAr: "النسب والمعدلات", titleEn: "Ratios and Rates", focus: "تطبيقات أعمال" },
      { titleAr: "الفائدة والربح", titleEn: "Interest and Profit", focus: "حسابات مالية أساسية" },
      { titleAr: "الجداول والرسوم", titleEn: "Tables and Charts", focus: "قراءة بيانات أعمال" },
      { titleAr: "اتخاذ القرار", titleEn: "Decision Making", focus: "مقارنة خيارات كمية" },
    ],
  };

  if (map[subjectSlug]) return map[subjectSlug];

  // Generic academic fallback for indexed subjects without a dedicated template
  return [
    { titleAr: `مفاهيم أساسية — ${band}`, titleEn: "Core Concepts", focus: "مفاهيم تأسيسية للمبحث" },
    { titleAr: "مهارات وتطبيق", titleEn: "Skills and Practice", focus: "تطبيق مهاري موجّه" },
    { titleAr: "تحليل ومراجعة", titleEn: "Analysis and Review", focus: "أسئلة مراجعة وربط" },
    { titleAr: "مشروع الوحدة", titleEn: "Unit Project", focus: "منتج تعلّم قصير" },
  ];
}

function buildUnits(meta: PackMeta): CompanionUnitSeed[] {
  const themes = themesFor(meta.subject, meta.band).slice(0, 4);
  return themes.map((theme, ui) => {
    const unitOrder = ui + 1;
    const lessons = [1, 2, 3].map((li) => {
      const lessonOrder = li;
      const titleAr =
        li === 1 ? `مدخل: ${theme.titleAr}` : li === 2 ? `شرح وتطبيق: ${theme.focus}` : `تدريب ومراجعة: ${theme.titleAr}`;
      const titleEn =
        li === 1 ? `Intro: ${theme.titleEn}` : li === 2 ? `Explain & apply` : `Practice & review`;
      return {
        id: `u${unitOrder}-l${lessonOrder}`,
        order: lessonOrder,
        titleAr,
        titleEn,
        outcomes: [
          `أتعرّف فكرة رئيسة في «${theme.titleAr}»`,
          `أطبّق مهارة بسيطة مرتبطة بـ ${meta.subjectAr}`,
          "أتحقق من فهمي بتمرين تفاعلي",
        ],
        hookAr: `سؤال افتتاحي: ماذا تعرف مسبقاً عن «${theme.titleAr}» في ${meta.gradeAr}؟`,
        explanationAr:
          `شرح Success OS أصلي لمبحث ${meta.subjectAr} (${meta.gradeAr} · ${meta.semesterAr}). ` +
          `محور الوحدة: ${theme.focus}. هذا المحتوى مسودة أكاديمية بمحاذاة نواتج متوقعة وليس نص الكتاب الحكومي. ` +
          `عناوين الوحدات الرسمية الكاملة NEEDS VERIFICATION مقابل طبعة NCCD الحالية.`,
        exampleAr: `أيّ جملة تصف محور «${theme.titleAr}»؟`,
        answer: theme.focus.slice(0, 40),
        options: [theme.focus.slice(0, 40), "موضوع غير مرتبط", "لا أعرف"],
        correctIndex: 0,
      };
    });
    return {
      id: `u${unitOrder}`,
      order: unitOrder,
      titleAr: `الوحدة ${unitOrder}: ${theme.titleAr}`,
      titleEn: `Unit ${unitOrder}: ${theme.titleEn}`,
      descriptionAr: `${theme.focus}. (ترتيب رسمي NEEDS VERIFICATION)`,
      lessons,
    };
  });
}

export function buildSubjectPack(meta: PackMeta): BookRecord {
  const seed: CompanionBookSeed = {
    id: meta.id,
    grade: meta.grade,
    gradeAr: meta.gradeAr,
    semester: meta.semester,
    semesterAr: meta.semesterAr,
    subject: meta.subject,
    subjectAr: meta.subjectAr,
    stage: meta.stage,
    officialSourceUrl: meta.officialSourceUrl,
    units: buildUnits(meta),
  };
  const book = buildCompanionBook(seed);
  book.completenessClaim = "sem1_core_draft";
  book.verificationNote =
    (book.verificationNote || "") +
    " Multi-unit Success OS pack (4×3). Not platform COMPLETE. Official TOC/edition pending NCCD confirmation.";
  return book;
}

/** Authored multi-unit packs beyond G1 Sem1 (which has dedicated files). */
export function buildPriorityAuthoredPacks(): BookRecord[] {
  const packs: BookRecord[] = [];
  const nccd = (gradeKey: string) => {
    const urls: Record<string, string> = {
      kg1: "https://nccd.gov.jo/ar/pages/PublicationsKG",
      kg2: "https://nccd.gov.jo/ar/pages/PublicationsKG",
      "1": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
      "2": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/69",
      "12": "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/143",
    };
    return urls[gradeKey] || "https://nccd.gov.jo/Ar/Pages/textbooks";
  };

  const kgSubjects: Array<[string, string]> = [
    ["kg-developmental", "المنهاج التطوري"],
    ["math", "الرياضيات"],
    ["arabic", "اللغة العربية"],
    ["science", "العلوم"],
  ];

  for (const level of ["kg1", "kg2"] as const) {
    const gradeAr = level === "kg1" ? "رياض الأطفال — المستوى الأول" : "رياض الأطفال — المستوى الثاني";
    for (const [slug, ar] of kgSubjects) {
      packs.push(
        buildSubjectPack({
          id: `jo-${level}-year-${slug}-companion`,
          grade: level,
          gradeAr,
          semester: "year",
          semesterAr: "عام دراسي",
          stage: "الطفولة المبكرة",
          subject: slug,
          subjectAr: ar,
          officialSourceUrl: nccd(level),
          band: "kg",
        }),
      );
    }
  }

  const g1Subjects: Array<[string, string]> = [
    ["math", "الرياضيات"],
    ["arabic", "اللغة العربية"],
    ["english", "اللغة الإنجليزية"],
    ["science", "العلوم"],
    ["islamic", "التربية الإسلامية"],
    ["social", "الدراسات الاجتماعية"],
    ["digital", "المهارات الرقمية"],
    ["pe", "التربية الرياضية"],
    ["arts", "التربية الفنية والموسيقية والمسرحية"],
  ];

  for (const [slug, ar] of g1Subjects) {
    packs.push(
      buildSubjectPack({
        id: `jo-g1-s2-${slug}-companion`,
        grade: "1",
        gradeAr: "الصف الأول",
        semester: "2",
        semesterAr: "الفصل الدراسي الثاني",
        stage: "التعليم الأساسي",
        subject: slug,
        subjectAr: ar,
        officialSourceUrl: nccd("1"),
        band: "lower",
      }),
    );
  }

  const g2Subjects = g1Subjects;
  for (const [slug, ar] of g2Subjects) {
    for (const sem of ["1", "2"] as const) {
      packs.push(
        buildSubjectPack({
          id: `jo-g2-s${sem}-${slug}-companion`,
          grade: "2",
          gradeAr: "الصف الثاني",
          semester: sem,
          semesterAr: sem === "1" ? "الفصل الدراسي الأول" : "الفصل الدراسي الثاني",
          stage: "التعليم الأساسي",
          subject: slug,
          subjectAr: ar,
          officialSourceUrl: nccd("2"),
          band: "lower",
        }),
      );
    }
  }

  const g3Subjects = g1Subjects;
  for (const [slug, ar] of g3Subjects) {
    packs.push(
      buildSubjectPack({
        id: `jo-g3-s1-${slug}-companion`,
        grade: "3",
        gradeAr: "الصف الثالث",
        semester: "1",
        semesterAr: "الفصل الدراسي الأول",
        stage: "التعليم الأساسي",
        subject: slug,
        subjectAr: ar,
        officialSourceUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/70",
        band: "lower",
      }),
    );
  }

  const g11Subjects: Array<[string, string]> = [
    ["arabic", "اللغة العربية"],
    ["english", "اللغة الإنجليزية"],
    ["math", "الرياضيات"],
    ["physics", "الفيزياء"],
    ["chemistry", "الكيمياء"],
    ["biology", "العلوم الحياتية"],
    ["earth", "علوم الأرض والبيئة"],
    ["digital", "المهارات الرقمية"],
    ["islamic", "التربية الإسلامية"],
    ["jordan-history", "تاريخ الأردن"],
  ];
  for (const [slug, ar] of g11Subjects) {
    packs.push(
      buildSubjectPack({
        id: `jo-g11-s1-${slug}-companion`,
        grade: "11",
        gradeAr: "الصف الحادي عشر",
        semester: "1",
        semesterAr: "الفصل الدراسي الأول",
        stage: "التعليم الثانوي",
        subject: slug,
        subjectAr: ar,
        officialSourceUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/117",
        band: "secondary",
      }),
    );
  }

  // G12 academic — subjects harvested from NCCD catalog listings (pending live page verify; NCCD often HTTP 500)
  const g12: Array<[string, string]> = [
    ["math", "الرياضيات"],
    ["math-business", "الرياضيات/الأعمال"],
    ["physics", "الفيزياء"],
    ["chemistry", "الكيمياء"],
    ["biology", "العلوم الحياتية"],
    ["earth", "علوم الأرض والبيئة"],
    ["arabic-literature", "اللغة العربية /الأدب"],
    ["arabic-grammar", "اللغة العربية /النّحو والصّرف وموسيقا الشّعر"],
    ["english", "اللغة الإنجليزية"],
    ["islamic", "التربية الإسلامية"],
    ["jordan-history", "تاريخ الأردن"],
    ["philosophy", "الفلسفة"],
    ["psychology", "علوم النفس والاجتماع"],
    ["finance", "الثقافة المالية"],
    ["digital", "المهارات الرقمية"],
  ];

  for (const [slug, ar] of g12) {
    for (const sem of ["1", "2"] as const) {
      packs.push(
        buildSubjectPack({
          id: `jo-g12-s${sem}-${slug}-companion`,
          grade: "12",
          gradeAr: "الصف الثاني عشر / التوجيهي",
          semester: sem,
          semesterAr: sem === "1" ? "الفصل الدراسي الأول" : "الفصل الدراسي الثاني",
          stage: "التعليم الثانوي",
          subject: slug,
          subjectAr: ar,
          officialSourceUrl: nccd("12"),
          band: "secondary",
        }),
      );
    }
  }

  return packs;
}

export const PRIORITY_AUTHORED_PACKS: BookRecord[] = buildPriorityAuthoredPacks();

/** Map inventory cell id → authored book id for queue processor. */
export function buildCellToBookMap(): Record<string, string> {
  const map: Record<string, string> = {
    "jo-1-general-s1-math-sos_companion": "jo-g1-s1-math-student-book",
    "jo-1-general-s1-arabic-sos_companion": "jo-g1-s1-arabic-companion",
    "jo-1-general-s1-english-sos_companion": "jo-g1-s1-english-companion",
    "jo-1-general-s1-science-sos_companion": "jo-g1-s1-science-companion",
    "jo-1-general-s1-islamic-sos_companion": "jo-g1-s1-islamic-companion",
    "jo-1-general-s1-social-sos_companion": "jo-g1-s1-social-companion",
    "jo-1-general-s1-digital-sos_companion": "jo-g1-s1-digital-companion",
    "jo-1-general-s1-pe-sos_companion": "jo-g1-s1-pe-companion",
    "jo-1-general-s1-arts-sos_companion": "jo-g1-s1-arts-companion",
  };

  for (const level of ["kg1", "kg2"]) {
    for (const slug of ["kg-developmental", "math", "arabic", "science"]) {
      // Inventory cell ids use semester token `syear` (from `s${sem}` when sem==="year")
      map[`jo-${level}-general-syear-${slug}-sos_companion`] = `jo-${level}-year-${slug}-companion`;
    }
  }

  const lowerSlugs = ["math", "arabic", "english", "science", "islamic", "social", "digital", "pe", "arts"];
  for (const slug of lowerSlugs) {
    map[`jo-1-general-s2-${slug}-sos_companion`] = `jo-g1-s2-${slug}-companion`;
    map[`jo-2-general-s1-${slug}-sos_companion`] = `jo-g2-s1-${slug}-companion`;
    map[`jo-2-general-s2-${slug}-sos_companion`] = `jo-g2-s2-${slug}-companion`;
    map[`jo-3-general-s1-${slug}-sos_companion`] = `jo-g3-s1-${slug}-companion`;
  }

  const g11Slugs = [
    "arabic",
    "english",
    "math",
    "physics",
    "chemistry",
    "biology",
    "earth",
    "digital",
    "islamic",
    "jordan-history",
  ];
  for (const slug of g11Slugs) {
    map[`jo-11-academic-s1-${slug}-sos_companion`] = `jo-g11-s1-${slug}-companion`;
  }

  const g12Slugs = [
    "math",
    "math-business",
    "physics",
    "chemistry",
    "biology",
    "earth",
    "arabic-literature",
    "arabic-grammar",
    "english",
    "islamic",
    "jordan-history",
    "philosophy",
    "psychology",
    "finance",
    "digital",
  ];
  for (const slug of g12Slugs) {
    for (const sem of ["1", "2"]) {
      map[`jo-12-academic-s${sem}-${slug}-sos_companion`] = `jo-g12-s${sem}-${slug}-companion`;
    }
  }

  return map;
}
