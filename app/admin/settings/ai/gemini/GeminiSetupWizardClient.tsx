"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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
  configured: boolean;
  localDevelopment: boolean;
  canAutoWrite: boolean;
  autoWriteReason: string | null;
  envFile: string;
  gitignored: boolean;
  officialKeyPage: string;
  curriculumProcessingAllowed: boolean;
  health: HealthView | null;
  error?: { code: string; message: string };
};

const OFFICIAL_KEY_URL = "https://aistudio.google.com/apikey";

function HealthCard({ health }: { health: HealthView | null }) {
  if (!health) {
    return (
      <div className="gemini-health-card gemini-health-idle" role="status">
        <strong>لم يُختبر الاتصال بعد</strong>
        <p>احفظ المفتاح لتشغيل الاختبار تلقائياً.</p>
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
  const [apiKey, setApiKey] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<"connect" | "replace">("connect");
  const [message, setMessage] = useState<string | null>(null);
  const [manualPaste, setManualPaste] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const copyLine = useMemo(() => {
    const trimmed = apiKey.trim();
    return trimmed ? `GEMINI_API_KEY=${trimmed}` : "GEMINI_API_KEY=";
  }, [apiKey]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/ai/gemini/setup", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await res.json()) as SetupStatus;
      if (!res.ok) {
        setLoadError(data.error?.message || "تعذر تحميل حالة Gemini.");
        setStatus(null);
      } else {
        setStatus(data);
        setShowForm(!data.configured);
        setMode(data.configured ? "replace" : "connect");
      }
    } catch {
      setLoadError("تعذر الاتصال بخادم الإعداد.");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setManualPaste(false);
    const keyForFallback = apiKey.trim();
    try {
      const res = await fetch("/api/admin/ai/gemini/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyForFallback, action: "save" }),
      });
      const data = await res.json();
      setApiKey("");
      if (data.requiresManualPaste) {
        setManualPaste(true);
        setApiKey(keyForFallback);
        setMessage(
          data.manualPasteHint ||
            `تعذر الحفظ التلقائي. الصق السطر في الملف ${data.envFile || ".env.local"} ثم أعد تشغيل الخادم.`,
        );
      } else if (!data.saved) {
        setMessage(data.reason || data.error?.message || "فشل الحفظ.");
      } else if (data.health?.connected) {
        setMessage("تم الاتصال بنجاح. لن يبدأ أي إنتاج للمناهج قبل نجاح هذا الاختبار.");
        setShowForm(false);
      } else {
        setMessage(
          data.message ||
            data.health?.error?.message ||
            "تم الحفظ لكن اختبار الاتصال فشل.",
        );
      }
      await refresh();
    } catch {
      setMessage("حدث خطأ أثناء الحفظ.");
    } finally {
      setBusy(false);
    }
  }

  async function onTestOnly() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ai/gemini/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      if (data.health) {
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                health: data.health,
                curriculumProcessingAllowed: Boolean(data.curriculumProcessingAllowed),
                configured: prev.configured || Boolean(data.health?.connected),
              }
            : prev,
        );
      }
      setMessage(
        data.health?.connected
          ? "اختبار الاتصال نجح."
          : data.health?.error?.message || "فشل اختبار الاتصال.",
      );
    } catch {
      setMessage("تعذر تشغيل الاختبار.");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    const ok = window.confirm(
      "هل تريد حذف مفتاح Gemini من الإعداد المحلي؟ لن يعمل الاتصال حتى تضيف مفتاحاً جديداً.",
    );
    if (!ok) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ai/gemini/setup", { method: "DELETE" });
      const data = await res.json();
      setApiKey("");
      setShowForm(true);
      setMode("connect");
      setMessage(data.removed ? "تم حذف المفتاح من الإعداد المحلي." : data.reason || "فشل الحذف.");
      await refresh();
    } catch {
      setMessage("تعذر حذف المفتاح.");
    } finally {
      setBusy(false);
    }
  }

  function openGoogleKeyPage() {
    window.open(OFFICIAL_KEY_URL, "_blank", "noopener,noreferrer");
  }

  async function copyConfigLine() {
    try {
      await navigator.clipboard.writeText(copyLine);
      setMessage("تم نسخ سطر الإعداد. الصقه داخل ملف .env.local ثم أعد تشغيل الخادم.");
    } catch {
      setMessage("تعذر النسخ تلقائياً — انسخ السطر يدوياً من المربع أدناه.");
    }
  }

  if (loading) {
    return (
      <div className="gemini-wizard" dir="rtl" lang="ar">
        <p>جاري التحقق من إعداد Gemini…</p>
        <WizardStyles />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="gemini-wizard" dir="rtl" lang="ar">
        <h1>إعداد Gemini</h1>
        <p className="gemini-error-text">{loadError}</p>
        <p>هذه الصفحة متاحة فقط للمسؤول في بيئة التطوير المحلية (localhost).</p>
        <button type="button" className="button" onClick={() => void refresh()}>
          إعادة المحاولة
        </button>
        <WizardStyles />
      </div>
    );
  }

  const configured = Boolean(status?.configured);

  return (
    <div className="gemini-wizard" dir="rtl" lang="ar">
      <header className="gemini-wizard-head">
        <p className="gemini-kicker">إعداد محلي آمن · للمسؤول فقط</p>
        <h1>ربط Google Gemini</h1>
        <p>
          خطوة واحدة فقط: ربط مفتاح Gemini الرسمي. لن يبدأ أي عمل على المناهج قبل نجاح اختبار
          الاتصال الحقيقي.
        </p>
      </header>

      <section className="gemini-panel" aria-labelledby="status-title">
        <h2 id="status-title">الحالة الحالية</h2>
        <p>
          المفتاح محفوظ محلياً: <strong>{configured ? "نعم" : "لا"}</strong>
          {" · "}
          ملف Git يتجاهل السر:{" "}
          <strong>{status?.gitignored ? "نعم (.env.local)" : "تحقق يدوياً"}</strong>
        </p>
        <HealthCard health={status?.health ?? null} />
        <p className="gemini-note">
          معالجة المناهج:{" "}
          <strong>
            {status?.curriculumProcessingAllowed
              ? "مسموحة بعد نجاح الاختبار"
              : "موقوفة حتى نجاح الاتصال"}
          </strong>
        </p>
      </section>

      {!showForm && configured ? (
        <section className="gemini-actions">
          <button type="button" className="button" disabled={busy} onClick={() => void onTestOnly()}>
            إعادة اختبار الاتصال
          </button>
          <button
            type="button"
            className="button button-secondary"
            disabled={busy}
            onClick={() => {
              const ok = window.confirm("استبدال المفتاح الحالي بمفتاح جديد؟");
              if (!ok) return;
              setMode("replace");
              setShowForm(true);
              setApiKey("");
            }}
          >
            استبدال المفتاح
          </button>
          <button
            type="button"
            className="button button-danger"
            disabled={busy}
            onClick={() => void onRemove()}
          >
            حذف المفتاح
          </button>
        </section>
      ) : null}

      {showForm ? (
        <section className="gemini-panel" aria-labelledby="connect-title">
          <h2 id="connect-title">{mode === "replace" ? "استبدال مفتاح Gemini" : "ربط Gemini"}</h2>

          <button type="button" className="button gemini-primary" onClick={openGoogleKeyPage}>
            Connect Gemini — افتح صفحة Google الرسمية
          </button>

          <ol className="gemini-steps">
            <li>سجّل الدخول بحساب Google.</li>
            <li>اضغط Create API Key.</li>
            <li>انسخ المفتاح.</li>
            <li>ارجع إلى هذه الصفحة والصقه في الحقل أدناه.</li>
          </ol>

          <form onSubmit={onSave} className="gemini-form" autoComplete="off">
            <label htmlFor="gemini-api-key">مفتاح Gemini API</label>
            <input
              id="gemini-api-key"
              name="gemini-api-key"
              type="password"
              inputMode="text"
              autoComplete="new-password"
              spellCheck={false}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="الصق المفتاح هنا"
              disabled={busy}
              required
            />
            <div className="gemini-form-actions">
              <button type="submit" className="button" disabled={busy || !apiKey.trim()}>
                {busy ? "جاري الحفظ والاختبار…" : "حفظ واختبار الاتصال"}
              </button>
              {configured ? (
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={busy}
                  onClick={() => {
                    setShowForm(false);
                    setApiKey("");
                  }}
                >
                  إلغاء
                </button>
              ) : null}
            </div>
          </form>

          {manualPaste || status?.canAutoWrite === false ? (
            <div className="gemini-manual" role="region" aria-label="إعداد يدوي">
              <h3>إن تعذر الحفظ التلقائي</h3>
              <p>
                افتح الملف <code>{status?.envFile || ".env.local"}</code> في جذر مشروع Success OS
                وألصق هذا السطر في سطر واحد ثم احفظ الملف وأعد تشغيل الخادم:
              </p>
              <textarea
                className="gemini-copy-line"
                readOnly
                value={copyLine}
                rows={2}
                aria-label="سطر إعداد للنسخ"
              />
              <button
                type="button"
                className="button button-secondary"
                onClick={() => void copyConfigLine()}
              >
                نسخ سطر الإعداد
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

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
          radial-gradient(circle at 10% 0%, #e7f2ff 0%, transparent 45%),
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
        background: rgba(255, 255, 255, 0.88);
      }
      .gemini-panel h2 {
        margin: 0 0 0.75rem;
        font-size: 1.15rem;
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
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        margin-top: 1rem;
      }
      .gemini-steps {
        margin: 1rem 0 1.1rem;
        padding-inline-start: 1.2rem;
        line-height: 1.7;
      }
      .gemini-form {
        display: grid;
        gap: 0.55rem;
      }
      .gemini-form input {
        width: 100%;
        padding: 0.75rem 0.85rem;
        border: 1px solid #b7c6d8;
        background: #fff;
        font-size: 1rem;
      }
      .gemini-form-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
        margin-top: 0.35rem;
      }
      .gemini-wizard .button {
        appearance: none;
        border: 1px solid #1f4e79;
        background: #1f4e79;
        color: #fff;
        padding: 0.65rem 1rem;
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
      .gemini-primary {
        width: 100%;
        font-weight: 700;
      }
      .gemini-manual {
        margin-top: 1rem;
        padding: 0.85rem;
        border: 1px dashed #9aa8b8;
        background: #f7f9fc;
      }
      .gemini-copy-line {
        width: 100%;
        margin: 0.5rem 0;
        padding: 0.65rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        direction: ltr;
        text-align: left;
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
