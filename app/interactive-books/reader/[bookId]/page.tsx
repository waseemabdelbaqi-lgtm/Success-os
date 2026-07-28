import type { Metadata } from "next";
import { BookEngineReader } from "@/src/components/book-engine/BookEngineReader";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ bookId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookId } = await params;
  return { title: `Book Engine · ${bookId} | Success OS` };
}

export default async function BookEngineReaderPage({ params }: Props) {
  const { bookId } = await params;
  return <BookEngineReader bookId={decodeURIComponent(bookId)} />;
}
