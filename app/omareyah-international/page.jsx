'use client';

import { useState } from 'react';
import Image from 'next/image';

const PATHWAYS = [
  {
    n: '01',
    title: 'اللغة الإنجليزية الأكاديمية',
    text: 'بناء طلاقة حقيقية للقراءة والكتابة والتقديم — أساس كل مسار دولي.',
    tag: 'Foundation',
  },
  {
    n: '02',
    title: 'مسارات الشهادات الدولية',
    text: 'إعداد منظم لبرامج مثل IGCSE وA Level وSAT وفق جاهزية الطالب والمدرسة.',
    tag: 'Pathways',
  },
  {
    n: '03',
    title: 'التفكير والبحث والعرض',
    text: 'مهارات القرن الحادي والعشرين: التحليل، المشاريع، والقدرة على إيصال الفكرة بثقة.',
    tag: 'Skills',
  },
  {
    n: '04',
    title: 'الإرشاد الجامعي والعالمي',
    text: 'من اختيار المسار إلى ملف القبول — مرافقة هادئة وواضحة دون وعود مبالغ فيها.',
    tag: 'Guidance',
  },
];

const TIMELINE = [
  {
    year: 'السنة 1',
    title: 'إثبات النموذج الأم',
    text: 'تشغيل القسم بهوية واضحة، جودة تشغيل، وتجربة أهل وطلاب قابلة للقياس.',
  },
  {
    year: 'السنة 2–3',
    title: 'استقرار وتوسيع تدريجي',
    text: 'تعميق البرامج، فصل الهوية بصريًا وتشغيليًا، ودراسة مواقع محتملة بقرار مجلس.',
  },
  {
    year: 'السنة 4–5',
    title: 'أفق الفروع',
    text: 'بعد إثبات الجودة: إمكانية فرع أول مدروس، ثم تقييم فرع ثانٍ عند الجاهزية.',
  },
];

export default function OmareyahInternationalPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="oi-root" dir="rtl" lang="ar">
      <header className="oi-nav">
        <div className="oi-shell oi-nav-inner">
          <a className="oi-brand" href="#top" aria-label="العمرية الدولية">
            <img src="/omareyah-international/logo-light.svg" alt="" width={46} height={46} />
            <span className="oi-brand-text">
              <strong>العمرية الدولية</strong>
              <span>Omareyah International</span>
            </span>
          </a>

          <nav className={`oi-nav-links${menuOpen ? ' open' : ''}`} aria-label="القائمة الرئيسية">
            <a href="#vision" onClick={() => setMenuOpen(false)}>
              الرؤية
            </a>
            <a href="#pathways" onClick={() => setMenuOpen(false)}>
              المسارات
            </a>
            <a href="#identity" onClick={() => setMenuOpen(false)}>
              الهوية
            </a>
            <a href="#horizon" onClick={() => setMenuOpen(false)}>
              الأفق
            </a>
            <a className="oi-nav-cta" href="#admit" onClick={() => setMenuOpen(false)}>
              سجل اهتمامك
            </a>
          </nav>

          <button
            type="button"
            className="oi-menu-btn"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main id="top">
        <section className="oi-hero" aria-label="الصفحة الرئيسية">
          <div className="oi-hero-media">
            <Image
              src="/omareyah-international/hero.png"
              alt=""
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="oi-hero-scrim" aria-hidden="true" />
          <div className="oi-hero-copy">
            <p className="oi-hero-en">Omareyah International</p>
            <h1 className="oi-hero-brand">
              العمرية <em>الدولية</em>
            </h1>
            <p className="oi-hero-line">
              قسم دولي بهوية مستقلة ورؤية تليق بطالب يرى العالم أمامه — لا نسخة عن المسار الوطني، بل مسارٌ آخر بكرامة وجمال.
            </p>
            <div className="oi-hero-actions">
              <a className="oi-btn oi-btn-primary" href="#admit">
                ابدأ رحلة الاهتمام
              </a>
              <a className="oi-btn oi-btn-ghost" href="#vision">
                اقرأ الرؤية
              </a>
            </div>
          </div>
        </section>

        <section className="oi-section oi-vision" id="vision">
          <div className="oi-shell oi-vision-grid">
            <div>
              <span className="oi-kicker">الرؤية</span>
              <h2 style={{ fontFamily: 'var(--oi-display)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 600, margin: '0 0 22px', lineHeight: 1.2 }}>
                تعليم دولي بهدوء الثقة
              </h2>
              <p className="oi-vision-quote">
                نبني قسمًا يشعر فيه الطالب أنه في مؤسسة عالمية — بهوية بصرية وتشغيلية منفصلة عن المسار الوطني، دون أن تفقد العمرية جذورها.
              </p>
            </div>
            <ul className="oi-vision-list">
              <li>
                <strong>استقلال الهوية</strong>
                <span>شعار وألوان وتجربة رقمية مختلفة — حتى يعرف الأهل من أول نظرة أنهم في القسم الدولي.</span>
              </li>
              <li>
                <strong>جودة قبل التوسع</strong>
                <span>نثبت النموذج الأم أولًا، ثم نفتح أفق الفروع بقرار واضح لا باندفاع تسويقي.</span>
              </li>
              <li>
                <strong>شراكة استراتيجية</strong>
                <span>Success 4 Sure شريك تحويلي في الخلفية — والواجهة تبقى للعمرية الدولية.</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="oi-section oi-pathways" id="pathways">
          <div className="oi-shell">
            <header className="oi-section-head">
              <span className="oi-kicker">المسارات</span>
              <h2>ما يقدّمه القسم الدولي</h2>
              <p>
                برامج مرتبة حول جاهزية الطالب، لا وعودًا فضفاضة. كل مسار له لغة واضحة ومتابعة قابلة للقياس.
              </p>
            </header>
            <div className="oi-path-rows">
              {PATHWAYS.map((item) => (
                <article className="oi-path-row" key={item.n}>
                  <b>{item.n}</b>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                  <span>{item.tag}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="oi-section oi-identity" id="identity">
          <div className="oi-shell">
            <header className="oi-section-head">
              <span className="oi-kicker">الهوية</span>
              <h2>مساران… مؤسستان في الإحساس</h2>
              <p>
                القسم الدولي ليس صفحة فرعية من الموقع الوطني. له حضوره، لغته، وشكله — مع احترام كامل لمسار التوجيهي والمنهاج الأردني.
              </p>
            </header>
            <div className="oi-split">
              <div className="intl">
                <h3>العمرية الدولية</h3>
                <p>
                  هوية هادئة بلون الحبر والشامبانيا والأخضر الرمادي — شعار بسيط يوحي بالأفق، وتجربة رقمية تليق بمسار عالمي.
                </p>
                <ul>
                  <li>شعار مستقل ونبرة لغوية مختلفة</li>
                  <li>نماذج قبول ولافتات وصفوف بهوية منفصلة</li>
                  <li>موقع وتواصل بصري لا يشبه المسار الوطني</li>
                </ul>
              </div>
              <div className="nat">
                <h3>المسار الوطني</h3>
                <p>
                  يبقى حضور المدارس العمرية الوطني كما يعرفه الأهالي — بجذوره ومجتمعه ورسالته المحلية، دون خلط بصري مع القسم الدولي.
                </p>
                <ul>
                  <li>الموقع الوطني للمدارس العمرية</li>
                  <li>تجربة التوجيهي والمنهاج الأردني</li>
                  <li>هوية مألوفة للمجتمع المحلي</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="oi-section oi-experience" id="experience">
          <div className="oi-shell">
            <header className="oi-section-head centered">
              <span className="oi-kicker">التجربة</span>
              <h2>كيف يشعر الطالب والأهل</h2>
              <p>ثلاث لحظات تصنع الفرق — من أول زيارة إلى متابعة مستمرة.</p>
            </header>
            <div className="oi-exp-flow">
              <article className="oi-exp-item">
                <i>1</i>
                <h3>استقبال واضح</h3>
                <p>مساحة ولغة ومواد تُعرّف القسم الدولي فورًا — بلا التباس مع المسار الوطني.</p>
              </article>
              <article className="oi-exp-item">
                <i>2</i>
                <h3>خطة شخصية</h3>
                <p>تشخيص هادئ لقدرات اللغة والمسار، ثم خارطة تعلم واقعية يمكن متابعتها.</p>
              </article>
              <article className="oi-exp-item">
                <i>3</i>
                <h3>تقارير شفافة</h3>
                <p>تواصل منتظم مع الأهل: تقدّم، فجوات، وخطوات تالية — بلغة محترمة ومباشرة.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="oi-section oi-horizon" id="horizon">
          <div className="oi-shell">
            <header className="oi-section-head centered">
              <span className="oi-kicker">الأفق</span>
              <h2>رؤية مستقبلية بلا استعجال</h2>
              <p>
                التوسع فرعًا بعد فرع ليس هدف السنة الأولى. الهدف: نموذج أمّ قوي يُستنسخ لاحقًا بثقة المجلس.
              </p>
            </header>
            <div className="oi-timeline">
              {TIMELINE.map((item) => (
                <article className="oi-timeline-item" key={item.year}>
                  <time>{item.year}</time>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="oi-admit" id="admit">
          <div className="oi-shell">
            <div className="oi-admit-panel">
              <div>
                <span className="oi-kicker">القبول</span>
                <h2>هل يهمّك مستقبل ابنك في مسار دولي؟</h2>
                <p>
                  سجّل اهتمامك الآن. هذا الموقع يمثّل الرؤية المتوقعة للقسم — وسنتواصل بخطوات قبول واضحة عند الإطلاق التشغيلي.
                </p>
              </div>
              <div className="oi-admit-actions">
                <a className="oi-btn oi-btn-primary" href="mailto:international@omareyah.edu.jo?subject=اهتمام بالقسم الدولي">
                  راسل القسم الدولي
                </a>
                <a
                  className="oi-btn oi-btn-ghost"
                  href="https://omareyah.edu.jo/ar/node/1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  الموقع الوطني للعمرية
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="oi-footer">
        <div className="oi-shell">
          <div className="oi-footer-grid">
            <div className="oi-footer-brand">
              <img src="/omareyah-international/mark.svg" alt="" width={40} height={40} />
              <div>
                <strong>العمرية الدولية</strong>
                <p>
                  Omareyah International Division — هوية مستقلة للمسار الدولي ضمن منظومة المدارس العمرية.
                </p>
              </div>
            </div>
            <div>
              <h4>استكشف</h4>
              <ul>
                <li>
                  <a href="#vision">الرؤية</a>
                </li>
                <li>
                  <a href="#pathways">المسارات</a>
                </li>
                <li>
                  <a href="#identity">فصل الهوية</a>
                </li>
                <li>
                  <a href="#horizon">الأفق المستقبلي</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>ملاحظة</h4>
              <ul>
                <li>مسودة رؤية وتنفيذ مقترحة للقسم الدولي</li>
                <li>الشريك الاستراتيجي: Success 4 Sure</li>
                <li>لا يحل محل الموقع الوطني الرسمي</li>
              </ul>
            </div>
          </div>
          <div className="oi-footer-bottom">
            <span>© {new Date().getFullYear()} Omareyah International Division</span>
            <span>
              تصميم مستقل عن{' '}
              <a href="https://omareyah.edu.jo/ar/node/1" target="_blank" rel="noopener noreferrer">
                omareyah.edu.jo
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
