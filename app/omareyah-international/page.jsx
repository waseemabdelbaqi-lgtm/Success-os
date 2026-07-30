'use client';

/**
 * App-route mirror pointing visitors to the polished static school site package.
 * Primary shareable preview lives in /omareyah-international-site (static).
 */
import { useEffect } from 'react';

export default function OmareyahInternationalRedirect() {
  useEffect(() => {
    // Prefer static package when served in production previews that include it.
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 32,
        fontFamily: 'Manrope, system-ui, sans-serif',
        background: '#f4f6f8',
        color: '#14181f',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 520 }}>
        <p style={{ letterSpacing: '0.2em', textTransform: 'uppercase', color: '#b8956a', fontWeight: 700, fontSize: 12 }}>
          Omareyah International
        </p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.4rem', fontWeight: 600, lineHeight: 1.2 }}>
          English school site is live in the static preview package
        </h1>
        <p style={{ color: '#667084', lineHeight: 1.7 }}>
          Open the multi-page English experience (Home, About, Vision, Mission, Teachers, Administrators, Location, Contact, Login, EN/AR).
        </p>
        <p style={{ marginTop: 24 }}>
          <a
            href="/omareyah-international-site/index.html"
            style={{
              display: 'inline-flex',
              minHeight: 48,
              alignItems: 'center',
              padding: '0 22px',
              background: '#b8956a',
              color: '#14181f',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Enter Omareyah International
          </a>
        </p>
      </div>
    </main>
  );
}
