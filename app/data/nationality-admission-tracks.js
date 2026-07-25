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
    ],
  };
}
