'use client';
import { useState } from 'react';
import { InnerNav } from '../components';
import { S4S_CONTACT } from '../data/s4s-catalog';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.includes('@') || !form.message.trim()) return;
    try {
      const saved = JSON.parse(localStorage.getItem('success-os-contact') || '[]');
      localStorage.setItem(
        'success-os-contact',
        JSON.stringify([{ ...form, at: new Date().toISOString() }, ...saved].slice(0, 20)),
      );
    } catch {}
    setSent(true);
  }

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav />
      <main className="os-page-content">
        <header className="gateway-title">
          <span>CONTACT SUCCESS OS</span>
          <h1>تواصل معنا</h1>
          <p>فريق Success 4 Sure يخدم عمّان ودبي والعالم أونلاين.</p>
        </header>
        <div className="checkout-layout" style={{ marginTop: 24 }}>
          <section>
            <h2>أرسل رسالة</h2>
            {sent ? (
              <div className="form-success">
                <b>✓ تم حفظ رسالتك محليًا</b>
                <p>للتواصل المباشر استخدم البريد أو الموقع الرسمي أدناه.</p>
                <a href={`mailto:${S4S_CONTACT.email}`}>راسلنا بالبريد ←</a>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
                <label>
                  الاسم
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </label>
                <label>
                  البريد
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </label>
                <label>
                  الرسالة
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  />
                </label>
                <button className="os-primary" type="submit">
                  إرسال ←
                </button>
              </form>
            )}
          </section>
          <aside>
            <small>DIRECT CHANNELS</small>
            <h2>قنوات التواصل</h2>
            <div>
              <span>البريد</span>
              <b>
                <a href={`mailto:${S4S_CONTACT.email}`}>{S4S_CONTACT.email}</a>
              </b>
            </div>
            <div>
              <span>الموقع</span>
              <b>
                <a href={S4S_CONTACT.website} target="_blank" rel="noreferrer">
                  success4sureacademy.com
                </a>
              </b>
            </div>
            <div>
              <span>Instagram</span>
              <b>
                <a href={S4S_CONTACT.instagram} target="_blank" rel="noreferrer">
                  @success4surejo
                </a>
              </b>
            </div>
            <div>
              <span>المواقع</span>
              <b>{S4S_CONTACT.locations.join(' • ')}</b>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
