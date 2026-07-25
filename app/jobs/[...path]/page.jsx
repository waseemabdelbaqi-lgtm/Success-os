'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';

const targets = {
  onboarding: '/profile?role=jobseeker',
  dashboard: '/jobseeker-portal',
  search: '/jobs',
  companies: '/jobs?view=companies',
  applications: '/application-tracker',
  'career-plan': '/jobseeker-portal',
};

export default function JobRoute() {
  const params = useParams();
  useEffect(() => {
    const path = params?.path;
    const key = Array.isArray(path) ? path[0] : path;
    location.replace(targets[key] || '/jobseeker-portal');
  }, [params]);
  return (
    <main className="route-transition">
      <b>SUCCESS OS</b>
      <h1>يتم فتح المسار المهني…</h1>
      <p>نحفظ الفلاتر وننقلك إلى وجهتك.</p>
    </main>
  );
}
