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

function ProviderCard({ provider: p }) {
  const green = p.displayColor === 'green';
  return (
    <article
      style={{
        border: `1px solid ${green ? '#86efac' : '#e5e7eb'}`,
        borderRadius: 12,
        padding: '1rem 1.1rem',
        background: green ? '#f0fdf4' : '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <Dot color={p.displayColor} />
        <strong style={{ fontSize: 16 }}>{p.label || p.id}</strong>
      </div>
      <dl
        style={{
          margin: 0,
          display: 'grid',
          gap: 4,
          fontSize: 13,
          color: '#374151',
        }}
      >
        <div>
          <dt style={{ display: 'inline', color: '#6b7280' }}>Model: </dt>
          <dd style={{ display: 'inline', margin: 0 }}>{formatCell(p.Model || p.model)}</dd>
        </div>
        <div>
          <dt style={{ display: 'inline', color: '#6b7280' }}>Status: </dt>
          <dd
            style={{
              display: 'inline',
              margin: 0,
              fontWeight: 600,
              color: green ? '#15803d' : '#6b7280',
            }}
          >
            {formatCell(p.Status || p.status)}
          </dd>
        </div>
        <div>
          <dt style={{ display: 'inline', color: '#6b7280' }}>Latency: </dt>
          <dd style={{ display: 'inline', margin: 0 }}>
            {formatCell(p.Latency || (p.latencyMs != null ? `${p.latencyMs} ms` : null))}
          </dd>
        </div>
        <div>
          <dt style={{ display: 'inline', color: '#6b7280' }}>آخر اختبار: </dt>
          <dd style={{ display: 'inline', margin: 0 }}>
            {formatCell(p['آخر اختبار'] || p.lastTestAt)}
          </dd>
        </div>
        <div>
          <dt style={{ display: 'inline', color: '#6b7280' }}>النتيجة: </dt>
          <dd style={{ display: 'inline', margin: 0 }}>{formatCell(p.النتيجة || p.result)}</dd>
        </div>
        {!green ? (
          <div>
            <dt style={{ display: 'inline', color: '#6b7280' }}>آخر خطأ: </dt>
            <dd style={{ display: 'inline', margin: 0, color: '#9ca3af' }}>
              {formatCell(p['آخر خطأ'] || p.lastError)}
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
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

      {providers.length === 0 ? (
        <p style={{ color: '#6b7280' }}>لا توجد نتائج بعد. شغّل فحصًا حيًا موثّقًا.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      )}
    </div>
  );
}
