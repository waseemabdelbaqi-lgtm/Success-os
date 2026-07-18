'use client';

import { useCallback, useEffect, useState } from 'react';

export default function JordanNationalEducationRegistryAdminPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState(null);
  const [query, setQuery] = useState('');
  const [facet, setFacet] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/jordan-national-education-registry', { cache: 'no-store' });
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
      const res = await fetch('/api/jordan-national-education-registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'request failed');
      setLog(json);
      if (action === 'search') setSearchResults(json);
      await load();
    } catch (e) {
      setError(e.message || 'action failed');
    } finally {
      setBusy(false);
    }
  }

  const dash = data?.dashboard || {};

  const cards = [
    ['Total Grades', dash.totalGrades],
    ['Total Subjects', dash.totalSubjects],
    ['Total Books', dash.totalBooks],
    ['Total Units', dash.totalUnits],
    ['Total Lessons', dash.totalLessons],
    ['Total Concepts', dash.totalConcepts],
    ['Total Skills', dash.totalSkills],
    ['Total References', dash.totalReferences],
    ['Registry Health', dash.registryHealth],
    ['Missing Relationships', dash.missingRelationships],
    ['Validation Errors', dash.validationErrors],
    ['Search Documents', dash.searchDocuments],
  ];

  return (
    <main style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
      <h1>JO-10 — Jordan National Education Registry</h1>
      <p>
        Single source of truth for Jordanian National Curriculum entities. Immutable Global IDs
        (JOR-…). Architecture supports unlimited future countries without redesign.
      </p>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <section
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
          margin: '1rem 0',
        }}
      >
        {cards.map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
            <strong>{value ?? '—'}</strong>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" disabled={busy} onClick={() => run('register')}>
          Register Jordan Curriculum
        </button>
        <button type="button" disabled={busy} onClick={() => load()}>
          Refresh
        </button>
      </div>

      <h2>Search index</h2>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <input
          style={{ flex: 1, minWidth: 200 }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Keyword, concept, formula…"
        />
        <select value={facet} onChange={(e) => setFacet(e.target.value)}>
          <option value="">All facets</option>
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
            run('search', { query, options: { facet: facet || null, limit: 30 } })
          }
        >
          Search
        </button>
      </div>

      {searchResults?.results?.length ? (
        <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Global ID', 'Kind', 'Label'].map((h) => (
                  <th
                    key={h}
                    style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {searchResults.results.map((row) => (
                <tr key={row.globalId}>
                  <td style={{ padding: 6, fontFamily: 'monospace', fontSize: 12 }}>
                    {row.globalId}
                  </td>
                  <td style={{ padding: 6 }}>{row.kind}</td>
                  <td style={{ padding: 6 }}>{row.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <h2>Entity kinds</h2>
      <p style={{ fontSize: 13 }}>{(data?.entityKinds || []).join(' · ')}</p>

      {log && log.totals ? (
        <details open style={{ marginTop: '1rem' }}>
          <summary>Last registration</summary>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontSize: 11,
              background: '#f8fafc',
              padding: 12,
              maxHeight: 360,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(
              {
                registrationStatus: log.registrationStatus,
                validationOk: log.validationOk,
                totals: log.totals,
                searchDocuments: log.searchDocuments,
              },
              null,
              2,
            )}
          </pre>
        </details>
      ) : null}
    </main>
  );
}
