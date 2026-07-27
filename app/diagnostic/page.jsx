'use client';
import { useState } from 'react';
import { InnerNav } from '../components';

const QUESTIONS = [
  {
    id: 1,
    prompt: 'تمر شحنة مقدارها 12 C خلال موصل في 3 s. ما شدة التيار؟',
    options: ['0.25 A', '4 A', '9 A', '36 A'],
    correct: '4 A',
    good: 'استخدمت I = Q/t بشكل صحيح. السؤال التالي سيختبر تفسير الوحدة.',
    review: 'تذكر أن التيار يساوي الشحنة مقسومة على الزمن، وليس حاصل ضربهما.',
  },
  {
    id: 2,
    prompt: 'وحدة الأمبير (A) تكافئ:',
    options: ['C·s', 'C/s', 'V/Ω²', 'J/C'],
    correct: 'C/s',
    good: 'ممتاز — الأمبير هو كولوم لكل ثانية.',
    review: 'الأمبير يعبّر عن معدل تدفق الشحنة: C/s.',
  },
  {
    id: 3,
    prompt: 'إذا تضاعف الجهد وثبتت المقاومة، فإن التيار:',
    options: ['ينخفض للنصف', 'يثبت', 'يتضاعف', 'يصبح صفرًا'],
    correct: 'يتضاعف',
    good: 'من قانون أوم I = V/R — تضاعف V يضاعف I عند ثبات R.',
    review: 'ارجع إلى I = V/R وتتبّع أثر تغيير V فقط.',
  },
];

export default function DiagnosticPage(){
  const [index,setIndex]=useState(0);
  const [answer,setAnswer]=useState('');
  const [done,setDone]=useState(false);
  const [score,setScore]=useState(0);
  const q=QUESTIONS[index];
  const finished=index>=QUESTIONS.length;

  function check(){
    if(!answer)return;
    const ok=answer===q.correct;
    if(ok)setScore(s=>s+1);
    setDone(true);
  }

  function next(){
    setAnswer('');
    setDone(false);
    setIndex(i=>i+1);
  }

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="tutor"/>
      <main className="os-page-content">
        <div className="os-page-head">
          <span className="tag">ADAPTIVE DIAGNOSTIC</span>
          <h1>نقيس الفهم، لا الحفظ فقط</h1>
          <p>مثال تفاعلي للخطوة الأولى في رحلة الطالب. الإجابة تحدد السؤال التالي وتكشف المتطلب السابق أو الخطأ الشائع.</p>
        </div>

        {!finished?(
          <section className="quiz-shell os-card">
            <header>
              <span>فيزياء • الشحنة والتيار</span>
              <b>السؤال {index+1} من {QUESTIONS.length}</b>
            </header>
            <div className="quiz-progress"><i style={{width:`${((index+(done?1:0))/QUESTIONS.length)*100}%`}}></i></div>
            <h2>{q.prompt}</h2>
            <div className="quiz-options">
              {q.options.map(x=>(
                <button type="button" key={x} className={answer===x?'selected':''} onClick={()=>{setAnswer(x);setDone(false)}}>{x}</button>
              ))}
            </div>
            {!done?(
              <button type="button" className="quiz-submit" disabled={!answer} onClick={check}>تحقق من الفهم</button>
            ):(
              <div className={`quiz-feedback ${answer===q.correct?'good':'review'}`}>
                <b>{answer===q.correct?'إجابة صحيحة':'نحتاج مراجعة المتطلب السابق'}</b>
                <p>{answer===q.correct?q.good:q.review}</p>
                <div className="diagnostic-next">
                  {index<QUESTIONS.length-1?(
                    <button type="button" className="quiz-submit" onClick={next}>السؤال التالي ←</button>
                  ):(
                    <button type="button" className="quiz-submit" onClick={next}>عرض النتيجة ←</button>
                  )}
                </div>
              </div>
            )}
          </section>
        ):(
          <section className="quiz-shell os-card">
            <header><span>نتيجة التشخيص</span><b>{score}/{QUESTIONS.length}</b></header>
            <h2>{score>=2?'أساس جيد — أكمل بالتدريب':'لنراجع المفاهيم الأساسية أولًا'}</h2>
            <p>تم حفظ مؤشرات الفهم (الإجابة، نوع الخطأ، المهارة). اختر خطوتك التالية.</p>
            <div className="diagnostic-next">
              <a href="/lesson">افتح الدرس التفاعلي</a>
              <a href="/assessment">اختبار إتقان</a>
              <a href="/tutor">اسأل المعلم الذكي</a>
              <a href="/student-portal">عودة للوحة الطالب</a>
            </div>
          </section>
        )}

        <aside className="diagnostic-note">
          <b>ما نسجله:</b> الإجابة، زمن الاستجابة، الثقة، نوع الخطأ، المهارة والمعيار—وليس الدرجة فقط.
        </aside>
      </main>
    </div>
  );
}
