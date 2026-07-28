"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type HealthView = {
  status: "Connected" | "Failed";
  connected: boolean;
  model: string | null;
  response: string | null;
  latencyMs: number;
  error: { code: string; message: string } | null;
};

type SetupStatus = {
  configured?: boolean;
  health?: HealthView | null;
  error?: { code: string; message: string };
};

const KEY_PAGE = "https://aistudio.google.com/apikey";

export function GeminiSetupWizardClient() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [result, setResult] = useState<HealthView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
        if (data.health) setResult(data.health);
      }
    } catch {
      setLoadError("تعذر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onConnect(event: FormEvent) {
    event.preventDefault();
    if (!apiKey.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/ai/gemini/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), action: "save" }),
      });
      const data = await res.json();
      setApiKey("");
      const health: HealthView = data.health || {
        status: data.connected ? "Connected" : "Failed",
        connected: Boolean(data.connected),
        model: data.model ?? null,
        response: data.response ?? null,
        latencyMs: data.latencyMs ?? 0,
        error: data.error ?? null,
      };
      setResult(health);
      await refresh();
    } catch {
      setResult({
        status: "Failed",
        connected: false,
        model: null,
        response: null,
        latencyMs: 0,
        error: { code: "NETWORK_FAILURE", message: "تعذر حفظ المفتاح أو اختبار الاتصال." },
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="gpage" dir="rtl" lang="ar">
        <p>جاري التحميل…</p>
        <Styles />
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="gpage" dir="rtl" lang="ar">
        <h1>إعداد Gemini</h1>
        <p className="fail">{loadError}</p>
        <Styles />
      </main>
    );
  }

  return (
    <main className="gpage" dir="rtl" lang="ar">
      <h1>إعداد Gemini</h1>
      <p className="lead">اربط مفتاحاً مجانياً من Google AI Studio ثم اختبر الاتصال.</p>

      <a className="btn-create" href={KEY_PAGE} target="_blank" rel="noreferrer">
        إنشاء مفتاح Gemini مجاني
      </a>

      <form className="form" onSubmit={onConnect} autoComplete="off">
        <label htmlFor="gemini-key">الصق المفتاح هنا</label>
        <input
          id="gemini-key"
          name="gemini-key"
          type="password"
          autoComplete="new-password"
          spellCheck={false}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="الصق المفتاح هنا"
          disabled={busy}
          required
        />
        <button className="btn-connect" type="submit" disabled={busy || !apiKey.trim()}>
          {busy ? "جاري الربط والاختبار…" : "ربط واختبار"}
        </button>
      </form>

      {result ? (
        <section
          className={`result ${result.connected ? "ok" : "bad"}`}
          role="status"
          aria-live="polite"
        >
          <p>
            <span>الحالة</span>
            <strong>{result.connected ? "Connected" : "Failed"}</strong>
          </p>
          {result.model ? (
            <p>
              <span>النموذج</span>
              <strong>{result.model}</strong>
            </p>
          ) : null}
          {result.response ? (
            <p>
              <span>الرد</span>
              <strong>{result.response}</strong>
            </p>
          ) : null}
          <p>
            <span>الكمون</span>
            <strong>{result.latencyMs} ms</strong>
          </p>
          {!result.connected && result.error ? (
            <p className="fail">
              {result.error.code}: {result.error.message}
            </p>
          ) : null}
        </section>
      ) : (
        <p className="hint">
          {status?.configured
            ? "يوجد مفتاح محفوظ. يمكنك استبداله بلصق مفتاح جديد والضغط على ربط واختبار."
            : "لا يوجد مفتاح محفوظ بعد."}
        </p>
      )}

      <Styles />
    </main>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      .gpage {
        max-width: 560px;
        margin: 0 auto;
        padding: 2rem 1.25rem 3.5rem;
        min-height: 100vh;
        color: #142033;
        background: linear-gradient(180deg, #f4f8fc 0%, #e9eef5 100%);
        font-family: "IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif;
      }
      .gpage h1 {
        margin: 0 0 0.4rem;
        font-size: 1.85rem;
      }
      .lead {
        margin: 0 0 1.4rem;
        color: #445566;
      }
      .btn-create {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 64px;
        margin-bottom: 1.25rem;
        border-radius: 10px;
        background: #1a73e8;
        color: #fff !important;
        font-size: 1.25rem;
        font-weight: 800;
        text-decoration: none;
      }
      .form {
        display: grid;
        gap: 0.55rem;
        padding: 1rem;
        border: 1px solid #d5e0ec;
        background: rgba(255, 255, 255, 0.92);
      }
      .form label {
        font-weight: 700;
      }
      .form input {
        width: 100%;
        padding: 0.85rem 0.9rem;
        border: 1px solid #b7c6d8;
        font-size: 1rem;
        background: #fff;
      }
      .btn-connect {
        appearance: none;
        border: 0;
        background: #0f3d6e;
        color: #fff;
        padding: 0.9rem 1rem;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-connect:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .result {
        margin-top: 1.1rem;
        padding: 0.9rem 1rem;
        border: 1px solid #d5e0ec;
        background: #fff;
        display: grid;
        gap: 0.35rem;
      }
      .result.ok {
        border-color: #8ec9a5;
        background: #f1fbf5;
      }
      .result.bad {
        border-color: #e2b4b4;
        background: #fff6f6;
      }
      .result p {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin: 0;
      }
      .result span {
        color: #5b6b7c;
      }
      .fail {
        color: #8b2e2e;
      }
      .hint {
        margin-top: 1rem;
        color: #556677;
      }
    `}</style>
  );
}
