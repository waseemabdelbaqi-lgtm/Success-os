'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

function Dot({ color }) {
  const map = { green: '#16a34a', yellow: '#ca8a04', red: '#dc2626', grey: '#9ca3af', neutral: '#9ca3af' };
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: map[color] || map.grey,
        marginInlineEnd: 8,
        flexShrink: 0,
      }}
    />
  );
}

function cell(value) {
  if (value == null || value === '') return 'NOT_TESTED';
  return String(value);
}

export function AiInfrastructurePanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState(null);
  const [providerFilter, setProviderFilter] = useState('');
  const [factoryFilter, setFactoryFilter] = useState('');

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/ai-infrastructure', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'LOAD_FAILED');
    setData(json);
  }, []);

  const run = useCallback(async (body) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/ai-infrastructure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
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

  const diagnosticText = useMemo(() => {
    if (!data) return '';
    return JSON.stringify(
      {
        checkedAt: data.checkedAt,
        greenCount: data.greenCount,
        factoryReadiness: data.factoryReadiness,
        providers: providers.map((p) => ({
          providerId: p.providerId,
          status: p.Status || p.status,
          liveProbe: p['Live Probe'] || p.liveProbe,
          testedAt: p['Last Tested'] || p.testedAt,
          latencyMs: p.latencyMs,
          model: p['Model or Service'] || p.model,
          error: p['Last Error'] || p.safeErrorMessage,
        })),
        secretsExposed: false,
      },
      null,
      2,
    );
  }, [data, providers]);

  const copyDiagnostic = async () => {
    try {
      await navigator.clipboard.writeText(diagnosticText);
    } catch {
      setError('COPY_FAILED');
    }
  };

  const fr = data?.factoryReadiness || {};

  return (
    <div dir="rtl" style={{ maxWidth: 1280, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <header style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>AI Infrastructure</h1>
        <p style={{ color: '#4b5563', margin: '0.5rem 0 0', lineHeight: 1.5 }}>
          {data?.ruleAr ||
            'لا يظهر أي مزود باللون الأخضر إلا إذا نجح طلب حي موثّق خلال آخر فحص.'}
        </p>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '0.35rem 0 0' }}>
          المصدر: {cell(data?.source)} · أخضر: {data?.greenCount ?? 0} · معتمد ⭐:{' '}
          {data?.certifiedCount ?? 0} · حرج ⭐⭐: {data?.missionCriticalCount ?? 0} · آخر فحص:{' '}
          {cell(data?.checkedAt)}
        </p>
        <p style={{ color: '#374151', fontSize: 12, margin: '0.5rem 0 0', letterSpacing: 0.2 }}>
          {(data?.lifecycleLadder || [
            'SLOT ⚪',
            'NOT_CONFIGURED ⚪',
            'CREDENTIALS_DETECTED 🟡',
            'PROBE_RUNNING 🟡',
            'READY 🟢',
            'PRODUCTION_CERTIFIED 🟢⭐',
            'MISSION_CRITICAL 🟢⭐⭐',
          ]).join(' → ')}
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 10,
          marginBottom: '1rem',
        }}
      >
        {[
          ['Coding Factory', fr.coding?.status || 'NOT_TESTED'],
          ['Education Factory', fr.education?.status || 'NOT_TESTED'],
          ['Media Factory', fr.media?.status || 'NOT_TESTED'],
        ].map(([label, status]) => (
          <div
            key={label}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: '0.75rem',
              background: '#fff',
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{status}</div>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" disabled={busy} onClick={() => run({ mode: 'config' })} style={btn()}>
          Run Configuration Check
        </button>
        <button type="button" disabled={busy} onClick={() => run({ mode: 'live' })} style={btnPrimary()}>
          {busy ? 'Running…' : 'Run Live Probe'}
        </button>
        <button type="button" disabled={busy} onClick={() => run({ mode: 'full' })} style={btn()}>
          Run Full Verification
        </button>
        <input
          placeholder="provider id"
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          style={inputStyle()}
        />
        <button
          type="button"
          disabled={busy || !providerFilter.trim()}
          onClick={() => run({ mode: 'live', provider: providerFilter.trim() })}
          style={btn()}
        >
          Test One Provider
        </button>
        <button
          type="button"
          disabled={busy || !providerFilter.trim()}
          onClick={() => run({ action: 'certify', provider: providerFilter.trim() })}
          style={btnPrimary()}
          title="Requires READY first"
        >
          PRODUCTION CERTIFIED ⭐
        </button>
        <button
          type="button"
          disabled={busy || !providerFilter.trim()}
          onClick={() => run({ action: 'mission-critical', provider: providerFilter.trim() })}
          style={btnPrimary()}
          title="Requires PRODUCTION CERTIFIED first"
        >
          MISSION CRITICAL ⭐⭐
        </button>
        <select
          value={factoryFilter}
          onChange={(e) => setFactoryFilter(e.target.value)}
          style={inputStyle()}
        >
          <option value="">factory…</option>
          <option value="coding">coding</option>
          <option value="education">education</option>
          <option value="media">media</option>
          <option value="infrastructure">infrastructure</option>
        </select>
        <button
          type="button"
          disabled={busy || !factoryFilter}
          onClick={() => run({ mode: 'live', factory: factoryFilter })}
          style={btn()}
        >
          Test Factory
        </button>
        <button type="button" disabled={busy} onClick={copyDiagnostic} style={btn()}>
          Copy Safe Diagnostic Report
        </button>
        <button
          type="button"
          disabled
          title="Requires explicit approval — not automatic"
          style={{ ...btn(), opacity: 0.5 }}
        >
          Run Approved Generation Test
        </button>
      </div>

      {error ? (
        <p style={{ color: '#b91c1c', marginBottom: '1rem' }} role="alert">
          {error}
        </p>
      ) : null}

      <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'right' }}>
              {[
                'Provider',
                'Factory',
                'Adapter',
                'Credentials',
                'Live Probe',
                'Lifecycle',
                'Status',
                'Last Tested',
                'Result',
                'Latency',
                'Model or Service',
                'Last Successful Test',
                'Last Error',
                'Actions',
              ].map((h) => (
                <th key={h} style={{ padding: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {providers.length === 0 ? (
              <tr>
                <td colSpan={14} style={{ padding: '1rem', color: '#6b7280' }}>
                  NOT_TESTED — run a live probe to populate persisted health state.
                </td>
              </tr>
            ) : (
              providers.map((p) => (
                <tr key={p.providerId || p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.65rem', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Dot color={p.displayColor} />
                      {cell(p.Provider || p.displayName || p.id)}
                      <span
                        style={{ marginInlineStart: 6, fontSize: 14 }}
                        title={cell(p.Lifecycle || p.lifecycleStage)}
                      >
                        {p.displayMark ||
                          p.Mark ||
                          (p.missionCritical || p.Lifecycle === 'MISSION_CRITICAL'
                            ? '🟢⭐⭐'
                            : p.productionCertified || p.Lifecycle === 'PRODUCTION_CERTIFIED'
                              ? '🟢⭐'
                              : p.Lifecycle === 'READY' || p.Status === 'READY'
                                ? '🟢'
                                : p.Lifecycle === 'CREDENTIALS_DETECTED' ||
                                    p.Lifecycle === 'PROBE_RUNNING'
                                  ? '🟡'
                                  : '⚪')}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem' }}>{cell(p.Factory || p.factory)}</td>
                  <td style={{ padding: '0.65rem' }}>{cell(p.Adapter)}</td>
                  <td style={{ padding: '0.65rem' }}>{cell(p.Credentials)}</td>
                  <td style={{ padding: '0.65rem' }}>{cell(p['Live Probe'] || p.liveProbe)}</td>
                  <td style={{ padding: '0.65rem', fontSize: 11 }} title={p['Lifecycle Ladder']}>
                    {cell(p.Lifecycle || p.lifecycleStage)}
                  </td>
                  <td style={{ padding: '0.65rem', fontWeight: 600 }}>{cell(p.Status || p.status)}</td>
                  <td style={{ padding: '0.65rem' }}>{cell(p['Last Tested'] || p.testedAt)}</td>
                  <td style={{ padding: '0.65rem' }}>{cell(p.Result || p.result)}</td>
                  <td style={{ padding: '0.65rem' }}>{cell(p.Latency)}</td>
                  <td style={{ padding: '0.65rem' }}>{cell(p['Model or Service'] || p.model)}</td>
                  <td style={{ padding: '0.65rem' }}>
                    {cell(p['Last Successful Test'] || p.lastSuccessfulProbeAt)}
                  </td>
                  <td style={{ padding: '0.65rem', color: '#6b7280', maxWidth: 220 }}>
                    {cell(p['Last Error'] || p.safeErrorMessage)}
                  </td>
                  <td style={{ padding: '0.65rem' }}>
                    <button
                      type="button"
                      style={btnSmall()}
                      onClick={() => {
                        setDetails(p);
                      }}
                    >
                      View Probe Details
                    </button>
                    <button
                      type="button"
                      style={btnSmall()}
                      onClick={() =>
                        setDetails({
                          errorOnly: true,
                          error: p['Last Error'] || p.safeErrorMessage,
                          providerId: p.providerId,
                        })
                      }
                    >
                      View Error
                    </button>
                    <button
                      type="button"
                      style={btnSmall()}
                      disabled={busy}
                      onClick={() => run({ mode: 'live', provider: p.providerId })}
                    >
                      Retest
                    </button>
                    <button
                      type="button"
                      style={btnSmall()}
                      disabled={
                        busy ||
                        p.productionCertified ||
                        p.Lifecycle === 'PRODUCTION_CERTIFIED' ||
                        p.missionCritical ||
                        p.Lifecycle === 'MISSION_CRITICAL' ||
                        !(
                          p.Status === 'READY' ||
                          p.status === 'READY' ||
                          p.Lifecycle === 'READY' ||
                          p.lifecycleStage === 'READY'
                        )
                      }
                      title="Promote READY → PRODUCTION CERTIFIED ⭐"
                      onClick={() => run({ action: 'certify', provider: p.providerId })}
                    >
                      ⭐ Certify
                    </button>
                    <button
                      type="button"
                      style={btnSmall()}
                      disabled={
                        busy ||
                        p.missionCritical ||
                        p.Lifecycle === 'MISSION_CRITICAL' ||
                        !(
                          p.productionCertified ||
                          p.Lifecycle === 'PRODUCTION_CERTIFIED' ||
                          p.Status === 'PRODUCTION_CERTIFIED'
                        )
                      }
                      title="Promote PRODUCTION CERTIFIED → MISSION CRITICAL ⭐⭐"
                      onClick={() => run({ action: 'mission-critical', provider: p.providerId })}
                    >
                      ⭐⭐ Critical
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {details ? (
        <div
          role="dialog"
          style={{
            marginTop: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '1rem',
            background: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <strong>Probe details</strong>
            <button type="button" onClick={() => setDetails(null)} style={btnSmall()}>
              Close
            </button>
          </div>
          <pre
            style={{
              marginTop: 8,
              fontSize: 12,
              overflow: 'auto',
              background: '#f9fafb',
              padding: 12,
              borderRadius: 8,
            }}
          >
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      ) : null}

      {(data?.alerts || []).length ? (
        <section style={{ marginTop: '1rem' }}>
          <h2 style={{ fontSize: 16 }}>Alerts</h2>
          <ul>
            {data.alerts.map((a, i) => (
              <li key={i} style={{ color: '#b45309' }}>
                {a.type}: {a.providerId}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function btn() {
  return {
    padding: '0.45rem 0.75rem',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
  };
}
function btnPrimary() {
  return { ...btn(), border: '1px solid #0f766e', background: '#0f766e', color: '#fff' };
}
function btnSmall() {
  return { ...btn(), padding: '0.25rem 0.45rem', fontSize: 11, marginInlineEnd: 4 };
}
function inputStyle() {
  return {
    padding: '0.45rem 0.6rem',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 13,
  };
}
