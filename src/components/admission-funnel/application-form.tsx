"use client";

import { useState } from "react";
import { submitApplication, uploadAdmissionDocument } from "@/src/actions/submitApplication";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import type {
  AdmissionProfileInput,
  ApplicationPersonal,
  Institution,
} from "@/src/types/admission";

type Props = {
  institution: Institution;
  profile: AdmissionProfileInput;
  paymentId: string;
  unlockToken: string;
  initialPersonal?: Partial<ApplicationPersonal>;
  onComplete: (result: {
    applicationId: string;
    route: "partner" | "email";
    status: string;
    emailPreviewHtml?: string;
  }) => void;
};

const APPLY_STEPS = ["personal", "documents", "review"] as const;

export function ApplicationForm({
  institution,
  profile,
  paymentId,
  unlockToken,
  initialPersonal,
  onComplete,
}: Props) {
  const [step, setStep] = useState<(typeof APPLY_STEPS)[number]>("personal");
  const [personal, setPersonal] = useState<ApplicationPersonal>({
    fullName: initialPersonal?.fullName || profile.fullName || "",
    email: initialPersonal?.email || profile.email || "",
    phone: initialPersonal?.phone || profile.phone || "",
    dateOfBirth: initialPersonal?.dateOfBirth || "",
    address: initialPersonal?.address || "",
  });
  const [transcriptPath, setTranscriptPath] = useState("");
  const [passportPath, setPassportPath] = useState("");
  const [transcriptName, setTranscriptName] = useState("");
  const [passportName, setPassportName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(kind: "transcript" | "passport", file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", kind);
    fd.set("paymentId", paymentId);
    const res = await uploadAdmissionDocument(fd);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (kind === "transcript") {
      setTranscriptPath(res.data.path);
      setTranscriptName(file.name);
    } else {
      setPassportPath(res.data.path);
      setPassportName(file.name);
    }
  }

  async function onSubmit() {
    setBusy(true);
    setError(null);
    const res = await submitApplication({
      paymentId,
      unlockToken,
      institutionId: institution.id,
      profile,
      personal,
      transcriptPath,
      passportPath,
      message,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onComplete(res.data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4 — Application for {institution.name}</CardTitle>
        <CardDescription>
          Payment unlocked. Complete personal details, upload PDFs to secure storage, then submit.
          Route:{" "}
          <strong>
            {institution.is_partner ? "Partner (in-app notifications)" : "Non-partner (official email)"}
          </strong>
        </CardDescription>
        <div className="mt-3 flex gap-2 text-xs font-bold">
          {APPLY_STEPS.map((s) => (
            <span
              key={s}
              className={
                s === step
                  ? "rounded-lg bg-[#9e1722] px-2.5 py-1 text-white"
                  : "rounded-lg bg-[#f5f0f1] px-2.5 py-1 text-[#73636a]"
              }
            >
              {s}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "personal" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="a-name">Full name</Label>
              <Input
                id="a-name"
                value={personal.fullName}
                onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="a-email">Email</Label>
              <Input
                id="a-email"
                type="email"
                value={personal.email}
                onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="a-phone">Phone</Label>
              <Input
                id="a-phone"
                value={personal.phone}
                onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="a-dob">Date of birth</Label>
              <Input
                id="a-dob"
                type="date"
                value={personal.dateOfBirth}
                onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="a-address">Address</Label>
              <Input
                id="a-address"
                value={personal.address || ""}
                onChange={(e) => setPersonal({ ...personal, address: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="button"
                disabled={!personal.fullName || !personal.email || !personal.phone || !personal.dateOfBirth}
                onClick={() => setStep("documents")}
              >
                Continue to documents
              </Button>
            </div>
          </div>
        ) : null}

        {step === "documents" ? (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="transcript">Academic transcript (PDF)</Label>
              <Input
                id="transcript"
                type="file"
                accept="application/pdf"
                onChange={(e) => upload("transcript", e.target.files?.[0] || null)}
              />
              {transcriptName ? (
                <p className="text-xs text-[#13815e]">Uploaded: {transcriptName}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="passport">Passport (PDF)</Label>
              <Input
                id="passport"
                type="file"
                accept="application/pdf"
                onChange={(e) => upload("passport", e.target.files?.[0] || null)}
              />
              {passportName ? (
                <p className="text-xs text-[#13815e]">Uploaded: {passportName}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("personal")}>
                Back
              </Button>
              <Button
                type="button"
                disabled={!transcriptPath || !passportPath || busy}
                onClick={() => setStep("review")}
              >
                Review & submit
              </Button>
            </div>
          </div>
        ) : null}

        {step === "review" ? (
          <div className="space-y-4">
            <dl className="grid gap-2 rounded-xl bg-[#fff8f8] p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-bold text-[#7a6368]">Applicant</dt>
                <dd>{personal.fullName}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#7a6368]">Institution</dt>
                <dd>{institution.name}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#7a6368]">Nationality</dt>
                <dd>{profile.nationality}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#7a6368]">Major / degree</dt>
                <dd>
                  {profile.major} · {profile.targetDegree}
                </dd>
              </div>
            </dl>
            <div className="grid gap-2">
              <Label htmlFor="msg">Optional message to admissions</Label>
              <textarea
                id="msg"
                className="min-h-24 w-full rounded-xl border border-[#e2d4d6] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e1722]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("documents")}>
                Back
              </Button>
              <Button type="button" disabled={busy} onClick={onSubmit}>
                {busy ? "Submitting…" : "Submit application"}
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm font-medium text-[#9e1722]" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
