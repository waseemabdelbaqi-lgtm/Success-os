"use client";

import Link from "next/link";
import { useMemo, type CSSProperties, type ReactNode } from "react";
import {
  DEMO_BOOKS,
  DEMO_SUBJECTS,
  getLocalizedText,
} from "@/content/demo/catalog";
import { bookCatalogService } from "@/services/student/book-catalog.service";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";
import { useStudentPortal } from "@/components/student-portal/providers/student-portal-provider";
import { useStudentData } from "@/hooks/use-student-data";
import { StudentTopBar } from "@/components/student-portal/layout/student-top-bar";
import { BookCard } from "@/components/student-portal/books/book-card";
import { ProgressBar } from "@/components/student-portal/shared/progress-bar";
import type {
  BookDefinition,
  BookProgress,
  PortalLocale,
} from "@/types/student-portal";

export function StudentDashboard(): ReactNode {
  const { locale, t } = useStudentPortal();
  const { bookProgress, savedBooks, profile } = useStudentData();

  const continueReading = useMemo(
    () =>
      bookCatalogService.buildContinueReading(bookProgress, locale),
    [bookProgress, locale],
  );

  const recentBooks = useMemo(() => {
    const sorted = [...bookProgress].sort(
      (a, b) =>
        new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime(),
    );
    const fromProgress = sorted
      .slice(0, 4)
      .map((item) => bookCatalogService.getBookById(item.bookId))
      .filter(Boolean);
    return fromProgress.length > 0 ? fromProgress : DEMO_BOOKS.slice(0, 3);
  }, [bookProgress]);

  const recommended = useMemo(
    () =>
      bookCatalogService.getRecommendedBooks(
        profile ?? {},
        savedBooks.map((s) => s.bookId),
        locale,
      ),
    [profile, savedBooks, locale],
  );

  const currentSubjects = DEMO_SUBJECTS.filter((s) =>
    profile?.subjectIds.includes(s.id),
  );

  const demoContinue = {
    bookId: DEMO_BOOKS[0]!.id,
    unitId: DEMO_BOOKS[0]!.units[0]!.id,
    lessonId: DEMO_BOOKS[0]!.units[0]!.lessons[0]!.id,
    bookTitle: getLocalizedText(DEMO_BOOKS[0]!.title, locale),
    lessonTitle: getLocalizedText(
      DEMO_BOOKS[0]!.units[0]!.lessons[0]!.title,
      locale,
    ),
    progressPercent: 64,
    lastReadAt: new Date().toISOString(),
  };
  const activeReading =
    continueReading.length > 0 ? continueReading : [demoContinue];
  const averageProgress =
    bookProgress.length > 0
      ? Math.round(
          bookProgress.reduce((sum, book) => sum + book.progressPercent, 0) /
            bookProgress.length,
        )
      : 72;

  return (
    <div>
      <StudentTopBar
        title="مرحبًا بك في لوحة الطالب"
        subtitle="واصِل قراءتك — دروسك وفيديوهاتك جاهزة."
      />
      <div className="space-y-7 p-4 sm:p-7">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#76151a] via-[#8b1e1e] to-[#5a0d12] p-6 text-white shadow-[0_28px_70px_rgba(107,16,22,0.24)] sm:p-8">
          <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full border-[42px] border-[#d4af37]/12" />
          <div className="absolute bottom-0 right-1/4 h-28 w-56 rounded-full bg-[#d4af37]/15 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#f0d477]">
                SUCCESS OS · طالب
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                كتبك ودروسك التفاعلية في مكان واحد.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/70">
                مكتبتك، الملخصات، الملاحظات، والفيديو التفاعلي — مرتّبة لتكمِل من حيث توقفت بكل وضوح.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={STUDENT_ROUTES.books}
                  className="rounded-xl bg-gradient-to-br from-[#f1d77e] to-[#c89a28] px-5 py-3 text-sm font-black text-[#47100e] shadow-xl transition hover:-translate-y-1"
                >
                  استكشف المكتبة
                </Link>
                <Link
                  href="/"
                  className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
                >
                  الصفحة الرئيسية
                </Link>
              </div>
            </div>
            <div className="relative mx-auto h-40 w-48">
              <div className="book-3d absolute bottom-0 left-2 h-36 w-24 -rotate-12 rounded-l-lg bg-gradient-to-br from-[#d4af37] to-[#8d6010] p-3 text-white">
                <span className="text-[8px] font-black">MATHEMATICS</span>
              </div>
              <div className="book-3d absolute bottom-0 right-5 h-40 w-28 rotate-6 rounded-l-lg bg-gradient-to-br from-[#fbf1db] to-[#d8b86a] p-3 text-[#671016]">
                <span className="text-[8px] font-black">SUCCESS SCIENCE</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon="▤" label="My library" value={String(Math.max(savedBooks.length, 24))} note="Books in your library" />
          <StatCard icon="◆" label="In progress" value={String(Math.max(bookProgress.length, 8))} note="Books you are reading" />
          <StatCard icon="✓" label="Completed" value="16" note="Lessons completed" />
          <StatCard icon="◷" label="Study time" value="128h" note="Total reading time" />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_18rem]">
          <DashboardSection title={t("continueReading")} href={STUDENT_ROUTES.readingHistory}>
            <div className="grid gap-4 md:grid-cols-2">
              {activeReading.slice(0, 2).map((item) => (
                <Link
                  key={`${item.bookId}-${item.lessonId}`}
                  href={STUDENT_ROUTES.lesson(item.bookId, item.unitId, item.lessonId)}
                  className="luxury-card-hover flex gap-4 rounded-2xl border border-[#d4af37]/25 bg-[#fffaf0]/70 p-4"
                >
                  <div className="book-3d h-28 w-20 shrink-0 rounded-l-md bg-gradient-to-br from-[#8b1e1e] to-[#4d0a0e] p-3 text-white">
                    <span className="text-[8px] font-black text-[#f2d77c]">SUCCESS</span>
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <h3 className="truncate font-black text-[#621116]">{item.bookTitle}</h3>
                    <p className="mt-1 truncate text-xs text-[#79655e]">{item.lessonTitle}</p>
                    <ProgressBar value={item.progressPercent} className="mt-5" />
                    <p className="mt-3 text-xs font-bold text-[#8b1e1e]">{t("continueLesson")} →</p>
                  </div>
                </Link>
              ))}
            </div>
          </DashboardSection>

          <section className="luxury-card rounded-[1.75rem] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a711a]">
              Your progress
            </p>
            <div className="relative mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full bg-[conic-gradient(#8b1e1e_var(--progress),#f0dfba_0)]" style={{ "--progress": `${averageProgress * 3.6}deg` } as CSSProperties}>
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                <span className="text-3xl font-black text-[#671016]">{averageProgress}%</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#8f7a71]">Overall</span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {["M", "T", "W", "T", "F", "S", "S"].slice(0, 3).map((day, index) => (
                <div key={`${day}-${index}`}>
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#8b1e1e]/7 text-xs font-bold text-[#8b1e1e]">{day}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <DashboardSection title={t("recentlyOpened")} href={STUDENT_ROUTES.books}>
          <BookGrid books={recentBooks} locale={locale} bookProgress={bookProgress} />
        </DashboardSection>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <DashboardSection title="Explore subjects" href={STUDENT_ROUTES.books}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(currentSubjects.length ? currentSubjects : DEMO_SUBJECTS.slice(0, 4)).map((subject) => (
                <Link
                  key={subject.id}
                  href={
                    DEMO_BOOKS.find((book) => book.subjectId === subject.id)
                      ? STUDENT_ROUTES.book(
                          DEMO_BOOKS.find(
                            (book) => book.subjectId === subject.id,
                          )!.id,
                        )
                      : STUDENT_ROUTES.books
                  }
                  className="luxury-card-hover rounded-2xl border border-[#d4af37]/20 bg-[#fffaf0] p-4 text-center"
                >
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f2d77c] to-[#c89a28] text-lg font-black text-[#5b1114] shadow-md">{subject.icon}</span>
                  <p className="mt-3 text-xs font-black text-[#671016]">{getLocalizedText(subject.name, locale)}</p>
                </Link>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection title="AI Study Assistant" href={STUDENT_ROUTES.assistant}>
            <div className="flex items-center gap-5 rounded-2xl bg-gradient-to-br from-[#fff7e6] to-[#f3e0b8] p-5">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] border border-[#d4af37]/40 bg-white text-4xl shadow-xl">✦</span>
              <div>
                <p className="font-black text-[#671016]">Ask about any book or lesson</p>
                <p className="mt-1 text-sm leading-6 text-[#79655e]">Get concise explanations grounded in the lesson you are reading.</p>
                <Link href={STUDENT_ROUTES.assistant} className="mt-3 inline-block text-xs font-black text-[#8b1e1e]">Open assistant →</Link>
              </div>
            </div>
          </DashboardSection>
        </section>

        <DashboardSection title={t("recommended")}>
          <BookGrid
            books={recommended}
            locale={locale}
            bookProgress={bookProgress}
          />
        </DashboardSection>
      </div>
    </div>
  );
}

function DashboardSection({
  title,
  children,
  href,
}: {
  title: string;
  children: ReactNode;
  href?: string;
}): ReactNode {
  return (
    <section className="luxury-card rounded-[1.75rem] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-black tracking-tight text-[#671016]">{title}</h2>
        {href && (
          <Link href={href} className="text-xs font-black text-[#9a711a] transition hover:text-[#8b1e1e]">
            View all →
          </Link>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
}: {
  icon: string;
  label: string;
  value: string;
  note: string;
}): ReactNode {
  return (
    <div className="luxury-card luxury-card-hover flex items-center gap-4 rounded-[1.5rem] p-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b1e1e] to-[#5f0e12] text-lg text-[#f2d77c] shadow-lg">{icon}</span>
      <div>
        <p className="text-xs font-bold text-[#8a746b]">{label}</p>
        <p className="text-2xl font-black text-[#671016]">{value}</p>
        <p className="text-[10px] text-[#9c8981]">{note}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }): ReactNode {
  return (
    <p className="rounded-2xl border border-dashed border-[#d4af37]/35 bg-[#fffaf0] px-4 py-8 text-center text-sm text-[#8b7770]">
      {message}
    </p>
  );
}

function BookGrid({
  books,
  locale,
  bookProgress,
}: {
  books: Array<BookDefinition | null | undefined>;
  locale: PortalLocale;
  bookProgress: BookProgress[];
}): ReactNode {
  const filtered = books.filter(Boolean);

  if (filtered.length === 0) {
    return <EmptyState message="—" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map((book) => {
        if (!book) return null;
        const progress = bookProgress.find((p) => p.bookId === book.id);
        return (
          <BookCard
            key={book.id}
            book={book}
            locale={locale}
            progressPercent={progress?.progressPercent}
          />
        );
      })}
    </div>
  );
}
