import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getPortal, PORTALS } from "@/lib/marketing/portals";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";

type PortalPageProps = {
  params: Promise<{ portal: string }>;
};

export function generateStaticParams(): { portal: string }[] {
  return PORTALS.map((portal) => ({ portal: portal.slug }));
}

export async function generateMetadata({
  params,
}: PortalPageProps): Promise<Metadata> {
  const { portal: slug } = await params;
  const portal = getPortal(slug);

  return {
    title: portal ? `${portal.title} Portal` : "Portal",
    description: portal?.description,
  };
}

export default async function PortalPage({
  params,
}: PortalPageProps): Promise<ReactNode> {
  const { portal: slug } = await params;
  const portal = getPortal(slug);

  if (!portal) {
    notFound();
  }

  const primaryHref =
    portal.slug === "student" ? STUDENT_ROUTES.dashboard : "/register";
  const primaryLabel =
    portal.slug === "student" ? "Enter student library" : "Create your account";

  return (
    <main className="phase11-marketing brand-surface premium-grid min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8b1e1e] font-black text-[#f0d37a] shadow-lg">
              S
            </span>
            <span className="font-black tracking-[0.08em] text-[#671016]">
              SUCCESS
            </span>
          </Link>
          <Link
            href="/#portals"
            className="text-sm font-bold text-[#7d5411] transition hover:text-[#8b1e1e]"
          >
            All portals
          </Link>
        </nav>

        <section className="grid min-h-[78vh] items-center gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-[#d4af37]/45 bg-white/75 text-4xl shadow-[0_20px_44px_rgba(96,38,27,0.14)] backdrop-blur">
              {portal.icon}
            </span>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-[#9a711a]">
              {portal.audience} portal
            </p>
            <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] text-[#671016] sm:text-6xl">
              {portal.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#66544e]">
              {portal.description}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="rounded-2xl bg-gradient-to-br from-[#9c2929] to-[#620d13] px-7 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(139,30,30,0.28)] transition hover:-translate-y-1"
              >
                {primaryLabel}
              </Link>
              <Link
                href={STUDENT_ROUTES.books}
                className="rounded-2xl border border-[#d4af37]/55 bg-white/75 px-7 py-4 text-sm font-black text-[#671016] transition hover:-translate-y-1 hover:bg-white"
              >
                Preview book experience
              </Link>
            </div>
          </div>

          <div className="luxury-card relative overflow-hidden rounded-[2.5rem] p-7 sm:p-10">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#d4af37]/15 blur-2xl" />
            <p className="relative text-xs font-black uppercase tracking-[0.26em] text-[#9a711a]">
              Built around reading
            </p>
            <div className="relative mt-7 space-y-4">
              {portal.features.map((feature, index) => (
                <div
                  key={feature}
                  className="luxury-card-hover flex items-center gap-4 rounded-2xl border border-[#d4af37]/25 bg-white/70 p-5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8b1e1e] text-sm font-black text-[#f2d77c] shadow-lg">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-black text-[#671016]">{feature}</p>
                    <p className="mt-1 text-sm text-[#78655e]">
                      Premium, focused, and beautifully organized.
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative mt-7 rounded-2xl bg-[#8b1e1e]/6 p-5 text-sm leading-7 text-[#6b5750]">
              Success OS is intentionally focused on digital books, lesson
              summaries, and full lessons—without videos, quizzes, or exams.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
