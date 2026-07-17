'use client';
import {useEffect} from 'react';
const targets={onboarding:'/onboarding',dashboard:'/student-portal','school-subjects':'/subject-catalog','university-subjects':'/university-subjects','recorded-lessons':'/recorded-class-request','live-lessons':'/class-booking',teachers:'/teachers',centers:'/partner-search?portal=center',schools:'/school-finder',universities:'/admissions',admissions:'/admissions'};
export default function StudentRoute({params}){useEffect(()=>{const key=Array.isArray(params?.path)?params.path[0]:params?.path;location.replace(targets[key]||'/student-portal')},[params]);return <main className="route-transition"><b>SUCCESS OS</b><h1>يتم فتح مساحة الطالب…</h1><p>نحفظ اختياراتك وننقلك إلى الخطوة الصحيحة.</p></main>}
