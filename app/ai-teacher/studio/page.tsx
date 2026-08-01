import { DigitalHumanStudio } from "@/components/ai-teachers/digital-human-studio";
import { demoStudioPlan } from "@/lib/digital-human-studio";

export const metadata = {
  title: "Digital Human Studio · سارة وعلي | Success OS",
  description:
    "استوديو تعليمي عالمي — معلمون رقميون واقعيون يحلّلون الدرس ويشرحون بمشاهد سينمائية ديناميكية",
};

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function DigitalHumanStudioPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const teacher = sp.teacher === "ali" ? "ali" : "sara";
  const plan = demoStudioPlan(teacher);

  return <DigitalHumanStudio plan={plan} autoStart />;
}
