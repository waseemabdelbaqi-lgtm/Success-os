'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';

const targets = {
  onboarding: '/onboarding',
  dashboard: '/student-portal',
  books: '/student/books',
  results: '/student/results',
  service: '/student/service',
  'school-subjects': '/subject-catalog',
  'university-subjects': '/university-subjects',
  'recorded-lessons': '/recorded-class-request',
  'live-lessons': '/class-booking',
  teachers: '/teachers',
  centers: '/partner-search?portal=center',
  schools: '/school-finder',
  universities: '/admissions',
  admissions: '/admissions',
  settings: '/student/settings',
  profile: '/student/profile',
};

export default function StudentRoute() {
  const params = useParams();
  useEffect(() => {
    const path = params?.path;
    const key = Array.isArray(path) ? path[0] : path;
    location.replace(targets[key] || '/student-portal');
  }, [params]);
  return (
    <main className="route-transition">
      <b>SUCCESS OS</b>
      <h1>يتم فتح مساحة الطالب…</h1>
      <p>نحفظ اختياراتك وننقلك إلى الخطوة الصحيحة.</p>
    </main>
  );
}
