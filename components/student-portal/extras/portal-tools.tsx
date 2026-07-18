"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { getLocalizedText } from "@/content/demo/catalog";
import { bookCatalogService } from "@/services/student/book-catalog.service";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";
import { StudentTopBar } from "@/components/student-portal/layout/student-top-bar";
import { useStudentPortal } from "@/components/student-portal/providers/student-portal-provider";
import { useStudentData } from "@/hooks/use-student-data";
import { BookCard } from "@/components/student-portal/books/book-card";
import { Button } from "@/components/ui/button";

export function FavoritesPage(): ReactNode {
  const { locale } = useStudentPortal();
  const { savedBooks, bookProgress, toggleSavedBook } = useStudentData();
  const books = savedBooks
    .map((saved) => bookCatalogService.getBookById(saved.bookId))
    .filter(Boolean);

  return (
    <PageFrame
      title="My Library"
      subtitle="Your favorite and saved books, ready whenever you are."
    >
      {books.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => {
            if (!book) return null;
            const progress = bookProgress.find((item) => item.bookId === book.id);
            return (
              <BookCard
                key={book.id}
                book={book}
                locale={locale}
                saved
                progressPercent={progress?.progressPercent}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => toggleSavedBook(book.id)}
                  >
                    Remove from library
                  </Button>
                }
              />
            );
          })}
        </div>
      ) : (
        <EmptyCollection
          icon="♥"
          title="Build your personal library"
          copy="Save books from the catalog and they will appear here."
          href={STUDENT_ROUTES.books}
          action="Explore books"
        />
      )}
    </PageFrame>
  );
}

export function HighlightsPage(): ReactNode {
  const { locale } = useStudentPortal();
  const { highlights } = useStudentData();

  return (
    <PageFrame
      title="Highlights"
      subtitle="Important excerpts collected across your reading journey."
    >
      {highlights.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {highlights.map((highlight) => {
            const lesson = bookCatalogService.getLesson(
              highlight.bookId,
              highlight.unitId,
              highlight.lessonId,
            );
            return (
              <Link
                key={highlight.id}
                href={STUDENT_ROUTES.lesson(
                  highlight.bookId,
                  highlight.unitId,
                  highlight.lessonId,
                )}
                className="luxury-card luxury-card-hover rounded-2xl p-5"
              >
                <span
                  className="inline-block h-2 w-16 rounded-full"
                  style={{ backgroundColor: highlight.color }}
                />
                <blockquote className="mt-4 text-sm font-semibold leading-7 text-[#5e4540]">
                  “{highlight.text}”
                </blockquote>
                <p className="mt-4 text-xs font-black text-[#8b1e1e]">
                  {lesson
                    ? getLocalizedText(lesson.title, locale)
                    : "Open lesson"}{" "}
                  →
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyCollection
          icon="✦"
          title="Your highlights will live here"
          copy="Select text inside any lesson and choose a highlight color."
          href={STUDENT_ROUTES.books}
          action="Start reading"
        />
      )}
    </PageFrame>
  );
}

export function AssistantPage(): ReactNode {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to your book assistant. Ask me to explain a lesson concept, definition, or summary from the demo library.",
    },
  ]);

  function submitQuestion(): void {
    const clean = question.trim();
    if (!clean) return;

    const match = bookCatalogService
      .getAllBooks()
      .flatMap((book) => book.units.flatMap((unit) => unit.lessons))
      .find((lesson) =>
        `${lesson.title.en} ${lesson.summary.en}`
          .toLowerCase()
          .includes(clean.toLowerCase().split(" ")[0] ?? ""),
      );

    const response = match
      ? `${match.title.en}: ${match.summary.en} Key ideas include ${match.keyConcepts.en.join(", ")}.`
      : "I can help with the books currently in your library. Try asking about linear equations, cell structure, particle models, or motion.";

    setMessages((current) => [
      ...current,
      { role: "student", content: clean },
      { role: "assistant", content: response },
    ]);
    setQuestion("");
  }

  return (
    <PageFrame
      title="AI Study Assistant"
      subtitle="Book-grounded explanations for summaries and full lessons."
    >
      <div className="mx-auto max-w-4xl">
        <div className="luxury-card min-h-[28rem] rounded-[2rem] p-5 sm:p-7">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "assistant"
                    ? "me-auto max-w-[86%] rounded-2xl rounded-tl-sm bg-[#fff0d1] p-4 text-sm leading-7 text-[#5e4540]"
                    : "ms-auto max-w-[86%] rounded-2xl rounded-tr-sm bg-[#8b1e1e] p-4 text-sm leading-7 text-white"
                }
              >
                {message.content}
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-2 rounded-2xl border border-[#d4af37]/35 bg-white p-2 shadow-inner">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitQuestion();
              }}
              placeholder="Ask about a concept in your books…"
              className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
            />
            <Button onClick={submitQuestion}>Ask ✦</Button>
          </div>
          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#9a837b]">
            Prototype responses use demo curriculum content only
          </p>
        </div>
      </div>
    </PageFrame>
  );
}

export function NotificationsPage(): ReactNode {
  const notifications = [
    {
      title: "A new Mathematics edition is available",
      copy: "Grade 10 Mathematics was updated to version 2025.1.",
      href: STUDENT_ROUTES.book("book-math-sa-g10"),
      time: "Today",
    },
    {
      title: "Continue your Cell Biology lesson",
      copy: "You have one lesson left in the first unit.",
      href: STUDENT_ROUTES.lesson(
        "book-science-igcse-g9",
        "unit-cell-biology",
        "lesson-cell-transport",
      ),
      time: "Yesterday",
    },
    {
      title: "Your reading streak reached 12 days",
      copy: "Keep reading today to continue your momentum.",
      href: STUDENT_ROUTES.dashboard,
      time: "2 days ago",
    },
  ];

  return (
    <PageFrame
      title="Notifications"
      subtitle="Updates from your books, library, and reading progress."
    >
      <div className="mx-auto max-w-4xl space-y-3">
        {notifications.map((notification) => (
          <Link
            key={notification.title}
            href={notification.href}
            className="luxury-card luxury-card-hover flex gap-4 rounded-2xl p-5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8b1e1e] text-[#f2d77c]">
              ♢
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-black text-[#671016]">{notification.title}</p>
              <p className="mt-1 text-sm text-[#7d6860]">{notification.copy}</p>
            </div>
            <span className="shrink-0 text-xs font-bold text-[#9a711a]">
              {notification.time}
            </span>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}

export function SettingsPage(): ReactNode {
  const { settings, setLocale, setTheme, increaseFontSize, decreaseFontSize } =
    useStudentPortal();

  return (
    <PageFrame
      title="Reading Settings"
      subtitle="Shape the library and reader around how you learn best."
    >
      <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        <SettingCard title="Interface language" copy="Switch instantly between LTR and RTL experiences.">
          <div className="flex gap-2">
            <Button
              variant={settings.locale === "en" ? "primary" : "secondary"}
              onClick={() => setLocale("en")}
            >
              English
            </Button>
            <Button
              variant={settings.locale === "ar" ? "primary" : "secondary"}
              onClick={() => setLocale("ar")}
            >
              العربية
            </Button>
          </div>
        </SettingCard>
        <SettingCard title="Reading appearance" copy="Choose a warm light page or immersive dark reading.">
          <div className="flex gap-2">
            <Button
              variant={settings.theme === "light" ? "primary" : "secondary"}
              onClick={() => setTheme("light")}
            >
              Light
            </Button>
            <Button
              variant={settings.theme === "dark" ? "primary" : "secondary"}
              onClick={() => setTheme("dark")}
            >
              Dark
            </Button>
          </div>
        </SettingCard>
        <SettingCard title="Reader type size" copy="Your preference is remembered across lessons.">
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={decreaseFontSize}>
              A−
            </Button>
            <span className="min-w-16 text-center text-xl font-black text-[#671016]">
              {settings.fontSize}px
            </span>
            <Button variant="secondary" onClick={increaseFontSize}>
              A+
            </Button>
          </div>
        </SettingCard>
        <SettingCard title="Reading data" copy="Bookmarks, notes, and progress stay organized in your account.">
          <Link
            href={STUDENT_ROUTES.profile}
            className="text-sm font-black text-[#8b1e1e]"
          >
            Manage curriculum profile →
          </Link>
        </SettingCard>
      </div>
    </PageFrame>
  );
}

function PageFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div>
      <StudentTopBar title={title} subtitle={subtitle} />
      <div className="p-4 sm:p-7">{children}</div>
    </div>
  );
}

function EmptyCollection({
  icon,
  title,
  copy,
  href,
  action,
}: {
  icon: string;
  title: string;
  copy: string;
  href: string;
  action: string;
}): ReactNode {
  return (
    <div className="luxury-card mx-auto max-w-xl rounded-[2rem] p-10 text-center">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-[#8b1e1e] to-[#5f0e12] text-3xl text-[#f2d77c] shadow-xl">
        {icon}
      </span>
      <h2 className="mt-6 text-2xl font-black text-[#671016]">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#7b6860]">{copy}</p>
      <Link
        href={href}
        className="mt-6 inline-block rounded-xl bg-[#8b1e1e] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-[#d4af37] hover:text-[#43100e]"
      >
        {action}
      </Link>
    </div>
  );
}

function SettingCard({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children: ReactNode;
}): ReactNode {
  return (
    <section className="luxury-card rounded-[1.75rem] p-6">
      <h2 className="text-lg font-black text-[#671016]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#7b6860]">{copy}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
