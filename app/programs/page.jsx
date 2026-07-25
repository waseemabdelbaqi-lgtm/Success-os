import { InnerNav } from '../components';
import { S4S_PROGRAMS } from '../data/s4s-catalog';

const programs=[
  {id:'ap',icon:'⚛',title:'AP Physics',desc:'مسارات تفاعلية للفيزياء مع تشخيص وإتقان وأسئلة موجهة.',tags:['AP Physics 1','AP Physics C']},
  {id:'ap-chem',icon:'◈',title:'AP Chemistry',desc:'تعلم مبني على المفاهيم والتجارب وتحليل الأخطاء.',tags:['AP Chemistry','Labs']},
  {id:'est',icon:'Σ',title:'EST & ACT',desc:'تحضير متخصص لامتحانات المواد الدولية في مصر والمنطقة.',tags:['EST II','ACT Subject Tests']},
  {id:'sat',icon:'⌁',title:'SAT',desc:'بناء درجة SAT مع تدريب ومراجعات من Success 4 Sure.',tags:['SAT Math','Evidence-Based Reading']},
  {id:'igcse',icon:'∿',title:'IGCSE',desc:'مسارات Cambridge وEdexcel للفيزياء والكيمياء.',tags:['O Level','IGCSE']},
  {id:'a-level',icon:'∆',title:'A Level',desc:'تعلم عميق وموجه لطلاب AS وA2 مع تتبع المهارات.',tags:['AS Physics','A2 Chemistry']},
  {id:'ib',icon:'◐',title:'IB',desc:'دعم مواد البكالوريا الدولية والتدريب على الامتحانات.',tags:['IB Diploma','Exam coaching']},
  {id:'toefl',icon:'✦',title:'Languages',desc:'TOEFL وIELTS للقبول الجامعي والانتقال الدولي.',tags:['TOEFL','IELTS']},
];

export default function ProgramsPage(){
  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="programs"/>
      <main className="os-page-content">
        <header className="os-page-head">
          <span className="tag">المسارات الأكاديمية</span>
          <h1>اختر منهاجك. والنظام يبني طريقك.</h1>
          <p>كل طالب يبدأ من مستواه الحقيقي، وليس من أول صفحة في الكتاب. التشخيص يحدد الفجوات ثم ينشئ خطة تعلم قابلة للتعديل. المحتوى مستند إلى برامج Success 4 Sure (SAT / EST / ACT / AP / IGCSE).</p>
        </header>
        <div className="programs-grid">
          {programs.map((p)=>(
            <article className="os-card program-card" id={p.id} key={p.id}>
              <span className="program-icon">{p.icon}</span>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <div className="program-tags">{p.tags.map(t=><span key={t}>{t}</span>)}</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <a href={`/start-journey?portal=student&program=${encodeURIComponent(p.id)}`}>ابدأ المسار ←</a>
                <a href="/courses">عرض الدورات</a>
                <a href="/diagnostic">تشخيص سريع</a>
              </div>
            </article>
          ))}
        </div>
        <section className="programs-s4s-index" style={{marginTop:28}}>
          <header>
            <small>FROM SUCCESS 4 SURE</small>
            <h2>فهارس البرامج التفصيلية</h2>
          </header>
          <div className="knowledge-module-grid" style={{marginTop:16}}>
            {S4S_PROGRAMS.flatMap((g)=>g.items.map((item)=>(
              <article key={item.id} id={item.id}>
                <small>{g.groupAr}</small>
                <h3>{item.name}</h3>
                <p>{item.blurbAr}</p>
                <a href={`/start-journey?portal=student&program=${encodeURIComponent(item.id)}`}>ابدأ ←</a>
              </article>
            )))}
          </div>
        </section>
        <div className="gateway-help" style={{marginTop:28}}>
          <div>
            <span>◎</span>
            <div>
              <small>MARKETPLACE</small>
              <h3>كتب ودورات ومعلمون في مكان واحد</h3>
            </div>
          </div>
          <a href="/marketplace">افتح السوق ←</a>
        </div>
      </main>
    </div>
  );
}
