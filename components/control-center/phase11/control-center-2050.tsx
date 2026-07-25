'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CONTROL_CENTER_GROUPS,
  CONTROL_CENTER_ROLES,
  SERVICE_JOURNEYS,
  isControlCenterRoleId,
  type ControlCenterRoleId,
} from '@/components/control-center/phase11/control-center-role-data';
import { ROLE_CONTROL_ACTIONS } from '@/app/data/control-hubs-catalog';

const NAV_DESTINATIONS: Partial<Record<ControlCenterRoleId, string[]>> = {
  owner: [
    '/control-hubs',
    '/dashboard/admin/students',
    '/control-center?role=academic',
    '/dashboard/admin',
    '/dashboard/admin/finance',
    '/control-center?role=content',
    '/control-center?role=social',
    '/security-center',
  ],
  engineer: [
    '/qa-dashboard',
    '/security-center',
    '/dashboard/admin/system-configuration',
    '/api/v1/portals',
    '/security-center',
    '/dashboard/admin/audit-logs',
  ],
  content: [
    '/content-studio',
    '/dashboard/admin/subjects',
    '/content-studio',
    '/curriculum-lab',
    '/source-registry',
    '/dashboard/admin/ai-content',
  ],
  social: [
    '/dashboard/admin/social-media',
    '/dashboard/admin/marketing',
    '/notifications',
    '/dashboard/admin/sales',
    '/scholarships',
    '/dashboard/admin/reports',
  ],
  academic: [
    '/admissions',
    '/global-sources',
    '/degree-finder',
    '/dashboard/admin/admissions',
    '/dashboard/admin/scholarships',
    '/rankings',
  ],
  houseTeacher: [
    '/teacher-portal',
    '/content-studio',
    '/class-booking',
    '/dashboard/admin/teachers',
    '/study-content-generator',
  ],
  teacher: [
    '/teacher-portal',
    '/class-booking',
    '/content-studio',
    '/dashboard/teacher',
    '/teachers',
    '/notifications',
  ],
  institution: [
    '/dashboard/university',
    '/admissions',
    '/degree-finder',
    '/dashboard/admin/universities',
    '/dashboard/admin/admissions',
    '/control-hubs',
  ],
  employer: [
    '/jobs',
    '/dashboard/employer',
    '/jobs/companies',
    '/jobseeker-portal',
    '/dashboard/admin/employers',
  ],
  student: [
    '/student-portal',
    '/student/dashboard',
    '/admissions',
    '/degree-finder',
    '/passport',
    '/tutor',
  ],
};

export function ControlCenter2050() {
  const [role, setRole] = useState<ControlCenterRoleId>('owner');
  const [assistant, setAssistant] = useState(true);
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState('');
  const [dark, setDark] = useState(false);
  const [activeNav, setActiveNav] = useState(0);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('role');
    if (isControlCenterRoleId(requested)) setRole(requested);
  }, []);

  const current = CONTROL_CENTER_ROLES[role];
  const [icon, title, name, subtitle, nav, stats, tasks, ai, hint] = current;
  const controlActions = ROLE_CONTROL_ACTIONS[role] || [];
  const navLinks = NAV_DESTINATIONS[role] || [];

  const activity = useMemo(
    () =>
      role === 'social'
        ? [
            [
              'تحقق مطلوب',
              'منحة جامعة بيكنت — 4,500$',
              'لا يوجد مصدر رسمي مرفق',
            ],
            ['عميل محتمل', 'استفسار EST مصر', 'من Instagram'],
            ['محتوى', 'ريل AP Chemistry جاهز', 'بانتظار اعتماد'],
          ]
        : [
            ['تحديث', 'تم تحديث مؤشر الأداء', 'قبل 8 دقائق'],
            ['موافقة', 'عنصر جديد ينتظر قرارك', 'قبل 21 دقيقة'],
            ['تنبيه', 'مهمة تجاوزت موعدها', 'قبل ساعة'],
          ],
    [role],
  );

  function selectRole(next: ControlCenterRoleId) {
    setRole(next);
    setReply('');
    setActiveNav(0);
    const url = new URL(window.location.href);
    url.searchParams.set('role', next);
    window.history.replaceState({}, '', url);
  }

  function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    setReply(
      `حسب صلاحية ${title}: سأستخدم بيانات هذا الدور فقط وأعرض المصدر وأي قرار يحتاج موافقة بشرية.`,
    );
    setQuestion('');
  }

  return (
    <div className={`p11-shell p11-cc ${dark ? 'p11-dark' : ''}`} dir="rtl">
      <aside className="p11-sidebar p11-cc-side">
        <a className="p11-cc-brand" href="/">
          <span>S</span>
          <div>
            <b>SUCCESS OS</b>
            <small>CONTROL CENTER 2050</small>
          </div>
        </a>

        {CONTROL_CENTER_GROUPS.map(([label, items]) => (
          <div className="p11-cc-role-group" key={label}>
            <small>{label}</small>
            {items.map(([id, itemLabel]) => (
              <button
                key={id}
                type="button"
                className={`p11-nav-item ${role === id ? 'active' : ''}`}
                onClick={() => selectRole(id)}
              >
                <span aria-hidden>{CONTROL_CENTER_ROLES[id][0]}</span>
                {itemLabel}
              </button>
            ))}
          </div>
        ))}

        <div className="p11-glass p11-cc-security">
          <b>نموذج صلاحيات</b>
          <p>
            كل دور يرى بياناته فقط. الحماية الإنتاجية تعتمد على تسجيل الدخول
            والتحقق في الخادم.
          </p>
        </div>

        <div className="mt-auto space-y-2 px-1">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#22c55e]" />
            Platform Status: All Systems Operational
          </div>
          <button
            type="button"
            className="p11-btn-gold w-full"
            onClick={() => setDark((value) => !value)}
          >
            {dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
          </button>
        </div>
      </aside>

      <div className="p11-main">
        <header className="p11-header p11-cc-top">
          <div>
            <small>SUCCESS OS / {subtitle}</small>
            <h1>{title}</h1>
          </div>
          <div className="p11-cc-top-actions">
            <button type="button" aria-label="بحث">
              ⌕
            </button>
            <Link href="/notifications">
              🔔<i>3</i>
            </Link>
            <span>{name.slice(0, 2)}</span>
          </div>
        </header>

        <nav className="p11-cc-nav">
          {nav.map((item, index) => {
            const href = navLinks[index];
            if (href) {
              return (
                <Link
                  key={item}
                  href={href}
                  className={index === activeNav ? 'active' : ''}
                  onClick={() => setActiveNav(index)}
                >
                  {item}
                </Link>
              );
            }
            return (
              <button
                key={item}
                type="button"
                className={index === activeNav ? 'active' : ''}
                onClick={() => setActiveNav(index)}
              >
                {item}
              </button>
            );
          })}
        </nav>

        <div className="p11-cc-content">
          <section className="p11-glass p11-cc-welcome">
            <div>
              <span className="p11-icon-3d">{icon}</span>
              <div>
                <small>{subtitle}</small>
                <h2>أهلا، {name}</h2>
                <p>
                  هذه المساحة تعرض ما يحتاجه هذا الدور فقط، مع أزرار تحكم مرتبطة
                  بصفحات العمل الحقيقية ومساعد ذكي مخصص.
                </p>
              </div>
            </div>
            <Link href="/control-hubs" className="p11-btn-gold">
              كل لوحات التحكم ⚙
            </Link>
          </section>

          {controlActions.length ? (
            <section className="p11-glass p11-cc-panel" style={{ marginBottom: '1rem' }}>
              <header>
                <div>
                  <small>أزرار التحكم</small>
                  <h3>إجراءات هذا الدور</h3>
                </div>
                <Link href="/control-hubs">عرض التصنيفات ←</Link>
              </header>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.25rem 0 0.5rem' }}>
                {controlActions.map((action) => (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={action.href}
                    className={
                      action.kind === 'primary' || action.kind === 'admin'
                        ? 'p11-btn-primary'
                        : 'p11-btn-gold'
                    }
                    style={{ textDecoration: 'none', fontSize: 13 }}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="p11-cc-stats">
            {stats.map(([value, label, delta]) => (
              <article className="p11-glass p11-lift" key={label}>
                <div>
                  <small>{label}</small>
                  <b>{value}</b>
                </div>
                <span>{delta}</span>
              </article>
            ))}
          </section>

          <div className="p11-cc-grid">
            <section className="p11-glass p11-cc-panel">
              <header>
                <div>
                  <small>أولوية اليوم</small>
                  <h3>المهام التي تحتاج إجراء</h3>
                </div>
                <button type="button">عرض الكل</button>
              </header>
              {tasks.map((task, index) => {
                const action = controlActions[index] || controlActions[0];
                const body = (
                  <>
                    <button
                      type="button"
                      className={index === 0 ? 'urgent' : ''}
                    >
                      {index === 0 ? '!' : '✓'}
                    </button>
                    <div>
                      <b>{task}</b>
                      <small>
                        {index === 0
                          ? 'أولوية عالية • اليوم'
                          : 'ضمن خطة هذا الأسبوع'}
                      </small>
                    </div>
                    <span>←</span>
                  </>
                );
                return action ? (
                  <Link className="p11-cc-task" href={action.href} key={task}>
                    {body}
                  </Link>
                ) : (
                  <div className="p11-cc-task" key={task}>
                    {body}
                  </div>
                );
              })}
            </section>

            <section className="p11-glass p11-cc-panel">
              <header>
                <div>
                  <small>مباشر</small>
                  <h3>
                    {role === 'social'
                      ? 'مركز التحقق والنشر'
                      : 'آخر ما يحدث في مساحتك'}
                  </h3>
                </div>
              </header>
              {activity.map(([type, event, meta]) => (
                <div className="p11-cc-event" key={event}>
                  <span>{type[0]}</span>
                  <div>
                    <b>{event}</b>
                    <small>{meta}</small>
                  </div>
                </div>
              ))}
              {role === 'social' ? (
                <div className="p11-cc-verify">
                  <b>لا ينشر الإعلان بعد</b>
                  <p>
                    مطلوب رابط الجامعة الرسمي، شروط المنحة، صلاحية العرض وهوية
                    الجهة.
                  </p>
                  <button type="button" className="p11-btn-primary">
                    فتح قائمة التحقق
                  </button>
                </div>
              ) : null}
            </section>
          </div>

          <section className="p11-glass p11-cc-services">
            <header>
              <small>ربط الخدمات بالذكاء الاصطناعي</small>
              <h3>من إجراء منفصل إلى رحلة واحدة</h3>
            </header>
            <div>
              {SERVICE_JOURNEYS.map((path) => (
                <Link className="p11-lift" href={path.href} key={path.href}>
                  {path.steps.map((step, index) => (
                    <span key={`${path.href}-${step}`}>
                      {step}
                      {index < path.steps.length - 1 ? <b> ← </b> : null}
                    </span>
                  ))}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <button
        type="button"
        className="p11-cc-bot-button"
        onClick={() => setAssistant(!assistant)}
      >
        ✦<span>{ai}</span>
      </button>

      {assistant ? (
        <aside className="p11-glass p11-cc-assistant">
          <header>
            <span>✦</span>
            <div>
              <b>{ai}</b>
              <small>مقيد بصلاحيات هذا الدور</small>
            </div>
            <button type="button" onClick={() => setAssistant(false)}>
              ×
            </button>
          </header>
          <div className="p11-cc-chat">
            <p>
              أهلا، أنا مساعدك داخل SUCCESS OS. لا أنفذ قرارا حساسا بدون
              موافقتك.
            </p>
            <button type="button" onClick={() => setQuestion(hint)}>
              {hint}
            </button>
            {reply ? (
              <p className="answer">
                {reply}
                <small>المصدر: بيانات هذه اللوحة • نموذج تجريبي</small>
              </p>
            ) : null}
          </div>
          <form onSubmit={ask}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="اكتب طلبك..."
            />
            <button type="submit">↑</button>
          </form>
        </aside>
      ) : null}
    </div>
  );
}
