'use client';
import { useEffect, useState } from 'react';
import { InnerNav } from '../components';

export default function SettingsPage() {
  const [prefs, setPrefs] = useState({ lang: 'ar', notify: true, theme: 'light' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('success-os-settings') || 'null');
      if (raw) setPrefs((p) => ({ ...p, ...raw }));
    } catch {}
  }, []);

  function save(e) {
    e.preventDefault();
    localStorage.setItem('success-os-settings', JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav />
      <main className="os-page-content">
        <header className="gateway-title">
          <span>ACCOUNT SETTINGS</span>
          <h1>الإعدادات</h1>
          <p>تفضيلات اللغة والإشعارات والمظهر — تُحفظ على هذا الجهاز.</p>
        </header>
        <form
          onSubmit={save}
          className="directory-filter"
          style={{ marginTop: 24, display: 'grid', gap: 14, maxWidth: 560 }}
        >
          <label>
            اللغة
            <select value={prefs.lang} onChange={(e) => setPrefs({ ...prefs, lang: e.target.value })}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            المظهر
            <select value={prefs.theme} onChange={(e) => setPrefs({ ...prefs, theme: e.target.value })}>
              <option value="light">فاتح (Success OS)</option>
              <option value="system">حسب الجهاز</option>
            </select>
          </label>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={prefs.notify}
              onChange={(e) => setPrefs({ ...prefs, notify: e.target.checked })}
            />
            تفعيل إشعارات التذكير التعليمية
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="os-primary" type="submit">
              حفظ الإعدادات
            </button>
            <a className="button ghost" href="/student/settings">
              إعدادات بوابة الطالب
            </a>
            <a className="button ghost" href="/profile">
              الملف الشخصي
            </a>
          </div>
          {saved && <em style={{ color: '#9e1722' }}>✓ تم الحفظ</em>}
        </form>
      </main>
    </div>
  );
}
