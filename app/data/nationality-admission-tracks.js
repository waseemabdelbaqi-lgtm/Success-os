/**
 * Nationality-aware admission tracks.
 *
 * Researched carefully from official sources (2026-07). Rules differ by:
 * - nationality / citizenship
 * - country of residence (esp. France Études en France)
 * - where the school certificate was earned (Germany HZB / anabin)
 * - immigration / fee status (UK Home vs Overseas; NL statutory vs institutional)
 *
 * This is guidance for routing — never a final admission decision.
 */

/** EU/EEA member states used for Germany/Netherlands/France nationality splits (Arabic labels in app). */
export const EU_EEA_NATIONALITIES_AR = Object.freeze([
  'ألمانيا',
  'فرنسا',
  'هولندا',
  'أيرلندا',
  'السويد',
  'النرويج', // EEA
  'آيسلندا', // EEA
  'ليختنشتاين', // EEA
  'سويسرا', // often treated with EU for FR/NL fee/application exceptions
  'بلجيكا',
  'النمسا',
  'إسبانيا',
  'إيطاليا',
  'بولندا',
  'البرتغال',
  'اليونان',
  'الدنمارك',
  'فنلندا',
  'التشيك',
  'المجر',
  'رومانيا',
  'بلغاريا',
  'كرواتيا',
  'سلوفاكيا',
  'سلوفينيا',
  'إستونيا',
  'لاتفيا',
  'ليتوانيا',
  'لوكسمبورغ',
  'مالطا',
  'قبرص',
]);

/**
 * Residence countries/territories in Campus France "Études en France" procedure (73).
 * Source: https://www.campusfrance.org/en/application-etudes-en-france-procedure
 * Matching uses Arabic country names where the app has them; English aliases for lookup.
 */
export const ETUDES_EN_FRANCE_RESIDENCE = Object.freeze({
  'الجزائر': 'Algeria',
  'السعودية': 'Saudi Arabia',
  'مصر': 'Egypt',
  'المغرب': 'Morocco',
  'تونس': true,
  'الأردن': 'Jordan',
  'الإمارات': 'United Arab Emirates',
  'قطر': 'Qatar',
  'الكويت': true,
  'لبنان': true,
  'تركيا': 'Turkey',
  'الولايات المتحدة': 'United States',
  'كندا': 'Canada',
  'المملكة المتحدة': 'United Kingdom',
  'الصين': 'China',
  'الهند': 'India',
  'اليابان': 'Japan',
  'كوريا الجنوبية': 'South Korea',
  'نيجيريا': 'Nigeria',
  'كينيا': 'Kenya',
  'جنوب أفريقيا': 'South Africa',
  // additional named in Campus France list (Arabic label may be absent in registry)
  Bahrain: true,
  Senegal: true,
  Vietnam: true,
  Brazil: true,
  Mexico: true,
  Russia: true,
});

function isEuEea(nationalityAr) {
  return EU_EEA_NATIONALITIES_AR.includes(nationalityAr);
}

function isSameCountry(nationalityAr, studyCountryAr) {
  return Boolean(nationalityAr && studyCountryAr && nationalityAr === studyCountryAr);
}

function residesInEefCountry(residenceOrNationalityAr) {
  return Boolean(ETUDES_EN_FRANCE_RESIDENCE[residenceOrNationalityAr]);
}

/**
 * Per-destination tracks. First matching track wins.
 * Each track: id, titleAr, whenAr, channelAr, docs[], feesAr, visaAr, caveats[], sources[], portals[]
 */
export const DESTINATION_TRACKS = Object.freeze({
  'ألمانيا': [
    {
      id: 'de-eu-eea-or-abitur-nc',
      titleAr: 'مواطن ألماني / اتحاد أوروبي / المنطقة الاقتصادية — برامج مقيدة (طب وصيدلة…)',
      match: ({ nationality }) => isEuEea(nationality) || nationality === 'ألمانيا',
      whenAr:
        'إذا كنت مواطناً ألمانياً أو من الاتحاد الأوروبي / المنطقة الاقتصادية الأوروبية (أو تحمل Abitur ألماني، أو تعيش في ألمانيا ولديك قريب مواطن EU/EEA) فإن طلبات الفصل الأول لطب/أسنان/بيطرة/صيدلة تمر عبر Hochschulstart وليس uni-assist.',
      channelAr: 'Hochschulstart.de (DoSV) للبرامج المقيدة وطنياً؛ وإلا تقديم مباشر للجامعة',
      docs: [
        'مؤهل دخول جامعي ألماني أو معادل معترف',
        'تسجيل Hochschulstart عند البرامج المقيدة NC',
        'إثبات لغة ألمانية أو إنجليزية حسب البرنامج',
      ],
      feesAr: 'معظم الجامعات الحكومية بدون رسوم دراسية عالية؛ رسوم فصل / مساهمة فصلية. بعض الولايات تفرض رسوماً على غير EU.',
      visaAr: 'مواطنو EU/EEA لا يحتاجون تأشيرة طالب وطنية كالطلاب من خارج الاتحاد.',
      caveats: [
        'المسار يعتمد أيضاً على بلد إصدار الشهادة (HZB) وليس الجنسية وحدها.',
        'تحقق دائماً من صفحة الجامعة: uni-assist قد يبقى مطلوباً لبعض البرامج/المتقدمين.',
      ],
      sources: [
        { label: 'uni-assist — Bachelor & Staatsexamen', url: 'https://www.uni-assist.de/en/how-to-apply/get-information/bachelor-staatsexamen' },
        { label: 'DAAD — Application process', url: 'https://www.daad.de/en/studying-in-germany/requirements/application-process/' },
        { label: 'Hochschulstart', url: 'https://www.hochschulstart.de/' },
      ],
      portals: ['hochschulstart', 'daad-study-in-germany', 'anabin'],
    },
    {
      id: 'de-non-eu-international',
      titleAr: 'طالب من خارج الاتحاد الأوروبي — تقييم دولي',
      match: ({ nationality }) => !isEuEea(nationality) && nationality !== 'ألمانيا',
      whenAr:
        'للمتقدمين من خارج EU/EEA تعتمد كثير من الجامعات على uni-assist لتقييم الشهادات (إجراء قياسي أو VPD). بلد إصدار الشهادة يحدد إن كان الدخول مباشراً أو عبر Studienkolleg (راجع anabin / أداة uni-assist).',
      channelAr: 'غالباً uni-assist (أو VPD ثم بوابة الجامعة) و/أو تقديم مباشر حسب البرنامج',
      docs: [
        'نسخ مصدّقة من شهادة الثانوية وكشف العلامات + ترجمة رسمية عند الحاجة',
        'جواز سفر',
        'شهادات لغة (TestDaF/DSH أو IELTS/TOEFL للبرامج الإنجليزية)',
        'رسوم تقييم uni-assist (حوالي 75€ للأول + 30€ لكل برنامج إضافي في نفس الفصل — تحقق من الموقع)',
      ],
      feesAr: 'رسوم دراسية منخفضة أو معدومة في كثير من الولايات الحكومية؛ استثناءات (مثل بعض الرسوم لغير EU). مساهمة فصلية دائماً تقريباً.',
      visaAr: 'تأشيرة وطنية للدراسة + إثبات تمويل (حساب محجوز غالباً) بعد القبول.',
      caveats: [
        'مواعيد التقديم قد تختلف حسب الجنسية وبلد الشهادة والبرنامج (شتاء عادة حتى 15 يوليو).',
        'الطب المقيد وطنياً: غير EU غالباً عبر مسار مختلف عن Hochschulstart EU — اتبع مخطط DAAD/الجامعة.',
      ],
      sources: [
        { label: 'uni-assist', url: 'https://www.uni-assist.de/en/' },
        { label: 'anabin', url: 'https://anabin.kmk.org/en/anabin.html' },
        { label: 'DAAD', url: 'https://www.daad.de/en/studying-in-germany/requirements/application-process/' },
      ],
      portals: ['uni-assist', 'anabin', 'daad-study-in-germany', 'hochschulstart'],
    },
  ],

  'فرنسا': [
    {
      id: 'fr-eu-nationality-parcoursup',
      titleAr: 'جنسية اتحاد أوروبي / سويسرا / أندورا / موناكو — Parcoursup',
      match: ({ nationality }) =>
        isEuEea(nationality) || ['سويسرا', 'أندورا', 'موناكو', 'فرنسا'].includes(nationality),
      whenAr:
        'إذا كنت تحمل جنسية دولة من الاتحاد الأوروبي أو النرويج/آيسلندا/ليختنشتاين/سويسرا/أندورا/موناكو، يكفي غالباً إدخال الرغبات على Parcoursup حتى لو كنت مقيماً في بلد خاضع لإجراء Études en France.',
      channelAr: 'Parcoursup (السنة الأولى Licence غالباً)',
      docs: ['شهادة ثانوية / بكالوريا', 'طلب Parcoursup', 'إثبات لغة فرنسية أو إنجليزية حسب البرنامج'],
      feesAr: 'رسوم جامعات حكومية منخفضة نسبياً للمقيمين/EU حسب الوضع.',
      visaAr: 'مواطنو EU/EEA لا يتبعون مسار تأشيرة الطالب الطويل كغير الأوروبيين.',
      caveats: ['تحقق من صفة إقامتك وبلد إقامتك؛ الجداول الزمنية لـ 2026/2027 على Campus France.'],
      sources: [
        { label: 'Campus France — Études en France', url: 'https://www.campusfrance.org/en/application-etudes-en-france-procedure' },
        { label: 'Parcoursup', url: 'https://www.parcoursup.gouv.fr/' },
      ],
      portals: ['parcoursup', 'campus-france'],
    },
    {
      id: 'fr-eef-residence-non-eu',
      titleAr: 'مقيم في بلد إجراء Études en France — غير أوروبي',
      match: ({ nationality, residenceCountry }) => {
        const place = residenceCountry || nationality;
        return residesInEefCountry(place) && !isEuEea(nationality) && nationality !== 'فرنسا';
      },
      whenAr:
        'إذا كنت مقيماً في أحد ~73 بلداً/إقليماً مشمولاً بإجراء Études en France (مثل الأردن، مصر، السعودية، المغرب، تركيا، الولايات المتحدة…) ولست من جنسية EU/EEA/سويسرا… فالإجراء إلزامي للتقديم حتى التأشيرة عبر منصة Études en France.',
      channelAr: 'منصة Études en France (+ Parcoursup أو DAP حسب الشهادة والسنة)',
      docs: [
        'ملف إلكتروني على Études en France',
        'إن كنت تحضّر بكالوريا فرنسية/أوروبية: رغبات Parcoursup + إكمال Études en France',
        'وإلا غالباً Demande d’Admission Préalable (DAP) عبر المنصة للسنة الأولى',
        'إثبات لغة + جواز + رسوم مرافقة Campus France',
      ],
      feesAr: 'رسوم جامعية + رسوم ملف Campus France/Études en France حسب بلد الإقامة.',
      visaAr: 'طلب التأشيرة يتكامل مع إجراء Études en France بعد القبول.',
      caveats: [
        'القائمة رسمية لدى Campus France وتتغير؛ راجع الصفحة قبل كل دورة.',
        'الدكتوراه خارج إجراء Études en France — تواصل مع مدارس الدكتوراه ثم تأشيرة talent passport.',
      ],
      sources: [
        { label: 'Campus France procedure', url: 'https://www.campusfrance.org/en/application-etudes-en-france-procedure' },
      ],
      portals: ['campus-france', 'parcoursup'],
    },
    {
      id: 'fr-other-international',
      titleAr: 'دولي خارج قائمة Études en France',
      match: () => true,
      whenAr: 'إن لم تكن مقيماً في بلد مشمول بالإجراء، قد تختلف القنوات (سفارة / تقديم مؤسسي). راجع Campus France لمسارك.',
      channelAr: 'تقديم مؤسسي / إجراءات السفارة حسب الحالة',
      docs: ['شهادة ثانوية معادلة', 'إثبات لغة', 'جواز وتمويل'],
      feesAr: 'حسب المؤسسة والوضع.',
      visaAr: 'تأشيرة طالب طويلة الإقامة عند الحاجة.',
      caveats: ['لا تعتمد على مسار عام — راجع صفحة Campus France وبلد إقامتك.'],
      sources: [{ label: 'Campus France', url: 'https://www.campusfrance.org/en' }],
      portals: ['campus-france'],
    },
  ],

  'هولندا': [
    {
      id: 'nl-eea-statutory',
      titleAr: 'جنسية هولندية / EU-EEA / سويسرا / سورينام — رسوم قانونية',
      match: ({ nationality }) =>
        isEuEea(nationality) || ['هولندا', 'سويسرا', 'سورينام'].includes(nationality),
      whenAr:
        'Studielink مطلوب للبكالوريوس في الجامعات الممولة حكومياً. من يستوفي شروط الجنسية/الإقامة لدى DUO يدفع الرسوم القانونية (statutory) الأقل — حوالي €2,694 لعام 2026–2027.',
      channelAr: 'Studielink (+ متطلبات الجامعة؛ numerus fixus لبعض البرامج)',
      docs: ['مؤهل ثانوي معادل', 'تسجيل Studielink', 'إثبات لغة إنجليزية/هولندية حسب البرنامج'],
      feesAr: 'رسوم قانونية حكومية إن انطبقت شروط DUO (جنسية + عدم تكرار نفس الدرجة غالباً).',
      visaAr: 'مواطنو EU/EEA لا يحتاجون تصريح إقامة طالب كغير الأوروبيين.',
      caveats: ['برامج numerus fixus: حد لعدد الطلبات/التخصصات سنوياً.', 'الماجستير قد يكون عبر Studielink أو بوابة الجامعة.'],
      sources: [
        { label: 'DUO tuition fees', url: 'https://www.duo.nl/particulier/tuition-fees.jsp' },
        { label: 'Studielink', url: 'https://www.studielink.nl/' },
      ],
      portals: ['studielink'],
    },
    {
      id: 'nl-non-eea-institutional',
      titleAr: 'من خارج EU/EEA — رسوم مؤسسية + إقامة',
      match: ({ nationality }) => !isEuEea(nationality) && nationality !== 'هولندا',
      whenAr:
        'غير الأوروبيين يدفعون عادة الرسوم المؤسسية الأعلى التي تحددها الجامعة، ويحتاجون غالباً إجراء تأشيرة/إقامة عبر الجامعة (MVV/TEV). التقديم للبكالوريوس ما زال يبدأ عبر Studielink في الجامعات العامة.',
      channelAr: 'Studielink ثم استكمال متطلبات الجامعة الدولية',
      docs: [
        'مؤهل ثانوي + تقييم إن طُلب',
        'IELTS/TOEFL حسب البرنامج',
        'جواز وتمويل كافٍ للإقامة',
        'تعاون مع الجامعة لتصريح الإقامة',
      ],
      feesAr: 'رسوم مؤسسية أعلى بكثير من الرسوم القانونية — تختلف حسب الجامعة والبرنامج.',
      visaAr: 'إقامة طالب؛ الجامعة غالباً ترعى الطلب لغير EU.',
      caveats: ['تحقق من أهلية الرسوم القانونية عبر تصاريح إقامة معينة لدى DUO.'],
      sources: [
        { label: 'DUO tuition fees', url: 'https://www.duo.nl/particulier/tuition-fees.jsp' },
        { label: 'Studielink', url: 'https://www.studielink.nl/' },
      ],
      portals: ['studielink'],
    },
  ],

  'المملكة المتحدة': [
    {
      id: 'uk-home-fee',
      titleAr: 'وضع رسوم Home (بريطاني / أيرلندي / settled…)',
      match: ({ nationality }) => ['المملكة المتحدة', 'أيرلندا'].includes(nationality),
      whenAr:
        'رسوم Home تعتمد على الجنسية والإقامة العادية لسنوات سابقة — ليست الجنسية وحدها دائماً. البريطانيون والأيرلنديون المقيمون عادةً Home؛ بعض EU بـ settled/pre-settled قد يؤهلون وفق قواعد ما بعد Brexit.',
      channelAr: 'UCAS للبكالوريوس (إلزامي تقريباً)',
      docs: ['A Levels أو معادل', 'طلب UCAS', 'Personal statement', 'مرجع'],
      feesAr: 'سقف رسوم Home في إنجلترا للبكالوريوس (يتغير سنوياً بالسياسة الحكومية).',
      visaAr: 'لا تأشيرة طالب إن كنت مقيماً بحق في المملكة المتحدة.',
      caveats: ['الجامعة تقيّم fee status من بيانات الطلب؛ راجع UKCISA عند الشك.'],
      sources: [
        { label: 'UCAS', url: 'https://www.ucas.com/' },
        { label: 'UK Parliament briefing — home fees', url: 'https://commonslibrary.parliament.uk/research-briefings/cbp-10708/' },
      ],
      portals: ['ucas', 'chevening-scholarships'],
    },
    {
      id: 'uk-overseas',
      titleAr: 'وضع Overseas / طالب دولي',
      match: () => true,
      whenAr:
        'معظم الجنسيات غير المؤهلة لـ Home تُصنَّف Overseas: رسوم أعلى تحددها الجامعة، ونفس قناة UCAS للبكالوريوس ثم CAS وتمويل وتأشيرة طالب.',
      channelAr: 'UCAS ثم CAS + Student visa',
      docs: [
        'مؤهل ثانوي معادل',
        'IELTS Academic أو بديل مقبول للجامعة/التأشيرة',
        'طلب UCAS (حتى 5 اختيارات غالباً)',
        'إثبات تمويل وCAS',
      ],
      feesAr: 'رسوم Overseas أعلى بكثير من Home — حسب البرنامج.',
      visaAr: 'Student visa بعد القبول غير المشروط وCAS.',
      caveats: ['مواعيد الطب/الأسنان أبكر؛ equal consideration عادة منتصف يناير.'],
      sources: [
        { label: 'UCAS', url: 'https://www.ucas.com/' },
        { label: 'Chevening (ماجستير)', url: 'https://www.chevening.org/' },
      ],
      portals: ['ucas', 'chevening-scholarships'],
    },
  ],

  'كندا': [
    {
      id: 'ca-domestic',
      titleAr: 'مواطن كندي / مقيم دائم — مسار محلي',
      match: ({ nationality }) => nationality === 'كندا',
      whenAr:
        'الكنديون والمقيمون الدائمون يتقدمون كـ domestic. في أونتاريو: OUAC للجامعات وOntario Colleges للكليات. خارج أونتاريو غالباً تقديم مباشر.',
      channelAr: 'OUAC / Ontario Colleges / تطبيق المقاطعة أو الجامعة',
      docs: ['شهادة ثانوية للمقاطعة', 'درجات المواد المطلوبة', 'إثبات الوضع في كندا عند الطلب'],
      feesAr: 'رسوم محلية أقل من الدولي.',
      visaAr: 'لا Study Permit كمواطن/مقيم دائم.',
      caveats: ['OUAC يميّز تلقائياً مجموعة المتقدم (طالب ثانوية أونتاريو الحالي مقابل غير ذلك).'],
      sources: [
        { label: 'OUAC guide', url: 'https://www.ouac.on.ca/guide/undergrad-guide/' },
        { label: 'Ontario Colleges', url: 'https://www.ontariocolleges.ca/en' },
      ],
      portals: ['ouac', 'ontario-colleges', 'educanada'],
    },
    {
      id: 'ca-international',
      titleAr: 'طالب دولي — Study Permit (+ PAL غالباً للبكالوريوس 2026)',
      match: () => true,
      whenAr:
        'غير المواطنين/المقيمين الدائمين: تقديم عبر OUAC أو الكلية/الجامعة كدولي، ثم Study Permit. اعتباراً من 2026 معظم طلاب البكالوريوس الدوليين في أونتاريو يحتاجون Provincial Attestation Letter (PAL) مع طلب التصريح؛ الماجستير/الدكتوراه في مؤسسات عامة معيّنة غالباً معفيون من PAL.',
      channelAr: 'OUAC أو Ontario Colleges أو الجامعة مباشرة → قبول → PAL عند اللزوم → Study Permit',
      docs: [
        'كشف علامات مترجم',
        'إثبات لغة',
        'جواز',
        'إثبات تمويل',
        'خطاب قبول + PAL إن انطبق',
      ],
      feesAr: 'رسوم دولية أعلى؛ قد تُضاف رسوم خدمة دولية صغيرة على OUAC لغير المواطنين/PR.',
      visaAr: 'Study Permit؛ تحقق من استثناءات PAL على IRCC/ontario.ca.',
      caveats: ['PAL يُطلب عادة بعد قبول العرض من المؤسسة ضمن حصتها.'],
      sources: [
        { label: 'Ontario — international students', url: 'https://www.ontario.ca/page/study-ontario-international-students' },
        { label: 'EduCanada', url: 'https://www.educanada.ca/' },
        { label: 'OUAC', url: 'https://www.ouac.on.ca/' },
      ],
      portals: ['ouac', 'ontario-colleges', 'educanada'],
    },
  ],

  'الولايات المتحدة': [
    {
      id: 'us-domestic',
      titleAr: 'مواطن / مقيم دائم أمريكي — Domestic',
      match: ({ nationality }) => nationality === 'الولايات المتحدة',
      whenAr: 'المتقدم المحلي/المقيم يتقدم كـ first-year domestic عبر Common App أو Coalition أو بوابات الولاية دون مسار I-20.',
      channelAr: 'Common App / Coalition / ApplyTexas / Cal State / UC / تطبيق الجامعة',
      docs: ['High School Diploma', 'GPA ومواد A–G أو ما يعادلها حسب الولاية', 'مقالات/توصيات حسب الجامعة'],
      feesAr: 'In-state vs out-of-state حسب الإقامة الضريبية للولاية — ليست الجنسية الاتحادية وحدها.',
      visaAr: 'لا F-1.',
      caveats: ['SAT/ACT اختيارية في كثير من الجامعات لكن ليست ملغاة في كلها.'],
      sources: [
        { label: 'Common App', url: 'https://www.commonapp.org/' },
        { label: 'BigFuture', url: 'https://bigfuture.collegeboard.org/' },
      ],
      portals: ['common-app', 'caas-coalition-for-college', 'applytexas', 'cal-state-apply'],
    },
    {
      id: 'us-international-f1',
      titleAr: 'طالب دولي — F-1 / I-20',
      match: () => true,
      whenAr:
        'غير المواطنين/المقيمين الدائمين: نفس بوابات التقديم غالباً لكن بمتطلبات دولية — إثبات إنجليزي، تمويل، ثم I-20 ورسوم SEVIS وتأشيرة F-1 بعد القبول.',
      channelAr: 'Common App أو الجامعة → I-20 → SEVIS → F-1',
      docs: [
        'شهادة ثانوية + ترجمة',
        'TOEFL/IELTS/Duolingo/PTE حسب الجامعة',
        'إثبات تمويل / Affidavit',
        'جواز',
      ],
      feesAr: 'رسوم دولية؛ لا in-state عادة.',
      visaAr: 'F-1 بعد I-20 ومقابلة القنصلية.',
      caveats: ['حدود اللغة والـ GPA تختلف جداً بين الكليات والبرامج (تمريض/هندسة أعلى).'],
      sources: [
        { label: 'Common App', url: 'https://www.commonapp.org/' },
        { label: 'Fulbright Foreign Student', url: 'https://foreign.fulbrightonline.org/' },
      ],
      portals: ['common-app', 'fulbright-foreign-student-program'],
    },
  ],

  'الأردن': [
    {
      id: 'jo-jordanian-unified',
      titleAr: 'أردني — قبول موحد / تنافسي محلي',
      match: ({ nationality }) => nationality === 'الأردن',
      whenAr:
        'الطلاب الأردنيون يتقدمون عادة عبر نظام القبول الموحد/المسارات المحلية حسب الفرع والمعدل. الأردني حامل جنسية أجنبية إضافية قد يقدّم للبرنامج الدولي بشروط حدود المعدلات للأردنيين وفق سياسة مجلس التعليم العالي.',
      channelAr: 'وحدة تنسيق القبول الموحد / الجامعة',
      docs: ['توجيهي أردني', 'طلب القبول الموحد', 'حدود المعدل للتخصص'],
      feesAr: 'البرنامج العادي أقل من الموازي/الدولي.',
      visaAr: 'غير مطلوب للأردني المقيم.',
      caveats: ['ازدواج الجنسية: راجع سياسة البرنامج الدولي الرسمية للسنة.'],
      sources: [
        { label: 'MOHE Jordan', url: 'https://mohe.gov.jo/' },
        { label: 'Study in Jordan policy PDF', url: 'https://studyinjordan.jo/Docs/PrinciplesEn.pdf' },
      ],
      portals: [],
    },
    {
      id: 'jo-non-jordanian-unified-intl',
      titleAr: 'غير أردني — نظام القبول الموحد للطلاب الدوليين',
      match: () => true,
      whenAr:
        'الطلاب غير الأردنيين (داخل المملكة أو خارجها) يُقبلون في الجامعات الحكومية فقط عبر نظام القبول الإلكتروني الموحد للطلاب الدوليين (Study in Jordan). الجامعات الخاصة: عبر النظام أو مباشرة دون وسطاء. رسوم تقديم موحدة معلنة (35 د.أ في إعلانات الوزارة).',
      channelAr: 'https://studyinjordan.jo/ — Unified Admission for international (non-Jordanian) students',
      docs: [
        'شهادة ثانوية للتحقق/المعادلة عبر وزارة التربية داخل النظام',
        'رفع الوثائق ودفع رسوم الطلب',
        'حتى 10 رغبات حسب الإعلان',
        'جواز وإثباتات أخرى حسب النموذج',
      ],
      feesAr: 'رسوم تقديم النظام + رسوم البرنامج الدولي/الموازي حسب الجامعة.',
      visaAr: 'إقامة طالب لغير المقيمين بعد القبول.',
      caveats: [
        'لا وسطاء — الوزارة تحذّر من الدفع لجهات غير رسمية.',
        'المواعيد تُعلن لكل فصل (مثال: دورة 2026–2027 عبر studyinjordan.jo).',
      ],
      sources: [
        { label: 'Study in Jordan announcement', url: 'https://studyinjordan.jo/Announcement1En.aspx' },
        { label: 'MOHE news — non-Jordanian unified admission', url: 'https://mohe.gov.jo/EN/NewsDetails/Opening_of_the_unified_admission_application_process_for_international_nonJordanian_students_wishing_to_study_at_Jordanian_universities_for_the_first_semester_of_the_academic_year_20252026' },
      ],
      portals: [],
    },
  ],

  'السعودية': [
    {
      id: 'sa-saudi-unified',
      titleAr: 'سعودي — القبول الموحد الوطني',
      match: ({ nationality }) => nationality === 'السعودية',
      whenAr:
        'الطلاب السعوديون للجامعات الحكومية والكليات التقنية عبر منصة القبول الموحد الوطنية (ثانوية + قدرات/تحصيلي حسب التخصص).',
      channelAr: 'منصة القبول الموحد / وزارة التعليم',
      docs: ['شهادة الثانوية', 'قدرات', 'تحصيلي', 'ترتيب الرغبات'],
      feesAr: 'مسارات حكومية مدعومة غالباً.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: ['شروط إضافية للمقابلات/التخصصات الصحية.'],
      sources: [
        { label: 'MOE Unified Admission', url: 'https://www.moe.gov.sa/en/knowledgecenter/eservices/pages/unified-admission.aspx' },
      ],
      portals: ['study-in-saudi-arabia'],
    },
    {
      id: 'sa-international-study-in-saudi',
      titleAr: 'غير سعودي — Study in Saudi (منح / ممول ذاتياً / تأشيرة تعليمية)',
      match: () => true,
      whenAr:
        'المنصة الرسمية Study in Saudi موجهة للطلاب والباحثين الدوليين: منح كاملة/جزئية أو برامج ممولة ذاتياً، مع جدول قبول موحد وتأشيرة تعليمية لغير الخليجيين من خارج المملكة حسب الدليل.',
      channelAr: 'https://studyinsaudi.sa/ — ثم مراجعة المؤسسة ووزارة التعليم',
      docs: ['ملف شخصي مكتمل على المنصة', 'شهادة ثانوية', 'جواز', 'إثبات لغة', 'مستندات المنحة/التأشيرة حسب النوع'],
      feesAr: 'حسب مسار المنحة أو التمويل الذاتي.',
      visaAr: 'تأشيرة تعليمية للقادمين من خارج المملكة (غير الخليجيين غالباً).',
      caveats: ['بعد الإرسال قد لا تُعدَّل كل بيانات الطلب؛ حدّث الملف قبل الإرسال.'],
      sources: [
        { label: 'Study in Saudi Arabia', url: 'https://studyinsaudi.sa/en' },
      ],
      portals: ['study-in-saudi-arabia'],
    },
  ],

  'تركيا': [
    {
      id: 'tr-turkish-yks',
      titleAr: 'تركي — YKS / ÖSYM',
      match: ({ nationality }) => nationality === 'تركيا',
      whenAr: 'الطلاب الأتراك يتقدمون عبر YKS واختيارات ÖSYM للجامعات التركية.',
      channelAr: 'YKS / ÖSYM',
      docs: ['Lise Diploması', 'نتيجة YKS', 'اختيارات التخصص'],
      feesAr: 'حسب نوع الجامعة (حكومية/وقف).',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: [],
      sources: [
        { label: 'YÖK', url: 'https://www.yok.gov.tr/' },
        { label: 'Study in Türkiye', url: 'https://www.studyinturkiye.gov.tr/' },
      ],
      portals: ['study-in-t-rkiye'],
    },
    {
      id: 'tr-international-yos',
      titleAr: 'طالب دولي — TR-YÖS / YÖS أو قبول الجامعة + منح Türkiye Scholarships',
      match: () => true,
      whenAr:
        'الطلاب الدوليون يُقبلون ضمن حصص يعلنها YÖK عبر امتحانات مثل TR-YÖS/YÖS أو معايير الجامعة (SAT/IB…). المنح الحكومية عبر Türkiye Scholarships (TBBS) منفصلة عن القبول الذاتي.',
      channelAr: 'Study in Türkiye / موقع الجامعة / turkiyeburslari.gov.tr للمنح',
      docs: ['شهادة ثانوية', 'TR-YÖS أو متطلبات الجامعة', 'TÖMER أو IELTS/TOEFL', 'جواز وتمويل'],
      feesAr: 'رسوم دولية أو تغطية منحة كاملة حسب البرنامج.',
      visaAr: 'تأشيرة/إقامة طالب بعد القبول.',
      caveats: ['بعض التخصصات الفنية تتطلب اختبار موهبة.'],
      sources: [
        { label: 'Study in Türkiye', url: 'https://www.studyinturkiye.gov.tr/' },
        { label: 'Türkiye Scholarships', url: 'https://www.turkiyeburslari.gov.tr/' },
      ],
      portals: ['study-in-t-rkiye', 't-rkiye-scholarships'],
    },
  ],

  'أستراليا': [
    {
      id: 'au-domestic',
      titleAr: 'مواطن / مقيم دائم أسترالي — بوابات الولايات',
      match: ({ nationality }) => nationality === 'أستراليا',
      whenAr: 'المحليون عبر UAC/VTAC/QTAC/SATAC/TISC حسب الولاية مع ATAR أو معادل.',
      channelAr: 'بوابة الولاية المركزية',
      docs: ['نتائج الثانوية / ATAR', 'طلب بوابة الولاية'],
      feesAr: 'رسوم محلية / دعم حكومي حسب الأهلية.',
      visaAr: 'غير مطلوب.',
      caveats: [],
      sources: [{ label: 'UAC', url: 'https://www.uac.edu.au/' }],
      portals: ['uac', 'vtac', 'qtac', 'satac', 'tisc'],
    },
    {
      id: 'au-international',
      titleAr: 'طالب دولي — تقديم مؤسسي + CRICOS',
      match: () => true,
      whenAr: 'الدوليون يتقدمون عادة مباشرة للجامعة؛ البرنامج يجب أن يكون مسجلاً في CRICOS للدراسة داخل أستراليا، مع إنجليزي وتمويل وتأشيرة طالب.',
      channelAr: 'بوابة الجامعة الدولية (+ وكيل إن وُجد)',
      docs: ['شهادة ثانوية', 'IELTS/PTE/TOEFL', 'تمويل', 'CoE للتأشيرة'],
      feesAr: 'رسوم دولية كاملة.',
      visaAr: 'Student visa بعد Confirmation of Enrolment.',
      caveats: ['تحقق من TEQSA National Register وCRICOS للبرنامج.'],
      sources: [{ label: 'TEQSA', url: 'https://www.teqsa.gov.au/national-register' }],
      portals: ['uac', 'applyboard'],
    },
  ],
});

/**
 * Resolve the best nationality-aware track for a study destination.
 */
export function resolveNationalityTrack({
  studyCountry,
  nationality,
  residenceCountry,
  qualificationCountry,
  applicantType,
} = {}) {
  if (!studyCountry) return null;

  // Same nationality as destination → strongly prefer local/domestic track
  const effectiveType =
    applicantType ||
    (isSameCountry(nationality, studyCountry) ? 'local' : 'international');

  const tracks = DESTINATION_TRACKS[studyCountry] || [];
  const ctx = {
    studyCountry,
    nationality,
    residenceCountry: residenceCountry || nationality,
    qualificationCountry: qualificationCountry || nationality,
    applicantType: effectiveType,
  };

  let track = tracks.find((t) => {
    try {
      return t.match(ctx);
    } catch {
      return false;
    }
  });

  if (!track && effectiveType === 'local' && isSameCountry(nationality, studyCountry)) {
    track = tracks[0];
  }

  if (!track && tracks.length) {
    track = tracks[tracks.length - 1];
  }

  if (!track) {
    return {
      id: 'generic',
      studyCountry,
      nationality,
      titleAr: effectiveType === 'local' ? 'مسار محلي عام' : 'مسار دولي عام',
      whenAr:
        'لم تُبنَ بعد قاعدة جنسية مفصّلة لهذه الدولة. استخدم ملف الدولة الرسمي وتحقق من صفحة البرنامج — الشروط تختلف بالجنسية والإقامة وبلد الشهادة.',
      channelAr: effectiveType === 'local' ? 'قناة القبول المحلي للدولة' : 'قناة القبول الدولي + تأشيرة',
      docs:
        effectiveType === 'local'
          ? ['شهادة ثانوية وطنية', 'طلب القبول']
          : ['جواز', 'شهادة وكشف علامات', 'إثبات لغة', 'تمويل وتأشيرة'],
      feesAr: 'حسب جنسيتك ووضعك القانوني في دولة الدراسة.',
      visaAr: effectiveType === 'local' ? 'غير مطلوب عادة للمواطن' : 'تأشيرة/تصريح دراسة غالباً',
      caveats: ['الجنسية ≠ بلد الشهادة ≠ بلد الإقامة — الثلاثة قد تغيّر المسار.'],
      sources: [],
      portals: [],
      applicantType: effectiveType,
      researchedAt: '2026-07-25',
    };
  }

  return {
    ...track,
    studyCountry,
    nationality,
    applicantType: effectiveType,
    match: undefined,
    researchedAt: '2026-07-25',
  };
}

export function nationalityTracksSummary() {
  const destinations = Object.keys(DESTINATION_TRACKS);
  return {
    destinations: destinations.length,
    tracks: destinations.reduce((n, d) => n + DESTINATION_TRACKS[d].length, 0),
    researchedAt: '2026-07-25',
    principleAr:
      'شروط القبول والرسوم والتأشيرة وقناة التقديم تختلف باختلاف جنسية الطالب وبلد إقامته وبلد إصدار شهادته — وليس بمجرد «محلي/دولي» فقط.',
    sources: [
      'https://www.uni-assist.de/en/how-to-apply/get-information/bachelor-staatsexamen',
      'https://www.daad.de/en/studying-in-germany/requirements/application-process/',
      'https://www.campusfrance.org/en/application-etudes-en-france-procedure',
      'https://www.duo.nl/particulier/tuition-fees.jsp',
      'https://www.ontario.ca/page/study-ontario-international-students',
      'https://studyinjordan.jo/Announcement1En.aspx',
      'https://studyinsaudi.sa/en',
      'https://www.studyinturkiye.gov.tr/',
      'https://commonslibrary.parliament.uk/research-briefings/cbp-10708/',
    ],
  };
}
