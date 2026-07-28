import { GeminiSetupWizardClient } from "./GeminiSetupWizardClient";
import { isLocalDevelopmentEnvironment } from "@/lib/ai/gemini-local-env";

export const dynamic = "force-dynamic";

/**
 * Local-only Gemini connection wizard for administrators.
 * Does not start curriculum processing.
 */
export default function GeminiSettingsPage() {
  if (!isLocalDevelopmentEnvironment()) {
    return (
      <main dir="rtl" lang="ar" style={{ padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
        <h1>غير متاح</h1>
        <p>معالج ربط Gemini متاح فقط في بيئة التطوير المحلية وللمسؤول.</p>
      </main>
    );
  }

  return <GeminiSetupWizardClient />;
}
