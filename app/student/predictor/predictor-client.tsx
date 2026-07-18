'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function BookPredictorPage() {
  const params = useSearchParams();
  const bookId = params.get('bookId') || '';
  const lessonFilter = params.get('lesson') || '';
  const [book, setBook] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!bookId) {
      setError('BOOK_ID_REQUIRED');
      return;
    }
    fetch(`/api/student-books?view=book&id=${encodeURIComponent(bookId)}`, {
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`BOOK_${response.status}`);
        setBook(await response.json());
      })
      .catch((reason) => setError(reason.message));
  }, [bookId]);

  const lessons = useMemo(() => {
    if (!book) return [];
    return (book.units || []).flatMap((unit: any) =>
      (unit.lessons || []).map((lesson: any) => ({
        unitTitle: unit.title,
        title: lesson.title,
        summary: lesson.summary || '',
        fullLesson: lesson.fullLesson || '',
        concepts: lesson.mainConcepts || [],
      })),
    );
  }, [book]);

  const visible = lessonFilter
    ? lessons.filter((item) => item.title === lessonFilter)
    : lessons;

  async function copyText(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(''), 1800);
  }

  if (error) {
    return (
      <main className="os-content phase11-engine" style={{ maxWidth: 900 }}>
        <h1>Predictor</h1>
        <p style={{ color: '#9e1722' }}>{error}</p>
        <Link href="/student/books">← Library</Link>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="os-content phase11-engine">
        <p>Opening predictor…</p>
      </main>
    );
  }

  return (
    <main className="os-content phase11-engine" style={{ maxWidth: 980 }} dir="rtl">
      <p className="os-kicker">BOOK PREDICTOR · COPY MODE</p>
      <h1>Predictor — {book.subject}</h1>
      <p>
        {book.curriculum} · {book.grade} · نسخة للنسخ والتنبؤ دون تعديل الكتاب
        الأصلي
      </p>
      <p>
        <Link href={`/student/books/${encodeURIComponent(bookId)}/read`}>
          ← العودة للكتاب
        </Link>
        {copied ? ` · تم النسخ: ${copied}` : ''}
      </p>

      <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
        {visible.map((lesson) => {
          const block = [
            lesson.title,
            '',
            lesson.summary,
            '',
            lesson.fullLesson,
            '',
            (lesson.concepts || []).join(' · '),
          ].join('\n');
          return (
            <article
              key={`${lesson.unitTitle}-${lesson.title}`}
              className="os-card"
              style={{ padding: 18 }}
            >
              <small>{lesson.unitTitle}</small>
              <h2 style={{ marginTop: 6 }}>{lesson.title}</h2>
              <p style={{ whiteSpace: 'pre-wrap' }}>{lesson.summary}</p>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  background: '#fffaf0',
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid #e7d7a8',
                  maxHeight: 220,
                  overflow: 'auto',
                }}
              >
                {lesson.fullLesson}
              </pre>
              <button
                type="button"
                className="os-primary"
                style={{ marginTop: 10 }}
                onClick={() => copyText(lesson.title, block)}
              >
                ⧉ نسخ للـ Predictor
              </button>
            </article>
          );
        })}
      </div>
    </main>
  );
}
