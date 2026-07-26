/**
 * Curriculum OS — partner-uploaded outlines + lesson↔teacher bindings.
 * Unifies Global Digital Library interactive lessons with real human teachers.
 */

import {
  erpAppendAudit,
  erpId,
  erpList,
  erpNow,
  erpReadCollection,
  erpText,
  erpWriteCollection,
} from '../admin/enterprise-erp-store.js';
import { listOffers, listTeachers } from '../teachers/teachers-os-store.js';
import { ensureS4sWaseemChemistry } from './seed-s4s-waseem-chemistry.js';

const MAX_OUTLINE_CHARS = 120000;
const MAX_FILE_NAME = 180;

function collection(name) {
  return erpReadCollection(name);
}

function writeCollection(name, items) {
  return erpWriteCollection(name, { items, updatedAt: erpNow() });
}

function slugify(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Seed outlines so the OS is never empty before partner uploads. */
function ensureSeedOutlines() {
  const items = erpList(collection('curriculum-outlines').items);
  if (items.length) return items;

  const now = erpNow();
  const seed = [
    {
      id: 'seed-ib-physics-e2-photoelectric',
      status: 'published',
      createdAt: now,
      updatedAt: now,
      uploadedBy: 'SUCCESS OS · Curriculum Seed',
      source: 'web_research',
      titleAr: 'IB Physics HL · E.2 التأثير الكهروضوئي',
      titleEn: 'IB Physics HL · E.2 Photoelectric Effect',
      region: 'international-systems',
      country: 'global',
      curriculumType: 'ib',
      educationLevel: 'dp',
      subject: 'physics',
      chapter: 'quantum-physics',
      lessonSlug: 'ib-physics-photoelectric-effect',
      libraryPath:
        '/digital-library/international-systems/global/ib/dp/physics/quantum-physics/photoelectric-effect',
      fileName: 'ib-physics-e2-outline.md',
      mimeType: 'text/markdown',
      tags: ['IB', 'Physics', 'HL', 'E.2', 'quantum', 'photoelectric'],
      outlineMarkdown: `# IB Physics HL — Topic E.2 Quantum Physics (Photoelectric Effect)

## Guiding questions
- Why does classical wave theory fail to explain the photoelectric effect?
- How does Einstein’s photon model conserve energy for one photon ↔ one electron?

## Understandings (partner-ready outline)
1. Photoelectric emission is evidence for the particle nature of light.
2. Threshold frequency \(f_0\): minimum frequency that releases photoelectrons from a metal.
3. Work function \(\\Phi\): minimum energy to free a surface electron; \(\\Phi = h f_0\).
4. Einstein equation: \(E_{\\max} = hf - \\Phi\) and \(E_{\\max} = eV_s\).
5. Intensity raises photoelectron rate (above threshold), not maximum KE.
6. Emission is effectively instantaneous above threshold.

## Suggested lesson modules (SUCCESS OS)
- A Knowledge base (markdown + KaTeX)
- B 3D visualizer (photoelectric)
- C Smart workspace
- D Scientific calculator
- E Solved examples (Easy → Hard)
- F Gamified quiz

## Human teacher layer
Interactive modules are study tools. Delivery, coaching, and recorded/live sessions belong to **real Teachers OS** profiles and offers.

## Attribution / research anchors
- IB Physics syllabus Theme E · Nuclear and quantum physics (HL E.2)
- OpenStax College Physics (CC BY) — photoelectric chapters commonly used for continuum reading
- Companion interactive path: photoelectric-effect lesson in Global Digital Library
`,
      objectives: [
        'Explain threshold frequency and work function',
        'Apply Einstein’s photoelectric equation',
        'Contrast classical wave predictions with observations',
        'Connect interactive modules to a human teacher offer',
      ],
      teacherHints: {
        subjects: ['physics', 'فيزياء'],
        curricula: ['IB', 'ib', 'Diploma'],
      },
    },
    {
      id: 'seed-jordan-tawjihi-math-derivatives',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      uploadedBy: 'SUCCESS OS · Curriculum Seed',
      source: 'placeholder_awaiting_partner_files',
      titleAr: 'الأردن · توجيهي · المشتقات (مسودة بانتظار ملفاتك)',
      titleEn: 'Jordan Tawjihi · Derivatives (draft awaiting your files)',
      region: 'middle-east',
      country: 'jordan',
      curriculumType: 'national',
      educationLevel: 'tawjihi',
      subject: 'الرياضيات',
      chapter: 'التفاضل',
      lessonSlug: 'ib-physics-photoelectric-effect',
      libraryPath:
        '/digital-library/middle-east/jordan/national/tawjihi/%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA/%D8%A7%D9%84%D8%AA%D9%81%D8%A7%D8%B6%D9%84/%D8%A7%D9%84%D9%85%D8%B4%D8%AA%D9%82%D8%A7%D8%AA',
      fileName: 'jordan-tawjihi-derivatives-awaiting.md',
      mimeType: 'text/markdown',
      tags: ['Jordan', 'Tawjihi', 'Math', 'awaiting-upload'],
      outlineMarkdown: `# مسودة منهاج — بانتظار ملفاتك

ارفع ملف المنهاج (Markdown / نص / JSON outline) من صفحة المناهج.
سنربط كل فصل بمعلم حقيقي + درس تفاعلي في المكتبة الرقمية.
`,
      objectives: [
        'استقبال ملفات المنهاج من الشريك',
        'ربط الفصل بمعلم بشري وعرض Teachers OS',
      ],
      teacherHints: {
        subjects: ['math', 'رياضيات', 'الرياضيات'],
        curricula: ['توجيهي', 'Jordan', 'national'],
      },
    },
  ];

  writeCollection('curriculum-outlines', seed);
  return seed;
}

export function listCurriculumOutlines(filters = {}) {
  let items = ensureSeedOutlines();
  if (filters.status) items = items.filter((o) => o.status === filters.status);
  if (filters.region) items = items.filter((o) => o.region === filters.region);
  if (filters.subject) {
    const s = String(filters.subject).toLowerCase();
    items = items.filter(
      (o) =>
        String(o.subject || '').toLowerCase().includes(s) ||
        erpList(o.tags).some((t) => String(t).toLowerCase().includes(s)),
    );
  }
  if (filters.lessonSlug) {
    items = items.filter((o) => o.lessonSlug === filters.lessonSlug);
  }
  if (filters.q) {
    const q = String(filters.q).toLowerCase();
    items = items.filter((o) =>
      JSON.stringify({
        titleAr: o.titleAr,
        titleEn: o.titleEn,
        tags: o.tags,
        subject: o.subject,
        chapter: o.chapter,
      })
        .toLowerCase()
        .includes(q),
    );
  }
  return items;
}

export function getCurriculumOutline(id) {
  return listCurriculumOutlines().find((o) => o.id === id) || null;
}

/**
 * Ingest a partner curriculum file/outline.
 * Stores text/markdown/json text only — not large binaries.
 */
export function ingestCurriculumOutline(input = {}) {
  const items = listCurriculumOutlines();
  const now = erpNow();
  const id = erpText(input.id) || erpId();
  const existing = items.find((o) => o.id === id);

  let outlineMarkdown = erpText(input.outlineMarkdown) || erpText(input.text) || '';
  if (!outlineMarkdown && input.jsonOutline) {
    try {
      outlineMarkdown = `\`\`\`json\n${JSON.stringify(input.jsonOutline, null, 2).slice(0, MAX_OUTLINE_CHARS)}\n\`\`\``;
    } catch {
      outlineMarkdown = '';
    }
  }
  if (outlineMarkdown.length > MAX_OUTLINE_CHARS) {
    outlineMarkdown = outlineMarkdown.slice(0, MAX_OUTLINE_CHARS);
  }

  const titleAr = erpText(input.titleAr) || erpText(input.title) || 'منهاج مرفوع';
  const titleEn = erpText(input.titleEn) || erpText(input.title) || titleAr;
  const subject = erpText(input.subject) || 'general';
  const chapter = erpText(input.chapter) || slugify(titleEn) || 'chapter';
  const region = erpText(input.region) || 'middle-east';
  const country = erpText(input.country) || 'jordan';
  const curriculumType = erpText(input.curriculumType) || 'national';
  const educationLevel = erpText(input.educationLevel) || 'secondary';
  const lessonSlug =
    erpText(input.lessonSlug) || 'ib-physics-photoelectric-effect';

  if (!outlineMarkdown) throw new Error('OUTLINE_CONTENT_REQUIRED');

  const fileName = (erpText(input.fileName) || `${slugify(titleEn) || 'outline'}.md`).slice(
    0,
    MAX_FILE_NAME,
  );

  const row = {
    id,
    status: erpText(input.status) || existing?.status || 'draft',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    uploadedBy: erpText(input.uploadedBy) || existing?.uploadedBy || 'Waseem · Partner',
    source: erpText(input.source) || 'partner_upload',
    titleAr,
    titleEn,
    region,
    country,
    curriculumType,
    educationLevel,
    subject,
    chapter,
    lessonSlug,
    libraryPath:
      erpText(input.libraryPath) ||
      `/digital-library/${region}/${country}/${curriculumType}/${educationLevel}/${encodeURIComponent(subject)}/${encodeURIComponent(chapter)}/${slugify(titleEn) || 'lesson'}`,
    fileName,
    mimeType: erpText(input.mimeType) || 'text/markdown',
    tags: erpList(input.tags).length
      ? erpList(input.tags).map(erpText).filter(Boolean)
      : existing?.tags || [curriculumType, subject, country],
    outlineMarkdown,
    objectives: erpList(input.objectives).length
      ? erpList(input.objectives).map(erpText).filter(Boolean)
      : existing?.objectives || [],
    teacherHints: {
      subjects: erpList(input.teacherHints?.subjects).length
        ? erpList(input.teacherHints.subjects).map(erpText)
        : [subject],
      curricula: erpList(input.teacherHints?.curricula).length
        ? erpList(input.teacherHints.curricula).map(erpText)
        : [curriculumType],
    },
    notes: erpText(input.notes) || existing?.notes || '',
  };

  const next = existing
    ? items.map((o) => (o.id === id ? row : o))
    : [row, ...items];
  writeCollection('curriculum-outlines', next);
  erpAppendAudit({
    actor: row.uploadedBy,
    action: existing ? 'curriculum.outline.update' : 'curriculum.outline.ingest',
    moduleId: 'curriculum-os',
    entityId: id,
  });
  return row;
}

export function publishCurriculumOutline(id, actor = 'partner') {
  const items = listCurriculumOutlines();
  const existing = items.find((o) => o.id === id);
  if (!existing) throw new Error('OUTLINE_NOT_FOUND');
  const row = { ...existing, status: 'published', updatedAt: erpNow() };
  writeCollection(
    'curriculum-outlines',
    items.map((o) => (o.id === id ? row : o)),
  );
  erpAppendAudit({
    actor,
    action: 'curriculum.outline.publish',
    moduleId: 'curriculum-os',
    entityId: id,
  });
  return row;
}

function haystack(teacher) {
  return [
    ...(teacher.subjects || []),
    ...(teacher.curricula || []),
    teacher.fullName,
    teacher.bio,
    teacher.aboutStudent,
  ]
    .join(' ')
    .toLowerCase();
}

/**
 * Match approved teachers + published offers to a lesson/outline context.
 */
export function matchTeachersForLesson(context = {}) {
  try {
    ensureS4sWaseemChemistry();
  } catch {
    // Seed is best-effort; matching still proceeds with existing profiles.
  }

  const subjects = erpList(context.subjects)
    .map((s) => String(s).toLowerCase())
    .filter(Boolean);
  const curricula = erpList(context.curricula)
    .map((s) => String(s).toLowerCase())
    .filter(Boolean);
  const q = erpText(context.q).toLowerCase();

  const teachers = listTeachers().filter((t) => t.status === 'approved');
  const offers = listOffers({ publishedOnly: true });

  const scored = teachers
    .map((t) => {
      const h = haystack(t);
      let score = 0;
      for (const s of subjects) if (h.includes(s)) score += 3;
      for (const c of curricula) if (h.includes(c)) score += 2;
      if (q && h.includes(q)) score += 1;
      if (!subjects.length && !curricula.length && !q) score = 1;
      const teacherOffers = offers.filter((o) => o.teacherId === t.id);
      if (teacherOffers.length) score += 1;
      return { teacher: t, score, offers: teacherOffers };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return scored.map((x) => ({
    id: x.teacher.id,
    fullName: x.teacher.fullName,
    subjects: x.teacher.subjects || [],
    curricula: x.teacher.curricula || [],
    city: x.teacher.city,
    country: x.teacher.country,
    aboutStudent: x.teacher.aboutStudent || x.teacher.bio || '',
    photoDataUrl: x.teacher.photoDataUrl || '',
    href: `/teachers/${x.teacher.id}`,
    score: x.score,
    offers: x.offers.slice(0, 3).map((o) => ({
      id: o.id,
      title: o.title,
      type: o.type,
      price: o.price,
      currency: o.currency,
      subject: o.subject,
      curriculum: o.curriculum,
      href: `/teachers/offers/${o.id}`,
    })),
  }));
}

export function getCurriculumOsSnapshot() {
  let s4s = null;
  try {
    s4s = ensureS4sWaseemChemistry();
  } catch {
    s4s = null;
  }
  const outlines = listCurriculumOutlines();
  return {
    counts: {
      outlines: outlines.length,
      published: outlines.filter((o) => o.status === 'published').length,
      draft: outlines.filter((o) => o.status === 'draft').length,
      teachersApproved: listTeachers().filter((t) => t.status === 'approved').length,
      offersLive: listOffers({ publishedOnly: true }).length,
    },
    outlines: outlines.slice(0, 40),
    featuredTeacher: s4s
      ? {
          id: s4s.teacher?.id,
          fullName: s4s.teacher?.fullName,
          offerId: s4s.offer?.id,
          lessonSlug: s4s.lessonSlug,
          lessonHref: s4s.lessonHref,
          source: 'https://www.success4sureacademy.com/waseem-al-labadi',
        }
      : null,
    doctrine: {
      titleAr: 'عقيدة المناهج الحية',
      lines: [
        'الملف يُستقبل → يُحوَّل إلى outline → يُربط بدرس تفاعلي.',
        'الدرس التفاعلي/ثلاثي الأبعاد أداة دراسة — المعلم الحقيقي هو صاحب العرض.',
        'الشريك يرفع المناهج؛ المنصة تربطها بالمكتبة والمعلمين والجذور.',
        'Success 4 Sure · Mr. Waseem Al-Labadi يقود شرح الكيمياء ≥30 دقيقة على المنصة.',
      ],
    },
  };
}
