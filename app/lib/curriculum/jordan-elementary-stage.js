/**
 * Jordan Elementary Stage builder (الصفوف 1–6).
 * Harvest → reformulate → interactive lesson slots for primary basic education.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  erpAppendAudit,
  erpNow,
  erpReadJson,
  erpWriteJson,
} from '../admin/enterprise-erp-store.js';
import { jordanGradeRegistry } from '../../data/jordan-curriculum.js';
import {
  getJordanWave1Snapshot,
  reformulateJordanHarvest,
  harvestJordanStructure,
  JORDAN_WAVE1_SOURCES,
} from './jordan-wave1-engine.js';
import { listCurriculumOutlines } from './curriculum-os-store.js';
import { ensureElementaryTeacher } from './seed-elementary-teacher.js';
import { listElementaryAiClasses } from './elementary-ai-class-engine.js';

export const ELEMENTARY_STAGE = Object.freeze({
  id: 'jordan-elementary',
  labelAr: 'المرحلة الابتدائية',
  labelEn: 'Elementary Stage',
  country: 'Jordan',
  gradesAr: [
    'الصف الأول',
    'الصف الثاني',
    'الصف الثالث',
    'الصف الرابع',
    'الصف الخامس',
    'الصف السادس',
  ],
  coreSubjects: [
    'اللغة العربية',
    'اللغة الإنجليزية',
    'الرياضيات',
    'العلوم',
    'التربية الإسلامية',
    'الدراسات الاجتماعية',
    'المهارات الرقمية',
    'التربية الرياضية',
    'التربية الفنية والموسيقية والمسرحية',
    'التربية المهنية',
  ],
  pipeline: [
    'structure-harvest',
    'outline-reformulation',
    'interactive-lessons',
    'teacher-bridge',
    'video-later',
  ],
});

/** Interactive lessons already shipped or queued for elementary. */
export const ELEMENTARY_LESSON_SLOTS = Object.freeze([
  {
    id: 'g1-math-numberline',
    gradeAr: 'الصف الأول',
    subject: 'الرياضيات',
    unit: 'الجمع',
    titleAr: 'الجمع باستعمال خط الأعداد',
    status: 'live',
    lessonSlug: 'jordan-g1-math-number-line-addition',
    href: '/digital-library/middle-east/jordan/national/grade-1/الرياضيات/الجمع/الجمع-بخط-الأعداد',
  },
  {
    id: 'g1-science-health',
    gradeAr: 'الصف الأول',
    subject: 'العلوم',
    unit: 'الإنسان-والصحة',
    titleAr: 'نحن متشابهون ومختلفون',
    status: 'live',
    lessonSlug: 'jordan-g1-science-alike-different',
    href: '/digital-library/middle-east/jordan/national/grade-1/العلوم/الإنسان-والصحة/نحن-متشابهون-ومختلفون',
  },
  {
    id: 'g2-math-tens',
    gradeAr: 'الصف الثاني',
    subject: 'الرياضيات',
    unit: 'القيمة-المكانية',
    titleAr: 'العشرات والآحاد',
    status: 'live',
    lessonSlug: 'jordan-g2-math-tens-ones',
    href: '/digital-library/middle-east/jordan/national/grade-2/الرياضيات/القيمة-المكانية/العشرات-والآحاد',
  },
  {
    id: 'g3-arabic-reading',
    gradeAr: 'الصف الثالث',
    subject: 'اللغة العربية',
    unit: 'القراءة-والفهم',
    titleAr: 'أفهم ما أقرأ',
    status: 'queued',
    lessonSlug: null,
    href: '/curriculum/jordan/elementary',
  },
  {
    id: 'g4-science-matter',
    gradeAr: 'الصف الرابع',
    subject: 'العلوم',
    unit: 'المادة-والطاقة',
    titleAr: 'حالات المادة',
    status: 'queued',
    lessonSlug: null,
    href: '/curriculum/jordan/elementary',
  },
  {
    id: 'g5-math-fractions',
    gradeAr: 'الصف الخامس',
    subject: 'الرياضيات',
    unit: 'الكسور',
    titleAr: 'مفهوم الكسر',
    status: 'queued',
    lessonSlug: null,
    href: '/curriculum/jordan/elementary',
  },
  {
    id: 'g6-science-ecosystems',
    gradeAr: 'الصف السادس',
    subject: 'العلوم',
    unit: 'النظم-البيئية',
    titleAr: 'السلسلة الغذائية',
    status: 'queued',
    lessonSlug: null,
    href: '/curriculum/jordan/elementary',
  },
]);

function stageRoot() {
  const dir = path.join(process.cwd(), 'library', 'jordan-elementary');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function gradeNumber(gradeAr = '') {
  const m = String(gradeAr).match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

export function listElementaryGradeRows() {
  const snap = getJordanWave1Snapshot();
  const harvestGrades = snap.harvest?.grades || [];
  return ELEMENTARY_STAGE.gradesAr.map((gradeAr) => {
    const harvested = harvestGrades.find((g) => g.gradeAr === gradeAr);
    const registry = jordanGradeRegistry.find(
      (g) => g.gradeAr === gradeAr || g.grade === `الصف ${gradeNumber(gradeAr)}`,
    );
    const subjects =
      harvested?.subjects?.length
        ? harvested.subjects
        : registry?.subjects || [];
    const outlines = listCurriculumOutlines({}).filter(
      (o) =>
        String(o.country || '').toLowerCase() === 'jordan' &&
        (o.educationLevel?.includes(String(gradeNumber(gradeAr))) ||
          o.titleAr?.includes(gradeAr) ||
          o.tags?.includes(gradeAr)),
    );
    const lessons = ELEMENTARY_LESSON_SLOTS.filter((l) => l.gradeAr === gradeAr);
    return {
      gradeAr,
      gradeNum: gradeNumber(gradeAr),
      subjects,
      subjectCount: subjects.length,
      outlines: outlines.length,
      lessonsLive: lessons.filter((l) => l.status === 'live').length,
      lessonsQueued: lessons.filter((l) => l.status === 'queued').length,
      catalogueStatus: registry?.catalogueStatus || 'pending',
    };
  });
}

/**
 * Build elementary stage: ensure harvest, reformulate all G1–6 cells, report slots.
 */
export async function buildJordanElementaryStage(options = {}) {
  const limitPerGrade = Math.max(4, Number(options.limitPerGrade) || 12);
  const publish = options.publish === true;
  const harvestFirst = options.harvest !== false;

  if (harvestFirst) {
    await harvestJordanStructure();
  }

  const teacherSeed = ensureElementaryTeacher();

  const reformReports = [];
  for (const gradeAr of ELEMENTARY_STAGE.gradesAr) {
    const report = reformulateJordanHarvest({
      grade: gradeAr,
      limit: limitPerGrade,
      publish,
    });
    reformReports.push({
      gradeAr,
      createdCount: report.createdCount,
      created: report.created,
    });
  }

  const grades = listElementaryGradeRows();
  const result = {
    schema: 'success-os.jordan-elementary-build.v1',
    stage: ELEMENTARY_STAGE,
    builtAt: erpNow(),
    sources: JORDAN_WAVE1_SOURCES,
    reformReports,
    totals: {
      grades: grades.length,
      subjectCells: grades.reduce((n, g) => n + g.subjectCount, 0),
      outlinesCreated: reformReports.reduce((n, r) => n + r.createdCount, 0),
      lessonsLive: ELEMENTARY_LESSON_SLOTS.filter((l) => l.status === 'live').length,
      lessonsQueued: ELEMENTARY_LESSON_SLOTS.filter((l) => l.status === 'queued').length,
    },
    grades,
    lessonSlots: ELEMENTARY_LESSON_SLOTS,
    teacher: {
      id: teacherSeed.teacher?.id,
      fullName: teacherSeed.teacher?.fullName,
      offerId: teacherSeed.offer?.id,
      offerTitle: teacherSeed.offer?.title,
      durationMinutes: teacherSeed.offer?.durationMinutes,
      href: `/teachers/${teacherSeed.teacher?.id}`,
      offerHref: `/teachers/offers/${teacherSeed.offer?.id}`,
      lessonExplainHref:
        '/digital-library/middle-east/jordan/national/grade-1/الرياضيات/الجمع/الجمع-بخط-الأعداد#ai-class',
    },
    faculty: teacherSeed.faculty,
    earlyFaculty: teacherSeed.earlyFaculty,
    upperFaculty: [],
    aiClasses: listElementaryAiClasses(),
    scienceOffer: teacherSeed.scienceOffer
      ? {
          id: teacherSeed.scienceOffer.id,
          title: teacherSeed.scienceOffer.title,
          href: `/teachers/offers/${teacherSeed.scienceOffer.id}`,
          lessonExplainHref:
            '/digital-library/middle-east/jordan/national/grade-1/العلوم/الإنسان-والصحة/نحن-متشابهون-ومختلفون#ai-class',
        }
      : null,
    next: [
      'Build more AI classes grade-by-grade',
      'Wire avatar video provider when keys available',
    ],
  };

  erpWriteJson(path.join(stageRoot(), 'latest-build.json'), result);
  erpAppendAudit({
    actor: 'Waseem · Partner',
    action: 'jordan.elementary.build',
    moduleId: 'curriculum-os',
    entityId: ELEMENTARY_STAGE.id,
  });
  return result;
}

export function getJordanElementarySnapshot() {
  const teacherSeed = ensureElementaryTeacher();
  const build = erpReadJson(path.join(stageRoot(), 'latest-build.json'));
  const grades = listElementaryGradeRows();
  const joOutlines = listCurriculumOutlines({}).filter((o) => {
    if (String(o.country || '').toLowerCase() !== 'jordan') return false;
    return ELEMENTARY_STAGE.gradesAr.some(
      (g) =>
        o.titleAr?.includes(g) ||
        o.tags?.includes(g) ||
        o.educationLevel?.includes(String(gradeNumber(g))),
    );
  });

  return {
    stage: ELEMENTARY_STAGE,
    sources: JORDAN_WAVE1_SOURCES,
    grades,
    lessonSlots: ELEMENTARY_LESSON_SLOTS,
    outlines: {
      count: joOutlines.length,
      published: joOutlines.filter((o) => o.status === 'published').length,
      items: joOutlines.slice(0, 60).map((o) => ({
        id: o.id,
        titleAr: o.titleAr,
        subject: o.subject,
        status: o.status,
        libraryPath: o.libraryPath,
      })),
    },
    lastBuild: build
      ? {
          builtAt: build.builtAt,
          totals: build.totals,
        }
      : null,
    teacher: {
      id: teacherSeed.teacher?.id,
      fullName: teacherSeed.teacher?.fullName,
      offerId: teacherSeed.offer?.id,
      offerTitle: teacherSeed.offer?.title,
      durationMinutes: teacherSeed.offer?.durationMinutes,
      href: `/teachers/${teacherSeed.teacher?.id}`,
      offerHref: `/teachers/offers/${teacherSeed.offer?.id}`,
      lessonExplainHref:
        '/digital-library/middle-east/jordan/national/grade-1/الرياضيات/الجمع/الجمع-بخط-الأعداد#ai-class',
    },
    faculty: teacherSeed.faculty,
    earlyFaculty: teacherSeed.earlyFaculty,
    upperFaculty: [],
    aiClasses: listElementaryAiClasses(),
    scienceOffer: teacherSeed.scienceOffer
      ? {
          id: teacherSeed.scienceOffer.id,
          title: teacherSeed.scienceOffer.title,
          href: `/teachers/offers/${teacherSeed.scienceOffer.id}`,
          lessonExplainHref:
            '/digital-library/middle-east/jordan/national/grade-1/العلوم/الإنسان-والصحة/نحن-متشابهون-ومختلفون#ai-class',
        }
      : null,
    doctrineAr: [
      'حصة AI = فيديو شرح + تفاعليات + اختبار.',
      'أسماء المعلّمين وهمية داخل المنصة.',
    ],
  };
}
