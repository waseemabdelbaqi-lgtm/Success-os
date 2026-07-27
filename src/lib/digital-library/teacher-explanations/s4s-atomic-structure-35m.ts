import type { TeacherExplanation } from "@/src/lib/digital-library/types";

/**
 * Full teacher-led explanation ≥ 30 minutes for
 * EST II Chemistry — Atomic Structure Part 1
 * Delivered by Teachers OS: Mr. Waseem Al-Labadi · Success 4 Sure Academy
 * Profile: https://www.success4sureacademy.com/waseem-al-labadi
 */
export const S4S_ATOMIC_STRUCTURE_TEACHER_35M: TeacherExplanation = {
  totalMinutes: 35,
  teacherId: "teacher-s4s-waseem-al-labadi",
  teacherName: "Mr. Waseem Al-Labadi · Success 4 Sure",
  teacherHref: "/teachers/teacher-s4s-waseem-al-labadi",
  offerId: "offer-s4s-est-chem-atomic-structure-35m",
  offerHref: "/teachers/offers/offer-s4s-est-chem-atomic-structure-35m",
  titleAr: "شرح المعلّم الكامل · التركيب الذري · 35 دقيقة",
  subtitleAr:
    "أستاذ وسيم اللبدي — Success 4 Sure Academy · عربي + English · مسار EST Chemistry",
  materials: [
    "جدول دوري مبسّط (أو صورة على الشاشة)",
    "دفتر ملاحظات الطالب + آلة حاسبة علمية",
    "بطاقات: proton / neutron / electron",
    "مجسّم المدارات 3D داخل درس SUCCESS OS",
    "ورقة تدريب EST (5 مسائل قصيرة)",
  ],
  segments: [
    {
      id: "warmup",
      minutes: 5,
      titleAr: "تهيئة والفكرة الكبيرة",
      goalAr: "يربط الطالب الذرة بالحياة اليومية ويفهم لماذا نبدأ بالـ particles.",
      teacherScript: `مرحباً يا شباب. أنا أستاذ وسيم اللبدي — مؤسس Success 4 Sure Academy، ومعلّم كيمياء وفيزياء.

Today’s lesson is Atomic Structure Part 1 — أول محطة في EST II Chemistry، وأساس AP و ACT Chemistry كمان.

سؤال سريع: ليش الذهب أصفر والحديد يصدأ والملح يذوب بالماء؟ الجواب مش «سحر»… الجواب داخل الذرة: كيف مرتّبة الجسيمات وكيف بتتفاعل.

في هالـ 35 دقيقة رح نتقن:
1) البروتون والنيوترون والإلكترون
2) الرقم الذري Z ورقم الكتلة A
3) الأيونات والـ isotopes
4) مسائل بأسلوب امتحان EST

افتحوا دفتركم واكتبوا العنوان: Atomic Structure — Particles, Z, A, Isotopes.
جاهزين؟ يلا نبدأ.`,
      studentMoves: [
        "يكتب عنوان الدرس والأهداف الأربعة",
        "يجيب شفهيًا بجملة واحدة: ليش الذرة مهمة؟",
      ],
      boardCue: "Atomic Structure Part 1 · EST Chemistry · Mr. Waseem Al-Labadi (S4S)",
    },
    {
      id: "particles",
      minutes: 8,
      titleAr: "الجسيمات دون الذرية",
      goalAr: "يحفظ الطالب الشحنة والكتلة التقريبية وموقع كل جسيم.",
      teacherScript: `خلينا نرسم ذرة بسيطة على السبورة — نواة في الوسط وسحابة إلكترونات برّا.

Three subatomic particles — احفظوهم كعائلة:

1) Proton (p⁺)
- Charge: +1
- Relative mass: ≈ 1
- Location: nucleus
- عدد البروتونات = هوية العنصر. لو غيّرت عدد البروتونات، غيّرت العنصر نفسه.

2) Neutron (n⁰)
- Charge: 0 (neutral)
- Relative mass: ≈ 1
- Location: nucleus
- النيوترون زي «الغراء» اللي بيساعد النواة تكون مستقرة. عدد النيوترونات ممكن يختلف لنفس العنصر → isotopes.

3) Electron (e⁻)
- Charge: −1
- Relative mass: ≈ 1/1836 (تقريبًا صفر مقارنة بالبروتون)
- Location: outside the nucleus (electron cloud / orbitals)
- الإلكترونات هي اللي بتشارك بالتفاعل الكيميائي والترابط.

قاعدة ذهبية من Success 4 Sure:
In a neutral atom: number of protons = number of electrons.
إذا الذرة متعادلة، موجبات النواة = سالبات السحابة.

هلق افتحوا الـ 3D orbital visualizer في الدرس. شوفوا النواة في الوسط والمدارات برّا — هذا نفس اللي رسمناه، بس حيّ.`,
      studentMoves: [
        "يملأ جدول: particle | charge | relative mass | location",
        "يفتح مجسّم 3D ويحدد النواة والمدار",
      ],
      boardCue:
        "p⁺ (+1, mass≈1, nucleus) · n⁰ (0, mass≈1, nucleus) · e⁻ (−1, mass≈0, outside)",
    },
    {
      id: "za",
      minutes: 8,
      titleAr: "الرقم الذري ورقم الكتلة",
      goalAr: "يستخدم Z و A ويحسب عدد النيوترونات بسرعة امتحانية.",
      teacherScript: `هلق ندخل لغة الامتحان — EST بحب الرموز.

Atomic number Z = number of protons.
Mass number A = protons + neutrons (في نواة ذرة معيّنة / isotope معيّن).

الصيغة اللي لازم تنكتب بعينك مغمضة:
n = A − Z

مثال على السبورة: Carbon-12
نكتبها أحيانًا: ¹²C
- Z for carbon = 6 → 6 protons
- A = 12 → neutrons = 12 − 6 = 6
- Neutral atom → 6 electrons

مثال ثاني: Oxygen-16 → ¹⁶O
- Z = 8 → 8 p⁺, 8 e⁻ (neutral)
- n = 16 − 8 = 8

خطأ شائع بشوفه كل سنة:
الطلاب بخلطوا بين mass number A والكتلة الذرية المتوسطة من الجدول الدوري.
A عدد صحيح لـ isotope معيّن.
Average atomic mass من الجدول رقم عشري لأنه متوسط موزون للـ isotopes.

تمرين سريع معي:
Sodium-23 → Z=11. احسبوا p, n, e للذرة المتعادلة.
… نعم: 11 p⁺, 12 n⁰, 11 e⁻.`,
      studentMoves: [
        "يحل Sodium-23 على الدفتر قبل ما يكمل المعلّم",
        "يكتب ملاحظة: A ≠ average atomic mass",
      ],
      boardCue: "Z = p⁺ · A = p⁺ + n⁰ · n = A − Z · neutral ⇒ e⁻ = Z",
    },
    {
      id: "ions-isotopes",
      minutes: 9,
      titleAr: "الأيونات والنظائر",
      goalAr: "يميّز الطالب بين تغيير الإلكترونات (أيون) وتغيير النيوترونات (نظير).",
      teacherScript: `فكرتين لازم ما ينخلطوا أبدًا — وهذا سؤال EST كلاسيكي.

Idea 1 — Ions (الأيونات)
لما الذرة تفقد أو تكتسب إلكترونات، الشحنة بتتغيّر، والعنصر يبقى نفسه لأن Z ما تغيّر.
- Na → Na⁺ : فقد إلكترون واحد → 11 p⁺, 10 e⁻
- Cl → Cl⁻ : اكتسب إلكترون → 17 p⁺, 18 e⁻
Charge = protons − electrons

Idea 2 — Isotopes (النظائر)
نفس العنصر (نفس Z) لكن عدد نيوترونات مختلف → A مختلف.
مثال: ¹²C و ¹³C و ¹⁴C
كلها كربون لأن Z=6، لكن neutrons = 6 أو 7 أو 8.

ليه مهم؟ لأن كتلة العنصر في الجدول متوسط، ولأن بعض النظائر مشعة (carbon-14 بالتأريخ).

EST tip من أكاديمية Success 4 Sure:
إذا السؤال غيّر protons → عنصر جديد.
إذا غيّر electrons فقط → أيون لنفس العنصر.
إذا غيّر neutrons فقط → isotope لنفس العنصر.

تمرين موجّه:
Compare ²⁴Mg و ²⁴Mg²⁺ و ²⁵Mg
- أيهم isotope لبعض؟
- أيهم ion؟
- احسبوا e⁻ لكل حالة.

²⁴Mg و ²⁵Mg نظائر. ²⁴Mg²⁺ أيون لنفس الـ isotope تقريبًا (نفس Z ونفس A، إلكترونات أقل).`,
      studentMoves: [
        "يكمل مقارنة Mg على ثلاث أعمدة: p / n / e / charge",
        "يصيغ قاعدة الـ tip بجملته الخاصة",
      ],
      boardCue:
        "Δe⁻ → ion · Δn⁰ → isotope · Δp⁺ → new element · charge = p − e",
    },
    {
      id: "exam-set",
      minutes: 5,
      titleAr: "تدريب بأسلوب EST",
      goalAr: "يطبّق الطالب تحت ضغط وقت قصير كجلسة امتحان مصغّرة.",
      teacherScript: `خمس دقايق — وضع امتحان. اكتبوا الإجابات فقط، بعدين نراجع.

Q1. How many neutrons in ³⁹K? (Z of K = 19)
Q2. A neutral atom has 15 electrons and mass number 31. Identify Z, A, neutrons, and the element (phosphorus).
Q3. ¹⁶O²⁻ has how many electrons?
Q4. Which particles determine the identity of an element?
Q5. True/False: Isotopes of an element have the same mass number.

Answers — صحّحوا بهدوء:
1) 39 − 19 = 20 neutrons
2) Z=15, A=31, n=16, phosphorus
3) O has Z=8; O²⁻ means +2 electrons → 10 e⁻
4) Protons (atomic number)
5) False — same Z, different A

إذا غلطت بواحدة أو ثنتين: طبيعي. المهم تفهم ليش — مش تحفظ الناتج.`,
      studentMoves: [
        "يحل الخمس مسائل بصمت خلال ≈3 دقائق",
        "يصوّب بقلم ثاني ويكتب سبب كل خطأ",
      ],
      boardCue: "EST drill · 5 items · show only final counts then reason",
    },
  ],
};
