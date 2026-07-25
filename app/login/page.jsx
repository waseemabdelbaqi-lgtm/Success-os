'use client';

import { useMemo, useState } from 'react';
import { Brand } from '../components';
import { SignInForm } from '@/components/auth/sign-in-form';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { AppleSignInButton } from '@/components/auth/apple-sign-in-button';
import { AuthDivider } from '@/components/auth/auth-divider';

const roles = [
  ['student', '◉', 'طالب أو باحث عن عمل'],
  ['teacher', '♙', 'معلم'],
  ['center', '▦', 'مركز تعليمي'],
  ['school', '⌂', 'مدرسة'],
  ['university', '🎓', 'جامعة أو كلية'],
  ['employer', '↗', 'شركة توظيف'],
];

const authEnabled =
  process.env.NEXT_PUBLIC_FEATURE_AUTH_ENABLED === 'true';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('student');
  const firebaseAuth = useMemo(() => authEnabled, []);

  return (
    <main className="auth-page phase11-auth">
      <section className="auth-story">
        <Brand />
        <div>
          <small>ONE ID • LIFELONG JOURNEY</small>
          <h1>
            ابدأ من مكانك.
            <br />
            وخلّي SUCCESS OS يكمل معك.
          </h1>
          <p>تعلم، جامعة، وظيفة، مهارات وجواز تعليمي واحد.</p>
        </div>
        <div className="auth-orbits">
          <i></i>
          <i></i>
          <b>S</b>
        </div>
      </section>

      <section className="auth-panel" dir="rtl">
        <header>
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            دخول
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
          >
            اشتراك جديد
          </button>
        </header>

        <small>اختر بوابتك</small>
        <div className="auth-roles">
          {roles.map(([id, icon, label]) => (
            <button
              type="button"
              className={role === id ? 'active' : ''}
              onClick={() => setRole(id)}
              key={id}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {firebaseAuth ? (
          <div className="space-y-4" dir="ltr">
            <GoogleSignInButton />
            <AppleSignInButton />
            <AuthDivider />
            {mode === 'login' ? <SignInForm /> : <SignUpForm />}
            <p className="text-xs text-zinc-500">
              بعد تسجيل الدخول يمكنك فتح لوحة التعلم أو مكتبة الكتب حسب دورك.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              location.href = `/access?portal=${role}`;
            }}
          >
            {mode === 'signup' && (
              <label>
                الاسم الكامل
                <input required placeholder="اكتب الاسم" />
              </label>
            )}
            <label>
              البريد الإلكتروني أو الهاتف
              <input required placeholder="name@example.com" />
            </label>
            <label>
              كلمة المرور
              <input required type="password" placeholder="••••••••" />
            </label>
            <button type="submit">
              {mode === 'login'
                ? 'دخول إلى المنصة'
                : 'إنشاء الحساب وبدء الرحلة'}
            </button>
          </form>
        )}

        <div className="auth-quick-links">
          <a href="/access">استكشف البوابات بدون حساب ←</a>
          <a href="/start-journey">ابدأ الرحلة ←</a>
          <a href="/student-portal">بوابة الطالب ←</a>
          <a href="/student/dashboard">مكتبة كتب الطالب (معاينة) ←</a>
          <a href="/register">إنشاء حساب كامل ←</a>
          <a href="/contact">تواصل مع Success 4 Sure ←</a>
        </div>
        <p>
          عند المتابعة أنت توافق على الخصوصية وشروط الاستخدام وحماية
          المتعلمين.
        </p>
      </section>
    </main>
  );
}
