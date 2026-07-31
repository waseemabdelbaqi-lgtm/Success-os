import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const COUNTRY_ALIASES = new Map([
  ['Jordan', { id: 'jo', code: 'JO', name: 'Jordan', nameAr: 'الأردن' }],
  ['الأردن', { id: 'jo', code: 'JO', name: 'Jordan', nameAr: 'الأردن' }],
  ['المنهاج الوطني الأردني', { id: 'jo', code: 'JO', name: 'Jordan', nameAr: 'الأردن' }],
  ['Saudi Arabia', { id: 'sa', code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية' }],
  ['المنهج الوطني السعودي', { id: 'sa', code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية' }],
  ['United Arab Emirates', { id: 'ae', code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة' }],
  ['منهاج وزارة التربية والتعليم الإماراتي', { id: 'ae', code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة' }],
  ['Qatar', { id: 'qa', code: 'QA', name: 'Qatar', nameAr: 'قطر' }],
  ['المنهاج الوطني القطري', { id: 'qa', code: 'QA', name: 'Qatar', nameAr: 'قطر' }],
  ['Bahrain', { id: 'bh', code: 'BH', name: 'Bahrain', nameAr: 'البحرين' }],
  ['المنهج الوطني البحريني', { id: 'bh', code: 'BH', name: 'Bahrain', nameAr: 'البحرين' }],
  ['Kuwait', { id: 'kw', code: 'KW', name: 'Kuwait', nameAr: 'الكويت' }],
  ['المنهج الوطني الكويتي', { id: 'kw', code: 'KW', name: 'Kuwait', nameAr: 'الكويت' }],
  ['Oman', { id: 'om', code: 'OM', name: 'Oman', nameAr: 'عُمان' }],
  ['المنهج الوطني العُماني', { id: 'om', code: 'OM', name: 'Oman', nameAr: 'عُمان' }],
  ['Iraq', { id: 'iq', code: 'IQ', name: 'Iraq', nameAr: 'العراق' }],
  ['المنهج الوطني العراقي', { id: 'iq', code: 'IQ', name: 'Iraq', nameAr: 'العراق' }],
  ['Syria', { id: 'sy', code: 'SY', name: 'Syria', nameAr: 'سوريا' }],
  ['المنهج الوطني السوري', { id: 'sy', code: 'SY', name: 'Syria', nameAr: 'سوريا' }],
  ['Lebanon', { id: 'lb', code: 'LB', name: 'Lebanon', nameAr: 'لبنان' }],
  ['المنهج الرسمي اللبناني', { id: 'lb', code: 'LB', name: 'Lebanon', nameAr: 'لبنان' }],
  ['Palestine', { id: 'ps', code: 'PS', name: 'Palestine', nameAr: 'فلسطين' }],
  ['المنهاج الوطني الفلسطيني', { id: 'ps', code: 'PS', name: 'Palestine', nameAr: 'فلسطين' }],
  ['Egypt', { id: 'eg', code: 'EG', name: 'Egypt', nameAr: 'مصر' }],
  ['المنهج الوطني المصري', { id: 'eg', code: 'EG', name: 'Egypt', nameAr: 'مصر' }],
  ['Yemen', { id: 'ye', code: 'YE', name: 'Yemen', nameAr: 'اليمن' }],
  ['اليمن', { id: 'ye', code: 'YE', name: 'Yemen', nameAr: 'اليمن' }],
  ['المنهج الوطني اليمني', { id: 'ye', code: 'YE', name: 'Yemen', nameAr: 'اليمن' }],
]);

const DIRECT_COUNTRY_NAMES = new Map(
  [...COUNTRY_ALIASES.values()].flatMap((country) => [
    [country.name, country],
    [country.nameAr, country],
  ]),
);

let memoryCache = null;

function rootDir() {
  return process.cwd();
}

function booksDir() {
  // Prefer committed in-repo books; fall back to legacy gitignored library path.
  const committed = path.join(
    rootDir(),
    'content',
    'datasets',
    'global-knowledge',
    'books',
  );
  if (fs.existsSync(committed)) return committed;
  return path.join(rootDir(), 'library', 'global-knowledge', 'books');
}

function draftsDir() {
  return path.join(rootDir(), 'library', 'content-engine', 'drafts');
}

function previewDir() {
  const committed = path.join(
    rootDir(),
    'content',
    'datasets',
    'middle-east-live-preview',
  );
  // Always prefer committed store so Jordan books ship with the repo.
  return committed;
}

function indexPath() {
  return path.join(previewDir(), 'MIDDLE-EAST-LIVE-BOOK-INDEX.json');
}

function reportPath() {
  return path.join(previewDir(), 'NAVIGATION-REPORT.json');
}

function slug(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function stableId(prefix, ...parts) {
  const digest = crypto
    .createHash('sha256')
    .update(parts.map((part) => String(part || '')).join('|'))
    .digest('hex')
    .slice(0, 14);
  return `${prefix}-${digest}`;
}

function safeJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function countryFor(identity = {}) {
  const country = String(identity.country || '');
  const curriculum = String(identity.curriculum || '');
  return (
    DIRECT_COUNTRY_NAMES.get(country) ||
    COUNTRY_ALIASES.get(country) ||
    COUNTRY_ALIASES.get(curriculum) ||
    null
  );
}

function latestDirectoryStamp() {
  let stamp = 0;
  for (const dir of [booksDir(), draftsDir()]) {
    if (!fs.existsSync(dir)) continue;
    stamp = Math.max(stamp, fs.statSync(dir).mtimeMs);
  }
  return stamp;
}

function bookVersion(book, stat) {
  if (typeof book.version === 'string') return book.version;
  if (book.version?.number) return book.version.number;
  const date = new Date(book.updatedAt || book.savedAt || book.createdAt || stat.mtime);
  return `preview-${date.toISOString().slice(0, 10).replaceAll('-', '.')}`;
}

function createMetadata(book, file, sourceType) {
  const identity = book.identity || {};
  const country = countryFor(identity);
  if (!country) return null;

  const stat = fs.statSync(file);
  const systemName =
    identity.educationalSystem || identity.stage || 'National Education';
  const curriculumName = identity.curriculum || `${country.name} Curriculum`;
  const gradeName = identity.grade || identity.academicLevel || 'Academic Level';
  const subjectName = identity.subject || 'Subject';
  const systemId = stableId('system', country.id, systemName);
  const curriculumId = stableId('curriculum', country.id, curriculumName);
  const gradeId = stableId('grade', curriculumId, gradeName);
  const subjectId = stableId('subject', gradeId, subjectName);
  const bookId = String(book.id || stableId('book', subjectId, sourceType));
  const updatedAt = new Date(
    book.updatedAt || book.savedAt || book.createdAt || stat.mtime,
  ).toISOString();

  const units = Array.isArray(book.units) ? book.units : [];
  const lessons = units.flatMap((unit) => unit.lessons || []);

  return {
    bookId,
    countryId: country.id,
    countryCode: country.code,
    country: country.name,
    countryAr: country.nameAr,
    systemId,
    educationalSystem: systemName,
    curriculumId,
    curriculum: curriculumName,
    gradeId,
    grade: gradeName,
    subjectId,
    subject: subjectName,
    language: identity.language || 'ar',
    version: bookVersion(book, stat),
    updatedAt,
    bookStatus:
      book.quality?.bookStatus ||
      book.subjectCompletionReport?.status ||
      book.status ||
      'DRAFT_PREVIEW',
    sourceType,
    sourceFile: file,
    mtimeMs: stat.mtimeMs,
    unitCount: units.length,
    lessonCount: lessons.length,
    hasTableOfContents: Array.isArray(book.tableOfContents)
      ? book.tableOfContents.length > 0
      : units.length > 0,
    bookButtonActive: units.length > 0 && lessons.length > 0,
    searchText: [
      country.name,
      country.nameAr,
      systemName,
      curriculumName,
      gradeName,
      subjectName,
    ]
      .join(' ')
      .toLocaleLowerCase(),
  };
}

function draftMetadata(draft, file) {
  const identity = draft.identity || {};
  const normalized = {
    ...draft,
    id: `draft__${identity.countryId || 'xx'}__${slug(identity.curriculum)}__${slug(identity.grade)}__${slug(identity.subject)}`,
    identity: {
      country: identity.country,
      curriculum: identity.curriculum,
      educationalSystem: identity.educationalSystem,
      grade: identity.grade,
      academicLevel: identity.academicLevel,
      subject: identity.subject,
      language: identity.language,
    },
  };
  return createMetadata(normalized, file, 'phase-8-draft');
}

function hierarchyFromBooks(books) {
  const countries = new Map();
  const systems = new Map();
  const curricula = new Map();
  const grades = new Map();
  const subjects = new Map();

  for (const book of books) {
    countries.set(book.countryId, {
      id: book.countryId,
      code: book.countryCode,
      name: book.country,
      nameAr: book.countryAr,
    });
    systems.set(book.systemId, {
      id: book.systemId,
      countryId: book.countryId,
      name: book.educationalSystem,
      type: 'national',
    });
    curricula.set(book.curriculumId, {
      id: book.curriculumId,
      systemId: book.systemId,
      name: book.curriculum,
    });
    grades.set(book.gradeId, {
      id: book.gradeId,
      curriculumId: book.curriculumId,
      name: book.grade,
    });
    subjects.set(book.subjectId, {
      id: book.subjectId,
      gradeId: book.gradeId,
      name: book.subject,
      bookId: book.bookId,
      version: book.version,
      updatedAt: book.updatedAt,
      status: book.bookStatus,
    });
  }

  return {
    countries: [...countries.values()].sort((a, b) => a.name.localeCompare(b.name)),
    systems: [...systems.values()],
    curricula: [...curricula.values()],
    grades: [...grades.values()],
    subjects: [...subjects.values()],
  };
}

function createNavigationReport(index) {
  const workingPages = [
    '/student/books',
    '/student/subjects/[subjectId]?bookId=…',
    '/student/books/[bookId]/read',
    '/api/student-books?view=index',
    '/api/student-books?view=book&id=…',
    '/api/student-books?view=version&id=…',
  ];
  const missingCountryCodes = [
    'JO',
    'SA',
    'AE',
    'QA',
    'BH',
    'KW',
    'OM',
    'IQ',
    'SY',
    'LB',
    'PS',
    'EG',
    'YE',
  ].filter(
    (code) => !index.hierarchy.countries.some((country) => country.code === code),
  );

  return {
    schema: 'success-os.middle-east-navigation-report.v1',
    phase: 'PHASE_10_MIDDLE_EAST_DIGITAL_LIBRARY_EXPANSION',
    generatedAt: new Date().toISOString(),
    workingPages,
    brokenPages: [],
    brokenButtons: [],
    brokenFilters: [],
    missingRoutes: [],
    performanceIssues: [],
    inventory: {
      books: index.books.length,
      countries: index.hierarchy.countries.length,
      systems: index.hierarchy.systems.length,
      curricula: index.hierarchy.curricula.length,
      grades: index.hierarchy.grades.length,
      subjects: index.hierarchy.subjects.length,
    },
    dataGaps: missingCountryCodes.map(
      (code) => `${code}: no generated book is currently available for live preview`,
    ),
    directPreviewMode: true,
    notes: [
      'Phase 10: Middle East expansion queue books are permanently versioned and linked to subject pages.',
      'Only Middle East generated books and Phase 8 drafts are indexed.',
      'Selectors are dependent and reset downstream values automatically.',
      'Books are loaded individually; the index contains metadata only.',
      'The reader polls version metadata and refreshes changed books in-session.',
      '📖 Book is active for every indexed subject with units and lessons.',
    ],
  };
}

export function rebuildMiddleEastLiveBookIndex() {
  fs.mkdirSync(previewDir(), { recursive: true });
  const candidates = [];

  if (fs.existsSync(booksDir())) {
    for (const name of fs.readdirSync(booksDir())) {
      if (!name.endsWith('.json')) continue;
      const file = path.join(booksDir(), name);
      const book = safeJson(file);
      if (!book) continue;
      const metadata = createMetadata(book, file, 'global-knowledge-book');
      if (metadata) candidates.push(metadata);
    }
  }

  if (fs.existsSync(draftsDir())) {
    for (const name of fs.readdirSync(draftsDir())) {
      if (!name.endsWith('.json')) continue;
      const file = path.join(draftsDir(), name);
      const draft = safeJson(file);
      if (!draft) continue;
      const metadata = draftMetadata(draft, file);
      if (metadata) candidates.push(metadata);
    }
  }

  // Prefer certified global-knowledge books over Phase 8 drafts when both
  // map to the same subjectId (drafts previously displaced production books).
  const SOURCE_RANK = {
    'global-knowledge-book': 2,
    'phase-8-draft': 1,
  };
  const latestBySubject = new Map();
  for (const item of candidates) {
    const current = latestBySubject.get(item.subjectId);
    if (!current) {
      latestBySubject.set(item.subjectId, item);
      continue;
    }
    const rank = SOURCE_RANK[item.sourceType] || 0;
    const currentRank = SOURCE_RANK[current.sourceType] || 0;
    if (rank > currentRank) {
      latestBySubject.set(item.subjectId, item);
      continue;
    }
    if (rank === currentRank && item.mtimeMs > current.mtimeMs) {
      latestBySubject.set(item.subjectId, item);
    }
  }

  const books = [...latestBySubject.values()]
    .sort((a, b) =>
      `${a.country}|${a.grade}|${a.subject}`.localeCompare(
        `${b.country}|${b.grade}|${b.subject}`,
      ),
    )
    .map(({ sourceFile: _sourceFile, mtimeMs: _mtimeMs, ...item }) => item);
  const internalFiles = new Map(
    [...latestBySubject.values()].map((item) => [item.bookId, item.sourceFile]),
  );
  const index = {
    schema: 'success-os.middle-east-live-book-index.v1',
    phase: 'PHASE_10_MIDDLE_EAST_DIGITAL_LIBRARY_EXPANSION',
    directPreviewMode: true,
    generatedAt: new Date().toISOString(),
    sourceStamp: latestDirectoryStamp(),
    books,
    hierarchy: hierarchyFromBooks(books),
  };
  const report = createNavigationReport(index);
  fs.writeFileSync(indexPath(), JSON.stringify(index, null, 2), 'utf8');
  fs.writeFileSync(reportPath(), JSON.stringify(report, null, 2), 'utf8');
  memoryCache = { index, internalFiles, sourceStamp: index.sourceStamp };
  return { index, report, indexPath: indexPath(), reportPath: reportPath() };
}

function ensureFreshIndex() {
  const stamp = latestDirectoryStamp();
  if (memoryCache && memoryCache.sourceStamp >= stamp) return memoryCache;
  return rebuildMiddleEastLiveBookIndex() && memoryCache;
}

export function getMiddleEastLiveBookIndex() {
  return ensureFreshIndex().index;
}

function adaptGlobalBook(book, metadata) {
  return {
    ...metadata,
    cover: book.cover || {
      title: `Success OS — ${metadata.subject}`,
      subtitle: `${metadata.curriculum} · ${metadata.grade}`,
    },
    description: `Success OS Digital Book for ${metadata.subject} — ${metadata.grade}.`,
    learningObjectives: book.learningOutcomes || [],
    units: (book.units || []).map((unit, unitIndex) => ({
      id: unit.id || `u${unitIndex + 1}`,
      title: unit.title,
      learningObjectives: unit.learningOutcomes || [],
      lessons: (unit.lessons || []).map((lesson, lessonIndex) => ({
        id: lesson.id || `u${unitIndex + 1}l${lessonIndex + 1}`,
        title: lesson.title,
        learningObjectives: lesson.learningOutcomes || [],
        prerequisiteKnowledge: lesson.requiredBackgroundKnowledge || [],
        estimatedStudyTime: lesson.estimatedStudyTime || '20 min',
        difficultyLevel: lesson.difficultyLevel || 'curriculum level',
        vocabulary: lesson.vocabulary || lesson.glossary || [],
        mainConcepts: lesson.mainConcepts || lesson.keyConcepts || [],
        fullLesson:
          lesson.stepByStepExplanation ||
          lesson.fullLesson ||
          lesson.content ||
          '',
        summary: lesson.lessonSummary || lesson.summary || '',
        definitions: lesson.definitions || [],
        realLifeApplications:
          lesson.realLifeApplications || lesson.realLifeConnections || [],
        practicalExamples:
          lesson.practicalExamples || lesson.workedExamples || [],
        visualRecommendations: lesson.visualRecommendations || [],
        commonMisconceptions:
          lesson.commonMisconceptions || lesson.commonMistakes || [],
        keyTakeaways: lesson.keyTakeaways || [],
        references: lesson.references || book.references || [],
      })),
    })),
    glossary: book.glossary || [],
    references: book.references || [],
  };
}

function adaptDraft(draft, metadata) {
  return {
    ...metadata,
    cover: {
      title: `Success OS — ${metadata.subject}`,
      subtitle: `${metadata.curriculum} · ${metadata.grade}`,
    },
    description: `Latest Phase 8 draft for ${metadata.subject}.`,
    learningObjectives: draft.units?.flatMap(
      (unit) => unit.lessons?.flatMap((lesson) => lesson.learningObjectives || []) || [],
    ) || [],
    units: (draft.units || []).map((unit) => ({
      id: unit.unitId,
      title: unit.title,
      learningObjectives: [],
      lessons: (unit.lessons || []).map((lesson) => ({
        id: lesson.lessonId,
        title: lesson.lessonTitle,
        learningObjectives: lesson.learningObjectives || [],
        prerequisiteKnowledge: lesson.prerequisiteKnowledge || [],
        estimatedStudyTime: '20 min',
        difficultyLevel: lesson.adaptation?.subjectComplexity || 'curriculum level',
        vocabulary: lesson.keyVocabulary || [],
        mainConcepts: lesson.coreConcepts || [],
        fullLesson: lesson.stepByStepExplanation || '',
        summary: lesson.summary || '',
        definitions: lesson.glossaryEntries || [],
        realLifeApplications: lesson.realLifeApplications || [],
        practicalExamples: lesson.practicalExamples || [],
        visualRecommendations:
          lesson.diagramsAndIllustrationRecommendations || [],
        commonMisconceptions: lesson.commonMisconceptions || [],
        keyTakeaways: [],
        references: lesson.references || [],
      })),
    })),
    glossary: [],
    references: [],
  };
}

export function getMiddleEastLiveBook(bookId) {
  const cache = ensureFreshIndex();
  const metadata = cache.index.books.find((item) => item.bookId === bookId);
  const file = cache.internalFiles.get(bookId);
  if (!metadata || !file) return null;
  const raw = safeJson(file);
  if (!raw) return null;
  return metadata.sourceType === 'phase-8-draft'
    ? adaptDraft(raw, metadata)
    : adaptGlobalBook(raw, metadata);
}

export function getMiddleEastLiveBookVersion(bookId) {
  const cache = ensureFreshIndex();
  const book = cache.index.books.find((item) => item.bookId === bookId);
  if (!book) return null;
  return {
    bookId,
    version: book.version,
    updatedAt: book.updatedAt,
    bookStatus: book.bookStatus,
    versionToken: `${book.version}:${book.updatedAt}`,
  };
}

export function middleEastLivePreviewStatus() {
  const index = getMiddleEastLiveBookIndex();
  return {
    engine: 'SUCCESS OS Middle East Live Student Book Preview',
    phase: index.phase,
    directPreviewMode: true,
    books: index.books.length,
    countries: index.hierarchy.countries.length,
    generatedAt: index.generatedAt,
    indexPath: indexPath(),
    navigationReportPath: reportPath(),
  };
}
