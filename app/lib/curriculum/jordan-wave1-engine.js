/**
 * Jordan Wave 1 — Country-first curriculum harvest + reformulation.
 *
 * Pipeline:
 *   1) Index official + companion sources (NCCD / Minhaji / JoAcademy)
 *   2) Harvest grade×subject structure (titles & links only — never textbook prose)
 *   3) Reformulate into SUCCESS OS original outlines ready for lessons
 *   4) Later: interactive lessons → teacher delivery → video
 *
 * Copyright: structure metadata only. Copying protected textbook text is forbidden.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  erpAppendAudit,
  erpId,
  erpNow,
  erpReadJson,
  erpText,
  erpWriteJson,
} from '../admin/enterprise-erp-store.js';
import { jordanAuthority, jordanGradeRegistry } from '../../data/jordan-curriculum.js';
import { buildSubjectKnowledgeNode } from '../../data/jordan-national-subject-frameworks.js';
import { ingestCurriculumOutline, listCurriculumOutlines } from './curriculum-os-store.js';

const WAVE = 'JO-WAVE-1';
const ENGINE_VERSION = '1.0.0';

export const JORDAN_WAVE1_SOURCES = Object.freeze([
  {
    id: 'nccd-textbooks',
    nameAr: 'المركز الوطني لتطوير المناهج — الكتب المدرسية',
    nameEn: 'NCCD Textbooks',
    url: 'https://nccd.gov.jo/Ar/Pages/textbooks',
    altUrl: 'https://www.nccd.gov.jo/Ar/Pages/textbooks',
    role: 'official-authority',
    usage: 'structure-and-outcomes-only',
    priority: 1,
  },
  {
    id: 'nccd-home',
    nameAr: 'المركز الوطني لتطوير المناهج',
    nameEn: 'NCCD Portal',
    url: 'https://www.nccd.gov.jo/Default/AR',
    role: 'official-authority',
    usage: 'official-discovery',
    priority: 1,
  },
  {
    id: 'minhaji',
    nameAr: 'منهاجي',
    nameEn: 'Minhaji',
    url: 'https://minhaji.net/',
    role: 'structure-index-companion',
    usage: 'grade-subject-title-index-never-copy-prose',
    priority: 2,
  },
  {
    id: 'joacademy-courses',
    nameAr: 'جو أكاديمي — الدورات',
    nameEn: 'JoAcademy Courses',
    url: 'https://www.joacademy.com/user/courses',
    role: 'market-delivery-companion',
    usage: 'program-taxonomy-and-teacher-delivery-patterns-never-copy',
    priority: 3,
  },
  {
    id: 'moe',
    nameAr: 'وزارة التربية والتعليم',
    nameEn: 'Ministry of Education',
    url: 'https://moe.gov.jo/',
    role: 'ministry',
    usage: 'edition-and-policy-verification',
    priority: 1,
  },
]);

function waveRoot() {
  const dir = path.join(process.cwd(), 'library', 'jordan-wave1');
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, 'harvests'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'reformulations'), { recursive: true });
  return dir;
}

function loadMinhajiSeed() {
  const file = path.join(
    process.cwd(),
    'app',
    'data',
    'jordan-minhaji-structure-seed.json',
  );
  return erpReadJson(file);
}

function stageForGrade(gradeAr = '') {
  if (gradeAr.includes('رياض')) return 'رياض الأطفال';
  const m = String(gradeAr).match(/(\d+)/);
  const n = m ? Number(m[1]) : 0;
  if (n >= 1 && n <= 10) return 'التعليم الأساسي';
  if (n >= 11) return 'التعليم الثانوي — المسار الأكاديمي';
  return 'التعليم الأساسي';
}

function normalizeSubject(titleAr = '') {
  const t = String(titleAr || '').trim();
  if (t === 'العربية لغتي') return 'اللغة العربية';
  if (t === 'التربية الفنية') return 'التربية الفنية والموسيقية والمسرحية';
  return t;
}

function slugify(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

/**
 * Live harvest from Minhaji grade pages (structure titles only).
 * Falls back to committed seed if network fails.
 */
export async function harvestJordanStructure({
  fetcher = fetch,
  useSeedFallback = true,
} = {}) {
  const seed = loadMinhajiSeed();
  const gradePaths = [
    [1, 'رياض الأطفال', '/lesson/1'],
    [2, 'الصف الأول', '/lesson/2'],
    [3, 'الصف الثاني', '/lesson/3'],
    [4, 'الصف الثالث', '/lesson/4'],
    [5, 'الصف الرابع', '/lesson/5'],
    [6, 'الصف الخامس', '/lesson/6'],
    [7, 'الصف السادس', '/lesson/7'],
    [8, 'الصف السابع', '/lesson/8'],
    [9, 'الصف الثامن', '/lesson/9'],
    [10, 'الصف التاسع', '/lesson/10'],
    [11, 'الصف العاشر', '/lesson/11'],
    [13, 'الصف الحادي عشر', '/lesson/13'],
    [14, 'الصف الثاني عشر', '/lesson/14'],
  ];

  const grades = [];
  let liveOk = 0;
  for (const [minhajiId, gradeAr, pathPart] of gradePaths) {
    try {
      const res = await fetcher(`https://minhaji.net${pathPart}`, {
        headers: {
          Accept: 'text/html',
          'User-Agent': 'SUCCESS-OS-Curriculum-Indexer/1.0',
        },
      });
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      const html = await res.text();
      const subjects = extractMinhajiSubjects(html, gradeAr);
      grades.push({
        minhajiId,
        gradeAr,
        sourceUrl: `https://minhaji.net${pathPart}`,
        subjects,
        ok: true,
        source: 'live-minhaji',
      });
      liveOk += 1;
    } catch (error) {
      const seeded = seed?.grades?.find((g) => g.gradeAr === gradeAr);
      if (useSeedFallback && seeded) {
        grades.push({
          ...seeded,
          ok: true,
          source: 'seed-fallback',
          liveError: String(error?.message || error).slice(0, 120),
        });
      } else {
        grades.push({
          minhajiId,
          gradeAr,
          sourceUrl: `https://minhaji.net${pathPart}`,
          subjects: [],
          ok: false,
          error: String(error?.message || error).slice(0, 160),
        });
      }
    }
  }

  // Probe NCCD (may be unreachable from some environments)
  let nccd = { ok: false, error: 'not-attempted' };
  try {
    const res = await fetcher('https://www.nccd.gov.jo/Ar/Pages/textbooks', {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'SUCCESS-OS-Curriculum-Indexer/1.0',
      },
    });
    nccd = {
      ok: res.ok,
      status: res.status,
      url: 'https://www.nccd.gov.jo/Ar/Pages/textbooks',
    };
  } catch (error) {
    nccd = {
      ok: false,
      error: String(error?.message || error).slice(0, 160),
      url: 'https://www.nccd.gov.jo/Ar/Pages/textbooks',
      note: 'Use seed + Minhaji index until NCCD is reachable; partner can attach official PDFs later.',
    };
  }

  const harvest = {
    schema: 'success-os.jordan-wave1-harvest.v1',
    wave: WAVE,
    engineVersion: ENGINE_VERSION,
    country: 'Jordan',
    countryAr: 'الأردن',
    harvestedAt: erpNow(),
    sources: JORDAN_WAVE1_SOURCES,
    nccdProbe: nccd,
    liveMinhajiGrades: liveOk,
    totals: {
      grades: grades.length,
      subjectCells: grades.reduce((n, g) => n + (g.subjects?.length || 0), 0),
      okGrades: grades.filter((g) => g.ok).length,
    },
    grades,
    rights: {
      copyBookText: false,
      permittedUse: 'structure-titles-links-and-original-reformulation',
      generateOriginalSuccessOsContentOnly: true,
    },
    nextSteps: [
      'reformulate → outlines',
      'author interactive lessons',
      'attach real teacher offers',
      'produce video scripts',
    ],
  };

  const file = path.join(waveRoot(), 'harvests', `latest.json`);
  erpWriteJson(file, harvest);
  erpWriteJson(
    path.join(waveRoot(), 'harvests', `${harvest.harvestedAt.slice(0, 10)}.json`),
    harvest,
  );
  erpAppendAudit({
    actor: 'Waseem · Partner',
    action: 'jordan.wave1.harvest',
    moduleId: 'curriculum-os',
    entityId: WAVE,
  });
  return harvest;
}

function extractMinhajiSubjects(html, gradeAr) {
  const gradeNames = new Set([
    'رياض الأطفال',
    'الصف الأول',
    'الصف الثاني',
    'الصف الثالث',
    'الصف الرابع',
    'الصف الخامس',
    'الصف السادس',
    'الصف السابع',
    'الصف الثامن',
    'الصف التاسع',
    'الصف العاشر',
    'الصف الحادي عشر',
    'الصف الثاني عشر',
  ]);
  const skip = new Set([
    'المسار الأكاديمي',
    'المسار المهني التقني',
    'الفروع الأكاديمية - قديم',
    'الفروع المهنية - قديم',
    'الخطة الدراسية',
    'كتب رياض أطفال',
    'المجموعة القصصية',
    'البطاقات',
    'دليل رياض الأطفال',
    'أناشيد أطفال',
  ]);
  const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const subjects = [];
  const seen = new Set();
  let match;
  while ((match = pattern.exec(html))) {
    const href = match[1];
    if (!href.includes('/lesson/')) continue;
    const label = String(match[2] || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&#160;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^_+|_+$/g, '');
    if (!label || label.length > 70) continue;
    if (gradeNames.has(label) || label === gradeAr) continue;
    if (skip.has(label) || seen.has(label)) continue;
    seen.add(label);
    subjects.push({
      titleAr: label,
      href: href.startsWith('http') ? href : `https://minhaji.net${href}`,
    });
  }
  return subjects;
}

function outlineMarkdownFromNode(node, meta = {}) {
  const units = node.units || [];
  const lines = [
    `# ${node.subject} · ${node.grade}`,
    '',
    `> موجة الأردن 1 — إعادة صياغة أصلية SUCCESS OS (ليست نسخاً من كتاب مدرسي)`,
    '',
    `**المرحلة:** ${node.stage}  `,
    `**المصدر الهيكلي:** ${meta.structureSource || 'Minhaji index + NCCD grade catalogue'}  `,
    `**المرجع الرسمي:** ${meta.officialCatalogUrl || 'https://nccd.gov.jo/Ar/Pages/textbooks'}`,
    '',
    '## نواتج عامة',
    ...(node.learningOutcomes || []).map((o) => `- ${o}`),
    '',
    '## الوحدات والدروس (جاهزة لبناء الدرس التفاعلي)',
  ];
  for (const unit of units) {
    lines.push('', `### ${unit.titleAr}`, '');
    for (const lesson of unit.lessons || []) {
      lines.push(`#### ${lesson.lessonId} · ${lesson.titleAr}`);
      for (const outcome of lesson.learningOutcomes || []) {
        lines.push(`- ${outcome}`);
      }
      if (lesson.requiredSkills?.length) {
        lines.push(`- مهارات: ${lesson.requiredSkills.join(' · ')}`);
      }
      lines.push('');
    }
  }
  lines.push(
    '## مسار الإنتاج التالي',
    '1. بناء درس تفاعلي (معرفة + 3D/وسائط + تمارين + اختبار)',
    '2. ربط معلّم حقيقي من Teachers OS',
    '3. كتابة سكربت فيديو أصلي ثم إنتاج الفيديو',
    '',
    '## حقوق',
    '- لا نعيد نشر نص الكتب المدرسية.',
    '- العناوين الهيكلية للمطابقة فقط؛ المحتوى أصلي SUCCESS OS.',
  );
  return lines.join('\n');
}

/**
 * Reformulate harvested grade×subject cells into Curriculum OS outlines
 * using Jordan national subject frameworks (original content).
 */
export function reformulateJordanHarvest(options = {}) {
  const harvestFile = path.join(waveRoot(), 'harvests', 'latest.json');
  const harvest =
    options.harvest ||
    erpReadJson(harvestFile) ||
    loadMinhajiSeed();
  if (!harvest?.grades?.length) {
    throw new Error('HARVEST_REQUIRED');
  }

  const gradeFilter = erpText(options.grade);
  const subjectFilter = erpText(options.subject);
  const limit = Math.max(1, Number(options.limit) || 24);
  const publish = options.publish === true;

  const created = [];
  let considered = 0;

  for (const gradeRow of harvest.grades || []) {
    if (!gradeRow.ok) continue;
    if (gradeFilter && gradeRow.gradeAr !== gradeFilter) continue;
    const stage = stageForGrade(gradeRow.gradeAr);
    const registry = jordanGradeRegistry.find((g) => g.grade === gradeRow.gradeAr);
    const officialCatalogUrl =
      registry?.officialCatalogUrl || 'https://nccd.gov.jo/Ar/Pages/textbooks';

    for (const sub of gradeRow.subjects || []) {
      const subject = normalizeSubject(sub.titleAr);
      if (subjectFilter && !subject.includes(subjectFilter) && !sub.titleAr.includes(subjectFilter)) {
        continue;
      }
      considered += 1;
      if (created.length >= limit) break;

      const node = buildSubjectKnowledgeNode({
        stage,
        grade: gradeRow.gradeAr,
        subject,
        officialCatalogUrl,
        catalogueStatus: 'indexed-minhaji-pending-nccd-human-review',
        authorities: [
          ...JORDAN_WAVE1_SOURCES.map((s) => ({ name: s.nameEn, url: s.url })),
          ...(sub.href ? [{ name: 'Minhaji subject index', url: sub.href }] : []),
        ],
      });

      const id = `jo-w1-${slugify(gradeRow.gradeAr)}-${slugify(subject)}`;
      const markdown = outlineMarkdownFromNode(node, {
        structureSource: gradeRow.sourceUrl || 'minhaji.net',
        officialCatalogUrl,
      });

      const outline = ingestCurriculumOutline({
        id,
        status: publish ? 'published' : 'draft',
        uploadedBy: 'Jordan Wave 1 Engine',
        source: 'jordan-wave1-reformulate',
        titleAr: `${subject} · ${gradeRow.gradeAr}`,
        titleEn: `${subject} · ${gradeRow.gradeAr}`,
        region: 'middle-east',
        country: 'jordan',
        curriculumType: 'national',
        educationLevel: slugify(gradeRow.gradeAr) || 'grade',
        subject,
        chapter: node.units?.[0]?.titleAr || 'unit-1',
        lessonSlug: 'ib-physics-photoelectric-effect',
        libraryPath: `/digital-library/middle-east/jordan/national/${slugify(gradeRow.gradeAr)}/${encodeURIComponent(subject)}`,
        fileName: `${id}.md`,
        mimeType: 'text/markdown',
        tags: ['Jordan', 'Wave1', gradeRow.gradeAr, subject, 'national'],
        outlineMarkdown: markdown,
        objectives: node.learningOutcomes || [],
        teacherHints: {
          subjects: [subject, sub.titleAr],
          curricula: ['Jordan', 'national', 'توجيهي', gradeRow.gradeAr],
        },
        notes: `structureHref=${sub.href || ''}`,
      });
      created.push({
        id: outline.id,
        grade: gradeRow.gradeAr,
        subject,
        units: node.units?.length || 0,
        lessons: node.units?.reduce((n, u) => n + (u.lessons?.length || 0), 0) || 0,
        status: outline.status,
      });
    }
    if (created.length >= limit) break;
  }

  const report = {
    schema: 'success-os.jordan-wave1-reformulation.v1',
    wave: WAVE,
    engineVersion: ENGINE_VERSION,
    reformulatedAt: erpNow(),
    considered,
    createdCount: created.length,
    limit,
    created,
    pipeline: {
      now: 'outlines-ready',
      next: 'interactive-lessons',
      then: 'teacher-bridge',
      later: 'video-scripts',
    },
  };

  erpWriteJson(path.join(waveRoot(), 'reformulations', 'latest.json'), report);
  erpAppendAudit({
    actor: 'Waseem · Partner',
    action: 'jordan.wave1.reformulate',
    moduleId: 'curriculum-os',
    entityId: WAVE,
  });
  return report;
}

export async function runJordanWave1({
  harvest = true,
  reformulate = true,
  limit = 24,
  grade = '',
  subject = '',
  publish = false,
} = {}) {
  const harvestResult = harvest
    ? await harvestJordanStructure()
    : erpReadJson(path.join(waveRoot(), 'harvests', 'latest.json')) ||
      loadMinhajiSeed();

  const reform =
    reformulate
      ? reformulateJordanHarvest({
          harvest: harvestResult,
          limit,
          grade,
          subject,
          publish,
        })
      : null;

  return {
    wave: WAVE,
    engineVersion: ENGINE_VERSION,
    harvest: {
      totals: harvestResult.totals,
      nccdProbe: harvestResult.nccdProbe,
      liveMinhajiGrades: harvestResult.liveMinhajiGrades,
    },
    reformulation: reform,
    sources: JORDAN_WAVE1_SOURCES,
    snapshot: getJordanWave1Snapshot(),
  };
}

export function getJordanWave1Snapshot() {
  const harvest =
    erpReadJson(path.join(waveRoot(), 'harvests', 'latest.json')) ||
    loadMinhajiSeed();
  const reform = erpReadJson(path.join(waveRoot(), 'reformulations', 'latest.json'));
  const joOutlines = listCurriculumOutlines({ country: undefined }).filter(
    (o) =>
      String(o.country || '').toLowerCase() === 'jordan' ||
      erpText(o.source).includes('jordan-wave1') ||
      (o.tags || []).includes('Jordan'),
  );

  return {
    wave: WAVE,
    engineVersion: ENGINE_VERSION,
    country: 'Jordan',
    countryAr: 'الأردن',
    doctrineAr: [
      'نبلش دولة دولة: الأردن أولاً.',
      'نسحب الهيكل (صف × مادة × وحدات) من مصادر رسمية ومؤشرات هيكلية.',
      'نعيد الصياغة بأسلوب SUCCESS OS الأصلي — ثم نبني الدروس، وبعدها الفيديو.',
      'لا ننسخ نص الكتب المدرسية.',
    ],
    sources: JORDAN_WAVE1_SOURCES,
    authority: jordanAuthority,
    harvest: harvest
      ? {
          harvestedAt: harvest.harvestedAt || harvest.retrievedAt || null,
          totals: harvest.totals || {
            grades: harvest.grades?.length || 0,
            subjectCells:
              harvest.grades?.reduce((n, g) => n + (g.subjects?.length || 0), 0) || 0,
          },
          nccdProbe: harvest.nccdProbe || null,
          grades: (harvest.grades || []).map((g) => ({
            gradeAr: g.gradeAr,
            subjects: (g.subjects || []).map((s) => s.titleAr || s),
            source: g.source || harvest.source || 'seed',
            ok: g.ok !== false,
          })),
        }
      : null,
    reformulation: reform,
    outlines: {
      count: joOutlines.length,
      published: joOutlines.filter((o) => o.status === 'published').length,
      draft: joOutlines.filter((o) => o.status === 'draft').length,
      items: joOutlines.slice(0, 40).map((o) => ({
        id: o.id,
        titleAr: o.titleAr,
        subject: o.subject,
        educationLevel: o.educationLevel,
        status: o.status,
        libraryPath: o.libraryPath,
      })),
    },
    nextCountryHint: 'بعد استقرار الأردن: فلسطين / السعودية / مصر…',
  };
}
