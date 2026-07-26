/**
 * Seed Success 4 Sure Academy faculty as elementary-stage Teachers OS personas.
 * Source roster: https://www.success4sureacademy.com/teachers/
 *
 * Elementary subject mapping (Jordan grades 1–6):
 *  - Math        → Mr. Naseem Al-Labadi
 *  - Science     → Mr. Waseem Al-Labadi (+ Ms. Noor Al-Lozi biology support)
 *  - English     → Ms. Sara Abd Alraheem
 *  - Digital     → Mr. Ala’a Bariyeh
 *  - Math enrich → Mr. Zuheir Esawi
 *  - Social/Econ → Mr. Abd Al Fattah Barqawi
 */

import {
  getTeacher,
  listOffers,
  upsertOffer,
  upsertTeacherProfile,
} from '../teachers/teachers-os-store.js';

export const S4S_ELEMENTARY_FACULTY = Object.freeze([
  {
    id: 'teacher-s4s-naseem-al-labadi',
    fullName: 'Mr. Naseem Al-Labadi',
    fullNameAr: 'أ. نسيم اللبدي',
    roleAr: 'رياضيات المرحلة الابتدائية',
    email: 'naseem@success4sureacademy.com',
    phone: '0790000041',
    profileUrl: 'https://www.success4sureacademy.com/naseem-al-labadi',
    bio:
      'Mr. Naseem Allabadi — mathematics teacher at Success 4 Sure Academy and Platform. B.Sc. Mathematics from Arab Amman University with honors (1st in class, GPA 3.81/4). Higher Diploma in Education and Training with honors (GPA 3.65/4). Teaching since 2012.',
    aboutStudent:
      'يا بطل الرياضيات: أنا أستاذ نسيم اللبدي من Success 4 Sure. بنمشي خطوة خطوة — نفهم قبل ما نحفظ، ونستخدم خط الأعداد والصور عشان الجمع يصير لعبة واضحة.',
    subjects: ['رياضيات', 'الرياضيات', 'Math', 'math', 'Mathematics'],
    elementarySubjects: ['الرياضيات'],
    experienceYears: 14,
  },
  {
    id: 'teacher-s4s-waseem-al-labadi',
    fullName: 'Mr. Waseem Al-Labadi',
    fullNameAr: 'أ. وسيم اللبدي',
    roleAr: 'علوم · مؤسس Success 4 Sure',
    email: 'waseem@success4sureacademy.com',
    phone: '0790000040',
    profileUrl: 'https://www.success4sureacademy.com/waseem-al-labadi',
    bio:
      'Mr. Waseem Abdelbaqi — founder of Success 4 Sure Academy. Highly experienced Physics and Chemistry teacher with over 14 years teaching in Jordan and the Gulf. B.Sc. Earth & Environmental Sciences (Geophysics), Hashemite University. ACT and AdvancED certified. Clear bilingual teaching style.',
    aboutStudent:
      'مرحباً — أنا أستاذ وسيم اللبدي، مؤسس Success 4 Sure. في المرحلة الابتدائية بنبني حب العلوم بالملاحظة والتجربة البسيطة، عربي وإنجليزي، بهدوء وثقة.',
    subjects: [
      'علوم',
      'العلوم',
      'Science',
      'science',
      'Chemistry',
      'chemistry',
      'كيمياء',
      'Physics',
      'physics',
      'فيزياء',
    ],
    elementarySubjects: ['العلوم'],
    experienceYears: 14,
  },
  {
    id: 'teacher-s4s-noor-al-lozi',
    fullName: 'Ms. Noor Al-Lozi',
    fullNameAr: 'أ. نور اللوزي',
    roleAr: 'علوم الحياة · أحياء',
    email: 'noor@success4sureacademy.com',
    phone: '0790000042',
    profileUrl: 'https://www.success4sureacademy.com/teachers/',
    bio:
      'Ms. Noor Al-Lozi — Biology teacher at Success 4 Sure Academy. Supports life-science and health topics for learners building observation and respectful scientific language.',
    aboutStudent:
      'أنا الأستاذة نور اللوزي. بنتعلّم نلاحظ جسمنا وصحتنا باحترام: نتشابه كبشر، ونختلف بتنوع جميل.',
    subjects: ['أحياء', 'Biology', 'biology', 'علوم', 'العلوم', 'Science', 'science'],
    elementarySubjects: ['العلوم'],
    experienceYears: 6,
  },
  {
    id: 'teacher-s4s-sara-abd-alraheem',
    fullName: 'Ms. Sara Abd Alraheem',
    fullNameAr: 'أ. سارة عبد الرحيم',
    roleAr: 'اللغة الإنجليزية',
    email: 'sara@success4sureacademy.com',
    phone: '0790000043',
    profileUrl: 'https://www.success4sureacademy.com/sara-abd-alraheem',
    bio:
      'Ms. Sara Abd Alraheem — experienced and passionate English teacher with over six years of teaching at Success 4 Sure Academy. Dedicated to inspiring confident reading, speaking, and classroom English for young and exam learners.',
    aboutStudent:
      'Hi champions — I’m Miss Sara from Success 4 Sure. We learn English with smiles, songs, and short stories — step by step.',
    subjects: [
      'English',
      'english',
      'اللغة الإنجليزية',
      'انجليزي',
      'الإنجليزية',
    ],
    elementarySubjects: ['اللغة الإنجليزية'],
    experienceYears: 6,
  },
  {
    id: 'teacher-s4s-zuheir-esawi',
    fullName: 'Mr. Zuheir Esawi',
    fullNameAr: 'أ. زهير عيساوي',
    roleAr: 'رياضيات عليا · تفكير حل مسائل',
    email: 'zuheir@success4sureacademy.com',
    phone: '0790000044',
    profileUrl: 'https://www.success4sureacademy.com/zuheir-esawi',
    bio:
      'Mr. Zuheir Esawi — experienced Physics and Mathematics teacher with 6 years of teaching, focusing on AHSD and IGCSE. Concept-based instruction that builds problem-solving and critical thinking. Currently teaching at Al-Asriyya Schools.',
    aboutStudent:
      'أنا أستاذ زهير. بنقوّي التفكير الرياضي وحل المسائل للصفوف الأعلى في الابتدائي — فهم عميق قبل السرعة.',
    subjects: [
      'رياضيات',
      'الرياضيات',
      'Math',
      'math',
      'Calculus',
      'calculus',
      'Physics',
      'physics',
      'فيزياء',
    ],
    elementarySubjects: ['الرياضيات'],
    experienceYears: 6,
  },
  {
    id: 'teacher-s4s-alaa-bariyeh',
    fullName: "Mr. Ala’a Bariyeh",
    fullNameAr: 'أ. علاء بريه',
    roleAr: 'المهارات الرقمية',
    email: 'alaa@success4sureacademy.com',
    phone: '0790000045',
    profileUrl: 'https://www.success4sureacademy.com/teachers/',
    bio:
      "Mr. Ala’a Bariyeh — Computer Science Principles teacher at Success 4 Sure Academy. Guides digital literacy, safe computing habits, and computational thinking for school learners.",
    aboutStudent:
      'أنا أستاذ علاء. بنتعلّم نفكّر كمهندسي المستقبل: خطوات واضحة، أمان رقمي، وإبداع بسيط على الجهاز.',
    subjects: [
      'Computer Science',
      'CSP',
      'المهارات الرقمية',
      'الحاسوب',
      'Digital',
      'digital',
    ],
    elementarySubjects: ['المهارات الرقمية'],
    experienceYears: 5,
  },
  {
    id: 'teacher-s4s-abd-al-fattah-barqawi',
    fullName: 'Mr. Abd Al Fattah Barqawi',
    fullNameAr: 'أ. عبد الفتاح برقاوي',
    roleAr: 'دراسات اجتماعية · اقتصاد مبسّط',
    email: 'barqawi@success4sureacademy.com',
    phone: '0790000046',
    profileUrl: 'https://www.success4sureacademy.com/teachers/',
    bio:
      'Mr. Abd Al Fattah Barqawi — Economics teacher at Success 4 Sure Academy. Supports social-studies and everyday economics ideas for school pathways.',
    aboutStudent:
      'أنا أستاذ عبد الفتاح. بنتعلّم كيف المجتمع يشتغل: البيت، المدرسة، والسوق — بلغة مناسبة للعمر.',
    subjects: [
      'Economics',
      'economics',
      'اقتصاد',
      'الدراسات الاجتماعية',
      'اجتماعيات',
    ],
    elementarySubjects: ['الدراسات الاجتماعية'],
    experienceYears: 8,
  },
]);

export const ELEMENTARY_MATH_TEACHER_ID = 'teacher-s4s-naseem-al-labadi';
export const ELEMENTARY_SCIENCE_TEACHER_ID = 'teacher-s4s-waseem-al-labadi';
/** @deprecated use ELEMENTARY_MATH_TEACHER_ID — kept for older links */
export const ELEMENTARY_TEACHER_ID = ELEMENTARY_MATH_TEACHER_ID;
export const ELEMENTARY_OFFER_G1_MATH_ID = 'offer-jo-g1-math-numberline-35m';
export const ELEMENTARY_OFFER_G1_SCIENCE_ID = 'offer-jo-g1-science-alike-35m';

const ELEMENTARY_CURRICULA = [
  'Jordan',
  'national',
  'المنهاج الوطني',
  'Elementary',
  'المرحلة الابتدائية',
  'Success 4 Sure',
  'S4S',
  'الصف الأول',
  'الصف الثاني',
  'الصف الثالث',
  'الصف الرابع',
  'الصف الخامس',
  'الصف السادس',
];

function upsertFacultyMember(member) {
  return upsertTeacherProfile({
    id: member.id,
    registeredBy: 'supervisor',
    registeredByActor: 'Waseem · Partner · Success 4 Sure',
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
    curricula: ELEMENTARY_CURRICULA,
    languages: ['العربية', 'English'],
    experienceYears: member.experienceYears,
    introVideoUrl: member.profileUrl,
    certificateName: 'S4S-faculty-credential.txt',
    certificateDataUrl: 'data:text/plain;base64,UzRTLWZhY3VsdHk=',
    idDocumentType: 'national_id',
    idDocumentName: 's4s-faculty-kyc-placeholder.txt',
    idDocumentDataUrl: 'data:text/plain;base64,UzRTLUtZQw==',
    workAreas: ['عمّان', 'أونلاين', 'Success 4 Sure Academy', 'المرحلة الابتدائية'],
    acceptsOnline: true,
    acceptsInPerson: true,
    acceptsRecorded: true,
  });
}

export function ensureElementaryTeacher() {
  const faculty = S4S_ELEMENTARY_FACULTY.map((member) => {
    const profile = upsertFacultyMember(member);
    return {
      id: member.id,
      fullName: member.fullName,
      fullNameAr: member.fullNameAr,
      roleAr: member.roleAr,
      elementarySubjects: member.elementarySubjects,
      profileUrl: member.profileUrl,
      href: `/teachers/${member.id}`,
      status: getTeacher(member.id)?.status || profile.status,
    };
  });

  const mathOffer = upsertOffer({
    id: ELEMENTARY_OFFER_G1_MATH_ID,
    teacherId: ELEMENTARY_MATH_TEACHER_ID,
    status: 'published',
    type: 'recorded',
    title: 'شرح كامل · الجمع بخط الأعداد (35 دقيقة) — صف 1 · أ. نسيم اللبدي',
    subject: 'الرياضيات',
    curriculum: 'المنهاج الوطني الأردني · الصف الأول · Success 4 Sure',
    description:
      'حصة معلّم حقيقي من Success 4 Sure: أ. نسيم اللبدي يقود تهيئة، شرح، تدريب موجّه، تدريب مستقل، وخروج — مربوطة بالدرس التفاعلي 3D.',
    price: 7,
    currency: 'JOD',
    durationMinutes: 35,
    recordingName: 'jo-g1-math-numberline-naseem-35m.md',
    recordingUrl:
      '/digital-library/middle-east/jordan/national/grade-1/الرياضيات/الجمع/الجمع-بخط-الأعداد#teacher-explain',
  });

  const scienceOffer = upsertOffer({
    id: ELEMENTARY_OFFER_G1_SCIENCE_ID,
    teacherId: ELEMENTARY_SCIENCE_TEACHER_ID,
    status: 'published',
    type: 'recorded',
    title: 'شرح كامل · نحن متشابهون ومختلفون (35 دقيقة) — صف 1 · أ. وسيم اللبدي',
    subject: 'العلوم',
    curriculum: 'المنهاج الوطني الأردني · الصف الأول · Success 4 Sure',
    description:
      'حصة علوم ابتدائية بصوت أ. وسيم اللبدي (مؤسس Success 4 Sure): نلاحظ التشابه والاختلاف باحترام، ثم نربطها بنشاط صفي أردني.',
    price: 7,
    currency: 'JOD',
    durationMinutes: 35,
    recordingName: 'jo-g1-science-alike-waseem-35m.md',
    recordingUrl:
      '/digital-library/middle-east/jordan/national/grade-1/العلوم/الإنسان-والصحة/نحن-متشابهون-ومختلفون#teacher-explain',
  });

  const lead = getTeacher(ELEMENTARY_MATH_TEACHER_ID);
  return {
    teacher: lead,
    offer: mathOffer,
    scienceOffer,
    faculty,
    offersForTeacher: listOffers({ teacherId: ELEMENTARY_MATH_TEACHER_ID }),
  };
}
