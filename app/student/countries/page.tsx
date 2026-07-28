"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Global-ready student country navigation.
 * Only countries with student_visible=1 appear as active.
 */
export default function StudentCountriesPage() {
  const [countries, setCountries] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/global-curriculum?view=status");
      const d = await r.json();
      setCountries(d.countries || []);
    })();
  }, []);

  const active = countries.filter((c) => Number(c.student_visible) === 1 && c.status === "active");
  const inactive = countries.filter((c) => !(Number(c.student_visible) === 1 && c.status === "active"));

  return (
    <main dir="rtl" lang="ar" style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto", fontFamily: '"IBM Plex Sans Arabic", Tahoma, sans-serif' }}>
      <p>بوابة الطالب · المواد المدرسية · الدولة</p>
      <h1>اختر الدولة</h1>
      <p>الأردن مفعّل حالياً. الدول الأخرى تظهر فقط بعد التحقق الرسمي والموافقة — بلا كتب وهمية.</p>

      <section>
        <h2>دول مفعّلة</h2>
        <ul>
          {active.map((c) => (
            <li key={String(c.id)}>
              <Link href="/jordan-books">
                {String(c.flag_emoji || "")} {String(c.name_ar || c.name_en)} — المنهاج الوطني
              </Link>
              {" · "}
              <Link href="/interactive-books">الكتب التفاعلية</Link>
            </li>
          ))}
          {active.length === 0 && <li>لا توجد دول مفعّلة بعد — شغّل مسار Gate 3 لزرع الأردن.</li>}
        </ul>
      </section>

      <section>
        <h2>قريباً بعد التحقق الرسمي</h2>
        <ul>
          {inactive.map((c) => (
            <li key={String(c.id)}>
              {String(c.name_en)} — Coming after official verification ({String(c.status)})
            </li>
          ))}
          {inactive.length === 0 && <li>لا توجد دول قيد الإعداد حالياً.</li>}
        </ul>
      </section>
    </main>
  );
}
