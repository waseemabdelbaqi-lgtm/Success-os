/**
 * Seed Mr. Waseem Al-Labadi — Chemistry (Success 4 Sure Academy)
 * Profile aligned with https://www.success4sureacademy.com/waseem-al-labadi
 * and EST II Chemistry Atomic Structure track.
 */

import { createRequire } from 'node:module';
import {
  getTeacher,
  listOffers,
  upsertOffer,
  upsertTeacherProfile,
} from '../teachers/teachers-os-store.js';

const require = createRequire(import.meta.url);

export const S4S_WASEEM_TEACHER_ID = 'teacher-s4s-waseem-al-labadi';
export const S4S_ATOMIC_OFFER_ID = 'offer-s4s-est-chem-atomic-structure-35m';
export const S4S_ATOMIC_LESSON_SLUG = 's4s-est-chemistry-atomic-structure';
export const S4S_ATOMIC_OUTLINE_ID = 'outline-s4s-est-chem-atomic-structure';

const LESSON_HREF =
  '/digital-library/international-systems/global/est/secondary/chemistry/atomic-structure/atomic-structure-part-1#teacher-explain';

function seedAtomicOutline() {
  // Lazy require avoids circular dependency with curriculum-os-store.
  const {
    ingestCurriculumOutline,
    publishCurriculumOutline,
  } = require('./curriculum-os-store.js');
  const outline = ingestCurriculumOutline({
    id: S4S_ATOMIC_OUTLINE_ID,
    titleAr: 'التركيب الذري · الجزء الأول',
    titleEn: 'Atomic Structure Part 1',
    subject: 'chemistry',
    chapter: 'atomic-structure',
    region: 'international-systems',
    country: 'global',
    curriculumType: 'est',
    educationLevel: 'secondary',
    lessonSlug: S4S_ATOMIC_LESSON_SLUG,
    actor: 'Waseem · Partner · S4S',
    teacherHints: {
      subjects: ['Chemistry', 'chemistry', 'كيمياء'],
      curricula: ['EST', 'AP', 'Success 4 Sure'],
    },
    outlineMarkdown: `# Atomic Structure Part 1 — EST II Chemistry

Teacher: Mr. Waseem Al-Labadi (Success 4 Sure Academy)
Source track: https://www.success4sureacademy.com/course/chemistry/

## Outcomes
- Name protons, neutrons, electrons and their charges/masses
- Use atomic number (Z) and mass number (A)
- Distinguish atoms, ions, and isotopes
- Solve EST-style particle-count questions

## Delivery
- Interactive lesson: \`${S4S_ATOMIC_LESSON_SLUG}\`
- Full teacher script: 35 minutes (#teacher-explain)
- Offer: \`${S4S_ATOMIC_OFFER_ID}\`
`,
  });
  return publishCurriculumOutline(S4S_ATOMIC_OUTLINE_ID, 'Waseem · Partner · S4S') || outline;
}

export function ensureS4sWaseemChemistry() {
  const teacher = upsertTeacherProfile({
    id: S4S_WASEEM_TEACHER_ID,
    registeredBy: 'supervisor',
    registeredByActor: 'Waseem · Partner · Success 4 Sure',
    autoApprove: true,
    fullName: 'Mr. Waseem Al-Labadi',
    email: 'waseem@success4sureacademy.com',
    phone: '0790000040',
    nationality: 'أردني',
    city: 'عمّان',
    country: 'الأردن',
    bio:
      'Mr. Waseem Abdelbaqi — founder of Success 4 Sure Academy. Highly experienced Physics and Chemistry teacher with over 14 years teaching in Jordan and the Gulf. B.Sc. Earth & Environmental Sciences (Geophysics), Hashemite University. ACT and AdvancED certified. Clear bilingual teaching (Arabic & English) for EST, AP, ACT, and IGCSE chemistry tracks.',
    aboutStudent:
      'Welcome — أنا أستاذ وسيم اللبدي من Success 4 Sure. بنشرح الكيمياء خطوة بخطوة، عربي وإنجليزي، ونربط كل فكرة بمسائل امتحان EST/AP حتى تطلع واثق يوم الاختبار.',
    subjects: [
      'Chemistry',
      'chemistry',
      'كيمياء',
      'الكيمياء',
      'Physics',
      'physics',
      'فيزياء',
      'EST Chemistry',
      'AP Chemistry',
      'ACT Chemistry',
    ],
    curricula: [
      'EST',
      'EST II',
      'AP',
      'ACT',
      'IGCSE',
      'IB',
      'Success 4 Sure',
      'S4S',
      'Jordan',
      'international',
    ],
    languages: ['العربية', 'English'],
    experienceYears: 14,
    introVideoUrl: 'https://www.success4sureacademy.com/waseem-al-labadi',
    certificateName: 'S4S-ACT-AdvancED-credentials.txt',
    certificateDataUrl: 'data:text/plain;base64,UzRTLUFDVC1BZHZhbmNFRA==',
    idDocumentType: 'national_id',
    idDocumentName: 's4s-founder-kyc-placeholder.txt',
    idDocumentDataUrl: 'data:text/plain;base64,UzRTLUtZQw==',
    workAreas: ['عمّان', 'أونلاين', 'Success 4 Sure Academy', 'الخليج'],
    acceptsOnline: true,
    acceptsInPerson: true,
    acceptsRecorded: true,
  });

  const offer = upsertOffer({
    id: S4S_ATOMIC_OFFER_ID,
    teacherId: S4S_WASEEM_TEACHER_ID,
    status: 'published',
    type: 'recorded',
    title: 'Atomic Structure Part 1 · Full Teacher Explanation (35 min) — EST Chemistry',
    subject: 'Chemistry',
    curriculum: 'EST II Chemistry · Success 4 Sure Academy',
    description:
      'Full classroom explanation by Mr. Waseem Al-Labadi: particles, Z & A, isotopes, ions, and EST-style practice — wired to the SUCCESS OS interactive orbital lesson.',
    price: 25,
    currency: 'JOD',
    durationMinutes: 35,
    recordingName: 's4s-est-chem-atomic-structure-teacher-35m.md',
    recordingUrl: LESSON_HREF,
  });

  let outline = null;
  try {
    outline = seedAtomicOutline();
  } catch {
    // Outline may already exist or store may be read-only in some contexts.
  }

  const live = getTeacher(S4S_WASEEM_TEACHER_ID);
  return {
    teacher: live || teacher,
    offer,
    outline,
    lessonSlug: S4S_ATOMIC_LESSON_SLUG,
    lessonHref: LESSON_HREF.replace('#teacher-explain', ''),
    offersForTeacher: listOffers({ teacherId: S4S_WASEEM_TEACHER_ID }),
  };
}
