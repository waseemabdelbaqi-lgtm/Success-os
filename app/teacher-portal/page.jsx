import { InnerNav } from '../components';

const students=[
  ['سارة أحمد','Charge & Current','72%','يحتاج ملاحظة'],
  ['عمر خالد','Atomic Structure','88%','يتقدم جيدًا'],
  ['لين محمد','Mole Concept','61%','حصة مقترحة'],
  ['يوسف علي','Kinematics','94%','جاهز للإتقان'],
];

export default function TeacherPortalPage(){
  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="teacher-portal"/>
      <main className="os-page-content">
        <div className="os-page-head">
          <span className="tag">TEACHER PORTAL</span>
          <h1>المعلم يرى أين يتدخل، وليس مجرد درجات</h1>
          <p>لوحة صف مبنية على المفاهيم والأخطاء والأدلة، مع اعتماد بشري للمحتوى ونتائج الذكاء.</p>
          <div className="portal-primary-actions">
            <a href="/content-studio">إنشاء نشاط</a>
            <a href="/notifications">جلساتي ورسائلي</a>
            <a href="/control-center?role=teacher">لوحة التحكم</a>
            <a href="/class-booking">حجز طالب لجلسة</a>
          </div>
        </div>
        <div className="portal-stats">
          <Metric n="24" t="طالب نشط"/>
          <Metric n="7" t="يحتاجون تدخلًا"/>
          <Metric n="18" t="مهمة للمراجعة"/>
          <Metric n="3" t="جلسات اليوم"/>
        </div>
        <section className="os-card student-table">
          <header>
            <h2>أولوية التدخل</h2>
            <a className="table-action" href="/content-studio">إنشاء نشاط</a>
          </header>
          {students.map(([name,unit,score,status])=>(
            <div className="student-row" key={name}>
              <span className="student-dot">{name[0]}</span>
              <b>{name}</b>
              <span>{unit}</span>
              <strong>{score}</strong>
              <em>{status}</em>
              <a href={`/profile?role=student&focus=${encodeURIComponent(name)}`}>فتح الملف</a>
            </div>
          ))}
        </section>
        <section className="portal-secondary-actions">
          <a href="/security-center">سياسات حماية المحتوى</a>
          <a href="/join-us?role=teacher">تحديث ملف الشراكة</a>
          <a href="/teachers">سوق المعلمين</a>
        </section>
      </main>
    </div>
  );
}

function Metric({n,t}){return <div><b>{n}</b><span>{t}</span></div>}
