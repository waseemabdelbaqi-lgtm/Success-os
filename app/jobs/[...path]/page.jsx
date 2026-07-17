'use client';
import {useEffect} from 'react';
const targets={onboarding:'/profile?role=jobseeker',dashboard:'/jobseeker-portal',search:'/jobs',companies:'/jobs?view=companies',applications:'/application-tracker','career-plan':'/jobseeker-portal#career-plan'};
export default function JobRoute({params}){useEffect(()=>{const key=Array.isArray(params?.path)?params.path[0]:params?.path;location.replace(targets[key]||'/jobseeker-portal')},[params]);return <main className="route-transition"><b>SUCCESS OS</b><h1>يتم فتح المسار المهني…</h1><p>نحفظ الفلاتر وننقلك إلى وجهتك.</p></main>}
