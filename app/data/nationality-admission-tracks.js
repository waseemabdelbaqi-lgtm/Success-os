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
  'البرازيل': 'Brazil',
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

  'الإمارات': [
    {
      id: 'ae-emirati-napo',
      titleAr: 'مواطن إماراتي / ابنة أم إماراتية (خريج الصف 12 لنفس السنة) — NAPO',
      match: ({ nationality }) => nationality === 'الإمارات',
      whenAr:
        'حسب سياسة جامعات اتحادية مثل خليفة: المواطنون الإماراتيون وأبناء الأمهات الإماراتيات المتخرجون من الصف 12 في سنة التقديم يتقدمون عبر بوابة NAPO التابعة لوزارة التعليم العالي والبحث العلمي — وليس عبر بوابة الجامعة المباشرة.',
      channelAr: 'NAPO (mohesr.gov.ae) ثم تحويل الملف للجامعة',
      docs: [
        'هوية إماراتية / خلاصة القيد',
        'جواز ورقم الموحّد',
        'شهادات الصفوف ومعادلة المدارس الخاصة إن لزم',
        'EmSAT أو بدائل لغة حسب الجامعة',
      ],
      feesAr: 'مسارات مواطنين غالباً مدعومة / منح مؤسسية حسب الأهلية.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: [
        'خريجو السنوات السابقة من المواطنين قد يُحوَّلون لتقديم مباشر عبر بوابة الجامعة (كما توضّح خليفة).',
        'تحقق من جامعة الهدف: ليست كل المؤسسات تستخدم NAPO بنفس الشكل.',
      ],
      sources: [
        { label: 'NAPO service card', url: 'https://www.mohesr.gov.ae/en/EServices/ServiceCard/pages/napo.aspx' },
        { label: 'Khalifa University UG admissions FAQ', url: 'https://www.ku.ac.ae/faqs/how-can-i-apply-to-khalifa-university-to-study-a-bachelors-degree' },
      ],
      portals: ['napo-uae'],
    },
    {
      id: 'ae-expat-international',
      titleAr: 'مقيم/وافد أو طالب دولي غير إماراتي — تقديم الجامعة',
      match: () => true,
      whenAr:
        'غير المواطنين (والمقيمون الأجانب والطلاب من خارج الدولة) يتقدمون عادة مباشرة عبر بوابة الجامعة الدولية، مع معادلة الشهادة وإثبات لغة (EmSAT English / IELTS / TOEFL) وتأشيرة إقامة طالب.',
      channelAr: 'بوابة القبول الدولية للجامعة (مثال: ugapply.ku.ac.ae لخليفة)',
      docs: [
        'جواز + إقامة سارية للمقيمين',
        'شهادة ثانوية + معادلة وزارة التربية إن طُلبت',
        'إثبات لغة',
        'صورة شخصية ومستندات إضافية حسب الجامعة',
      ],
      feesAr: 'رسوم دولية / مقيمين أعلى من مسارات المواطنين غالباً.',
      visaAr: 'تأشيرة/إقامة طالب لغير المقيمين؛ المقيم يحدّث وضع الإقامة.',
      caveats: ['المواعيد تختلف: مسار NAPO للمواطنين قد يفتح قبل مسار الوافدين.'],
      sources: [
        { label: 'Khalifa University UG admissions', url: 'https://www.ku.ac.ae/undergraduate-admissions' },
        { label: 'UAEU Admission', url: 'https://www.uaeu.ac.ae/en/admission/' },
      ],
      portals: ['napo-uae', 'applyboard'],
    },
  ],

  'مصر': [
    {
      id: 'eg-egyptian-coordination',
      titleAr: 'مصري — التنسيق الإلكتروني / الثانوية العامة',
      match: ({ nationality }) => nationality === 'مصر',
      whenAr:
        'المصريون الحاصلون على الثانوية العامة (أو شهادات معادلة ضمن قواعد التنسيق) يتقدمون عبر مكتب التنسيق/القواعد الوزارية للجامعات الحكومية — مسار منفصل تماماً عن الوافدين.',
      channelAr: 'التنسيق الإلكتروني لوزارة التعليم العالي',
      docs: ['شهادة الثانوية العامة', 'بطاقة التنسيق', 'رغبات الكليات', 'اختبارات القدرات إن لزم'],
      feesAr: 'رسوم حكومية للمصريين وفق النظام.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: ['قواعد التنسيق السنوية تصدر بقرار وزاري — راجع إعلان السنة.'],
      sources: [
        { label: 'SCU / وزارة التعليم العالي', url: 'https://scu.eg/' },
      ],
      portals: ['study-in-egypt'],
    },
    {
      id: 'eg-non-egyptian-study-in-egypt',
      titleAr: 'غير مصري (وافد) — منصة ادرس في مصر',
      match: () => true,
      whenAr:
        'يشترط أن يكون المتقدم غير مصري. التقديم عبر منصة Study in Egypt الرسمية، ثم ترشيح أولي، ثم تسليم أصول موثّقة للإدارة المركزية لشؤون الطلاب الوافدين في القاهرة. الاسم يجب أن يطابق جواز السفر.',
      channelAr: 'https://admission.study-in-egypt.gov.eg/',
      docs: [
        'حساب على منصة ادرس في مصر',
        'صورة شهادة الثانوية / المعادلة',
        'صورة جواز ساري',
        'صورة شخصية',
        'نتيجة قدرات إن طُلبت',
        'أصول موثّقة للإدارة المركزية بعد الترشيح',
      ],
      feesAr: 'رسوم خدمات تنسيق/تسجيل معلنة للمنصة + رسوم البرنامج الدولي.',
      visaAr: 'إقامة دراسية لغير المقيمين بعد القبول.',
      caveats: [
        'الجنسية شرط أهلية صريح: «يجب أن يكون الطالب غير مصري».',
        'لا تخلط بين تنسيق المصريين ومنصة الوافدين.',
      ],
      sources: [
        { label: 'Study in Egypt portal', url: 'https://admission.study-in-egypt.gov.eg/' },
        { label: 'Assiut University — expatriate rules', url: 'https://b.aun.edu.eg/student/undergraduate/rules' },
      ],
      portals: ['study-in-egypt'],
    },
  ],

  'أيرلندا': [
    {
      id: 'ie-eu-fee-cao',
      titleAr: 'وضع رسوم EU — تقديم عبر CAO',
      match: ({ nationality }) =>
        isEuEea(nationality) || ['أيرلندا', 'المملكة المتحدة'].includes(nationality),
      whenAr:
        'متقدمو البكالوريوس ذوو وضع رسوم EU يتقدمون عبر CAO. جواز/جنسية EU أو UK لا يكفي وحده: يجب استيفاء اختبار الجنسية أو الإقامة الضريبية (غالباً 3 من آخر 5 سنوات في EU/EEA/UK/سويسرا) أو قاعدة Quinn (5 سنوات تعليم أساسي/ثانوي في المنطقة).',
      channelAr: 'CAO (cao.ie)',
      docs: [
        'Leaving Certificate أو معادل EU/EFTA/UK',
        'طلب CAO',
        'مستندات إثبات الإقامة الضريبية عند تقييم الرسوم',
      ],
      feesAr: 'غالباً مساهمة طلابية (~€3000) ضمن Free Fees Initiative إن انطبقت — أقل بكثير من non-EU.',
      visaAr: 'مواطنو EU/EEA/UK ضمن قواعد الإقامة لا يحتاجون تأشيرة طالب كغير الأوروبيين.',
      caveats: [
        'قبول عرض non-EU قد يثبّت التصنيف طوال البرنامج (سياسة Trinity وغيرها).',
        'تحقق من جامعة الهدف قبل اختيار مسار CAO مقابل التقديم المباشر.',
      ],
      sources: [
        { label: 'CAO', url: 'https://www.cao.ie/' },
        { label: 'Trinity — EU fees eligibility', url: 'https://www.tcd.ie/academicregistry/fees-and-payments/eu-eligibility-fees/' },
        { label: 'CAO EU/EFTA/UK guidelines 2026', url: 'https://www2.cao.ie/downloads/documents/2026/Guidelines-EU-EFTA-UK-2026.pdf' },
      ],
      portals: ['cao-ireland'],
    },
    {
      id: 'ie-non-eu-direct',
      titleAr: 'وضع non-EU — تقديم مباشر للجامعة',
      match: () => true,
      whenAr:
        'غير المؤهلين لرسوم EU للبكالوريوس يتقدمون مباشرة لبوابة الجامعة الدولية (وليس CAO عادة)، برسوم أعلى وتأشيرة طالب وتمويل.',
      channelAr: 'بوابة الجامعة الدولية مباشرة',
      docs: ['شهادة ثانوية معادلة', 'IELTS/TOEFL', 'جواز وتمويل', 'طلب الجامعة'],
      feesAr: 'رسوم international أعلى بكثير من مسار EU.',
      visaAr: 'Irish study visa بعد القبول.',
      caveats: ['لا تغيّر وضع الرسوم بسهولة بعد قبولك كـ non-EU على نفس البرنامج.'],
      sources: [
        { label: 'Trinity — EU fees eligibility', url: 'https://www.tcd.ie/academicregistry/fees-and-payments/eu-eligibility-fees/' },
        { label: 'QQI / IRQ', url: 'https://irq.ie/' },
      ],
      portals: ['cao-ireland', 'applyboard'],
    },
  ],

  'الهند': [
    {
      id: 'in-indian-national-exams',
      titleAr: 'مواطن هندي — اختبارات وطنية (JEE / NEET / CUET…)',
      match: ({ nationality }) => nationality === 'الهند',
      whenAr:
        'المواطنون الهنود يدخلون التخصصات التنافسية عبر اختبارات وطنية: JEE للهندسة، NEET للطب، CUET لجامعات مركزية، وغيرها — حسب البرنامج.',
      channelAr: 'بوابات الاختبار الوطنية + counselling / الجامعة',
      docs: ['Class XII', 'تسجيل الاختبار الوطني', 'مستندات الفئة/الحصة إن انطبقت'],
      feesAr: 'رسوم محلية / حصص وطنية حسب المؤسسة.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: ['NRI حامل جواز هندي يعيش بالخارج قد يبقى على مسار مواطن مع حصص NRI في بعض الكليات.'],
      sources: [
        { label: 'UGC', url: 'https://www.ugc.gov.in/' },
        { label: 'Study in India', url: 'https://www.studyinindia.gov.in/' },
      ],
      portals: ['study-in-india-portal'],
    },
    {
      id: 'in-foreign-international-track',
      titleAr: 'أجنبي / مسار دولي — Study in India أو قبول مؤسسي (بدون نفس الاختبارات غالباً)',
      match: () => true,
      whenAr:
        'الأجانب غالباً على مسارات دولية منفصلة (Study in India / مكتب دولي) بمعايير سجل أكاديمي أو SAT، دون إلزام بنفس JEE/CUET في كثير من البرامج. NRI/OCI قد يجلسون لاختبارات وطنية أو حصص DASA/NRI حسب الحالة — تحقق من الفئة جوازك/OCI.',
      channelAr: 'studyinindia.gov.in و/أو القبول الدولي لكل جامعة / DASA لبعض المعاهد',
      docs: [
        'جواز أجنبي أو مستند OCI/NRI',
        'Class XII أو معادل + AIU عند الطلب',
        'إنجليزي (TOEFL/IELTS) إن طُلب',
        'SAT لبعض المسارات الدولية',
      ],
      feesAr: 'رسوم أجانب أعلى؛ خصومات SAARC في بعض مخططات DASA.',
      visaAr: 'Student Visa + تسجيل FRRO بعد الوصول لغير OCI.',
      caveats: [
        'OCI/NRI ≠ أجنبي بالكامل — الأهلية للامتحانات والحصص تختلف.',
        'الطب (NEET) له قواعد خاصة للفئات الأجنبية/NRI.',
      ],
      sources: [
        { label: 'Study in India', url: 'https://www.studyinindia.gov.in/' },
        { label: 'College Board — Study in India', url: 'https://international.collegeboard.org/students/study-in-india' },
      ],
      portals: ['study-in-india-portal'],
    },
  ],

  'قطر': [
    {
      id: 'qa-qatari',
      titleAr: 'قطري — هوية قطرية + مسار Foundation عند الحاجة',
      match: ({ nationality }) => nationality === 'قطر',
      whenAr:
        'القطريون يتقدمون بهوية قطرية سارية. حسب صفحة جامعة قطر: غير القطريين غالباً ملزمون بحد أدنى للإنجليزي/الرياضيات للكلية، بينما القطري الذي لا يستوفيها قد يلتحق ببرنامج Foundation. الذكور القطريون بمعدل أقل من 75% قد يُطلب منهم إثبات الخدمة الوطنية أو الإعفاء.',
      channelAr: 'بوابة قبول جامعة قطر / الجامعات القطرية',
      docs: [
        'هوية قطرية سارية',
        'شهادة ثانوية قطرية أو خاصة معتمدة',
        'شهادة صحية صادرة داخل قطر',
        'إثبات خدمة وطنية/إعفاء للذكور عند انطباق الشرط',
      ],
      feesAr: 'مسارات مواطنين/مقيمين وفق سياسات المؤسسة والمنح.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: ['أطفال أب قطري أو المتزوجات من قطري قد يرفعون مستندات إضافية عبر رابط إلكتروني خاص.'],
      sources: [
        {
          label: 'Qatar University — High School Applicants',
          url: 'https://www.qu.edu.qa/en-us/students/admission/undergraduate/admission-requirements/Pages/high-school-applicants.aspx',
        },
        {
          label: 'Qatar University — College Requirements',
          url: 'https://www.qu.edu.qa/en-us/students/admission/undergraduate/college-requirements',
        },
      ],
      portals: ['qatar-scholarships'],
    },
    {
      id: 'qa-gcc',
      titleAr: 'مواطن خليجي (غير قطري) — هوية قطرية مطلوبة دون تأشيرة رعاية الجامعة عادة',
      match: ({ nationality }) =>
        ['السعودية', 'الإمارات', 'الكويت', 'البحرين', 'عُمان', 'عمان'].includes(nationality),
      whenAr:
        'جامعة قطر تميّز مواطني مجلس التعاون: يجب الحصول على هوية قطرية عبر الجهات الرسمية، ولن يُنظر في الطلب دونها. بخلاف غير الخليجيين، لا يُشترط عادة طلب تأشيرة تحت رعاية الجامعة بنفس صيغة international sponsorship.',
      channelAr: 'بوابة QU + استخراج Qatar ID',
      docs: ['جواز خليجي', 'هوية قطرية (شرط للنظر في الطلب)', 'شهادة ثانوية معتمدة', 'صورة جواز لغير القطري'],
      feesAr: 'حسب سياسة الرسوم للمقيمين/الخليجيين في المؤسسة.',
      visaAr: 'إقامة/هوية قطرية عبر القنوات الرسمية للخليجي — ليست نفس حزمة تأشيرة الطالب لغير GCC.',
      caveats: ['استثناء GCC مذكور صراحة في تعليمات التأشيرة الدولية لـ QU.'],
      sources: [
        {
          label: 'Qatar University — High School Applicants',
          url: 'https://www.qu.edu.qa/en-us/students/admission/undergraduate/admission-requirements/Pages/high-school-applicants.aspx',
        },
        { label: 'Qatar Scholarships', url: 'https://www.qatarscholarships.qa/' },
      ],
      portals: ['qatar-scholarships'],
    },
    {
      id: 'qa-international-non-gcc',
      titleAr: 'دولي غير خليجي — تأشيرة برعاية الجامعة أو منحة + أصول الشهادة',
      match: () => true,
      whenAr:
        'غير القطريين من خارج GCC: رفع جواز (وليس فقط هوية)، وإرسال أصل كشف الثانوية إلى جامعة قطر ضمن نافذة الدوليين، مع طلب تأشيرة طالب تحت رعاية الجامعة إن كان على نفقته، أو مسار المنحة (تتولى الجامعة التأشيرة). بدون أصل الشهادة + (تأشيرة أو طلب منحة) لا يُنظر في الطلب.',
      channelAr: 'بوابة QU الدولية + تأشيرة/منحة + Qatar Scholarships عند الانطباق',
      docs: [
        'جواز ساري',
        'أصل كشف علامات الثانوية مصدّق يُرسل إلى الجامعة',
        'طلب تأشيرة طالب تحت رعاية QU أو اختيار طلب المنحة',
        'إثبات إنجليزي/رياضيات حسب الكلية (إلزامي غالباً لغير القطري)',
      ],
      feesAr: 'دراسة على النفقة أو منحة (Qatar Scholarships / منح QU).',
      visaAr: 'تأشيرة طالب برعاية الجامعة لغير الخليجيين على النفقة الخاصة.',
      caveats: ['غير القطري غالباً لا يُقبل في الكلية دون حد اللغة/الرياضيات — بخلاف مسار Foundation للمواطن.'],
      sources: [
        {
          label: 'Qatar University — High School Applicants',
          url: 'https://www.qu.edu.qa/en-us/students/admission/undergraduate/admission-requirements/Pages/high-school-applicants.aspx',
        },
        { label: 'Qatar Scholarships', url: 'https://www.qatarscholarships.qa/' },
      ],
      portals: ['qatar-scholarships'],
    },
  ],

  'الصين': [
    {
      id: 'cn-chinese-gaokao',
      titleAr: 'مواطن صيني — Gaokao ومسار القبول الوطني',
      match: ({ nationality }) => nationality === 'الصين',
      whenAr:
        'المواطنون الصينيون يدخلون الجامعات الصينية عبر الامتحان الوطني Gaokao ونظام التوزيع المركزي — مسار منفصل تماماً عن قبول الأجانب.',
      channelAr: 'Gaokao + آليات القبول الوطنية للمقاطعة/الجامعة',
      docs: ['تسجيل Gaokao', 'نتائج الثانوية والامتحان', 'اختيارات الجامعات حسب المقاطعة'],
      feesAr: 'رسوم محلية للصينيين.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: ['حاملو جواز أجنبي من أصول صينية قد يخضعون لقواعد إقامة (مثل 4-4-2) لتحديد إن كانوا «دوليين».'],
      sources: [
        { label: 'Ministry of Education China', url: 'http://en.moe.gov.cn/' },
      ],
      portals: ['caokao-hub-chinaschools'],
    },
    {
      id: 'cn-foreign-international',
      titleAr: 'أجنبي — قبول دولي / CSC (بدون Gaokao) + CSCA لبعض الجامعات 2026',
      match: () => true,
      whenAr:
        'الأجانب لا يؤدون Gaokao عادة. يتقدمون مباشرة للجامعة أو عبر منحة الحكومة الصينية CSC، بملف أكاديمي ولغة (HSK أو إنجليزي). اعتباراً من دورات 2026 تظهر متطلبات CSCA (اختبار أهلية) خاصة لمسارات منح CSC/بعض الجامعات — تحقق من دليل الجامعة للسنة.',
      channelAr: 'بوابة الجامعة الدولية و/أو campuschina.org (CSC)',
      docs: [
        'جواز أجنبي',
        'شهادة ثانوية وكشوف',
        'HSK أو IELTS/TOEFL حسب لغة البرنامج',
        'خطة دراسية / توصيات حسب الدرجة',
        'تقرير CSCA إن طلبته الجامعة/المنحة لعام 2026+',
      ],
      feesAr: 'ممولة عبر CSC أو رسوم دولية ذاتية.',
      visaAr: 'تأشيرة دراسة X بعد خطاب القبول واستمارة JW.',
      caveats: ['لا يوجد UCAS صيني موحّد للأجانب — كل جامعة/منحة قناة مستقلة.'],
      sources: [
        { label: 'Campus China / CSC info hubs', url: 'https://www.campuschina.org/' },
        { label: 'CUCAS — CSCA 2026 guide', url: 'https://news.cucas.cn/admission_express/CSCA_Complete_Guide:_China_Scholastic_Competency_Assessment_for_Bachelor_Degree_Study_in_China/7474' },
      ],
      portals: ['caokao-hub-chinaschools', 'applyboard'],
    },
  ],

  'المغرب': [
    {
      id: 'ma-moroccan-bac',
      titleAr: 'مغربي — بكالوريا + توجيه (وصول مفتوح / وصول منظّم)',
      match: ({ nationality }) => nationality === 'المغرب',
      whenAr:
        'المغاربة الحاصلون على البكالوريا يلتحقون بالتعليم العالي العمومي: مؤسسات وصول مفتوح تقبل غالباً كل حاصل على بكالوريا، ومؤسسات وصول منظّم (طب، هندسة، ENCG…) بمباراة/انتقاء.',
      channelAr: 'التسجيل/التوجيه الجامعي الوطني + مباريات الوصول المنظّم',
      docs: ['بكالوريا مغربية', 'ملف التوجيه', 'مباراة/ملف للوصول المنظّم'],
      feesAr: 'التعليم العمومي مجاني تقريباً للمغاربة في كثير من المسارات.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: ['المؤسسات الخاصة لها شروط مستقلة.'],
      sources: [
        { label: 'وزارة التعليم العالي المغربية', url: 'https://www.enssup.gov.ma/' },
      ],
      portals: [],
    },
    {
      id: 'ma-foreign-amci',
      titleAr: 'أجنبي — قناة دبلوماسية AMCI / ترخيص الوزارة',
      match: () => true,
      whenAr:
        'الطلاب الأجانب للجامعات العمومية المغربية يقدّمون عادة عبر القناة الدبلوماسية ووكالة التعاون الدولي المغربية AMCI؛ الملف الذي لا يمر عبر AMCI قد لا يُعتمد. الأجانب المقيمون الحاصلون على شهادات مغربية يُعاملون غالباً كالمحليين مباشرة في المؤسسة (دون منح AMCI).',
      channelAr: 'AMCI + ترخيص تسجيل من الوزارة ثم المؤسسة',
      docs: [
        'ملف عبر السفارة/AMCI',
        'بكالوريا أو معادل للسنة الجارية',
        'ترخيص تسجيل وزاري',
        'جواز وتمويل/منحة حسب العرض',
      ],
      feesAr: 'منح تعاون أو رسوم وفق العرض؛ المقيم بشهادة مغربية كالمحلي.',
      visaAr: 'تأشيرة/إقامة طالب بعد الترخيص.',
      caveats: ['التونسيون/الجزائريون المقيمون قد تُعالج ملفاتهم كالمغربيين وفق مذكرات وزارية قديمة — تحقق من الوضع الحالي.'],
      sources: [
        { label: 'AMCI', url: 'https://www.amci.ma/' },
        { label: 'وزارة التعليم العالي المغربية', url: 'https://www.enssup.gov.ma/' },
      ],
      portals: ['amci-morocco'],
    },
  ],

  'سويسرا': [
    {
      id: 'ch-swiss-maturite',
      titleAr: 'حامل maturité سويسرية — قبول جامعي قياسي',
      match: ({ nationality, qualificationCountry }) =>
        nationality === 'سويسرا' || qualificationCountry === 'سويسرا',
      whenAr:
        'الجامعات السويسرية تشترط عادة maturité gymnasiale أو مؤهلاً سويسرياً معادلاً للمرحلة الأولى. المواطن/حامل الشهادة السويسرية يسلك هذا المسار المباشر.',
      channelAr: 'تقديم مباشر للجامعة / swissuniversities',
      docs: ['Maturité / شهادة ثانوية سويسرية', 'طلب الجامعة', 'لغة البرنامج (ألمانية/فرنسية/إيطالية/إنجليزية)'],
      feesAr: 'رسوم كنتونية منخفضة نسبياً للمؤهلين المحليين.',
      visaAr: 'غير مطلوب للمواطن السويسري.',
      caveats: ['الطب له إجراءات NC منفصلة عبر swissuniversities.'],
      sources: [
        { label: 'swissuniversities — Admission', url: 'https://www.swissuniversities.ch/en/topics/studying/admission-to-universities' },
      ],
      portals: [],
    },
    {
      id: 'ch-foreign-credentials',
      titleAr: 'شهادة أجنبية — متطلبات حسب بلد الشهادة (+ ECUS أحياناً)',
      match: () => true,
      whenAr:
        'حاملو الشهادات الأجنبية يُقيَّمون وفق جداول «متطلبات القبول حسب الدولة» لدى swissuniversities. قد تُطلب امتحانات تكميلية (ECUS) أو سنة تحضيرية. الجنسية والإقامة تؤثران على الرسوم والتأشيرة/تصريح الإقامة.',
      channelAr: 'تقديم الجامعة + فحص مؤهل أجنبي / ECUS عند اللزوم',
      docs: [
        'شهادة ثانوية أجنبية + ترجمة',
        'مراجعة متطلبات بلد الشهادة على swissuniversities',
        'إثبات لغة',
        'تمويل وإثبات إقامة/تأشيرة لغير المقيمين',
      ],
      feesAr: 'قد تُفرض رسوم أعلى على الطلاب الأجانب حسب الكانتون/الجامعة.',
      visaAr: 'تصريح إقامة دراسية لغير السويسريين/غير المقيمين.',
      caveats: ['بلد إصدار الشهادة قد يكون أهم من الجنسية لقبول المؤهل.'],
      sources: [
        { label: 'swissuniversities — Admission', url: 'https://www.swissuniversities.ch/en/topics/studying/admission-to-universities' },
        { label: 'Swiss ENIC', url: 'https://www.swissuniversities.ch/en/service/swiss-enic' },
      ],
      portals: [],
    },
  ],

  'كوريا الجنوبية': [
    {
      id: 'kr-korean-domestic',
      titleAr: 'كوري — قبول محلي (CSAT / سجلات مدرسية)',
      match: ({ nationality }) => nationality === 'كوريا الجنوبية',
      whenAr:
        'المواطنون الكوريون يتقدمون عبر مسارات القبول المحلية للجامعات الكورية (امتحان CSAT/수능 و/أو قبول مبكر بالسجلات) — وليس عبر مسار الطالب الدولي D-2.',
      channelAr: 'بوابة القبول المحلية للجامعة / النظام الوطني',
      docs: ['شهادة ثانوية كورية', 'نتائج CSAT أو ملف السوسّي حسب المسار', 'طلب الجامعة'],
      feesAr: 'رسوم محلية للكوريين.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: [],
      sources: [
        { label: 'Study in Korea (gov)', url: 'https://www.studyinkorea.go.kr/' },
      ],
      portals: [],
    },
    {
      id: 'kr-international-d2',
      titleAr: 'أجنبي — قبول دولي + خطاب قبول قياسي + تأشيرة D-2',
      match: () => true,
      whenAr:
        'الأجانب يتقدمون عبر مكاتب القبول الدولي (Study in Korea / بوابة الجامعة). بعد القبول يصدر Standard Admission Letter ثم تأشيرة طالب D-2 للدرجات النظامية (D-4 للتدريب غير الدراسي). TOPIK غالباً مطلوب للبرامج الكورية؛ البرامج الإنجليزية تطلب IELTS/TOEFL.',
      channelAr: 'studyinkorea.go.kr / بوابة الجامعة الدولية → D-2',
      docs: [
        'جواز أجنبي',
        'شهادة وكشف علامات + تصديق',
        'TOPIK أو IELTS/TOEFL حسب لغة البرنامج',
        'إثبات تمويل',
        'خطاب قبول قياسي للتأشيرة',
      ],
      feesAr: 'رسوم دولية؛ منح GKS حكومية متاحة تنافسياً.',
      visaAr: 'D-2 للدرجة؛ تُطلب عبر السفارة بعد خطاب القبول.',
      caveats: ['بدون جنسية كورية/إقامة مناسبة لا يُستخدم مسار القبول المحلي.'],
      sources: [
        { label: 'Study in Korea — visa & stay', url: 'https://www.studyinkorea.go.kr/ko/plan/visaAndStay.do' },
        { label: 'GOV.KR — foreigners university', url: 'https://www.gov.kr/portal/foreigner/en/m040101' },
      ],
      portals: ['study-in-korea'],
    },
  ],

  'اليابان': [
    {
      id: 'jp-japanese-national',
      titleAr: 'ياباني — امتحانات القبول المحلية',
      match: ({ nationality }) => nationality === 'اليابان',
      whenAr:
        'المواطنون اليابانيون (ومن يحملون الجنسية اليابانية ضمن ازدواج) يتبعون نظام القبول المحلي للجامعات — وليس مسار «International Student» المعتمد على EJU.',
      channelAr: 'امتحانات القبول الجامعية اليابانية / تقديم الجامعة',
      docs: ['شهادة ثانوية يابانية', 'امتحانات القبول حسب الجامعة', 'طلب الالتحاق'],
      feesAr: 'رسوم محلية.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: ['ازدواج يشمل جنسية يابانية غالباً يخرجك من فئة international student في كثير من الجامعات.'],
      sources: [
        { label: 'Study in Japan', url: 'https://www.studyinjapan.go.jp/' },
        { label: 'MEXT', url: 'https://www.mext.go.jp/en/' },
      ],
      portals: ['study-in-japan-portal'],
    },
    {
      id: 'jp-foreign-eju',
      titleAr: 'أجنبي (بدون جنسية يابانية) — EJU / قبول دولي + إقامة Student',
      match: () => true,
      whenAr:
        'كثير من الجامعات تشترط صراحة «جنسية أجنبية» وأهلية للحصول على إقامة Student، وتستخدم EJU (امتحان قبول الأجانب). بعض الجامعات تستثني المقيم الدائم/الخاص من مسار international. تحقق من دليل كل جامعة.',
      channelAr: 'EJU + تقديم الجامعة الدولي / Study in Japan',
      docs: [
        'جواز يثبت جنسية أجنبية',
        '12 سنة دراسية أو معادل',
        'نتائج EJU و/أو JLPT حسب الجامعة',
        'إثبات تمويل وقدرة الحصول على إقامة Student',
      ],
      feesAr: 'رسوم دولية؛ منح MEXT متاحة.',
      visaAr: 'إقامة Student بعد القبول.',
      caveats: ['EJU مصمم لغير اليابانيين — المواطن الياباني لا يسلكه عادة.'],
      sources: [
        { label: 'Study in Japan', url: 'https://www.studyinjapan.go.jp/' },
        { label: 'JASSO / EJU info hubs', url: 'https://www.jasso.go.jp/' },
      ],
      portals: ['study-in-japan-portal'],
    },
  ],

  'الجزائر': [
    {
      id: 'dz-algerian-bac',
      titleAr: 'جزائري ببكالوريا جزائرية — توجيه وطني',
      match: ({ nationality }) => nationality === 'الجزائر',
      whenAr:
        'الحاصلون على البكالوريا الجزائرية يتقدمون عبر منصة التوجيه/التسجيل المسبق الوطنية حسب المنشور الوزاري السنوي. الجزائري حامل بكالوريا أجنبية له مسار معادلات منفصل على منصات MESRS قبل التوجيه.',
      channelAr: 'توجيه MESRS الإلكتروني (progres) للمنشور السنوي',
      docs: ['بكالوريا جزائرية', 'تسجيل مسبق وبطاقة رغبات', 'شروط المعدلات حسب الشعبة'],
      feesAr: 'مسارات عمومية وفق النظام الوطني.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: [
        'جزائري + بكالوريا أجنبية: اطلب المعادلة أولاً عبر mesrs.dz ثم منصة bac-etrangers — ليس نفس مسار الأجانب الدبلوماسي بالكامل.',
      ],
      sources: [
        { label: 'MESRS', url: 'https://www.mesrs.dz/' },
        { label: 'Plateforme bac étrangers (MESRS)', url: 'https://progres.mesrs.dz/bac-etrangers/pages/procedure/procedures.xhtml' },
      ],
      portals: [],
    },
    {
      id: 'dz-foreign-study-in-algeria',
      titleAr: 'أجنبي — اعتماد/معادلة + حصص التعاون أو Study in Algeria',
      match: () => true,
      whenAr:
        'الطلاب الأجانب يخضعون لمرسوم/إجراءات قبول الأجانب (مقاعد سنوية ورسوم). يلزم غالباً معادلة الشهادة وموافقة وزارية/مؤسسية؛ المسار ليس التوجيه الوطني للمواطنين. راجع studyinalgeria.dz والحصص الثنائية.',
      channelAr: 'studyinalgeria.dz / القناة الدبلوماسية + معادلة MESRS',
      docs: [
        'شهادة جنسية + جواز',
        'بكالوريا وكشف علامات للتصديق/المعادلة',
        'ملف قبول حسب الدورة (ليسانس/ماستر/دكتوراه)',
        'شهادة طبية ومستندات الإقامة',
      ],
      feesAr: 'رسوم دراسية للأجانب وفق المرسوم والمؤسسة.',
      visaAr: 'تأشيرة/إقامة دراسية بعد القبول.',
      caveats: ['الأجنبي حامل بكالوريا أجنبية ≠ توجيه المواطنين — مسار إداري مختلف.'],
      sources: [
        { label: 'Study in Algeria', url: 'https://studyinalgeria.dz/pages/17155' },
        { label: 'MESRS équivalences', url: 'https://www.mesrs.dz/les-equivalences' },
      ],
      portals: ['study-in-algeria'],
    },
  ],

  'جنوب أفريقيا': [
    {
      id: 'za-south-african-nsc',
      titleAr: 'جنوب أفريقي — NSC + APS (+ سياسات redress للمواطنين)',
      match: ({ nationality }) => nationality === 'جنوب أفريقيا',
      whenAr:
        'المواطنون بـ National Senior Certificate يُقيَّمون بـ APS ومتطلبات المواد. سياسات التمييز الإيجابي/السياق (مثل UCT redress) تُطبَّق أساساً على المتقدمين الجنوب أفريقيين وليس الدوليين.',
      channelAr: 'تقديم الجامعة + NSC/IEB',
      docs: ['NSC أو معادل محلي', 'حساب APS', 'NBT إن طلبتها الجامعة/التخصص'],
      feesAr: 'رسوم محلية؛ بدون international levy عادة.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: ['المقيم الدائم قد يُعامل ضمن فئات خاصة — تحقق من الجامعة.'],
      sources: [
        { label: 'Wits entry requirements', url: 'https://www.wits.ac.za/undergraduate/entry-requirements/' },
        { label: 'UCT NSC admissions guidelines', url: 'https://uct.ac.za/sites/default/files/media/documents/2025_National-Senior-Certificate-NSC_Guidelines-for-Admissions.pdf' },
      ],
      portals: [],
    },
    {
      id: 'za-international-exemption-visa',
      titleAr: 'أجنبي / غير مواطن — إعفاء USAf + تأشيرة دراسة + تأمين طبي محلي',
      match: () => true,
      whenAr:
        'غير الحاصلين على NSC جنوب أفريقي يحتاجون غالباً شهادة إعفاء/معادلة من Universities South Africa (USAf). للتسجيل يلزم تأشيرة دراسة مصدّقة للمؤسسة + تأمين طبي مسجّل في جنوب أفريقيا. كثير من الجامعات تفرض international levy حتى على مواطني SADC.',
      channelAr: 'تقديم الجامعة الدولي → mb.usaf.ac.za للإعفاء → تأشيرة دراسة',
      docs: [
        'جواز غير جنوب أفريقي',
        'شهادة ثانوية أجنبية + طلب إعفاء USAf',
        'عرض قبول',
        'تأشيرة دراسة + تأمين طبي SA + إثبات تمويل',
      ],
      feesAr: 'رسوم + international levy شائع لغير المواطنين.',
      visaAr: 'Study visa عبر السفارة/VFS قبل الدخول غالباً.',
      caveats: ['سياسات redress السياقية للمواطنين لا تُنقل تلقائياً للدولي.'],
      sources: [
        { label: 'USAf Matriculation Board', url: 'https://mb.usaf.ac.za/' },
        { label: 'DHET', url: 'https://www.dhet.gov.za/' },
      ],
      portals: [],
    },
  ],

  'ماليزيا': [
    {
      id: 'my-malaysian-upu',
      titleAr: 'ماليزي — UPU / مسارات محلية',
      match: ({ nationality }) => nationality === 'ماليزيا',
      whenAr: 'المواطنون الماليزيون يلتحقون غالباً عبر UPU أو مسارات محلية (STPM/Matrikulasi/أساس) للجامعات الحكومية.',
      channelAr: 'UPU / تطبيق الجامعة المحلية',
      docs: ['شهادة ثانوية ماليزية أو مسار أساس', 'طلب UPU', 'متطلبات التخصص'],
      feesAr: 'رسوم مواطنين أقل من الدولي.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: [],
      sources: [
        { label: 'MQA / MQR', url: 'https://www2.mqa.gov.my/mqr/' },
      ],
      portals: [],
    },
    {
      id: 'my-international-student-pass',
      titleAr: 'أجنبي — قبول دولي + Student Pass',
      match: () => true,
      whenAr: 'الأجانب يتقدمون مباشرة للجامعة الدولية ويحتاجون Student Pass عبر المؤسسة بعد القبول، مع تحقق البرنامج في MQR.',
      channelAr: 'بوابة الجامعة الدولية + Student Pass',
      docs: ['جواز', 'شهادة ثانوية', 'إنجليزي', 'تمويل', 'Student Pass'],
      feesAr: 'رسوم دولية أعلى.',
      visaAr: 'Student Pass برعاية الجامعة.',
      caveats: ['تحقق من اعتماد البرنامج في Malaysian Qualifications Register.'],
      sources: [
        { label: 'MQA / MQR', url: 'https://www2.mqa.gov.my/mqr/' },
      ],
      portals: ['applyboard'],
    },
  ],

  'سنغافورة': [
    {
      id: 'sg-singaporean-local',
      titleAr: 'سنغافوري / مقيم دائم — قبول محلي',
      match: ({ nationality }) => nationality === 'سنغافورة',
      whenAr: 'المواطنون والمقيمون الدائمون يتقدمون بمسارات محلية (A Levels/IB/Poly) لجامعات مثل NUS/NTU برسوم محلية مدعومة.',
      channelAr: 'بوابة الجامعة للمسار المحلي',
      docs: ['A Levels أو IB أو Poly', 'طلب الجامعة'],
      feesAr: 'رسوم مواطنين/PR أقل بكثير من الدولي.',
      visaAr: 'غير مطلوب للمواطن/PR.',
      caveats: [],
      sources: [
        { label: 'MOE Singapore post-secondary', url: 'https://www.moe.gov.sg/post-secondary/overview' },
        { label: 'NUS Admissions', url: 'https://nus.edu.sg/oam/admissions' },
      ],
      portals: [],
    },
    {
      id: 'sg-international',
      titleAr: 'أجنبي — قبول دولي + Student’s Pass',
      match: () => true,
      whenAr: 'الأجانب على حصص دولية تنافسية جداً، برسوم أعلى وStudent’s Pass بعد القبول.',
      channelAr: 'بوابة الجامعة الدولية + ICA Student’s Pass',
      docs: ['شهادة ثانوية قوية', 'IELTS/TOEFL إن لزم', 'جواز وتمويل', 'Student’s Pass'],
      feesAr: 'رسوم دولية مرتفعة.',
      visaAr: 'Student’s Pass.',
      caveats: ['المنافسة على المقاعد الدولية عالية جداً.'],
      sources: [
        { label: 'NUS Admissions', url: 'https://nus.edu.sg/oam/admissions' },
        { label: 'MOE Singapore', url: 'https://www.moe.gov.sg/post-secondary/overview' },
      ],
      portals: [],
    },
  ],

  'نيجيريا': [
    {
      id: 'ng-nigerian-jamb-local',
      titleAr: 'نيجيري — WAEC/NECO + JAMB UTME محلي + CAPS',
      match: ({ nationality }) => nationality === 'نيجيريا',
      whenAr:
        'المواطنون النيجيريون داخل البلاد يسجّلون عادة عبر مراكز CBT المحلية لـ UTME/DE بعد إنشاء ملف في JAMB e-Facility، ثم يتابعون العروض عبر CAPS وقد يلزم Post-UTME/فحص الجامعة.',
      channelAr: 'JAMB e-Facility (مراكز محلية) → CAPS → Post-UTME/الجامعة',
      docs: ['WAEC أو NECO (أو معادل مقبول)', 'تسجيل UTME/DE عبر JAMB', 'متابعة CAPS', 'Post-UTME إن طلبته الجامعة'],
      feesAr: 'رسوم تسجيل وقبول محلية بالنيرة وفق جداول JAMB/الجامعة.',
      visaAr: 'غير مطلوب للمواطن النيجيري المقيم.',
      caveats: [
        'القبول النهائي عبر CAPS — عروض خارج النظام قد لا تعترف بها JAMB.',
        'تحقق من اعتماد الجامعة لدى NUC قبل الدفع.',
      ],
      sources: [
        { label: 'JAMB e-Facility', url: 'https://efacility.jamb.gov.ng/' },
        { label: 'NUC', url: 'https://www.nuc.edu.ng/' },
      ],
      portals: ['jamb-e-facility'],
    },
    {
      id: 'ng-foreign-jamb-centres',
      titleAr: 'أجنبي / من الخارج — JAMB Foreign UTME/DE أو قبول دولي للجامعة',
      match: () => true,
      whenAr:
        'المرشحون من المراكز الأجنبية (أجانب ونيجيريون في الخارج) يسجّلون عبر مسار Foreign UTME/DE في e-Facility ويدفعون رسماً بالدولار في مراكز محددة (سفارات/قنصليات). بعض الجامعات تشغّل أيضاً مكتباً دولياً مباشراً — لكن الالتحاق النظامي لكثير من البرامج يمر عبر JAMB/CAPS.',
      channelAr: 'JAMB Foreign centres عبر e-Facility أو مكتب القبول الدولي للجامعة + CAPS عند الانطباق',
      docs: [
        'جواز غير نيجيري (أو نيجيري في الخارج)',
        'شهادة ثانوية معادلة',
        'تسجيل Foreign UTME/DE إن لزم',
        'تمويل + تأشيرة دراسة عند الحاجة',
      ],
      feesAr: 'رسوم تسجيل أجنبية (غالباً بالدولار) + رسوم جامعية قد تختلف عن المحلي.',
      visaAr: 'تأشيرة/تصريح دراسة لغير المقيمين قبل أو عند الالتحاق.',
      caveats: [
        'مراكز الامتحان الأجنبية محدودة جغرافياً وتتغير سنوياً — راجع إعلان JAMB للسنة.',
        'لا تخلط مسار CBT المحلي مع Foreign registration.',
      ],
      sources: [
        { label: 'JAMB e-Facility', url: 'https://efacility.jamb.gov.ng/' },
        { label: 'NUC', url: 'https://www.nuc.edu.ng/' },
      ],
      portals: ['jamb-e-facility'],
    },
  ],

  'كينيا': [
    {
      id: 'ke-kenyan-kuccps',
      titleAr: 'كيني — KUCCPS (مواطنة + KCSE)',
      match: ({ nationality }) => nationality === 'كينيا',
      whenAr:
        'التوزيع عبر KUCCPS للجامعات والكليات يشترط عموماً أن يكون المتقدم مواطناً كينياً وأن يكون قد أدى KCSE ويستوفي الحد الأدنى للبرنامج. المواطنون يستفيدون أيضاً من مسارات التمويل/الرعاية الحكومية المرتبطة بالتوزيع.',
      channelAr: 'بوابة طلاب KUCCPS (students.kuccps.net)',
      docs: ['جنسية كينية', 'نتائج KCSE', 'طلب توزيع KUCCPS', 'متطلبات البرنامج'],
      feesAr: 'رسوم مواطنين / رعاية حكومية عند الانطباق — أقل عادة من المسار الدولي الخاص.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: [
        'ازدواج الجنسية: إن كنت كينياً قدّم كمواطن عبر KUCCPS عند الأهلية.',
        'الشهادات الأجنبية للكينيين تحتاج غالباً معادلة KNEC/KNQA قبل المعالجة.',
      ],
      sources: [
        { label: 'KUCCPS placement eligibility', url: 'https://kuccps.net/Placem' },
        { label: 'KUCCPS FAQ', url: 'https://www.kuccps.net/node/139' },
        { label: 'CUE', url: 'https://www.cue.or.ke/' },
      ],
      portals: ['kuccps'],
    },
    {
      id: 'ke-non-citizen-direct',
      titleAr: 'غير كيني — تقديم مباشر للجامعة + معادلة + Student Pass',
      match: () => true,
      whenAr:
        'غير المواطنين غير مؤهلين عموماً لتوزيع الدرجة الجامعية عبر KUCCPS (استثناءات ضيقة لدبلومات معلمي ابتدائي/طفولة مبكرة وبرامج KMTC). مسار البكالوريوس للأجانب: تقديم مباشر لمكتب القبول الدولي + معادلة المؤهل (KNQA/KNEC) + Student Pass عبر الهجرة.',
      channelAr: 'مكتب القبول الدولي للجامعة (ليس KUCCPS للدرجة) + eFNS Student Pass',
      docs: [
        'جواز يثبت جنسية غير كينية',
        'شهادة ثانوية + معادلة KNQA/KNEC',
        'طلب الجامعة الدولي ورسوم التقديم',
        'تمويل + Student Pass',
      ],
      feesAr: 'رسوم دولية؛ قد تختلف رسوم التقديم لغير شرق أفريقيا (مثال شائع: رسوم أعلى لغير East African).',
      visaAr: 'Student Pass عبر بوابة الهجرة بعد القبول.',
      caveats: [
        'لا تعتمد على KUCCPS إن لم تكن مواطناً كينياً لبرنامج درجة جامعية.',
        'تحقق من اعتماد المؤسسة لدى CUE.',
      ],
      sources: [
        { label: 'KUCCPS — non-Kenyan eligibility', url: 'https://kuccps.net/Placem' },
        { label: 'Kenyatta University international admissions', url: 'https://international.ku.ac.ke/international-student-admissions/' },
        { label: 'CUE', url: 'https://www.cue.or.ke/' },
      ],
      portals: ['kuccps'],
    },
  ],

  'البرازيل': [
    {
      id: 'br-brazilian-enem-sisu',
      titleAr: 'برازيلي — ENEM → SiSU (قبول محلي للجامعات العامة)',
      match: ({ nationality }) => nationality === 'البرازيل',
      whenAr:
        'المواطنون البرازيليون يلتحقون عادة بالتعليم العالي العام عبر درجات ENEM ثم الاختيار في SiSU (أو مسارات محلية أخرى مثل فيستيبولار حسب المؤسسة). هذا المسار منفصل تماماً عن برامج التبادل للأجانب.',
      channelAr: 'ENEM → SiSU / Vestibular المؤسسة',
      docs: ['شهادة Ensino Médio برازيلية', 'تسجيل ENEM', 'اختيار SiSU أو امتحان المؤسسة'],
      feesAr: 'الجامعات العامة الاتحادية/الولائية غالباً بدون رسوم دراسية للمقبولين المحليين؛ تكاليف معيشة منفصلة.',
      visaAr: 'غير مطلوب للمواطن.',
      caveats: ['قواعد الحصص الاجتماعية/العرقية والسياسات المحلية تنطبق على المسار البرازيلي وليس على PEC-G.'],
      sources: [
        { label: 'SiSU (MEC)', url: 'https://www.gov.br/mec/pt-br/sisu' },
        { label: 'INEP / ENEM', url: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem' },
      ],
      portals: ['sisu-brazil'],
    },
    {
      id: 'br-foreign-pec-g',
      titleAr: 'أجنبي (دول مشاركة) — PEC-G عبر السفارة + Celpe-Bras',
      match: () => true,
      whenAr:
        'برنامج PEC-G الحكومي يقدّم مقاعد بكالوريوس مجانية للأجانب من دول مشاركة: يشترط ألا تكون برازيلياً ولا مولوداً لأبوين برازيليين، وأن تقيم خارج البرازيل، وأن تكمل الثانوية خارج البرازيل. التقديم عبر السفارة/القنصلية — وليس عبر SiSU/ENEM. إثبات البرتغالية (Celpe-Bras أو مسار PEC-PLE) إلزامي وفق الإعلان السنوي.',
      channelAr: 'سفارة/قنصلية البرازيل → PEC-G / PEC-PLE (MEC + MRE)',
      docs: [
        'جنسية دولة مشاركة + إقامة خارج البرازيل',
        'شهادة ثانوية من خارج البرازيل (معدل غالباً ≥ 60%)',
        'Celpe-Bras أو تسجيله / أو PEC-PLE',
        'كفالة مالية للمعيشة (البرنامج مجاني دراسياً لكن المعيشة على الطالب)',
      ],
      feesAr: 'مقعد دراسي مجاني في المؤسسات المشاركة؛ لا رسوم قبول عبر البرنامج — المعيشة والتمويل الشخصي مطلوبان.',
      visaAr: 'تأشيرة طالب بعد القبول؛ الالتزام بالعودة بعد التخرج وفق قواعد البرنامج.',
      caveats: [
        'البرازيليون ومزدوجو الجنسية البرازيلية مستبعدون صراحة من PEC-G.',
        'قائمة الدول والمقاعد تتغير كل إعلان — راجع موقع Itamaraty/MEC للسنة.',
      ],
      sources: [
        {
          label: 'PEC-G about the program (MRE)',
          url: 'https://www.gov.br/mre/en/subjects/culture-and-education/educational-themes/study-opportunities-for-international-applicants/pec-g/about-the-program',
        },
        {
          label: 'PEC-G selection process',
          url: 'https://www.gov.br/mre/en/subjects/culture-and-education/educational-themes/study-opportunities-for-international-applicants/pec-g/pec-g-selection-process',
        },
      ],
      portals: ['pec-g-brazil'],
    },
  ],

  'السويد': [
    {
      id: 'se-eu-eea-swiss-free',
      titleAr: 'سويدي / EU-EEA / سويسرا — بدون رسوم دراسية (+ universityadmissions.se)',
      match: ({ nationality }) => isEuEea(nationality) || nationality === 'السويد',
      whenAr:
        'مواطنو السويد والاتحاد الأوروبي والمنطقة الاقتصادية الأوروبية وسويسرا لا يدفعون رسوم دراسية للدورات من الدورة الأولى والثانية في الجامعات السويدية، ويتقدمون عبر universityadmissions.se مع توثيق الجنسية عند الحاجة للإعفاء من الرسوم.',
      channelAr: 'universityadmissions.se / antagning.se',
      docs: [
        'شهادة ثانوية مؤهلة / معادل',
        'إثبات جنسية EU/EEA/سويسرا عند طلب الإعفاء',
        'لغة إنجليزية (و/أو سويدية حسب البرنامج)',
      ],
      feesAr: 'بدون رسوم دراسية عادة؛ قد تُدفع رسوم مواد إلزامية بسيطة فقط.',
      visaAr: 'مواطنو EU/EEA: حق إقامة للدراسة وفق قواعد حرية الحركة؛ السويدي لا يحتاج تصريحاً.',
      caveats: [
        'وثّق جنسيتك في ملف القبول حتى لا تُصنَّف خطأً كدافع رسوم.',
        'بعض البرامج المهنية لها متطلبات إضافية وطنية.',
      ],
      sources: [
        { label: 'University Admissions Sweden', url: 'https://www.universityadmissions.se/' },
        {
          label: 'UHR ordinance on fees (2010:543)',
          url: 'https://www.uhr.se/en/start/laws-and-regulations/Laws-and-regulations/Ordinance-on-application-fees-and-tuition-fees-at-higher-education-institutions/',
        },
        { label: 'Karolinska Institutet — tuition fees', url: 'https://education.ki.se/bachelors-masters-studies/tuition-fees' },
      ],
      portals: ['university-admissions-sweden', 'study-in-sweden'],
    },
    {
      id: 'se-non-eu-fees-permit',
      titleAr: 'من خارج EU/EEA/سويسرا — رسوم تقديم + دراسية + تصريح إقامة',
      match: () => true,
      whenAr:
        'مواطنو الدول الثالثة يدفعون عادة رسوم تقديم 900 كرونة سويدية عبر universityadmissions.se ورسوماً دراسية تحددها الجامعة. بعد القبول يجب دفع القسط الأول قبل أن تبدأ Migrationsverket بمعالجة تصريح إقامة الطالب.',
      channelAr: 'universityadmissions.se → دفع الرسوم → تصريح إقامة طالب (Migrationsverket)',
      docs: [
        'جواز دولة ثالثة',
        'شهادة ثانوية + ترجمة إن لزم',
        'إثبات لغة',
        'دفع رسوم التقديم ثم القسط الدراسي',
        'طلب تصريح إقامة طالب + تمويل',
      ],
      feesAr: 'رسوم تقديم 900 SEK + رسوم دراسية حسب البرنامج؛ منح Study in Sweden/الجامعة قد تغطي جزءاً.',
      visaAr: 'تصريح إقامة للدراسات عبر مصلحة الهجرة السويدية بعد إثبات الدفع والقبول.',
      caveats: [
        'الجنسية تحكم الرسوم — ليست لغة الدراسة أو بلد الشهادة وحدهما.',
        'استثناءات ضيقة (إقامة دائمة سويدية، أفراد عائلة EU…) وفق المرسوم — تحقق من universityadmissions.se.',
      ],
      sources: [
        { label: 'University Admissions Sweden', url: 'https://www.universityadmissions.se/' },
        {
          label: 'UHR ordinance on fees (2010:543)',
          url: 'https://www.uhr.se/en/start/laws-and-regulations/Laws-and-regulations/Ordinance-on-application-fees-and-tuition-fees-at-higher-education-institutions/',
        },
        { label: 'Study in Sweden', url: 'https://studyinsweden.se/' },
      ],
      portals: ['university-admissions-sweden', 'study-in-sweden'],
    },
  ],

  'إيطاليا': [
    {
      id: 'it-eu-or-resident-direct',
      titleAr: 'إيطالي / EU-EEA / سويسرا / مقيم قانوني — تقديم مباشر للجامعة (بدون Universitaly)',
      match: ({ nationality, residenceCountry }) =>
        nationality === 'إيطاليا' ||
        isEuEea(nationality) ||
        residenceCountry === 'إيطاليا',
      whenAr:
        'المواطنون الإيطاليون ومواطنو الاتحاد الأوروبي / المنطقة الاقتصادية وسويسرا وسان مارينو والكرسي الرسولي، وكذلك غير الأوروبيين المقيمين قانونياً في إيطاليا، يتقدمون مباشرة للجامعة دون إجراء ما قبل التسجيل عبر Universitaly ودون حصص الأجانب طالبي التأشيرة.',
      channelAr: 'بوابة الجامعة مباشرة (immatricolazione) — لا Universitaly للفيزا',
      docs: [
        'شهادة ثانوية إيطالية أو مؤهل أجنبي مقبول لدى الجامعة',
        'طلب التسجيل الجامعي حسب المواعيد',
        'إثبات لغة إيطالية/إنجليزية حسب البرنامج',
      ],
      feesAr: 'رسوم جامعية حسب الجامعة والدخل (ISEE للمقيمين)؛ ليست رسوم «دولي» منفصلة كالفيزا-طلاب.',
      visaAr: 'EU/EEA: تسجيل إقامة؛ الإيطالي لا يحتاج تأشيرة. المقيم القانوني يستخدم تصريحه الحالي.',
      caveats: [
        'ازدواج جنسية يشمل EU يعفيك عادة من Universitaly.',
        'برامج محدودة العدد (طب…) لها اختبارات وطنية منفصلة.',
      ],
      sources: [
        { label: 'Universitaly — studenti stranieri', url: 'https://www.universitaly.it/studenti-stranieri' },
        { label: 'University of Milan — international enrolment', url: 'https://www.unimi.it/en/international/coming-abroad/enrol-programme/international-enrolment-degree-programmes' },
      ],
      portals: ['universitaly'],
      universities: ['Sapienza Università di Roma', 'Politecnico di Milano', 'Università di Bologna', 'University of Milan'],
    },
    {
      id: 'it-non-eu-abroad-universitaly',
      titleAr: 'غير أوروبي مقيم خارج إيطاليا — ما قبل تسجيل Universitaly + تأشيرة دراسة',
      match: () => true,
      whenAr:
        'غير الأوروبيين المقيمين خارج إيطاليا ملزمون بتقديم طلب ما قبل التسجيل (pre-enrolment) عبر بوابة Universitaly الرسمية لوزارة الجامعة والبحث، ثم متابعة التأشيرة لدى القنصلية ضمن المواعيد الوزارية، وغالباً ضمن حصص الأجانب للبرنامج.',
      channelAr: 'قبول الجامعة → Universitaly pre-enrolment → تأشيرة دراسة قنصلية',
      docs: [
        'جواز دولة ثالثة + إقامة خارج إيطاليا',
        'قبول/تقييم الجامعة',
        'طلب Universitaly',
        'تأشيرة دراسة + permesso di soggiorno بعد الوصول',
        'اختبار إيطالية للبرامج بالإيطالية إن انطبق',
      ],
      feesAr: 'رسوم جامعية حسب المؤسسة + تكاليف التأشيرة/الإقامة؛ المواعيد أبكر من مسار EU.',
      visaAr: 'تأشيرة دراسة إلزامية؛ مواعيد وزارية (مثال 2026/27: طلبات التأشيرة حتى 30 نوفمبر 2026).',
      caveats: [
        'موافقة Universitaly/الجامعة لا تضمن التأشيرة — القرار للقنصلية.',
        'لا تبدأ Universitaly قبل قبول/عرض الجامعة حيث يُطلب ذلك.',
      ],
      sources: [
        { label: 'Universitaly — studenti stranieri', url: 'https://www.universitaly.it/studenti-stranieri' },
        { label: 'University of Turin — Universitaly FAQ', url: 'https://en.unito.it/studying-unito/international-degree-seeking-students/faqs/faqs-visa-and-pre-enrolment-universitaly' },
      ],
      portals: ['universitaly'],
      universities: ['Sapienza Università di Roma', 'Politecnico di Milano', 'Università di Bologna', 'University of Padua'],
    },
  ],

  'النمسا': [
    {
      id: 'at-eu-eea-fee-exempt',
      titleAr: 'نمساوي / EU-EEA — إعفاء من الرسوم ضمن المدة النظامية (+ فصلان تسامح)',
      match: ({ nationality }) => nationality === 'النمسا' || isEuEea(nationality),
      whenAr:
        'في الجامعات الحكومية النمساوية، المواطنون النمساويون ومواطنو EU/EEA (ومن في حكمهم) لا يدفعون رسوماً دراسية أثناء المدة النظامية للبرنامج + فصلين تسامح؛ بعدها ≈ 363.36 يورو/فصل. رسوم اتحاد الطلاب ÖH إلزامية للجميع.',
      channelAr: 'تقديم الجامعة / u:find حسب المؤسسة',
      docs: ['شهادة ثانوية نمساوية أو معادل', 'إثبات جنسية EU/EEA', 'لغة ألمانية/إنجليزية حسب البرنامج'],
      feesAr: 'بدون رسوم دراسية ضمن المدة النظامية+تسامح؛ ثم ≈ €363.36/فصل + ÖH.',
      visaAr: 'EU/EEA: تسجيل إقامة؛ النمساوي لا يحتاج تصريح طالب.',
      caveats: ['جامعات العلوم التطبيقية (FH) قد تفرض رسوماً مختلفة — تحقق من المؤسسة.'],
      sources: [
        { label: 'Study in Austria — tuition', url: 'https://studyinaustria.at/en/tuition' },
        { label: 'oesterreich.gv.at — university fees', url: 'https://www.oesterreich.gv.at/en/themen/bildung_und_ausbildung/hochschulen/universitaet/Seite.160104' },
        { label: 'TU Wien — tuition fee', url: 'https://www.tuwien.at/en/studies/admission/students-union-fee-and-tuition-fee/tuition-fee' },
      ],
      portals: ['study-in-austria'],
      universities: ['University of Vienna', 'TU Wien', 'University of Innsbruck', 'Universität Graz'],
    },
    {
      id: 'at-third-country-tuition',
      titleAr: 'دولة ثالثة — رسوم أعلى من الفصل الأول + تصريح إقامة طالب',
      match: () => true,
      whenAr:
        'طلاب الدول الثالثة الحاصلون على تصريح إقامة طالب يدفعون عموماً رسوماً أعلى من الفصل الأول (حوالي €726.72–€751.92/فصل وفق الجهة/السنة) إضافة إلى ÖH، مع تقديم مباشر للجامعة ومتطلبات لغة وتمويل.',
      channelAr: 'تقديم الجامعة الدولي → Residence Permit – Student',
      docs: ['جواز دولة ثالثة', 'شهادة ثانوية معادلة', 'لغة', 'تمويل', 'تصريح إقامة طالب'],
      feesAr: '≈ €726–€752/فصل دراسي (+ ÖH) في الجامعات الحكومية غالباً.',
      visaAr: 'تصريح إقامة طالب قبل أو عند بدء الدراسة وفق قواعد الهجرة.',
      caveats: ['بعض الجنسيات/المنح قد تُعفى جزئياً — راجع الجامعة وOeAD.'],
      sources: [
        { label: 'Study in Austria — tuition', url: 'https://studyinaustria.at/en/tuition' },
        { label: 'BMFWF — tuition fees', url: 'https://www.bmfwf.gv.at/en/science/studying/tuition-fees.html' },
      ],
      portals: ['study-in-austria'],
      universities: ['University of Vienna', 'TU Wien', 'University of Innsbruck'],
    },
  ],

  'إسبانيا': [
    {
      id: 'es-spanish-bachillerato-pau',
      titleAr: 'إسباني / نظام Bachillerato إسباني — PAU/EBAU ثم الجامعة',
      match: ({ nationality, qualificationCountry }) =>
        nationality === 'إسبانيا' || qualificationCountry === 'إسبانيا',
      whenAr:
        'خريجو النظام التعليمي الإسباني (Bachillerato) يدخلون عبر اختبار القبول الجامعي PAU/EBAU (Selectividad) ثم التقديم للجامعات العامة/الخاصة وفق درجات القطع — مسار منفصل عن اعتماد UNEDasiss للأجانب.',
      channelAr: 'PAU/EBAU → تقديم الجامعة الإسبانية',
      docs: ['Bachillerato إسباني', 'PAU/EBAU', 'طلب الجامعة'],
      feesAr: 'رسوم جامعات عامة حسب الإقليم؛ أسعار مقيمين عادة أقل من غير المقيمين من خارج الاتحاد في بعض الأقاليم.',
      visaAr: 'غير مطلوب للمواطن الإسباني.',
      caveats: ['الإسباني بشهادة أجنبية قد يُحوَّل لمسار UNEDasiss — بلد الشهادة مهم.'],
      sources: [
        { label: 'UNEDasiss FAQs', url: 'https://unedasiss.uned.es/faqs%26idioma%3Den' },
      ],
      portals: ['unedasiss'],
      universities: ['Universidad Complutense de Madrid', 'Universitat de Barcelona', 'Universidad Autónoma de Madrid', 'Universidad de Valencia'],
    },
    {
      id: 'es-eu-unedasiss',
      titleAr: 'نظام تعليمي EU / اتفاقيات — اعتماد UNEDasiss (بدون معادلة كاملة غالباً)',
      match: ({ nationality, qualificationCountry }) =>
        isEuEea(nationality) || isEuEea(qualificationCountry),
      whenAr:
        'حسب UNEDasiss الرسمي: مسارات القبول الدولي تختلف بين طلاب أنظمة الاتحاد الأوروبي (أو دول باتفاقيات متبادلة) وبين غيرهم. مسار EU غالباً اعتماد رقمي + PCE اختيارية لتحسين الدرجة، دون اشتراط معادلة Bachillerato كخطوة أولى إلزامية كغير EU.',
      channelAr: 'UNEDasiss → الجامعة (تحقق إن كانت تقبل الاعتماد)',
      docs: ['شهادة ثانوية من نظام EU/اتفاقية', 'طلب اعتماد UNEDasiss', 'PCE إن رغبت برفع الدرجة', 'طلب الجامعة'],
      feesAr: 'رسوم عامة؛ مواطنو EU لا يحتاجون تأشيرة دراسة من نوع الدول الثالثة.',
      visaAr: 'EU/EEA: حرية تنقل/تسجيل؛ ليس مسار تأشيرة طالب للدول الثالثة.',
      caveats: ['ليست كل الجامعات تقبل UNEDasiss — أكّد مع الجامعة المستهدفة.'],
      sources: [
        { label: 'UNEDasiss FAQs — EU vs other', url: 'https://unedasiss.uned.es/faqs%26idioma%3Den' },
      ],
      portals: ['unedasiss'],
      universities: ['Universidad Complutense de Madrid', 'Universitat de Barcelona', 'Universidad Autónoma de Madrid'],
    },
    {
      id: 'es-non-eu-homologation-unedasiss',
      titleAr: 'خارج EU/بدون اتفاقية — معادلة Bachillerato + UNEDasiss/PCE + تأشيرة',
      match: () => true,
      whenAr:
        'طلاب الأنظمة خارج الاتحاد/بدون اتفاقية يبدأون عادة بطلب معادلة الشهادة الثانوية لـ Bachillerato لدى وزارة التعليم الإسبانية، ثم اعتماد UNEDasiss وغالباً أربع مواد PCE على الأقل، مع تأشيرة دراسة لغير المقيمين.',
      channelAr: 'معادلة وزارة التعليم → UNEDasiss + PCE → الجامعة + تأشيرة',
      docs: [
        'جواز دولة ثالثة',
        'طلب homologación لـ Bachillerato',
        'اعتماد UNEDasiss',
        'PCE (يُنصح بأربع مواد على الأقل)',
        'تمويل وتأشيرة دراسة',
      ],
      feesAr: 'رسوم جامعية + رسوم اعتماد/امتحانات UNED؛ قد تختلف معاملة الرسوم حسب الإقليم والإقامة.',
      visaAr: 'تأشيرة دراسة إسبانية لغير المقيمين من الدول الثالثة.',
      caveats: [
        'المعادلة قد تستغرق وقتاً طويلاً — يمكن اعتماد مؤقت أثناء المعالجة في بعض الحالات.',
        'بلد النظام التعليمي أهم من الجنسية وحدها؛ لكن التأشيرة والرسوم تتأثران بالجنسية/الإقامة.',
      ],
      sources: [
        { label: 'UNEDasiss FAQs — non-EU start', url: 'https://unedasiss.uned.es/faqs%26idioma%3Den' },
      ],
      portals: ['unedasiss'],
      universities: ['Universidad Complutense de Madrid', 'Universitat de Barcelona', 'Universidad de Valencia'],
    },
  ],

  'بلجيكا': [
    {
      id: 'be-eu-eea-lower-fees',
      titleAr: 'بلجيكي / EU-EEA / سويسرا — رسوم أدنى وبدون تأشيرة طالب',
      match: ({ nationality }) => nationality === 'بلجيكا' || isEuEea(nationality),
      whenAr:
        'التعليم اختصاص المجتمعات (فلاندرز/والونيا/الألمانية). مواطنو EU/EEA/سويسرا يدفعون عادة الرسوم القانونية الأدنى (مثال فلاندرز ≈ €1,157 لعام 2025–26) ويتقدمون مباشرة للمؤسسة بمواعيد أوسع غالباً، دون تأشيرة D.',
      channelAr: 'تقديم الجامعة / University College حسب المجتمع اللغوي',
      docs: ['شهادة ثانوية / معادل', 'إثبات جنسية EU/EEA', 'لغة هولندية أو فرنسية أو إنجليزية حسب البرنامج'],
      feesAr: 'رسوم قانونية EU أقل بكثير من غير EU (تختلف فلاندرز عن والونيا).',
      visaAr: 'لا تأشيرة طالب لدول EU/EEA/سويسرا.',
      caveats: ['تحقق من مجتمع المؤسسة (Flemish / French-speaking) لأن الرسوم والمواعيد تختلف.'],
      sources: [
        { label: 'Belgium.be — coming to study', url: 'https://www.belgium.be/en/education/coming_to_study_in_belgium' },
        { label: 'European Education Area — Flanders fees', url: 'https://education.ec.europa.eu/study-in-europe/countries/belgium/flanders' },
      ],
      portals: ['study-in-flanders', 'wallonie-bruxelles-campus'],
      universities: ['KU Leuven', 'Ghent University', 'UCLouvain', 'Université libre de Bruxelles'],
    },
    {
      id: 'be-non-eu-higher-fees-visa',
      titleAr: 'غير EU — رسوم أعلى + معادلة + تأشيرة D',
      match: () => true,
      whenAr:
        'غير الأوروبيين يواجهون رسوماً أعلى (في فلاندرز قد تصل إلى عدة آلاف يورو حسب البرنامج؛ في والونيا تُضاف مساهمة إضافية كبيرة غالباً)، ومواعيد تقديم أبكر، ومعادلة للشهادة الثانوية عند البكالوريوس، ثم تأشيرة إقامة طويلة من نوع D.',
      channelAr: 'تقديم المؤسسة مبكراً → معادلة إن لزم → تأشيرة D / إقامة طالب',
      docs: [
        'جواز دولة ثالثة',
        'شهادة ثانوية + معادلة (CESS معادل) للبكالوريوس',
        'إثبات تمويل وتأمين صحي',
        'تأشيرة D بعد القبول',
      ],
      feesAr: 'أعلى من رسوم EU — مثال فلاندرز €1,200–€8,000 حسب البرنامج؛ والونيا غالباً رسوم+مساهمة إضافية.',
      visaAr: 'تأشيرة طويلة الأمد (D) للدراسة ثم تسجيل البلدية.',
      caveats: ['بعض جنسيات الدول النامية قد تُعامل برسوم أقرب لـ EU في والونيا — راجع المؤسسة.'],
      sources: [
        { label: 'IBZ — study visa D', url: 'https://dofi.ibz.be/en/themes/third-country-nationals/study/higher-education/recognised-higher-education-public/initial' },
        { label: 'European Education Area — Flanders', url: 'https://education.ec.europa.eu/study-in-europe/countries/belgium/flanders' },
      ],
      portals: ['study-in-flanders', 'wallonie-bruxelles-campus'],
      universities: ['KU Leuven', 'Ghent University', 'UCLouvain', 'Université libre de Bruxelles'],
    },
  ],

  'النرويج': [
    {
      id: 'no-eu-eea-swiss-free',
      titleAr: 'نرويجي / EU-EEA / سويسرا — بدون رسوم دراسية في الجامعات العامة',
      match: ({ nationality }) => nationality === 'النرويج' || isEuEea(nationality),
      whenAr:
        'حسب Study in Norway: مواطنو النرويج والاتحاد الأوروبي / المنطقة الاقتصادية وسويسرا معفيون من الرسوم الدراسية في مؤسسات التعليم العالي العامة، مع دفع رسوم فصل طلابية صغيرة عادة.',
      channelAr: 'تقديم الجامعة / Norwegian Universities and Colleges Admission Service حسب البرنامج',
      docs: ['شهادة ثانوية مؤهلة', 'إثبات جنسية EU/EEA/سويسرا', 'لغة إنجليزية/نرويجية حسب البرنامج'],
      feesAr: 'بدون tuition في العامة؛ semester fee فقط تقريباً.',
      visaAr: 'EU/EEA: تسجيل؛ النرويجي لا يحتاج تصريح طالب.',
      caveats: ['مؤسسات خاصة قد تفرض رسوماً حتى على EU.'],
      sources: [
        { label: 'Study in Norway — cost and requirements', url: 'https://studyinnorway.no/cost-and-requirements' },
      ],
      portals: [],
      universities: ['University of Oslo', 'NTNU', 'University of Bergen'],
    },
    {
      id: 'no-non-eu-tuition-permit',
      titleAr: 'خارج EU/EEA/سويسرا — رسوم دراسية + تصريح إقامة طالب',
      match: () => true,
      whenAr:
        'منذ خريف 2023 يدفع طلاب الدول الثالثة رسوماً دراسية في الجامعات العامة النرويجية تختلف حسب المؤسسة والبرنامج، ويحتاجون تصريح إقامة للدراسة مع إثبات تمويل وسكن.',
      channelAr: 'تقديم الجامعة (مواعيد أبكر غالباً) → study permit',
      docs: ['جواز دولة ثالثة', 'قبول كامل الوقت', 'إثبات تمويل وسكن', 'تصريح إقامة طالب'],
      feesAr: 'رسوم دراسية حسب البرنامج (غالباً عشرات إلى مئات آلاف الكرونة سنوياً) + semester fee.',
      visaAr: 'Study permit إلزامي لغير EU/EEA/سويسرا (يشمل مواطني UK).',
      caveats: ['استثناءات للمنح/التبادل/الدكتوراه — تحقق من Study in Norway.'],
      sources: [
        { label: 'Study in Norway — cost and requirements', url: 'https://studyinnorway.no/cost-and-requirements' },
      ],
      portals: [],
      universities: ['University of Oslo', 'NTNU', 'University of Bergen'],
    },
  ],

  'البرتغال': [
    {
      id: 'pt-national-or-eu-call',
      titleAr: 'برتغالي / EU-EEA مؤهل — Concurso Nacional / شروط المواطنين',
      match: ({ nationality }) => nationality === 'البرتغال' || isEuEea(nationality),
      whenAr:
        'مواطنو البرتغال ومواطنو الاتحاد الأوروبي / المنطقة الاقتصادية (ومن في حكمهم وفق DGES، بما فيه بعض المقيمين لأكثر من سنتين) يدخلون عادة عبر المسابقة الوطنية أو مسارات تعادل شروط المواطنين — وليس وضع «estudante internacional».',
      channelAr: 'DGES / Concurso Nacional أو تقديم المؤسسة الخاصة',
      docs: ['شهادة ثانوية / معادل برتغالي', 'امتحانات وطنية أو بدائل مقبولة', 'طلب DGES أو المؤسسة'],
      feesAr: 'رسوم propinas للمواطنين/EU أقل عادة من رسوم الطالب الدولي.',
      visaAr: 'EU/EEA: حرية تنقل؛ البرتغالي لا يحتاج تأشيرة.',
      caveats: ['الإقامة القانونية الطويلة في البرتغال قد تنقلك لمسار الوطني حتى لو لم تكن EU — راجع DGES.'],
      sources: [
        { label: 'DGES — National Call', url: 'https://dges.gov.pt/en/pagina/general-information-national-call?plid=1531' },
        { label: 'DGES — International Students', url: 'http://wwwcdn.dges.gov.pt/en/pagina/international-students' },
      ],
      portals: [],
      universities: ['Universidade de Lisboa', 'Universidade do Porto', 'Universidade Católica Portuguesa'],
    },
    {
      id: 'pt-international-student-special',
      titleAr: 'طالب دولي (غير EU غالباً) — Concurso Especial + تأشيرة إقامة',
      match: () => true,
      whenAr:
        'من لا يحمل جنسية EU/EEA وليس مقيماً قانونياً لأكثر من سنتين يتقدم عادة عبر المسابقة الخاصة للطالب الدولي (Decreto-Lei 36/2014) مباشرة لكل جامعة/بوليتكنيك بمواعيد ومتطلبات خاصة، ثم تأشيرة إقامة.',
      channelAr: 'Concurso Especial para Estudantes Internacionais لدى المؤسسة',
      docs: [
        'جواز غير EU (أو غير مؤهل للمسار الوطني)',
        'شهادة تمنح دخول التعليم العالي في بلد الإصدار',
        'طلب المؤسسة الدولي',
        'تأشيرة إقامة / تصريح بعد القبول',
      ],
      feesAr: 'رسوم طالب دولي أعلى تحددها كل مؤسسة.',
      visaAr: 'تأشيرة إقامة للدراسة ثم تحويل لتصريح بعد الوصول.',
      caveats: ['كل مؤسسة تضع مواعيدها ووثائقها — لا توجد بوابة مركزية واحدة لكل الدوليين.'],
      sources: [
        { label: 'DGES — Non-EU Students', url: 'https://dges.gov.pt/en/pagina/non-eu-students?plid=1531' },
        { label: 'DGES — International Students', url: 'http://wwwcdn.dges.gov.pt/en/pagina/international-students' },
      ],
      portals: [],
      universities: ['Universidade de Lisboa', 'Universidade do Porto', 'Universidade Católica Portuguesa'],
    },
  ],

  'فنلندا': [
    {
      id: 'fi-eu-eea-swiss-free',
      titleAr: 'فنلندي / EU-EEA / سويسرا — بدون رسوم دراسية (Studyinfo.fi)',
      match: ({ nationality }) => nationality === 'فنلندا' || isEuEea(nationality),
      whenAr:
        'مواطنو فنلندا وEU/EEA وسويسرا لا يدفعون رسوماً دراسية للدرجات. التقديم للبرامج عبر Studyinfo.fi. برامج الفنلندية/السويدية والدكتوراه بدون رسوم للجميع عادة.',
      channelAr: 'Studyinfo.fi',
      docs: ['شهادة ثانوية مؤهلة', 'إثبات جنسية EU/EEA/سويسرا', 'لغة إنجليزية أو فنلندية/سويدية'],
      feesAr: 'بدون tuition للدرجات؛ قد تُدفع رسوم اتحاد طلاب.',
      visaAr: 'EU/EEA: تسجيل؛ الفنلندي لا يحتاج تصريح طالب.',
      caveats: ['بعض تصاريح الإقامة الفنلندية تعفي غير EU أيضاً — راجع Studyinfo/Migri.'],
      sources: [
        { label: 'Study in Finland — fees', url: 'https://www.studyinfinland.fi/funding-your-studies/fees-and-cost-living' },
        { label: 'Aalto — tuition fees', url: 'https://www.aalto.fi/en/admission-services/scholarships-and-tuition-fees' },
      ],
      portals: [],
      universities: ['Aalto University', 'University of Helsinki', 'University of Turku', 'International School of Helsinki'],
    },
    {
      id: 'fi-non-eu-tuition-permit',
      titleAr: 'خارج EU/EEA/سويسرا — رسوم برامج إنجليزية + تصريح إقامة',
      match: () => true,
      whenAr:
        'غير الأوروبيين يدفعون عادة رسوماً لبرامج البكالوريوس/الماجستير بالإنجليزية (€8000–€20000 تقريباً) وقد تُفرض رسوم تقديم. يلزم تصريح إقامة طالب عبر Migri مع إثبات تمويل ودفع الرسوم.',
      channelAr: 'Studyinfo.fi → دفع الرسوم/المنحة → تصريح إقامة Migri',
      docs: ['جواز دولة ثالثة', 'Studyinfo application', 'إثبات لغة', 'تمويل', 'residence permit'],
      feesAr: 'رسوم دراسية لبرامج الإنجليزية + رسوم تقديم محتملة لغير EU.',
      visaAr: 'تصريح إقامة للدراسات عبر Migri.',
      caveats: ['الدكتوراه والبرامج بالفنلندية/السويدية غالباً بدون رسوم حتى لغير EU.'],
      sources: [
        { label: 'Migri — studying in Finland', url: 'https://migri.fi/en/studying-in-finland' },
        { label: 'Studyinfo.fi', url: 'https://studyinfo.fi/' },
      ],
      portals: [],
      universities: ['Aalto University', 'University of Helsinki', 'University of Turku'],
    },
  ],

  'الدنمارك': [
    {
      id: 'dk-eu-eea-swiss-free',
      titleAr: 'دنماركي / EU-EEA / سويسرا — بدون رسوم + optagelse.dk',
      match: ({ nationality }) => nationality === 'الدنمارك' || isEuEea(nationality),
      whenAr:
        'التعليم العالي مجاني لمواطني الدنمارك وEU/EEA وسويسرا (ولمن لهم وضع معادل). طلبات البكالوريوس عبر البوابة الوطنية optagelse.dk.',
      channelAr: 'optagelse.dk (بكالوريوس) / بوابة الجامعة للماجستير',
      docs: ['شهادة ثانوية مؤهلة', 'إثبات جنسية EU/EEA/سويسرا', 'لغة إنجليزية/دنماركية حسب البرنامج'],
      feesAr: 'بدون رسوم دراسية للدرجات الكاملة عادة.',
      visaAr: 'EU/EEA: تسجيل؛ الدنماركي لا يحتاج تصريح طالب.',
      caveats: ['بعض أوضاع الإقامة الدنماركية تعفي غير EU — راجع Study in Denmark.'],
      sources: [
        { label: 'Study in Denmark — tuition', url: 'https://studyindenmark.dk/study-options/tuition-fees-and-scholarships' },
        { label: 'optagelse.dk guidance', url: 'https://lifeindenmark.borger.dk/school-and-education/higher-education/admission-to-higher-education-in-denmark' },
      ],
      portals: ['finduddannelse'],
      universities: ['University of Copenhagen', 'Technical University of Denmark', 'Aarhus University', 'Copenhagen International School'],
    },
    {
      id: 'dk-non-eu-tuition-permit',
      titleAr: 'خارج EU/EEA/سويسرا — رسوم دراسية + تصريح إقامة',
      match: () => true,
      whenAr:
        'غير الأوروبيين يدفعون رسوماً سنوية تقريباً €6000–€16000 ويحتاجون تصريح إقامة. مواعيد غير EU أبكر غالباً؛ بعض المؤسسات تفرض رسوم تقييم لغير EU.',
      channelAr: 'optagelse.dk أو بوابة الجامعة → تصريح إقامة طالب',
      docs: ['جواز دولة ثالثة', 'قبول', 'إثبات تمويل', 'تصريح إقامة (برسوم طلب)'],
      feesAr: 'رسوم دراسية حسب المؤسسة + رسوم تصريح الإقامة.',
      visaAr: 'تصريح إقامة للدراسة لغير EU/EEA/سويسرا.',
      caveats: ['تحقق من كل برنامج: المواعيد والرسوم ليست موحدة لكل المؤسسات.'],
      sources: [
        { label: 'Study in Denmark — tuition', url: 'https://studyindenmark.dk/study-options/tuition-fees-and-scholarships' },
      ],
      portals: ['finduddannelse'],
      universities: ['University of Copenhagen', 'Technical University of Denmark', 'Aarhus University'],
    },
  ],

  'بولندا': [
    {
      id: 'pl-polish-eu-eea-free-polish',
      titleAr: 'مواطن بولندي / EU-EEA — دراسة بدوام كامل بالبولندية مجاناً في العامة',
      match: ({ nationality }) => nationality === 'بولندا' || isEuEea(nationality),
      whenAr:
        'حسب study.gov.pl (NAWA): الدراسة بدوام كامل باللغة البولندية في مؤسسات التعليم العالي الحكومية مجانية للطلاب البولنديين وللأجانب الذين يدرسون «بشروط المواطنين البولنديين» — ويشمل ذلك مواطني EU/EEA وحاملي Karta Polaka (بطاقة القطب). التقديم عبر أنظمة الجامعات (مثل IRK) مع إثبات لغة بولندية كافية.',
      channelAr: 'نظام قبول الجامعة (IRK/Online Admissions) — مسار شروط المواطنين',
      docs: [
        'شهادة ثانوية / معادل',
        'إثبات جنسية بولندية أو EU/EEA (أو Karta Polaka إن وُجدت)',
        'إثبات لغة بولندية للبرامج البولندية',
        'مستندات التسجيل الخاصة بالجامعة',
      ],
      feesAr: 'بدون رسوم دراسية للدوام الكامل بالبولندية في الحكومية؛ قد تُفرض رسوم إدارية/فصلية.',
      visaAr: 'مواطنو EU/EEA: تسجيل إقامة؛ البولندي لا يحتاج تأشيرة طالب.',
      caveats: [
        'برامج الإنجليزية والدوام الجزئي والمؤسسات الخاصة غالباً برسوم حتى لمواطني EU.',
        'حاملو Karta Polaka ومواطنو EU/EEA قد يختارون الدراسة «كأجانب برسوم» لتسهيل القبول — راجع define your status.',
      ],
      sources: [
        { label: 'Study in Poland — tuition fees', url: 'https://study.gov.pl/tuition-fees' },
        { label: 'Study in Poland — define your status', url: 'https://study.gov.pl/define-your-status' },
      ],
      portals: [],
      universities: [
        'University of Warsaw',
        'Jagiellonian University',
        'Warsaw University of Technology',
        'AGH University of Krakow',
      ],
    },
    {
      id: 'pl-fee-paying-foreigners',
      titleAr: 'أجانب برسوم — خارج شروط المواطنين البولنديين',
      match: () => true,
      whenAr:
        'الأجانب الذين لا يدرسون بشروط المواطنين يدفعون رسوماً تحددها المؤسسة (غالباً ≈ €2000–€6000 سنوياً حسب البرنامج). القبول غالباً أسهل دون منافسة مقاعد المواطنين، مع إثبات لغة البرنامج وتمويل وتأشيرة وطنية إن لزم.',
      channelAr: 'تقديم الجامعة الدولي / International Admissions → تأشيرة وطنية بولندية',
      docs: [
        'جواز دولة ثالثة',
        'شهادة ثانوية مصدّقة/مترجمة',
        'إثبات لغة بولندية أو إنجليزية حسب البرنامج',
        'إثبات تمويل',
        'تأشيرة وطنية / تصريح إقامة طالب',
      ],
      feesAr: 'رسوم دراسية مؤسسية (متوسط رسمي تقريبي €2000+/سنة للدورات الأولى؛ أعلى للتخصصات والـMBA).',
      visaAr: 'تأشيرة وطنية بولندية ثم تصريح إقامة للدراسة لغير EU/EEA.',
      caveats: [
        'ذوو الأصل البولندي المؤكد رسمياً قد يحصلون على خصم رسوم ≈ 30% حسب السياسة الرسمية.',
        'الدكتوراه بدوام كامل في الكليات البحثية غالباً بدون رسوم مع منحة — استثناء مهم.',
      ],
      sources: [
        { label: 'Study in Poland — tuition fees', url: 'https://study.gov.pl/tuition-fees' },
        { label: 'Study in Poland — define your status', url: 'https://study.gov.pl/define-your-status' },
      ],
      portals: [],
      universities: [
        'University of Warsaw',
        'Jagiellonian University',
        'Warsaw University of Technology',
        'AGH University of Krakow',
      ],
    },
  ],

  'التشيك': [
    {
      id: 'cz-eu-eea-no-visa',
      titleAr: 'مواطن تشيكي / EU-EEA — برامج تشيكية مجانية + بلا تأشيرة طالب طويلة',
      match: ({ nationality }) => nationality === 'التشيك' || isEuEea(nationality),
      whenAr:
        'حسب Study in Czechia: التعليم العالي بالتشيكية في المؤسسات العامة/الحكومية مجاني قانوناً لكل الجنسيات. مواطنو التشيك وEU/EEA لا يحتاجون تأشيرة طالب طويلة؛ البرامج بالإنجليزية/لغات أجنبية برسوم للجميع. التقديم عبر بوابات الجامعات.',
      channelAr: 'بوابة قبول الجامعة (برامج تشيكية أو إنجليزية)',
      docs: [
        'شهادة ثانوية / nostrification إن لزم',
        'إثبات جنسية EU/EEA أو تشيكية',
        'إثبات لغة تشيكية للبرامج المجانية، أو إنجليزية للبرامج المدفوعة',
      ],
      feesAr: 'تشيكية في العامة: مجانية؛ إنجليزية/أجنبية: رسوم حسب البرنامج (حتى عشرات آلاف USD سنوياً في بعض التخصصات).',
      visaAr: 'EU/EEA: حرية تنقل/تسجيل؛ التشيكي لا يحتاج تصريح طالب.',
      caveats: [
        'المجانية مرتبطة بلغة التدريس (التشيكية) وليس بالجنسية — لكن التأشيرة والإقامة تختلفان بالجنسية.',
        'المؤسسات الخاصة تحدد رسومها بحرية.',
      ],
      sources: [
        { label: 'Study in Czechia — tuition fees', url: 'https://www.studyin.cz/plan-your-studies/tuition-fees/' },
        { label: 'Study in Czechia', url: 'https://www.studyin.cz/' },
      ],
      portals: [],
      universities: [
        'Charles University',
        'Czech Technical University in Prague',
        'Masaryk University',
        'Brno University of Technology',
      ],
    },
    {
      id: 'cz-non-eu-visa-same-tuition-rule',
      titleAr: 'خارج EU/EEA — نفس قاعدة الرسوم اللغوية + تأشيرة/إقامة طالب',
      match: () => true,
      whenAr:
        'غير الأوروبيين يستفيدون أيضاً من مجانية البرامج التشيكية في العامة، لكن يلزمهم عادة تصريح إقامة طويل الأجل للدراسة وتمويل كافٍ. البرامج بالإنجليزية برسوم لجميع الجنسيات + مسار تأشيرة.',
      channelAr: 'تقديم الجامعة → nostrification إن لزم → تأشيرة/إقامة طالب طويلة',
      docs: [
        'جواز دولة ثالثة',
        'شهادة ثانوية + nostrification عند الطلب',
        'إثبات لغة',
        'تمويل وسكن',
        'تصريح إقامة للدراسة',
      ],
      feesAr: 'تشيكية عامة: مجانية؛ برامج أجنبية: رسوم مؤسسية + رسوم إجراءات القبول.',
      visaAr: 'تأشيرة/تصريح إقامة طويل الأجل للدراسة لغير EU/EEA.',
      caveats: [
        'لا تفترض أن «دولي = رسوم دائماً» في التشيك — لغة البرنامج تحدد الرسوم الدراسية في العامة.',
        'تحقق من مواعيد القبول ومتطلبات nostrification لكل جامعة.',
      ],
      sources: [
        { label: 'Study in Czechia — tuition fees', url: 'https://www.studyin.cz/plan-your-studies/tuition-fees/' },
      ],
      portals: [],
      universities: [
        'Charles University',
        'Czech Technical University in Prague',
        'Masaryk University',
        'Brno University of Technology',
      ],
    },
  ],

  'نيوزيلندا': [
    {
      id: 'nz-domestic-nz-au',
      titleAr: 'نيوزيلندي / أسترالي مقيم في NZ — رسوم محلية (domestic)',
      match: ({ nationality }) =>
        nationality === 'نيوزيلندا' || nationality === 'أستراليا',
      whenAr:
        'حسب سياسات الجامعات النيوزيلندية (مثل Auckland / Otago / Canterbury): يدفع الرسوم المحلية المدعومة حكومياً مواطنو نيوزيلندا، والمقيمون الدائمون المقيمون في NZ أثناء الدراسة، ومواطنو/مقيمو أستراليا الدائمون المقيمون في نيوزيلندا أثناء الدراسة. الدخول عبر University Entrance / NCEA أو معادل أسترالي (مثل ATAR).',
      channelAr: 'تطبيق الجامعة مباشرة — مسار Domestic / University Entrance',
      docs: [
        'NCEA Level 3 أو ATAR/معادل أسترالي أو University Entrance',
        'إثبات جنسية نيوزيلندية أو أسترالية / إقامة',
        'إثبات الإقامة في نيوزيلندا أثناء الدراسة (لأستراليين والمقيمين)',
      ],
      feesAr: 'رسوم domestic مدعومة — أقل بكثير من الدولية.',
      visaAr: 'مواطن NZ: لا تأشيرة؛ أسترالي مقيم في NZ: وضع محلي للرسوم عند الإقامة أثناء الدراسة.',
      caveats: [
        'الأسترالي أو المقيم الدائم الذي يدرس عن بُعد من خارج نيوزيلندا يُعامل غالباً كدولي للرسوم.',
        'تحقق من تعريف domestic في Fees Policy لكل جامعة.',
      ],
      sources: [
        {
          label: 'University of Auckland — fee types',
          url: 'https://www.auckland.ac.nz/en/study/fees-and-money-matters/tuition-fees/paying-your-fees/fee-types-and-calculation.html',
        },
        {
          label: 'University of Otago — Australian domestic status',
          url: 'https://ask.otago.ac.nz/knowledgebase/article/KA-10000242',
        },
        {
          label: 'University of Canterbury — domestic tuition',
          url: 'https://www.canterbury.ac.nz/study/getting-started/study-and-living-costs/study-costs/domestic-tuition-fees',
        },
      ],
      portals: [],
      universities: [
        'University of Auckland',
        'University of Otago',
        'Victoria University of Wellington',
        'University of Canterbury',
      ],
    },
    {
      id: 'nz-international-fees-visa',
      titleAr: 'طالب دولي — رسوم دولية + Student Visa',
      match: () => true,
      whenAr:
        'من ليس ضمن فئة domestic يدفع رسوماً دولية غير مدعومة ويتقدم عادة عبر المسار الدولي للجامعة، مع إثبات إنجليزي وتمويل وStudent Visa للدراسة داخل نيوزيلندا. تحقق من تسجيل مقدم التعليم لدى NZQA.',
      channelAr: 'International Admissions للجامعة → عرض قبول → Student Visa',
      docs: [
        'جواز دولة ثالثة',
        'شهادة ثانوية معادلة / University Entrance معادل',
        'IELTS/TOEFL/PTE حسب البرنامج',
        'إثبات تمويل',
        'Student Visa',
      ],
      feesAr: 'رسوم دولية كاملة أعلى من domestic.',
      visaAr: 'Student Visa نيوزيلندية للدراسة الحضورية أطول من 3 أشهر عادة.',
      caveats: ['بعض برامج الدكتوراه قد تُسعَّر برسوم domestic حتى للطلاب الدوليين — تحقق من البرنامج.'],
      sources: [
        {
          label: 'University of Auckland admissions',
          url: 'https://www.auckland.ac.nz/en/study/applications-and-admissions.html',
        },
        { label: 'NZQA providers', url: 'https://www.nzqa.govt.nz/providers/index.do' },
      ],
      portals: [],
      universities: [
        'University of Auckland',
        'University of Otago',
        'Victoria University of Wellington',
        'University of Canterbury',
      ],
    },
  ],

  'اليونان': [
    {
      id: 'gr-eu-eea-swiss-greek-ug-free',
      titleAr: 'يوناني / EU-EEA / سويسرا — بكالوريوس يوناني مجاني + بلا تأشيرة',
      match: ({ nationality }) => nationality === 'اليونان' || isEuEea(nationality),
      whenAr:
        'حسب European Education Area وEurydice: مواطنو اليونان وEU/EEA وسويسرا لا يحتاجون تأشيرة طالب. البرامج الجامعية العامة باليونانية في الدورة الأولى غالباً بدون رسوم دراسية؛ البرامج بالإنجليزية والعديد من الماجستير قد تفرض رسوماً.',
      channelAr: 'تقديم الجامعة الإلكتروني (مستندات مترجمة لليونانية عند الطلب)',
      docs: [
        'شهادة ثانوية / معادل',
        'إثبات جنسية EU/EEA أو يونانية',
        'ترجمة يونانية معتمدة للمستندات إن لزم',
        'لغة يونانية للبرامج المجانية أو إنجليزية للبرامج الدولية',
      ],
      feesAr: 'بكالوريوس يوناني عام: بدون رسوم عادة؛ إنجليزي/ماجستير: رسوم حسب البرنامج.',
      visaAr: 'لا تأشيرة لـ EU/EEA/سويسرا.',
      caveats: [
        'Hellenic Open University والبرامج الأجنبية اللغة استثناءات رسومية.',
        'تحقق من كل برنامج: عدد البرامج الإنجليزية تجاوز 200.',
      ],
      sources: [
        {
          label: 'European Education Area — Study in Greece',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/greece',
        },
        {
          label: 'Eurydice — Greece national student fees',
          url: 'https://eurydice.eacea.ec.europa.eu/countries/greece/national-student-fee',
        },
      ],
      portals: [],
      universities: [
        'National and Kapodistrian University of Athens',
        'Aristotle University of Thessaloniki',
        'National Technical University of Athens',
        'University of Patras',
      ],
    },
    {
      id: 'gr-non-eu-visa-english-fees',
      titleAr: 'خارج EU/EEA — تأشيرة D + رسوم للبرامج الإنجليزية/الدولية',
      match: () => true,
      whenAr:
        'غير الأوروبيين يحتاجون تأشيرة طالب من نوع D ثم تصريح إقامة. حسب Eurydice قد تبقى الدورة الأولى باليونانية بدون رسوم حتى للدوليين، بينما البرامج باللغات الأجنبية تستهدف الدوليين وبرسوم. ملف European Education Area يذكر نطاقاً تقريباً €5000–€15000/سنة للبكالوريوس غير EU في المسارات المدفوعة.',
      channelAr: 'تقديم الجامعة → موافقة → تأشيرة D / إقامة طالب',
      docs: [
        'جواز دولة ثالثة',
        'قبول رسمي',
        'مستندات مترجمة ومصدّقة لليونانية',
        'إثبات تمويل وتأمين صحي',
        'تأشيرة D ثم تصريح إقامة',
      ],
      feesAr: 'يوناني عام (دورة أولى): غالباً مجاني؛ برامج إنجليزية/دولية: رسوم مؤسسية.',
      visaAr: 'تأشيرة طالب Type D + تصريح إقامة قبل/عند الوصول.',
      caveats: [
        'الجنسية تحدد التأشيرة بوضوح؛ الرسوم تتأثر بقوة بلغة البرنامج والمستوى.',
        'العمل بدوام جزئي لغير EU يتطلب تصريحاً إضافياً غالباً.',
      ],
      sources: [
        {
          label: 'European Education Area — Study in Greece',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/greece',
        },
        {
          label: 'Eurydice — Greece national student fees',
          url: 'https://eurydice.eacea.ec.europa.eu/countries/greece/national-student-fee',
        },
      ],
      portals: [],
      universities: [
        'National and Kapodistrian University of Athens',
        'Aristotle University of Thessaloniki',
        'National Technical University of Athens',
        'University of Patras',
      ],
    },
  ],

  'رومانيا': [
    {
      id: 'ro-eu-eea-swiss-same-as-romanian',
      titleAr: 'روماني / EU-EEA / سويسرا — نفس شروط المواطنين الرومانيين',
      match: ({ nationality }) => nationality === 'رومانيا' || isEuEea(nationality),
      whenAr:
        'حسب القانون الروماني وEuropean Education Area: مواطنو EU/EEA والاتحاد السويسري يتقدمون بنفس شروط المواطنين الرومانيين بما فيها الرسوم والمقاعد المموّلة حكومياً (حيث تُتاح). التقديم مباشرة للجامعة؛ لا تأشيرة طالب.',
      channelAr: 'تقديم مباشر للجامعة (نفس مسار المواطنين)',
      docs: [
        'شهادة ثانوية / معادل',
        'إثبات جنسية رومانية أو EU/EEA/سويسرا',
        'إثبات لغة رومانية أو إنجليزية/فرنسية/ألمانية حسب البرنامج',
      ],
      feesAr: 'نفس رسوم الرومانيين — مقاعد مدعومة بدون رسوم أو مقاعد برسوم محلية حسب النتيجة.',
      visaAr: 'لا تأشيرة؛ تسجيل لدى السلطات إن تجاوزت الإقامة 90 يوماً.',
      caveats: ['المواعيد والامتحانات تختلف بين الجامعات — راجع منهجية القبول السنوية.'],
      sources: [
        {
          label: 'European Education Area — Study in Romania',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/romania',
        },
        {
          label: 'Romanian embassy guidance — EU same conditions',
          url: 'https://brasilia.mae.ro/en/romania/300',
        },
      ],
      portals: [],
      universities: [
        'University of Bucharest',
        'Babeș-Bolyai University',
        'Politehnica University of Bucharest',
        'Alexandru Ioan Cuza University',
      ],
    },
    {
      id: 'ro-non-eu-foreign-currency-visa',
      titleAr: 'غير EU — رسوم بالعملة الأجنبية + تأشيرة طالب',
      match: () => true,
      whenAr:
        'غير الأوروبيين يدفعون عادة رسوماً بالعملة الأجنبية تحددها الجامعة (متوسط European Education Area ≈ €2000–€5000/سنة)، ويتقدمون مباشرة دون مسابقة المواطنين غالباً، ثم يطلبون تأشيرة طالب وتصريح إقامة. منح الحكومة الرومانية متاحة لفئات مختارة من غير EU.',
      channelAr: 'ملف الجامعة الدولي → خطاب قبول → تأشيرة طالب رومانية',
      docs: [
        'جواز دولة ثالثة',
        'كشف علامات ودبلوم',
        'إثبات لغة',
        'خطاب قبول',
        'تمويل وتأمين وسكن',
        'تأشيرة طالب ثم إقامة',
      ],
      feesAr: 'رسوم غير EU بالعملة الأجنبية حسب البرنامج (غالباً أعلى من مسار المواطنين).',
      visaAr: 'تأشيرة طالب من السفارة/القنصلية ثم تصريح إقامة بعد الوصول.',
      caveats: ['قد تُطلب سنة تحضيرية للرومانية في بعض المنح أو البرامج.'],
      sources: [
        {
          label: 'European Education Area — Study in Romania',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/romania',
        },
      ],
      portals: [],
      universities: [
        'University of Bucharest',
        'Babeș-Bolyai University',
        'Politehnica University of Bucharest',
        'Alexandru Ioan Cuza University',
      ],
    },
  ],

  'المجر': [
    {
      id: 'hu-hungarian-eu-eea-state-track',
      titleAr: 'مجري / EU-EEA — تسجيل إقامة + مسار مقاعد حكومية/ذاتية',
      match: ({ nationality }) => nationality === 'المجر' || isEuEea(nationality),
      whenAr:
        'حسب European Education Area وEurydice: مواطنو المجر وEU/EEA لا يحتاجون تأشيرة؛ يقيمون بشهادة تسجيل إن تجاوزت المدة 90 يوماً. يمكن التنافس على مقاعد ممولة حكومياً أو ذاتية التمويل حسب الأداء والقواعد الوطنية؛ التقديم مباشرة للجامعة. البرامج بالإنجليزية واسعة (مئات البرامج).',
      channelAr: 'تقديم مباشر للجامعة / felvi.hu للمسارات الوطنية',
      docs: [
        'شهادة ثانوية / معادل',
        'إثبات جنسية مجرية أو EU/EEA',
        'لغة مجرية أو إنجليزية حسب البرنامج',
        'اختبار قبول إن طلبه البرنامج',
      ],
      feesAr: 'مقاعد حكومية بدون رسوم دراسية عند الأهلية؛ وإلا رسوم ذاتية أرخص غالباً من مسار غير EU في بعض المؤسسات.',
      visaAr: 'لا تأشيرة؛ شهادة تسجيل إقامة لـ EU/EEA.',
      caveats: [
        'ليس كل البرامج الإنجليزية مجانية حتى للمجريين — التمويل الحكومي محدود وتنافسي.',
        'Stipendium Hungaricum منحة منفصلة تستهدف غالباً دولاً شريكة خارج EU.',
      ],
      sources: [
        {
          label: 'European Education Area — Study in Hungary',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/hungary',
        },
        {
          label: 'Eurydice — Hungary national student fees',
          url: 'https://eurydice.eacea.ec.europa.eu/countries/hungary/national-student-fee',
        },
        {
          label: 'Study in Hungary — tuition & funding',
          url: 'https://studyinhungary.hu/study-in-hungary/menu/studying-in-hungary/tuition-fees-and-funding-options.html',
        },
      ],
      portals: [],
      universities: [
        'Eötvös Loránd University (ELTE)',
        'Semmelweis University',
        'University of Debrecen',
        'Budapest University of Technology and Economics',
      ],
    },
    {
      id: 'hu-non-eu-self-funded-residence',
      titleAr: 'غير EU — تمويل ذاتي / منحة + تصريح إقامة للدراسة',
      match: () => true,
      whenAr:
        'غير الأوروبيين يتقدمون عادة كطلاب ذاتيي التمويل برسوم تحددها الجامعة (الطب وطب الأسنان أعلى)، أو عبر Stipendium Hungaricum عند الأهلية. يلزم تصريح إقامة للدراسة للإقامة أطول من 90 يوماً، غالباً عبر السفارة قبل الوصول.',
      channelAr: 'تقديم الجامعة أو منحة Stipendium Hungaricum → تصريح إقامة طالب',
      docs: [
        'جواز دولة ثالثة',
        'مؤهل سابق + لغة',
        'قبول أو منحة',
        'تمويل وتأمين',
        'تصريح إقامة للدراسة',
      ],
      feesAr: 'رسوم ذاتية حسب البرنامج؛ المنح الحكومية قد تغطي الرسوم والإقامة الجزئية.',
      visaAr: 'تأشيرة/تصريح إقامة للدراسة لغير EU حسب الجنسية ومدة الإقامة.',
      caveats: ['بعض الجامعات تسعر EU وغير EU بشكل مختلف؛ أكّد صفحة الرسوم للبرنامج.'],
      sources: [
        {
          label: 'European Education Area — Study in Hungary',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/hungary',
        },
        {
          label: 'Study in Hungary — tuition & funding',
          url: 'https://studyinhungary.hu/study-in-hungary/menu/studying-in-hungary/tuition-fees-and-funding-options.html',
        },
      ],
      portals: [],
      universities: [
        'Eötvös Loránd University (ELTE)',
        'Semmelweis University',
        'University of Debrecen',
        'Budapest University of Technology and Economics',
      ],
    },
  ],

  'سلوفاكيا': [
    {
      id: 'sk-eu-eea-same-as-slovak',
      titleAr: 'سلوفاكي / EU-EEA — نفس شروط المواطنين + بلا تأشيرة',
      match: ({ nationality }) => nationality === 'سلوفاكيا' || isEuEea(nationality),
      whenAr:
        'حسب European Education Area وIOM Slovakia: مواطنو EU/EEA يدرسون بنفس شروط السلوفاكيين وبلا تأشيرة. الدراسة بدوام كامل بالسلوفاكية في الجامعات العامة غالباً مجانية (ما لم تتجاوز المدة النظامية)؛ البرامج بالإنجليزية برسوم لكل الجنسيات.',
      channelAr: 'تقديم مباشر للكلية/الجامعة',
      docs: [
        'شهادة ثانوية / معادل',
        'إثبات جنسية سلوفاكية أو EU/EEA',
        'لغة سلوفاكية للبرامج المجانية أو إنجليزية للمدفوعة',
      ],
      feesAr: 'سلوفاكية بدوام كامل في العامة: غالباً مجانية؛ لغات أجنبية: ≈ €750–€11000/سنة حسب البرنامج.',
      visaAr: 'لا تأشيرة لـ EU/EEA.',
      caveats: [
        'الرسوم مرتبطة بلغة التدريس أكثر من الجنسية؛ التأشيرة تختلف بالجنسية.',
        'الجامعات الخاصة تحدد رسومها بحرية.',
      ],
      sources: [
        {
          label: 'European Education Area — Slovakia',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/slovakia',
        },
        {
          label: 'IOM MIC — studying at a university in Slovakia',
          url: 'https://mic.iom.sk/en/news/894-studying-at-a-university-in-slovakia.html',
        },
      ],
      portals: [],
      universities: [
        'Comenius University Bratislava',
        'Slovak University of Technology in Bratislava',
        'Pavol Jozef Šafárik University in Košice',
        'Technical University of Košice',
      ],
    },
    {
      id: 'sk-non-eu-visa-language-fees',
      titleAr: 'غير EU — تأشيرة/إقامة + سلوفاكية مجانية أو إنجليزية برسوم',
      match: () => true,
      whenAr:
        'غير الأوروبيين يحتاجون غالباً تأشيرة/تصريح إقامة (قد تستغرق 2–4 أشهر). شروط الرسوم في العامة مماثلة: سلوفاكية بدوام كامل مجانية عادة، وإنجليزية برسوم بغض النظر عن الجنسية. التقديم للكلية مباشرة مع إثبات تمويل وتأمين.',
      channelAr: 'تقديم الجامعة → قبول → تأشيرة/إقامة طالب',
      docs: [
        'جواز دولة ثالثة',
        'قبول',
        'إثبات لغة',
        'تمويل وتأمين صحي',
        'تأشيرة/إقامة طالب',
      ],
      feesAr: 'سلوفاكية عامة بدوام كامل: غالباً مجانية؛ أجنبية: رسوم مؤسسية.',
      visaAr: 'تأشيرة/إقامة لغير EU حسب الجنسية ومدة الإقامة.',
      caveats: ['لا تفترض أن «دولي = رسوم دائماً» في سلوفاكيا — لغة البرنامج حاسمة.'],
      sources: [
        {
          label: 'European Education Area — Slovakia',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/slovakia',
        },
      ],
      portals: [],
      universities: [
        'Comenius University Bratislava',
        'Slovak University of Technology in Bratislava',
        'Pavol Jozef Šafárik University in Košice',
        'Technical University of Košice',
      ],
    },
  ],

  'كرواتيا': [
    {
      id: 'hr-eu-subsidised-same-as-croatian',
      titleAr: 'كرواتي / EU — دعم رسوم كالمواطنين + studij.hr',
      match: ({ nationality }) => nationality === 'كرواتيا' || isEuEea(nationality),
      whenAr:
        'حسب gov.hr الرسمي: طلاب EU بدوام كامل لهم نفس حقوق الوصول والدعم الرسوم كما المواطنين الكرواتيين (بما فيها دعم الوجبات). التقديم للبكالوريوس عبر النظام المركزي Postani student / studij.hr.',
      channelAr: 'Postani student (studij.hr) أو تقديم الجامعة للدرجات العليا',
      docs: [
        'شهادة ثانوية',
        'إثبات جنسية كرواتية أو EU',
        'لغة كرواتية أو إنجليزية حسب البرنامج',
      ],
      feesAr: 'دعم رسوم حكومي للدوام الكامل ضمن الحصص المؤهلة — نفس معاملة المواطنين.',
      visaAr: 'لا تأشيرة لـ EU/EEA.',
      caveats: ['بعد السنة الأولى قد تُطبَّق رسوم وفق نموذج الإنجاز/النقاط حسب القانون المحلي.'],
      sources: [
        {
          label: 'gov.hr — international students in Croatia',
          url: 'https://gov.hr/en/international-students-studying-in-croatia/1078',
        },
        {
          label: 'European Education Area — Croatia',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/croatia',
        },
        { label: 'studij.hr', url: 'https://www.studij.hr/' },
      ],
      portals: [],
      universities: [
        'University of Zagreb',
        'University of Split',
        'University of Rijeka',
        'University of Osijek',
      ],
    },
    {
      id: 'hr-third-country-quota-fees-visa',
      titleAr: 'دول ثالثة — حصص أجانب + رسوم مؤسسية + تأشيرة',
      match: () => true,
      whenAr:
        'حسب gov.hr: طلاب الدول الثالثة يلتحقون ضمن حصص الأجانب ويدفعون رسوماً تحددها المؤسسة، ثم يحتاجون تأشيرة طالب وتصريح إقامة مؤقت. Study in Croatia يذكر نطاقاً تقريباً €1000–€12000 حسب التخصص.',
      channelAr: 'تقديم الجامعة / studij.hr → تأشيرة طالب → إقامة مؤقتة',
      docs: [
        'جواز دولة ثالثة',
        'قبول ضمن حصة أجانب',
        'إثبات تمويل وتأمين',
        'تأشيرة طالب ثم تصريح إقامة',
      ],
      feesAr: 'رسوم يحددها الـHEI (غالباً أعلى من مسار EU المدعوم).',
      visaAr: 'تأشيرة طالب قبل الوصول + إقامة مؤقتة للدراسة.',
      caveats: ['قدّم مبكراً لإفساح وقت التأشيرة.'],
      sources: [
        {
          label: 'gov.hr — international students in Croatia',
          url: 'https://gov.hr/en/international-students-studying-in-croatia/1078',
        },
        {
          label: 'Study in Croatia — tuition',
          url: 'https://www.studyincroatia.hr/study-in-croatia/tuition-fees-and-scholarships/',
        },
      ],
      portals: [],
      universities: [
        'University of Zagreb',
        'University of Split',
        'University of Rijeka',
        'University of Osijek',
      ],
    },
  ],

  'بلغاريا': [
    {
      id: 'bg-eu-eea-swiss-home-fees',
      titleAr: 'بلغاري / EU-EEA / سويسرا — رسوم المواطنين + بلا تأشيرة',
      match: ({ nationality }) => nationality === 'بلغاريا' || isEuEea(nationality),
      whenAr:
        'حسب Eurydice وجامعات بلغارية رسمية (مثل صوفيا/روسه): مواطنو EU/EEA/سويسرا يدفعون رسوم المواطنين في المؤسسات الحكومية ويتقدمون وفق قواعد المواطن الأوروبي. لا تأشيرة طالب.',
      channelAr: 'تقديم الجامعة — مسار EU / مواطنين',
      docs: [
        'شهادة ثانوية',
        'إثبات جنسية بلغارية أو EU/EEA/سويسرا',
        'لغة بلغارية أو إنجليزية حسب البرنامج',
      ],
      feesAr: 'رسوم مواطنين أقل من مسار غير EU (تحددها الحكومة/الجامعة سنوياً).',
      visaAr: 'لا تأشيرة لـ EU/EEA/سويسرا.',
      caveats: ['البرامج بالإنجليزية للأجانب قد تبقى برسوم أعلى حتى لبعض المسارات — أكّد جدول الرسوم.'],
      sources: [
        {
          label: 'European Education Area — Bulgaria',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/bulgaria',
        },
        {
          label: 'Eurydice — Bulgaria higher education funding',
          url: 'https://eurydice.eacea.ec.europa.eu/eurypedia/bulgaria/higher-education-funding',
        },
        {
          label: 'University of Ruse — annual tuition (EU = Bulgarian rates)',
          url: 'https://www.uni-ruse.bg/en/directorates/FSD/annual-tuition-fees',
        },
      ],
      portals: [],
      universities: [
        'Sofia University St. Kliment Ohridski',
        'Technical University of Sofia',
        'Medical University of Sofia',
        'Plovdiv University',
      ],
    },
    {
      id: 'bg-non-eu-higher-fees-visa-d',
      titleAr: 'غير EU — رسوم أجانب أعلى + تأشيرة D وإقامة',
      match: () => true,
      whenAr:
        'غير الأوروبيين يتقدمون كطلاب دوليين برسوم أعلى (لا تقل عن الحد الأدنى القانوني للصيانة في الحكومية)، ويحتاجون تأشيرة Type D ثم تصريح إقامة من مديرية الهجرة، مع تسجيل العنوان خلال 5 أيام من الوصول.',
      channelAr: 'مسار دولي للجامعة → تأشيرة D → تصريح إقامة',
      docs: [
        'جواز دولة ثالثة',
        'دبلوم وكشف علامات',
        'إثبات لغة / سنة تحضيرية إن لزم',
        'شهادة طبية',
        'تمويل وتأمين',
        'تأشيرة D وإقامة',
      ],
      feesAr: 'رسوم أجانب أعلى من رسوم EU/المواطنين حسب التخصص.',
      visaAr: 'تأشيرة Type D + تصريح إقامة (Migration Directorate).',
      caveats: ['حاملو جنسية مزدوجة بينها بلغارية قد يدفعون نسبة مخفّضة في بعض الجامعات.'],
      sources: [
        {
          label: 'European Education Area — Bulgaria',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/bulgaria',
        },
        {
          label: 'University of Ruse — annual tuition fees',
          url: 'https://www.uni-ruse.bg/en/directorates/FSD/annual-tuition-fees',
        },
      ],
      portals: [],
      universities: [
        'Sofia University St. Kliment Ohridski',
        'Technical University of Sofia',
        'Medical University of Sofia',
        'Plovdiv University',
      ],
    },
  ],

  'سلوفينيا': [
    {
      id: 'si-eu-eea-swiss-free-fulltime',
      titleAr: 'سلوفيني / EU-EEA / سويسرا — دوام كامل بدون رسوم دراسية',
      match: ({ nationality }) => nationality === 'سلوفينيا' || isEuEea(nationality),
      whenAr:
        'حسب Study in Slovenia وUniversity of Ljubljana: مواطنو سلوفينيا وEU وسويسرا والنرويج وآيسلندا وليختنشتاين معفيون من الرسوم الدراسية للبكالوريوس/الماجستير بدوام كامل في المؤسسات المموّلة من الميزانية العامة. التقديم عبر بوابة eVŠ.',
      channelAr: 'بوابة eVŠ / تقديم الجامعة',
      docs: [
        'شهادة ثانوية / معادل',
        'إثبات جنسية سلوفينية أو EU/EEA/سويسرا',
        'لغة سلوفينية أو إنجليزية حسب البرنامج',
      ],
      feesAr: 'بدون رسوم دراسية للدوام الكامل في الدورة الأولى/الثانية ضمن الأهلية؛ الجزئي والدكتوراه عادة برسوم.',
      visaAr: 'تسجيل إقامة إن تجاوزت المدة 90 يوماً — بلا تأشيرة طالب وطنية.',
      caveats: [
        'مواطنو دول غرب البلقان ذات الاتفاق الثنائي (صربيا، البوسنة، الجبل الأسود، كوسوفو، شمال مقدونيا) معفيون أيضاً غالباً.',
        'من أكمل درجة معادلة مسبقاً أو يدرس جزئياً قد يدفع رسوماً حتى لو كان من EU.',
      ],
      sources: [
        {
          label: 'Study in Slovenia — tuition and funding',
          url: 'https://studyinslovenia.si/study/tuition-and-funding/',
        },
        {
          label: 'University of Ljubljana — tuition exemptions',
          url: 'https://www.uni-lj.si/en/study/tuition-fees-and-other-study-contributions',
        },
        {
          label: 'European Education Area — Slovenia',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/slovenia',
        },
      ],
      portals: [],
      universities: [
        'University of Ljubljana',
        'University of Maribor',
        'University of Primorska',
        'University of Nova Gorica',
      ],
    },
    {
      id: 'si-non-eu-tuition-residence',
      titleAr: 'دول ثالثة — رسوم دراسية + تصريح إقامة',
      match: () => true,
      whenAr:
        'غير الأوروبيين (ما عدا الاستثناءات الثنائية) يدفعون عادة رسوماً للبكالوريوس/الماجستير بدوام كامل ويحتاجون تصريح إقامة للدراسة مع تمويل وتأمين وسكن. النطاق التقريبي €2000–€15000 حسب البرنامج.',
      channelAr: 'eVŠ / الجامعة → تصريح إقامة طالب',
      docs: [
        'جواز دولة ثالثة',
        'قبول',
        'تمويل وتأمين صحي',
        'إثبات سكن',
        'تصريح إقامة',
      ],
      feesAr: 'رسوم دراسية مؤسسية للدورات الأولى/الثانية بدوام كامل عادة.',
      visaAr: 'تصريح إقامة للدراسة (سفارة أو وحدة إدارية) — قد يستغرق أسابيع/أشهراً.',
      caveats: ['تحقق إن كانت جنسيتك ضمن اتفاق غرب البلقان للإعفاء.'],
      sources: [
        {
          label: 'Study in Slovenia — tuition and funding',
          url: 'https://studyinslovenia.si/study/tuition-and-funding/',
        },
        {
          label: 'European Education Area — Slovenia',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/slovenia',
        },
      ],
      portals: [],
      universities: [
        'University of Ljubljana',
        'University of Maribor',
        'University of Primorska',
        'University of Nova Gorica',
      ],
    },
  ],

  'إستونيا': [
    {
      id: 'ee-eu-eea-register-dreamapply',
      titleAr: 'إستوني / EU-EEA — تسجيل إقامة + DreamApply (إستونية مجانية غالباً)',
      match: ({ nationality }) => nationality === 'إستونيا' || isEuEea(nationality),
      whenAr:
        'حسب وزارة التعليم الإستونية وEurydice: الدراسة بدوام كامل باللغة الإستونية بدون رسوم دراسية بغض النظر عن الجنسية عند استيفاء التقدم الأكاديمي. مواطنو EU/EEA يسجّلون الإقامة خلال 3 أشهر بلا تأشيرة. البرامج بالإنجليزية برسوم عبر DreamApply؛ بعض المؤسسات تفرّق رسوم EU/غير EU.',
      channelAr: 'DreamApply / بوابة الجامعة',
      docs: [
        'شهادة ثانوية',
        'إثبات جنسية إستونية أو EU/EEA',
        'لغة إستونية للبرامج المجانية أو إنجليزية للمدفوعة',
      ],
      feesAr: 'إستونية بدوام كامل: مجانية عادة؛ إنجليزية: ≈ €1500–€15000؛ الدكتوراه بدون رسوم.',
      visaAr: 'لا تأشيرة؛ تسجيل إقامة خلال 3 أشهر.',
      caveats: [
        'الرسوم للإنجليزية قد تختلف بين EU وغير EU حسب الجامعة.',
        'التقدم الأكاديمي (مثل 75% من المنهج) قد يُشترط للإبقاء على المجانية.',
      ],
      sources: [
        {
          label: 'Estonian Ministry — higher education free in Estonian',
          url: 'https://www.hm.ee/en/education-research-and-youth-affairs/general-education/higher-education',
        },
        {
          label: 'Eurydice — Estonia national student fees',
          url: 'https://eurydice.eacea.ec.europa.eu/countries/estonia/national-student-fee',
        },
        { label: 'Study in Estonia — tuition fees', url: 'https://www.studyinestonia.ee/tuition-fees' },
      ],
      portals: [],
      universities: [
        'University of Tartu',
        'Tallinn University of Technology',
        'Tallinn University',
        'Estonian University of Life Sciences',
      ],
    },
    {
      id: 'ee-non-eu-visa-english-fees',
      titleAr: 'غير EU — تأشيرة D / إقامة + رسوم للبرامج الإنجليزية',
      match: () => true,
      whenAr:
        'غير الأوروبيين يحتاجون تأشيرة طويلة D أو تصريح إقامة مؤقت للدراسة قبل الوصول. البرامج الإستونية بدوام كامل تبقى غالباً مجانية حتى للدوليين (Eurydice)، بينما الإنجليزية برسوم وقد تكون أعلى لغير EU في بعض الجامعات.',
      channelAr: 'DreamApply → قبول → تأشيرة D / إقامة مؤقتة',
      docs: [
        'جواز دولة ثالثة',
        'قبول',
        'إثبات لغة وتمويل وتأمين وسكن',
        'تأشيرة D أو تصريح إقامة للدراسة',
      ],
      feesAr: 'إستونية مجانية غالباً؛ إنجليزية برسوم (قد تفرّق الجامعة بين EU وغير EU).',
      visaAr: 'تأشيرة D أو إقامة مؤقتة للدراسة ثم تسجيل العنوان.',
      caveats: ['الدكتوراه بدون رسوم دراسية لجميع الجنسيات حسب Study in Estonia.'],
      sources: [
        { label: 'Study in Estonia — tuition fees', url: 'https://www.studyinestonia.ee/tuition-fees' },
        {
          label: 'European Education Area — Estonia',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/estonia',
        },
        {
          label: 'Eurydice — Estonia national student fees',
          url: 'https://eurydice.eacea.ec.europa.eu/countries/estonia/national-student-fee',
        },
      ],
      portals: [],
      universities: [
        'University of Tartu',
        'Tallinn University of Technology',
        'Tallinn University',
        'Estonian University of Life Sciences',
      ],
    },
  ],

  'ليتوانيا': [
    {
      id: 'lt-eu-eea-state-funded-lama-bpo',
      titleAr: 'ليتواني / EU-EEA — مقاعد ممولة حكومياً عبر LAMA BPO',
      match: ({ nationality }) => nationality === 'ليتوانيا' || isEuEea(nationality),
      whenAr:
        'حسب Study in Lithuania وRenkuosi Lietuvą: مواطنو ليتوانيا وEU/EEA مؤهلون للتقدم لمقاعد ممولة من الدولة (بدون رسوم عند القبول عليها) عبر القبول العام LAMA BPO. بلا تأشيرة طالب.',
      channelAr: 'LAMA BPO (قبول عام) أو تقديم الجامعة للمقاعد غير المموّلة',
      docs: [
        'شهادة ثانوية',
        'إثبات جنسية ليتوانية أو EU/EEA',
        'لغة ليتوانية أو إنجليزية حسب البرنامج',
      ],
      feesAr: 'مقاعد حكومية بدون رسوم عند الأهلية؛ وإلا رسوم من ≈ €1300/سنة للبكالوريوس.',
      visaAr: 'لا تأشيرة لـ EU/EEA.',
      caveats: ['المقاعد المموّلة تنافسية؛ عدم الحصول عليها يعني دفع الرسوم كمسار ذاتي.'],
      sources: [
        { label: 'Study in Lithuania — tuition fees', url: 'https://studyin.lt/how-to-apply/tuition-fees/' },
        {
          label: 'Renkuosi Lietuvą — EU/EEA state-funded places',
          url: 'https://www.renkuosilietuva.lt/en/create-pdf/548',
        },
        {
          label: 'European Education Area — Lithuania',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/lithuania',
        },
      ],
      portals: [],
      universities: [
        'Vilnius University',
        'Kaunas University of Technology',
        'Vilnius Gediminas Technical University',
        'Vytautas Magnus University',
      ],
    },
    {
      id: 'lt-non-eu-self-funded-visa',
      titleAr: 'غير EU — تمويل ذاتي عادة + تأشيرة وطنية وإقامة',
      match: () => true,
      whenAr:
        'غير الأوروبيين يتقدمون عادة مباشرة للجامعة/الكلية بتمويل ذاتي ويدفعون الرسوم، مع تأشيرة وطنية وتصريح إقامة مؤقت قبل القدوم. منح ماجستير حكومية متاحة لدول مختارة؛ الدكتوراه قد تُموَّل حكومياً حتى لغير EU.',
      channelAr: 'تقديم الجامعة/الكلية مباشرة → تأشيرة وطنية + إقامة مؤقتة',
      docs: [
        'جواز دولة ثالثة',
        'اعتراف/تقييم مؤهل (SKVC) عند الطلب',
        'لغة ليتوانية أو إنجليزية',
        'تمويل وتأمين',
        'تأشيرة وطنية وإقامة',
      ],
      feesAr: 'رسوم ذاتية من ≈ €1300 (بكالوريوس) و≈ €2300 (ماجستير) فما فوق حسب البرنامج.',
      visaAr: 'تأشيرة وطنية + تصريح إقامة مؤقت لغير EU/EEA.',
      caveats: ['مسار LAMA BPO للمقاعد الحكومية مخصص أساساً لـ EU/EEA والليتوانيين والمؤهلين الآخرين.'],
      sources: [
        { label: 'Study in Lithuania — tuition fees', url: 'https://studyin.lt/how-to-apply/tuition-fees/' },
        {
          label: 'Renkuosi Lietuvą — non-EU nationals',
          url: 'https://www.renkuosilietuva.lt/en/create-pdf/549',
        },
      ],
      portals: [],
      universities: [
        'Vilnius University',
        'Kaunas University of Technology',
        'Vilnius Gediminas Technical University',
        'Vytautas Magnus University',
      ],
    },
  ],

  'لاتفيا': [
    {
      id: 'lv-eu-eea-same-fee-rules',
      titleAr: 'لاتفي / EU-EEA — نفس إجراءات رسوم المواطنين + بلا تأشيرة',
      match: ({ nationality }) => nationality === 'لاتفيا' || isEuEea(nationality),
      whenAr:
        'حسب وكالة تطوير التعليم الحكومية (VIAA): رسوم مواطني الاتحاد الأوروبي وأبنائهم تُحدَّد وتُغطى بنفس إجراءات مواطني لاتفيا والمقيمين الدائمين. يمكن التنافس على مقاعد ممولة من الميزانية أو مقاعد ذاتية. بلا تأشيرة طالب.',
      channelAr: 'تقديم الجامعة مباشرة — مسار EU/مواطنين',
      docs: [
        'شهادة ثانوية',
        'إثبات جنسية لاتفية أو EU/EEA',
        'لغة لاتفية أو إنجليزية حسب البرنامج',
      ],
      feesAr: 'مقاعد حكومية بدون رسوم عند القبول عليها؛ وإلا رسوم محلية (غالباً أقل من متوسط غير EU).',
      visaAr: 'لا تأشيرة لـ EU/EEA/سويسرا.',
      caveats: [
        'المقاعد المموّلة محدودة وتنافسية — عدم الفوز بها يعني دفع الرسوم.',
        'Eurydice/OECD: متوسط رسوم غير EU أعلى بكثير من مسار EU.',
      ],
      sources: [
        {
          label: 'VIAA — education system (EU fee procedure)',
          url: 'https://www.viaa.gov.lv/en/education-system',
        },
        {
          label: 'Eurydice — Latvia higher education funding',
          url: 'https://eurydice.eacea.ec.europa.eu/eurypedia/latvia/higher-education-funding',
        },
        {
          label: 'European Education Area — Latvia',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/latvia',
        },
      ],
      portals: [],
      universities: [
        'University of Latvia',
        'Riga Technical University',
        'Rīga Stradiņš University',
        'Latvia University of Life Sciences and Technologies',
      ],
    },
    {
      id: 'lv-non-eu-higher-fees-visa',
      titleAr: 'غير EU — رسوم أعلى عادة + دعوة جامعية وتأشيرة/إقامة',
      match: () => true,
      whenAr:
        'غير الأوروبيين يدفعون عادة رسوماً أعلى ويتقدمون للجامعة ثم يحصلون على رقم دعوة للتأشيرة/تصريح الإقامة عبر السفارة. European Education Area يذكر نطاقاً من أقل من €1600 حتى €15000+ للطب/الأسنان.',
      channelAr: 'تقديم الجامعة → دعوة OCMA → تأشيرة/إقامة طالب',
      docs: [
        'جواز دولة ثالثة',
        'قبول واتفاقية دراسة',
        'رقم دعوة من الجامعة',
        'تمويل وتأمين',
        'تأشيرة أو تصريح إقامة',
      ],
      feesAr: 'رسوم دولية حسب البرنامج (متوسط أعلى من مسار EU حسب Eurydice/OECD).',
      visaAr: 'تأشيرة/إقامة عبر السفارة بعد دعوة الجامعة — إجراءات تختلف حسب بلد الإقامة.',
      caveats: ['منح الدولة اللاتفية متاحة لمواطني دول شريكة محددة فقط غالباً.'],
      sources: [
        {
          label: 'European Education Area — Latvia',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/latvia',
        },
        {
          label: 'Eurydice — Latvia higher education funding',
          url: 'https://eurydice.eacea.ec.europa.eu/eurypedia/latvia/higher-education-funding',
        },
      ],
      portals: [],
      universities: [
        'University of Latvia',
        'Riga Technical University',
        'Rīga Stradiņš University',
        'Latvia University of Life Sciences and Technologies',
      ],
    },
  ],

  'مالطا': [
    {
      id: 'mt-eu-eea-home-fees',
      titleAr: 'مالطي / EU-EEA — رسوم Home Students + بلا تأشيرة',
      match: ({ nationality }) => nationality === 'مالطا' || isEuEea(nationality),
      whenAr:
        'حسب جامعة مالطا ولوائح الرسوم: مواطنو EU/EEA يُصنَّفون Home Students برسوم أدنى من الدوليين. بلا تأشيرة؛ تسجيل إقامة إن تجاوزت المدة 90 يوماً. الإنجليزية لغة التدريس الأساسية.',
      channelAr: 'تقديم الجامعة الإلكتروني — مسار EU/Home',
      docs: [
        'شهادة ثانوية',
        'إثبات جنسية مالطية أو EU/EEA',
        'إثبات إنجليزي عند الطلب',
      ],
      feesAr: 'رسوم Home/EU أقل من Non-EU؛ تختلف حسب البرنامج والمستوى.',
      visaAr: 'لا تأشيرة لـ EU/EEA.',
      caveats: ['تحقق من صفحة كل برنامج: الجامعة تعرض رسوم EU مقابل non-EU.'],
      sources: [
        {
          label: 'European Education Area — Malta',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/malta',
        },
        {
          label: 'University of Malta — fees policy (Home = EU/EEA)',
          url: 'https://www.um.edu.mt/__data/assets/pdf_file/0004/431545/FeesPolicyGuidelines1.pdf',
        },
      ],
      portals: [],
      universities: [
        'University of Malta',
        'Malta College of Arts, Science and Technology (MCAST)',
        'Institute of Tourism Studies',
        'American University of Malta',
      ],
    },
    {
      id: 'mt-non-eu-higher-fees-d-visa',
      titleAr: 'غير EU/EEA — رسوم دولية أعلى + تأشيرة D وإقامة إلكترونية',
      match: () => true,
      whenAr:
        'غير الأوروبيين يدفعون رسوم Non-EU (مثال جامعة مالطا: تقريباً €8500 لبرامج الآداب/الأعمال و€10800 للعلوم الجامعية حسب الجداول المنشورة). يلزم تأشيرة طالب طويلة D قبل السفر، ثم e-Residence Permit للدراسة سنة فأكثر.',
      channelAr: 'تقديم الجامعة → قبول → تأشيرة D → e-Residence',
      docs: [
        'جواز دولة ثالثة',
        'قبول',
        'إثبات تمويل وتأمين صحي خاص',
        'تأشيرة D ثم تصريح إقامة إلكتروني',
      ],
      feesAr: 'رسوم Non-EU أعلى بوضوح من Home/EU حسب البرنامج.',
      visaAr: 'تأشيرة Student D قبل السفر + e-Residence بعد الوصول.',
      caveats: ['العمل لغير EU محدود غالباً بـ 20 ساعة/أسبوع بعد الحصول على الإقامة.'],
      sources: [
        {
          label: 'European Education Area — Malta',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/malta',
        },
        {
          label: 'University of Malta — Non-EU tuition fees schedule',
          url: 'https://www.um.edu.mt/__data/assets/pdf_file/0009/363186/FeesNonEUStudents.pdf',
        },
      ],
      portals: [],
      universities: [
        'University of Malta',
        'Malta College of Arts, Science and Technology (MCAST)',
        'Institute of Tourism Studies',
        'American University of Malta',
      ],
    },
  ],

  'لوكسمبورغ': [
    {
      id: 'lu-eu-eea-swiss-flexible-docs',
      titleAr: 'لوكسمبورغي / EU-EEA / سويسرا — رسوم موحّدة + تقديم مرن أكثر',
      match: ({ nationality }) => nationality === 'لوكسمبورغ' || isEuEea(nationality),
      whenAr:
        'حسب University of Luxembourg: لا رسوم منفصلة للطلاب الدوليين (≈ €400/فصل لمعظم البرامج). متقدمو EU/EEA/سويسرا يمكنهم التقديم بشرط لاحق للشهادة/معادلة الثانوية، بلا تأشيرة طالب؛ تسجيل إقامة إن تجاوزت 90 يوماً.',
      channelAr: 'منصة قبول University of Luxembourg',
      docs: [
        'شهادة ثانوية أو قبول مشروط',
        'معادلة الثانوية لوزارة التعليم عند الطلب (يمكن لاحقاً لـ EU)',
        'إثبات لغات البرنامج (فرنسية/ألمانية/إنجليزية حسب التخصص)',
      ],
      feesAr: 'رسوم برنامج موحّدة تقريباً €400/فصل لمعظم البرامج + رسوم تقديم ≈ €100.',
      visaAr: 'لا تأشيرة؛ تسجيل إقامة بعد 90 يوماً.',
      caveats: [
        'الجنسية لا تغيّر مبلغ الرسوم عادة، لكنها تغيّر صرامة مواعيد المعادلة والتأشيرة.',
        'تكلفة المعيشة مرتفعة (≈ €1500+/شهر كحد أدنى إرشادي).',
      ],
      sources: [
        {
          label: 'University of Luxembourg — admission criteria (EU vs third country)',
          url: 'https://www.uni.lu/en/admissions/admission-criteria/',
        },
        {
          label: 'European Education Area — Luxembourg',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/luxembourg',
        },
      ],
      portals: [],
      universities: [
        'University of Luxembourg',
        'Luxembourg School of Business',
        'Sacred Heart University Luxembourg',
      ],
    },
    {
      id: 'lu-third-country-equivalence-ast',
      titleAr: 'دول ثالثة — معادلة قبل الموعد + AST / إقامة + رسوم موحّدة',
      match: () => true,
      whenAr:
        'لمتقدمي الدول الثالثة على البكالوريوس: يجب تقديم معادلة الشهادة الثانوية لوزارة التعليم قبل موعد التقديم (لا قبول مشروط كـ EU). الرسوم الدراسية نفسها تقريباً، لكن يلزم تصريح إقامة مؤقت (AST) وتمويل أعلى للمعيشة والتأمين الاجتماعي.',
      channelAr: 'معادلة الثانوية → منصة uni.lu → AST / إقامة طالب',
      docs: [
        'جواز دولة ثالثة',
        'معادلة الثانوية قبل الموعد (بكالوريوس)',
        'قبول',
        'إثبات تمويل وسكن وتأمين',
        'تصريح إقامة مؤقت (AST)',
      ],
      feesAr: 'نفس رسوم البرنامج تقريباً (لا تسعير منفصل لغير EU) + تكاليف تأمين اجتماعي أعلى غالباً.',
      visaAr: 'تصريح/تأشيرة إقامة طالب للدول الثالثة قبل/عند الوصول حسب القواعد.',
      caveats: [
        'إجراء المعادلة قد يستغرق 6 أسابيع على الأقل — ابدأ مبكراً.',
        'للماجستير قد يُطلب تسجيل المؤهل في Register of Titles بعد القبول.',
      ],
      sources: [
        {
          label: 'University of Luxembourg — admission criteria',
          url: 'https://www.uni.lu/en/admissions/admission-criteria/',
        },
        {
          label: 'European Education Area — Luxembourg',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/luxembourg',
        },
      ],
      portals: [],
      universities: [
        'University of Luxembourg',
        'Luxembourg School of Business',
        'Sacred Heart University Luxembourg',
      ],
    },
  ],

  'قبرص': [
    {
      id: 'cy-eu-gov-covers-ug-greek',
      titleAr: 'قبرصي / EU — الحكومة تغطي رسوم البكالوريوس العام (يوناني)',
      match: ({ nationality }) => nationality === 'قبرص' || isEuEea(nationality),
      whenAr:
        'حسب وزارة التعليم القبرصية وجامعة التكنولوجيا القبرصية (CUT): مواطنو قبرص وEU لا يدفعون رسوم البكالوريوس في الجامعات العامة للبرامج باليونانية — تغطيها حكومة الجمهورية (€3417/سنة تُحسب لكن تدفعها الدولة). يدفعون للبرامج باللغات الأجنبية وللماجستير. بلا تأشيرة طالب.',
      channelAr: 'تقديم الجامعة العامة / وزارة التعليم العالي',
      docs: [
        'شهادة ثانوية',
        'إثبات جنسية قبرصية أو EU',
        'لغة يونانية للبرامج المغطاة حكومياً أو إنجليزية للبرامج الأجنبية',
      ],
      feesAr: 'بكالوريوس يوناني عام: مغطى حكومياً لـ EU؛ أجنبي اللغة وماجستير: رسوم حسب البرنامج.',
      visaAr: 'لا تأشيرة لـ EU/EEA.',
      caveats: [
        'Open University of Cyprus (تعليم عن بُعد) استثناء وقد تفرض رسوماً حتى على EU.',
        'الجامعات الخاصة لها جداول رسوم مستقلة.',
      ],
      sources: [
        {
          label: 'Cyprus DHE — fees and financial support',
          url: 'https://highereducation.ac.cy/en/spoudes-cyprus/oikonomikes-paroches',
        },
        {
          label: 'Cyprus University of Technology — tuition',
          url: 'https://www.cut.ac.cy/students/practical-information/tuition-and-fees/?languageId=1',
        },
        {
          label: 'University of Cyprus — international students fees',
          url: 'https://www.ucy.ac.cy/aasw/studies/undergraduate-studies/international_students/?lang=en',
        },
      ],
      portals: [],
      universities: [
        'University of Cyprus',
        'Cyprus University of Technology',
        'Open University of Cyprus',
        'University of Nicosia',
        'European University Cyprus',
      ],
    },
    {
      id: 'cy-non-eu-pay-ug-entry-permit',
      titleAr: 'غير EU — رسوم بكالوريوس كاملة + تصريح دخول/إقامة',
      match: () => true,
      whenAr:
        'غير الأوروبيين يدفعون رسوم البكالوريوس كاملة في العامة (≈ €6834/سنة حسب CUT وUCY ووزارة التعليم). يلزم غالباً دفع عربون/قسط أول لتأمين تصريح الدخول إلى قبرص، ثم إقامة طالب.',
      channelAr: 'تقديم الجامعة → دفع عربون غير EU → تصريح دخول/إقامة',
      docs: [
        'جواز دولة ثالثة',
        'قبول',
        'إثبات تمويل وتأمين',
        'عربون/قسط أول عند الطلب',
        'تصريح دخول وإقامة طالب',
      ],
      feesAr: 'بكالوريوس عام ≈ €6834/سنة لغير EU؛ ماجستير غالباً بنفس نطاق الرسوم بغض النظر عن الجنسية في بعض البرامج.',
      visaAr: 'تصريح دخول/إقامة طالب لغير EU — ابدأ مبكراً بعد القبول.',
      caveats: ['الماجستير في العامة غالباً برسوم لجميع الجنسيات؛ الفرق الأكبر في البكالوريوس.'],
      sources: [
        {
          label: 'Cyprus DHE — fees and financial support',
          url: 'https://highereducation.ac.cy/en/spoudes-cyprus/oikonomikes-paroches',
        },
        {
          label: 'Cyprus University of Technology — tuition',
          url: 'https://www.cut.ac.cy/students/practical-information/tuition-and-fees/?languageId=1',
        },
      ],
      portals: [],
      universities: [
        'University of Cyprus',
        'Cyprus University of Technology',
        'University of Nicosia',
        'European University Cyprus',
      ],
    },
  ],

  'آيسلندا': [
    {
      id: 'is-eea-efta-registration-only',
      titleAr: 'آيسلندي / EEA-EFTA / سويسرا — رسوم تسجيل فقط بلا تأشيرة',
      match: ({ nationality }) => nationality === 'آيسلندا' || isEuEea(nationality),
      whenAr:
        'حسب European Education Area وجامعة آيسلندا: الجامعات العامة لا تفرض رسوماً دراسية تقليدية بل رسوم تسجيل/إدارة سنوية (≈ 100,000 ISK في UI). مواطنو EEA/EFTA/سويسرا بلا تأشيرة؛ يسجّلون الإقامة إن تجاوزت 90 يوماً. لا تُفرض عليهم رسوم معالجة الطلب الخاصة بغير EEA.',
      channelAr: 'تقديم الجامعة مباشرة (Application Portal)',
      docs: [
        'شهادة ثانوية / درجة سابقة',
        'إثبات جنسية آيسلندية أو EEA/EFTA/سويسرا',
        'لغة آيسلندية أو إنجليزية حسب البرنامج',
      ],
      feesAr: 'رسوم تسجيل سنوية (ليست tuition تقليدية) ≈ €600–€800 إرشادياً / 100,000 ISK في UI.',
      visaAr: 'لا تأشيرة؛ تسجيل إقامة بعد 90 يوماً.',
      caveats: ['المعيشة مرتفعة جداً (≈ €1300–€1900/شهر).'],
      sources: [
        {
          label: 'European Education Area — Iceland',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/iceland',
        },
        {
          label: 'University of Iceland — university fees',
          url: 'https://english.hi.is/study/apply/university-fees',
        },
      ],
      portals: [],
      universities: [
        'University of Iceland',
        'Reykjavík University',
        'University of Akureyri',
        'Iceland University of the Arts',
      ],
    },
    {
      id: 'is-non-eea-processing-residence-future-tuition',
      titleAr: 'خارج EEA/EFTA — رسوم معالجة + إقامة طالب (+ tuition محتمل من 2027)',
      match: () => true,
      whenAr:
        'غير الأوروبيين يدفعون رسوم معالجة طلب (≈ 20,000 ISK / €135 في UI) إضافة لرسوم التسجيل، ويحتاجون تصريح إقامة للدراسة من مديرية الهجرة بعد القبول. الحكومة أذنت بفرض رسوم دراسية على غير EEA/EFTA/سويسرا اعتباراً من خريف 2027؛ من يبدأ في خريف 2026 لا يخضع لها حسب إعلان الجامعة.',
      channelAr: 'تقديم الجامعة → قبول → تصريح إقامة (Directorate of Immigration)',
      docs: [
        'جواز دولة ثالثة',
        'قبول',
        'رسوم معالجة الطلب',
        'تمويل وتأمين صحي',
        'تصريح إقامة طالب',
      ],
      feesAr: 'رسوم معالجة لغير EEA + رسوم تسجيل سنوية؛ tuition لغير EEA قد يبدأ لملتحقي 2027+.',
      visaAr: 'تصريح إقامة للدراسة (وقد تلزم تأشيرة دخول حسب الجنسية) قبل السفر غالباً.',
      caveats: [
        'مواعيد الهجرة ضيقة — خصوصاً لفصل الربيع.',
        'الدكتوراه معفاة من tuition المستقبلي حسب إعلان UI؛ حاملو إقامة دائمة أيضاً.',
      ],
      sources: [
        {
          label: 'University of Iceland — university fees',
          url: 'https://english.hi.is/study/apply/university-fees',
        },
        {
          label: 'European Education Area — Iceland',
          url: 'https://education.ec.europa.eu/study-in-europe/country-profiles/iceland',
        },
      ],
      portals: [],
      universities: [
        'University of Iceland',
        'Reykjavík University',
        'University of Akureyri',
        'Iceland University of the Arts',
      ],
    },
  ],

  'ليختنشتاين': [
    {
      id: 'li-eu-eea-swiss-matura-chf950',
      titleAr: 'ليختنشتايني / EU-EEA / سويسرا / Matura أوروبية — CHF 950',
      match: ({ nationality, residenceCountry, qualificationCountry }) =>
        nationality === 'ليختنشتاين' ||
        isEuEea(nationality) ||
        residenceCountry === 'ليختنشتاين' ||
        isEuEea(qualificationCountry) ||
        qualificationCountry === 'سويسرا',
      whenAr:
        'حسب لائحة الرسوم في Universität Liechtenstein: CHF 950/فصل لمواطني EU/EEA وسويسرا، ولحملة إقامة دائمة/استقرار في ليختنشتاين، ولمن حصل على شهادة الثانوية (Matura) من دولة EU/EEA أو سويسرا. بلا تأشيرة لـ EU/EEA/سويسرا.',
      channelAr: 'تقديم Universität Liechtenstein مباشرة (+ رسوم معالجة قبول CHF 100 لأول مرة)',
      docs: [
        'شهادة ثانوية / Matura معادلة',
        'إثبات جنسية EU/EEA/سويسرا أو إقامة ليختنشتاين أو Matura من EU/EEA/سويسرا',
        'لغة ألمانية أو إنجليزية حسب البرنامج',
        'رسوم معالجة قبول CHF 100 إن لم يسبق التسجيل',
      ],
      feesAr: 'CHF 950/فصل دراسي (منها CHF 10 لاتحاد الطلبة) + رسوم إدارية عند القبول.',
      visaAr: 'لا تأشيرة لـ EU/EEA/سويسرا؛ تسجيل إقامة إن تجاوزت المدة القصيرة.',
      caveats: [
        'المعيشة ≈ CHF 1,500/شهر حسب تقدير الجامعة.',
        'التأمين الصحي إلزامي بعد 3 أشهر — EHIC قد يكفي لمواطني EU.',
      ],
      sources: [
        {
          label: 'University of Liechtenstein — study costs & funding',
          url: 'https://www.uni.li/en/studies/plan-your-studies/study-costs-und-funding',
        },
        {
          label: 'University of Liechtenstein — application & admission',
          url: 'https://uni.li/en/studies/application-and-admission',
        },
      ],
      portals: [],
      universities: [
        'University of Liechtenstein',
        'Private University in the Principality of Liechtenstein (UFL)',
      ],
    },
    {
      id: 'li-third-country-chf1250-visa',
      titleAr: 'دول ثالثة — CHF 1,250/فصل + تأشيرة/إقامة عبر القناة السويسرية',
      match: () => true,
      whenAr:
        'من لا يستوفي معايير EU/EEA/سويسرا أو الإقامة الدائمة أو Matura الأوروبية يدفع CHF 1,250/فصل. غير الأوروبيين يحتاجون عادة تأشيرة وطنية/إقامة للدراسة تُعالَج عبر تمثيل سويسرا لأن ليختنشتاين في منطقة شنغن عبر اتفاقات مع سويسرا.',
      channelAr: 'تقديم الجامعة → قبول → تأشيرة/إقامة (سفارة/قنصلية سويسرا المختصة)',
      docs: [
        'جواز دولة ثالثة',
        'قبول الجامعة',
        'إثبات تمويل وتأمين',
        'رسوم معالجة قبول CHF 100',
        'طلب تأشيرة/إقامة طالب',
      ],
      feesAr: 'CHF 1,250/فصل + رسوم قبول إدارية؛ معيشة ≈ CHF 1,500/شهر.',
      visaAr: 'تأشيرة/تصريح إقامة طالب عبر القناة السويسرية لغير EU/EEA.',
      caveats: ['مواعيد الهجرة أطول من مواعيد القبول الأكاديمي — ابدأ مبكراً.'],
      sources: [
        {
          label: 'University of Liechtenstein — study costs & funding',
          url: 'https://www.uni.li/en/studies/plan-your-studies/study-costs-und-funding',
        },
        {
          label: 'University of Liechtenstein — application & admission',
          url: 'https://uni.li/en/studies/application-and-admission',
        },
      ],
      portals: [],
      universities: [
        'University of Liechtenstein',
        'Private University in the Principality of Liechtenstein (UFL)',
      ],
    },
  ],

  'جورجيا': [
    {
      id: 'ge-citizen-une-state-grant',
      titleAr: 'مواطن جورجي — الامتحانات الوطنية الموحدة + منح الدولة',
      match: ({ nationality }) => nationality === 'جورجيا',
      whenAr:
        'حسب Ilia State University وNAEC: المواطن الجورجي يلتحق بالبكالوريوس عبر الامتحانات الوطنية الموحدة (Unified National Examinations). الرسوم الرسمية في الجامعات العامة ≈ 2250 GEL/سنة، وقد تكون بعض البرامج ممولة بالكامل من الدولة حسب نتيجة الامتحان واختيار البرنامج.',
      channelAr: 'التسجيل في الامتحانات الوطنية الموحدة (NAEC) → اختيار الجامعة/البرنامج',
      docs: [
        'شهادة ثانوية جورجية',
        'تسجيل وامتحان وطني موحد',
        'اختيار رغبات البرامج',
        'وثائق الهوية الجورجية',
      ],
      feesAr: '≈ 2250 GEL/سنة في العامة كحد مرجعي؛ منح دولة كاملة/جزئية حسب النتيجة والبرنامج.',
      visaAr: 'لا تأشيرة للمواطن الجورجي.',
      caveats: [
        'البرامج بالإنجليزية والطب قد تكون برسوم مختلفة حتى للمواطنين.',
        'القبول عبر الامتحان الوطني مسار منفصل عن القبول الدولي المباشر.',
      ],
      sources: [
        {
          label: 'Ilia State University — tuition & funding',
          url: 'https://admissions.iliauni.edu.ge/en/tuition-fees-and-funding-opportunities/',
        },
        {
          label: 'Batumi State University — tuition fees',
          url: 'https://www.bsu.edu.ge/sub-34/page/1902/index.html?lang=en',
        },
      ],
      portals: [],
      universities: [
        'Ivane Javakhishvili Tbilisi State University',
        'Ilia State University',
        'Georgian Technical University',
        'Batumi Shota Rustaveli State University',
        'Caucasus University',
      ],
    },
    {
      id: 'ge-international-direct-usd-visa',
      titleAr: 'طالب أجنبي — قبول مباشر بالدولار + إقامة طالب',
      match: () => true,
      whenAr:
        'الأجانب لا يدخلون عادة عبر الامتحانات الوطنية الموحدة؛ يتقدمون مباشرة للجامعة بمسار دولي برسوم بالدولار (غالباً ≈ $2,500–$6,000+/سنة حسب البرنامج؛ الطب أعلى). يلزم تأمين صحي وإثبات تمويل وإقامة طالب عبر Agency of Migration.',
      channelAr: 'تقديم الجامعة الدولي مباشرة → قبول → إقامة طالب',
      docs: [
        'جواز أجنبي',
        'شهادة ثانوية معادلة/مترجمة',
        'إثبات لغة إنجليزية أو جورجية حسب البرنامج',
        'تأمين صحي',
        'إثبات تمويل',
        'طلب إقامة طالب',
      ],
      feesAr: 'رسوم دولية بالدولار حسب الجامعة/البرنامج (مرجع شائع $2,500–$6,000+؛ الطب أعلى).',
      visaAr: 'إقامة طالب / تأشيرة دراسة حسب الجنسية — عبر وكالة الهجرة الجورجية بعد القبول.',
      caveats: [
        'جداول الرسوم تختلف كثيراً بين العامة والخاصة وبين الطب وغير الطب.',
        'لا تفترض أن منحة الدولة الجورجية تنطبق على الأجانب.',
      ],
      sources: [
        {
          label: 'Ilia State University — tuition & funding',
          url: 'https://admissions.iliauni.edu.ge/en/tuition-fees-and-funding-opportunities/',
        },
        {
          label: 'International Black Sea University — tuition',
          url: 'https://ibsu.edu.ge/en/entrant/tuition-fees/',
        },
        {
          label: 'SEU Georgia — international admission guidelines',
          url: 'https://seu.edu.ge/',
        },
      ],
      portals: [],
      universities: [
        'Ivane Javakhishvili Tbilisi State University',
        'Ilia State University',
        'Georgian Technical University',
        'Caucasus University',
        'International Black Sea University',
        'Georgian American University',
      ],
    },
  ],

  'تايلاند': [
    {
      id: 'th-thai-tcas-lower-university-fee',
      titleAr: 'مواطن تايلاندي — TCAS / رسوم جامعية أدنى',
      match: ({ nationality }) => nationality === 'تايلاند',
      whenAr:
        'حسب Chulalongkorn University: الطلاب التايلانديون يلتحقون بالبرامج التايلاندية عبر نظام القبول المركزي TCAS (مجلس رؤساء الجامعات). حتى في بعض البرامج الدولية يبقى مكوّن «رسوم الجامعة» أدنى للمواطن التايلاندي من الأجنبي (مثال JIPP: 26,500 مقابل 82,700 بات/فصل لرسوم الجامعة).',
      channelAr: 'TCAS للبرامج التايلاندية / تقديم البرنامج الدولي مع جدول رسوم Thai',
      docs: [
        'شهادة Mathayom 6 أو معادل تايلاندي',
        'تسجيل TCAS أو تقديم البرنامج',
        'اختبارات القبول الوطنية/الجامعية حسب المسار',
        'هوية تايلاندية',
      ],
      feesAr: 'رسوم Thai (جامعة + برنامج) أدنى غالباً من جدول Foreign في البرامج الدولية.',
      visaAr: 'لا تأشيرة طالب للمواطن التايلاندي.',
      caveats: [
        'البرامج الدولية لها جولات Early/Admission منفصلة وقد تشترط إنجليزية/SAT حتى للتايلانديين.',
        'تحقق من جدول Thai مقابل Foreign لكل برنامج.',
      ],
      sources: [
        {
          label: 'Chulalongkorn — undergraduate admissions',
          url: 'https://www.chula.ac.th/en/academics/admissions/undergraduate-admission/',
        },
        {
          label: 'Chula Faculty of Psychology JIPP — Thai vs Non-Thai fees',
          url: 'https://www.psy.chula.ac.th/en/undergraduate/jipp/overview/',
        },
        {
          label: 'Chula Registrar — international tuition groups',
          url: 'https://www.reg.chula.ac.th/admissions/english/',
        },
      ],
      portals: [],
      universities: [
        'Chulalongkorn University',
        'Mahidol University',
        'Thammasat University',
        'Chiang Mai University',
        'King Mongkut\'s University of Technology Thonburi',
      ],
    },
    {
      id: 'th-non-thai-intl-higher-fee-ed-visa',
      titleAr: 'غير تايلاندي — قبول دولي + رسوم Foreign + تأشيرة ED',
      match: () => true,
      whenAr:
        'غير التايلانديين يتقدمون لمسارات دولية بمتطلبات لغة/اختبارات (IELTS/TOEFL/SAT/CU-AAT…) وجدول رسوم Foreign أعلى لرسوم الجامعة. بعد القبول يلزم غالباً تأشيرة Non-Immigrant ED وإقامة طالب؛ شهادة الثانوية الأجنبية قد تحتاج معادلة من الجامعة (مثل HSCES في Chula).',
      channelAr: 'تقديم البرنامج الدولي مباشرة → قبول → تأشيرة ED / إقامة',
      docs: [
        'جواز غير تايلاندي',
        'شهادة ثانوية + معادلة إن طُلبت',
        'إثبات إنجليزي واختبارات قبول',
        'تمويل',
        'تأشيرة ED / تصريح إقامة طالب',
      ],
      feesAr: 'جدول Foreign — مثال Chula JIPP: رسوم جامعة 82,700 بات/فصل للأجنبي مقابل 26,500 للتايلاندي (+ رسوم البرنامج).',
      visaAr: 'تأشيرة Non-Immigrant ED ثم تمديد/إقامة طالب داخل تايلاند.',
      caveats: [
        'بعض الإعلانات تفصل University Fee وProgram Fee حسب الجنسية صراحة.',
        'لا تعتمد جدول Thai إذا كنت أجنبياً.',
      ],
      sources: [
        {
          label: 'Chulalongkorn — undergraduate admissions',
          url: 'https://www.chula.ac.th/en/academics/admissions/undergraduate-admission/',
        },
        {
          label: 'Chula Faculty of Psychology JIPP — Thai vs Non-Thai fees',
          url: 'https://www.psy.chula.ac.th/en/undergraduate/jipp/overview/',
        },
        {
          label: 'Chula Registrar — international tuition',
          url: 'https://www.reg.chula.ac.th/admissions/english/',
        },
      ],
      portals: [],
      universities: [
        'Chulalongkorn University',
        'Mahidol University',
        'Thammasat University',
        'Chiang Mai University',
        'King Mongkut\'s University of Technology Thonburi',
        'Assumption University',
      ],
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

/** Compare how two nationalities are routed for the same study destination. */
export function compareNationalityTracks(studyCountry, nationalityA, nationalityB) {
  const a = resolveNationalityTrack({ studyCountry, nationality: nationalityA });
  const b = resolveNationalityTrack({ studyCountry, nationality: nationalityB });
  if (!a || !b) return null;
  return {
    studyCountry,
    sameTrack: a.id === b.id,
    a: { nationality: nationalityA, id: a.id, titleAr: a.titleAr, channelAr: a.channelAr },
    b: { nationality: nationalityB, id: b.id, titleAr: b.titleAr, channelAr: b.channelAr },
    principleAr:
      a.id === b.id
        ? 'نفس تصنيف المسار تقريباً — تحقق مع ذلك من الرسوم والإقامة وبلد الشهادة.'
        : 'مساران مختلفان لنفس دولة الدراسة بسبب اختلاف الجنسية — هذا متوقع حسب القواعد الرسمية.',
  };
}

/** Example alternate nationality to demonstrate the split in the UI. */
export function exampleAlternateNationality(studyCountry, currentNationality) {
  if (!studyCountry) return 'الأردن';
  if (currentNationality !== studyCountry) return studyCountry;
  const alts = {
    ألمانيا: 'الأردن',
    فرنسا: 'الأردن',
    هولندا: 'مصر',
    'المملكة المتحدة': 'الأردن',
    كندا: 'الأردن',
    'الولايات المتحدة': 'الأردن',
    الأردن: 'مصر',
    السعودية: 'مصر',
    تركيا: 'الأردن',
    الإمارات: 'الأردن',
    مصر: 'الأردن',
    أيرلندا: 'الأردن',
    الهند: 'الأردن',
    أستراليا: 'الأردن',
    قطر: 'الأردن',
    الصين: 'الأردن',
    المغرب: 'الأردن',
    سويسرا: 'الأردن',
    'كوريا الجنوبية': 'الأردن',
    اليابان: 'الأردن',
    الجزائر: 'الأردن',
    'جنوب أفريقيا': 'الأردن',
    ماليزيا: 'الأردن',
    سنغافورة: 'الأردن',
    نيجيريا: 'الأردن',
    كينيا: 'الأردن',
    البرازيل: 'الأردن',
    السويد: 'الأردن',
    إيطاليا: 'الأردن',
    النمسا: 'الأردن',
    إسبانيا: 'الأردن',
    بلجيكا: 'الأردن',
    النرويج: 'الأردن',
    البرتغال: 'الأردن',
    فنلندا: 'الأردن',
    الدنمارك: 'الأردن',
    بولندا: 'الأردن',
    التشيك: 'الأردن',
    نيوزيلندا: 'الأردن',
    اليونان: 'الأردن',
    رومانيا: 'الأردن',
    المجر: 'الأردن',
    سلوفاكيا: 'الأردن',
    كرواتيا: 'الأردن',
    بلغاريا: 'الأردن',
    سلوفينيا: 'الأردن',
    إستونيا: 'الأردن',
    ليتوانيا: 'الأردن',
    لاتفيا: 'الأردن',
    مالطا: 'الأردن',
    لوكسمبورغ: 'الأردن',
    قبرص: 'الأردن',
    آيسلندا: 'الأردن',
    ليختنشتاين: 'الأردن',
    جورجيا: 'الأردن',
    تايلاند: 'الأردن',
  };
  return alts[studyCountry] || 'الأردن';
}

/** Side-by-side citizen vs alternate nationality for every researched destination. */
export function nationalityMatrixRows() {
  return Object.keys(DESTINATION_TRACKS).map((destination) => {
    const citizen = resolveNationalityTrack({
      studyCountry: destination,
      nationality: destination,
      applicantType: 'local',
    });
    const otherNationality = exampleAlternateNationality(destination, destination);
    const other = resolveNationalityTrack({
      studyCountry: destination,
      nationality: otherNationality,
      applicantType: 'international',
    });
    return {
      destination,
      trackCount: (DESTINATION_TRACKS[destination] || []).length,
      citizen: {
        nationality: destination,
        id: citizen.id,
        titleAr: citizen.titleAr,
        channelAr: citizen.channelAr,
      },
      other: {
        nationality: otherNationality,
        id: other.id,
        titleAr: other.titleAr,
        channelAr: other.channelAr,
      },
      differs: citizen.id !== other.id,
    };
  });
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
      'https://www.tcd.ie/academicregistry/fees-and-payments/eu-eligibility-fees/',
      'https://admission.study-in-egypt.gov.eg/',
      'https://www.mohesr.gov.ae/en/EServices/ServiceCard/pages/napo.aspx',
      'https://www.studyinindia.gov.in/',
      'https://www.qu.edu.qa/en-us/students/admission/undergraduate/admission-requirements/Pages/high-school-applicants.aspx',
      'https://www.swissuniversities.ch/en/topics/studying/admission-to-universities',
      'https://www.amci.ma/',
      'https://www.studyinkorea.go.kr/',
      'https://www.studyinjapan.go.jp/',
      'https://studyinalgeria.dz/pages/17155',
      'https://mb.usaf.ac.za/',
      'https://efacility.jamb.gov.ng/',
      'https://kuccps.net/Placem',
      'https://www.gov.br/mre/en/subjects/culture-and-education/educational-themes/study-opportunities-for-international-applicants/pec-g/about-the-program',
      'https://www.gov.br/mec/pt-br/sisu',
      'https://www.universityadmissions.se/',
      'https://www.uhr.se/en/start/laws-and-regulations/Laws-and-regulations/Ordinance-on-application-fees-and-tuition-fees-at-higher-education-institutions/',
      'https://www.universitaly.it/studenti-stranieri',
      'https://studyinaustria.at/en/tuition',
      'https://unedasiss.uned.es/faqs%26idioma%3Den',
      'https://www.belgium.be/en/education/coming_to_study_in_belgium',
      'https://education.ec.europa.eu/study-in-europe/countries/belgium/flanders',
      'https://studyinnorway.no/cost-and-requirements',
      'http://wwwcdn.dges.gov.pt/en/pagina/international-students',
      'https://dges.gov.pt/en/pagina/non-eu-students?plid=1531',
      'https://www.studyinfinland.fi/funding-your-studies/fees-and-cost-living',
      'https://studyinfo.fi/',
      'https://studyindenmark.dk/study-options/tuition-fees-and-scholarships',
      'https://study.gov.pl/tuition-fees',
      'https://study.gov.pl/define-your-status',
      'https://www.studyin.cz/plan-your-studies/tuition-fees/',
      'https://www.auckland.ac.nz/en/study/fees-and-money-matters/tuition-fees/paying-your-fees/fee-types-and-calculation.html',
      'https://ask.otago.ac.nz/knowledgebase/article/KA-10000242',
      'https://www.canterbury.ac.nz/study/getting-started/study-and-living-costs/study-costs/domestic-tuition-fees',
      'https://education.ec.europa.eu/study-in-europe/country-profiles/greece',
      'https://eurydice.eacea.ec.europa.eu/countries/greece/national-student-fee',
      'https://education.ec.europa.eu/study-in-europe/country-profiles/romania',
      'https://education.ec.europa.eu/study-in-europe/country-profiles/hungary',
      'https://studyinhungary.hu/study-in-hungary/menu/studying-in-hungary/tuition-fees-and-funding-options.html',
      'https://education.ec.europa.eu/study-in-europe/country-profiles/slovakia',
      'https://mic.iom.sk/en/news/894-studying-at-a-university-in-slovakia.html',
      'https://gov.hr/en/international-students-studying-in-croatia/1078',
      'https://education.ec.europa.eu/study-in-europe/country-profiles/croatia',
      'https://education.ec.europa.eu/study-in-europe/country-profiles/bulgaria',
      'https://www.uni-ruse.bg/en/directorates/FSD/annual-tuition-fees',
      'https://studyinslovenia.si/study/tuition-and-funding/',
      'https://www.uni-lj.si/en/study/tuition-fees-and-other-study-contributions',
      'https://www.studyinestonia.ee/tuition-fees',
      'https://eurydice.eacea.ec.europa.eu/countries/estonia/national-student-fee',
      'https://studyin.lt/how-to-apply/tuition-fees/',
      'https://www.renkuosilietuva.lt/en/create-pdf/548',
      'https://www.viaa.gov.lv/en/education-system',
      'https://eurydice.eacea.ec.europa.eu/eurypedia/latvia/higher-education-funding',
      'https://education.ec.europa.eu/study-in-europe/country-profiles/malta',
      'https://www.um.edu.mt/__data/assets/pdf_file/0009/363186/FeesNonEUStudents.pdf',
      'https://www.uni.lu/en/admissions/admission-criteria/',
      'https://education.ec.europa.eu/study-in-europe/country-profiles/luxembourg',
      'https://highereducation.ac.cy/en/spoudes-cyprus/oikonomikes-paroches',
      'https://www.cut.ac.cy/students/practical-information/tuition-and-fees/?languageId=1',
      'https://www.ucy.ac.cy/aasw/studies/undergraduate-studies/international_students/?lang=en',
      'https://english.hi.is/study/apply/university-fees',
      'https://education.ec.europa.eu/study-in-europe/country-profiles/iceland',
    ],
  };
}
