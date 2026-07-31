export const dynamic = "force-dynamic";

/**
 * Local curriculum AI status page (no public Ollama exposure).
 * Curriculum book processing is not started from this page.
 */
export default function LocalAiSettingsPage() {
  return (
    <main dir="rtl" lang="ar" style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1>محرك الذكاء الاصطناعي المحلي</h1>
      <p>
        يعمل Ollama محلياً على <code>http://127.0.0.1:11434</code> فقط داخل السيرفر. لا يُعرض عبر
        Cloudflare tunnel.
      </p>
      <ul>
        <li>لا حاجة لحسابات Google أو مفاتيح API</li>
        <li>النموذج يُختار تلقائياً حسب عتاد الجهاز</li>
        <li>معالجة كتب المناهج لم تُفعّل بعد (Step 1 فقط)</li>
      </ul>
      <p>
        إعداد تلقائي: <code>npm run ai:local:setup</code>
      </p>
      <p>
        فحص الصحة (localhost فقط): <code>/api/admin/ai/local/health</code>
      </p>
    </main>
  );
}
