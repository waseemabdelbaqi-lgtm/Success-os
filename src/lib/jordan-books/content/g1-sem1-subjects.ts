import { buildCompanionBook, type CompanionBookSeed } from "@/src/lib/jordan-books/content/companion-factory";
import type { BookRecord } from "@/src/lib/jordan-books/schema/types";

const NCCD = "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68";

function base(partial: Omit<CompanionBookSeed, "grade" | "gradeAr" | "semester" | "semesterAr" | "stage" | "officialSourceUrl">): CompanionBookSeed {
  return {
    grade: "1",
    gradeAr: "الصف الأول",
    semester: "1",
    semesterAr: "الفصل الدراسي الأول",
    stage: "التعليم الأساسي",
    officialSourceUrl: NCCD,
    ...partial,
  };
}

export const G1_S1_SCIENCE: BookRecord = buildCompanionBook(
  base({
    id: "jo-g1-s1-science-companion",
    subject: "Science",
    subjectAr: "العلوم",
    units: [
      {
        id: "sci-u1",
        order: 1,
        titleAr: "الوحدة الأولى: الإنسان والصحة",
        titleEn: "Humans and Health",
        descriptionAr: "نتعرّف تشابهنا وحاجاتنا وصحة الجسم. (عناوين مرافقة — NEEDS VERIFICATION)",
        lessons: [
          {
            id: "sci-u1-l1",
            order: 1,
            titleAr: "نحن متشابهون",
            titleEn: "We Are Alike",
            outcomes: ["ألاحظ صفات مشتركة بين البشر", "أصف تشابهات واختلافات بسيطة"],
            hookAr: "انظر إلى زملائك: ما الذي نتشابه فيه؟",
            explanationAr:
              "البشر يتشابهون في حاجات أساسية مثل الهواء والطعام والماء، وقد يختلفون في الطول ولون الشعر. الملاحظة العلمية تبدأ بمقارنة آمنة ومحترمة.",
            exampleAr: "هل جميعنا نحتاج الهواء؟",
            answer: "نعم",
            options: ["نعم", "لا", "أحياناً فقط"],
            correctIndex: 0,
          },
          {
            id: "sci-u1-l2",
            order: 2,
            titleAr: "حاجات الإنسان الأساسية",
            titleEn: "Basic Human Needs",
            outcomes: ["أعدّد حاجات أساسية", "أربط الحاجة بمثال يومي"],
            hookAr: "ماذا يحدث إذا لم نشرب ماء طوال اليوم؟",
            explanationAr:
              "من حاجات الإنسان: الهواء، الماء، الغذاء، المأوى، الراحة. بدونها يصعب أن نبقى أصحاء. نميّز الحاجة عن الرغبة الكمالية.",
            exampleAr: "أيّ مما يلي حاجة أساسية؟",
            answer: "الماء",
            options: ["لعبة جديدة", "الماء", "فيلم"],
            correctIndex: 1,
          },
          {
            id: "sci-u1-l3",
            order: 3,
            titleAr: "صحة جسم الإنسان",
            titleEn: "Human Body Health",
            outcomes: ["أذكر عادات صحية", "أشرح أهمية النظافة والنشاط"],
            hookAr: "لماذا نغسل اليدين قبل الأكل؟",
            explanationAr:
              "الصحة تُبنى بعادات: نظافة، غذاء متوازن، نوم كافٍ، حركة. غسل اليدين يقلل انتقال الجراثيم. نبتعد عن مشاركة الأدوات الشخصية.",
            exampleAr: "عادة صحية قبل الطعام:",
            answer: "غسل اليدين",
            options: ["غسل اليدين", "الجري في الممر", "الصراخ"],
            correctIndex: 0,
          },
        ],
      },
      {
        id: "sci-u2",
        order: 2,
        titleAr: "الوحدة: الحركة والقوة (تمهيد)",
        titleEn: "Motion and Force intro",
        descriptionAr: "مفاهيم أولية عن الموقع والحركة. NEEDS VERIFICATION لترتيب الوحدات الرسمي.",
        lessons: [
          {
            id: "sci-u2-l1",
            order: 1,
            titleAr: "الموقع والحركة",
            titleEn: "Position and Motion",
            outcomes: ["أصف موقع جسم", "أفرّق بين ساكن ومتحرك"],
            hookAr: "الكرة على الطاولة ساكنة أم متحركة؟",
            explanationAr:
              "الموقع يصف أين يوجد الشيء. الحركة تعني تغيّر الموقع مع الزمن. ندفع أو نسحب لتغيير الحركة برفق وأمان داخل الصف.",
            exampleAr: "طفل يمشي في الساحة:",
            answer: "متحرك",
            options: ["ساكن", "متحرك", "غير موجود"],
            correctIndex: 1,
          },
          {
            id: "sci-u2-l2",
            order: 2,
            titleAr: "الدفع والسحب بأمان",
            titleEn: "Safe Push and Pull",
            outcomes: ["أتعرّف الدفع والسحب", "أطبّق قواعد السلامة"],
            hookAr: "كيف نفتح الدرج: ندفع أم نسحب؟",
            explanationAr:
              "الدفع يبعّد الجسم عنا، والسحب يقرّبه. نجرب بقوة مناسبة ولا ندفع الزملاء. العلم praktikal آمن.",
            exampleAr: "فتح درج الطاولة غالباً يكون:",
            answer: "سحباً",
            options: ["دفعاً فقط", "سحباً", "قفزاً"],
            correctIndex: 1,
          },
        ],
      },
    ],
  }),
);

export const G1_S1_ARABIC: BookRecord = buildCompanionBook(
  base({
    id: "jo-g1-s1-arabic-companion",
    subject: "Arabic",
    subjectAr: "اللغة العربية",
    units: [
      {
        id: "ar-u1",
        order: 1,
        titleAr: "الوحدة الأولى: أصوات وحروف",
        titleEn: "Sounds and Letters",
        descriptionAr: "تأسيس صوتي وحرفي للصف الأول — محتوى Success OS أصلي.",
        lessons: [
          {
            id: "ar-u1-l1",
            order: 1,
            titleAr: "الاستماع والنطق الواضح",
            titleEn: "Clear Listening and Speech",
            outcomes: ["أستمع بانتباه", "أكرر كلمات بوضوح"],
            hookAr: "هل تسمع الفرق بين «سار» و«صار»؟",
            explanationAr:
              "الاستماع أول مهارة لغوية. نكرر الكلمات ببطء ونفتح الفم بوضوح. لا نضيف تشكيلات غير مطلوبة ما لم يطلبها المنهج.",
            exampleAr: "مهارة البداية في اللغة:",
            answer: "الاستماع",
            options: ["الاستماع", "الطباعة فقط", "الصمت الدائم"],
            correctIndex: 0,
          },
          {
            id: "ar-u1-l2",
            order: 2,
            titleAr: "التعرف على الحروف",
            titleEn: "Recognizing Letters",
            outcomes: ["أميز شكل حرف", "أربط الصوت بالرمز"],
            hookAr: "أين حرف الباء في كلمة باب؟",
            explanationAr:
              "لكل حرف اسم وصوت وشكل. نتتبع الحرف بالإصبع ثم نكتبه في الهواء ثم على السطر. نميّز الحرف في أول الكلمة ووسطها وآخرها لاحقاً.",
            exampleAr: "أول حرف في «باب»:",
            answer: "ب",
            options: ["ب", "م", "ل"],
            correctIndex: 0,
          },
          {
            id: "ar-u1-l3",
            order: 3,
            titleAr: "تكوين كلمات قصيرة",
            titleEn: "Building Short Words",
            outcomes: ["أركّب صوتين", "أقرأ كلمة قصيرة"],
            hookAr: "ب + ا = ؟",
            explanationAr:
              "نجمع أصواتاً لتكوين كلمات مثل: باب، نار، قلم. نقرأ ببطء ثم بسرعة مناسبة. الفهم يأتي مع التكرار اللطيف لا الحفظ الأصم وحده.",
            exampleAr: "كلمة من حرفين صوتيين بسيطين مثالها:",
            answer: "باب",
            options: ["باب", "مدرسة طويلة", "جملة"],
            correctIndex: 0,
          },
        ],
      },
      {
        id: "ar-u2",
        order: 2,
        titleAr: "الوحدة الثانية: قراءة وكتابة مبكرة",
        titleEn: "Early Reading and Writing",
        descriptionAr: "انتقال إلى جمل قصيرة وكتابة منظمة.",
        lessons: [
          {
            id: "ar-u2-l1",
            order: 1,
            titleAr: "جملة قصيرة",
            titleEn: "A Short Sentence",
            outcomes: ["أقرأ جملة قصيرة", "أحدد أول وآخر كلمة"],
            hookAr: "«هذا قلم.» كم كلمة فيها؟",
            explanationAr:
              "الجملة تحمل معنى تاماً قصيراً. نترك مسافة بين الكلمات ونبدأ بوضوح. الفهم أهم من السرعة في الصف الأول.",
            exampleAr: "في «هذا قلم» عدد الكلمات تقريباً:",
            answer: "2",
            options: ["1", "2", "5"],
            correctIndex: 1,
          },
          {
            id: "ar-u2-l2",
            order: 2,
            titleAr: "الكتابة على السطر",
            titleEn: "Writing on the Line",
            outcomes: ["أكتب بخط مقروء", "أحترم اتجاه RTL"],
            hookAr: "من أين نبدأ الكتابة بالعربية؟",
            explanationAr:
              "نكتب من اليمين إلى اليسار، على السطر، بحجم مناسب. نستخدم مساحات الكتابة التفاعلية للتدرب بالقلم.",
            exampleAr: "اتجاه الكتابة العربية:",
            answer: "من اليمين إلى اليسار",
            options: ["من اليسار إلى اليمين", "من اليمين إلى اليسار", "من الأعلى فقط"],
            correctIndex: 1,
          },
        ],
      },
    ],
  }),
);

export const G1_S1_ENGLISH: BookRecord = buildCompanionBook(
  base({
    id: "jo-g1-s1-english-companion",
    subject: "English",
    subjectAr: "اللغة الإنجليزية",
    units: [
      {
        id: "en-u1",
        order: 1,
        titleAr: "Unit 1: Hello and Me",
        titleEn: "Hello and Me",
        descriptionAr: "Greetings and identity — LTR English inside Arabic platform.",
        lessons: [
          {
            id: "en-u1-l1",
            order: 1,
            titleAr: "Hello / Hi",
            titleEn: "Hello / Hi",
            outcomes: ["Say hello", "Respond to a greeting"],
            hookAr: "How do you greet a friend in English?",
            explanationAr:
              "We say Hello or Hi when we meet someone. We can answer Hello! Smile and speak clearly. English text is left-to-right.",
            exampleAr: "A common greeting is:",
            answer: "Hello",
            options: ["Hello", "Goodbye only", "Silent"],
            correctIndex: 0,
          },
          {
            id: "en-u1-l2",
            order: 2,
            titleAr: "My name is…",
            titleEn: "My name is…",
            outcomes: ["Introduce my name", "Ask What is your name?"],
            hookAr: "Can you say: My name is …?",
            explanationAr:
              "My name is + your name. Question: What is your name? Listen, then answer. Keep sentences short in Grade 1.",
            exampleAr: "Complete: My name ____ Sara.",
            answer: "is",
            options: ["is", "are", "am"],
            correctIndex: 0,
          },
          {
            id: "en-u1-l3",
            order: 3,
            titleAr: "Colors",
            titleEn: "Colors",
            outcomes: ["Name basic colors", "Match color words"],
            hookAr: "What color is the sun often drawn?",
            explanationAr:
              "Basic colors: red, blue, yellow, green. Point, say, and match. Use pictures before long spelling lists.",
            exampleAr: "Grass is often:",
            answer: "green",
            options: ["green", "blue", "black"],
            correctIndex: 0,
          },
        ],
      },
      {
        id: "en-u2",
        order: 2,
        titleAr: "Unit 2: Numbers and Classroom",
        titleEn: "Numbers and Classroom",
        descriptionAr: "Numbers 1–10 and classroom words.",
        lessons: [
          {
            id: "en-u2-l1",
            order: 1,
            titleAr: "Numbers 1–5",
            titleEn: "Numbers 1–5",
            outcomes: ["Count 1 to 5 in English", "Read number words"],
            hookAr: "Count your fingers: one, two…",
            explanationAr:
              "one, two, three, four, five. Clap while counting. Connect to math number sense without mixing Arabic digits rules incorrectly.",
            exampleAr: "After two comes:",
            answer: "three",
            options: ["three", "five", "one"],
            correctIndex: 0,
          },
          {
            id: "en-u2-l2",
            order: 2,
            titleAr: "Classroom objects",
            titleEn: "Classroom objects",
            outcomes: ["Name pen, book, bag", "Follow simple commands"],
            hookAr: "Point to your book.",
            explanationAr:
              "pen, book, bag, chair. Teacher says: Show me your pen. Students respond by pointing or saying the word.",
            exampleAr: "We write with a:",
            answer: "pen",
            options: ["pen", "chair", "door"],
            correctIndex: 0,
          },
        ],
      },
    ],
  }),
);

export const G1_S1_ISLAMIC: BookRecord = buildCompanionBook(
  base({
    id: "jo-g1-s1-islamic-companion",
    subject: "Islamic Education",
    subjectAr: "التربية الإسلامية",
    units: [
      {
        id: "is-u1",
        order: 1,
        titleAr: "الوحدة الأولى: أحبك ربي",
        titleEn: "I Love My Lord",
        descriptionAr:
          "قيم ومحبة الله بأسلوب عمري مناسب. لا يُنسخ نص قرآني هنا دون تحقق أكاديمي لاحق — نستخدم إحالات عامة فقط.",
        lessons: [
          {
            id: "is-u1-l1",
            order: 1,
            titleAr: "الله خالقي",
            titleEn: "Allah is My Creator",
            outcomes: ["أذكر أن الله خلقني", "أشكر الله على نعمه"],
            hookAr: "من خلق العين التي ترى الألوان؟",
            explanationAr:
              "نؤمن أن الله هو الخالق. نشكر الله على السمع والبصر والطعام. نتحدث بأدب ونبتعد عن أي نص مقدس غير مُراجع في هذه المسودة.",
            exampleAr: "نشكر الله على:",
            answer: "النعم",
            options: ["النعم", "الأذى", "الصراخ"],
            correctIndex: 0,
          },
          {
            id: "is-u1-l2",
            order: 2,
            titleAr: "أحب الخير",
            titleEn: "I Love Goodness",
            outcomes: ["أميز سلوكاً طيباً", "أختار مساعدة الآخرين"],
            hookAr: "ماذا تفعل إذا سقط قلم زميلك؟",
            explanationAr:
              "حب الله يظهر في السلوك الحسن: الصدق، المساعدة، الرفق. الصف مكان للأخلاق العملية لا الشعارات فقط.",
            exampleAr: "سلوك طيب:",
            answer: "مساعدة الزميل",
            options: ["مساعدة الزميل", "السخرية", "دفع الزميل"],
            correctIndex: 0,
          },
          {
            id: "is-u1-l3",
            order: 3,
            titleAr: "آداب بسيطة",
            titleEn: "Simple Manners",
            outcomes: ["أستأذن", "أرد التحية"],
            hookAr: "ماذا نقول قبل دخول الصف؟",
            explanationAr:
              "من الآداب: السلام، الاستئذان، الكلام الطيب. نربط القيم بالسلوك اليومي في البيت والمدرسة.",
            exampleAr: "من الآداب:",
            answer: "السلام",
            options: ["السلام", "المقاطعة بصراخ", "أخذ أدوات الغير"],
            correctIndex: 0,
          },
        ],
      },
    ],
  }),
);

export const G1_S1_SOCIAL: BookRecord = buildCompanionBook(
  base({
    id: "jo-g1-s1-social-companion",
    subject: "Social Studies",
    subjectAr: "الدراسات الاجتماعية",
    units: [
      {
        id: "so-u1",
        order: 1,
        titleAr: "الوحدة الأولى: أنا وأسرتي ومدرستي",
        titleEn: "Me, Family, School",
        descriptionAr: "انتماء ومهارات اجتماعية أولية.",
        lessons: [
          {
            id: "so-u1-l1",
            order: 1,
            titleAr: "أفراد أسرتي",
            titleEn: "My Family",
            outcomes: ["أعدّد أفراد الأسرة", "أصف دوراً بسيطاً"],
            hookAr: "من يعيش معك في البيت؟",
            explanationAr:
              "الأسرة مجموعة يهتم أفرادها ببعض. الأدوار تختلف لكن الاحترام مشترك. نرسم شجرة أسرة بسيطة دون مشاركة معلومات خاصة حساسة.",
            exampleAr: "من أفراد الأسرة غالباً:",
            answer: "الأب أو الأم أو الوصي",
            options: ["الأب أو الأم أو الوصي", "الحافلة", "السبورة"],
            correctIndex: 0,
          },
          {
            id: "so-u1-l2",
            order: 2,
            titleAr: "مدرستي مكان آمن",
            titleEn: "My Safe School",
            outcomes: ["أتعرّف أماكن المدرسة", "أتبع قواعد السلامة"],
            hookAr: "أين باب الطوارئ في مدرستك؟",
            explanationAr:
              "المدرسة فيها صف ومكتبة وساحات. نمشي بهدوء ونستأذن. السلامة جزء من المواطنة الصغيرة.",
            exampleAr: "في الممر نكون:",
            answer: "هادئين",
            options: ["هادئين", "نركض دائماً", "ندفع"],
            correctIndex: 0,
          },
          {
            id: "so-u1-l3",
            order: 3,
            titleAr: "وطني الأردن",
            titleEn: "My Country Jordan",
            outcomes: ["أذكر اسم وطني", "أتعرّف علم بلادي باحترام"],
            hookAr: "ما اسم بلدنا؟",
            explanationAr:
              "الأردن وطننا. نحترم العلم والرموز الوطنية بأسلوب عمري مناسب دون معلومات تاريخية غير موثّقة.",
            exampleAr: "اسم الوطن:",
            answer: "الأردن",
            options: ["الأردن", "مدينة فقط", "شارع"],
            correctIndex: 0,
          },
        ],
      },
    ],
  }),
);

export const G1_S1_DIGITAL: BookRecord = buildCompanionBook(
  base({
    id: "jo-g1-s1-digital-companion",
    subject: "Digital Skills",
    subjectAr: "المهارات الرقمية",
    units: [
      {
        id: "di-u1",
        order: 1,
        titleAr: "الوحدة الأولى: جهاز آمن ومهذب",
        titleEn: "Safe and Kind Device Use",
        descriptionAr: "مهارات رقمية أولية وآداب.",
        lessons: [
          {
            id: "di-u1-l1",
            order: 1,
            titleAr: "أجزاء الجهاز",
            titleEn: "Device Parts",
            outcomes: ["أسمي الشاشة ولوحة المفاتيح", "أشغّل/أطفئ بإرشاد"],
            hookAr: "أين الشاشة؟",
            explanationAr:
              "الجهاز فيه شاشة ولوحة مفاتيح أو لمس وفأرة أحياناً. نستخدمه برفق وبإذن المعلم/ولي الأمر.",
            exampleAr: "ما الذي ننظر إليه لرؤية الصور؟",
            answer: "الشاشة",
            options: ["الشاشة", "الكابل فقط", "الطاولة"],
            correctIndex: 0,
          },
          {
            id: "di-u1-l2",
            order: 2,
            titleAr: "سلامة رقمية مبسطة",
            titleEn: "Simple Digital Safety",
            outcomes: ["لا أشارك أسراراً", "أستأذن قبل التصفح"],
            hookAr: "هل نعطي كلمة السر لصديق؟",
            explanationAr:
              "لا نشارك كلمات السر ولا الصور الخاصة. إن ظهرت رسالة غريبة نخبر معلماً أو ولي أمر. الأمان قبل الفضول.",
            exampleAr: "كلمة السر:",
            answer: "لا نشاركها",
            options: ["لا نشاركها", "نكتبها على السبورة", "نعطيها للجميع"],
            correctIndex: 0,
          },
        ],
      },
    ],
  }),
);

export const G1_S1_PE: BookRecord = buildCompanionBook(
  base({
    id: "jo-g1-s1-pe-companion",
    subject: "Physical Education",
    subjectAr: "التربية الرياضية",
    units: [
      {
        id: "pe-u1",
        order: 1,
        titleAr: "الوحدة الأولى: حركة آمنة ومرحة",
        titleEn: "Safe Fun Movement",
        descriptionAr: "إحماء، توازن، قواعد سلامة.",
        lessons: [
          {
            id: "pe-u1-l1",
            order: 1,
            titleAr: "الإحماء",
            titleEn: "Warm-up",
            outcomes: ["أنفّذ إحماء بسيط", "أفهم لماذا نُحمّي"],
            hookAr: "لماذا لا نركض بأقصى سرعة فوراً؟",
            explanationAr:
              "الإحماء يجهّز العضلات: مشي خفيف وحركات ذراعين. السلامة أولاً: مساحة كافية وحذاء مناسب.",
            exampleAr: "قبل اللعب القوي نبدأ بـ:",
            answer: "إحماء",
            options: ["إحماء", "جلوس طويل فقط", "نوم"],
            correctIndex: 0,
          },
          {
            id: "pe-u1-l2",
            order: 2,
            titleAr: "التوازن والتعاون",
            titleEn: "Balance and Teamwork",
            outcomes: ["أقف على قدم مع دعم", "ألعب دون دفع"],
            hookAr: "هل ن دفع الزميل لنربح؟",
            explanationAr:
              "التوازن مهارة جسمية. التعاون أهم من الفوز السريع. نحترم المسافة والقواعد.",
            exampleAr: "في اللعب الجماعي نتجنب:",
            answer: "الدفع",
            options: ["الدفع", "التشجيع", "انتظار الدور"],
            correctIndex: 0,
          },
        ],
      },
    ],
  }),
);

export const G1_S1_ARTS: BookRecord = buildCompanionBook(
  base({
    id: "jo-g1-s1-arts-companion",
    subject: "Arts",
    subjectAr: "التربية الفنية والموسيقية والمسرحية",
    units: [
      {
        id: "art-u1",
        order: 1,
        titleAr: "الوحدة الأولى: خطوط وألوان وصوت",
        titleEn: "Lines, Colors, Sound",
        descriptionAr: "تعبير فني أولي آمن.",
        lessons: [
          {
            id: "art-u1-l1",
            order: 1,
            titleAr: "الخط والنقطة",
            titleEn: "Line and Dot",
            outcomes: ["أرسم خطوطاً متنوعة", "أملأ مساحة بلون"],
            hookAr: "كم نوعاً من الخطوط تستطيع رسمه؟",
            explanationAr:
              "النقطة والخط أساس الرسم. نجرّب مستقيماً ومنحنياً. نحافظ على نظافة المكان ونشارك المواد.",
            exampleAr: "أساس كثير من الرسوم:",
            answer: "الخط",
            options: ["الخط", "المحرك", "لوحة المفاتيح"],
            correctIndex: 0,
          },
          {
            id: "art-u1-l2",
            order: 2,
            titleAr: "إيقاع تصفيق بسيط",
            titleEn: "Simple Clap Rhythm",
            outcomes: ["أنشئ نمطاً صوتياً", "أكرر نمطاً"],
            hookAr: "صفّق: طا ـ طا ـ طاطا",
            explanationAr:
              "الإيقاع تكرار منتظم للصوت. نصفق معاً برفق. المسرح الصغير: جملة قصيرة وتمثيل آمن.",
            exampleAr: "الإيقاع هو:",
            answer: "تكرار منتظم",
            options: ["تكرار منتظم", "فوضى", "صمت دائم"],
            correctIndex: 0,
          },
        ],
      },
    ],
  }),
);

export const G1_SEM1_SUBJECT_BOOKS: BookRecord[] = [
  G1_S1_ARABIC,
  G1_S1_ENGLISH,
  G1_S1_SCIENCE,
  G1_S1_ISLAMIC,
  G1_S1_SOCIAL,
  G1_S1_DIGITAL,
  G1_S1_PE,
  G1_S1_ARTS,
];
