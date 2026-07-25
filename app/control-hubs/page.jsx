'use client';

import { useMemo, useState } from 'react';
import { InnerNav } from '../components';
import {
  COMPANY_DEPTS,
  CONTROL_HUB_SECTIONS,
  CONTROL_HUBS,
  filterHubs,
} from '../data/control-hubs-catalog';

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
        gap: '0.7rem',
        padding: '1.1rem 1.15rem',
        borderRadius: 14,
        background: 'linear-gradient(165deg, rgba(127,29,29,0.07), rgba(255,255,255,0.65))',
        border: '1px solid rgba(127,29,29,0.16)',
        minHeight: 200,
      }}
    >
      <header>
        {hub.dept ? (
          <small style={{ opacity: 0.65 }}>{hub.dept} · {hub.subtitle}</small>
        ) : (
          <small style={{ opacity: 0.65 }}>{hub.subtitle}</small>
        )}
        <h3 style={{ margin: '0.25rem 0', fontSize: '1.1rem' }}>{hub.title}</h3>
        <p style={{ margin: 0, opacity: 0.8, lineHeight: 1.55, fontSize: 14 }}>{hub.note}</p>
      </header>
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
  const [dept, setDept] = useState('الكل');
  const [query, setQuery] = useState('');

  const rows = useMemo(
    () => filterHubs({ section, dept, query }),
    [section, dept, query],
  );

  const counts = useMemo(
    () => ({
      company: CONTROL_HUBS.filter((h) => h.section === 'company').length,
      partners: CONTROL_HUBS.filter((h) => h.section === 'partners').length,
      users: CONTROL_HUBS.filter((h) => h.section === 'users').length,
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
        <header style={{ marginBottom: '1.5rem' }}>
          <small style={{ letterSpacing: '0.08em', opacity: 0.7 }}>
            SUCCESS OS · شركة / شركاء / مستخدمون
          </small>
          <h1 style={{ fontSize: 'clamp(1.85rem, 4vw, 2.6rem)', margin: '0.35rem 0' }}>
            لوحات التحكم
          </h1>
          <p style={{ maxWidth: 700, lineHeight: 1.7, opacity: 0.85 }}>
            <b>الشركة</b> تشغّل المنصة (بما فيها الموارد البشرية والقانونية والمالية).{' '}
            <b>الشركاء</b> يقدّمون الخدمة. <b>المستخدمون</b> = الطلاب والباحثون عن عمل فقط.
          </p>
        </header>

        {/* Simple 3-tab filter */}
        <nav
          aria-label="تصنيف اللوحات"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '0.65rem',
            marginBottom: '1rem',
          }}
        >
          {CONTROL_HUB_SECTIONS.map((s) => {
            const active = section === s.id;
            const n = counts[s.id];
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => {
                  setSection(s.id);
                  setDept('الكل');
                }}
                style={{
                  padding: '1rem',
                  borderRadius: 14,
                  border: active ? '2px solid #7f1d1d' : '1px solid rgba(127,29,29,0.18)',
                  background: active ? 'rgba(127,29,29,0.12)' : 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                  textAlign: 'right',
                }}
              >
                <b style={{ display: 'block', fontSize: '1.05rem' }}>
                  {s.icon} {s.titleAr}
                </b>
                <small style={{ opacity: 0.7 }}>
                  {s.titleEn} · {n}
                </small>
              </button>
            );
          })}
        </nav>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => {
              setSection('all');
              setDept('الكل');
              setQuery('');
            }}
            style={{
              padding: '0.55rem 0.9rem',
              borderRadius: 999,
              border: section === 'all' ? '2px solid #7f1d1d' : '1px solid rgba(127,29,29,0.2)',
              background: section === 'all' ? 'rgba(127,29,29,0.1)' : 'transparent',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            عرض الكل ({CONTROL_HUBS.length})
          </button>

          {section === 'company' && (
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              aria-label="دائرة الشركة"
              style={{ padding: '0.55rem 0.85rem', borderRadius: 999, border: '1px solid rgba(127,29,29,0.25)' }}
            >
              {COMPANY_DEPTS.map((d) => (
                <option key={d} value={d}>
                  {d === 'الكل' ? 'كل دوائر الشركة' : d}
                </option>
              ))}
            </select>
          )}

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بسرعة…"
            style={{
              flex: '1 1 180px',
              minWidth: 160,
              padding: '0.55rem 0.9rem',
              borderRadius: 999,
              border: '1px solid rgba(127,29,29,0.25)',
            }}
          />
        </div>

        {(section === 'all'
          ? CONTROL_HUB_SECTIONS
          : CONTROL_HUB_SECTIONS.filter((s) => s.id === section)
        ).map((s) => {
          const items = rows.filter((h) => h.section === s.id);
          if (!items.length) return null;
          return (
            <section key={s.id} style={{ marginBottom: '2.5rem' }}>
              <header style={{ marginBottom: '0.9rem' }}>
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem' }}>
                  {s.icon} {s.titleAr}
                </h2>
                <p style={{ margin: 0, opacity: 0.8, maxWidth: 720, lineHeight: 1.6 }}>{s.blurbAr}</p>
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
        })}

        {!rows.length && (
          <section style={{ textAlign: 'center', padding: '2.5rem 1rem', opacity: 0.8 }}>
            <h2>لا نتائج</h2>
            <button
              type="button"
              onClick={() => {
                setSection('all');
                setDept('الكل');
                setQuery('');
              }}
            >
              إعادة الضبط
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
