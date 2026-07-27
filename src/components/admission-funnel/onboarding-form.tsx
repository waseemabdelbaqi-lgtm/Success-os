"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";
import type { AdmissionProfileInput, TargetDegree } from "@/src/types/admission";

const NATIONALITIES = [
  "Jordan",
  "Egypt",
  "Saudi Arabia",
  "United Arab Emirates",
  "Palestine",
  "Syria",
  "Lebanon",
  "Iraq",
  "Germany",
  "Netherlands",
  "Other",
];

const DEGREES: { value: TargetDegree; label: string }[] = [
  { value: "bachelor", label: "Bachelor" },
  { value: "master", label: "Master" },
  { value: "phd", label: "PhD" },
  { value: "diploma", label: "Diploma / College" },
  { value: "school", label: "School (K–12)" },
];

const MAJORS = [
  "Engineering",
  "Computing",
  "Business",
  "Medicine",
  "Sciences",
  "Design",
  "IB",
  "British Curriculum",
];

type Props = {
  value: AdmissionProfileInput;
  busy?: boolean;
  error?: string | null;
  onChange: (next: AdmissionProfileInput) => void;
  onSubmit: () => void;
};

export function OnboardingForm({ value, busy, error, onChange, onSubmit }: Props) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-[#fff8f8] to-white">
        <CardTitle>Step 1 — Student profile</CardTitle>
        <CardDescription>
          Tell us your nationality, GPA, target degree, and major. We filter institutions and show
          admission criteria tailored to your nationality.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={value.fullName}
            onChange={(e) => onChange({ ...value, fullName: e.target.value })}
            placeholder="As on passport"
            autoComplete="name"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Select
            id="nationality"
            value={value.nationality}
            onChange={(e) => onChange({ ...value, nationality: e.target.value })}
          >
            {NATIONALITIES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="gpa">GPA (0–4 or local scale)</Label>
          <Input
            id="gpa"
            type="number"
            min={0}
            max={4}
            step={0.01}
            value={Number.isFinite(value.gpa) ? value.gpa : ""}
            onChange={(e) => onChange({ ...value, gpa: Number(e.target.value) })}
            placeholder="3.20"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="degree">Target degree</Label>
          <Select
            id="degree"
            value={value.targetDegree}
            onChange={(e) =>
              onChange({ ...value, targetDegree: e.target.value as TargetDegree })
            }
          >
            {DEGREES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="major">Major / field</Label>
          <Select
            id="major"
            value={value.major}
            onChange={(e) => onChange({ ...value, major: e.target.value })}
          >
            {MAJORS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="country">Preferred study country (optional)</Label>
          <Input
            id="country"
            value={value.preferredStudyCountry || ""}
            onChange={(e) => onChange({ ...value, preferredStudyCountry: e.target.value })}
            placeholder="Germany, Jordan, Netherlands…"
          />
        </div>
        {error ? (
          <p className="sm:col-span-2 text-sm font-medium text-[#9e1722]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="button" size="lg" className="w-full sm:w-auto" disabled={busy} onClick={onSubmit}>
            {busy ? "Filtering institutions…" : "Find matching institutions"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
