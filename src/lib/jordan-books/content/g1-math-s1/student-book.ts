import type { BookRecord, LessonRecord } from "@/src/lib/jordan-books/schema/types";

const NCCD: LessonRecord["sources"][number] = {
  name: "NCCD Grade 1 textbook catalogue",
  url: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
  authorityType: "official-authority",
  usage: "curriculum-alignment-and-official-link-only",
  license: "official-framework-reference",
  verificationDate: "2026-07-28",
  notes: "Official PDF not republished. Success OS text is original.",
};

const MINHAJI: LessonRecord["sources"][number] = {
  name: "Minhaji structure companion (titles only)",
  url: "https://minhaji.net/lesson/44/%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA",
  authorityType: "structure-index-companion",
  usage: "unit-lesson-title-order-hints-never-copy-prose",
  license: "companion-index-only",
  verificationDate: "2026-07-28",
};

function lessonBase(
  partial: Omit<LessonRecord, "editorialStatus" | "rightsStatus" | "sources" | "preparedBy">,
): LessonRecord {
  return {
    ...partial,
    editorialStatus: "draft",
    rightsStatus: "sos_original_aligned",
    sources: [NCCD, MINHAJI],
    preparedBy: "Prepared by Mr Waseem Allabadi — original Success OS explanation",
  };
}

/** Unit 1 lessons — order from Minhaji G1 math seed (NEEDS VERIFICATION vs latest NCCD edition). */
const L1 = lessonBase({
  id: "u1-l1-number-line",
  order: 1,
  titleAr: "خط الأعداد",
  titleEn: "The Number Line",
  estimatedMinutes: 25,
  learningOutcomes: [
    "أتعرّف خط الأعداد وأقرأ الأعداد عليه من 0 إلى 10.",
    "أحدد موقع عدد على خط الأعداد.",
    "أشرح أن الأعداد تكبر عند التحرك إلى اليمين.",
  ],
  prerequisites: ["العد من 0 إلى 10", "تمييز الأرقام المكتوبة"],
  vocabulary: [
    { term: "خط الأعداد", definition: "خط مستقيم مرتّب عليه الأعداد من الأصغر إلى الأكبر." },
    { term: "موقع العدد", definition: "المكان الذي يقف عنده العدد على الخط." },
    { term: "يمين", definition: "اتجاه تزايد الأعداد على خط الأعداد." },
  ],
  blocks: [
    {
      id: "b1",
      type: "heading",
      bodyAr: "ماذا سنتعلم؟",
    },
    {
      id: "b2",
      type: "paragraph",
      bodyAr:
        "خط الأعداد أداة مهمة في الرياضيات. نضع عليه الأعداد بالترتيب. عندما نتحرك يميناً، الأعداد تكبر. عندما نتحرك يساراً، الأعداد تصغر.",
    },
    {
      id: "b3",
      type: "definition",
      titleAr: "تعريف",
      bodyAr: "خط الأعداد: خط مستقيم عليه علامات متساوية البعد، كل علامة تمثل عدداً متتالياً.",
    },
    {
      id: "b4",
      type: "diagram",
      titleAr: "خط من 0 إلى 10",
      bodyAr: "0 — 1 — 2 — 3 — 4 — 5 — 6 — 7 — 8 — 9 — 10",
    },
    {
      id: "b5",
      type: "example",
      titleAr: "مثال",
      bodyAr: "العدد 3 يقع بين 2 و4. للوصول من 0 إلى 3 نخطو ثلاث خطوات يميناً.",
    },
    {
      id: "b6",
      type: "worked_solution",
      titleAr: "حل خطوة بخطوة",
      bodyAr: "1) ارسم خطاً. 2) ضع 0 في البداية. 3) ضع الأعداد بالترتيب. 4) ضع إصبعك على العدد المطلوب.",
    },
    {
      id: "b7",
      type: "common_mistakes",
      titleAr: "أخطاء شائعة",
      bodyAr: "ترك مسافات غير متساوية بين الأعداد، أو كتابة الأعداد من اليمين إلى اليسار بعكس الترتيب على الخط.",
      items: ["مسافات غير متساوية", "عكس اتجاه التزايد"],
    },
    {
      id: "b8",
      type: "real_life",
      titleAr: "من واقع الحياة",
      bodyAr: "درجات السلم، أرقام الطوابق، وعدّ الخطوات في الملعب كلها تشبه خط الأعداد.",
    },
    {
      id: "b9",
      type: "callout",
      titleAr: "فكّر",
      bodyAr: "إذا وقفت على 5 وتحركت خطوتين يميناً، أين أصل؟",
    },
    {
      id: "b10",
      type: "practice",
      titleAr: "تدريب موجّه",
      bodyAr: "ضع دائرة حول العدد الأكبر: 2 أو 8؟ ثم أرِ موقعهما على الخط.",
    },
    {
      id: "b11",
      type: "question",
      titleAr: "تمرين تفاعلي",
      bodyAr: "أي عدد أكبر؟",
      interactiveKind: "mcq",
      question: {
        promptAr: "أي عدد أكبر على خط الأعداد؟",
        options: ["2", "7", "4"],
        correctIndex: 1,
        explanationAr: "7 إلى يمين 2 و4، لذلك هو الأكبر.",
      },
    },
    {
      id: "b12",
      type: "writing_space",
      titleAr: "مساحة كتابة",
      bodyAr: "ارسم خط أعداد من 0 إلى 10 واكتب العدد 6 عليه.",
    },
    {
      id: "b13",
      type: "source_citation",
      bodyAr: "مرجع رسمي للتحقق: صفحة كتب الصف الأول — المركز الوطني لتطوير المناهج.",
    },
  ],
});

const L2 = lessonBase({
  id: "u1-l2-add-number-line",
  order: 2,
  titleAr: "الجمع باستعمال خط الأعداد",
  titleEn: "Addition on the Number Line",
  estimatedMinutes: 30,
  learningOutcomes: [
    "أجمع عددين صغيرين بالقفز على خط الأعداد.",
    "أبدأ من العدد الأول ثم أقفز بعدد الوحدات حسب العدد الثاني.",
    "أتحقق من الناتج بقراءة الموقع النهائي على الخط.",
  ],
  prerequisites: ["قراءة خط الأعداد من 0 إلى 10", "العدّ قفزة بقفزة"],
  vocabulary: [
    { term: "الجمع", definition: "ضمّ مجموعتين لمعرفة الكمية الكلية." },
    { term: "قفزة", definition: "الانتقال من عدد إلى العدد التالي يميناً." },
    { term: "الناتج", definition: "العدد الذي نصل إليه بعد الجمع." },
  ],
  blocks: [
    { id: "c1", type: "heading", bodyAr: "فكرة الدرس" },
    {
      id: "c2",
      type: "paragraph",
      bodyAr:
        "للجمع على خط الأعداد: نبدأ من العدد الأول، ثم نقفز يميناً بعدد مرات يساوي العدد الثاني. المكان الذي نتوقف فيه هو الناتج.",
    },
    {
      id: "c3",
      type: "formula",
      titleAr: "قاعدة",
      bodyAr: "ابدأ من العدد الأول → اقفز يميناً بعدد مرات العدد الثاني → اقرأ الناتج",
      formula: "a + b = \\text{موقع النهاية على الخط}",
    },
    {
      id: "c4",
      type: "example",
      titleAr: "مثال 1: 3 + 2",
      bodyAr: "نقف عند 3. قفزة إلى 4، ثم قفزة إلى 5. الناتج 5.",
    },
    {
      id: "c5",
      type: "worked_solution",
      titleAr: "حل مفصّل لـ 4 + 3",
      bodyAr: "1) ضع إصبعك على 4. 2) اقفز إلى 5. 3) اقفز إلى 6. 4) اقفز إلى 7. الناتج = 7.",
    },
    {
      id: "c6",
      type: "example",
      titleAr: "مثال 2: 1 + 4",
      bodyAr: "من 1 أربع قفزات: 2، 3، 4، 5. الناتج 5.",
    },
    {
      id: "c7",
      type: "common_mistakes",
      titleAr: "أخطاء شائعة",
      bodyAr: "العدّ من نقطة البداية مرتين، أو القفز يساراً بدل اليمين.",
      items: ["عدّ البداية مرتين", "اتجاه خاطئ"],
    },
    {
      id: "c8",
      type: "real_life",
      titleAr: "تطبيق حياتي",
      bodyAr: "معك 3 كرات، وأخذت كرتين. اقفز على الخط لتعرف المجموع.",
    },
    {
      id: "c9",
      type: "callout",
      titleAr: "فكّر",
      bodyAr: "هل 2 + 3 يعطي نفس ناتج 3 + 2؟ جرّب على الخط.",
    },
    {
      id: "c10",
      type: "practice",
      titleAr: "تدريب مستقل",
      bodyAr: "احسب: 5 + 1 ، 6 + 2 ، 2 + 2 باستخدام خط الأعداد.",
    },
    {
      id: "c11",
      type: "question",
      titleAr: "تحقق",
      bodyAr: "3 + 2 = ؟",
      interactiveKind: "mcq",
      question: {
        promptAr: "٣ + ٢ = ؟",
        options: ["4", "5", "6"],
        correctIndex: 1,
        explanationAr: "من 3 قفزتان تصل إلى 5.",
      },
    },
    {
      id: "c12",
      type: "question",
      titleAr: "تحدٍّ",
      bodyAr: "4 + 1 = ؟",
      interactiveKind: "type",
      question: {
        promptAr: "اكتب ناتج 4 + 1",
        correctAnswer: "5",
        explanationAr: "من 4 قفزة واحدة إلى 5.",
      },
    },
    {
      id: "c13",
      type: "writing_space",
      titleAr: "اكتب وأرسم",
      bodyAr: "ارسم خط أعداد واحسب 3 + 4.",
    },
    { id: "c14", type: "source_citation", bodyAr: "محاذاة النواتج مع منهاج الصف الأول — الرياضيات (NCCD)." },
  ],
});

const L3 = lessonBase({
  id: "u1-l3-doubles",
  order: 3,
  titleAr: "الجمع باستعمال الضعف",
  titleEn: "Addition Using Doubles",
  estimatedMinutes: 25,
  learningOutcomes: [
    "أتعرّف حقائق الضعف مثل 2+2 و3+3 و4+4 و5+5.",
    "أستخدم الضعف لحساب مجاميع قريبة بسرعة.",
  ],
  prerequisites: ["الجمع بخط الأعداد", "العدّ حتى 10"],
  vocabulary: [
    { term: "الضعف", definition: "جمع العدد إلى مثيله مثل 4 + 4." },
    { term: "قريب من الضعف", definition: "مجموع يشبه الضعف مع زيادة واحد أو نقصان واحد." },
  ],
  blocks: [
    { id: "d1", type: "heading", bodyAr: "ما هو الضعف؟" },
    {
      id: "d2",
      type: "paragraph",
      bodyAr: "الضعف يعني أن لدينا مجموعتين متساويتين. مثال: يدك فيها 5 أصابع، واليد الأخرى 5، فالمجموع 10.",
    },
    {
      id: "d3",
      type: "table",
      titleAr: "بطاقة حقائق الضعف",
      bodyAr: "1+1=2 · 2+2=4 · 3+3=6 · 4+4=8 · 5+5=10",
    },
    {
      id: "d4",
      type: "example",
      titleAr: "مثال",
      bodyAr: "3 + 3 = 6. إذا عرفنا هذا، فإن 3 + 4 قريب منه: 6 ثم واحد إضافي = 7.",
    },
    {
      id: "d5",
      type: "worked_solution",
      titleAr: "حل: 4 + 5",
      bodyAr: "نعرف 4+4=8. وبما أن 5 = 4+1، فإن 4+5 = 8+1 = 9.",
    },
    {
      id: "d6",
      type: "common_mistakes",
      titleAr: "انتبه",
      bodyAr: "خلط الضعف مع العدد التالي، مثل قول 3+3=7.",
    },
    {
      id: "d7",
      type: "real_life",
      titleAr: "واقع",
      bodyAr: "زوجا الجوارب، وعجلات الدراجة الهوائية الصغيرة، كلها أمثلة على الضعف.",
    },
    {
      id: "d8",
      type: "practice",
      titleAr: "تدريب",
      bodyAr: "أكمل: 2+2=؟ · 5+5=؟ · 4+4=؟",
    },
    {
      id: "d9",
      type: "question",
      titleAr: "سؤال",
      bodyAr: "5 + 5 = ؟",
      interactiveKind: "mcq",
      question: {
        promptAr: "٥ + ٥ = ؟",
        options: ["8", "9", "10"],
        correctIndex: 2,
        explanationAr: "ضعف خمسة يساوي عشرة.",
      },
    },
    {
      id: "d10",
      type: "writing_space",
      titleAr: "اكتب",
      bodyAr: "اكتب ثلاثة أمثلة ضعف من عندك.",
    },
    { id: "d11", type: "source_citation", bodyAr: "محتوى أصلي Success OS بمحاذاة نواتج الجمع للصف الأول." },
  ],
});

const L4 = lessonBase({
  id: "u1-l4-make-ten",
  order: 4,
  titleAr: "الجمع بالإكمال إلى العشرة",
  titleEn: "Making Ten",
  estimatedMinutes: 30,
  learningOutcomes: [
    "أحوّل بعض مسائل الجمع إلى 10 أولاً لتسهيل الحساب.",
    "أستخدم العلاقات مثل 9+1 و8+2 و7+3.",
  ],
  prerequisites: ["حقائق الضعف", "العدّ حتى 10"],
  vocabulary: [
    { term: "الإكمال إلى عشرة", definition: "أخذ جزء من العدد الثاني لإكمال العدد الأول إلى 10." },
  ],
  blocks: [
    { id: "e1", type: "heading", bodyAr: "لماذا نكمل إلى 10؟" },
    {
      id: "e2",
      type: "paragraph",
      bodyAr: "العدد 10 صديقنا. إذا وصلنا إليه أولاً، يصبح الجمع أسهل.",
    },
    {
      id: "e3",
      type: "example",
      titleAr: "مثال: 8 + 5",
      bodyAr: "من 8 نحتاج 2 للوصول إلى 10. نأخذ 2 من 5 فيبقى 3. إذن 10 + 3 = 13.",
    },
    {
      id: "e4",
      type: "worked_solution",
      titleAr: "حل: 9 + 4",
      bodyAr: "9 + 1 = 10، ويتبقى 3 من الأربعة. 10 + 3 = 13.",
    },
    {
      id: "e5",
      type: "common_mistakes",
      titleAr: "خطأ شائع",
      bodyAr: "نسيان طرح الجزء المستخدم للإكمال من العدد الثاني.",
    },
    {
      id: "e6",
      type: "practice",
      titleAr: "تدرب",
      bodyAr: "احسب بطريقة الإكمال إلى 10: 7+4 ، 6+5 ، 9+6.",
    },
    {
      id: "e7",
      type: "question",
      titleAr: "تحقق",
      bodyAr: "9 + 1 = ؟",
      interactiveKind: "mcq",
      question: {
        promptAr: "٩ + ١ = ؟",
        options: ["9", "10", "11"],
        correctIndex: 1,
        explanationAr: "تسعة زائد واحد يكملان العشرة.",
      },
    },
    {
      id: "e8",
      type: "writing_space",
      titleAr: "اشرح",
      bodyAr: "اشرح بكلماتك كيف تحسب 8 + 3 بالإكمال إلى 10.",
    },
    { id: "e9", type: "source_citation", bodyAr: "شرح أصلي Success OS؛ المرجع الرسمي NCCD للتحقق من ترتيب الوحدة." },
  ],
});

const L5 = lessonBase({
  id: "u1-l5-properties",
  order: 5,
  titleAr: "خصائص عملية الجمع",
  titleEn: "Properties of Addition",
  estimatedMinutes: 25,
  learningOutcomes: [
    "أطبّق خاصية التبديل: a+b = b+a.",
    "أتعرّف أن جمع صفر لا يغيّر العدد.",
  ],
  prerequisites: ["الجمع بخط الأعداد", "حقائق الضعف"],
  vocabulary: [
    { term: "خاصية التبديل", definition: "يمكن تبديل ترتيب العددين دون تغيير الناتج." },
    { term: "العنصر المحايد", definition: "العدد 0 عند الجمع لا يغيّر الناتج." },
  ],
  blocks: [
    { id: "f1", type: "heading", bodyAr: "ماذا تتعلّم الخصائص؟" },
    {
      id: "f2",
      type: "paragraph",
      bodyAr: "خصائص الجمع تساعدنا نتحقق من إجاباتنا ونحسب أسرع.",
    },
    {
      id: "f3",
      type: "formula",
      titleAr: "التبديل",
      bodyAr: "3 + 2 = 2 + 3",
      formula: "a + b = b + a",
    },
    {
      id: "f4",
      type: "example",
      titleAr: "صفر صديق الجمع",
      bodyAr: "7 + 0 = 7 و 0 + 5 = 5.",
    },
    {
      id: "f5",
      type: "worked_solution",
      titleAr: "تحقق",
      bodyAr: "احسب 2+6 على الخط، ثم 6+2. الناتج واحد = 8.",
    },
    {
      id: "f6",
      type: "common_mistakes",
      titleAr: "خطأ",
      bodyAr: "ظنّ أن الترتيب يغيّر الناتج في الجمع (هذا صحيح في الطرح لاحقاً، لا في الجمع).",
    },
    {
      id: "f7",
      type: "practice",
      titleAr: "تطبيق",
      bodyAr: "اكتب المسألة المعكوسة لـ 4+3 وأوجد الناتج.",
    },
    {
      id: "f8",
      type: "question",
      titleAr: "سؤال ختامي للوحدة",
      bodyAr: "2 + 3 = 3 + 2 ؟",
      interactiveKind: "mcq",
      question: {
        promptAr: "هل ٢ + ٣ يساوي ٣ + ٢؟",
        options: ["نعم", "لا", "أحياناً"],
        correctIndex: 0,
        explanationAr: "خاصية التبديل تجعل الناتجين متساويين.",
      },
    },
    {
      id: "f9",
      type: "activity",
      titleAr: "نشاط الوحدة",
      bodyAr: "مع زميل: كل واحد يكتب مسألة جمع، والآخر يكتب المسألة المعكوسة ويتحقق على خط الأعداد.",
    },
    {
      id: "f10",
      type: "writing_space",
      titleAr: "ملخص بيدي",
      bodyAr: "اكتب جملتين: ماذا تعلمت عن خط الأعداد؟ وماذا تعلمت عن التبديل؟",
    },
    { id: "f11", type: "source_citation", bodyAr: "Success OS original · Official catalog: NCCD Grade 1." },
  ],
});

export const G1_MATH_S1_STUDENT_BOOK: BookRecord = {
  id: "jo-g1-s1-math-student-book",
  country: "Jordan",
  curriculum: "national",
  academicYear: "NEEDS VERIFICATION",
  stage: "التعليم الأساسي",
  grade: "1",
  gradeAr: "الصف الأول",
  semester: "1",
  semesterAr: "الفصل الدراسي الأول",
  subject: "Mathematics",
  subjectAr: "الرياضيات",
  officialTitleAr: "الرياضيات — كتاب الطالب — الفصل الدراسي الأول (نسخة تفاعلية Success OS)",
  officialTitleEn: "Mathematics — Student Book — Semester 1 (Success OS interactive aligned)",
  bookType: "student",
  edition: "NEEDS VERIFICATION",
  publicationYear: "NEEDS VERIFICATION",
  officialSourceUrl: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
  curriculumAuthority: "المركز الوطني لتطوير المناهج / وزارة التربية والتعليم الأردنية",
  availabilityStatus: "sos_interactive_pilot",
  rightsStatus: "sos_original_aligned",
  verificationDate: "2026-07-28",
  verificationNote:
    "Unit/lesson titles seeded from Minhaji structure companion; official edition year and exact order NEED VERIFICATION on NCCD. Official textbook PDF is linked only — not republished.",
  editorialStatus: "draft",
  units: [
    {
      id: "unit-1",
      order: 1,
      titleAr: "الوحدة الأولى: الجمع",
      titleEn: "Unit 1: Addition",
      descriptionAr:
        "نتعلّم خط الأعداد، والجمع بالقفز، والضعف، والإكمال إلى العشرة، وخصائص الجمع. محتوى Success OS أصلي بمحاذاة نواتج الصف الأول.",
      verificationNote: "NEEDS VERIFICATION: confirm this is Unit 1 title/order in the current NCCD edition.",
      lessons: [L1, L2, L3, L4, L5],
    },
  ],
};
