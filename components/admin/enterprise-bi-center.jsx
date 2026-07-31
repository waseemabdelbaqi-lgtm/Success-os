'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const TABS = [
  { id: 'executive', label: 'Executive', labelAr: 'تنفيذي' },
  { id: 'students', label: 'Students', labelAr: 'طلاب' },
  { id: 'teachers', label: 'Teachers', labelAr: 'معلمون' },
  { id: 'partners', label: 'Partners', labelAr: 'شركاء' },
  { id: 'finance', label: 'Financial', labelAr: 'مالي' },
  { id: 'hr', label: 'HR', labelAr: 'موارد بشرية' },
  { id: 'marketing', label: 'Marketing', labelAr: 'تسويق' },
  { id: 'ai', label: 'AI', labelAr: 'ذكاء اصطناعي' },
  { id: 'geo', label: 'Geographic', labelAr: 'جغرافي' },
  { id: 'reports', label: 'Report Builder', labelAr: 'منشئ التقارير' },
  { id: 'exports', label: 'Export Center', labelAr: 'التصدير' },
  { id: 'forecasts', label: 'Forecasts', labelAr: 'التنبؤات' },
  { id: 'kpis', label: 'KPI Center', labelAr: 'مؤشرات الأداء' },
  { id: 'alerts', label: 'Alert Center', labelAr: 'التنبيهات' },
];

function Stat({ label, value, suffix = '' }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '0.85rem', background: 'var(--ea-card, #fff)' }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
        {value === null || value === undefined ? '—' : `${value}${suffix}`}
      </div>
    </div>
  );
}

function Panel({ title, children, actions }) {
  return (
    <section style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, background: 'var(--ea-card, #fff)', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>
      </div>
      {children}
    </section>
  );
}

function Bars({ labels, values, color = '#0f766e' }) {
  const max = Math.max(1, ...values.map((v) => Number(v) || 0));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, overflowX: 'auto' }}>
      {labels.map((label, i) => (
        <div key={`${label}-${i}`} style={{ minWidth: 48, flex: 1, textAlign: 'center' }}>
          <div
            title={`${label}: ${values[i]}`}
            style={{
              height: `${Math.round(((Number(values[i]) || 0) / max) * 100)}%`,
              minHeight: 4,
              background: color,
              borderRadius: '6px 6px 0 0',
            }}
          />
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4, whiteSpace: 'nowrap' }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function SimpleTable({ columns, rows, empty = 'No data' }) {
  if (!rows?.length) return <p style={{ color: '#6b7280', margin: 0 }}>{empty}</p>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: 'start', borderBottom: '1px solid #e5e7eb', padding: '8px 6px', color: '#6b7280' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || row.key || row.group || idx}>
              {columns.map((c) => (
                <td key={c.key} style={{ borderBottom: '1px solid #f3f4f6', padding: '8px 6px' }}>
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricGrid({ entries, isAr }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
      {entries.map(([label, value, suffix]) => (
        <Stat key={label} label={isAr ? label.ar : label.en} value={value} suffix={suffix || ''} />
      ))}
    </div>
  );
}

export function EnterpriseBiCenter() {
  const [lang, setLang] = useState('ar');
  const [tab, setTab] = useState('executive');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [reportSpec, setReportSpec] = useState({
    name: 'Custom Report',
    metrics: 'revenue,profit,activeStudents',
    groupBy: 'country',
    chartType: 'bar',
  });
  const [builtReport, setBuiltReport] = useState(null);

  const isAr = lang === 'ar';

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/bi?view=dashboard', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load BI platform');
    setData(await res.json());
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  useEffect(() => {
    let es;
    try {
      es = new EventSource('/api/bi?view=stream');
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          setLive(true);
          if (payload.dashboard) setData(payload.dashboard);
          else if (payload.executive) {
            setData((prev) => (prev ? { ...prev, executive: { ...prev.executive, ...payload.executive } } : prev));
          }
        } catch {
          /* ignore */
        }
      };
      es.onerror = () => setLive(false);
    } catch {
      /* EventSource unavailable */
    }
    return () => {
      try {
        es?.close();
      } catch {
        /* ignore */
      }
    };
  }, []);

  async function run(action, payload = {}) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/bi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, user: 'owner' }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'action failed');
      if (action === 'buildReport') setBuiltReport(json);
      await load();
      return json;
    } catch (e) {
      setError(e.message || 'action failed');
      return null;
    } finally {
      setBusy(false);
    }
  }

  const t = useMemo(
    () => ({
      title: isAr ? 'ذكاء الأعمال والتحليلات' : 'Business Intelligence & Analytics',
      subtitle: isAr
        ? 'كل مؤشر يُحسب ديناميكيًا من البيانات الحية — بدون تقارير ثابتة أو قيم ثابتة.'
        : 'Every KPI is computed dynamically from live data — no static reports or hardcoded values.',
      live: isAr ? 'تحديث مباشر' : 'Live updates',
      offline: isAr ? 'البث غير متصل' : 'Live off',
    }),
    [isAr],
  );

  const exec = data?.executive || {};
  const geo = data?.geographic?.points || [];

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>{t.title}</h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280', maxWidth: 760 }}>{t.subtitle}</p>
          <div style={{ marginTop: 8, fontSize: 12, color: live ? '#047857' : '#b45309' }}>
            {live ? t.live : t.offline}
            {data?.generatedAt ? ` · ${data.generatedAt}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ padding: '8px 10px', borderRadius: 10 }}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
          <button type="button" disabled={busy} onClick={() => load()}>
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
          <button type="button" disabled={busy} onClick={() => run('snapshot')}>
            {isAr ? 'لقطة لحظية' : 'Take snapshot'}
          </button>
          <button type="button" disabled={busy} onClick={() => run('evaluateAlerts')}>
            {isAr ? 'تقييم التنبيهات' : 'Evaluate alerts'}
          </button>
        </div>
      </div>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            style={{
              borderRadius: 999,
              border: tab === item.id ? '1px solid #0f766e' : '1px solid #e5e7eb',
              background: tab === item.id ? '#ecfdf5' : '#fff',
              color: tab === item.id ? '#065f46' : '#111827',
              padding: '8px 12px',
              fontWeight: tab === item.id ? 700 : 500,
            }}
          >
            {isAr ? item.labelAr : item.label}
          </button>
        ))}
      </div>

      {tab === 'executive' ? (
        <Panel title={isAr ? 'تحليلات تنفيذية' : 'Executive analytics'}>
          <MetricGrid
            isAr={isAr}
            entries={[
              [{ en: 'Revenue', ar: 'الإيراد' }, exec.revenue],
              [{ en: 'Profit', ar: 'الربح' }, exec.profit],
              [{ en: 'Expenses', ar: 'المصروفات' }, exec.expenses],
              [{ en: 'Growth', ar: 'النمو' }, exec.growth, '%'],
              [{ en: 'Subscriptions', ar: 'الاشتراكات' }, exec.subscriptions],
              [{ en: 'Retention', ar: 'الاحتفاظ' }, exec.retention, '%'],
              [{ en: 'Conversions', ar: 'التحويلات' }, exec.conversions],
              [{ en: 'CLV', ar: 'قيمة العميل' }, exec.clv],
              [{ en: 'ARPU', ar: 'متوسط الإيراد/مستخدم' }, exec.arpu],
              [{ en: 'MRR', ar: 'MRR' }, exec.mrr],
              [{ en: 'ARR', ar: 'ARR' }, exec.arr],
            ]}
          />
          <div style={{ marginTop: 16 }}>
            <Bars
              labels={(data?.forecasts?.series || []).map((s) => `M+${s.monthOffset}`)}
              values={(data?.forecasts?.series || []).map((s) => s.revenue)}
            />
            <p style={{ color: '#6b7280', fontSize: 12 }}>{isAr ? 'توقعات الإيراد (محرك التنبؤ)' : 'Revenue forecasts'}</p>
          </div>
        </Panel>
      ) : null}

      {tab === 'students' ? (
        <Panel title={isAr ? 'تحليلات الطلاب' : 'Student analytics'}>
          <MetricGrid
            isAr={isAr}
            entries={[
              [{ en: 'Registrations', ar: 'التسجيلات' }, data?.students?.registrations],
              [{ en: 'Active', ar: 'نشطون' }, data?.students?.active],
              [{ en: 'Inactive', ar: 'غير نشطين' }, data?.students?.inactive],
              [{ en: 'Completion', ar: 'الإتمام' }, data?.students?.completionRate, '%'],
              [{ en: 'Attendance', ar: 'الحضور' }, data?.students?.attendance, '%'],
              [{ en: 'Learning hours', ar: 'ساعات التعلم' }, data?.students?.learningHours],
              [{ en: 'Performance', ar: 'الأداء' }, data?.students?.performance],
              [{ en: 'Subjects', ar: 'المواد' }, data?.students?.subjects],
              [{ en: 'Exam results', ar: 'نتائج الامتحانات' }, data?.students?.examResults, '%'],
              [{ en: 'Certificates', ar: 'الشهادات' }, data?.students?.certificates],
              [{ en: 'Dropout risk', ar: 'خطر التسرب' }, data?.students?.dropoutRisk, '%'],
            ]}
          />
          <div style={{ marginTop: 16 }}>
            <Bars
              labels={(data?.students?.trends || []).map((t) => String(t.at || '').slice(5, 10))}
              values={(data?.students?.trends || []).map((t) => t.active)}
              color="#0369a1"
            />
          </div>
        </Panel>
      ) : null}

      {tab === 'teachers' ? (
        <Panel title={isAr ? 'تحليلات المعلمين' : 'Teacher analytics'}>
          <MetricGrid
            isAr={isAr}
            entries={[
              [{ en: 'Bookings', ar: 'الحجوزات' }, data?.teachers?.bookings],
              [{ en: 'Lessons', ar: 'الدروس' }, data?.teachers?.lessons],
              [{ en: 'Income', ar: 'الدخل' }, data?.teachers?.income],
              [{ en: 'Ratings', ar: 'التقييم' }, data?.teachers?.ratings],
              [{ en: 'Satisfaction', ar: 'رضا الطلاب' }, data?.teachers?.satisfaction],
              [{ en: 'Completion', ar: 'الإتمام' }, data?.teachers?.completionRate, '%'],
              [{ en: 'Availability', ar: 'التوفر' }, data?.teachers?.availability, '%'],
              [{ en: 'Growth', ar: 'النمو' }, data?.teachers?.growth],
              [{ en: 'Retention', ar: 'الاحتفاظ' }, data?.teachers?.retention, '%'],
            ]}
          />
          <h4 style={{ margin: '16px 0 8px' }}>{isAr ? 'أفضل المعلمون أداءً' : 'Top performing teachers'}</h4>
          <SimpleTable
            columns={[
              { key: 'name', label: isAr ? 'المعلم' : 'Teacher' },
              { key: 'rating', label: isAr ? 'التقييم' : 'Rating' },
              { key: 'income', label: isAr ? 'الدخل' : 'Income' },
              { key: 'lessons', label: isAr ? 'الدروس' : 'Lessons' },
              { key: 'satisfaction', label: isAr ? 'الرضا' : 'Satisfaction' },
            ]}
            rows={data?.teachers?.top || []}
          />
        </Panel>
      ) : null}

      {tab === 'partners' ? (
        <Panel title={isAr ? 'تحليلات الشركاء' : 'Partner analytics'}>
          <MetricGrid
            isAr={isAr}
            entries={[
              [{ en: 'Schools', ar: 'مدارس' }, data?.partners?.schools],
              [{ en: 'Universities', ar: 'جامعات' }, data?.partners?.universities],
              [{ en: 'Centers', ar: 'مراكز' }, data?.partners?.educationalCenters],
              [{ en: 'Recruitment', ar: 'توظيف' }, data?.partners?.recruitmentCompanies],
              [{ en: 'Employers', ar: 'جهات عمل' }, data?.partners?.employers],
              [{ en: 'Revenue', ar: 'الإيراد' }, data?.partners?.revenue],
              [{ en: 'Students', ar: 'طلاب' }, data?.partners?.students],
              [{ en: 'Applications', ar: 'طلبات' }, data?.partners?.applications],
              [{ en: 'Admissions', ar: 'قبول' }, data?.partners?.admissions],
              [{ en: 'Commission', ar: 'عمولة' }, data?.partners?.commission],
              [{ en: 'Growth', ar: 'نمو' }, data?.partners?.growth, '%'],
            ]}
          />
        </Panel>
      ) : null}

      {tab === 'finance' ? (
        <Panel title={isAr ? 'تحليلات مالية' : 'Financial analytics'}>
          <MetricGrid
            isAr={isAr}
            entries={[
              [{ en: 'Profit', ar: 'الربح' }, data?.financial?.profit],
              [{ en: 'Cash flow', ar: 'التدفق النقدي' }, data?.financial?.cashFlow],
              [{ en: 'Outstanding', ar: 'مستحقات' }, data?.financial?.outstanding],
              [{ en: 'Refunds', ar: 'استرداد' }, data?.financial?.refunds],
              [{ en: 'Expenses', ar: 'مصروفات' }, data?.financial?.expenses],
            ]}
          />
          {Object.entries(data?.financial?.revenueBy || {}).map(([dim, rows]) => (
            <div key={dim} style={{ marginTop: 16 }}>
              <h4 style={{ margin: '0 0 8px' }}>{isAr ? `الإيراد حسب ${dim}` : `Revenue by ${dim}`}</h4>
              <Bars labels={(rows || []).slice(0, 8).map((r) => r.key)} values={(rows || []).slice(0, 8).map((r) => r.value)} />
            </div>
          ))}
        </Panel>
      ) : null}

      {tab === 'hr' ? (
        <Panel title={isAr ? 'تحليلات الموارد البشرية' : 'HR analytics'}>
          <MetricGrid
            isAr={isAr}
            entries={[
              [{ en: 'Attendance', ar: 'الحضور' }, data?.hr?.attendance, '%'],
              [{ en: 'Productivity', ar: 'الإنتاجية' }, data?.hr?.productivity, '%'],
              [{ en: 'Tasks', ar: 'المهام' }, data?.hr?.tasks],
              [{ en: 'Completion', ar: 'الإنجاز' }, data?.hr?.completion, '%'],
              [{ en: 'Payroll', ar: 'الرواتب' }, data?.hr?.payroll],
              [{ en: 'Performance', ar: 'الأداء' }, data?.hr?.performance],
              [{ en: 'Vacations', ar: 'الإجازات' }, data?.hr?.vacations],
              [{ en: 'Recruitment', ar: 'التوظيف' }, data?.hr?.recruitment],
            ]}
          />
        </Panel>
      ) : null}

      {tab === 'marketing' ? (
        <Panel title={isAr ? 'تحليلات التسويق' : 'Marketing analytics'}>
          <MetricGrid
            isAr={isAr}
            entries={[
              [{ en: 'Campaign performance', ar: 'أداء الحملات' }, data?.marketing?.campaignPerformance],
              [{ en: 'Lead sources', ar: 'مصادر العملاء' }, data?.marketing?.leadSources],
              [{ en: 'Conversion rate', ar: 'معدل التحويل' }, data?.marketing?.conversionRate, '%'],
              [{ en: 'CPA', ar: 'تكلفة الاكتساب' }, data?.marketing?.cpa],
              [{ en: 'Social', ar: 'التواصل' }, data?.marketing?.socialMedia],
              [{ en: 'Traffic sources', ar: 'مصادر الزيارات' }, data?.marketing?.trafficSources],
              [{ en: 'Email', ar: 'البريد' }, data?.marketing?.email],
              [{ en: 'WhatsApp', ar: 'واتساب' }, data?.marketing?.whatsapp],
            ]}
          />
        </Panel>
      ) : null}

      {tab === 'ai' ? (
        <Panel title={isAr ? 'تحليلات الذكاء الاصطناعي' : 'AI analytics'}>
          <MetricGrid
            isAr={isAr}
            entries={[
              [{ en: 'Lessons', ar: 'دروس' }, data?.ai?.generatedLessons],
              [{ en: 'Videos', ar: 'فيديوهات' }, data?.ai?.generatedVideos],
              [{ en: 'Books', ar: 'كتب' }, data?.ai?.generatedBooks],
              [{ en: 'Questions', ar: 'أسئلة' }, data?.ai?.generatedQuestions],
              [{ en: 'Cost', ar: 'التكلفة' }, data?.ai?.generationCost],
              [{ en: 'Processing ms', ar: 'زمن المعالجة' }, data?.ai?.processingTime],
              [{ en: 'Success rate', ar: 'نسبة النجاح' }, data?.ai?.successRate, '%'],
            ]}
          />
          <h4 style={{ margin: '16px 0 8px' }}>{isAr ? 'استخدام النماذج' : 'Model usage'}</h4>
          <SimpleTable
            columns={[
              { key: 'model', label: isAr ? 'النموذج' : 'Model' },
              { key: 'count', label: isAr ? 'العدد' : 'Count' },
            ]}
            rows={Object.entries(data?.ai?.modelUsage || {}).map(([model, count]) => ({ model, count }))}
          />
        </Panel>
      ) : null}

      {tab === 'geo' ? (
        <Panel title={isAr ? 'تحليلات جغرافية تفاعلية' : 'Interactive geographic analytics'}>
          <MetricGrid
            isAr={isAr}
            entries={[
              [{ en: 'Students', ar: 'طلاب' }, data?.geographic?.totals?.students],
              [{ en: 'Teachers', ar: 'معلمون' }, data?.geographic?.totals?.teachers],
              [{ en: 'Revenue', ar: 'إيراد' }, data?.geographic?.totals?.revenue],
              [{ en: 'Partners', ar: 'شركاء' }, data?.geographic?.totals?.partners],
              [{ en: 'Schools', ar: 'مدارس' }, data?.geographic?.totals?.schools],
              [{ en: 'Universities', ar: 'جامعات' }, data?.geographic?.totals?.universities],
              [{ en: 'Centers', ar: 'مراكز' }, data?.geographic?.totals?.centers],
              [{ en: 'Employers', ar: 'جهات عمل' }, data?.geographic?.totals?.employers],
            ]}
          />
          <div
            style={{
              position: 'relative',
              marginTop: 16,
              height: 320,
              borderRadius: 16,
              background: 'radial-gradient(circle at 30% 40%, #dbeafe, #ecfdf5 55%, #f8fafc)',
              border: '1px solid #d1d5db',
              overflow: 'hidden',
            }}
          >
            {geo.map((p) => {
              const x = ((Number(p.lng) + 180) / 360) * 100;
              const y = ((90 - Number(p.lat)) / 180) * 100;
              const size = 10 + Math.min(28, Math.sqrt(Number(p.students || 0) + Number(p.revenue || 0) / 100));
              return (
                <div
                  key={p.country}
                  title={`${p.country}: students=${p.students}, revenue=${p.revenue}`}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    width: size,
                    height: size,
                    marginLeft: -size / 2,
                    marginTop: -size / 2,
                    borderRadius: '50%',
                    background: 'rgba(15,118,110,0.75)',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                />
              );
            })}
          </div>
          <SimpleTable
            columns={[
              { key: 'country', label: isAr ? 'الدولة' : 'Country' },
              { key: 'students', label: isAr ? 'طلاب' : 'Students' },
              { key: 'teachers', label: isAr ? 'معلمون' : 'Teachers' },
              { key: 'revenue', label: isAr ? 'إيراد' : 'Revenue' },
              { key: 'partners', label: isAr ? 'شركاء' : 'Partners' },
              { key: 'schools', label: isAr ? 'مدارس' : 'Schools' },
              { key: 'universities', label: isAr ? 'جامعات' : 'Universities' },
              { key: 'centers', label: isAr ? 'مراكز' : 'Centers' },
              { key: 'employers', label: isAr ? 'جهات عمل' : 'Employers' },
            ]}
            rows={geo}
          />
        </Panel>
      ) : null}

      {tab === 'reports' ? (
        <Panel
          title={isAr ? 'منشئ التقارير بدون برمجة' : 'Custom report builder'}
          actions={
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run('buildReport', {
                    name: reportSpec.name,
                    metrics: reportSpec.metrics.split(',').map((s) => s.trim()).filter(Boolean),
                    groupBy: reportSpec.groupBy,
                    chartType: reportSpec.chartType,
                  })
                }
              >
                {isAr ? 'بناء التقرير' : 'Build report'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run('saveReport', {
                    name: reportSpec.name,
                    nameAr: reportSpec.name,
                    key: `custom_${Date.now()}`,
                    metrics: reportSpec.metrics.split(',').map((s) => s.trim()).filter(Boolean),
                    groupBy: reportSpec.groupBy,
                    chartType: reportSpec.chartType,
                    schedule: null,
                  })
                }
              >
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 12 }}>
            <label style={{ fontSize: 12 }}>
              {isAr ? 'الاسم' : 'Name'}
              <input value={reportSpec.name} onChange={(e) => setReportSpec((s) => ({ ...s, name: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }} />
            </label>
            <label style={{ fontSize: 12 }}>
              {isAr ? 'المؤشرات (مفصولة بفاصلة)' : 'Metrics (comma-separated)'}
              <input value={reportSpec.metrics} onChange={(e) => setReportSpec((s) => ({ ...s, metrics: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }} />
            </label>
            <label style={{ fontSize: 12 }}>
              {isAr ? 'التجميع' : 'Group by'}
              <select value={reportSpec.groupBy} onChange={(e) => setReportSpec((s) => ({ ...s, groupBy: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 8 }}>
                {(data?.catalog?.dimensions || ['country', 'teacher', 'month', 'department']).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12 }}>
              {isAr ? 'الرسم' : 'Chart'}
              <select value={reportSpec.chartType} onChange={(e) => setReportSpec((s) => ({ ...s, chartType: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 8 }}>
                {(data?.catalog?.chartTypes || ['bar', 'line', 'table', 'pivot']).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>
          {builtReport?.chart ? (
            <Bars labels={builtReport.chart.labels || []} values={builtReport.chart.series?.[0]?.data || []} />
          ) : null}
          <SimpleTable
            columns={
              builtReport?.pivot?.columns?.map((c) => ({ key: c, label: c })) || [
                { key: 'group', label: 'group' },
                { key: 'revenue', label: 'revenue' },
              ]
            }
            rows={builtReport?.rows || []}
            empty={isAr ? 'ابنِ تقريرًا لعرض النتائج' : 'Build a report to see results'}
          />
          <h4 style={{ margin: '16px 0 8px' }}>{isAr ? 'تقارير محفوظة / مجدولة' : 'Saved / scheduled reports'}</h4>
          <SimpleTable
            columns={[
              { key: 'name', label: isAr ? 'الاسم' : 'Name', render: (r) => (isAr ? r.nameAr || r.name : r.name) },
              { key: 'chartType', label: isAr ? 'الرسم' : 'Chart' },
              { key: 'groupBy', label: isAr ? 'تجميع' : 'Group' },
              { key: 'schedule', label: isAr ? 'جدولة' : 'Schedule' },
              {
                key: 'run',
                label: isAr ? 'تشغيل' : 'Run',
                render: (r) => (
                  <button type="button" disabled={busy} onClick={() => run('buildReport', r)}>
                    {isAr ? 'تشغيل' : 'Run'}
                  </button>
                ),
              },
            ]}
            rows={data?.reports || []}
          />
        </Panel>
      ) : null}

      {tab === 'exports' ? (
        <Panel title={isAr ? 'مركز التصدير' : 'Export center'}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {['csv', 'excel', 'pdf', 'print', 'email'].map((format) => (
              <button
                key={format}
                type="button"
                disabled={busy}
                onClick={() => {
                  if (format === 'csv' || format === 'excel' || format === 'pdf') {
                    window.open(
                      `/api/bi?view=export&format=${format}&metrics=${encodeURIComponent(reportSpec.metrics)}&groupBy=${reportSpec.groupBy}&name=${encodeURIComponent(reportSpec.name)}`,
                      '_blank',
                    );
                  } else {
                    run('exportReport', {
                      format,
                      report: {
                        name: reportSpec.name,
                        metrics: reportSpec.metrics.split(',').map((s) => s.trim()).filter(Boolean),
                        groupBy: reportSpec.groupBy,
                        chartType: reportSpec.chartType,
                      },
                    });
                  }
                }}
              >
                {format.toUpperCase()}
              </button>
            ))}
            <button type="button" disabled={busy} onClick={() => run('runScheduledReports')}>
              {isAr ? 'تشغيل التقارير المجدولة' : 'Run scheduled reports'}
            </button>
          </div>
          <SimpleTable
            columns={[
              { key: 'filename', label: isAr ? 'الملف' : 'File' },
              { key: 'format', label: isAr ? 'الصيغة' : 'Format' },
              { key: 'bytes', label: isAr ? 'الحجم' : 'Bytes' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'createdAt', label: isAr ? 'التاريخ' : 'At' },
            ]}
            rows={data?.exports || []}
          />
        </Panel>
      ) : null}

      {tab === 'forecasts' ? (
        <Panel title={isAr ? 'محرك التنبؤ' : 'Forecasting engine'}>
          <p style={{ color: '#6b7280', fontSize: 13 }}>
            {isAr
              ? `الطريقة: ${data?.forecasts?.method || '—'} · الأفق: ${data?.forecasts?.horizon || '—'} أشهر`
              : `Method: ${data?.forecasts?.method || '—'} · Horizon: ${data?.forecasts?.horizon || '—'} months`}
          </p>
          <Bars
            labels={(data?.forecasts?.series || []).map((s) => `+${s.monthOffset}`)}
            values={(data?.forecasts?.series || []).map((s) => s.revenue)}
          />
          <SimpleTable
            columns={[
              { key: 'monthOffset', label: isAr ? 'الشهر' : 'Month' },
              { key: 'revenue', label: isAr ? 'الإيراد' : 'Revenue' },
              { key: 'growth', label: isAr ? 'النمو %' : 'Growth %' },
              { key: 'registrations', label: isAr ? 'التسجيلات' : 'Registrations' },
              { key: 'teacherDemand', label: isAr ? 'طلب المعلمين' : 'Teacher demand' },
              { key: 'studentDemand', label: isAr ? 'طلب الطلاب' : 'Student demand' },
              { key: 'subscriptionRenewals', label: isAr ? 'تجديد الاشتراك' : 'Renewals' },
              { key: 'cashFlow', label: isAr ? 'التدفق' : 'Cash flow' },
              { key: 'resourceRequirements', label: isAr ? 'الموارد' : 'Resources' },
            ]}
            rows={data?.forecasts?.series || []}
          />
        </Panel>
      ) : null}

      {tab === 'kpis' ? (
        <Panel title={isAr ? 'مركز مؤشرات الأداء' : 'KPI center'}>
          {(data?.kpis?.departments || []).map((dep) => (
            <div key={dep.key} style={{ marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 8px' }}>{isAr ? dep.labelAr : dep.label}</h4>
              <SimpleTable
                columns={[
                  { key: 'name', label: isAr ? 'المؤشر' : 'KPI', render: (r) => (isAr ? r.nameAr || r.name : r.name) },
                  { key: 'value', label: isAr ? 'القيمة' : 'Value' },
                  { key: 'target', label: isAr ? 'الهدف' : 'Target' },
                  { key: 'progress', label: isAr ? 'التقدم %' : 'Progress %' },
                  {
                    key: 'healthy',
                    label: isAr ? 'الحالة' : 'Health',
                    render: (r) => (r.healthy ? (isAr ? 'سليم' : 'OK') : isAr ? 'يحتاج انتباه' : 'Needs attention'),
                  },
                ]}
                rows={data?.kpis?.byDepartment?.[dep.key] || []}
              />
            </div>
          ))}
        </Panel>
      ) : null}

      {tab === 'alerts' ? (
        <Panel title={isAr ? 'مركز التنبيهات' : 'Alert center'}>
          <h4 style={{ margin: '0 0 8px' }}>{isAr ? 'القواعد' : 'Rules'}</h4>
          <SimpleTable
            columns={[
              { key: 'name', label: isAr ? 'التنبيه' : 'Alert', render: (r) => (isAr ? r.nameAr || r.name : r.name) },
              { key: 'metric', label: isAr ? 'المؤشر' : 'Metric' },
              { key: 'op', label: isAr ? 'الشرط' : 'Op' },
              { key: 'threshold', label: isAr ? 'الحد' : 'Threshold' },
              { key: 'severity', label: isAr ? 'الخطورة' : 'Severity' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
            ]}
            rows={data?.alerts?.rules || []}
          />
          <h4 style={{ margin: '16px 0 8px' }}>{isAr ? 'أحداث حديثة' : 'Recent events'}</h4>
          <SimpleTable
            columns={[
              { key: 'name', label: isAr ? 'التنبيه' : 'Alert', render: (r) => (isAr ? r.nameAr || r.name : r.name) },
              { key: 'value', label: isAr ? 'القيمة' : 'Value' },
              { key: 'threshold', label: isAr ? 'الحد' : 'Threshold' },
              { key: 'severity', label: isAr ? 'الخطورة' : 'Severity' },
              { key: 'createdAt', label: isAr ? 'التاريخ' : 'At' },
            ]}
            rows={data?.alerts?.events || []}
            empty={isAr ? 'لا توجد تنبيهات مطلقة حاليًا' : 'No fired alerts yet'}
          />
        </Panel>
      ) : null}

      <Panel title={isAr ? 'إعدادات منصة BI (قابلة للتكوين)' : 'BI platform config (Owner-configurable)'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {Object.entries(data?.config || {}).map(([key, value]) => (
            <label key={key} style={{ fontSize: 12, color: '#374151' }}>
              <div style={{ marginBottom: 4 }}>{key}</div>
              <input
                defaultValue={String(value ?? '')}
                disabled={busy || key === 'updatedAt' || key === 'updatedBy'}
                onBlur={(e) => {
                  if (key === 'updatedAt' || key === 'updatedBy') return;
                  const raw = e.target.value;
                  const parsed = raw === 'true' ? true : raw === 'false' ? false : Number.isFinite(Number(raw)) && raw !== '' ? Number(raw) : raw;
                  run('setConfig', { [key]: parsed });
                }}
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            </label>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export default EnterpriseBiCenter;
