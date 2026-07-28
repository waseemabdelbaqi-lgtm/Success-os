import type { Metadata } from "next";
import { getBookById } from "@/src/lib/jordan-books/registry";
import { readEditorialOverrides } from "@/src/lib/jordan-books/store/editorial-store";
import { getStubBookById } from "@/src/lib/jordan-books/production/queue-processor";
import { InteractiveBookReader } from "@/src/components/jordan-books/InteractiveBookReader";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ bookId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookId } = await params;
  return { title: `كتاب تفاعلي · ${bookId} | Success OS` };
}

export default async function JordanBookByIdPage({ params }: Props) {
  const { bookId } = await params;
  const overrides = await readEditorialOverrides();
  let book = getBookById(decodeURIComponent(bookId), overrides);
  if (!book) {
    book = await getStubBookById(decodeURIComponent(bookId));
  }
  if (!book) {
    return (
      <main dir="rtl" style={{ padding: 24, fontFamily: "Tahoma, sans-serif" }}>
        <p>الكتاب غير موجود: {bookId}</p>
        <Link href="/jordan-books">العودة</Link>
      </main>
    );
  }
  return <InteractiveBookReader book={book} />;
}
