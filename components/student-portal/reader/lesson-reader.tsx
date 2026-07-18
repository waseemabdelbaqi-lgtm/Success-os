"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getLocalizedText } from "@/content/demo/catalog";
import { bookCatalogService } from "@/services/student/book-catalog.service";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";
import { HIGHLIGHT_COLORS } from "@/lib/student-portal/constants";
import { useStudentPortal } from "@/components/student-portal/providers/student-portal-provider";
import { useStudentData } from "@/hooks/use-student-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  BookDefinition,
  LessonDefinition,
  UnitDefinition,
} from "@/types/student-portal";

type LessonReaderProps = {
  book: BookDefinition;
  unit: UnitDefinition;
  lesson: LessonDefinition;
};

export function LessonReader({
  book,
  unit,
  lesson,
}: LessonReaderProps): ReactNode {
  const {
    locale,
    t,
    settings,
    setTheme,
    increaseFontSize,
    decreaseFontSize,
    toggleFullscreen,
    isFullscreen,
  } = useStudentPortal();

  const {
    addBookmark,
    removeBookmark,
    isBookmarked,
    bookmarks,
    addNote,
    notes,
    addHighlight,
    highlights,
    addHistory,
    updateProgress,
    markComplete,
    getBookProgress,
  } = useStudentData();

  const [searchQuery, setSearchQuery] = useState("");
  const [noteText, setNoteText] = useState("");
  const [selectionText, setSelectionText] = useState("");
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const totalLessons = bookCatalogService.getTotalLessons(book.id);
  const { previous, next } = bookCatalogService.getAdjacentLessons(
    book.id,
    unit.id,
    lesson.id,
  );

  const searchResults = useMemo(
    () => bookCatalogService.searchInBook(book.id, searchQuery, locale),
    [book.id, searchQuery, locale],
  );

  const lessonNotes = notes.filter(
    (n) =>
      n.bookId === book.id &&
      n.unitId === unit.id &&
      n.lessonId === lesson.id,
  );

  const lessonHighlights = highlights.filter(
    (h) =>
      h.bookId === book.id &&
      h.unitId === unit.id &&
      h.lessonId === lesson.id,
  );

  const bookmarked = isBookmarked(book.id, unit.id, lesson.id);
  const progress = getBookProgress(book.id);

  useEffect(() => {
    addHistory(book.id, unit.id, lesson.id, lesson.estimatedMinutes);
    updateProgress(book.id, unit.id, lesson.id, totalLessons, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, unit.id, lesson.id]);

  function handleSelectionCopy(): void {
    const selected = window.getSelection()?.toString().trim();
    if (!selected) return;
    setSelectionText(selected);
  }

  async function handleAuthorizedCopy(): Promise<void> {
    const excerpt = selectionText || getLocalizedText(lesson.summary, locale);
    try {
      await navigator.clipboard.writeText(excerpt);
      setCopyMessage(t("authorizedCopy"));
      setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage("Copy failed");
    }
  }

  function handleBookmarkToggle(): void {
    if (bookmarked) {
      const existing = bookmarks.find(
        (b) =>
          b.bookId === book.id &&
          b.unitId === unit.id &&
          b.lessonId === lesson.id,
      );
      if (existing) removeBookmark(existing.id);
    } else {
      addBookmark(
        book.id,
        unit.id,
        lesson.id,
        getLocalizedText(lesson.title, locale),
      );
    }
  }

  const readerClasses = cn(
    "min-h-screen transition-colors duration-500",
    settings.theme === "dark"
      ? "bg-[#180c0d] text-[#f8ead8]"
      : "brand-surface text-[#2f211c]",
    isFullscreen && "fixed inset-0 z-50 overflow-y-auto",
  );

  return (
    <div className={readerClasses}>
      <div
        className={cn(
          "sticky top-0 z-20 border-b backdrop-blur-xl",
          settings.theme === "dark"
            ? "border-[#d4af37]/15 bg-[#180c0d]/92"
            : "border-[#d4af37]/25 bg-[#fffdf7]/92",
        )}
      >
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          <Link
            href={STUDENT_ROUTES.book(book.id)}
            className="text-sm font-bold text-[#9a711a] transition hover:text-[#8b1e1e]"
          >
            ← {getLocalizedText(book.title, locale)}
          </Link>
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={decreaseFontSize}>
              A-
            </Button>
            <span className="text-xs font-bold text-[#9a711a]">{settings.fontSize}px</span>
            <Button type="button" size="sm" variant="ghost" onClick={increaseFontSize}>
              A+
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setTheme(settings.theme === "light" ? "dark" : "light")}
            >
              {settings.theme === "light" ? t("darkMode") : t("lightMode")}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={toggleFullscreen}>
              {isFullscreen ? t("exitFullscreen") : t("fullscreen")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={bookmarked ? "primary" : "secondary"}
              onClick={handleBookmarkToggle}
            >
              {t("bookmarkLesson")}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[94rem] gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-7">
        <article
          className={cn(
            "reading-page rounded-[2rem] border p-6 sm:p-10 lg:p-14",
            settings.theme === "dark"
              ? "border-[#d4af37]/20 bg-[#261416]"
              : "border-[#d4af37]/30 bg-[#fffdf8]",
          )}
          style={{ fontSize: `${settings.fontSize}px`, lineHeight: 1.7 }}
          onMouseUp={handleSelectionCopy}
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a711a]">
            {getLocalizedText(unit.title, locale)}
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#8b1e1e] sm:text-4xl">
            {getLocalizedText(lesson.title, locale)}
          </h1>

          <Section title={t("learningObjectives")}>
            <ul className="list-disc space-y-2 ps-5">
              {lesson.objectives[locale].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section title={t("lessonSummary")}>
            <p>{getLocalizedText(lesson.summary, locale)}</p>
          </Section>

          <Section title={t("completeLesson")}>
            <p className="whitespace-pre-line">
              {getLocalizedText(lesson.content, locale)}
            </p>
          </Section>

          <Section title={t("keyConcepts")}>
            <ul className="flex flex-wrap gap-2">
              {lesson.keyConcepts[locale].map((concept) => (
                <li
                  key={concept}
                  className="rounded-full border border-[#d4af37]/25 bg-[#f8e9c9] px-3 py-1 text-sm font-bold text-[#6a1718]"
                >
                  {concept}
                </li>
              ))}
            </ul>
          </Section>

          <Section title={t("definitions")}>
            <dl className="space-y-3">
              {lesson.definitions[locale].map((def) => (
                <div key={def.term}>
                  <dt className="font-semibold">{def.term}</dt>
                  <dd className="text-[#735f58]">{def.meaning}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title={t("importantNotes")}>
            <ul className="list-disc space-y-2 ps-5">
              {lesson.importantNotes[locale].map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </Section>

          <Section title={t("diagrams")}>
            <div className="grid gap-4 sm:grid-cols-2">
              {lesson.diagrams.map((diagram) => (
                <div
                  key={diagram.id}
                  className="rounded-2xl border border-[#d4af37]/30 bg-[#fff8e9] p-4"
                >
                  <div className="premium-grid flex h-32 items-center justify-center rounded-xl border border-[#d4af37]/20 bg-white text-4xl text-[#8b1e1e]">
                    ⟡
                  </div>
                  <h4 className="mt-3 font-medium">
                    {getLocalizedText(diagram.title, locale)}
                  </h4>
                  <p className="mt-1 text-sm text-zinc-500">
                    {getLocalizedText(diagram.description, locale)}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t("references")}>
            <ul className="list-disc space-y-1 ps-5">
              {lesson.references[locale].map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          </Section>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-[#d4af37]/25 pt-7">
            {previous && (
              <Link
                href={STUDENT_ROUTES.lesson(
                  book.id,
                  previous.unitId,
                  previous.lessonId,
                )}
              >
                <Button variant="secondary">← {t("previousLesson")}</Button>
              </Link>
            )}
            {next && (
              <Link
                href={STUDENT_ROUTES.lesson(
                  book.id,
                  next.unitId,
                  next.lessonId,
                )}
              >
                <Button>{t("nextLesson")} →</Button>
              </Link>
            )}
            <Button
              type="button"
              onClick={() =>
                markComplete(book.id, unit.id, lesson.id, totalLessons)
              }
            >
              {t("markComplete")}
            </Button>
          </div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <ToolPanel title="AI Explanation">
            <div className="rounded-2xl bg-gradient-to-br from-[#8b1e1e] to-[#5a0d12] p-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl text-[#f2d77c]">
                  ✦
                </span>
                <div>
                  <p className="text-sm font-black">Explain this lesson</p>
                  <p className="text-[11px] text-white/65">
                    Grounded in your current book
                  </p>
                </div>
              </div>
              <Link
                href={STUDENT_ROUTES.assistant}
                className="mt-4 block rounded-xl bg-[#d4af37] px-4 py-2.5 text-center text-xs font-black text-[#43100e] transition hover:-translate-y-0.5"
              >
                Open study assistant
              </Link>
            </div>
          </ToolPanel>
          <ToolPanel title={t("searchInBook")}>
            <Input
              label={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-sm">
                {searchResults.map((result) => (
                  <li key={`${result.unitId}-${result.lessonId}`}>
                    <Link
                      href={STUDENT_ROUTES.lesson(
                        book.id,
                        result.unitId,
                        result.lessonId,
                      )}
                      className="block rounded-lg px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <span className="font-medium">{result.lessonTitle}</span>
                      <p className="text-xs text-zinc-500">{result.snippet}</p>
                    </Link>
                  </li>
                ))}
                {searchResults.length === 0 && (
                  <p className="text-xs text-zinc-500">{t("noResults")}</p>
                )}
              </ul>
            )}
          </ToolPanel>

          <ToolPanel title={t("readingTools")}>
            <p className="text-xs text-zinc-500">
              {t("progress")}: {progress?.progressPercent ?? 0}%
            </p>
            {selectionText && (
              <p className="mt-2 rounded-lg bg-[#f7e8c8] p-2 text-xs text-[#6a1718]">
                Selected: {selectionText.slice(0, 80)}
                {selectionText.length > 80 ? "..." : ""}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={handleAuthorizedCopy}>
                {t("copyText")}
              </Button>
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  title={color.label}
                  className="h-7 w-7 rounded-full border border-zinc-300"
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    if (!selectionText) return;
                    addHighlight(
                      book.id,
                      unit.id,
                      lesson.id,
                      selectionText,
                      color.value,
                    );
                  }}
                />
              ))}
            </div>
            {copyMessage && (
              <p className="mt-2 text-xs text-green-600">{copyMessage}</p>
            )}
          </ToolPanel>

          <ToolPanel title={t("myNotes")}>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-24 w-full rounded-xl border border-[#d4af37]/30 bg-white/85 px-3 py-2 text-sm text-[#2f211c] outline-none focus:border-[#d4af37]"
              placeholder={t("addNote")}
            />
            <Button
              type="button"
              size="sm"
              className="mt-2"
              onClick={() => {
                if (!noteText.trim()) return;
                addNote(book.id, unit.id, lesson.id, noteText.trim());
                setNoteText("");
              }}
            >
              {t("addNote")}
            </Button>
            <ul className="mt-3 space-y-2 text-sm">
              {lessonNotes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-xl bg-[#f7e8c8] p-2 text-[#5f1718]"
                >
                  {note.content}
                </li>
              ))}
            </ul>
          </ToolPanel>

          <ToolPanel title={t("highlights")}>
            <ul className="space-y-2 text-sm">
              {lessonHighlights.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg p-2"
                  style={{ backgroundColor: item.color }}
                >
                  {item.text}
                </li>
              ))}
              {lessonHighlights.length === 0 && (
                <p className="text-xs text-zinc-500">{t("noResults")}</p>
              )}
            </ul>
          </ToolPanel>

          <ToolPanel title={t("unitNavigation")}>
            <ul className="space-y-1 text-sm">
              {book.units.map((bookUnit) => (
                <li key={bookUnit.id}>
                  <p className="font-medium">
                    {getLocalizedText(bookUnit.title, locale)}
                  </p>
                  <ul className="ms-3 mt-1 space-y-1">
                    {bookUnit.lessons.map((bookLesson) => (
                      <li key={bookLesson.id}>
                        <Link
                          href={STUDENT_ROUTES.lesson(
                            book.id,
                            bookUnit.id,
                            bookLesson.id,
                          )}
                          className={cn(
                            "block rounded-lg px-2 py-1.5 transition hover:bg-[#f8e9c9]",
                            bookLesson.id === lesson.id &&
                              bookUnit.id === unit.id &&
                              "bg-[#8b1e1e] text-white hover:bg-[#76151a]",
                          )}
                        >
                          {getLocalizedText(bookLesson.title, locale)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </ToolPanel>
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactNode {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <span className="h-7 w-1 rounded-full bg-gradient-to-b from-[#d4af37] to-[#8b1e1e]" />
        <h2 className="text-xl font-black tracking-tight text-[#75151a]">
          {title}
        </h2>
      </div>
      <div className="mt-4 leading-8">{children}</div>
    </section>
  );
}

function ToolPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactNode {
  return (
    <section className="luxury-card rounded-[1.5rem] p-4">
      <h3 className="text-sm font-black text-[#671016]">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}
