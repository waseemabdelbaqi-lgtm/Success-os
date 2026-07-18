import type { ReactNode } from 'react';
import { SubjectBookPage } from '@/components/student-portal/books/middle-east-digital-book';

type PageProps = {
  params: Promise<{ subjectId: string }>;
  searchParams?: Promise<{ bookId?: string }>;
};

export default async function StudentSubjectPage({
  params,
  searchParams,
}: PageProps): Promise<ReactNode> {
  const { subjectId } = await params;
  const query = (await searchParams) || {};
  return (
    <SubjectBookPage subjectId={subjectId} bookId={query.bookId} />
  );
}
