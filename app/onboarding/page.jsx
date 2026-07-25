'use client';
import { useState } from 'react';
import { Brand } from '../components';

const steps = [
  {
    title: 'شو هدفك الأول؟',
    text: 'رح نبني خطتك التعليمية حول هذا الهدف، وبتقدر تعدله بأي وقت.',
    options: [
      ['🎯', 'أرفع علامتي', 'أريد تحسين نتيجتي في المدرسة أو الامتحان'],
      ['🧠', 'أتقن نقطة ضعف', 'أحتاج فهم موضوع أو مهارة محددة'],
      ['📅', 'أستعد لامتحان', 'لدي امتحان EST أو AP أو IGCSE أو A Level'],
      ['♙', 'أحجز معلمًا خبيرًا', 'أحتاج دعمًا مباشرًا من معلم موثق'],
    ],
  },
  {
    title: 'أي مسار يناسبك؟',
    text: 'اختر نوع التعلم لنوجّهك إلى الفلاتر الصحيحة.',
    options: [
      ['⌂', 'طالب مدرسة', 'مناهج مدرسية وحصص ودعم امتحانات'],
      ['🎓', 'طالب جامعة', 'مواد جامعية وتخصصات وقبول'],
      ['▦', 'دورات', 'SAT / EST / ACT / AP / IGCSE ومسارات قصيرة'],
      ['◇', 'ولي أمر', 'متابعة تقدم الطالب بصلاحيات مناسبة'],
    ],
  },
  {
    title: 'وين تدرس الآن؟',
    text: 'الدولة تساعدنا نعرض الأنظمة والمناهج المناسبة.',
    options: [
      ['🇯🇴', 'الأردن', 'نظام وطني + مسارات دولية'],
      ['🇦🇪', 'الإمارات', 'أنظمة متعددة ومدارس دولية'],
      ['🇪🇬', 'مصر', 'EST / ACT / ثانوية ومسارات دولية'],
      ['🌍', 'دولة أخرى', 'نحدد النظام داخل الرحلة'],
    ],
  },
  {
    title: 'جاهز تبدأ؟',
    text: 'الخطوة التالية تفتح مسارًا واضحًا حسب اختياراتك.',
    options: [
      ['⌁', 'تشخيص سريع', 'افتح لوحة الطالب وابدأ'],
      ['⌕', 'ابحث عن معلم', 'انتقل لسوق المعلمين'],
      ['↗', 'ابدأ الرحلة الكاملة', 'فلاتر ونتائج وشراء'],
      ['☎', 'تواصل معنا', 'اسأل فريق Success 4 Sure'],
    ],
  },
];

const finishRoutes = {
  'تشخيص سريع': '/diagnostic',
  'ابحث عن معلم': '/teachers',
  'ابدأ الرحلة الكاملة': '/start-journey?portal=student',
  'تواصل معنا': '/contact',
  'ولي أمر': '/parent',
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState([]);
  const current = steps[step];
  const choice = picks[step] || '';

  function next() {
    if (!choice) return;
    if (choice === 'ولي أمر') {
      window.location.href = '/parent';
      return;
    }
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    window.location.href = finishRoutes[choice] || '/start-journey?portal=student';
  }

  return (
    <main className="onboarding-wrap">
      <section className="onboarding-card">
        <div className="onboarding-top">
          <Brand />
          <span className="onboarding-step">
            الخطوة {step + 1} من {steps.length}
          </span>
        </div>
        <h1>{current.title}</h1>
        <p>{current.text}</p>
        <div className="goal-grid">
          {current.options.map(([icon, title, desc]) => (
            <button
              className={choice === title ? 'selected' : ''}
              onClick={() => {
                const nextPicks = [...picks];
                nextPicks[step] = title;
                setPicks(nextPicks);
              }}
              key={title}
              type="button"
            >
              <span>{icon}</span>
              <div>
                <strong>{title}</strong>
                <small>{desc}</small>
              </div>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          {step > 0 && (
            <button type="button" className="button ghost" onClick={() => setStep((s) => s - 1)}>
              رجوع
            </button>
          )}
          <button className="onboarding-next" disabled={!choice} onClick={next} type="button">
            {step === steps.length - 1 ? 'متابعة إلى مسارك ←' : 'التالي ←'}
          </button>
        </div>
      </section>
    </main>
  );
}
