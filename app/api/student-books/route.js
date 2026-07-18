import {
  getMiddleEastLiveBook,
  getMiddleEastLiveBookIndex,
  getMiddleEastLiveBookVersion,
  middleEastLivePreviewStatus,
  rebuildMiddleEastLiveBookIndex,
} from '../../lib/student/middle-east-live-book-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const noStore = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'index';
  const id = searchParams.get('id');

  if (view === 'status') {
    return Response.json(middleEastLivePreviewStatus(), { headers: noStore });
  }
  if (view === 'rebuild') {
    return Response.json(rebuildMiddleEastLiveBookIndex(), { headers: noStore });
  }
  if (view === 'book') {
    if (!id) return Response.json({ error: 'BOOK_ID_REQUIRED' }, { status: 400 });
    const book = getMiddleEastLiveBook(id);
    if (!book) return Response.json({ error: 'BOOK_NOT_FOUND' }, { status: 404 });
    return Response.json(book, { headers: noStore });
  }
  if (view === 'version') {
    if (!id) return Response.json({ error: 'BOOK_ID_REQUIRED' }, { status: 400 });
    const version = getMiddleEastLiveBookVersion(id);
    if (!version) return Response.json({ error: 'BOOK_NOT_FOUND' }, { status: 404 });
    return Response.json(version, { headers: noStore });
  }
  // Lightweight catalog payload for faster first paint / search filters.
  if (view === 'catalog') {
    const index = getMiddleEastLiveBookIndex();
    return Response.json(
      {
        schema: 'success-os.middle-east-live-catalog.v1',
        generatedAt: index.generatedAt,
        books: index.books.map((book) => ({
          bookId: book.bookId,
          countryId: book.countryId,
          countryCode: book.countryCode,
          country: book.country,
          systemId: book.systemId,
          educationalSystem: book.educationalSystem,
          curriculumId: book.curriculumId,
          curriculum: book.curriculum,
          gradeId: book.gradeId,
          grade: book.grade,
          subjectId: book.subjectId,
          subject: book.subject,
          version: book.version,
          updatedAt: book.updatedAt,
          bookStatus: book.bookStatus,
          bookButtonActive: book.bookButtonActive,
          unitCount: book.unitCount,
          lessonCount: book.lessonCount,
          searchText: book.searchText,
        })),
        hierarchy: index.hierarchy,
      },
      { headers: noStore },
    );
  }
  return Response.json(getMiddleEastLiveBookIndex(), { headers: noStore });
}
