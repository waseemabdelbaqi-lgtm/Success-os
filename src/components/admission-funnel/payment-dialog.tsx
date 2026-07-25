"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { ADMISSION_FEE_USD } from "@/src/lib/admission/constants";
import type { Institution } from "@/src/types/admission";

type Props = {
  open: boolean;
  institution: Institution | null;
  customerEmail?: string;
  onOpenChange: (open: boolean) => void;
  onUnlocked: (payload: {
    paymentId: string;
    unlockToken: string;
    institutionId: string;
  }) => void;
};

export function PaymentDialog({
  open,
  institution,
  customerEmail,
  onOpenChange,
  onUnlocked,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (!institution) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionId: institution.id,
          customerEmail,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        mode?: string;
        url?: string;
        paymentId?: string;
        unlockToken?: string;
      };
      if (!res.ok || data.error) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.mode === "preview" && data.paymentId && data.unlockToken) {
        // Preview: confirm payment immediately, then unlock
        await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: data.paymentId }),
        });
        onUnlocked({
          paymentId: data.paymentId,
          unlockToken: data.unlockToken,
          institutionId: institution.id,
        });
        onOpenChange(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Unlock application — ${ADMISSION_FEE_USD} USD</DialogTitle>
          <DialogDescription>
            A fixed ${ADMISSION_FEE_USD} application fee unlocks the form for{" "}
            <strong>{institution?.name}</strong>. After payment you can upload transcripts and
            passport PDF, then submit.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 ps-5 text-sm text-[#4d3439]">
          <li>Secure Stripe Checkout (or preview mode when keys are absent)</li>
          <li>
            Partner schools receive an in-app notification; non-partners receive an official email
          </li>
          <li>Fee is non-refundable once the application form is unlocked</li>
        </ul>
        {error ? (
          <p className="text-sm font-medium text-[#9e1722]" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={busy || !institution} onClick={startCheckout}>
            {busy ? "Starting checkout…" : `Pay $${ADMISSION_FEE_USD} & continue`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
