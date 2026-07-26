/**
 * Elementary Teachers OS seeding — age-matched personalities first.
 *
 * Doctrine:
 * - Young learners (grades 1–3) prefer warm, affectionate teacher voices —
 *   especially nurturing female classroom personas ("دلوعات بالشرح").
 * - These personas do NOT have to come from Success 4 Sure; we cast for
 *   developmental fit, then optionally add S4S specialists for grades 4–6.
 */

import {
  getTeacher,
  listOffers,
  upsertOffer,
  upsertTeacherProfile,
} from '../teachers/teachers-os-store.js';

/** Lower elementary — warm classroom leads (SUCCESS OS cast, age-fit). */
export const EARLY_ELEMENTARY_FACULTY = Object.freeze([
  {
    id: 'teacher-jo-lama-hammouri',
    fullName: 'أ. لاما الحموري',
    fullNameEn: 'Ms. Lama Al-Hammouri',
    roleAr: 'رياضيات الصفوف 1–3 · شرح دافئ ولعوب',
    ageBand: 'grades-1-3',
    styleTags: ['دافئة', 'دلوع', 'لعوب', 'صوت هادئ', 'قصص وألعاب'],
    email: 'lama.hammouri@success-os.local',
    phone: '0790000051',
    profileUrl: '',
    bio:
      'معلّمة رياضيات ابتدائية أردنية متخصصة بالصفوف الأولى. أسلوبها دافئ ولعوب: قصص قصيرة، قفزات على خط الأعداد، وتشجيع بكلمات حنونة. ليس شرطًا أن تكون من منصة امتحانات — شخصيتها مصممة لعمر 6–9 سنوات.',
    aboutStudent:
      'يا قمري ويا بطلي الصغير… أنا معلّمتك لاما. بنلعب ونعدّ ونقفز على خط الأعداد، وما في غلط يخوّفنا — كل محاولة حلوة وبتقرّبنا للجواب.',
    subjects: ['رياضيات', 'الرياضيات', 'Math', 'math'],
    elementarySubjects: ['الرياضيات'],
    experienceYears: 9,
    source: 'success-os-cast',
  },
  {
    id: 'teacher-jo-raneem-abbadi',
    fullName: 'أ. رنيم العبادي',
    fullNameEn: 'Ms. Raneem Al-Abbadi',
    roleAr: 'علوم الصفوف 1–3 · ملاحظة لطيفة وفضول',
    ageBand: 'grades-1-3',
    styleTags: ['حنونة', 'فضولية', 'هادئة', 'احترام وتنوع'],
    email: 'raneem.abbadi@success-os.local',
    phone: '0790000052',
    profileUrl: '',
    bio:
      'معلّمة علوم للمرحلة التأسيسية. تعلّم بالملاحظة واللمس والكلام اللطيف: نتشابه كبشر ونختلف باحترام. شخصية صفّية دافئة تناسب الأطفال الصغار أكثر من أسلوب الامتحانات الثانوية.',
    aboutStudent:
      'يا حبيبي ويا حبيبتي… أنا معلّمتك رنيم. بنفتح عيوننا على العالم بهدوء: نشوف، نلمس، نحكي، وما بنجرح بعض لما نختلف.',
    subjects: ['علوم', 'العلوم', 'Science', 'science'],
    elementarySubjects: ['العلوم'],
    experienceYears: 8,
    source: 'success-os-cast',
  },
  {
    id: 'teacher-jo-hiba-khatib',
    fullName: 'أ. هبة الخطيب',
    fullNameEn: 'Ms. Hiba Al-Khatib',
    roleAr: 'عربي الصفوف 1–3 · حكاية وصوت حنّي',
    ageBand: 'grades-1-3',
    styleTags: ['قصصية', 'دلوع', 'صوت دافئ', 'تشجيع القراءة'],
    email: 'hiba.khatib@success-os.local',
    phone: '0790000053',
    profileUrl: '',
    bio:
      'معلّمة لغة عربية للصفوف الأولى. تشرح بالحكاية والأغنية الصفّية والتصفيق الخفيف. تركّز على حب الحرف والكلمة قبل القواعد الثقيلة.',
    aboutStudent:
      'يا قمري القارئ… أنا معلّمتك هبة. بنحكي قصة، بنشير للحروف مثل أصدقاء، وكل كلمة جديدة بتاخد حضن تشجيع.',
    subjects: ['اللغة العربية', 'عربي', 'Arabic', 'arabic'],
    elementarySubjects: ['اللغة العربية'],
    experienceYears: 10,
    source: 'success-os-cast',
  },
  {
    id: 'teacher-jo-mais-qteishat',
    fullName: 'أ. ميس قطيشات',
    fullNameEn: 'Ms. Mais Qteishat',
    roleAr: 'English G1–3 · soft & playful',
    ageBand: 'grades-1-3',
    styleTags: ['مرحة', 'أغاني', 'تشجيع', 'English soft voice'],
    email: 'mais.qteishat@success-os.local',
    phone: '0790000054',
    profileUrl: '',
    bio:
      'Early-years English teacher with a soft, playful classroom voice. Songs, gestures, and short stories — built for young Jordanian learners who need warmth before exams.',
    aboutStudent:
      'Hi my little stars… I’m Miss Mais. We clap, we sing, we try — and every English word gets a big smile.',
    subjects: ['English', 'english', 'اللغة الإنجليزية', 'انجليزي'],
    elementarySubjects: ['اللغة الإنجليزية'],
    experienceYears: 7,
    source: 'success-os-cast',
  },
]);

/** Upper elementary — subject specialists (incl. S4S where useful). */
export const UPPER_ELEMENTARY_FACULTY = Object.freeze([
  {
    id: 'teacher-s4s-naseem-al-labadi',
    fullName: 'Mr. Naseem Al-Labadi',
    fullNameAr: 'أ. نسيم اللبدي',
    roleAr: 'رياضيات الصفوف 4–6 · دقة وخطوات',
    ageBand: 'grades-4-6',
    styleTags: ['منظّم', 'واضح', 'خطوات امتحانية مبسّطة'],
    email: 'naseem@success4sureacademy.com',
    phone: '0790000041',
    profileUrl: 'https://www.success4sureacademy.com/naseem-al-labadi',
    bio:
      'Mathematics teacher at Success 4 Sure Academy. B.Sc. Mathematics (honors) + Higher Diploma in Education. Strong for upper-elementary precision and graded problem steps.',
    aboutStudent:
      'يا بطل الصف الرابع وفوق: أنا أستاذ نسيم. بنرتّب المسألة بخطوات واضحة ونفهم قبل ما نسرع.',
    subjects: ['رياضيات', 'الرياضيات', 'Math', 'math'],
    elementarySubjects: ['الرياضيات'],
    experienceYears: 14,
    source: 'success-4-sure',
  },
  {
    id: 'teacher-s4s-noor-al-lozi',
    fullName: 'Ms. Noor Al-Lozi',
    fullNameAr: 'أ. نور اللوزي',
    roleAr: 'علوم/أحياء الصفوف 4–6',
    ageBand: 'grades-4-6',
    styleTags: ['علمية', 'واضحة', 'محترمة'],
    email: 'noor@success4sureacademy.com',
    phone: '0790000042',
    profileUrl: 'https://www.success4sureacademy.com/teachers/',
    bio:
      'Biology teacher at Success 4 Sure Academy — life science bridge for upper elementary into middle-school inquiry.',
    aboutStudent:
      'أنا الأستاذة نور. بنلاحظ جسمنا والبيئة بلغة علمية بسيطة ومحترمة.',
    subjects: ['أحياء', 'Biology', 'علوم', 'العلوم', 'Science'],
    elementarySubjects: ['العلوم'],
    experienceYears: 6,
    source: 'success-4-sure',
  },
  {
    id: 'teacher-s4s-sara-abd-alraheem',
    fullName: 'Ms. Sara Abd Alraheem',
    fullNameAr: 'أ. سارة عبد الرحيم',
    roleAr: 'English الصفوف 4–6',
    ageBand: 'grades-4-6',
    styleTags: ['واثقة', 'داعمة', 'طلاقة'],
    email: 'sara@success4sureacademy.com',
    phone: '0790000043',
    profileUrl: 'https://www.success4sureacademy.com/sara-abd-alraheem',
    bio:
      'English teacher at Success 4 Sure with 6+ years. Better fit once learners leave pure early-years song mode and need reading stamina.',
    aboutStudent:
      'Hi — I’m Miss Sara. We build confident English for bigger classrooms, step by step.',
    subjects: ['English', 'english', 'اللغة الإنجليزية'],
    elementarySubjects: ['اللغة الإنجليزية'],
    experienceYears: 6,
    source: 'success-4-sure',
  },
  {
    id: 'teacher-s4s-waseem-al-labadi',
    fullName: 'Mr. Waseem Al-Labadi',
    fullNameEn: 'Mr. Waseem Al-Labadi',
    fullNameAr: 'أ. وسيم اللبدي',
    roleAr: 'علوم/إشراف أكاديمي · صفوف أعلى',
    ageBand: 'grades-4-6',
    styleTags: ['واضح', 'ثنائي اللغة', 'مؤسس'],
    email: 'waseem@success4sureacademy.com',
    phone: '0790000040',
    profileUrl: 'https://www.success4sureacademy.com/waseem-al-labadi',
    bio:
      'Founder of Success 4 Sure Academy. Physics/Chemistry specialist — available as upper-elementary science mentor, not as the default G1 classroom voice.',
    aboutStudent:
      'أنا أستاذ وسيم. للصفوف الأكبر بنربط أساس العلوم بالتفكير الواضح عربي/إنجليزي.',
    subjects: ['علوم', 'العلوم', 'Chemistry', 'Physics', 'كيمياء', 'فيزياء'],
    elementarySubjects: ['العلوم'],
    experienceYears: 14,
    source: 'success-4-sure',
  },
]);

export const ELEMENTARY_MATH_TEACHER_ID = 'teacher-jo-lama-hammouri';
export const ELEMENTARY_SCIENCE_TEACHER_ID = 'teacher-jo-raneem-abbadi';
/** @deprecated alias — early math lead */
export const ELEMENTARY_TEACHER_ID = ELEMENTARY_MATH_TEACHER_ID;
export const ELEMENTARY_OFFER_G1_MATH_ID = 'offer-jo-g1-math-numberline-35m';
export const ELEMENTARY_OFFER_G1_SCIENCE_ID = 'offer-jo-g1-science-alike-35m';

const ELEMENTARY_CURRICULA = [
  'Jordan',
  'national',
  'المنهاج الوطني',
  'Elementary',
  'المرحلة الابتدائية',
  'الصف الأول',
  'الصف الثاني',
  'الصف الثالث',
  'الصف الرابع',
  'الصف الخامس',
  'الصف السادس',
];

function upsertFacultyMember(member) {
  const curricula = [
    ...ELEMENTARY_CURRICULA,
    member.ageBand === 'grades-1-3' ? 'الصفوف الأولى' : 'الصفوف العليا ابتدائي',
    member.source === 'success-4-sure' ? 'Success 4 Sure' : 'SUCCESS OS Cast',
  ];
  return upsertTeacherProfile({
    id: member.id,
    registeredBy: 'supervisor',
    registeredByActor: 'Waseem · Partner · Elementary Casting',
    autoApprove: true,
    fullName: member.fullName,
    email: member.email,
    phone: member.phone,
    nationality: 'أردني',
    city: 'عمّان',
    country: 'الأردن',
    bio: `${member.bio}\n\nأسلوب الصف: ${(member.styleTags || []).join(' · ')} · الشريحة العمرية: ${member.ageBand}`,
    aboutStudent: member.aboutStudent,
    subjects: member.subjects,
    curricula,
    languages: ['العربية', 'English'],
    experienceYears: member.experienceYears,
    introVideoUrl: member.profileUrl || '',
    certificateName: 'elementary-age-fit-credential.txt',
    certificateDataUrl: 'data:text/plain;base64,RUxFTS1BR0UtRklU',
    idDocumentType: 'national_id',
    idDocumentName: 'elementary-cast-kyc-placeholder.txt',
    idDocumentDataUrl: 'data:text/plain;base64,RUxFTS1LWUM=',
    workAreas: ['عمّان', 'أونلاين', 'المرحلة الابتدائية', member.ageBand],
    acceptsOnline: true,
    acceptsInPerson: true,
    acceptsRecorded: true,
  });
}

function toFacultyCard(member, profile) {
  return {
    id: member.id,
    fullName: member.fullName,
    fullNameAr: member.fullNameAr || member.fullName,
    fullNameEn: member.fullNameEn || '',
    roleAr: member.roleAr,
    ageBand: member.ageBand,
    styleTags: member.styleTags || [],
    elementarySubjects: member.elementarySubjects,
    profileUrl: member.profileUrl || '',
    source: member.source,
    href: `/teachers/${member.id}`,
    status: getTeacher(member.id)?.status || profile.status,
  };
}

export function ensureElementaryTeacher() {
  const early = EARLY_ELEMENTARY_FACULTY.map((m) =>
    toFacultyCard(m, upsertFacultyMember(m)),
  );
  const upper = UPPER_ELEMENTARY_FACULTY.map((m) =>
    toFacultyCard(m, upsertFacultyMember(m)),
  );
  const faculty = [...early, ...upper];

  const mathOffer = upsertOffer({
    id: ELEMENTARY_OFFER_G1_MATH_ID,
    teacherId: ELEMENTARY_MATH_TEACHER_ID,
    status: 'published',
    type: 'recorded',
    title: 'شرح كامل · الجمع بخط الأعداد (35 دقيقة) — صف 1 · أ. لاما الحموري',
    subject: 'الرياضيات',
    curriculum: 'المنهاج الوطني الأردني · الصف الأول · معلّمة دافئة للصغار',
    description:
      'حصة معلّمة حقيقية بأسلوب دلوع ولعوب مناسب لعمر الصف الأول: تهيئة حنونة، شرح بالقفز، تدريب موجّه، تدريب مستقل، وخروج تشجيعي — مربوطة بالدرس التفاعلي 3D.',
    price: 7,
    currency: 'JOD',
    durationMinutes: 35,
    recordingName: 'jo-g1-math-numberline-lama-35m.md',
    recordingUrl:
      '/digital-library/middle-east/jordan/national/grade-1/الرياضيات/الجمع/الجمع-بخط-الأعداد#teacher-explain',
  });

  const scienceOffer = upsertOffer({
    id: ELEMENTARY_OFFER_G1_SCIENCE_ID,
    teacherId: ELEMENTARY_SCIENCE_TEACHER_ID,
    status: 'published',
    type: 'recorded',
    title: 'شرح كامل · نحن متشابهون ومختلفون (35 دقيقة) — صف 1 · أ. رنيم العبادي',
    subject: 'العلوم',
    curriculum: 'المنهاج الوطني الأردني · الصف الأول · معلّمة حنونة للصغار',
    description:
      'حصة علوم بأسلوب لطيف ومناسب للمرحلة العمرية: أ. رنيم العبادي تعلّم التشابه والاختلاف باحترام ودفء — قبل أي أسلوب امتحاني.',
    price: 7,
    currency: 'JOD',
    durationMinutes: 35,
    recordingName: 'jo-g1-science-alike-raneem-35m.md',
    recordingUrl:
      '/digital-library/middle-east/jordan/national/grade-1/العلوم/الإنسان-والصحة/نحن-متشابهون-ومختلفون#teacher-explain',
  });

  const lead = getTeacher(ELEMENTARY_MATH_TEACHER_ID);
  return {
    teacher: lead,
    offer: mathOffer,
    scienceOffer,
    faculty,
    earlyFaculty: early,
    upperFaculty: upper,
    castingDoctrineAr: [
      'نختار شخصية المعلّم حسب عمر الطالب — مش حسب شهرة المنصة فقط.',
      'الصفوف 1–3: معلّمات دافعات دلوعات بالشرح (قصص، لعب، تشجيع).',
      'الصفوف 4–6: اختصاصيون أوضح خطواتًا (ومنهم معلّمو Success 4 Sure عند الحاجة).',
      'المعلّم مش شرط يكون من منصتنا — المهم التماشي مع المرحلة العمرية.',
    ],
    offersForTeacher: listOffers({ teacherId: ELEMENTARY_MATH_TEACHER_ID }),
  };
}
