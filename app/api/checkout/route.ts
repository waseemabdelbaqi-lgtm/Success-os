import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ADMISSION_FEE_CENTS, getStripe, isStripeConfigured } from "@/src/lib/stripe";
import { previewCreatePayment } from "@/src/lib/admission/preview-store";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

export const runtime = "nodejs";

type CheckoutBody = {
  institutionId?: string;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
};

export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const institutionId = body.institutionId?.trim();
  if (!institutionId) {
    return NextResponse.json({ error: "institutionId is required" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const successUrl =
    body.successUrl ||
    `${origin}/admission-funnel?paid=1&institution_id=${encodeURIComponent(institutionId)}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = body.cancelUrl || `${origin}/admission-funnel?cancelled=1`;

  const supabase = getSupabaseServerClient();

  // Preview mode when Stripe or Supabase is not configured
  if (!isStripeConfigured() || !supabase) {
    const payment = previewCreatePayment(institutionId);
    const previewUrl = `${origin}/admission-funnel?paid=1&preview=1&payment_id=${payment.id}&unlock_token=${payment.unlock_token}&institution_id=${institutionId}`;
    return NextResponse.json({
      mode: "preview",
      paymentId: payment.id,
      unlockToken: payment.unlock_token,
      sessionId: payment.stripe_session_id,
      url: previewUrl,
      amountCents: ADMISSION_FEE_CENTS,
      currency: "usd",
    });
  }

  const { data: institution, error: instErr } = await supabase
    .from("institutions")
    .select("id,name")
    .eq("id", institutionId)
    .maybeSingle();

  if (instErr) {
    return NextResponse.json({ error: instErr.message }, { status: 500 });
  }
  if (!institution) {
    return NextResponse.json({ error: "Institution not found" }, { status: 404 });
  }

  const unlockToken = randomUUID().replace(/-/g, "");
  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .insert({
      institution_id: institutionId,
      amount_cents: ADMISSION_FEE_CENTS,
      currency: "usd",
      status: "pending",
      unlock_token: unlockToken,
    })
    .select("id,unlock_token")
    .single();

  if (payErr || !payment) {
    return NextResponse.json({ error: payErr?.message || "Could not create payment" }, { status: 500 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: body.customerEmail || undefined,
    success_url: successUrl.includes("{CHECKOUT_SESSION_ID}")
      ? successUrl
      : `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: ADMISSION_FEE_CENTS,
          product_data: {
            name: "SUCCESS OS — Admission application fee",
            description: `Fixed $5 USD unlock fee for ${institution.name}`,
          },
        },
      },
    ],
    metadata: {
      payment_id: payment.id,
      institution_id: institutionId,
      unlock_token: payment.unlock_token,
    },
  });

  await supabase
    .from("payments")
    .update({ stripe_session_id: session.id })
    .eq("id", payment.id);

  return NextResponse.json({
    mode: "stripe",
    paymentId: payment.id,
    unlockToken: payment.unlock_token,
    sessionId: session.id,
    url: session.url,
    amountCents: ADMISSION_FEE_CENTS,
    currency: "usd",
  });
}
