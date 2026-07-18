import fs from 'node:fs';
import path from 'node:path';

const root = () =>
  path.resolve(
    process.env.SUCCESS_OS_LIBRARY_ROOT ||
      path.join(process.cwd(), 'library', 'global-knowledge'),
  );

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function libraryRoot() {
  return root();
}

export function libraryStatus() {
  const base = root();
  ensureDir(base);
  ensureDir(path.join(base, 'books'));
  ensureDir(path.join(base, 'baselines'));
  ensureDir(path.join(base, 'reports'));
  ensureDir(path.join(base, 'dossiers'));
  ensureDir(path.join(base, 'quality-reviews'));
  ensureDir(path.join(base, 'final-versions'));
  return {
    configured: true,
    mode: 'permanent-local-library',
    root: base,
    required: [],
  };
}

function slug(parts) {
  return parts
    .map((part) =>
      String(part || 'unknown')
        .normalize('NFKC')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'item',
    )
    .join('__');
}

export function bookIdFromIdentity(identity = {}) {
  return slug([
    identity.country,
    identity.educationalSystem || identity.curriculumType,
    identity.curriculum,
    identity.grade,
    identity.subject,
    identity.language || 'ar',
  ]);
}

export function saveLibraryBook(book) {
  const status = libraryStatus();
  const id = book.id || bookIdFromIdentity(book.identity || {});
  const file = path.join(status.root, 'books', `${id}.json`);
  const payload = {
    ...book,
    id,
    savedAt: new Date().toISOString(),
    library: { permanent: true, path: file, mode: status.mode },
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

export function loadLibraryBook(id) {
  const file = path.join(libraryStatus().root, 'books', `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function listLibraryBooks() {
  const dir = path.join(libraryStatus().root, 'books');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) =>
      JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')),
    );
}

export function saveBaseline(baseline) {
  const status = libraryStatus();
  const id = bookIdFromIdentity(baseline.identity || {});
  const file = path.join(status.root, 'baselines', `${id}.json`);
  const payload = { ...baseline, id, savedAt: new Date().toISOString() };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

export function loadBaseline(identity) {
  const id = bookIdFromIdentity(identity);
  const file = path.join(libraryStatus().root, 'baselines', `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function listBaselines() {
  const dir = path.join(libraryStatus().root, 'baselines');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) =>
      JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')),
    );
}

export function saveReport(name, report) {
  const status = libraryStatus();
  const safe = String(name || 'report')
    .replace(/[^\w.-]+/g, '-')
    .slice(0, 120);
  const file = path.join(status.root, 'reports', `${safe}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2), 'utf8');
  return { ...report, reportPath: file };
}

export function listReports() {
  const dir = path.join(libraryStatus().root, 'reports');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({
      name,
      path: path.join(dir, name),
      ...JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')),
    }));
}

export function saveQualityReview(review) {
  const status = libraryStatus();
  const id = review.bookId || bookIdFromIdentity(review.identity || {});
  const file = path.join(status.root, 'quality-reviews', `${id}.json`);
  const payload = {
    ...review,
    bookId: id,
    savedAt: new Date().toISOString(),
    qualityReviewPath: file,
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

export function listQualityReviews() {
  const dir = path.join(libraryStatus().root, 'quality-reviews');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) =>
      JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')),
    );
}

export function saveFinalBookVersion(book, review) {
  const status = libraryStatus();
  const id = book.id || bookIdFromIdentity(book.identity || {});
  const file = path.join(status.root, 'final-versions', `${id}.json`);
  const payload = {
    ...book,
    version: {
      number: book.version?.number || '1.0.0',
      status: 'FINAL',
      finalizedAt: new Date().toISOString(),
    },
    quality: review,
    publication: {
      ...(book.publication || {}),
      qualityApproved: true,
      status: 'COMPLETE',
    },
    finalVersionPath: file,
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

export function listFinalBookVersions() {
  const dir = path.join(libraryStatus().root, 'final-versions');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) =>
      JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')),
    );
}
