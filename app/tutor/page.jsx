'use client';
import { useState } from 'react';
import { InnerNav } from '../components';

const PROMPTS = {
  explain: {
    user: 'اشرحها بطريقة ثانية',
    ai: 'فكّر بالدائرة كمضخة ماء: البطارية تضخ الضغط (V)، والمقاومة تضيّق الأنبوب (R)، والتيار هو كمية الماء التي تمر (I). إذن I = V / R. جرّب الآن: إذا زاد الجهد مع ثبات المقاومة، ماذا يحدث للتيار؟',
  },
  similar: {
    user: 'أعطني سؤالًا مشابهًا',
    ai: 'سؤال مشابه: بطارية 9 V موصولة بمقاومة 3 Ω. احسب التيار، ثم فكّر: لو ضاعفنا المقاومة فقط، هل يتضاعف التيار أم ينخفض إلى النصف؟ اكتب خطواتك قبل النتيجة.',
  },
  hint: {
    user: 'أحتاج تلميحًا فقط',
    ai: 'تلميح فقط: رتّب القانون حول الكمية المجهولة. لديك V و R — فالكمية المطلوبة غالبًا I. لا تحسب بعد؛ اكتب القانون أولًا.',
  },
};

export default function TutorPage(){
  const [text,setText]=useState('');
  const [messages,setMessages]=useState([]);

  function pushExchange(user, ai){
    setMessages(m=>[...m,{user,ai}]);
  }

  function ask(e){
    e.preventDefault();
    if(!text.trim())return;
    pushExchange(
      text,
      'ممتاز. قبل ما نعوض بالأرقام، شو القانون الذي يربط فرق الجهد والتيار والمقاومة؟ اكتب القانون بطريقتك وأنا أكمل معك خطوة بخطوة.'
    );
    setText('');
  }

  function quick(key){
    const item=PROMPTS[key];
    if(!item)return;
    pushExchange(item.user, item.ai);
  }

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="tutor"/>
      <main className="os-page-content">
        <header className="os-page-head">
          <span className="tag">SUCCESS AI TUTOR</span>
          <h1>اسأل. فكّر. افهم.</h1>
          <p>معلم ذكي يساعدك حسب منهاجك ومستواك، يعطيك تلميحات ويكتشف الخطأ في فهمك بدون ما يرمي الحل مباشرة.</p>
        </header>
        <div className="tutor-layout">
          <section className="os-card tutor-main">
            <div className="tutor-head">
              <span className="tutor-ai">✦</span>
              <div>
                <strong>المعلم الذكي للفيزياء</strong>
                <small>مرتبط بخطتك ودرس الدوائر الكهربائية</small>
              </div>
              <span className="tutor-mode">● وضع التعلم الموثق</span>
            </div>
            <div className="tutor-messages">
              <div className="tutor-bubble user">بطارية 12 V موصولة بمقاومة 4 Ω. من وين أبدأ؟</div>
              <div className="tutor-bubble ai">
                ابدأ بتحديد المعطيات: فرق الجهد V = 12 V والمقاومة R = 4 Ω. الآن ما هي الكمية المطلوبة؟ وهل تتذكر قانون أوم؟
                <small>المصدر: الدوائر الكهربائية • قانون أوم • Edexcel AS Physics</small>
              </div>
              {messages.map((m,i)=>(
                <span key={i} style={{display:'contents'}}>
                  <div className="tutor-bubble user">{m.user}</div>
                  <div className="tutor-bubble ai">{m.ai}<small>إرشاد تعليمي مبني على سياق الدرس</small></div>
                </span>
              ))}
            </div>
            <form className="tutor-input" onSubmit={ask}>
              <input value={text} onChange={e=>setText(e.target.value)} placeholder="اكتب سؤالك في الفيزياء أو الكيمياء..."/>
              <button type="submit">↑</button>
            </form>
          </section>
          <aside className="os-card tutor-context">
            <h3>سياق تعلمك الحالي</h3>
            <Context icon="⚡" title="الدرس" text="الشحنة والتيار"/>
            <Context icon="◎" title="الهدف" text="إتقان الدوائر قبل 20 يوليو"/>
            <Context icon="◈" title="مستوى الإتقان" text="61% • يحتاج تدريب"/>
            <div className="tutor-actions">
              <button type="button" onClick={()=>quick('explain')}>اشرحها بطريقة ثانية</button>
              <button type="button" onClick={()=>quick('similar')}>أعطني سؤالًا مشابهًا</button>
              <button type="button" onClick={()=>quick('hint')}>أحتاج تلميحًا فقط</button>
              <a href="/teachers">حوّلني لمعلم حقيقي</a>
              <a href="/class-booking">احجز حصة مباشرة</a>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Context({icon,title,text}){
  return <div className="context-item"><span>{icon}</span><div><strong>{title}</strong><small>{text}</small></div></div>;
}
