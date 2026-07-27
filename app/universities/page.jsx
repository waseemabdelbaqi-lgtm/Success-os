'use client';

import { useEffect } from 'react';

/** Preserve journey query params when redirecting to the admissions wizard. */
export default function UniversitiesRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has('from')) params.set('from', 'universities');
    location.replace(`/admissions?${params.toString()}`);
  }, []);

  return (
    <main className="route-transition">
      <h1>فتح الجامعات والكليات…</h1>
    </main>
  );
}
