'use client';
import { InnerNav } from '../components';
import { S4S_BOOKS } from '../data/s4s-catalog';

export default function BooksPage() {
  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="programs" />
      <main className="os-page-content">
        <header className="gateway-title">
          <span>SUCCESS 4 SURE BOOKS</span>
          <h1>مكتبة الكتب والحقائب التعليمية</h1>
          <p>حقائب تدريب وكتب مساندة لمسارات SAT وEST وAP وIGCSE — قابلة للفتح من بوابة الطالب.</p>
        </header>
        <section className="knowledge-module-grid" style={{ marginTop: 24 }}>
          {S4S_BOOKS.map((book) => (
            <article key={book.id}>
              <small>{book.track}</small>
              <h2>{book.titleAr}</h2>
              <p>{book.title}</p>
              <a href={book.href}>افتح مكتبة الطالب ←</a>
            </article>
          ))}
        </section>
        <footer style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className="os-primary" href="/student/books">
            مكتبة الطالب
          </a>
          <a className="button ghost" href="/marketplace">
            السوق التعليمي
          </a>
          <a className="button ghost" href="https://www.success4sureacademy.com/" target="_blank" rel="noreferrer">
            Success 4 Sure
          </a>
        </footer>
      </main>
    </div>
  );
}
