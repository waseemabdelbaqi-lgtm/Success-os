'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

function StatCard({ label, value }) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '0.85rem',
        background: 'var(--ea-card, #fff)',
      }}
    >
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
        {value === null || value === undefined ? '—' : value}
      </div>
    </div>
  );
}

function MiniBars({ series }) {
  const max = Math.max(1, ...series.map((s) => Number(s.value) || 0));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
      {series.map((s) => (
        <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              height: `${Math.round(((Number(s.value) || 0) / max) * 100)}%`,
              minHeight: 4,
              background: '#0f766e',
              borderRadius: '6px 6px 0 0',
            }}
            title={`${s.label}: ${s.value}`}
          />
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function EnterpriseAdminHomePage() {
  const [home, setHome] = useState(null);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/enterprise-admin?view=home', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load dashboard');
    setHome(await res.json());
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  useEffect(() => {
    let es;
    try {
      es = new EventSource('/api/enterprise-admin?view=stream');
      es.onmessage = (ev) => {
        try {
          const patch = JSON.parse(ev.data);
          setLive(true);
          setHome((prev) =>
            prev
              ? {
                  ...prev,
                  generatedAt: patch.at,
                  users: { ...prev.users, ...patch.users },
                  finance: { ...prev.finance, ...patch.finance },
                  performance: { ...prev.performance, ...patch.performance },
                }
              : prev,
          );
        } catch {
          /* ignore */
        }
      };
      es.onerror = () => {
        setLive(false);
        es.close();
      };
    } catch {
      const t = setInterval(() => load().catch(() => {}), 5000);
      return () => clearInterval(t);
    }
    return () => es?.close();
  }, [load]);

  const userCards = useMemo(() => {
    const u = home?.users || {};
    return [
      ['Total Users', u.totalUsers],
      ['Active Users', u.activeUsers],
      ['Online Users', u.onlineUsers],
      ['New Registrations Today', u.newRegistrationsToday],
      ['Monthly Registrations', u.monthlyRegistrations],
      ['Student Growth', u.studentGrowth],
      ['Teacher Growth', u.teacherGrowth],
      ['Schools', u.schools],
      ['Universities', u.universities],
      ['Educational Centers', u.educationalCenters],
      ['Employers', u.employers],
      ['Recruitment Companies', u.recruitmentCompanies],
      ['Job Seekers', u.jobSeekers],
      ['Parents', u.parents],
      ['Partners', u.partners],
    ];
  }, [home]);

  const financeCards = useMemo(() => {
    const f = home?.finance || {};
    return [
      ['Monthly Sales', f.monthlySales],
      ['Annual Sales', f.annualSales],
      ['Revenue', f.revenue],
      ['Profit', f.profit],
      ['Outstanding Payments', f.outstandingPayments],
      ['Refunds', f.refunds],
      ['Subscription Revenue', f.subscriptionRevenue],
      ['Teacher Revenue', f.teacherRevenue],
      ['Partner Revenue', f.partnerRevenue],
    ];
  }, [home]);

  const perfCards = useMemo(() => {
    const p = home?.performance || {};
    return [
      ['Lessons Completed', p.lessonsCompleted],
      ['Recorded Videos', p.recordedVideos],
      ['AI Generated Lessons', p.aiGeneratedLessons],
      ['Books', p.books],
      ['Subjects', p.subjects],
      ['Courses', p.courses],
      ['Exams', p.exams],
      ['Question Bank', p.questionBank],
      ['Certificates Issued', p.certificatesIssued],
    ];
  }, [home]);

  const growthSeries = useMemo(() => {
    const u = home?.users || {};
    return [
      { label: 'Students', value: u.studentGrowth },
      { label: 'Teachers', value: u.teacherGrowth },
      { label: 'Schools', value: u.schools },
      { label: 'Unis', value: u.universities },
      { label: 'Centers', value: u.educationalCenters },
      { label: 'Jobs', value: u.jobSeekers },
    ];
  }, [home]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Home Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
            Live data from enterprise store + curriculum registries. No static KPIs.
            {home?.generatedAt ? ` · Updated ${home.generatedAt}` : ''}
            {live ? ' · Live' : ''}
          </p>
        </div>
        <button type="button" onClick={() => load()} style={{ padding: '0.45rem 0.8rem', borderRadius: 8 }}>
          Refresh
        </button>
      </div>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <div
        style={{
          border: '1px solid #99f6e4',
          background: '#f0fdfa',
          borderRadius: 14,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Global Marketplace · Booking & Commerce</div>
        <p style={{ margin: '0 0 10px', color: '#0f766e', fontSize: 13 }}>
          Searchable listings, availability, cart & checkout, orders, reviews, subscriptions,
          affiliates, and disputes — synced live with Finance, Commission, and ERP.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a
            href="/dashboard/admin/global-marketplace"
            style={{
              background: '#0f766e',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 999,
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Open Marketplace
          </a>
          <a
            href="/dashboard/admin/market-bookings"
            style={{
              background: '#fff',
              color: '#0f766e',
              border: '1px solid #0f766e',
              padding: '8px 12px',
              borderRadius: 999,
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Bookings
          </a>
          <a
            href="/dashboard/admin/market-orders"
            style={{
              background: '#fff',
              color: '#0f766e',
              border: '1px solid #0f766e',
              padding: '8px 12px',
              borderRadius: 999,
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Orders
          </a>
        </div>
      </div>

      <h2 style={{ fontSize: 16 }}>Users & organizations</h2>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', marginBottom: 16 }}>
        {userCards.map(([label, value]) => (
          <StatCard key={label} label={label} value={value} />
        ))}
      </div>

      <h2 style={{ fontSize: 16 }}>Financial</h2>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', marginBottom: 16 }}>
        {financeCards.map(([label, value]) => (
          <StatCard key={label} label={label} value={value} />
        ))}
      </div>

      <h2 style={{ fontSize: 16 }}>Performance</h2>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', marginBottom: 16 }}>
        {perfCards.map(([label, value]) => (
          <StatCard key={label} label={label} value={value} />
        ))}
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.2fr 1fr' }}>
        <section style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Growth snapshot</h3>
          <MiniBars series={growthSeries} />
        </section>
        <section style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Recent activity</h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            {(home?.recentActivity || []).length === 0 ? (
              <li style={{ color: '#6b7280' }}>No activity yet</li>
            ) : (
              (home?.recentActivity || []).slice(0, 8).map((a) => (
                <li key={a.id}>
                  {a.moduleId} · {a.action} · {a.at}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
