'use client';
import { InnerNav } from '../components';
import { S4S_COURSES, S4S_PROGRAMS } from '../data/s4s-catalog';

export default function CoursesPage() {
  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="programs" />
      <main className="os-page-content">
        <header className="gateway-title">
          <span>SUCCESS 4 SURE COURSES</span>
          <h1>الدورات الأكثر التحاقًا</h1>
          <p>
            محتوى مستند إلى عروض Success 4 Sure Academy — EST وAP وSAT وACT وIGCSE — مع مسار شراء داخل SUCCESS OS.
          </p>
        </header>
        <section className="knowledge-module-grid" style={{ marginTop: 24 }}>
          {S4S_COURSES.map((course) => (
            <article key={course.id}>
              <small>{course.kindAr}</small>
              <h2>{course.titleAr}</h2>
              <p>{course.subject} • Recorded / live on request</p>
              <a href={course.href}>ابدأ رحلة الشراء ←</a>
            </article>
          ))}
        </section>
        <section style={{ marginTop: 36 }}>
          <header>
            <small>PROGRAM TRACKS</small>
            <h2>المسارات الأكاديمية</h2>
          </header>
          <div className="knowledge-module-grid" style={{ marginTop: 16 }}>
            {S4S_PROGRAMS.flatMap((g) =>
              g.items.map((item) => (
                <article key={item.id}>
                  <small>{g.groupAr}</small>
                  <h2>{item.name}</h2>
                  <p>{item.blurbAr}</p>
                  <a href={`/programs#${item.id}`}>تفاصيل البرنامج ←</a>
                  <a href={`/start-journey?portal=student&studentType=courses&program=${encodeURIComponent(item.id)}`}>ابدأ المسار ←</a>
                </article>
              )),
            )}
          </div>
        </section>
        <div className="gateway-help" style={{ marginTop: 28 }}>
          <div>
            <span>◎</span>
            <div>
              <small>SOURCE</small>
              <h3>محتوى البرامج مستوحى من success4sureacademy.com</h3>
            </div>
          </div>
          <a href="https://www.success4sureacademy.com/" target="_blank" rel="noreferrer">
            الموقع الرسمي ←
          </a>
        </div>
      </main>
    </div>
  );
}
