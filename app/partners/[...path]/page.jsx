'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';

const JOIN_PORTALS = new Set([
  'teacher',
  'center',
  'school',
  'university',
  'college',
  'employer',
]);

export default function PartnerRoute() {
  const params = useParams();
  useEffect(() => {
    const path = params?.path;
    const segments = Array.isArray(path) ? path : path ? [path] : [];
    const role = segments[0] || 'partner';
    const action = segments[1] || '';
    const portal = role === 'college' ? 'university' : role;

    if (JOIN_PORTALS.has(role) && (action === 'apply' || action === 'join')) {
      const type = role === 'college' ? '&type=college' : '';
      location.replace(
        `/access?portal=${encodeURIComponent(portal)}&intent=join${type}`,
      );
      return;
    }

    if (JOIN_PORTALS.has(role)) {
      location.replace(`/join-us?role=${encodeURIComponent(role)}`);
      return;
    }

    location.replace('/join-us');
  }, [params]);

  return (
    <main className="route-transition">
      <b>SUCCESS OS</b>
      <h1>يتم فتح طلب الشراكة…</h1>
      <p>ستتابع من نموذج الانضمام المناسب.</p>
    </main>
  );
}
