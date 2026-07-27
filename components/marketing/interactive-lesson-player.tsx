"use client";

import { useEffect, useRef, useState } from "react";

const CHAPTERS = [
  {
    id: "c1",
    title: "الموقع والسرعة",
    start: 0,
    body: "نبدأ من تعريف الموقع على خط مستقيم وعلاقته بالزمن.",
  },
  {
    id: "c2",
    title: "السرعة المتوسطة",
    start: 18,
    body: "كيف نحسب الإزاحة ÷ الزمن ونميّز السرعة عن التسارع.",
  },
  {
    id: "c3",
    title: "قراءة الرسوم البيانية",
    start: 36,
    body: "نربط ميل منحنى الموقع-الزمن بالسرعة اللحظية عمليًا.",
  },
] as const;

type Props = {
  src?: string;
  poster?: string;
};

/**
 * مشغّل درس تفاعلي — فيديو حقيقي + فصول قابلة للنقر
 */
export function InteractiveLessonPlayer({
  src = "/media/ap-physics-1-position-velocity.mp4",
  poster = "/media/success-future-gateways.webp",
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      const t = video.currentTime;
      let idx = 0;
      for (let i = 0; i < CHAPTERS.length; i += 1) {
        if (t >= CHAPTERS[i]!.start) idx = i;
      }
      setActive(idx);
    };
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, []);

  function jumpTo(index: number) {
    const video = videoRef.current;
    const chapter = CHAPTERS[index];
    if (!video || !chapter) return;
    video.currentTime = chapter.start;
    void video.play().catch(() => {
      setError("اضغط تشغيل على الفيديو للبدء.");
    });
    setActive(index);
  }

  return (
    <div className="sos-interactive-player grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="relative overflow-hidden rounded-2xl bg-[#1a1212] shadow-[0_24px_60px_rgba(75,10,17,0.28)]">
        <video
          ref={videoRef}
          className="aspect-video w-full bg-black object-cover"
          src={src}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          onError={() => setError("تعذّر تحميل ملف الفيديو. تأكد من المسار /media/...")}
        />
        {error ? (
          <p className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/70 px-3 py-2 text-xs text-amber-100">
            {error}
          </p>
        ) : null}
      </div>

      <aside className="flex flex-col gap-3" dir="rtl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a711a]">
          درس تفاعلي · AP Physics
        </p>
        <h3 className="font-[family-name:var(--font-sos-display)] text-2xl font-semibold text-[#301218]">
          Position & Velocity
        </h3>
        <p className="text-sm leading-relaxed text-[#73636a]">
          اختر فصلًا للانتقال مباشرة داخل الفيديو، ثم أكمل من لوحة الطالب.
        </p>
        <ol className="mt-1 space-y-2">
          {CHAPTERS.map((chapter, index) => {
            const isActive = index === active;
            return (
              <li key={chapter.id}>
                <button
                  type="button"
                  onClick={() => jumpTo(index)}
                  className={`w-full rounded-xl border px-4 py-3 text-right transition ${
                    isActive
                      ? "border-[#9e1722] bg-[#9e1722] text-white"
                      : "border-[#ead9db] bg-white text-[#4d3439] hover:border-[#9e1722]/50"
                  }`}
                >
                  <span className="block text-[11px] opacity-80">
                    الفصل {String(index + 1).padStart(2, "0")} · {chapter.start}s
                  </span>
                  <span className="mt-0.5 block text-sm font-bold">{chapter.title}</span>
                  <span
                    className={`mt-1 block text-xs leading-relaxed ${
                      isActive ? "text-white/85" : "text-[#73636a]"
                    }`}
                  >
                    {chapter.body}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
