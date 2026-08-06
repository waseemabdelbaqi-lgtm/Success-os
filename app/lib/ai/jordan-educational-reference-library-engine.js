/**
 * PHASE JO-05 — Jordan Educational Reference Library
 *
 * Single source of truth for every trusted educational source used by
 * Jordan National Curriculum digital books.
 *
 * Do NOT generate educational lesson content in this phase.
 * Never use a source before it is verified and registered here.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  JO05_CATEGORIES,
  JO05_SEED_SOURCES,
} from '../../data/jordan-educational-reference-seed.js';
import {
  JO_EXCLUDED_CURRICULA,
  isExcludedInternationalLabel,
  isJordanNationalBookId,
} from '../../data/jordan-national-knowledge-sources.js';
import {
  listLibraryBooks,
  loadLibraryBook,
  saveLibraryBook,
} from './library-store.js';

export const PHASE = 'JO-05_JORDAN_EDUCATIONAL_REFERENCE_LIBRARY';
export const ENGINE_VERSION = '5.0.0';
export const JO05_SCHEMA = 'success-os.jordan-educational-reference-library.v1';
export const MIN_RELIABILITY_FOR_USE = 80;

function rootDir() {
  return process.cwd();
}

export function referenceLibraryRoot() {
  if (process.env.JO_REFERENCE_LIBRARY_ROOT) {
    return path.resolve(process.env.JO_REFERENCE_LIBRARY_ROOT);
  }
  return path.join(
    rootDir(),
    'content',
    'datasets',
    'jordan-educational-reference-library',
  );
}

function ensureDirs() {
  for (const dir of [
    referenceLibraryRoot(),
    path.join(referenceLibraryRoot(), 'categories'),
    path.join(referenceLibraryRoot(), 'sources'),
    path.join(referenceLibraryRoot(), 'versions'),
    path.join(referenceLibraryRoot(), 'validation'),
    path.join(referenceLibraryRoot(), 'linking'),
    path.join(referenceLibraryRoot(), 'regeneration-queue'),
    path.join(referenceLibraryRoot(), 'dashboards'),
    path.join(referenceLibraryRoot(), 'reports'),
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function list(v) {
  return Array.isArray(v) ? v : [];
}

function text(v) {
  return String(v || '').trim();
}

function nowIso() {
  return new Date().toISOString();
}

function slug(part) {
  return String(part || '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 140);
}

function libraryPath() {
  return path.join(referenceLibraryRoot(), 'jordan-educational-reference-library.json');
}

function statusPath() {
  return path.join(referenceLibraryRoot(), 'status.json');
}

function normalizeUrl(url) {
  try {
    const u = new URL(String(url || ''));
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    u.hash = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function validateSourceRecord(source, { existingIds = new Set(), existingUrls = new Map() } = {}) {
  const errors = [];
  const warnings = [];

  if (!text(source.sourceId)) errors.push('MISSING_SOURCE_ID');
  if (!text(source.title)) errors.push('MISSING_TITLE');
  if (!text(source.publisher)) errors.push('MISSING_PUBLISHER');
  if (!text(source.organization)) errors.push('MISSING_ORGANIZATION');
  if (!text(source.officialUrl)) errors.push('MISSING_OFFICIAL_URL');
  if (!JO05_CATEGORIES.includes(source.category)) errors.push('INVALID_CATEGORY');

  const url = normalizeUrl(source.officialUrl);
  if (!url) errors.push('BROKEN_OR_INVALID_URL');

  if (existingIds.has(source.sourceId)) errors.push('DUPLICATE_SOURCE_ID');
  if (url && existingUrls.has(url) && existingUrls.get(url) !== source.sourceId) {
    // Same official portal may back multiple category registrations.
    warnings.push(`SHARED_URL_WITH:${existingUrls.get(url)}`);
  }

  if (isExcludedInternationalLabel(source.title) || isExcludedInternationalLabel(source.educationalSystem)) {
    // OER concept-verification sources are allowed if category is OER/scientific/math/lab/simulations
    const oerOk = [
      'Open Educational Resources',
      'Scientific References',
      'Mathematical References',
      'Laboratory Resources',
      'Simulations',
    ].includes(source.category);
    // Avoid false positives: "AP" inside "Approved", "ACT" inside random tokens
    const falsePositive =
      /\bapproved\b/i.test(source.title) &&
      !/\b(AP|SAT|ACT|IB)\b/.test(source.title);
    if (!oerOk && !falsePositive) errors.push('UNSUPPORTED_INTERNATIONAL_CURRICULUM_SOURCE');
  }

  if (source.copyBookText === true) errors.push('COPYRIGHT_CONFLICT_COPY_BOOK_TEXT');
  if (
    /\b(copy|reproduce|republish)\b.{0,40}\b(full\s+)?textbook\b/i.test(String(source.note || '')) &&
    !/\bnever\b.{0,20}\bcopy\b/i.test(String(source.note || ''))
  ) {
    errors.push('COPYRIGHT_CONFLICT_NOTE');
  }

  if (source.status === 'unverified' || source.status === 'pending') {
    warnings.push('UNVERIFIED_DOCUMENT');
  }
  if (!source.verificationDate && source.status === 'verified') {
    warnings.push('MISSING_VERIFICATION_DATE');
  }

  // Outdated curriculum versions (Jordan school year framing)
  const year = Number(source.publicationYear) || 0;
  if (year && year < 2020) warnings.push('OUTDATED_CURRICULUM_VERSION');

  if ((source.reliabilityScore ?? 0) < MIN_RELIABILITY_FOR_USE) {
    errors.push('RELIABILITY_BELOW_THRESHOLD');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    normalizedUrl: url,
  };
}

function hydrateSource(seed) {
  const verificationDate = nowIso();
  return {
    sourceId: seed.sourceId,
    title: seed.title,
    publisher: seed.publisher,
    organization: seed.organization,
    country: seed.country || 'Jordan',
    educationalSystem: seed.educationalSystem || 'Jordan National Curriculum',
    subject: seed.subject || 'all',
    grade: seed.grade || 'all',
    language: seed.language || 'ar',
    publicationYear: seed.publicationYear || 2025,
    version: seed.version || '2025-2026',
    officialUrl: seed.officialUrl,
    licenseType: seed.licenseType || 'official-framework-reference',
    copyrightStatus:
      seed.copyrightStatus || 'all-rights-reserved-by-publisher-reference-only',
    verificationDate,
    reliabilityScore: seed.reliabilityScore ?? 90,
    status: seed.status || 'verified',
    category: seed.category,
    copyBookText: false,
    note: seed.note || null,
    history: [
      {
        event: 'registered',
        at: verificationDate,
        version: seed.version || '2025-2026',
        note: 'JO-05 seed registration',
      },
    ],
  };
}

/**
 * Build / rebuild the Jordan Educational Reference Library from seed + merges.
 */
export function buildJordanEducationalReferenceLibrary(options = {}) {
  ensureDirs();
  const builtAt = nowIso();
  const existing = options.merge !== false ? readJordanReferenceLibrary() : null;

  const byId = new Map();
  if (existing?.sources) {
    for (const s of existing.sources) byId.set(s.sourceId, s);
  }

  const rejected = [];
  const existingIds = new Set();
  const existingUrls = new Map();

  // Re-validate merged existing first
  for (const seed of JO05_SEED_SOURCES) {
    const hydrated = hydrateSource(seed);
    const prior = byId.get(hydrated.sourceId);
    const record = prior
      ? {
          ...hydrated,
          history: list(prior.history).concat({
            event: 'rebuilt',
            at: builtAt,
            version: hydrated.version,
          }),
          verificationDate: prior.verificationDate || hydrated.verificationDate,
        }
      : hydrated;

    const validation = validateSourceRecord(record, { existingIds, existingUrls });
    if (!validation.ok) {
      rejected.push({ sourceId: record.sourceId, errors: validation.errors, warnings: validation.warnings });
      continue;
    }
    record.officialUrl = validation.normalizedUrl || record.officialUrl;
    record.validation = {
      ok: true,
      warnings: validation.warnings,
      validatedAt: builtAt,
    };
    if (validation.normalizedUrl) existingUrls.set(validation.normalizedUrl, record.sourceId);
    existingIds.add(record.sourceId);
    byId.set(record.sourceId, record);
  }

  // Include any manually added sources already on disk
  for (const [id, record] of byId) {
    if (existingIds.has(id)) continue;
    const validation = validateSourceRecord(record, { existingIds, existingUrls });
    if (!validation.ok) {
      rejected.push({ sourceId: id, errors: validation.errors, warnings: validation.warnings });
      byId.delete(id);
      continue;
    }
    record.officialUrl = validation.normalizedUrl || record.officialUrl;
    record.validation = { ok: true, warnings: validation.warnings, validatedAt: builtAt };
    existingIds.add(id);
    if (validation.normalizedUrl) existingUrls.set(validation.normalizedUrl, id);
  }

  const sources = [...byId.values()].sort((a, b) =>
    a.sourceId.localeCompare(b.sourceId),
  );

  const byCategory = {};
  for (const cat of JO05_CATEGORIES) byCategory[cat] = [];
  for (const s of sources) {
    if (!byCategory[s.category]) byCategory[s.category] = [];
    byCategory[s.category].push(s.sourceId);
    writeJson(path.join(referenceLibraryRoot(), 'sources', `${slug(s.sourceId)}.json`), s);
  }
  for (const cat of JO05_CATEGORIES) {
    writeJson(path.join(referenceLibraryRoot(), 'categories', `${slug(cat)}.json`), {
      category: cat,
      sourceIds: byCategory[cat] || [],
      count: (byCategory[cat] || []).length,
      updatedAt: builtAt,
    });
  }

  const library = {
    schema: JO05_SCHEMA,
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    country: 'Jordan',
    educationalSystem: 'Jordan National Curriculum',
    categories: JO05_CATEGORIES,
    excludeInternationalCurricula: [...JO_EXCLUDED_CURRICULA],
    rights: {
      copyBookText: false,
      generateOriginalSuccessOsContentOnly: true,
      note: 'Reference library stores metadata and official URLs only — never textbook prose.',
    },
    sources,
    indexes: {
      byCategory,
      bySubject: indexBy(sources, 'subject'),
      byGrade: indexBy(sources, 'grade'),
      byPublisher: indexBy(sources, 'publisher'),
      byStatus: indexBy(sources, 'status'),
    },
    rejected,
    totals: summarizeTotals(sources, rejected),
    version: {
      libraryVersion: existing?.version?.libraryVersion
        ? bumpVersion(existing.version.libraryVersion)
        : '1.0.0',
      curriculumEdition: '2025-2026',
      builtAt,
      previousVersion: existing?.version?.libraryVersion || null,
    },
    builtAt,
  };

  // Version snapshot (never overwrite history)
  writeJson(
    path.join(
      referenceLibraryRoot(),
      'versions',
      `library-v${library.version.libraryVersion}-${builtAt.slice(0, 10)}.json`,
    ),
    {
      libraryVersion: library.version.libraryVersion,
      sourceIds: sources.map((s) => s.sourceId),
      totals: library.totals,
      builtAt,
    },
  );

  writeJson(libraryPath(), library);
  const status = {
    schema: 'success-os.jordan-reference-library-status.v1',
    phase: PHASE,
    ready: library.totals.verifiedReferences > 0 && library.totals.pendingVerification === 0,
    totals: library.totals,
    libraryVersion: library.version.libraryVersion,
    libraryFile: path.relative(rootDir(), libraryPath()).replace(/\\/g, '/'),
    gate: {
      contentGenerationRequiresVerifiedSources: true,
      minReliability: MIN_RELIABILITY_FOR_USE,
    },
    updatedAt: builtAt,
  };
  writeJson(statusPath(), status);
  writeJson(path.join(referenceLibraryRoot(), 'validation', 'latest.json'), {
    rejected,
    validatedAt: builtAt,
    accepted: sources.length,
  });

  const dashboard = buildReferenceLibraryDashboard(library);
  writeJson(path.join(referenceLibraryRoot(), 'dashboards', 'latest.json'), dashboard);

  return { library, status, dashboard, rejected };
}

function indexBy(sources, field) {
  const map = {};
  for (const s of sources) {
    const key = text(s[field]) || 'unknown';
    if (!map[key]) map[key] = [];
    map[key].push(s.sourceId);
  }
  return map;
}

function summarizeTotals(sources, rejected = []) {
  const verified = sources.filter((s) => s.status === 'verified').length;
  const pending = sources.filter((s) =>
    ['pending', 'unverified', 'pending-verification'].includes(s.status),
  ).length;
  const broken = sources.filter((s) =>
    list(s.validation?.errors).some((e) => String(e).includes('BROKEN')) ||
    s.status === 'broken',
  ).length;
  const deprecated = sources.filter((s) => s.status === 'deprecated').length;
  const updated = sources.filter((s) =>
    list(s.history).some((h) => h.event === 'updated' || h.event === 'rebuilt'),
  ).length;

  return {
    totalReferences: sources.length,
    verifiedReferences: verified,
    pendingVerification: pending,
    brokenReferences: broken + rejected.filter((r) =>
      list(r.errors).some((e) => String(e).includes('BROKEN')),
    ).length,
    updatedReferences: updated,
    deprecatedReferences: deprecated,
    rejectedOnValidation: rejected.length,
  };
}

function bumpVersion(v) {
  const parts = String(v || '1.0.0').split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

export function readJordanReferenceLibrary() {
  return readJson(libraryPath());
}

export function readJordanReferenceStatus() {
  return readJson(statusPath());
}

export function getVerifiedSource(sourceId) {
  const lib = readJordanReferenceLibrary();
  const source = list(lib?.sources).find((s) => s.sourceId === sourceId);
  if (!source) return null;
  if (source.status !== 'verified') return null;
  if ((source.reliabilityScore ?? 0) < MIN_RELIABILITY_FOR_USE) return null;
  return source;
}

export function listVerifiedSources(filter = {}) {
  const lib = readJordanReferenceLibrary();
  return list(lib?.sources).filter((s) => {
    if (s.status !== 'verified') return false;
    if ((s.reliabilityScore ?? 0) < MIN_RELIABILITY_FOR_USE) return false;
    if (filter.category && s.category !== filter.category) return false;
    if (filter.subject && s.subject !== 'all' && s.subject !== filter.subject) return false;
    if (filter.grade && s.grade !== 'all' && s.grade !== filter.grade) return false;
    return true;
  });
}

export function resolveSourceIdByUrl(url) {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;
  const lib = readJordanReferenceLibrary();
  for (const s of list(lib?.sources)) {
    if (normalizeUrl(s.officialUrl) === normalized) return s.sourceId;
  }
  // prefix match for catalogue paths
  for (const s of list(lib?.sources)) {
    const u = normalizeUrl(s.officialUrl);
    if (u && (normalized.startsWith(u) || u.startsWith(normalized))) return s.sourceId;
  }
  return null;
}

/**
 * Assert reference library is ready before any JO content generation/update/publish.
 */
export function assertJordanReferenceLibraryReady(context = {}) {
  const status = readJordanReferenceStatus();
  const lib = readJordanReferenceLibrary();
  if (!status?.ready || !lib?.sources?.length) {
    const err = new Error('JO_05_REFERENCE_LIBRARY_NOT_READY');
    err.code = 'JO_05_REFERENCE_LIBRARY_NOT_READY';
    err.details = {
      phase: PHASE,
      reason:
        'Jordan Educational Reference Library must be built and verified before content generation, update, or publish.',
      context,
      hint: 'Run: npm run jo:references',
    };
    throw err;
  }
  if ((status.totals?.verifiedReferences || 0) < 1) {
    const err = new Error('JO_05_NO_VERIFIED_REFERENCES');
    err.code = 'JO_05_NO_VERIFIED_REFERENCES';
    err.details = { context };
    throw err;
  }
  return true;
}

/**
 * Ensure every reference URL on a book/unit/lesson maps to a verified library source.
 */
export function assertReferencesInLibrary(references, context = {}) {
  assertJordanReferenceLibraryReady(context);
  const refs = list(references)
    .map((ref) => {
      if (typeof ref === 'string') return { sourceId: ref };
      return ref;
    })
    .filter(Boolean);
  if (!refs.length) {
    const err = new Error('JO_05_MISSING_SOURCE_REFERENCES');
    err.code = 'JO_05_MISSING_SOURCE_REFERENCES';
    err.details = {
      reason: 'No lesson/unit/book may exist without verified source references.',
      context,
    };
    throw err;
  }
  const unresolved = [];
  const resolved = [];
  for (const ref of refs) {
    const byId = ref.sourceId ? getVerifiedSource(ref.sourceId) : null;
    const byUrl = ref.url ? resolveSourceIdByUrl(ref.url) : null;
    const source = byId || (byUrl ? getVerifiedSource(byUrl) : null);
    if (!source) {
      unresolved.push({ name: ref.name, url: ref.url, sourceId: ref.sourceId || null });
    } else {
      resolved.push(source.sourceId);
    }
  }
  if (unresolved.length) {
    const err = new Error('JO_05_UNVERIFIED_OR_UNKNOWN_REFERENCE');
    err.code = 'JO_05_UNVERIFIED_OR_UNKNOWN_REFERENCE';
    err.details = { unresolved, context, resolved };
    throw err;
  }
  return [...new Set(resolved)];
}

/**
 * Link JO books to verified library sources (metadata only — no content generation).
 */
export function linkJordanBooksToReferenceLibrary(options = {}) {
  ensureDirs();
  assertJordanReferenceLibraryReady({ action: 'link-books' });

  const books = listLibraryBooks().filter((b) => isJordanNationalBookId(b.id));
  const report = {
    schema: 'success-os.jordan-reference-linking.v1',
    phase: PHASE,
    linkedAt: nowIso(),
    books: [],
  };

  for (const book of books) {
    if (options.onlyJo02 && !book.jo02?.producedAt) continue;

    const bookRefs = list(book.references);
    const lessonRefs = list(book.units).flatMap((u) =>
      list(u.lessons).flatMap((l) => list(l.references)),
    );
    const allRefs = [...bookRefs, ...lessonRefs];
    const sourceIds = new Set();
    const missing = [];

    for (const ref of allRefs) {
      const id =
        (ref.sourceId && getVerifiedSource(ref.sourceId)?.sourceId) ||
        resolveSourceIdByUrl(ref.url);
      if (id && getVerifiedSource(id)) sourceIds.add(id);
      else if (ref.url || ref.sourceId) missing.push({ name: ref.name, url: ref.url });
    }

    // Ensure baseline official JO sources are always linked
    for (const required of [
      'jo-ref-moe-home',
      'jo-ref-nccd-textbooks-index',
      'jo-ref-darsak',
    ]) {
      if (getVerifiedSource(required)) sourceIds.add(required);
    }

    const gradeCatalog = list(readJordanReferenceLibrary()?.sources).find(
      (s) =>
        s.category === 'Official Textbooks' &&
        s.grade === book.identity?.grade &&
        s.status === 'verified',
    );
    if (gradeCatalog) sourceIds.add(gradeCatalog.sourceId);

    const linkedIds = [...sourceIds];
    const next = {
      ...book,
      jo05: {
        phase: PHASE,
        linkedAt: nowIso(),
        referenceSourceIds: linkedIds,
        missingUnregisteredUrls: missing.slice(0, 20),
        linkComplete: missing.length === 0 && linkedIds.length > 0,
      },
      references: linkedIds.map((id) => {
        const s = getVerifiedSource(id);
        return {
          sourceId: id,
          name: s.title,
          url: s.officialUrl,
          usage: 'jo-05-reference-library',
          category: s.category,
          reliabilityScore: s.reliabilityScore,
        };
      }),
      updatedAt: nowIso(),
    };

    // Attach sourceIds onto units/lessons that lack them (metadata only)
    next.units = list(book.units).map((unit) => ({
      ...unit,
      referenceSourceIds: linkedIds.slice(0, 4),
      lessons: list(unit.lessons).map((lesson) => {
        const lessonSourceIds = [];
        for (const ref of list(lesson.references)) {
          const id =
            (ref.sourceId && getVerifiedSource(ref.sourceId)?.sourceId) ||
            resolveSourceIdByUrl(ref.url);
          if (id) lessonSourceIds.push(id);
        }
        const ensured = [...new Set(lessonSourceIds.concat(linkedIds.slice(0, 3)))];
        return {
          ...lesson,
          referenceSourceIds: ensured,
          references: ensured.map((id) => {
            const s = getVerifiedSource(id);
            return {
              sourceId: id,
              name: s.title,
              url: s.officialUrl,
              usage: 'jo-05-reference-library',
            };
          }),
        };
      }),
    }));

    if (!options.dryRun) saveLibraryBook(next);

    report.books.push({
      bookId: book.id,
      subject: book.identity?.subject,
      grade: book.identity?.grade,
      referenceCount: linkedIds.length,
      missingUnregistered: missing.length,
      linkComplete: missing.length === 0 && linkedIds.length > 0,
    });
  }

  writeJson(path.join(referenceLibraryRoot(), 'linking', 'latest.json'), report);
  return report;
}

/**
 * Register a curriculum update — never overwrite; queue affected books.
 */
export function registerCurriculumUpdate({
  title,
  officialUrl,
  edition,
  affectedGrades = [],
  affectedSubjects = [],
  notes = '',
} = {}) {
  ensureDirs();
  assertJordanReferenceLibraryReady({ action: 'curriculum-update' });
  const at = nowIso();
  const updateId = `jo-curriculum-update-${at.slice(0, 10)}-${Date.now()}`;

  const update = {
    updateId,
    title: title || 'MoE / NCCD curriculum update',
    officialUrl: officialUrl || null,
    edition: edition || null,
    affectedGrades,
    affectedSubjects,
    notes,
    registeredAt: at,
  };

  writeJson(
    path.join(referenceLibraryRoot(), 'versions', `${updateId}.json`),
    update,
  );

  const books = listLibraryBooks().filter((b) => isJordanNationalBookId(b.id));
  const queue = [];
  for (const book of books) {
    const grade = book.identity?.grade;
    const subject = book.identity?.subject;
    const gradeHit = !affectedGrades.length || affectedGrades.includes(grade);
    const subjectHit = !affectedSubjects.length || affectedSubjects.includes(subject);
    if (!gradeHit || !subjectHit) continue;

    const units = list(book.units).map((u) => ({
      unitId: u.id || u.unitId,
      title: u.title,
      lessons: list(u.lessons).map((l) => ({ lessonId: l.id, title: l.title })),
    }));

    queue.push({
      bookId: book.id,
      grade,
      subject,
      units,
      lessons: units.flatMap((u) => u.lessons),
      reason: 'curriculum-update',
      updateId,
      queuedAt: at,
      status: 'queued-for-regeneration',
    });
  }

  writeJson(
    path.join(referenceLibraryRoot(), 'regeneration-queue', `${updateId}.json`),
    { update, queue, count: queue.length },
  );

  // Append history on matching official sources without destroying prior versions
  const lib = readJordanReferenceLibrary();
  if (lib) {
    const nextSources = list(lib.sources).map((s) => {
      if (s.category !== 'Curriculum Documents' && s.category !== 'Official Textbooks') {
        return s;
      }
      return {
        ...s,
        history: list(s.history).concat({
          event: 'curriculum-update-registered',
          at,
          updateId,
          edition,
          note: notes || title,
        }),
      };
    });
    const nextLib = {
      ...lib,
      sources: nextSources,
      version: {
        ...lib.version,
        libraryVersion: bumpVersion(lib.version?.libraryVersion),
        lastCurriculumUpdateId: updateId,
        builtAt: at,
        previousVersion: lib.version?.libraryVersion || null,
      },
    };
    writeJson(
      path.join(
        referenceLibraryRoot(),
        'versions',
        `library-v${nextLib.version.libraryVersion}-${at.slice(0, 10)}.json`,
      ),
      {
        libraryVersion: nextLib.version.libraryVersion,
        sourceIds: nextSources.map((s) => s.sourceId),
        updateId,
        builtAt: at,
      },
    );
    writeJson(libraryPath(), nextLib);
  }

  return { ok: true, updateId, queuedBooks: queue.length, queue };
}

export function buildReferenceLibraryDashboard(library = null) {
  const lib = library || readJordanReferenceLibrary();
  const totals = lib?.totals || summarizeTotals([]);
  const sources = list(lib?.sources);

  const bySubject = Object.entries(lib?.indexes?.bySubject || {}).map(([subject, ids]) => ({
    subject,
    count: ids.length,
  }));
  const byGrade = Object.entries(lib?.indexes?.byGrade || {}).map(([grade, ids]) => ({
    grade,
    count: ids.length,
  }));
  const byPublisher = Object.entries(lib?.indexes?.byPublisher || {}).map(
    ([publisher, ids]) => ({ publisher, count: ids.length }),
  );
  const byCategory = JO05_CATEGORIES.map((category) => ({
    category,
    count: (lib?.indexes?.byCategory?.[category] || []).length,
  }));

  return {
    schema: 'success-os.jordan-reference-library-dashboard.v1',
    phase: PHASE,
    engineVersion: ENGINE_VERSION,
    totals: {
      totalReferences: totals.totalReferences,
      verifiedReferences: totals.verifiedReferences,
      pendingVerification: totals.pendingVerification,
      brokenReferences: totals.brokenReferences,
      updatedReferences: totals.updatedReferences,
      deprecatedReferences: totals.deprecatedReferences,
    },
    byCategory,
    bySubject: bySubject.sort((a, b) => b.count - a.count),
    byGrade: byGrade.sort((a, b) => b.count - a.count),
    byPublisher: byPublisher.sort((a, b) => b.count - a.count),
    sampleSources: sources.slice(0, 12).map((s) => ({
      sourceId: s.sourceId,
      title: s.title,
      category: s.category,
      status: s.status,
      reliabilityScore: s.reliabilityScore,
    })),
    libraryVersion: lib?.version?.libraryVersion || null,
    updatedAt: nowIso(),
  };
}

/**
 * Optional live URL probe — marks broken without deleting history.
 */
export async function probeReferenceUrls({ fetcher = fetch, limit = 20 } = {}) {
  ensureDirs();
  const lib = readJordanReferenceLibrary();
  if (!lib) throw new Error('JO_05_LIBRARY_MISSING');
  const results = [];
  const targets = list(lib.sources).slice(0, limit);
  for (const source of targets) {
    try {
      const res = await fetcher(source.officialUrl, {
        method: 'HEAD',
        redirect: 'follow',
        headers: { 'User-Agent': 'SUCCESS-OS-JO05-ReferenceProbe/1.0' },
      });
      const ok = res.ok || (res.status >= 200 && res.status < 400);
      results.push({
        sourceId: source.sourceId,
        ok,
        status: res.status,
      });
      if (!ok) {
        source.status = 'broken';
        source.history = list(source.history).concat({
          event: 'marked-broken',
          at: nowIso(),
          httpStatus: res.status,
        });
      }
    } catch (error) {
      results.push({
        sourceId: source.sourceId,
        ok: false,
        error: error.message || String(error),
      });
      // Network failure ≠ delete; mark probe-failed, keep verified if previously verified
      source.history = list(source.history).concat({
        event: 'probe-failed',
        at: nowIso(),
        error: error.message || String(error),
      });
    }
  }
  writeJson(libraryPath(), { ...lib, sources: lib.sources, probedAt: nowIso() });
  writeJson(path.join(referenceLibraryRoot(), 'validation', 'url-probe.json'), {
    results,
    probedAt: nowIso(),
  });
  return results;
}

export function runJordanEducationalReferenceLibrary(options = {}) {
  const built = buildJordanEducationalReferenceLibrary(options);
  const linking = options.skipLinking
    ? null
    : linkJordanBooksToReferenceLibrary({ onlyJo02: options.onlyJo02 !== false });
  const dashboard = buildReferenceLibraryDashboard(built.library);
  writeJson(path.join(referenceLibraryRoot(), 'dashboards', 'latest.json'), dashboard);
  writeJson(
    path.join(referenceLibraryRoot(), 'reports', `jo-05-build-${Date.now()}.json`),
    {
      totals: built.library.totals,
      rejected: built.rejected,
      linking: linking
        ? {
            books: linking.books.length,
            complete: linking.books.filter((b) => b.linkComplete).length,
          }
        : null,
    },
  );
  return {
    phase: PHASE,
    totals: built.library.totals,
    libraryVersion: built.library.version.libraryVersion,
    linking,
    dashboard,
    status: built.status,
  };
}
