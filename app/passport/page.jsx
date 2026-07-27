import { InnerNav, Brand } from '../components';

export default function PassportPage(){
  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="passport"/>
      <main className="os-page-content">
        <header className="os-page-head">
          <span className="tag">EDUCATION PASSPORT</span>
          <h1>جوازك التعليمي مدى الحياة</h1>
          <p>سجل موثّق لمهاراتك وتقدمك ومشاريعك وشهاداتك. أنت تحدد من يستطيع رؤيته ومتى.</p>
        </header>
        <section className="passport-page-card">
          <div className="passport-id-head">
            <Brand/>
            <span style={{fontSize:9,color:'#91a8bb'}}>EDU ID<br/><b style={{color:'#fff'}}>000 147 82</b></span>
          </div>
          <div className="passport-owner">
            <span className="big-avatar">WA</span>
            <div>
              <small>المتعلم</small>
              <h2>وسيم عبد الباقي</h2>
              <small>البرامج الدولية • Physics & Chemistry</small>
            </div>
          </div>
          <div className="passport-badges">
            <div><b>12</b><span>مهارة موثقة</span></div>
            <div><b>7</b><span>اختبارات مكتملة</span></div>
            <div><b>3</b><span>أدلة من معلمين</span></div>
            <div><b>72%</b><span>متوسط الإتقان</span></div>
          </div>
          <div className="passport-actions">
            <a href="/assessment">أضف دليل إتقان</a>
            <a href="/diagnostic">حدّث التشخيص</a>
            <a href="/dashboard">لوحتي التعليمية</a>
            <a href="/student-portal">بوابة الطالب</a>
            <a href="/profile">إعدادات المشاركة</a>
          </div>
        </section>
        <div className="passport-grid">
          <section className="os-card passport-detail">
            <h3>المهارات والإتقان</h3>
            <Skill name="الميكانيكا" score="84%"/>
            <Skill name="الكهرباء والدوائر" score="61%"/>
            <Skill name="الموجات" score="46%"/>
            <Skill name="التركيب الذري" score="68%"/>
            <a href="/lesson">افتح درسًا للمهارة الأضعف ←</a>
          </section>
          <section className="os-card passport-detail">
            <h3>أحدث الأدلة</h3>
            <Evidence icon="✓" title="اختبار قانون أوم" meta="8/10 • 10 يوليو 2026" status="موثق"/>
            <Evidence icon="⚡" title="قراءة منحنيات I–V" meta="دليل أداء • Edexcel AS" status="جديد"/>
            <Evidence icon="♙" title="ملاحظة معلم" meta="جلسة مراجعة مباشرة" status="موثق"/>
            <a href="/teachers">اطلب ملاحظة معلم حقيقي ←</a>
          </section>
        </div>
      </main>
    </div>
  );
}

function Skill({name,score}){
  return <div className="skill-row"><div><span>{name}</span><b>{score}</b></div><i><em style={{width:score}}></em></i></div>;
}
function Evidence({icon,title,meta,status}){
  return <div className="evidence-row"><span>{icon}</span><div><strong>{title}</strong><small>{meta}</small></div><small>{status}</small></div>;
}
