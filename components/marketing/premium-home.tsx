"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { PORTALS } from "@/lib/marketing/portals";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export function PremiumHome(): ReactNode {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.45], [0, 110]);

  return (
    <main className="brand-surface min-h-screen overflow-hidden text-[#281713]">
      <PremiumNavigation />

      <section className="premium-grid relative isolate min-h-[92vh] overflow-hidden px-5 pb-20 pt-28 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-28 h-72 w-72 rounded-full bg-[#d4af37]/15 blur-3xl" />
          <div className="absolute right-[7%] top-16 h-96 w-96 rounded-full bg-[#8b1e1e]/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-[48rem] -translate-x-1/2 rounded-full bg-white/80 blur-3xl" />
        </div>

        <motion.div
          style={{ y: heroY }}
          className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.08fr_0.92fr]"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.12 }}
            className="relative z-10"
          >
            <motion.div
              variants={fadeUp}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/45 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#7a5415] shadow-sm backdrop-blur"
            >
              <span className="h-2 w-2 rounded-full bg-[#8b1e1e] shadow-[0_0_0_5px_rgba(139,30,30,0.1)]" />
              Books • Summaries • Full Lessons
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.055em] text-[#671016] sm:text-6xl lg:text-[5.65rem]"
            >
              Knowledge,
              <span className="gold-text block pb-2">beautifully mastered.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-7 max-w-2xl text-base leading-8 text-[#5f514c] sm:text-lg"
            >
              Success OS brings every curriculum book, lesson summary, and full
              reading experience into one premium digital academy—designed to
              help ambitious learners read deeper and progress with confidence.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href={STUDENT_ROUTES.dashboard}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#9c2929] to-[#620d13] px-7 py-4 text-center text-sm font-bold text-white shadow-[0_18px_38px_rgba(139,30,30,0.28)] transition duration-300 hover:-translate-y-1"
              >
                <span className="relative z-10">Enter Student Library</span>
                <span className="absolute inset-y-0 -left-12 w-8 rotate-12 bg-white/30 blur-md transition-transform duration-700 group-hover:translate-x-80" />
              </Link>
              <Link
                href="#portals"
                className="rounded-2xl border border-[#d4af37]/60 bg-white/75 px-7 py-4 text-center text-sm font-bold text-[#671016] shadow-[0_14px_30px_rgba(74,35,24,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white"
              >
                Explore all portals
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-12 grid max-w-xl grid-cols-3 gap-3"
            >
              {[
                ["40K+", "Curated books"],
                ["18", "Curricula"],
                ["2", "Reading languages"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#d4af37]/25 bg-white/55 px-4 py-4 backdrop-blur"
                >
                  <p className="text-xl font-black text-[#75151a]">{value}</p>
                  <p className="mt-1 text-[11px] font-medium text-[#74645d]">
                    {label}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <HeroBookScene />
        </motion.div>
      </section>

      <section id="portals" className="relative px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9a711a]">
              One premium ecosystem
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-[#671016] sm:text-5xl">
              Choose your path to success
            </h2>
            <p className="mt-5 leading-7 text-[#6c5b54]">
              Purpose-built book experiences for learners, educators, and
              institutions—united by a world-class reading platform.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PORTALS.map((portal, index) => (
              <motion.div
                key={portal.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ delay: index * 0.055 }}
                whileHover={{ y: -9, rotateX: 3, rotateY: -3 }}
                style={{ transformPerspective: 900 }}
              >
                <Link
                  href={`/portals/${portal.slug}`}
                  className="luxury-card group flex min-h-72 flex-col rounded-[2rem] p-6 transition duration-300 hover:border-[#d4af37]/70"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d4af37]/35 bg-gradient-to-br from-white to-[#f8e7c3] text-3xl shadow-[0_15px_30px_rgba(92,36,26,0.13)] transition duration-300 group-hover:scale-110 group-hover:rotate-3">
                      {portal.icon}
                    </div>
                    <span className="rounded-full bg-[#8b1e1e]/7 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8b1e1e]">
                      {portal.audience}
                    </span>
                  </div>
                  <h3 className="mt-7 text-xl font-black tracking-tight text-[#671016]">
                    {portal.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[#73615a]">
                    {portal.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-[#d4af37]/20 pt-4 text-sm font-bold text-[#8b1e1e]">
                    Explore portal
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:px-12">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#8b1e1e] via-[#6b1016] to-[#3f080d] px-7 py-14 text-white shadow-[0_36px_90px_rgba(91,21,25,0.28)] sm:px-12 lg:py-20">
          <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[50px] border-[#d4af37]/10" />
          <div className="absolute bottom-0 left-1/3 h-32 w-64 rounded-full bg-[#d4af37]/10 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f1d77b]">
                Your library is ready
              </p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-5xl">
                Open a book. Build a future.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                Start with a curriculum, discover your subjects, and move
                seamlessly from book to unit, lesson summary, and full lesson.
              </p>
            </div>
            <Link
              href={STUDENT_ROUTES.books}
              className="rounded-2xl bg-gradient-to-br from-[#f5dc88] to-[#c99a27] px-7 py-4 text-center text-sm font-black text-[#4b130f] shadow-xl transition hover:-translate-y-1"
            >
              Browse the library
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d4af37]/25 bg-white/50 px-6 py-8 text-center text-sm text-[#76635d]">
        <span className="font-black text-[#74141a]">SUCCESS 4 SURE</span>
        <span className="mx-3 text-[#d4af37]">◆</span>
        Books, summaries, and full lessons—beautifully organized.
      </footer>
    </main>
  );
}

function PremiumNavigation(): ReactNode {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#d4af37]/20 bg-[#fffaf0]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-5 px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9b2727] to-[#5f0e12] text-lg font-black text-[#f0d37a] shadow-lg">
            S
          </div>
          <div>
            <p className="text-base font-black tracking-[0.06em] text-[#671016]">
              SUCCESS
            </p>
            <p className="-mt-0.5 text-[8px] font-bold uppercase tracking-[0.32em] text-[#9c741b]">
              4 Sure Academy
            </p>
          </div>
        </Link>

        <nav className="ms-auto hidden items-center gap-7 text-sm font-semibold text-[#6a554e] md:flex">
          <Link href="#portals" className="transition hover:text-[#8b1e1e]">
            Portals
          </Link>
          <Link
            href={STUDENT_ROUTES.books}
            className="transition hover:text-[#8b1e1e]"
          >
            Books
          </Link>
          <Link href="/login" className="transition hover:text-[#8b1e1e]">
            Sign in
          </Link>
        </nav>

        <Link
          href="/register"
          className="rounded-xl bg-[#8b1e1e] px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_24px_rgba(139,30,30,0.2)] transition hover:-translate-y-0.5 hover:bg-[#d4af37] hover:text-[#4a170f]"
        >
          Join Success OS
        </Link>
      </div>
    </header>
  );
}

function HeroBookScene(): ReactNode {
  const books = [
    {
      title: "Physics",
      subtitle: "Motion & Energy",
      color: "from-[#7b1118] to-[#3e070c]",
      rotate: "-rotate-6",
      delay: 0,
    },
    {
      title: "Mathematics",
      subtitle: "Functions & Algebra",
      color: "from-[#d0a132] to-[#8a5c0a]",
      rotate: "rotate-3",
      delay: 0.5,
    },
    {
      title: "Biology",
      subtitle: "Cells & Systems",
      color: "from-[#9a2c2b] to-[#5b1114]",
      rotate: "rotate-6",
      delay: 1,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, rotateY: 12 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto h-[31rem] w-full max-w-[36rem] [perspective:1200px]"
    >
      <div className="absolute inset-x-6 bottom-6 h-24 rounded-[50%] bg-[#5f0e12]/20 blur-2xl" />
      <div className="luxury-card absolute inset-8 rounded-[3rem] border-[#d4af37]/35" />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-end gap-2 sm:gap-4">
        {books.map((book, index) => (
          <motion.div
            key={book.title}
            animate={{ y: [0, -14, 0], rotateZ: [0, index - 1, 0] }}
            transition={{
              duration: 4.8 + index,
              repeat: Infinity,
              ease: "easeInOut",
              delay: book.delay,
            }}
            className={`book-3d ${book.rotate} h-64 w-32 rounded-l-lg rounded-r-sm bg-gradient-to-br ${book.color} p-4 text-white sm:h-72 sm:w-36`}
          >
            <div className="h-full rounded border border-[#f2d77c]/40 p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#f2d77c]">
                Success Academy
              </p>
              <div className="my-8 h-px bg-[#f2d77c]/40" />
              <p className="text-xl font-black leading-tight">{book.title}</p>
              <p className="mt-2 text-[10px] leading-4 text-white/70">
                {book.subtitle}
              </p>
              <div className="absolute bottom-8 h-10 w-10 rounded-full border border-[#f2d77c]/50" />
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute right-4 top-8 flex h-20 w-20 items-center justify-center rounded-full border border-[#d4af37]/35 bg-white/60 text-2xl shadow-xl backdrop-blur"
      >
        ✦
      </motion.div>
    </motion.div>
  );
}
