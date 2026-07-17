'use client';
import { useState } from 'react';
import { Brand } from '../components';

export default function OnboardingPage(){
  const [goal,setGoal]=useState(''); const goals=[['🎯','أرفع علامتي','أريد تحسين نتيجتي في المدرسة أو الامتحان'],['🧠','أتقن نقطة ضعف','أحتاج فهم موضوع أو مهارة محددة'],['📅','أستعد لامتحان','لدي امتحان EST أو AP أو IGCSE أو A Level'],['♙','أحجز معلمًا خبيرًا','أحتاج دعمًا مباشرًا من معلم موثق']];
  return <main className="onboarding-wrap"><section className="onboarding-card"><div className="onboarding-top"><Brand/><span className="onboarding-step">الخطوة 1 من 4</span></div><h1>شو هدفك الأول؟</h1><p>رح نبني خطتك التعليمية حول هذا الهدف، وبتقدر تعدله بأي وقت.</p><div className="goal-grid">{goals.map(([icon,title,desc])=><button className={goal===title?'selected':''} onClick={()=>setGoal(title)} key={title}><span>{icon}</span><div><strong>{title}</strong><small>{desc}</small></div></button>)}</div><button className="onboarding-next" disabled={!goal} onClick={()=>window.location.href='/dashboard'}>ابدأ التشخيص الذكي ←</button></section></main>
}
