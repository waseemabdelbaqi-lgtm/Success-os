'use client';

import { useMemo, useState } from 'react';
import { InnerNav } from '../components';
import {
  CONTROL_HUB_SECTIONS,
  CONTROL_HUBS,
  filterHubs,
} from '../data/control-hubs-catalog';
import { ADMISSION_PORTALS } from '../data/admission-portals';
import { globalInstitutions } from '../data/university-registry';

const ALL_TAGS = ['الكل', ...new Set(CONTROL_HUBS.flatMap((h) => h.tags || []))];

function ActionButton({ action }) {
  const styles = {
    primary: { background: '#7f1d1d', color: '#fff' },
    admin: { background: '#1f2937', color: '#fff' },
    join: { background: '#9a3412', color: '#fff' },
    work: { background: 'rgba(127,29,29,0.12)', color: '#4b0a11' },
    data: { background: 'rgba(30,58,138,0.12)', color: '#1e3a8a' },
  };
  const style = styles[action.kind] || styles.work;
  return (
    <a
      href={action.href}
      style={{
        ...style,
        display: 'inline-block',
        padding: '0.4rem 0.75rem',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        textDecoration: 'none',
        border: '1px solid transparent',
      }}
    >
      {action.label}
    </a>
  );
}

function HubCard({ hub }) {
  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1.1rem 1.15rem',
        borderRadius: 14,
        background: 'linear-gradient(165deg, rgba(127,29,29,0.07), rgba(255,255,255,0.65))',
        border: '1px solid rgba(127,29,29,0.16)',
        minHeight: 210,
      }}
    >
      <header>
        <small style={{ opacity: 0.65, letterSpacing: '0.04em' }}>{hub.subtitle}</small>
        <h3 style={{ margin: '0.25rem 0', fontSize: '1.1rem' }}>{hub.title}</h3>
        <p style={{ margin: 0, opacity: 0.8, lineHeight: 1.55, fontSize: 14 }}>{hub.note}</p>
      </header>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(hub.tags || []).map((t) => (
          <span
            key={t}
            style={{
              fontSize: 11,
              padding: '0.15rem 0.55rem',
              borderRadius: 999,
              background: 'rgba(127,29,29,0.1)',
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
        {(hub.actions || []).map((a) => (
          <ActionButton key={`${hub.id}-${a.href}-${a.label}`} action={a} />
        ))}
      </div>
    </article>
  );
}

export default function ControlHubsPage() {
  const [section, setSection] = useState('all');
  const [tag, setTag] = useState('الكل');
  const [query, setQuery] = useState('');

  const rows = useMemo(
    () =>
      filterHubs({
        section,
        query,
        tag: tag === 'الكل' ? 'all' : tag,
      }),
    [section, query, tag],
  );

  const counts = useMemo(
    () => ({
      company: CONTROL_HUBS.filter((h) => h.section === 'company').length,
      partners: CONTROL_HUBS.filter((h) => h.section === 'partners').length,
      users: CONTROL_HUBS.filter((h) => h.section === 'users').length,
      portals: ADMISSION_PORTALS.length,
      institutions: globalInstitutions.length,
    }),
    [],
  );

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="access" />
      <main
        className="os-page-content"
        style={{ maxWidth: 1180, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}
      >
        <header style={{ marginBottom: '1.75rem' }}>
          <small style={{ letterSpacing: '0.08em', opacity: 0.7 }}>
            SUCCESS OS · CONTROL HUBS · COMPANY / PARTNERS / USERS
          </small>
          <h1 style={{ fontSize: 'clamp(1.85rem, 4vw, 2.7rem)', margin: '0.4rem 0' }}>
            لوحات التحكم حسب التصنيف المتفق عليه
          </h1>
          <p style={{ maxWidth: 720, lineHeight: 1.75, opacity: 0.85 }}>
            ثلاثة أقسام تشغيلية: <b>الشركة</b> تشغّل المنصة، <b>الشركاء</b> يقدّمون الخدمات،{' '}
            <b>المستخدمون</b> يستهلكون التعلم والقبول والوظائف. كل بطاقة تحمل أزرار تحكم مباشرة.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.75rem',
              marginTop: '1.25rem',
            }}
          >
            {[
              [counts.company, 'لوحات الشركة'],
              [counts.partners, 'لوحات الشركاء'],
              [counts.users, 'لوحات المستخدمين'],
              [counts.institutions, 'مؤسسات مفهرسة'],
              [counts.portals, 'بوابات خارجية'],
            ].map(([n, label]) => (
              <div
                key={label}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 12,
                  background: 'rgba(127,29,29,0.08)',
                  border: '1px solid rgba(127,29,29,0.14)',
                }}
              >
                <b style={{ fontSize: '1.35rem', display: 'block' }}>{n}</b>
                <small style={{ opacity: 0.75 }}>{label}</small>
              </div>
            ))}
          </div>
        </header>

        <section
          className="degree-filter"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.85rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: 14,
            border: '1px solid rgba(127,29,29,0.15)',
            background: 'rgba(255,255,255,0.55)',
          }}
        >
          <label>
            القسم
            <select value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="all">الكل</option>
              {CONTROL_HUB_SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titleAr} — {s.titleEn}
                </option>
              ))}
            </select>
          </label>
          <label>
            الوسم
            <select value={tag} onChange={(e) => setTag(e.target.value)}>
              {ALL_TAGS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            بحث
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مالك، جامعة، طالب، ERP…"
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'end', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => { setSection('all'); setTag('الكل'); setQuery(''); }}>
              مسح الفلاتر
            </button>
            <b style={{ fontSize: 13, opacity: 0.8 }}>{rows.length} لوحة مطابقة</b>
          </div>
        </section>

        <nav
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.65rem',
            marginBottom: '2rem',
          }}
          aria-label="أقسام لوحات التحكم"
        >
          <button
            type="button"
            className={section === 'all' ? 'active' : ''}
            onClick={() => setSection('all')}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: 12,
              border: section === 'all' ? '2px solid #7f1d1d' : '1px solid rgba(127,29,29,0.2)',
              background: section === 'all' ? 'rgba(127,29,29,0.12)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            الكل ({CONTROL_HUBS.length})
          </button>
          {CONTROL_HUB_SECTIONS.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setSection(s.id)}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: 12,
                border: section === s.id ? '2px solid #7f1d1d' : '1px solid rgba(127,29,29,0.2)',
                background: section === s.id ? 'rgba(127,29,29,0.12)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'right',
              }}
            >
              <b>
                {s.icon} {s.titleAr}
              </b>
              <small style={{ display: 'block', opacity: 0.7 }}>{s.titleEn}</small>
            </button>
          ))}
        </nav>

        {(section === 'all' ? CONTROL_HUB_SECTIONS : CONTROL_HUB_SECTIONS.filter((s) => s.id === section)).map(
          (s) => {
            const items = rows.filter((h) => h.section === s.id);
            if (!items.length) return null;
            return (
              <section key={s.id} style={{ marginBottom: '2.75rem' }}>
                <header style={{ marginBottom: '1rem' }}>
                  <small style={{ letterSpacing: '0.06em', opacity: 0.65 }}>
                    {s.titleEn.toUpperCase()}
                  </small>
                  <h2 style={{ margin: '0.25rem 0', fontSize: '1.35rem' }}>
                    {s.icon} {s.titleAr}
                  </h2>
                  <p style={{ margin: 0, opacity: 0.8, maxWidth: 720, lineHeight: 1.65 }}>{s.blurbAr}</p>
                </header>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '0.9rem',
                  }}
                >
                  {items.map((hub) => (
                    <HubCard key={hub.id} hub={hub} />
                  ))}
                </div>
              </section>
            );
          },
        )}

        {!rows.length && (
          <section style={{ textAlign: 'center', padding: '3rem 1rem', opacity: 0.8 }}>
            <h2>لا توجد لوحات مطابقة</h2>
            <p>وسّع البحث أو امسح الفلاتر.</p>
            <button type="button" onClick={() => { setSection('all'); setTag('الكل'); setQuery(''); }}>
              عرض الكل
            </button>
          </section>
        )}

        <section
          style={{
            marginTop: '1rem',
            padding: '1.25rem',
            borderRadius: 14,
            border: '1px dashed rgba(127,29,29,0.3)',
            background: 'rgba(127,29,29,0.04)',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>اختصارات تشغيل سريعة</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              ['/control-center?role=owner', 'Control Center'],
              ['/admissions', 'القبول'],
              ['/degree-finder', 'الدرجات'],
              ['/global-sources', 'البوابات'],
              ['/start-journey?portal=university', 'رحلة الجامعة'],
              ['/join-us', 'انضم كشريك'],
              ['/dashboard/admin', 'ERP'],
              ['/api/v1/portals', 'API'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 999,
                  background: '#7f1d1d',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
