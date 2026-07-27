import { InnerNav } from "../components";
import OnboardPage from "@/src/app/onboard/page";

export const metadata = {
  title: "ابدأ التقديم | SUCCESS OS",
  description: "أدخل جنسيتك ومعدلك لعرض المؤسسات المتوافقة فوراً.",
};

export default function OnboardRoutePage() {
  return (
    <>
      <InnerNav active="admissions" />
      <OnboardPage />
    </>
  );
}
