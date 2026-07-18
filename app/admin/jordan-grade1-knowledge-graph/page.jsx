'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const GROUP_COLOR = {
  subject: '#0f766e',
  lesson: '#1d4ed8',
  concept: '#b45309',
};

function forceLayout(nodes, links, width, height) {
  const pos = new Map(
    nodes.map((n, i) => {
      const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
      const r = 40 + (i % 7) * 28;
      return [
        n.id,
        {
          x: width / 2 + Math.cos(angle) * r * 3.2,
          y: height / 2 + Math.sin(angle) * r * 2.4,
        },
      ];
    }),
  );

  for (let iter = 0; iter < 40; iter += 1) {
    for (const a of nodes) {
      for (const b of nodes) {
        if (a.id === b.id) continue;
        const pa = pos.get(a.id);
        const pb = pos.get(b.id);
        let dx = pa.x - pb.x;
        let dy = pa.y - pb.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 120 / (dist * dist);
        pa.x += (dx / dist) * force;
        pa.y += (dy / dist) * force;
      }
    }
    for (const link of links) {
      const pa = pos.get(link.source);
      const pb = pos.get(link.target);
      if (!pa || !pb) continue;
      let dx = pb.x - pa.x;
      let dy = pb.y - pa.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 90) * 0.05;
      pa.x += (dx / dist) * force;
      pa.y += (dy / dist) * force;
      pb.x -= (dx / dist) * force;
      pb.y -= (dy / dist) * force;
    }
  }

  // Clamp
  for (const [, p] of pos) {
    p.x = Math.max(24, Math.min(width - 24, p.x));
    p.y = Math.max(24, Math.min(height - 24, p.y));
  }
  return pos;
}

export default function JordanGrade1KnowledgeGraphAdminPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState(null);
  const [query, setQuery] = useState('');
  const [facet, setFacet] = useState('concept');
  const [searchResults, setSearchResults] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/jordan-grade1-knowledge-graph', { cache: 'no-store' });
    setData(await res.json());
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  async function run(action, payload = {}) {
    setBusy(true);
    setError('');
    setLog(null);
    try {
      const res = await fetch('/api/jordan-grade1-knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'request failed');
      setLog(json);
      if (action === 'query' || action === 'search') setSearchResults(json);
      await load();
    } catch (e) {
      setError(e.message || 'action failed');
    } finally {
      setBusy(false);
    }
  }

  const dash = data?.dashboard || {};
  const visual = data?.visual || { nodes: [], links: [] };
  const width = 920;
  const height = 480;
  const positions = useMemo(
    () => forceLayout(visual.nodes || [], visual.links || [], width, height),
    [visual],
  );

  return (
    <main style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
      <h1>JO-01.4 — Educational Knowledge Graph</h1>
      <p>
        Success OS educational brain for Jordan Grade 1. No AI recommendation without graph
        consultation. Architecture supports unlimited future countries without redesign.
      </p>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <section
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
          margin: '1rem 0',
        }}
      >
        {[
          ['Nodes', dash.totalNodes],
          ['Edges', dash.totalEdges],
          ['Lessons', dash.lessons],
          ['Concepts', dash.concepts],
          ['Questions', dash.questions],
          ['Subjects', dash.subjects],
          ['Cross-subject', dash.crossSubjectLinks],
          ['AI services', dash.aiServicesBound],
        ].map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
            <strong>{value ?? '—'}</strong>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" disabled={busy} onClick={() => run('build')}>
          Build / Rebuild Graph
        </button>
        <button type="button" disabled={busy} onClick={() => load()}>
          Refresh
        </button>
      </div>

      <h2>Visual knowledge graph</h2>
      <p style={{ fontSize: 13, color: '#555' }}>
        Concept networks · lesson dependencies · subject connections (subset for Admin UI)
      </p>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa' }}
      >
        {(visual.links || []).map((link, i) => {
          const a = positions.get(link.source);
          const b = positions.get(link.target);
          if (!a || !b) return null;
          return (
            <line
              key={`l-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={link.type === 'cross_subject_related' ? '#0f766e' : '#cbd5e1'}
              strokeWidth={link.type === 'next_lesson' ? 1.6 : 1}
            />
          );
        })}
        {(visual.nodes || []).map((n) => {
          const p = positions.get(n.id);
          if (!p) return null;
          return (
            <g key={n.id} onClick={() => setSelected(n)} style={{ cursor: 'pointer' }}>
              <circle
                cx={p.x}
                cy={p.y}
                r={n.group === 'subject' ? 10 : 6}
                fill={GROUP_COLOR[n.group] || '#64748b'}
              />
              {n.group === 'subject' ? (
                <text x={p.x + 12} y={p.y + 4} fontSize="11" fill="#111">
                  {n.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {selected ? (
        <p style={{ fontSize: 13 }}>
          Selected: <code>{selected.id}</code> — {selected.label} ({selected.group})
        </p>
      ) : null}

      <h2>Intelligent search</h2>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 8 }}>
        <input
          style={{ flex: 1, minWidth: 180 }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Concept, skill, lesson…"
        />
        <select value={facet} onChange={(e) => setFacet(e.target.value)}>
          {(data?.searchFacets || []).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run('query', { queryAction: 'search', payload: { query, facet, limit: 25 } })
          }
        >
          Search
        </button>
      </div>

      {searchResults?.results?.length ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['ID', 'Kind', 'Label'].map((h) => (
                <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {searchResults.results.map((r) => (
              <tr key={r.globalId}>
                <td style={{ padding: 6, fontFamily: 'monospace', fontSize: 11 }}>{r.globalId}</td>
                <td style={{ padding: 6 }}>{r.nodeKind}</td>
                <td style={{ padding: 6 }}>{r.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <h2>AI services bound to graph</h2>
      <p style={{ fontSize: 13 }}>{(data?.aiServices || []).join(' · ')}</p>

      {log?.totals ? (
        <details open style={{ marginTop: '1rem' }}>
          <summary>Last build</summary>
          <pre style={{ fontSize: 11, background: '#f8fafc', padding: 12, maxHeight: 280, overflow: 'auto' }}>
            {JSON.stringify({ totals: log.totals, stats: log.stats }, null, 2)}
          </pre>
        </details>
      ) : null}
    </main>
  );
}
