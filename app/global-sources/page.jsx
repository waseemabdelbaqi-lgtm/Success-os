'use client';
import { useMemo, useState } from 'react';
import { InnerNav } from '../components';
import { ADMISSION_PORTALS } from '../data/admission-portals';

const registries = [
  {
    region: 'عالمي',
    country: 'جميع الدول',
    name: 'UNESCO ISCED',
    covers: 'خرائط الأنظمة والمراحل التعليمية لنحو 201 دولة',
    audience: 'محلي ودولي',
    url: 'https://www.uis.unesco.org/en/methods-and-tools/isced/mapping-and-diagrams',
    status: 'مرجع رسمي',
  },
  {
    region: 'عالمي',
    country: '196 دولة وإقليم',
    name: 'IAU WHED',
    covers: 'مؤسسات التعليم العالي المعترف بها والأنظمة والمؤهلات',
    audience: 'محلي ودولي',
    url: 'https://www.whed.net/',
    status: 'مرجع خارجي — يمنع النسخ الشامل',
  },
  {
    region: 'أمريكا الشمالية',
    country: 'الولايات المتحدة',
    name: 'College Scorecard',
    covers: 'الكليات، البرامج، التكلفة، القبول، التخرج والنتائج',
    audience: 'محلي ودولي',
    url: 'https://collegescorecard.ed.gov/',
    status: 'وزارة التعليم الأمريكية',
  },
  {
    region: 'أمريكا الشمالية',
    country: 'الولايات المتحدة',
    name: 'DAPIP',
    covers: 'المؤسسات والبرامج المعتمدة ومعلومات الاعتماد',
    audience: 'محلي ودولي',
    url: 'https://ope.ed.gov/dapip/',
    status: 'وزارة التعليم الأمريكية',
  },
  {
    region: 'أمريكا الشمالية',
    country: 'كندا',
    name: 'CICIC Directory',
    covers: 'المؤسسات المعترف أو المرخص أو المسجل بها',
    audience: 'محلي ودولي',
    url: 'https://www.cicic.ca/868/search_the_directory_of_educational_institutions_in_canada.canada',
    status: 'مرجع وطني',
  },
  {
    region: 'أوروبا',
    country: 'المملكة المتحدة',
    name: 'Discover Uni',
    covers: 'الجامعات والكليات ودورات البكالوريوس وبيانات المقارنة',
    audience: 'محلي ودولي',
    url: 'https://discoveruni.gov.uk/',
    status: 'مصدر رسمي',
  },
  {
    region: 'أوقيانوسيا',
    country: 'أستراليا',
    name: 'CRICOS',
    covers: 'المؤسسات والدورات المسموح بها للطلاب على تأشيرة دراسة',
    audience: 'دولي',
    url: 'https://cricos.education.gov.au/',
    status: 'الحكومة الأسترالية',
  },
  {
    region: 'الشرق الأوسط',
    country: 'الأردن',
    name: 'وحدة شؤون الطلبة الوافدين',
    covers: 'متطلبات وإجراءات قبول الطلبة الدوليين',
    audience: 'دولي',
    url: 'https://studyinjordan.jo/',
    status: 'مصدر حكومي — يلزم التحقق الدوري',
  },
  {
    region: 'الشرق الأوسط',
    country: 'الإمارات',
    name: 'Commission for Academic Accreditation',
    covers: 'المؤسسات والبرامج المرخصة والمعتمدة',
    audience: 'محلي ودولي',
    url: 'https://www.caa.ae/',
    status: 'مرجع اعتماد وطني',
  },
];

export default function GlobalSources() {
  const [region, setRegion] = useState('الكل');
  const rows = useMemo(
    () => registries.filter((x) => region === 'الكل' || x.region === region),
    [region],
  );

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="sources" />
      <main className="os-page-content sources-page">
        <header className="sources-hero">
          <span>VERIFIED DATA FEDERATION</span>
          <h1>المصادر الرسمية للأنظمة والجامعات</h1>
          <p>
            بدل نسخ بيانات جامعات العالم وتجميدها، تجمع المنصة نتائج من السجل المناسب للدولة، ثم تتحقق من صفحة المؤسسة
            ومتطلبات البرنامج وتاريخ التحديث.
          </p>
        </header>

        <section className="admission-portals-band sources-portals">
          <header>
            <div>
              <small>ADMISSION PORTALS & APPLICATION SYSTEMS</small>
              <h2>بوابات وأنظمة القبول</h2>
              <p>
                Name • Website • Type • Scope • Details — {ADMISSION_PORTALS.length} مصدر إنتاجي (A–Z) عبر{' '}
                <a href="/api/v1/portals">/api/v1/portals</a>.
              </p>
            </div>
            <a href="/admissions">مستكشف القبول ←</a>
          </header>
          <div className="admission-portals-table-wrap">
            <table className="admission-portals-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Website</th>
                  <th>Type</th>
                  <th>Scope</th>
                  <th>Details</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ADMISSION_PORTALS.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <b>{p.name}</b>
                      <small>{p.typeAr}</small>
                    </td>
                    <td>
                      <a href={p.website} target="_blank" rel="noreferrer">
                        {p.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </td>
                    <td>{p.type}</td>
                    <td>{p.scope || p.region}</td>
                    <td className="portal-details-cell">{p.details}</td>
                    <td>
                      <a href={p.website} target="_blank" rel="noreferrer">
                        فتح ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admission-portals-grid">
            {ADMISSION_PORTALS.map((p) => (
              <article key={p.id}>
                <small>
                  {p.type} • {p.scope || p.region}
                </small>
                <h3>{p.name}</h3>
                <p>{p.detailsAr || p.details}</p>
                <a href={p.website} target="_blank" rel="noreferrer">
                  {p.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="sources-filter">
          <label>
            المنطقة
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              {['الكل', ...new Set(registries.map((x) => x.region))].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <span>{rows.length} مصادر موثقة في دليل الإطلاق</span>
          <a href="/admissions">فتح مستكشف القبول</a>
        </section>
        <section className="registry-grid">
          {rows.map((r) => (
            <article key={r.name}>
              <header>
                <span>✓</span>
                <div>
                  <small>
                    {r.region} • {r.country}
                  </small>
                  <h2>{r.name}</h2>
                </div>
              </header>
              <p>{r.covers}</p>
              <div>
                <b>{r.audience}</b>
                <i>{r.status}</i>
              </div>
              <a href={r.url} target="_blank" rel="noreferrer">
                فتح المصدر الرسمي ↗
              </a>
            </article>
          ))}
        </section>
        <section className="verification-pipeline">
          <header>
            <small>قواعد الإدخال</small>
            <h2>ما يجب توفره قبل عرض المؤسسة</h2>
          </header>
          <div>
            {[
              ['01', 'الاعتراف', 'وجود المؤسسة في سجل رسمي'],
              ['02', 'البرنامج', 'اسم الدرجة والتخصص والحرم'],
              ['03', 'المحلي', 'شهادة، معدل، اختبارات ومواعيد'],
              ['04', 'الدولي', 'معادلة، لغة، تأشيرة ووثائق'],
              ['05', 'التكلفة', 'رسوم وسكن ومنح مع سنة مرجعية'],
              ['06', 'التحديث', 'رابط المصدر وتاريخ آخر تحقق'],
            ].map(([n, t, d]) => (
              <article key={n}>
                <b>{n}</b>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
