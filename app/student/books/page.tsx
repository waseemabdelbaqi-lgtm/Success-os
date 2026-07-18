import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BookLibrary } from '@/components/student-portal/books/book-library';
import { MiddleEastLiveLibrary } from '@/components/student-portal/books/middle-east-live-library';

export const metadata: Metadata = {
  title: 'Middle East Digital Library',
};

type PageProps = {
  searchParams?: Promise<{ demo?: string }>;
};

export default async function StudentBooksPage({
  searchParams,
}: PageProps): Promise<ReactNode> {
  const params = (await searchParams) || {};
  if (params.demo === '1') {
    return <BookLibrary />;
  }
  return <MiddleEastLiveLibrary />;
}
