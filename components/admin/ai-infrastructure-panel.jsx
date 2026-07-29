'use client';

import { useCallback, useEffect, useState } from 'react';

function Dot({ color }) {
  const bg = color === 'green' ? '#16a34a' : '#9ca3af';
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: bg,
        marginInlineEnd: 8,
        flexShrink: 0,
      }}
    />
  );
}

function formatCell(value) {
  if (value == null || value === '') return '—';
  return String(value);
}

export function AiInfrastructurePanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/ai-infrastructure', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'LOAD_FAILED');
    setData(json);
  }, []);

  const probe = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/ai-infrastructure', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'PROBE_FAILED');
      setData(json);
    } catch (e) {
      setError(e.message || 'PROBE_FAILED');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'LOAD_FAILED'));
  }, [load]);

  const providers = data?.providers || [];

  return (
    <div dir="rtl" style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <header style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>AI Infrastructure</h1>
        <p style={{ color: '#4b5563', margin: '0.5rem 0 0', lineHeight: 1.5 }}>
          {data?.ruleAr ||
            'لا يظهر أي مزود باللون الأخضر إلا إذا نجح طلب حي موثّق خلال آخر فحص.'}
        </p>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '0.35rem 0 0' }}>
          آخر فحص: {formatCell(data?.checkedAt)} · أخضر: {data?.greenCount ?? 0} · المصدر:{' '}
          {formatCell(data?.source)}
        </p>
      </header>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => load().catch((e) => setError(e.message || 'LOAD_FAILED'))}
          disabled={busy}
          style={{
            padding: '0.5rem 0.9rem',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          تحديث العرض
        </button>
        <button
          type="button"
          onClick={probe}
          disabled={busy}
          style={{
            padding: '0.5rem 0.9rem',
            borderRadius: 8,
            border: '1px solid #0f766e',
            background: '#0f766e',
            color: '#fff',
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'جاري الفحص الحي…' : 'تشغيل فحص حي موثّق'}
        </button>
      </div>

      {error ? (
        <p style={{ color: '#b91c1c', marginBottom: '1rem' }} role="alert">
          {error}
        </p>
      ) : null}

      <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'right' }}>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>المزود</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>آخر اختبار</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>النتيجة</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>زمن الاستجابة</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>آخر خطأ</th>
            </tr>
          </thead>
          <tbody>
            {providers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', color: '#6b7280' }}>
                  لا توجد نتائج بعد. شغّل فحصًا حيًا موثّقًا.
                </td>
              </tr>
            ) : (
              providers.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Dot color={p.displayColor} />
                      {p.label || p.id}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{formatCell(p['آخر اختبار'] || p.lastTestAt)}</td>
                  <td style={{ padding: '0.75rem' }}>{formatCell(p.النتيجة || p.result)}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {formatCell(p['زمن الاستجابة'] ?? (p.latencyMs != null ? `${p.latencyMs}ms` : null))}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {formatCell(p['آخر خطأ'] || p.lastError)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
