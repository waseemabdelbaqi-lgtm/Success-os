"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { InteractiveLessonPlayer } from "@/components/marketing/interactive-lesson-player";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const GATEWAYS = [
  {
    title: "بوابة الطالب",
    desc: "مكتبة الكتب، الدروس التفاعلية، الملاحظات، ومتابعة التقدّم.",
    href: "/student/dashboard",
    tag: "طالب",
  },
  {
    title: "بوابة القبول الجامعي",
    desc: "فلترة ذكية حسب الجنسية والمعدل، ثم تقديم بـ 5$ ومسار مزدوج.",
    href: "/onboard",
    tag: "قبول",
  },
  {
    title: "بوابة الأدمن",
    desc: "تشغيل المنهاج الأردني، السجلات، ومراكز التحكم المؤسسية.",
    href: "/admin",
    tag: "أدمن",
  },
  {
    title: "المعلم الذكي",
    desc: "اسأل وتدرّب خطوة بخطوة على محتوى معتمد.",
    href: "/tutor",
    tag: "ذكاء",
  },
] as const;

/**
 * الصفحة الرئيسية المعاد بناؤها — تركيبة واحدة واضحة وربط فعلي بين البوابات.
 */
export function SuccessOsHome() {
  return (
    <div className="sos-rebuilt-home min-h-screen bg-[#fff8f8] text-[#301218]" dir="rtl">
      {/* Nav */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link
            href="/"
            className="font-[family-name:var(--font-sos-display)] text-xl font-semibold tracking-tight text-white drop-shadow"
          >
            SUCCESS OS
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/90 md:flex">
            <a href="#gateways" className="hover:text-white">
              البوابات
            </a>
            <a href="#lesson" className="hover:text-white">
              الدرس التفاعلي
            </a>
            <Link href="/student/dashboard" className="hover:text-white">
              الطالب
            </Link>
            <Link href="/admin" className="hover:text-white">
              الأدمن
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              دخول
            </Link>
            <Link
              href="/student/dashboard"
              className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#9e1722] hover:bg-[#fff8f8]"
            >
              ابدأ كطالب
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — full-bleed, brand-first, one composition */}
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <motion.div
          initial={{ scale: 1.08, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src="/media/success-future-gateways.webp"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4b0a11] via-[#4b0a11]/75 to-[#4b0a11]/35" />
        </motion.div>

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-24">
          <motion.div
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.12 }}
            className="max-w-2xl"
          >
            <motion.p
              variants={fade}
              className="text-xs font-bold uppercase tracking-[0.22em] text-[#f2d77c]"
            >
              SUCCESS OS
            </motion.p>
            <motion.h1
              variants={fade}
              className="mt-4 font-[family-name:var(--font-sos-display)] text-4xl font-semibold leading-[1.1] text-white sm:text-6xl"
            >
              نظام تعليم واحد…
              <span className="mt-2 block text-[#f2d77c]">من الدرس إلى القبول</span>
            </motion.h1>
            <motion.p
              variants={fade}
              className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
            >
              تعلّم تفاعلي، مكتبات مناهج، وقبول جامعي ذكي — مربوط في تجربة عربية واضحة.
            </motion.p>
            <motion.div variants={fade} className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/student/dashboard"
                className="rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#9e1722] shadow-lg transition hover:-translate-y-0.5"
              >
                ادخل لوحة الطالب
              </Link>
              <Link
                href="/onboard"
                className="rounded-2xl border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                ابدأ القبول الجامعي
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Gateways — one purpose: clear working entries */}
      <section id="gateways" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a711a]">
            البوابات
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-sos-display)] text-3xl font-semibold text-[#301218] sm:text-4xl">
            اختر بوابتك — وكل رابط يعمل
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#73636a]">
            لا تكرار ولا مسارات ميتة. كل بوابة تأخذك مباشرة إلى الصفحة الصحيحة.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {GATEWAYS.map((g, i) => (
            <motion.div
              key={g.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
            >
              <Link
                href={g.href}
                className="group block border-b border-[#ead9db] pb-5 transition hover:border-[#9e1722]"
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a711a]">
                  {g.tag}
                </span>
                <h3 className="mt-2 text-xl font-bold text-[#301218] group-hover:text-[#9e1722]">
                  {g.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#73636a]">{g.desc}</p>
                <span className="mt-3 inline-block text-sm font-bold text-[#9e1722]">
                  افتح ←
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive video */}
      <section id="lesson" className="border-y border-[#ead9db] bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a711a]">
              فيديو تفاعلي
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-sos-display)] text-3xl font-semibold text-[#301218] sm:text-4xl">
              درس حيّ… اضغط الفصل وانتقل داخل الفيديو
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#73636a]">
              نموذج لشرح فيزياء تفاعلي. نفس أسلوب الدروس داخل بوابة الطالب.
            </p>
          </div>
          <InteractiveLessonPlayer />
          <div className="mt-6">
            <Link
              href="/student/dashboard"
              className="inline-flex rounded-xl bg-[#9e1722] px-5 py-3 text-sm font-bold text-white hover:bg-[#7f121b]"
            >
              أكمل التعلم في لوحة الطالب
            </Link>
          </div>
        </div>
      </section>

      {/* Connected map */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a711a]">
          الربط بين الصفحات
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-sos-display)] text-3xl font-semibold">
          مسار واضح من الصفحة الرئيسية
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "الطالب",
              d: "لوحة + كتب + فيديو الدرس",
              href: "/student/dashboard",
            },
            {
              n: "02",
              t: "القبول",
              d: "جنسية ومعدل → جامعات → دفع 5$",
              href: "/onboard",
            },
            {
              n: "03",
              t: "الأدمن",
              d: "تشغيل المحتوى والسجلات",
              href: "/admin",
            },
          ].map((step) => (
            <li key={step.n}>
              <Link href={step.href} className="block group">
                <span className="text-xs font-bold text-[#9a711a]">{step.n}</span>
                <h3 className="mt-1 text-lg font-bold group-hover:text-[#9e1722]">
                  {step.t}
                </h3>
                <p className="mt-1 text-sm text-[#73636a]">{step.d}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-[#ead9db] bg-[#4b0a11] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-[family-name:var(--font-sos-display)] text-xl font-semibold">
              SUCCESS OS
            </p>
            <p className="mt-1 text-sm text-white/70">
              نظام التعليم الذكي من Success 4 Sure
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/student/dashboard" className="hover:text-[#f2d77c]">
              الطالب
            </Link>
            <Link href="/admin" className="hover:text-[#f2d77c]">
              الأدمن
            </Link>
            <Link href="/onboard" className="hover:text-[#f2d77c]">
              القبول
            </Link>
            <Link href="/contact" className="hover:text-[#f2d77c]">
              تواصل
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
