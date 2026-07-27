/**
 * Fictional elementary Teachers OS personas (age-fit).
 * Names are invented for SUCCESS OS — not real public figures / platforms.
 */

import {
  getTeacher,
  listOffers,
  upsertOffer,
  upsertTeacherProfile,
} from '../teachers/teachers-os-store.js';
import {
  AI_ASSISTANT_TEACHER_TITLE_F,
  withAiAssistantTitle,
} from './ai-assistant-teacher.js';

export const EARLY_ELEMENTARY_FACULTY = Object.freeze([
  {
    id: 'teacher-jo-lama-nouri',
    fullName: withAiAssistantTitle('أ. لاما النوري'),
    displayName: 'أ. لاما النوري',
    titleAr: AI_ASSISTANT_TEACHER_TITLE_F,
    roleAr: 'معلّمة مساعدة · رياضيات · صفوف 1–3',
    ageBand: 'grades-1-3',
    styleTags: ['ستايل', 'يوتيوب', 'دافئة', 'تشجيع', 'معلّمة مساعدة'],
    email: 'lama.nouri@success-os.local',
    phone: '0790000051',
    bio: 'معلّمة مساعدة بالذكاء الاصطناعي (شخصية وهمية للمنصة) — رياضيات ابتدائية بأسلوب دافئ ولعوب.',
    aboutStudent:
      'يا قمري… أنا معلّمتك المساعدة لاما. بنعدّ ونقفز على خط الأعداد بحب، وما في غلط يخوّفنا.',
    subjects: ['رياضيات', 'الرياضيات', 'Math', 'math'],
    elementarySubjects: ['الرياضيات'],
    experienceYears: 8,
  },
  {
    id: 'teacher-jo-raneem-saleh',
    fullName: withAiAssistantTitle('أ. رنيم صالح'),
    displayName: 'أ. رنيم صالح',
    titleAr: AI_ASSISTANT_TEACHER_TITLE_F,
    roleAr: 'معلّمة مساعدة · علوم · صفوف 1–3',
    ageBand: 'grades-1-3',
    styleTags: ['ستايل', 'حنونة', 'فضولية', 'معلّمة مساعدة'],
    email: 'raneem.saleh@success-os.local',
    phone: '0790000052',
    bio: 'معلّمة مساعدة بالذكاء الاصطناعي (شخصية وهمية) — علوم بالملاحظة اللطيفة والاحترام.',
    aboutStudent:
      'يا حبيبي… أنا معلّمتك المساعدة رنيم. بنشوف العالم بهدوء: نتشابه ونختلف باحترام.',
    subjects: ['علوم', 'العلوم', 'Science', 'science'],
    elementarySubjects: ['العلوم'],
    experienceYears: 7,
  },
  {
    id: 'teacher-jo-hiba-faisal',
    fullName: withAiAssistantTitle('أ. هبة فيصل'),
    displayName: 'أ. هبة فيصل',
    titleAr: AI_ASSISTANT_TEACHER_TITLE_F,
    roleAr: 'معلّمة مساعدة · عربي · صفوف 1–3',
    ageBand: 'grades-1-3',
    styleTags: ['ستايل', 'قصصية', 'دافئة', 'معلّمة مساعدة'],
    email: 'hiba.faisal@success-os.local',
    phone: '0790000053',
    bio: 'معلّمة مساعدة بالذكاء الاصطناعي (شخصية وهمية) — عربي بالحكاية والصوت الحنّي.',
    aboutStudent: 'يا قمري القارئ… أنا معلّمتك المساعدة هبة. بنحب الحروف مثل أصدقاء.',
    subjects: ['اللغة العربية', 'عربي', 'Arabic'],
    elementarySubjects: ['اللغة العربية'],
    experienceYears: 9,
  },
  {
    id: 'teacher-jo-mais-tariq',
    fullName: withAiAssistantTitle('أ. ميس طارق'),
    displayName: 'أ. ميس طارق',
    titleAr: AI_ASSISTANT_TEACHER_TITLE_F,
    roleAr: 'معلّمة مساعدة · English · grades 1–3',
    ageBand: 'grades-1-3',
    styleTags: ['ستايل', 'مرحة', 'أغاني', 'معلّمة مساعدة'],
    email: 'mais.tariq@success-os.local',
    phone: '0790000054',
    bio: 'AI assistant teacher persona (fictional) — soft, playful early English classroom voice.',
    aboutStudent: 'Hi my little stars… I’m Miss Mais, your AI assistant teacher. We clap, we sing, we try.',
    subjects: ['English', 'english', 'اللغة الإنجليزية'],
    elementarySubjects: ['اللغة الإنجليزية'],
    experienceYears: 6,
  },
]);

export const ELEMENTARY_MATH_TEACHER_ID = 'teacher-jo-lama-nouri';
export const ELEMENTARY_SCIENCE_TEACHER_ID = 'teacher-jo-raneem-saleh';
export const ELEMENTARY_TEACHER_ID = ELEMENTARY_MATH_TEACHER_ID;
export const ELEMENTARY_OFFER_G1_MATH_ID = 'offer-jo-g1-math-numberline-35m';
export const ELEMENTARY_OFFER_G1_SCIENCE_ID = 'offer-jo-g1-science-alike-35m';

const CURRICULA = [
  'Jordan',
  'national',
  'المنهاج الوطني',
  'Elementary',
  'المرحلة الابتدائية',
  'الصف الأول',
  'الصف الثاني',
  'الصف الثالث',
];

function upsertMember(member) {
  return upsertTeacherProfile({
    id: member.id,
    registeredBy: 'supervisor',
    registeredByActor: 'SUCCESS OS · Elementary Cast',
    autoApprove: true,
    fullName: member.fullName,
    email: member.email,
    phone: member.phone,
    nationality: 'أردني',
    city: 'عمّان',
    country: 'الأردن',
    bio: member.bio,
    aboutStudent: member.aboutStudent,
    subjects: member.subjects,
    curricula: CURRICULA,
    languages: ['العربية', 'English'],
    experienceYears: member.experienceYears,
    certificateName: 'fictional-cast.txt',
    certificateDataUrl: 'data:text/plain;base64,RklD',
    idDocumentType: 'national_id',
    idDocumentName: 'fictional-kyc.txt',
    idDocumentDataUrl: 'data:text/plain;base64,RklD',
    workAreas: ['عمّان', 'أونلاين', 'المرحلة الابتدائية'],
    acceptsOnline: true,
    acceptsInPerson: true,
    acceptsRecorded: true,
  });
}

export function ensureElementaryTeacher() {
  const earlyFaculty = EARLY_ELEMENTARY_FACULTY.map((m) => {
    const profile = upsertMember(m);
    return {
      id: m.id,
      fullName: m.fullName,
      roleAr: m.roleAr,
      ageBand: m.ageBand,
      styleTags: m.styleTags,
      elementarySubjects: m.elementarySubjects,
      href: `/teachers/${m.id}`,
      status: getTeacher(m.id)?.status || profile.status,
    };
  });

  const mathOffer = upsertOffer({
    id: ELEMENTARY_OFFER_G1_MATH_ID,
    teacherId: ELEMENTARY_MATH_TEACHER_ID,
    status: 'published',
    type: 'recorded',
    title: `حصة AI · الجمع بخط الأعداد (35د) — ${withAiAssistantTitle('أ. لاما النوري')}`,
    subject: 'الرياضيات',
    curriculum: 'المنهاج الوطني · الصف الأول',
    description: 'حصة ابتدائية بالذكاء الاصطناعي: فيديو شرح + تفاعليات + اختبار.',
    price: 5,
    currency: 'JOD',
    durationMinutes: 35,
    recordingName: 'jo-g1-math-ai-class.md',
    recordingUrl:
      '/digital-library/middle-east/jordan/national/grade-1/الرياضيات/الجمع/الجمع-بخط-الأعداد#ai-class',
  });

  const scienceOffer = upsertOffer({
    id: ELEMENTARY_OFFER_G1_SCIENCE_ID,
    teacherId: ELEMENTARY_SCIENCE_TEACHER_ID,
    status: 'published',
    type: 'recorded',
    title: `حصة AI · نحن متشابهون ومختلفون (35د) — ${withAiAssistantTitle('أ. رنيم صالح')}`,
    subject: 'العلوم',
    curriculum: 'المنهاج الوطني · الصف الأول',
    description: 'حصة علوم ابتدائية بالذكاء الاصطناعي: شرح صوتي + أنشطة.',
    price: 5,
    currency: 'JOD',
    durationMinutes: 35,
    recordingName: 'jo-g1-science-ai-class.md',
    recordingUrl:
      '/digital-library/middle-east/jordan/national/grade-1/العلوم/الإنسان-والصحة/نحن-متشابهون-ومختلفون#ai-class',
  });

  return {
    teacher: getTeacher(ELEMENTARY_MATH_TEACHER_ID),
    offer: mathOffer,
    scienceOffer,
    faculty: earlyFaculty,
    earlyFaculty,
    upperFaculty: [],
    castingDoctrineAr: [
      'أسماء المعلّمين وهمية للاستخدام داخل المنصة.',
      'الصفوف الأولى: صوت دافئ مناسب للعمر.',
      'الحصة = فيديو شرح AI + تفاعليات + اختبار.',
    ],
    offersForTeacher: listOffers({ teacherId: ELEMENTARY_MATH_TEACHER_ID }),
  };
}
