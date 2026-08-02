import { HumanEngineStudio } from "@/components/ai-teachers/human-engine-studio";
import { buildShowcasePlans } from "@/lib/human-engine";

export const metadata = {
  title: "AI Teaching Live Studio · سارة وعلي | Success OS",
  description:
    "استوديو تعليمي عالمي — أداء بشري يُولَّد من معنى الدرس: قانون، رسم، تجربة، نموذج ثلاثي الأبعاد",
};

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function HumanEngineLiveStudioPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const { sara, ali } = buildShowcasePlans();
  // Prefers ?teacher=ali|sara via client switch; plans for both always shipped.
  void sp.teacher;
  return (
    <HumanEngineStudio
      sara={sara}
      ali={ali}
      autoStart
      modeLabel="Human Engine Live"
    />
  );
}
