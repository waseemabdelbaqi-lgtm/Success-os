import { InnerNav } from '../components';

export default function AdminPage() {
  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav />
      <main className="os-page-content">
        <div className="os-page-head">
          <span className="tag">ADMIN & SAFETY OPERATIONS</span>
          <h1>مركز تشغيل يضع الثقة قبل النمو</h1>
          <p>
            قوائم مراجعة وموافقات وسجل تدقيق واستجابة للحوادث، مع فصل الصلاحيات وعدم الاعتماد على
            الذكاء وحده.
          </p>
        </div>

        <section className="os-card admin-card" style={{ marginBottom: '1rem', background: 'linear-gradient(135deg,#4b0a11,#9e1722)', color: '#fff' }}>
          <span style={{ color: '#f2d77c' }}>SUPER ADMIN · HIGHEST OS LAYER</span>
          <h2 style={{ color: '#fff' }}>لوحة المشرف — إدارة نظام التشغيل</h2>
          <p style={{ color: 'rgba(255,255,255,0.88)' }}>
            أعلى طبقة تحكم في SUCCESS OS: صحة النظام، الصلاحيات، ERP، البوابات، المحتوى، المالية،
            والتدقيق من غرفة واحدة.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <a className="button" href="/dashboard/super-admin" style={{ background: '#fff', color: '#9e1722' }}>
              افتح لوحة المشرف →
            </a>
            <a className="button" href="/dashboard/employees" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)' }}>
              لوحات الموظفين →
            </a>
          </div>
        </section>

        <section className="os-card admin-card" style={{ marginBottom: '1rem' }}>
          <span>EMPLOYEES OS</span>
          <h2>لوحات الموظفين — أعلى مستوى تشغيل</h2>
          <p>
            غرفة تحكم دوائر الشركة: الموارد البشرية، المالية، القانونية، التقنية، التسويق، المحتوى،
            الأكاديميا، والدعم — مع لوحة الموظف الشخصية.
          </p>
          <a className="button" href="/dashboard/employees">
            افتح لوحات الموظفين →
          </a>
        </section>

        <section className="os-card admin-card" style={{ marginBottom: '1rem' }}>
          <span>ADMIN-01</span>
          <h2>Enterprise Admin Dashboard</h2>
          <p>
            Live enterprise control center — users, finance, academic metrics, CRUD modules, and
            permissions. All statistics load from the database (no hardcoded KPIs).
          </p>
          <a className="button" href="/dashboard/admin">
            Open Enterprise Admin →
          </a>
        </section>

        <div className="admin-grid">
          <article className="os-card admin-card">
            <span>JO</span>
            <h2>تغطية المنهاج الأردني</h2>
            <p>الصفوف والمواد والوحدات والدروس ونسبة التحقق.</p>
            <a className="button" href="/admin/jordan-curriculum">
              فتح لوحة الأردن
            </a>
          </article>
          <article className="os-card admin-card">
            <span>JO-01.4</span>
            <h2>Knowledge Graph</h2>
            <p>Educational relationships for Grade 1.</p>
            <a className="button" href="/admin/jordan-grade1-knowledge-graph">
              Open Knowledge Graph
            </a>
          </article>
          <article className="os-card admin-card">
            <span>JO-01.2</span>
            <h2>Grade 1 Ecosystem</h2>
            <p>Complete learning ecosystem production status.</p>
            <a className="button" href="/admin/jordan-grade1-learning-ecosystem">
              Open G1 Ecosystem
            </a>
          </article>
          <article className="os-card admin-card">
            <span>JO-10</span>
            <h2>National Registry</h2>
            <p>Jordan National Education Registry.</p>
            <a className="button" href="/admin/jordan-national-education-registry">
              Open Registry
            </a>
          </article>
        </div>
      </main>
    </div>
  );
}
