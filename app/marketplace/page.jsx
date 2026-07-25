'use client';
import { InnerNav } from '../components';
import { MARKETPLACE_CATEGORIES } from '../data/s4s-catalog';

export default function MarketplacePage() {
  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="programs" />
      <main className="os-page-content">
        <header className="gateway-title">
          <span>SUCCESS OS MARKETPLACE</span>
          <h1>السوق التعليمي والمهني</h1>
          <p>معلمون، دورات، كتب، مراكز، قبول جامعي ووظائف — كلها من بوابات مترابطة داخل SUCCESS OS.</p>
        </header>
        <section className="knowledge-module-grid" style={{ marginTop: 24 }}>
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <article key={cat.id}>
              <small>{cat.id.toUpperCase()}</small>
              <h2>{cat.titleAr}</h2>
              <p>{cat.descAr}</p>
              <a href={cat.href}>افتح القسم ←</a>
            </article>
          ))}
        </section>
        <div className="gateway-help" style={{ marginTop: 28 }}>
          <div>
            <span>◎</span>
            <div>
              <small>NEXT STEP</small>
              <h3>ابدأ من رحلة واضحة حسب دورك</h3>
            </div>
          </div>
          <a href="/start-journey">ابدأ الرحلة ←</a>
        </div>
      </main>
    </div>
  );
}
