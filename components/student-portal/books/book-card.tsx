import Link from "next/link";
import type { ReactNode } from "react";
import { getLocalizedText } from "@/content/demo/catalog";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";
import { ProgressBar } from "@/components/student-portal/shared/progress-bar";
import type { BookDefinition, PortalLocale } from "@/types/student-portal";

type BookCardProps = {
  book: BookDefinition;
  locale: PortalLocale;
  progressPercent?: number;
  saved?: boolean;
  action?: ReactNode;
};

export function BookCard({
  book,
  locale,
  progressPercent,
  saved,
  action,
}: BookCardProps): ReactNode {
  return (
    <article className="luxury-card luxury-card-hover group flex flex-col overflow-hidden rounded-[1.65rem]">
      <Link href={STUDENT_ROUTES.book(book.id)} className="block flex-1 p-5">
        <div className="relative mb-5 flex h-44 items-center justify-center overflow-visible rounded-2xl bg-gradient-to-br from-[#fffaf0] to-[#f2e2c7]">
          <div
            className="book-3d flex h-36 w-24 -rotate-3 flex-col justify-between rounded-l-lg rounded-r-sm p-3 text-white transition duration-500 group-hover:-translate-y-2 group-hover:rotate-0"
            style={{ backgroundColor: book.coverColor }}
          >
            <span className="text-[7px] font-bold uppercase tracking-[0.17em] text-[#f2d77c]">
              Success Academy
            </span>
            <span className="text-center text-lg font-black">
              {book.coverLabel}
            </span>
            <span className="h-px bg-[#f2d77c]/55" />
          </div>
          {saved && (
            <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#8b1e1e] shadow-md">
              ♥
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-base font-black tracking-tight text-[#5f1116]">
          {getLocalizedText(book.title, locale)}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#78665f]">
          {getLocalizedText(book.description, locale)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-[#9a711a]">
          <span className="rounded-full bg-[#d4af37]/12 px-2.5 py-1">
            {book.version}
          </span>
          <span className="rounded-full bg-[#8b1e1e]/7 px-2.5 py-1 text-[#8b1e1e]">
            {book.bookType}
          </span>
        </div>
        {typeof progressPercent === "number" && (
          <div className="mt-4">
            <ProgressBar value={progressPercent} />
          </div>
        )}
      </Link>
      {action && (
        <div className="border-t border-[#d4af37]/20 bg-[#fffaf0]/55 px-5 py-3">
          {action}
        </div>
      )}
    </article>
  );
}
