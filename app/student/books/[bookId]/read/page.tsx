import type { ReactNode } from 'react';
import { DigitalBookReader } from '@/components/student-portal/books/middle-east-digital-book';

type PageProps = {
  params: Promise<{ bookId: string }>;
};

export default async function StudentDigitalBookReadPage({
  params,
}: PageProps): Promise<ReactNode> {
  const { bookId } = await params;
  return <DigitalBookReader bookId={decodeURIComponent(bookId)} />;
}
