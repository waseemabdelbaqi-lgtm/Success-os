'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const GROUP_ORDER = ['main', 'people', 'orgs', 'academic', 'growth', 'hr', 'ops', 'system'];

export function EnterpriseAdminShell({ children }) {
  const pathname = usePathname();
  const [meta, setMeta] = useState(null);
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState('en');
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch('/api/enterprise-admin?view=meta', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => setMeta(null));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.eaTheme = dark ? 'dark' : 'light';
  }, [dark]);

  const groups = useMemo(() => {
    const nav = meta?.nav || [];
    const labels = meta?.navGroups || {};
    return GROUP_ORDER.map((id) => ({
      id,
      label: labels[id] || id,
      items: nav.filter((n) => n.group === id),
    })).filter((g) => g.items.length);
  }, [meta]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length);
  }, [groups, search]);

  const bg = dark ? '#1a0408' : '#f7f4f1';
  const panel = dark ? '#2a0c12' : '#ffffff';
  const text = dark ? '#f8ead8' : '#1a1212';
  const muted = dark ? '#c4b4a8' : '#6b5a52';
  const border = dark ? '#4a1a22' : '#eadde0';
  const accent = '#9e1722';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: bg,
        color: text,
        fontFamily: 'var(--sos-font-body, "Source Sans 3", sans-serif)',
      }}
    >
      <aside
        style={{
          width: collapsed ? 72 : 260,
          background: panel,
          borderRight: `1px solid ${border}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.15s ease',
        }}
      >
        <div style={{ padding: '1rem', borderBottom: `1px solid ${border}` }}>
          <Link href="/dashboard/admin" style={{ color: text, textDecoration: 'none', fontWeight: 700 }}>
            {collapsed ? 'EA' : 'Enterprise Admin'}
          </Link>
          <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>
            {collapsed ? 'v' : `ADMIN-01 · v${meta?.version || '—'}`}
          </div>
        </div>
        <div style={{ padding: '0.75rem' }}>
          {!collapsed ? (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu…"
              style={{
                width: '100%',
                padding: '0.45rem 0.6rem',
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: dark ? '#0b1220' : '#fff',
                color: text,
              }}
            />
          ) : null}
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem 1rem' }}>
          {filteredGroups.map((g) => (
            <div key={g.id} style={{ marginBottom: '0.75rem' }}>
              {!collapsed ? (
                <div style={{ fontSize: 11, color: muted, padding: '0.35rem 0.5rem', textTransform: 'uppercase' }}>
                  {g.label}
                </div>
              ) : null}
              {g.items.map((item) => {
                const active =
                  item.href === '/dashboard/admin'
                    ? pathname === '/dashboard/admin'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    title={item.label}
                    style={{
                      display: 'block',
                      padding: collapsed ? '0.55rem' : '0.45rem 0.65rem',
                      marginBottom: 2,
                      borderRadius: 8,
                      textDecoration: 'none',
                      color: active ? '#fff' : text,
                      background: active ? accent : 'transparent',
                      fontSize: 13,
                      textAlign: collapsed ? 'center' : 'left',
                    }}
                  >
                    {collapsed ? item.label.slice(0, 1) : item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ padding: '0.75rem', borderTop: `1px solid ${border}`, display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setCollapsed((v) => !v)} style={btnStyle(border, text)}>
            {collapsed ? '»' : '«'}
          </button>
          <button type="button" onClick={() => setDark((v) => !v)} style={btnStyle(border, text)}>
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderBottom: `1px solid ${border}`,
            background: panel,
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ flex: 1 }}>Success OS Admin</strong>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{ padding: '0.35rem', borderRadius: 8, border: `1px solid ${border}`, background: panel, color: text }}
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
          <Link href="/admin" style={{ fontSize: 13, color: accent }}>
            Jordan Ops
          </Link>
          <Link href="/" style={{ fontSize: 13, color: muted }}>
            Home
          </Link>
        </header>
        <main style={{ padding: '1rem', flex: 1 }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          {children}
        </main>
      </div>
    </div>
  );
}

function btnStyle(border, text) {
  return {
    border: `1px solid ${border}`,
    background: 'transparent',
    color: text,
    borderRadius: 8,
    padding: '0.35rem 0.55rem',
    cursor: 'pointer',
    fontSize: 12,
  };
}
