'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { InnerNav } from '../components';

const teachers = [
  {
    initials: 'WA',
    name: 'أ. وسيم اللبدي',
    subjects: ['Physics', 'Chemistry'],
    curricula: ['EST', 'AP', 'ACT'],
    mode: 'هجين',
    country: 'الأردن',
    language: 'عربي وإنجليزي',
    rating: 4.9,
    verified: true,
  },
  {
    initials: 'NA',
    name: 'أ. نسيم اللبدي',
    subjects: ['Mathematics'],
    curricula: ['EST', 'SAT', 'ACT'],
    mode: 'أونلاين',
    country: 'الأردن',
    language: 'عربي وإنجليزي',
    rating: 4.8,
    verified: true,
  },
  {
    initials: 'ZE',
    name: 'أ. زهير عيساوي',
    subjects: ['Physics', 'Mathematics', 'Calculus'],
    curricula: ['AP', 'IGCSE', 'A Level'],
    mode: 'هجين',
    country: 'الأردن',
    language: 'عربي وإنجليزي',
    rating: 4.7,
    verified: true,
  },
  {
    initials: 'NL',
    name: 'أ. نور اللوزي',
    subjects: ['Biology'],
    curricula: ['EST', 'IGCSE', 'AP'],
    mode: 'أونلاين',
    country: 'الأردن',
    language: 'عربي',
    rating: 4.6,
    verified: true,
  },
];

const initial = {
  curriculum: 'الكل',
  subject: 'الكل',
  mode: 'الكل',
  language: 'الكل',
  query: '',
};

function typeLabel(type) {
  if (type === 'recorded') return 'حصة مسجلة';
  if (type === 'online') return 'أونلاين';
  if (type === 'in_person') return 'وجاهي';
  return type;
}

export default function TeachersPage() {
  const [f, setF] = useState(initial);
  const [liveOffers, setLiveOffers] = useState([]);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const mode = q.get('mode') || '';
    setF((x) => ({
      ...x,
      mode: mode.includes('أونلاين')
        ? 'أونلاين'
        : mode.includes('حضوري')
          ? 'هجين'
          : x.mode,
      query: q.get('query') || x.query,
    }));
  }, []);

  useEffect(() => {
    fetch('/api/teachers-os?view=marketplace', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setLiveOffers(json.offers || []);
      })
      .catch(() => {});
  }, []);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const rows = useMemo(
    () =>
      teachers.filter(
        (x) =>
          (f.curriculum === 'الكل' || x.curricula.includes(f.curriculum)) &&
          (f.subject === 'الكل' || x.subjects.includes(f.subject)) &&
          (f.mode === 'الكل' || x.mode === f.mode) &&
          (f.language === 'الكل' || x.language.includes(f.language)) &&
          (!f.query ||
            `${x.name} ${x.subjects.join(' ')} ${x.curricula.join(' ')}`
              .toLowerCase()
              .includes(f.query.toLowerCase())),
      ),
    [f],
  );

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="teachers" />
      <main className="os-page-content">
        <header className="teacher-market-head">
          <div>
            <span>VERIFIED HUMAN EXPERTS</span>
            <h1>ابحث عن المعلم المناسب لاحتياجك</h1>
            <p>
              عروض حية من Teachers OS: سعر، مدة، منطقة، أونلاين/وجاهي، ومواعيد — قبل ما تبدأ.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <a className="teacher-join-link" href="/teachers/register">
              تسجيل معلم
            </a>
            <a className="teacher-join-link" href="/teachers/dashboard">
              لوحة تحكم المعلم
            </a>
            <a className="teacher-join-link" href="/dashboard/teachers">
              Teachers OS
            </a>
          </div>
        </header>

        {liveOffers.length ? (
          <section className="os-card" style={{ marginBottom: '1.25rem' }}>
            <header style={{ marginBottom: '0.75rem' }}>
              <small>TEACHERS OS · LIVE OFFERS</small>
              <h2>عروض المعلمين المنشورة الآن</h2>
            </header>
            <div className="teacher-grid">
              {liveOffers.map((offer) => (
                <article className="os-card teacher-card" key={offer.id}>
                  <small>
                    {typeLabel(offer.type)} · {offer.durationMinutes} دقيقة
                  </small>
                  <h2>{offer.title}</h2>
                  <b>
                    {offer.price} {offer.currency}
                  </b>
                  <p>{offer.subject || offer.description || '—'}</p>
                  <div>
                    {offer.type === 'in_person' ? (
                      <span>{offer.area || 'وجاهي'}</span>
                    ) : null}
                    {offer.type === 'online' ? <span>منصة + Zoom</span> : null}
                    {offer.type === 'recorded' ? <span>ملف مسجّل</span> : null}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link className="os-primary" href={`/teachers/offers/${offer.id}`}>
                      تفاصيل العرض
                    </Link>
                    {offer.teacherId ? (
                      <Link className="os-primary" href={`/teachers/${offer.teacherId}`}>
                        صفحة المعلم والأسعار
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="directory-filter teacher-directory-filter">
          <header>
            <div>
              <small>TEACHER FILTERS</small>
              <h2>حدد احتياج الطالب</h2>
            </div>
            <button type="button" onClick={() => setF(initial)}>
              مسح الفلاتر
            </button>
          </header>
          <div>
            <label>
              المنهاج
              <select value={f.curriculum} onChange={(e) => set('curriculum', e.target.value)}>
                {['الكل', ...new Set(teachers.flatMap((x) => x.curricula))].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              المادة
              <select value={f.subject} onChange={(e) => set('subject', e.target.value)}>
                {['الكل', ...new Set(teachers.flatMap((x) => x.subjects))].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              طريقة الحصة
              <select value={f.mode} onChange={(e) => set('mode', e.target.value)}>
                <option>الكل</option>
                <option>أونلاين</option>
                <option>هجين</option>
              </select>
            </label>
            <label>
              لغة الشرح
              <select value={f.language} onChange={(e) => set('language', e.target.value)}>
                <option>الكل</option>
                <option>عربي</option>
                <option>إنجليزي</option>
              </select>
            </label>
            <label className="filter-search">
              اسم المعلم أو المادة
              <input
                value={f.query}
                onChange={(e) => set('query', e.target.value)}
                placeholder="ابحث بالاسم أو التخصص"
              />
            </label>
          </div>
          <footer>
            <b>{rows.length} معلمين مطابقين</b>
            <span>الترتيب حسب المطابقة، وليس الإعلان</span>
          </footer>
        </section>

        {rows.length ? (
          <div className="teacher-grid">
            {rows.map((x) => (
              <article className="os-card teacher-card" key={x.name}>
                <div className="teacher-avatar">
                  {x.initials}
                  <i>✓</i>
                </div>
                <small>
                  {x.verified ? 'موثق' : 'قيد التحقق'} • {x.country}
                </small>
                <h2>{x.name}</h2>
                <b>{x.subjects.join(' & ')}</b>
                <p>{x.curricula.join(' • ')}</p>
                <div>
                  <span>★ {x.rating}</span>
                  <span>{x.mode}</span>
                  <span>{x.language}</span>
                </div>
                <a
                  className="os-primary"
                  href={`/class-booking?teacher=${encodeURIComponent(x.name)}&subject=${encodeURIComponent(x.subjects[0] || '')}&mode=${encodeURIComponent(x.mode || '')}`}
                >
                  عرض الملف والمواعيد
                </a>
              </article>
            ))}
          </div>
        ) : (
          <section className="directory-empty">
            <span>♙</span>
            <h2>لا يوجد معلم مطابق حالياً</h2>
            <p>وسّع المادة أو المنهاج، أو افتح عروض Teachers OS أعلاه.</p>
            <button type="button" onClick={() => setF(initial)}>
              مسح الفلاتر
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
