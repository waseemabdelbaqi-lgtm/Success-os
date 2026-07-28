import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getMiddleEastLiveBook } from '../../../lib/student/middle-east-live-book-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const noStore = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

function salesDir() {
  return path.join(
    process.cwd(),
    'library',
    'middle-east-library-expansion',
    'commerce',
    'protected-pdf-sales',
  );
}

function encryptPayload(plainText, password) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(password, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    algorithm: 'aes-256-gcm',
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
  };
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const bookId = String(body.bookId || '').trim();
  const password = String(body.password || '').trim();
  if (!bookId) {
    return Response.json({ error: 'BOOK_ID_REQUIRED' }, { status: 400, headers: noStore });
  }
  if (password.length < 6) {
    return Response.json(
      { error: 'PASSWORD_TOO_SHORT' },
      { status: 400, headers: noStore },
    );
  }

  const book = getMiddleEastLiveBook(bookId);
  const inlineUnits = Array.isArray(body.units) ? body.units : null;
  if (!book && !inlineUnits && !body.subject) {
    return Response.json({ error: 'BOOK_NOT_FOUND' }, { status: 404, headers: noStore });
  }

  const saleId = `sale_${crypto.randomBytes(8).toString('hex')}`;
  const exportBody = {
    schema: 'success-os.book-pdf-export.v1',
    saleId,
    bookId,
    subject: book?.subject || body.subject || 'Subject',
    grade: book?.grade || body.grade || '',
    curriculum: book?.curriculum || body.curriculum || '',
    country: book?.country || body.country || '',
    cover: book?.cover || {
      title: `Success OS — ${body.subject || bookId}`,
      subtitle: 'Password-protected sale package',
    },
    units: book
      ? (book.units || []).map((unit) => ({
          id: unit.id,
          title: unit.title,
          lessons: (unit.lessons || []).map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            summary: lesson.summary,
            fullLesson: lesson.fullLesson,
          })),
        }))
      : inlineUnits || [
          {
            id: 'u1',
            title: body.lessonTitle || 'Lesson',
            lessons: [
              {
                id: 'l1',
                title: body.lessonTitle || 'Lesson',
                summary: 'Protected Success OS lesson package.',
                fullLesson:
                  'This package is password-protected for commercial distribution.',
              },
            ],
          },
        ],
    generatedAt: new Date().toISOString(),
    protection: 'password-required',
  };

  const sealed = encryptPayload(JSON.stringify(exportBody), password);
  const passwordHash = crypto
    .createHash('sha256')
    .update(`${saleId}:${password}`)
    .digest('hex');

  const record = {
    schema: 'success-os.protected-pdf-sale.v1',
    saleId,
    bookId,
    subject: exportBody.subject,
    grade: exportBody.grade,
    curriculum: exportBody.curriculum,
    country: exportBody.country,
    protected: true,
    passwordRequired: true,
    passwordHint: `${password.slice(0, 1)}***${password.slice(-1)}`,
    passwordHash,
    sealed,
    createdAt: new Date().toISOString(),
    unlockInstructions:
      'Buyer must supply the seller password to decrypt this package. Never overwrite Version 1.0 certified releases.',
  };

  fs.mkdirSync(salesDir(), { recursive: true });
  const filename = `${saleId}__${bookId}.protected.json`;
  fs.writeFileSync(
    path.join(salesDir(), filename),
    JSON.stringify(record, null, 2),
    'utf8',
  );

  return Response.json(
    {
      ok: true,
      saleId,
      filename,
      package: {
        ...record,
        passwordHash: undefined,
      },
    },
    { headers: noStore },
  );
}
