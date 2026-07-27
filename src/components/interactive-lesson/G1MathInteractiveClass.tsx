"use client";

import Link from "next/link";
import { InteractiveLessonPlayer } from "@/src/components/interactive-lesson/InteractiveLessonPlayer";
import { JORDAN_G1_MATH_MICRO_PROTOTYPE } from "@/src/lib/interactive-lesson/lessons/jordan-g1-math-micro";

/**
 * Dedicated interactive classroom shell for the 60–90s G1 Math prototype.
 * This page is the product. MP4 is not the lesson.
 */
export function G1MathInteractiveClass() {
  return (
    <main className="g1-class" dir="rtl">
      <style>{shellCss}</style>
      <header className="g1-class-hero">
        <p className="g1-brand">Success OS · Success 4 Sure</p>
        <h1>حصة تفاعلية — الجمع بخط الأعداد</h1>
        <p className="g1-sub">
          Prepared by Mr Waseem Allabadi · أ. لاما النوري · معلّمة مساعدة
        </p>
        <p className="g1-warn" role="note">
          هذا ليس فيديو MP4. الدرس يتوقف عند السؤال وينتظر إجابتك.
        </p>
        <nav className="g1-nav" aria-label="Related">
          <Link href="/digital-library/middle-east/jordan/national/grade-1/الرياضيات/الجمع/الجمع-بخط-الأعداد">
            صفحة المكتبة الرقمية
          </Link>
        </nav>
      </header>
      <InteractiveLessonPlayer
        lesson={JORDAN_G1_MATH_MICRO_PROTOTYPE}
        storageKey="ai-lessons/g1-math/micro"
      />
    </main>
  );
}

const shellCss = `
.g1-class{min-height:100vh;padding:1.25rem clamp(.75rem,3vw,2rem) 2.5rem;background:
  radial-gradient(1200px 500px at 10% -10%,rgba(242,215,124,.35),transparent 55%),
  linear-gradient(165deg,#fff8f2,#f4e4d8 45%,#efe0d4);color:#241618;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif}
.g1-class-hero{max-width:920px;margin:0 auto 1rem}
.g1-brand{margin:0;font-weight:900;color:#9e1722;letter-spacing:.02em}
.g1-class-hero h1{margin:.35rem 0;font-size:clamp(1.35rem,3.5vw,2rem);color:#4b0a11}
.g1-sub{margin:0;font-weight:700;color:#6b3a40}
.g1-warn{margin:.65rem 0 0;padding:.65rem .85rem;border-radius:.75rem;background:rgba(158,23,34,.1);border:1px solid rgba(158,23,34,.2);font-weight:800;max-width:42rem}
.g1-nav{margin-top:.75rem}
.g1-nav a{color:#9e1722;font-weight:800}
`;
