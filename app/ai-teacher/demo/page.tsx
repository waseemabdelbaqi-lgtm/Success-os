import { HumanEngineProofStudio } from "@/components/ai-teachers/human-engine-proof-studio";

export const metadata = {
  title: "Demo · سارة وعلي Humanoid 3D · Success OS",
  description:
    "تجربة حية: معلمون رقميون skinned داخل استوديو Three.js لمدة دقيقة+، يشرحون ويتفاعلون ويجيبون",
};

/**
 * Product demo surface — same proof lab (skinned HE-driven teachers).
 * Entry point for stakeholders to verify the working experience.
 */
export default function HumanoidDemoPage() {
  return <HumanEngineProofStudio />;
}
