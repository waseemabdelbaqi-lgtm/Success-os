'use client';
import {useEffect} from 'react';
export default function PartnerRoute({params}){useEffect(()=>{const role=Array.isArray(params?.path)?params.path[0]:params?.path;location.replace(`/join-us?role=${encodeURIComponent(role||'partner')}`)},[params]);return <main className="route-transition"><b>SUCCESS OS</b><h1>يتم فتح طلب الشراكة…</h1><p>ستتابع من نموذج الانضمام المناسب.</p></main>}
