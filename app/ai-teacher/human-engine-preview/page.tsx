import { HumanEnginePreview } from "@/components/ai-teachers/human-engine-preview";
import { buildDemoPlans } from "@/lib/human-engine";

export const metadata = {
  title: "Human Engine Preview · سارة وعلي | Success OS",
  description:
    "معاينة 10 ثوانٍ لمحرّك بشري مستقل — هيكل، phonemes، عاطفة، إيماء، كاميرا — جاهز لـ MetaHuman",
};

export default function HumanEnginePreviewPage() {
  const { sara, ali } = buildDemoPlans();
  return <HumanEnginePreview sara={sara} ali={ali} />;
}
