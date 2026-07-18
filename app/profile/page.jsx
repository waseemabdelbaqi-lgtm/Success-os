"use client";
import { useEffect, useState } from "react";
import { InnerNav } from "../components";
const roles = {
  student: [
    "◉",
    "صفحة الطالب",
    "تعلم وحصص ومدارس وقبول جامعي في رحلة مستقلة",
    ["الخطة الحالية", "الحصص المحجوزة", "طلبات المدارس", "طلبات القبول"],
  ],
  teacher: [
    "♙",
    "صفحة المعلم",
    "المحتوى والحصص والأسعار والشراكة",
    ["حصصي", "المحتوى المرفوع", "الطلاب", "الأرباح"],
  ],
  center: [
    "▦",
    "صفحة المركز التعليمي",
    "البرامج والمعلمون والاشتراكات",
    ["البرامج", "المعلمون", "الطلاب", "المدفوعات"],
  ],
  school: [
    "⌂",
    "صفحة المدرسة",
    "الصفوف والرسوم وطلبات الالتحاق",
    ["الصفوف", "الرسوم", "طلبات الالتحاق", "التقارير"],
  ],
  university: [
    "🎓",
    "صفحة الجامعة أو الكلية",
    "البرامج والشروط وطلبات الطلاب",
    ["البرامج", "شروط المحلي", "شروط الدولي", "طلبات القبول"],
  ],
  employer: [
    "↗",
    "صفحة شركة التوظيف",
    "الوظائف والمرشحون والمقابلات",
    ["الوظائف", "المطابقات", "المقابلات", "العروض"],
  ],
  jobseeker: [
    "◇",
    "صفحة الباحث عن العمل",
    "المهارات والطلبات والمقابلات",
    ["ملف المهارات", "الوظائف المناسبة", "طلباتي", "المقابلات"],
  ],
};
export default function ProfilePage() {
  const [role, setRole] = useState("student");
  useEffect(() => {
    const r = new URLSearchParams(location.search).get("role");
    if (roles[r]) setRole(r);
  }, []);
  const [icon, title, text, tabs] = roles[role];
  const dashboardRole =
    {
      student: "student",
      center: "institution",
      school: "institution",
      university: "institution",
    }[role] || role;
  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="profile" />
      <main className="os-page-content profile-page">
        <header className="profile-hero">
          <div className="profile-avatar">{icon}</div>
          <div>
            <small>صفحة مستخدم تجريبية • بدون تسجيل دخول</small>
            <h1>{title}</h1>
            <p>{text}</p>
          </div>
          <a href={role === "jobseeker" ? "/jobs" : role === "student" ? "/student-portal" : `/control-center?role=${dashboardRole}`}>{role === "jobseeker" ? "فتح بوابة الوظائف" : role === "student" ? "فتح بوابة الطالب" : "فتح لوحة التحكم"}</a>
        </header>
        <section className="profile-switch">
          {Object.entries(roles).map(([id, r]) => (
            <button
              className={id === role ? "active" : ""}
              onClick={() => setRole(id)}
              key={id}
            >
              {r[0]} {r[1].replace("صفحة ", "")}
            </button>
          ))}
        </section>
        <section className="profile-layout">
          <aside>
            <small>ملف المستخدم</small>
            <h2>الحساب التجريبي</h2>
            <p>الدولة: الأردن</p>
            <p>اللغة: العربية / English</p>
            <p>حالة التحقق: Demo</p>
            <a href="/access">تحديث بيانات البوابة</a>
          </aside>
          <div className="profile-main">
            <section className="profile-stats">
              {[
                ["3", "إجراءات مفتوحة"],
                ["72%", "اكتمال الملف"],
                ["2", "مواعيد قادمة"],
                ["1", "تنبيه يحتاج مراجعة"],
              ].map(([n, l]) => (
                <article key={l}>
                  <b>{n}</b>
                  <span>{l}</span>
                </article>
              ))}
            </section>
            <section className="profile-tabs">
              {tabs.map((x, i) => (
                <article key={x}>
                  <span>{["▦", "✓", "⌁", "↗"][i]}</span>
                  <h2>{x}</h2>
                  <p>
                    {i === 0
                      ? "عرض العناصر الحالية وإضافة جديد."
                      : "تظهر هنا البيانات المصرح بها لهذا المستخدم فقط."}
                  </p>
                  <button>فتح ←</button>
                </article>
              ))}
            </section>
            <section className="connected-journey">
              <h2>الصفحات المرتبطة</h2>
              <div>
                <a href="/world">الدولة والنظام التعليمي</a>
                <a href="/global-sources">مصادر الجامعات الرسمية</a>
                <a href="/subject-catalog">المواد المدرسية</a>
                <a href="/university-subjects">المواد الجامعية</a>
                <a href="/content-studio">استوديو المحتوى</a>
                <a href="/security-center">مركز الحماية</a>
                <a href="/degree-finder">الدرجات والاعتراف</a>
                <a href="/admissions">القبول الجامعي</a>
                <a href="/exam-calendar">رزنامة الاختبارات</a>
                <a href="/rankings">التصنيفات</a>
                <a href="/jobs">الوظائف</a>
                <a href="/passport">الجواز التعليمي</a>
                <a href="/notifications">الإشعارات</a>
                <a href="/control-center">مركز التحكم</a>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
