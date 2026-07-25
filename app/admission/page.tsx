import { InnerNav } from "../components";
import AdmissionMatchesPage from "@/src/app/page";

export const metadata = {
  title: "Matching institutions",
  description: "Nationality-aware institution matches for SUCCESS OS admissions.",
};

export default function AdmissionPage() {
  return (
    <>
      <InnerNav active="admissions" />
      <AdmissionMatchesPage />
    </>
  );
}
