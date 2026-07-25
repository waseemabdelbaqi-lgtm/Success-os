'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function PartnerRoute() {
  const params = useParams();
  useEffect(() => {
    const path = params?.path;
    const role = Array.isArray(path) ? path[0] : path;
    location.replace(`/join-us?role=${encodeURIComponent(role || 'partner')}`);
  }, [params]);
  return (
    <main className="route-transition">
      <b>SUCCESS OS</b>
      <h1>يتم فتح طلب الشراكة…</h1>
      <p>ستتابع من نموذج الانضمام المناسب.</p>
    </main>
  );
}
