"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookLessonMediaPlayer } from "./book-lesson-media-player";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";

type LiveLesson = {
  id: string;
  title: string;
  summary?: string;
  fullLesson?: string;
  mainConcepts?: string[];
  learningObjectives?: string[];
  slides?: Array<{ title: string; body: string; kind?: string }>;
  videoUrl?: string | null;
};

type LiveUnit = {
  id: string;
  title: string;
  lessons: LiveLesson[];
};

type LiveBook = {
  bookId: string;
  country: string;
  educationalSystem: string;
  curriculum: string;
  grade: string;
  subject: string;
  version: string;
  updatedAt: string;
  bookStatus: string;
  cover?: { title?: string; subtitle?: string };
  units?: LiveUnit[];
  phase152?: {
    publishStatus?: string;
    lessonsCompleted?: number;
    lessonsRejected?: number;
  };
  publication?: { status?: string };
};

type FlatLesson = {
  unitId: string;
  lessonId: string;
  unitTitle: string;
  lesson: LiveLesson;
};

export function AdminPreviewBanner({ book }: { book: LiveBook | null }) {
  if (!book) return null;
  const phase152 = book.phase152;
  const publishStatus =
    phase152?.publishStatus || book.publication?.status || book.bookStatus;
  return (
    <div className="border-b border-[#d4af37]/35 bg-gradient-to-r from-[#1f2937] via-[#111827] to-[#1f2937] px-4 py-3 text-xs text-[#f8ead8] sm:px-6">
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-semibold">
        <span>Admin Direct Preview</span>
        <span>Country: {book.country}</span>
        <span>System: {book.educationalSystem}</span>
        <span>Curriculum: {book.curriculum}</span>
        <span>Grade: {book.grade}</span>
        <span>Subject: {book.subject}</span>
        <span>Version: {book.version}</span>
        <span>Updated: {new Date(book.updatedAt).toLocaleString()}</span>
        <span>Status: {book.bookStatus}</span>
        <span>Publish: {publishStatus}</span>
        {phase152?.lessonsCompleted != null ? (
          <span>Lessons populated: {phase152.lessonsCompleted}</span>
        ) : null}
        {phase152?.lessonsRejected ? (
          <span>Rejected: {phase152.lessonsRejected}</span>
        ) : null}
        <a
          className="text-[#f2d77c] underline"
          href="/admin/middle-east-book-review"
        >
          Open Admin Review
        </a>
      </div>
    </div>
  );
}

export function SubjectBookPage({
  subjectId,
  bookId,
}: {
  subjectId: string;
  bookId?: string;
}) {
  const [book, setBook] = useState<LiveBook | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const target = bookId
      ? `/api/student-books?view=book&id=${encodeURIComponent(bookId)}`
      : null;
    if (!target) {
      fetch("/api/student-books?view=index", { cache: "no-store" })
        .then((response) => response.json())
        .then((index) => {
          const match = (index.books || []).find(
            (item: { subjectId: string }) => item.subjectId === subjectId,
          );
          if (!match) throw new Error("SUBJECT_BOOK_NOT_FOUND");
          return fetch(
            `/api/student-books?view=book&id=${encodeURIComponent(match.bookId)}`,
            { cache: "no-store" },
          );
        })
        .then((response) => {
          if (!response.ok) throw new Error(`BOOK_${response.status}`);
          return response.json();
        })
        .then(setBook)
        .catch((reason) => setError(reason.message));
      return;
    }

    fetch(target, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`BOOK_${response.status}`);
        return response.json();
      })
      .then(setBook)
      .catch((reason) => setError(reason.message));
  }, [subjectId, bookId]);

  if (error) return <p className="p-6 text-[#9e1722]">{error}</p>;
  if (!book) return <p className="p-6">Loading subject…</p>;

  return (
    <div>
      <AdminPreviewBanner book={book} />
      <div className="space-y-6 p-4 sm:p-7">
        <section className="luxury-card rounded-[2rem] p-6 sm:p-8">
          <p className="text-[10px] font-black tracking-[0.2em] text-[#9a711a] uppercase">
            Subject page
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#671016]">
            {book.subject}
          </h1>
          <p className="mt-2 text-sm text-[#7a655c]">
            {book.country} → {book.educationalSystem} → {book.curriculum} →{" "}
            {book.grade}
          </p>
          <div className="mt-6">
            <Link
              href={STUDENT_ROUTES.read(book.bookId)}
              className="p11-btn-primary inline-flex items-center gap-2 !rounded-2xl px-5 py-3 text-sm"
            >
              📖 Book
            </Link>
          </div>
        </section>

        <section className="luxury-card rounded-[2rem] p-6">
          <h2 className="text-xl font-black text-[#671016]">
            Table of Contents preview
          </h2>
          <ul className="mt-4 space-y-3">
            {(book.units || []).map((unit) => (
              <li
                key={unit.id}
                className="rounded-xl border border-[#d4af37]/25 p-3"
              >
                <p className="font-bold text-[#671016]">{unit.title}</p>
                <p className="text-xs text-[#8b7770]">
                  {(unit.lessons || []).length} lessons
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export function DigitalBookReader({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<LiveBook | null>(null);
  const [error, setError] = useState("");
  const [versionToken, setVersionToken] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeLesson, setActiveLesson] = useState<{
    unitId: string;
    lessonId: string;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function loadBook() {
    const response = await fetch(
      `/api/student-books?view=book&id=${encodeURIComponent(bookId)}`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error(`BOOK_${response.status}`);
    const payload = (await response.json()) as LiveBook;
    setBook(payload);
    const firstUnit = payload.units?.[0];
    const firstLesson = firstUnit?.lessons?.[0];
    if (firstUnit && firstLesson) {
      setActiveLesson({ unitId: firstUnit.id, lessonId: firstLesson.id });
      setExpanded({ [firstUnit.id]: true });
    }
    const version = await fetch(
      `/api/student-books?view=version&id=${encodeURIComponent(bookId)}`,
      { cache: "no-store" },
    ).then((item) => item.json());
    setVersionToken(version.versionToken);
    const storageKey = `success-os:me-reader:${bookId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.activeLesson) setActiveLesson(parsed.activeLesson);
      if (parsed.bookmarks) setBookmarks(parsed.bookmarks);
      if (parsed.notes) setNotes(parsed.notes);
      if (parsed.fontSize) setFontSize(parsed.fontSize);
      if (parsed.lineHeight) setLineHeight(parsed.lineHeight);
      if (parsed.theme) setTheme(parsed.theme);
    }
  }

  useEffect(() => {
    loadBook().catch((reason) => setError(reason.message));
  }, [bookId]);

  useEffect(() => {
    if (!book) return;
    const timer = setInterval(async () => {
      try {
        const version = await fetch(
          `/api/student-books?view=version&id=${encodeURIComponent(bookId)}`,
          { cache: "no-store" },
        ).then((item) => item.json());
        if (version.versionToken && version.versionToken !== versionToken) {
          setVersionToken(version.versionToken);
          await loadBook();
        }
      } catch {
        // keep current session readable if poll fails
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [book, bookId, versionToken]);

  useEffect(() => {
    if (!book || !activeLesson) return;
    localStorage.setItem(
      `success-os:me-reader:${bookId}`,
      JSON.stringify({
        activeLesson,
        bookmarks,
        notes,
        fontSize,
        lineHeight,
        theme,
        savedAt: new Date().toISOString(),
      }),
    );
  }, [
    book,
    bookId,
    activeLesson,
    bookmarks,
    notes,
    fontSize,
    lineHeight,
    theme,
  ]);

  const flatLessons = useMemo((): FlatLesson[] => {
    if (!book) return [];
    return (book.units || []).flatMap((unit: LiveUnit) =>
      (unit.lessons || []).map((lesson: LiveLesson) => ({
        unitId: unit.id,
        lessonId: lesson.id,
        unitTitle: unit.title,
        lesson,
      })),
    );
  }, [book]);

  const currentIndex = flatLessons.findIndex(
    (item: FlatLesson) =>
      item.unitId === activeLesson?.unitId &&
      item.lessonId === activeLesson?.lessonId,
  );
  const current =
    currentIndex >= 0 ? (flatLessons[currentIndex] ?? null) : null;

  const searchHits = useMemo((): FlatLesson[] => {
    if (!query.trim() || !book) return [];
    const q = query.toLowerCase();
    return flatLessons.filter((item: FlatLesson) => {
      const haystack = [
        item.lesson.title,
        item.lesson.summary,
        item.lesson.fullLesson,
        ...(item.lesson.mainConcepts || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, book, flatLessons]);

  if (error) return <p className="p-6 text-[#9e1722]">{error}</p>;
  if (!book || !current) return <p className="p-6">Opening digital book…</p>;

  const progress =
    flatLessons.length > 0
      ? Math.round(((currentIndex + 1) / flatLessons.length) * 100)
      : 0;
  const bookmarkKey = `${current.unitId}:${current.lessonId}`;
  const isBookmarked = bookmarks.includes(bookmarkKey);
  const lessonSlides = [
    {
      title: "مقدمة",
      body: current.lesson.summary || current.lesson.title,
      kind: "intro",
    },
    {
      title: "المفاهيم الأساسية",
      body:
        (current.lesson.mainConcepts || []).join(" · ") || current.lesson.title,
      kind: "concepts",
    },
    {
      title: "الشرح",
      body:
        (current.lesson.fullLesson || "").slice(0, 420) ||
        current.lesson.summary ||
        current.lesson.title,
      kind: "explain",
    },
    {
      title: "تدريب",
      body: "يحل الطالب سؤالاً متدرجاً ويحصل على تغذية راجعة حسب اختياره.",
      kind: "practice",
    },
  ];

  return (
    <div
      className={
        theme === "dark"
          ? "p11-reader-shell min-h-screen bg-[#120c0d] text-[#f8ead8]"
          : "p11-reader-shell min-h-screen bg-[#fffdf8] text-[#2f211c]"
      }
    >
      <AdminPreviewBanner book={book} />
      <div className="sticky top-0 z-20 border-b border-[#d4af37]/25 bg-black/5 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/student/books"
            className="text-sm font-bold text-[#9a711a]"
          >
            ← Library
          </Link>
          <strong className="text-sm">
            {book.cover?.title || book.subject}
          </strong>
          <span className="text-xs text-[#9a711a]">{progress}%</span>
          <div className="ms-auto flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border px-2 py-1 text-xs"
              onClick={() => setFontSize((value) => Math.max(14, value - 1))}
            >
              A-
            </button>
            <button
              type="button"
              className="rounded-lg border px-2 py-1 text-xs"
              onClick={() => setFontSize((value) => Math.min(28, value + 1))}
            >
              A+
            </button>
            <button
              type="button"
              className="rounded-lg border px-2 py-1 text-xs"
              onClick={() =>
                setLineHeight((value) =>
                  Math.max(1.4, Number((value - 0.1).toFixed(1))),
                )
              }
            >
              Spacing -
            </button>
            <button
              type="button"
              className="rounded-lg border px-2 py-1 text-xs"
              onClick={() =>
                setLineHeight((value) =>
                  Math.min(2.4, Number((value + 0.1).toFixed(1))),
                )
              }
            >
              Spacing +
            </button>
            <button
              type="button"
              className="rounded-lg border px-2 py-1 text-xs"
              onClick={() =>
                setTheme((value) => (value === "light" ? "dark" : "light"))
              }
            >
              {theme === "light" ? "Dark" : "Light"}
            </button>
            <button
              type="button"
              className="rounded-lg border px-2 py-1 text-xs"
              onClick={() =>
                setBookmarks((prev) =>
                  isBookmarked
                    ? prev.filter((item) => item !== bookmarkKey)
                    : [...prev, bookmarkKey],
                )
              }
            >
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 p-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:p-6">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#d4af37]/25 p-3">
            <input
              className="w-full rounded-xl border border-[#d4af37]/30 bg-white/90 px-3 py-2 text-sm text-[#2f211c]"
              placeholder="Search inside the book"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs">
                {searchHits.map((hit: FlatLesson) => (
                  <li key={`${hit.unitId}-${hit.lessonId}`}>
                    <button
                      type="button"
                      className="text-left underline"
                      onClick={() =>
                        setActiveLesson({
                          unitId: hit.unitId,
                          lessonId: hit.lessonId,
                        })
                      }
                    >
                      {hit.lesson.title}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[#d4af37]/25 p-3">
            <h2 className="text-sm font-black">Table of Contents</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(book.units || []).map((unit: LiveUnit) => (
                <li key={unit.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between font-bold"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [unit.id]: !prev[unit.id],
                      }))
                    }
                  >
                    <span>{unit.title}</span>
                    <span>{expanded[unit.id] ? "−" : "+"}</span>
                  </button>
                  {expanded[unit.id] ? (
                    <ul className="mt-1 space-y-1 ps-3">
                      {(unit.lessons || []).map((lesson: LiveLesson) => (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            className={
                              current.lessonId === lesson.id &&
                              current.unitId === unit.id
                                ? "font-bold text-[#c45c26]"
                                : ""
                            }
                            onClick={() =>
                              setActiveLesson({
                                unitId: unit.id,
                                lessonId: lesson.id,
                              })
                            }
                          >
                            {lesson.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article
          className="rounded-[2rem] border border-[#d4af37]/25 p-6 sm:p-10"
          style={{ fontSize: `${fontSize}px`, lineHeight }}
        >
          <p className="text-xs font-black tracking-[0.18em] text-[#9a711a] uppercase">
            {current.unitTitle}
          </p>
          <h1 className="mt-3 text-3xl font-black">{current.lesson.title}</h1>

          <section className="mt-8">
            <h2 className="text-xl font-black">Learning Objectives</h2>
            <ul className="mt-2 list-disc ps-5">
              {(current.lesson.learningObjectives || []).map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-black">Summary</h2>
            <p className="mt-2 whitespace-pre-line">{current.lesson.summary}</p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-black">Full Lesson</h2>
            <p className="mt-2 whitespace-pre-line">
              {current.lesson.fullLesson}
            </p>
          </section>

          <section className="mt-8">
            <BookLessonMediaPlayer
              bookId={bookId}
              subject={book.subject}
              grade={book.grade}
              curriculum={book.curriculum}
              lessonTitle={current.lesson.title}
              slides={lessonSlides}
            />
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-black">Notes</h2>
            <textarea
              className="mt-2 min-h-28 w-full rounded-xl border border-[#d4af37]/35 bg-white/90 p-3 text-sm text-[#2f211c]"
              placeholder="اكتب ملاحظاتك على هذا الدرس…"
              value={notes[bookmarkKey] || ""}
              onChange={(event) =>
                setNotes((prev) => ({
                  ...prev,
                  [bookmarkKey]: event.target.value,
                }))
              }
            />
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-black">Key Concepts</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {(current.lesson.mainConcepts || []).map((item: string) => (
                <li
                  key={item}
                  className="rounded-full border border-[#d4af37]/30 px-3 py-1 text-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-[#d4af37]/25 pt-6">
            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-40"
              disabled={currentIndex <= 0}
              onClick={() => {
                const previous = flatLessons[currentIndex - 1];
                if (previous) {
                  setActiveLesson({
                    unitId: previous.unitId,
                    lessonId: previous.lessonId,
                  });
                  setExpanded((prev) => ({ ...prev, [previous.unitId]: true }));
                }
              }}
            >
              ← Previous Lesson
            </button>
            <button
              type="button"
              className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-40"
              disabled={currentIndex >= flatLessons.length - 1}
              onClick={() => {
                const next = flatLessons[currentIndex + 1];
                if (next) {
                  setActiveLesson({
                    unitId: next.unitId,
                    lessonId: next.lessonId,
                  });
                  setExpanded((prev) => ({ ...prev, [next.unitId]: true }));
                }
              }}
            >
              Next Lesson →
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
