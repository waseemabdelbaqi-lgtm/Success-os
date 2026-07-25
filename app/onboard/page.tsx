import { InnerNav } from "../components";
import OnboardPage from "@/src/app/onboard/page";

export const metadata = {
  title: "Student onboarding",
  description: "Enter nationality, GPA, degree, and major to start your admission funnel.",
};

export default function OnboardRoutePage() {
  return (
    <>
      <InnerNav active="admissions" />
      <OnboardPage />
    </>
  );
}
