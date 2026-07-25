import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/src/lib/stripe";
import {
  previewGetPayment,
  previewMarkPaidById,
  previewMarkPaidBySession,
} from "@/src/lib/admission/preview-store";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Client-side success return helper.
 * Prefer the Stripe webhook for production; this confirms unlock after redirect.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    sessionId?: string;
    paymentId?: string;
  };

  const supabase = getSupabaseServerClient();

  if (!supabase || !isStripeConfigured()) {
    if (body.paymentId) {
      const row = previewMarkPaidById(body.paymentId) || previewGetPayment(body.paymentId);
      return NextResponse.json({
        ok: true,
        mode: "preview",
        paymentId: row?.id,
        unlockToken: row?.unlock_token,
        status: row?.status,
        institutionId: row?.institution_id,
      });
    }
    if (body.sessionId) {
      const row = previewMarkPaidBySession(body.sessionId);
      return NextResponse.json({
        ok: true,
        mode: "preview",
        paymentId: row?.id,
        unlockToken: row?.unlock_token,
        status: row?.status,
        institutionId: row?.institution_id,
      });
    }
    return NextResponse.json({ error: "paymentId or sessionId required" }, { status: 400 });
  }

  if (body.sessionId && isStripeConfigured()) {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(body.sessionId);
    if (session.payment_status === "paid") {
      const paymentId = session.metadata?.payment_id;
      const q = paymentId
        ? supabase.from("payments").update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_session_id: session.id,
          }).eq("id", paymentId)
        : supabase.from("payments").update({
            status: "paid",
            paid_at: new Date().toISOString(),
          }).eq("stripe_session_id", session.id);

      await q;
    }
  }

  let query = supabase.from("payments").select("*");
  if (body.paymentId) query = query.eq("id", body.paymentId);
  else if (body.sessionId) query = query.eq("stripe_session_id", body.sessionId);
  else return NextResponse.json({ error: "paymentId or sessionId required" }, { status: 400 });

  const { data: payment, error } = await query.maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    mode: "stripe",
    paymentId: payment.id,
    unlockToken: payment.unlock_token,
    status: payment.status,
    institutionId: payment.institution_id,
  });
}
