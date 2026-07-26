/**
 * Seed the SUCCESS OS elementary teacher (Waseem · Partner)
 * and a published 35-minute offer for Grade 1 number-line addition.
 */

import {
  getTeacher,
  listOffers,
  upsertOffer,
  upsertTeacherProfile,
} from '../teachers/teachers-os-store.js';

export const ELEMENTARY_TEACHER_ID = 'teacher-success-os-waseem-elementary';
export const ELEMENTARY_OFFER_G1_MATH_ID = 'offer-jo-g1-math-numberline-35m';

export function ensureElementaryTeacher() {
  const teacher = upsertTeacherProfile({
    id: ELEMENTARY_TEACHER_ID,
    registeredBy: 'supervisor',
    registeredByActor: 'Waseem · Partner',
    autoApprove: true,
    fullName: 'أ. وسيم · معلّم SUCCESS OS',
    email: 'waseem.elementary@success-os.local',
    phone: '0790000030',
    nationality: 'أردني',
    city: 'عمّان',
    country: 'الأردن',
    bio: 'معلّم منصة SUCCESS OS للمرحلة الابتدائية والمنهاج الوطني الأردني. أشرح الدرس خطوة بخطوة بصوت المعلّم الحقيقي، ثم نربطها بالتفاعلي و3D.',
    aboutStudent:
      'يا بطل الصف الأول: بنتعلّم مع بعض بهدوء، نقفز على خط الأعداد، ونفهم الجمع كقصة ممتعة قبل أي واجب.',
    subjects: [
      'رياضيات',
      'الرياضيات',
      'علوم',
      'العلوم',
      'اللغة العربية',
      'math',
    ],
    curricula: [
      'Jordan',
      'national',
      'المنهاج الوطني',
      'توجيهي',
      'الصف الأول',
      'الصف الثاني',
      'الصف الثالث',
      'الصف الرابع',
      'الصف الخامس',
      'الصف السادس',
    ],
    languages: ['العربية', 'English'],
    experienceYears: 12,
    certificateName: 'SUCCESS-OS-Elementary-Teaching-Credential.pdf',
    certificateDataUrl: 'data:text/plain;base64,U1VDQ0VTUy1PUy1FTEVNRU5UQVJZ',
    idDocumentType: 'national_id',
    idDocumentName: 'partner-kyc-placeholder.txt',
    idDocumentDataUrl: 'data:text/plain;base64,S1lDLVBBQ1RORVI=',
    workAreas: ['عمّان', 'أونلاين', 'المنصة'],
    acceptsOnline: true,
    acceptsInPerson: true,
    acceptsRecorded: true,
  });

  const offer = upsertOffer({
    id: ELEMENTARY_OFFER_G1_MATH_ID,
    teacherId: ELEMENTARY_TEACHER_ID,
    status: 'published',
    type: 'recorded',
    title: 'شرح كامل · الجمع بخط الأعداد (35 دقيقة) — صف 1',
    subject: 'الرياضيات',
    curriculum: 'المنهاج الوطني الأردني · الصف الأول',
    description:
      'حصة معلّم حقيقي: تهيئة، شرح مفصّل، تدريب موجّه، تدريب مستقل، وخروج بتقويم — مرتبطة بالدرس التفاعلي ثلاثي الأبعاد على SUCCESS OS.',
    price: 7,
    currency: 'JOD',
    durationMinutes: 35,
    recordingName: 'jo-g1-math-numberline-teacher-explanation-35m.md',
    recordingUrl:
      '/digital-library/middle-east/jordan/national/grade-1/الرياضيات/الجمع/الجمع-بخط-الأعداد#teacher-explain',
  });

  // Ensure teacher still approved after upsert edge cases
  const live = getTeacher(ELEMENTARY_TEACHER_ID);
  return {
    teacher: live || teacher,
    offer,
    offersForTeacher: listOffers({ teacherId: ELEMENTARY_TEACHER_ID }),
  };
}
