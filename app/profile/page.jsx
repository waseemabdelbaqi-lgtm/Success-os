"use client";
import { useEffect, useState } from "react";
import { InnerNav } from "../components";

const roles = {
  student: [
    "◉",
    "صفحة الطالب",
    "تعلم وحصص ومدارس وقبول جامعي في رحلة مستقلة",
    [
      ["الخطة الحالية", "/student-journey"],
      ["الحصص المحجوزة", "/class-booking"],
      ["طلبات المدارس", "/school-finder"],
      ["طلبات القبول", "/admissions"],
    ],
  ],
  teacher: [
    "♙",
    "صفحة المعلم",
    "المحتوى والحصص والأسعار والشراكة",
    [
      ["حصصي", "/teacher-portal"],
      ["المحتوى المرفوع", "/content-studio"],
      ["الطلاب", "/class-booking"],
      ["الأرباح", "/control-center?role=teacher"],
    ],
  ],
  center: [
    "▦",
    "صفحة المركز التعليمي",
    "البرامج والمعلمون والاشتراكات",
    [
      ["البرامج", "/control-center?role=institution&portal=center"],
      ["المعلمون", "/teachers"],
      ["الطلاب", "/partner-search?portal=center"],
      ["المدفوعات", "/control-center?role=institution&portal=center"],
    ],
  ],
  school: [
    "⌂",
    "صفحة المدرسة",
    "الصفوف والرسوم وطلبات الالتحاق",
    [
      ["الصفوف", "/control-center?role=institution&portal=school"],
      ["الرسوم", "/school-finder"],
      ["طلبات الالتحاق", "/control-center?role=institution&portal=school"],
      ["التقارير", "/control-center?role=institution&portal=school"],
    ],
  ],
  university: [
    "🎓",
    "صفحة الجامعة أو الكلية",
    "البرامج والشروط وطلبات الطلاب",
    [
      ["البرامج", "/admissions"],
      ["شروط المحلي", "/degree-finder"],
      ["شروط الدولي", "/eligibility-check"],
      ["طلبات القبول", "/application-tracker"],
    ],
  ],
  employer: [
    "↗",
    "صفحة شركة التوظيف",
    "الوظائف والمرشحون والمقابلات",
    [
      ["الوظائف", "/jobs?view=companies"],
      ["المطابقات", "/jobs"],
      ["المقابلات", "/application-tracker"],
      ["العروض", "/control-center?role=employer"],
    ],
  ],
  jobseeker: [
    "◇",
    "صفحة الباحث عن العمل",
    "المهارات والطلبات والمقابلات",
    [
      ["ملف المهارات", "/jobseeker-portal"],
      ["الوظائف المناسبة", "/jobs"],
      ["طلباتي", "/application-tracker"],
      ["المقابلات", "/profile?role=jobseeker"],
    ],
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
  const heroHref =
    role === "jobseeker"
      ? "/jobs"
      : role === "student"
        ? "/student-portal"
        : role === "teacher"
          ? "/teacher-portal"
          : role === "employer"
            ? "/jobs?view=companies"
            : `/control-center?role=${dashboardRole}`;
  const heroLabel =
    role === "jobseeker"
      ? "فتح بوابة الوظائف"
      : role === "student"
        ? "فتح بوابة الطالب"
        : role === "teacher"
          ? "فتح بوابة المعلم"
          : "فتح لوحة التحكم";

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
          <a href={heroHref}>{heroLabel}</a>
        </header>
        <section className="profile-switch">
          {Object.entries(roles).map(([id, r]) => (
            <button
              type="button"
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
            <a href={`/access?portal=${role}`}>تحديث بيانات البوابة</a>
            <a href="/settings">إعدادات المنصة</a>
            <a href="/login">تسجيل الدخول</a>
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
              {tabs.map(([label, href], i) => (
                <article key={label}>
                  <span>{["▦", "✓", "⌁", "↗"][i]}</span>
                  <h2>{label}</h2>
                  <p>
                    {i === 0
                      ? "عرض العناصر الحالية وإضافة جديد."
                      : "تظهر هنا البيانات المصرح بها لهذا المستخدم فقط."}
                  </p>
                  <a href={href}>فتح ←</a>
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
                <a href="/courses">دورات Success 4 Sure</a>
                <a href="/marketplace">السوق التعليمي</a>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
