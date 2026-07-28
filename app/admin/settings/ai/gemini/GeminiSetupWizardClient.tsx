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
  accountEmail?: string | null;
  waitingForApproval?: boolean;
  authUrl?: string | null;
  callbackPort?: number | null;
  expiresAt?: string | null;
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
        <p>بعد ضغط Allow سيتم الاختبار تلقائياً.</p>
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
  const [redirectPaste, setRedirectPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);

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
        if (data.authenticated) setAuthUrl(null);
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

  // Auto-start a fresh Google login session on first load if not authenticated.
  useEffect(() => {
    if (loading || status?.authenticated || authUrl) return;
    void (async () => {
      setBusy(true);
      try {
        const res = await fetch("/api/admin/ai/gemini/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "restart" }),
        });
        const data = await res.json();
        if (data.authUrl) setAuthUrl(data.authUrl);
        setMessage(data.message || null);
        await refresh();
      } finally {
        setBusy(false);
      }
    })();
  }, [loading, status?.authenticated, authUrl, refresh]);

  // Poll while waiting.
  useEffect(() => {
    if (!status?.waitingForApproval && !authUrl) return;
    if (status?.authenticated) return;
    const started = Date.now();
    const id = window.setInterval(() => {
      void (async () => {
        if (Date.now() - started > 20_000) setShowPaste(true);
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
          const testData = await testRes.json();
          setStatus((prev) => ({
            ...prev,
            ...data,
            health: testData.health || data.health,
            curriculumProcessingAllowed: Boolean(testData.curriculumProcessingAllowed),
          }));
          setAuthUrl(null);
          setMessage(
            testData.health?.connected
              ? "Connected — تم ربط Gemini عبر Google."
              : testData.health?.error?.message || "فشل اختبار الاتصال.",
          );
        }
      })();
    }, 2500);
    return () => window.clearInterval(id);
  }, [status?.waitingForApproval, status?.authenticated, authUrl, refresh]);

  async function restartFreshLogin() {
    setBusy(true);
    setMessage(null);
    setShowPaste(false);
    setRedirectPaste("");
    try {
      const res = await fetch("/api/admin/ai/gemini/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart" }),
      });
      const data = await res.json();
      if (data.authUrl) {
        setAuthUrl(data.authUrl);
        setMessage(
          "رابط جديد جاهز. اضغط Continue with Google ثم Allow. المستمع يبقى نشطاً 10 دقائق.",
        );
      } else {
        setMessage(data.error?.message || data.message || "تعذر بدء تسجيل الدخول.");
      }
      await refresh();
    } catch {
      setMessage("تعذر إعادة تشغيل تسجيل الدخول.");
    } finally {
      setBusy(false);
    }
  }

  async function completeFromRedirect() {
    if (!redirectPaste.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/ai/gemini/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_from_redirect",
          redirectUrl: redirectPaste.trim(),
        }),
      });
      const data = await res.json();
      setRedirectPaste("");
      setAuthUrl(null);
      setStatus((prev) => ({
        ...prev,
        authenticated: Boolean(data.ok),
        accountEmail: data.accountEmail,
        health: data.health,
        curriculumProcessingAllowed: Boolean(data.curriculumProcessingAllowed),
      }));
      setMessage(
        data.health?.connected
          ? "Connected — تم الربط عبر Google."
          : data.error?.message ||
              data.health?.error?.message ||
              "اكتمل الدخول لكن الاختبار فشل.",
      );
      await refresh();
    } catch {
      setMessage("تعذر إكمال المصادقة من رابط التحويل.");
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
    const ok = window.confirm("قطع اتصال Google / Gemini CLI من هذا الجهاز؟");
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
        <p>جاري التحضير…</p>
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
  const activeAuthUrl = authUrl || status?.authUrl || null;

  return (
    <div className="gemini-wizard" dir="rtl" lang="ar">
      <header className="gemini-wizard-head">
        <p className="gemini-kicker">Gemini CLI · Google login</p>
        <h1>ربط Google Gemini</h1>
        <p>بدون مفاتيح API. اضغط الزر الكبير، ثم Allow في Google. المستمع يبقى 10 دقائق.</p>
      </header>

      <section className="gemini-panel">
        <h2>الحالة</h2>
        <p>
          الحساب: <strong>{status?.accountEmail || "غير متصل"}</strong>
          {status?.callbackPort ? (
            <>
              {" · "}
              منفذ الاستماع: <strong>{status.callbackPort}</strong>
            </>
          ) : null}
        </p>
        <HealthCard health={status?.health} />
        <p className="gemini-note">
          معالجة المناهج:{" "}
          <strong>
            {status?.curriculumProcessingAllowed ? "مسموحة" : "موقوفة — لن يبدأ التوليد الآن"}
          </strong>
        </p>
      </section>

      {!connected ? (
        <section className="gemini-panel gemini-connect">
          {activeAuthUrl ? (
            <a
              className="gemini-continue-google"
              href={activeAuthUrl}
              target="_blank"
              rel="noreferrer"
            >
              Continue with Google
            </a>
          ) : (
            <button
              type="button"
              className="gemini-continue-google"
              disabled={busy}
              onClick={() => void restartFreshLogin()}
            >
              {busy ? "جاري التحضير…" : "Continue with Google"}
            </button>
          )}

          <p className="gemini-wait-note" role="status">
            ⏸️ بعد فتح الصفحة اضغط <strong>Allow</strong> فقط. لا تنسخ أي مفتاح.
          </p>

          <button
            type="button"
            className="button button-secondary"
            disabled={busy}
            onClick={() => void restartFreshLogin()}
          >
            تحديث الرابط (رابط جديد)
          </button>

          {(showPaste || status?.waitingForApproval) && (
            <div className="gemini-manual">
              <h3>إذا فشل التحويل التلقائي</h3>
              <p>
                بعد Allow، إذا ظهرت صفحة خطأ على <code>127.0.0.1</code>، انسخ رابط شريط العنوان
                بالكامل (يبدأ بـ <code>http://127.0.0.1</code>) والصقه هنا. هذا ليس access token.
              </p>
              <input
                type="password"
                autoComplete="off"
                value={redirectPaste}
                onChange={(e) => setRedirectPaste(e.target.value)}
                placeholder="http://127.0.0.1:PORT/oauth2callback?code=..."
                disabled={busy}
              />
              <button
                type="button"
                className="button button-secondary"
                disabled={busy || !redirectPaste.trim()}
                onClick={() => void completeFromRedirect()}
              >
                إكمال المصادقة من رابط التحويل
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className="gemini-actions">
          <button type="button" className="button" disabled={busy} onClick={() => void retest()}>
            إعادة اختبار الاتصال
          </button>
          <button
            type="button"
            className="button button-secondary"
            disabled={busy}
            onClick={() => void restartFreshLogin()}
          >
            إعادة ربط بحساب Google
          </button>
          <button
            type="button"
            className="button button-danger"
            disabled={busy}
            onClick={() => void logout()}
          >
            قطع الاتصال
          </button>
        </section>
      )}

      {message ? <p className="gemini-message">{message}</p> : null}
      <WizardStyles />
    </div>
  );
}

function WizardStyles() {
  return (
    <style jsx global>{`
      .gemini-wizard {
        max-width: 760px;
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
        background: rgba(255, 255, 255, 0.92);
      }
      .gemini-connect {
        text-align: center;
      }
      .gemini-continue-google {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 72px;
        margin: 0.35rem 0 1rem;
        padding: 1rem 1.25rem;
        border: 0;
        border-radius: 10px;
        background: #1a73e8;
        color: #fff !important;
        font-size: clamp(1.25rem, 2.5vw, 1.65rem);
        font-weight: 800;
        letter-spacing: 0.01em;
        text-decoration: none;
        cursor: pointer;
        box-shadow: 0 10px 24px rgba(26, 115, 232, 0.28);
      }
      .gemini-continue-google:hover {
        background: #1765cc;
      }
      .gemini-continue-google:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .gemini-wait-note {
        margin: 0 0 1rem;
        color: #5a4a16;
        background: #fff8e8;
        border: 1px solid #e6d39a;
        padding: 0.75rem 0.9rem;
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
      .gemini-manual {
        margin-top: 1rem;
        padding: 0.85rem;
        border: 1px dashed #9aa8b8;
        background: #f7f9fc;
        text-align: right;
      }
      .gemini-manual input {
        width: 100%;
        margin: 0.5rem 0;
        padding: 0.7rem;
        border: 1px solid #b7c6d8;
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
