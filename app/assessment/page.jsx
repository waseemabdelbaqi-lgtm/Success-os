'use client';
import { useState } from 'react';
import { InnerNav } from '../components';

export default function AssessmentPage(){
  const [text,setText]=useState('');
  const [submitted,setSubmitted]=useState(false);

  function submit(){
    if(!text.trim())return;
    try{
      const evidence={
        id:`ASM-${Date.now().toString().slice(-6)}`,
        title:'لماذا لا يكفي أن نقول إن التيار “شحنة” فقط؟',
        answer:text.trim(),
        status:'بانتظار مراجعة معلم',
        createdAt:new Date().toISOString(),
      };
      const saved=JSON.parse(localStorage.getItem('success-os-assessment-evidence')||'[]');
      localStorage.setItem('success-os-assessment-evidence',JSON.stringify([evidence,...saved].slice(0,20)));
    }catch{}
    setSubmitted(true);
  }

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="passport"/>
      <main className="os-page-content">
        <div className="os-page-head">
          <span className="tag">MASTERY ASSESSMENT</span>
          <h1>إثبات الإتقان بأكثر من نوع دليل</h1>
          <p>أسئلة اختيار، حل مفتوح، تفسير، ومشروع قصير—ثم قرار واضح: أتقن، يحتاج تدريبًا، أو يحتاج مراجعة معلم.</p>
        </div>
        <section className="assessment-grid">
          <article className="os-card assessment-task">
            <small>سؤال تفسير • 4 درجات</small>
            <h2>لماذا لا يكفي أن نقول إن التيار “شحنة” فقط؟</h2>
            <textarea
              value={text}
              onChange={e=>setText(e.target.value)}
              placeholder="اكتب تفسيرك مستخدمًا الكمية والزمن والوحدة..."
            />
            <button type="button" onClick={submit} disabled={!text.trim()}>إرسال للمراجعة</button>
            {submitted&&(
              <div className="assessment-result">
                <b>تم حفظ المحاولة كدليل</b>
                <p>سيحلل النظام المفاهيم، ثم يعتمد المعلم النتيجة قبل إضافتها كإتقان موثق.</p>
                <div className="diagnostic-next">
                  <a href="/passport">عرض الأثر في الجواز ←</a>
                  <a href="/diagnostic">أعد التشخيص</a>
                  <a href="/lesson">راجع الدرس</a>
                </div>
              </div>
            )}
          </article>
          <aside className="os-card rubric">
            <h3>معيار التصحيح</h3>
            {[['المفهوم','يربط التيار بمعدل التدفق'],['العلاقة','يذكر I = Q/t'],['الوحدة','يفسر A = C/s'],['التواصل','شرح واضح ومترابط']].map(([a,b])=>(
              <div key={a}><b>{a}</b><span>{b}</span></div>
            ))}
            <a href="/passport">عرض أثر النتيجة في الجواز</a>
            <a href="/tutor">اطلب تلميحًا من المعلم الذكي</a>
          </aside>
        </section>
      </main>
    </div>
  );
}
