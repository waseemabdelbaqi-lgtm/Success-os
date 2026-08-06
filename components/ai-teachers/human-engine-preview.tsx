"use client";

/**
 * 10s Human Engine preview — thin wrapper around the live studio player
 * with short demo plans (semantic sentence director).
 */
import { HumanEngineStudio } from "@/components/ai-teachers/human-engine-studio";
import type { HumanPerformancePlan } from "@/types/human-engine";

type Props = {
  sara: HumanPerformancePlan;
  ali: HumanPerformancePlan;
};

export function HumanEnginePreview({ sara, ali }: Props) {
  return (
    <HumanEngineStudio
      sara={sara}
      ali={ali}
      autoStart
      modeLabel="معاينة 10 ثوانٍ"
    />
  );
}
