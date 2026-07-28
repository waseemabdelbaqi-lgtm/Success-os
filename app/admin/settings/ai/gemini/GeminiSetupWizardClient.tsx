"use client";

import { useCallback, useEffect, useState } from "react";

type HealthView = {
  status: "Connected" | "Failed";
  connected: boolean;
  model: string | null;
  response: string | null;
  latencyMs: number;
  error: { code: string; message: string } | null;
};

type SetupStatus = {
  ok?: boolean;
  authenticated?: boolean;
  configured?: boolean;
  accountEmail?: string | null;
  waitingForApproval?: boolean;
  authUrl?: string | null;
  curriculumProcessingAllowed?: boolean;
  health?: HealthView | null;
  error?: { code: string; message: string };
  message?: string;
};

function HealthCard({ health }: { health: HealthView | null | undefined }) {
  if (!health) {
    return (
      <div className="gemini-health-card" role="status">
        <strong>لم يُختبر الاتصال بعد</strong>
        <p>بعد الموافقة على Google سيتم الاختبار تلقائياً.</p>
      </div>
    );
  }
  return (
    <div
      className={`gemini-health-card ${health.connected ? "gemini-health-ok" : "gemini-health-fail"}`}
      role="status"
      aria-live="polite"
    >
      <p>
        <span>الحالة</span>
        <strong>{health.connected ? "Connected" : "Failed"}</strong>
      </p>
      <p>
        <span>النموذج</span>
        <strong>{health.model || "—"}</strong>
      </p>
      <p>
        <span>الرد الآمن</span>
        <strong>{health.response || "—"}</strong>
      </p>
      <p>
        <span>الكمون</span>
        <strong>{health.latencyMs} ms</strong>
      </p>
      {!health.connected && health.error ? (
        <p className="gemini-error">
          <span>الخطأ</span>
          <strong>
            {health.error.code}: {health.error.message}
          </strong>
        </p>
      ) : null}
    </div>
  );
}

export function GeminiSetupWizardClient() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai/gemini/setup", { cache: "no-store" });
      const data = (await res.json()) as SetupStatus;
      if (!res.ok) {
        setLoadError(data.error?.message || "تعذر تحميل الحالة.");
        setStatus(null);
      } else {
        setLoadError(null);
        setStatus(data);
        if (data.authUrl) setAuthUrl(data.authUrl);
      }
    } catch {
      setLoadError("تعذر الاتصال بخادم الإعداد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Poll while waiting for Google Allow.
  useEffect(() => {
    if (!status?.waitingForApproval && !authUrl) return;
    if (status?.authenticated) return;
    const id = window.setInterval(() => {
      void (async () => {
        await refresh();
        const res = await fetch("/api/admin/ai/gemini/setup", { cache: "no-store" });
        const data = (await res.json()) as SetupStatus;
        if (data.authenticated) {
          setMessage("تم تسجيل الدخول. جاري اختبار الاتصال…");
          const testRes = await fetch("/api/admin/ai/gemini/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "test" }),
          });
          const testData = (await testRes.json()) as SetupStatus & {
            health?: HealthView;
          };
          setStatus((prev) => ({
            ...prev,
            ...data,
            health: testData.health || data.health,
            curriculumProcessingAllowed: Boolean(testData.curriculumProcessingAllowed),
          }));
          setAuthUrl(null);
          setMessage(
            testData.health?.connected
              ? "Connected — تم ربط Gemini عبر تسجيل دخول Google."
              : testData.health?.error?.message || "فشل اختبار الاتصال.",
          );
        }
      })();
    }, 2500);
    return () => window.clearInterval(id);
  }, [status?.waitingForApproval, status?.authenticated, authUrl, refresh]);

  async function startGoogleLogin() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ai/gemini/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_google_login" }),
      });
      const data = (await res.json()) as SetupStatus & {
        authUrl?: string;
        pauseForUser?: boolean;
        message?: string;
      };
      if (data.authUrl) {
        setAuthUrl(data.authUrl);
        window.open(data.authUrl, "_blank", "noopener,noreferrer");
        setMessage(
          "توقّف هنا: أكمل الموافقة في صفحة Google (Allow). سأكملها الإعداد تلقائياً بعد ذلك.",
        );
      } else if (data.authenticated) {
        setMessage(data.message || "الحساب متصل مسبقاً.");
      } else {
        setMessage(data.error?.message || data.message || "تعذر بدء تسجيل الدخول.");
      }
      await refresh();
    } catch {
      setMessage("تعذر بدء تسجيل دخول Google.");
    } finally {
      setBusy(false);
    }
  }

  async function retest() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/ai/gemini/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      setStatus((prev) => ({
        ...prev,
        health: data.health,
        authenticated: data.ok || prev?.authenticated,
        curriculumProcessingAllowed: Boolean(data.curriculumProcessingAllowed),
      }));
      setMessage(
        data.health?.connected
          ? "اختبار الاتصال نجح."
          : data.health?.error?.message || "فشل الاختبار.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    const ok = window.confirm("هل تريد قطع اتصال Google / Gemini CLI من هذا الجهاز؟");
    if (!ok) return;
    setBusy(true);
    try {
      await fetch("/api/admin/ai/gemini/setup", { method: "DELETE" });
      setAuthUrl(null);
      setMessage("تم قطع الاتصال.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="gemini-wizard" dir="rtl" lang="ar">
        <p>جاري التحقق…</p>
        <WizardStyles />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="gemini-wizard" dir="rtl" lang="ar">
        <h1>ربط Gemini</h1>
        <p className="gemini-error-text">{loadError}</p>
        <button type="button" className="button" onClick={() => void refresh()}>
          إعادة المحاولة
        </button>
        <WizardStyles />
      </div>
    );
  }

  const connected = Boolean(status?.health?.connected || status?.authenticated);

  return (
    <div className="gemini-wizard" dir="rtl" lang="ar">
      <header className="gemini-wizard-head">
        <p className="gemini-kicker">Gemini CLI · تسجيل دخول Google الرسمي</p>
        <h1>ربط Google Gemini</h1>
        <p>
          بدون مفاتيح API يدوية. سيتم فتح صفحة Google الرسمية للموافقة. بعد ضغط Allow يكتمل الربط
          تلقائياً.
        </p>
      </header>

      <section className="gemini-panel">
        <h2>الحالة</h2>
        <p>
          الحساب: <strong>{status?.accountEmail || "غير متصل"}</strong>
          {" · "}
          الطريقة: <strong>Gemini CLI Google login</strong>
        </p>
        <HealthCard health={status?.health} />
        <p className="gemini-note">
          معالجة المناهج:{" "}
          <strong>
            {status?.curriculumProcessingAllowed
              ? "مسموحة"
              : "موقوفة حتى نجاح الاختبار (لن يبدأ التوليد الآن)"}
          </strong>
        </p>
      </section>

      {authUrl || status?.waitingForApproval ? (
        <section className="gemini-panel gemini-wait" role="status" aria-live="polite">
          <h2>⏸️ توقف هنا — موافقة Google مطلوبة</h2>
          <p>
            افتح صفحة التفويض واضغط <strong>Allow</strong>. لا حاجة لنسخ أي مفتاح. بعد الموافقة
            نكمل تلقائياً.
          </p>
          {authUrl ? (
            <a className="button gemini-primary" href={authUrl} target="_blank" rel="noreferrer">
              فتح صفحة موافقة Google
            </a>
          ) : null}
          <p className="gemini-note">بانتظار اكتمال المصادقة…</p>
        </section>
      ) : null}

      <section className="gemini-actions">
        {!connected ? (
          <button
            type="button"
            className="button gemini-primary"
            disabled={busy}
            onClick={() => void startGoogleLogin()}
          >
            {busy ? "جاري التحضير…" : "Connect Gemini — تسجيل الدخول بحساب Google"}
          </button>
        ) : (
          <>
            <button type="button" className="button" disabled={busy} onClick={() => void retest()}>
              إعادة اختبار الاتصال
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={busy}
              onClick={() => void startGoogleLogin()}
            >
              إعادة ربط الحساب
            </button>
            <button
              type="button"
              className="button button-danger"
              disabled={busy}
              onClick={() => void logout()}
            >
              قطع الاتصال
            </button>
          </>
        )}
      </section>

      {message ? <p className="gemini-message">{message}</p> : null}
      <WizardStyles />
    </div>
  );
}

function WizardStyles() {
  return (
    <style jsx global>{`
      .gemini-wizard {
        max-width: 720px;
        margin: 0 auto;
        padding: 2rem 1.25rem 4rem;
        color: #142033;
        background:
          radial-gradient(circle at 12% 0%, #e8f3ff 0%, transparent 42%),
          linear-gradient(180deg, #f7fafc 0%, #eef3f8 100%);
        min-height: 100vh;
        font-family: "IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif;
      }
      .gemini-kicker {
        margin: 0 0 0.35rem;
        color: #3b6ea5;
        font-weight: 700;
      }
      .gemini-wizard-head h1 {
        margin: 0 0 0.5rem;
        font-size: clamp(1.7rem, 3vw, 2.2rem);
      }
      .gemini-panel {
        margin-top: 1.25rem;
        padding: 1.1rem 1.15rem;
        border: 1px solid #d5e0ec;
        background: rgba(255, 255, 255, 0.9);
      }
      .gemini-wait {
        border-color: #c9a227;
        background: #fff9e9;
      }
      .gemini-health-card {
        display: grid;
        gap: 0.35rem;
        padding: 0.85rem 0.9rem;
        border: 1px solid #d5e0ec;
        background: #f8fbff;
      }
      .gemini-health-ok {
        border-color: #8ec9a5;
        background: #f1fbf5;
      }
      .gemini-health-fail {
        border-color: #e2b4b4;
        background: #fff6f6;
      }
      .gemini-health-card p {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin: 0;
      }
      .gemini-health-card span {
        color: #5b6b7c;
      }
      .gemini-actions {
        display: grid;
        gap: 0.6rem;
        margin-top: 1rem;
      }
      .gemini-wizard .button {
        appearance: none;
        border: 1px solid #1f4e79;
        background: #1f4e79;
        color: #fff;
        padding: 0.75rem 1rem;
        font: inherit;
        cursor: pointer;
        text-align: center;
        text-decoration: none;
      }
      .gemini-wizard .button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .gemini-wizard .button-secondary {
        background: #fff;
        color: #1f4e79;
      }
      .gemini-wizard .button-danger {
        background: #8b2e2e;
        border-color: #8b2e2e;
      }
      .gemini-primary {
        width: 100%;
        font-weight: 700;
      }
      .gemini-message {
        margin-top: 1rem;
        padding: 0.75rem 0.9rem;
        background: #fff;
        border: 1px solid #d5e0ec;
      }
      .gemini-error-text,
      .gemini-error strong {
        color: #8b2e2e;
      }
      .gemini-note {
        margin: 0.75rem 0 0;
        color: #445566;
      }
    `}</style>
  );
}
