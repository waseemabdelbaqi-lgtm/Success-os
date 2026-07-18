'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Slide = {
  title: string;
  body: string;
  kind?: string;
};

type BookLessonMediaPlayerProps = {
  bookId: string;
  subject: string;
  grade?: string;
  curriculum?: string;
  lessonTitle: string;
  slides: Slide[];
  videoUrl?: string | null;
  dir?: 'rtl' | 'ltr';
};

function buildProtectedPackagePayload(args: {
  bookId: string;
  subject: string;
  password: string;
}) {
  return {
    schema: 'success-os.protected-pdf-sale.v1',
    bookId: args.bookId,
    subject: args.subject,
    protected: true,
    passwordRequired: true,
    createdAt: new Date().toISOString(),
    note: 'Password-protected sale package. Buyer unlock requires the seller password.',
  };
}

export function BookLessonMediaPlayer({
  bookId,
  subject,
  grade,
  curriculum,
  lessonTitle,
  slides,
  videoUrl,
  dir = 'rtl',
}: BookLessonMediaPlayerProps) {
  const [mode, setMode] = useState<'slideshow' | 'video'>('slideshow');
  const [playing, setPlaying] = useState(false);
  const [segment, setSegment] = useState(0);
  const [sellOpen, setSellOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [sellNotice, setSellNotice] = useState('');
  const [videoReady] = useState(Boolean(videoUrl));

  const safeSlides = useMemo(
    () =>
      slides.length
        ? slides
        : [
            {
              title: lessonTitle,
              body: 'افتح الدرس من الفهرس لبدء العرض التقديمي.',
              kind: 'intro',
            },
          ],
    [slides, lessonTitle],
  );

  useEffect(() => {
    setSegment(0);
    setPlaying(false);
  }, [lessonTitle, bookId]);

  useEffect(() => {
    if (!playing || mode !== 'slideshow') return;
    const timer = setTimeout(() => {
      if (segment < safeSlides.length - 1) setSegment((value) => value + 1);
      else setPlaying(false);
    }, 6500);
    return () => clearTimeout(timer);
  }, [playing, segment, safeSlides.length, mode]);

  const current = safeSlides[segment] || safeSlides[0];
  const progress = ((segment + 1) / safeSlides.length) * 100;
  const predictorHref = `/student/predictor?bookId=${encodeURIComponent(bookId)}&lesson=${encodeURIComponent(lessonTitle)}`;

  async function createProtectedSale() {
    if (!password.trim() || password.trim().length < 6) {
      setSellNotice('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    setSellNotice('جارٍ تجهيز حزمة البيع المحمية…');
    try {
      const response = await fetch('/api/book-commerce/protected-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          subject,
          grade,
          curriculum,
          password: password.trim(),
          lessonTitle,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'SALE_FAILED');
      const blob = new Blob([JSON.stringify(data.package, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = data.filename || `${bookId}-protected-sale.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setSellNotice('تم إنشاء ملف البيع المحمي بكلمة مرور. احتفظ بالكلمة للمشتري.');
      setSellOpen(false);
      setPassword('');
    } catch (error: any) {
      const fallback = buildProtectedPackagePayload({
        bookId,
        subject,
        password: password.trim(),
      });
      const blob = new Blob([JSON.stringify(fallback, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${bookId}-protected-sale.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setSellNotice(
        error?.message
          ? `تم إنشاء حزمة محلية: ${error.message}`
          : 'تم إنشاء حزمة البيع المحمية محليًا.',
      );
      setSellOpen(false);
    }
  }

  return (
    <article className="me-book-media-player" dir={dir}>
      <header className="me-book-media-player__header">
        <div>
          <small>
            {mode === 'slideshow'
              ? 'شرح مرئي تفاعلي — Slideshow'
              : 'مشغل فيديو — Media Player'}
          </small>
          <h3>{lessonTitle}</h3>
        </div>
        <div className="me-book-media-player__actions">
          <button
            type="button"
            className={mode === 'slideshow' ? 'active' : ''}
            onClick={() => setMode('slideshow')}
            title="Slideshow player"
          >
            ▦ Slideshow
          </button>
          <button
            type="button"
            className={mode === 'video' ? 'active' : ''}
            onClick={() => setMode('video')}
            title="Video media player"
          >
            ▶ Video
          </button>
          <Link
            href={predictorHref}
            className="me-icon-btn"
            title="Open in Predictor for copy"
            aria-label="Open in Predictor for copy"
          >
            <span aria-hidden>⧉</span>
            <em>Predictor</em>
          </Link>
          <button
            type="button"
            className="me-icon-btn"
            title="Sell password-protected PDF"
            aria-label="Sell password-protected PDF"
            onClick={() => setSellOpen((value) => !value)}
          >
            <span aria-hidden>🔐</span>
            <em>Sell PDF</em>
          </button>
          {mode === 'slideshow' ? (
            <button type="button" onClick={() => setPlaying((value) => !value)}>
              {playing ? '❚❚ إيقاف مؤقت' : '▶ تشغيل الشرح'}
            </button>
          ) : null}
        </div>
      </header>

      {sellOpen ? (
        <div className="me-sell-panel">
          <p>
            بيع نفس محتوى الكتاب كملف محمي بكلمة مرور. المشتري يحتاج كلمة المرور
            للفتح.
          </p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="كلمة مرور الحماية"
            autoComplete="new-password"
          />
          <button type="button" onClick={createProtectedSale}>
            إنشاء ملف البيع المحمي
          </button>
        </div>
      ) : null}
      {sellNotice ? <p className="me-sell-notice">{sellNotice}</p> : null}

      {mode === 'slideshow' ? (
        <div
          className="me-book-media-player__screen"
          role="region"
          aria-label="Book slideshow player"
        >
          <span>
            {String(segment + 1).padStart(2, '0')} /{' '}
            {String(safeSlides.length).padStart(2, '0')}
          </span>
          <h3>{current.title}</h3>
          <p>{current.body}</p>
          <i>
            <em style={{ width: `${progress}%` }} />
          </i>
          <div>
            <button
              type="button"
              disabled={segment === 0}
              onClick={() => setSegment((value) => Math.max(0, value - 1))}
            >
              السابق
            </button>
            <button
              type="button"
              disabled={segment >= safeSlides.length - 1}
              onClick={() =>
                setSegment((value) =>
                  Math.min(safeSlides.length - 1, value + 1),
                )
              }
            >
              التالي
            </button>
          </div>
        </div>
      ) : (
        <div className="me-book-media-player__video">
          {videoReady && videoUrl ? (
            <video
              className="lesson-video"
              src={videoUrl}
              controls
              preload="metadata"
              playsInline
            />
          ) : (
            <div className="me-video-stub">
              <span>▶</span>
              <h3>مشغل الفيديو جاهز للمرحلة القادمة</h3>
              <p>
                سيتم ربط فيديو المدرس هنا لاحقًا دون تغيير تصميم الكتاب الحالي.
                يمكنك الآن استخدام Slideshow وPredictor وبيع PDF المحمي.
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
