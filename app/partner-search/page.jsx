'use client';
import { useEffect, useMemo, useState } from 'react';
import { InnerNav } from '../components';

const types = {
  teacher: ['♙', 'المعلمون', '/teachers'],
  center: ['▦', 'المراكز التعليمية', '/partner-search?portal=center'],
  school: ['⌂', 'المدارس', '/admissions'],
  university: ['🎓', 'الجامعات', '/admissions'],
  college: ['◫', 'الكليات', '/admissions'],
  employer: ['↗', 'شركات التوظيف', '/jobs'],
};

const partners = {
  teacher: [
    {
      name: 'Success Teacher Network',
      country: 'الأردن',
      city: 'عمّان',
      mode: 'هجين',
      field: 'AP • EST • IGCSE • A Level',
      verified: true,
    },
    {
      name: 'Global Online Tutors',
      country: 'عالمي',
      city: 'أونلاين',
      mode: 'أونلاين',
      field: 'IB • Cambridge • American',
      verified: false,
    },
  ],
  center: [
    {
      name: 'Success 4 Sure Academy',
      country: 'الأردن',
      city: 'عمّان',
      mode: 'هجين',
      field: 'دورات • حصص • امتحانات دولية',
      verified: true,
    },
    {
      name: 'International Learning Center',
      country: 'عالمي',
      city: 'أونلاين',
      mode: 'أونلاين',
      field: 'لغات • STEM • مهارات',
      verified: false,
    },
  ],
  school: [
    {
      id: 'abs-jo',
      name: 'Amman Baccalaureate School',
      country: 'الأردن',
      city: 'عمّان',
      mode: 'حضوري',
      field: 'IB',
      verified: true,
    },
    {
      id: 'dubai-college',
      name: 'Dubai College',
      country: 'الإمارات',
      city: 'دبي',
      mode: 'حضوري',
      field: 'British Curriculum',
      verified: true,
    },
    {
      id: 'cac-egypt',
      name: 'Cairo American College',
      country: 'مصر',
      city: 'القاهرة',
      mode: 'حضوري',
      field: 'American Curriculum',
      verified: true,
    },
    {
      id: 'kings-jo',
      name: "King's Academy",
      country: 'الأردن',
      city: 'مادبا',
      mode: 'حضوري',
      field: 'American Curriculum',
      verified: false,
    },
    {
      id: 'aisz',
      name: 'American International School of Zagreb',
      country: 'كرواتيا',
      city: 'زغرب',
      mode: 'حضوري',
      field: 'IB • American',
      verified: true,
    },
    {
      id: 'acs-sofia',
      name: 'American College of Sofia',
      country: 'بلغاريا',
      city: 'صوفيا',
      mode: 'حضوري',
      field: 'American Curriculum',
      verified: false,
    },
    {
      id: 'istes',
      name: 'International School of Tallinn',
      country: 'إستونيا',
      city: 'تالين',
      mode: 'حضوري',
      field: 'IB',
      verified: true,
    },
    {
      id: 'aisv',
      name: 'American International School of Vilnius',
      country: 'ليتوانيا',
      city: 'فيلنيوس',
      mode: 'حضوري',
      field: 'IB • American',
      verified: true,
    },
    {
      id: 'isriga',
      name: 'International School of Riga',
      country: 'لاتفيا',
      city: 'ريغا',
      mode: 'حضوري',
      field: 'IB',
      verified: true,
    },
    {
      id: 'isl',
      name: 'International School of Luxembourg',
      country: 'لوكسمبورغ',
      city: 'لوكسمبورغ',
      mode: 'حضوري',
      field: 'IB',
      verified: true,
    },
  ],
  university: [
    {
      id: 'uj',
      name: 'الجامعة الأردنية',
      country: 'الأردن',
      city: 'عمّان',
      mode: 'حضوري',
      field: 'بكالوريوس • ماجستير • دكتوراه',
      verified: true,
    },
    {
      id: 'tum',
      name: 'Technical University of Munich',
      country: 'ألمانيا',
      city: 'ميونخ',
      mode: 'حضوري',
      field: 'هندسة • حوسبة',
      verified: true,
    },
    {
      id: 'unizg',
      name: 'University of Zagreb',
      country: 'كرواتيا',
      city: 'زغرب',
      mode: 'حضوري',
      field: 'طب • هندسة • علوم',
      verified: true,
    },
    {
      id: 'uniba',
      name: 'Comenius University Bratislava',
      country: 'سلوفاكيا',
      city: 'براتيسلافا',
      mode: 'حضوري',
      field: 'طب • علوم • قانون',
      verified: true,
    },
    {
      id: 'uni-sofia',
      name: 'Sofia University St. Kliment Ohridski',
      country: 'بلغاريا',
      city: 'صوفيا',
      mode: 'حضوري',
      field: 'علوم • آداب • قانون',
      verified: true,
    },
    {
      id: 'nkua',
      name: 'National and Kapodistrian University of Athens',
      country: 'اليونان',
      city: 'أثينا',
      mode: 'حضوري',
      field: 'طب • علوم • آداب',
      verified: true,
    },
    {
      id: 'uni-lj',
      name: 'University of Ljubljana',
      country: 'سلوفينيا',
      city: 'ليوبليانا',
      mode: 'حضوري',
      field: 'طب • هندسة • علوم',
      verified: true,
    },
    {
      id: 'ut',
      name: 'University of Tartu',
      country: 'إستونيا',
      city: 'تارتو',
      mode: 'حضوري',
      field: 'علوم • طب • قانون',
      verified: true,
    },
    {
      id: 'vu',
      name: 'Vilnius University',
      country: 'ليتوانيا',
      city: 'فيلنيوس',
      mode: 'حضوري',
      field: 'طب • علوم • آداب',
      verified: true,
    },
    {
      id: 'lu-lv',
      name: 'University of Latvia',
      country: 'لاتفيا',
      city: 'ريغا',
      mode: 'حضوري',
      field: 'علوم • طب • قانون',
      verified: true,
    },
    {
      id: 'umalta',
      name: 'University of Malta',
      country: 'مالطا',
      city: 'مسيدا',
      mode: 'حضوري',
      field: 'طب • علوم • أعمال',
      verified: true,
    },
    {
      id: 'uni-lu',
      name: 'University of Luxembourg',
      country: 'لوكسمبورغ',
      city: 'إيش-سور-ألزيت',
      mode: 'حضوري',
      field: 'علوم • قانون • أعمال',
      verified: true,
    },
  ],
  college: [
    {
      id: 'luminus',
      name: 'Luminus Technical University College',
      country: 'الأردن',
      city: 'عمّان',
      mode: 'هجين',
      field: 'دبلوم • بكالوريوس تطبيقي',
      verified: true,
    },
    {
      id: 'seneca',
      name: 'Seneca Polytechnic',
      country: 'كندا',
      city: 'تورونتو',
      mode: 'هجين',
      field: 'تقنية • أعمال',
      verified: true,
    },
    {
      id: 'bcc',
      name: 'Borough of Manhattan Community College',
      country: 'الولايات المتحدة',
      city: 'New York',
      mode: 'هجين',
      field: 'Associate',
      verified: true,
    },
    {
      id: 'vern',
      name: 'VERN University of Applied Sciences',
      country: 'كرواتيا',
      city: 'زغرب',
      mode: 'حضوري',
      field: 'أعمال • سياحة',
      verified: false,
    },
    {
      id: 'fontys',
      name: 'Fontys University of Applied Sciences',
      country: 'هولندا',
      city: 'آيندهوفن',
      mode: 'حضوري',
      field: 'هندسة • حوسبة',
      verified: false,
    },
    {
      id: 'kolegija',
      name: 'Vilnius College of Technologies and Design',
      country: 'ليتوانيا',
      city: 'فيلنيوس',
      mode: 'حضوري',
      field: 'تصميم • هندسة',
      verified: false,
    },
    {
      id: 'mcast',
      name: 'Malta College of Arts, Science and Technology',
      country: 'مالطا',
      city: 'باولا',
      mode: 'حضوري',
      field: 'هندسة • حوسبة',
      verified: false,
    },
    {
      id: 'its-mt',
      name: 'Institute of Tourism Studies',
      country: 'مالطا',
      city: 'سانتا فينيرا',
      mode: 'حضوري',
      field: 'ضيافة • سياحة',
      verified: true,
    },
  ],
  employer: [
    {
      name: 'شركة تعليم وتقنية — نموذج',
      country: 'الأردن',
      city: 'عمّان',
      mode: 'هجين',
      field: 'تعليم • محتوى • هندسة',
      verified: false,
    },
  ],
};

const initial = { country: 'الكل', city: 'الكل', mode: 'الكل', verification: 'الكل', query: '' };

function contactHref(type, row) {
  if (!row?.id) return null;
  if (type === 'school' || type === 'university' || type === 'college') {
    return `/university-contact?id=${encodeURIComponent(row.id)}&studyCountry=${encodeURIComponent(row.country || '')}&applicantType=international`;
  }
  return null;
}

export default function PartnerSearch() {
  const [type, setType] = useState('teacher');
  const [filters, setFilters] = useState(initial);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('portal');
    if (types[p]) setType(p);
  }, []);
  const source = partners[type];
  const countries = ['الكل', ...new Set(source.map((x) => x.country))];
  const cities = [
    'الكل',
    ...new Set(
      source
        .filter((x) => filters.country === 'الكل' || x.country === filters.country)
        .map((x) => x.city),
    ),
  ];
  const modes = ['الكل', ...new Set(source.map((x) => x.mode))];
  const rows = useMemo(
    () =>
      source.filter(
        (x) =>
          (filters.country === 'الكل' || x.country === filters.country) &&
          (filters.city === 'الكل' || x.city === filters.city) &&
          (filters.mode === 'الكل' || x.mode === filters.mode) &&
          (filters.verification === 'الكل' ||
            (filters.verification === 'موثق' ? x.verified : !x.verified)) &&
          (!filters.query ||
            `${x.name} ${x.field} ${x.country} ${x.city}`
              .toLowerCase()
              .includes(filters.query.toLowerCase())),
      ),
    [source, filters],
  );
  const update = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value, ...(key === 'country' ? { city: 'الكل' } : {}) }));
  const reset = () => setFilters(initial);
  const [icon, label, advanced] = types[type];
  const serviceLabel =
    type === 'employer'
      ? 'طريقة العمل'
      : type === 'school' || type === 'university' || type === 'college'
        ? 'نمط الدراسة'
        : 'طريقة الخدمة';

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="access" />
      <main className="os-page-content partner-search-page">
        <header className="partner-search-hero">
          <div>
            <small>SEARCH THE SUCCESS NETWORK</small>
            <h1>ابحث عن {label}</h1>
            <p>
              فلترة حسب الموقع ونمط الدراسة وحالة التحقق. للجامعة والكلية والمدرسة: تواصل بـ $5 ثم
              إشعارات إن كانت مشتركة أو إيميل رسمي إن لم تكن.
            </p>
          </div>
          <a href={`/join-us?role=${type}`}>＋ انضم إلى {label}</a>
        </header>
        <nav className="partner-type-tabs">
          {Object.entries(types).map(([id, [i, l]]) => (
            <button
              className={id === type ? 'active' : ''}
              onClick={() => {
                setType(id);
                setFilters(initial);
              }}
              key={id}
            >
              <span>{i}</span>
              {l}
            </button>
          ))}
        </nav>
        <section className="directory-filter partner-search-filter">
          <header>
            <div>
              <small>FILTER RESULTS</small>
              <h2>خصص نتائج البحث</h2>
            </div>
            <button type="button" onClick={reset}>
              مسح الفلاتر
            </button>
          </header>
          <div>
            <label>
              الدولة
              <select value={filters.country} onChange={(e) => update('country', e.target.value)}>
                {countries.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              المدينة
              <select value={filters.city} onChange={(e) => update('city', e.target.value)}>
                {cities.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              {serviceLabel}
              <select value={filters.mode} onChange={(e) => update('mode', e.target.value)}>
                {modes.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              حالة التحقق
              <select
                value={filters.verification}
                onChange={(e) => update('verification', e.target.value)}
              >
                <option>الكل</option>
                <option>موثق</option>
                <option>قيد التحقق</option>
              </select>
            </label>
            <label className="filter-search">
              الاسم أو التخصص
              <input
                value={filters.query}
                onChange={(e) => update('query', e.target.value)}
                placeholder={`ابحث في ${label}`}
              />
            </label>
          </div>
          <footer>
            <b>{rows.length} نتائج</b>
            <span>التواصل بـ $5 متاح للجامعة والكلية والمدرسة</span>
          </footer>
        </section>
        <div className="partner-result-note">
          <span>◎</span>
          <p>
            مشتركة في المنصة → إشعارات بعد الدفع. غير مشتركة → إيميل رسمي يعبّئه الطالب ويرسله.
            الشروط تختلف باختلاف جنسية الطالب.
          </p>
        </div>
        {rows.length ? (
          <section className="partner-result-grid">
            {rows.map((x) => {
              const contact = contactHref(type, x);
              return (
                <article key={x.id || x.name}>
                  <header>
                    <span>{icon}</span>
                    <div>
                      <small>
                        {x.country} • {x.city} • {x.mode}
                      </small>
                      <h2>{x.name}</h2>
                    </div>
                    <b className={x.verified ? 'verified' : 'pending'}>
                      {x.verified ? 'مشتركة / موثق' : 'غير مشتركة'}
                    </b>
                  </header>
                  <p>{x.field}</p>
                  <div>
                    <span>✓ ملف تعريفي</span>
                    <span>✓ تواصل $5</span>
                    <span>✓ {x.verified ? 'إشعارات' : 'إيميل رسمي'}</span>
                  </div>
                  <footer>
                    <a href={advanced}>عرض الدليل المتخصص</a>
                    {contact ? (
                      <a href={contact}>تواصل · $5</a>
                    ) : (
                      <a href={`/join-us?role=${type}`}>انضم كشريك</a>
                    )}
                  </footer>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="directory-empty">
            <span>⌕</span>
            <h2>لا توجد نتائج مطابقة</h2>
            <p>جرّب توسيع الدولة أو طريقة الخدمة أو مسح بعض الفلاتر.</p>
            <button onClick={reset}>مسح الفلاتر</button>
          </section>
        )}
      </main>
    </div>
  );
}
