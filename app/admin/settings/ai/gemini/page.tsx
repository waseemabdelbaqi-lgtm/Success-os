export const dynamic = "force-dynamic";

/**
 * Gemini API-key / OAuth setup is cancelled.
 * Curriculum AI uses the local Ollama engine only.
 */
export default function GeminiSettingsCancelledPage() {
  return (
    <main dir="rtl" lang="ar" style={{ padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
      <h1>تم إلغاء إعداد Gemini</h1>
      <p>
        تم تعطيل مسار مفاتيح Gemini وOAuth. محرك المناهج المحلي يعتمد على Ollama فقط عبر{" "}
        <code>http://127.0.0.1:11434</code> بدون حسابات أو مفاتيح.
      </p>
      <p>لا يُطلب منك إنشاء حساب أو نسخ مفتاح أو تعديل ملفات البيئة يدوياً.</p>
      <p style={{ marginTop: "1.5rem" }}>
        فحص الصحة المحلي (من جهاز السيرفر فقط):{" "}
        <code>/api/admin/ai/local/health</code>
      </p>
    </main>
  );
}
