import { NextResponse } from "next/server";
import { ADMISSION_FEE_CENTS, ADMISSION_FEE_USD, getStripe, isStripeConfigured } from "@/src/lib/stripe";
import { previewCreatePayment } from "@/src/lib/admission/preview-store";
import { getSupabaseServerClient } from "@/src/utils/supabase/server";

export const runtime = "nodejs";

type CheckoutBody = {
  institutionId?: string;
  userId?: string;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  fullName?: string;
  nationality?: string;
  gpa?: number;
  targetDegree?: string;
  major?: string;
};

/** إنشاء جلسة الدفع عبر Stripe (Stripe Session) — $5 USD */
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
    `${origin}/apply/${encodeURIComponent(institutionId)}?paid=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = body.cancelUrl || `${origin}/admission?cancelled=1`;

  const supabase = getSupabaseServerClient();

  if (!isStripeConfigured() || !supabase) {
    const payment = previewCreatePayment(institutionId, body.userId);
    const previewUrl = `${origin}/apply/${encodeURIComponent(institutionId)}?paid=1&preview=1&payment_id=${payment.id}&unlock_token=${encodeURIComponent(payment.stripe_session_id)}`;
    return NextResponse.json({
      mode: "preview",
      paymentId: payment.id,
      unlockToken: payment.stripe_session_id,
      sessionId: payment.stripe_session_id,
      url: previewUrl,
      amount: ADMISSION_FEE_USD,
      amountCents: ADMISSION_FEE_CENTS,
      currency: "usd",
    });
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json(
      {
        error:
          "userId is required for Stripe checkout (profiles.id = auth.users.id). Sign in, or use preview mode without Stripe keys.",
      },
      { status: 400 },
    );
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

  const { error: profileErr } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: body.fullName || "Applicant",
    nationality: body.nationality || "All",
    gpa: Number(body.gpa ?? 0),
    target_degree: body.targetDegree || "bachelor",
    major: body.major || null,
    email: body.customerEmail || null,
  });

  if (profileErr) {
    return NextResponse.json(
      {
        error: `Could not upsert profile: ${profileErr.message}. Ensure auth.users contains this user id.`,
      },
      { status: 400 },
    );
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
            description: `Fixed $${ADMISSION_FEE_USD} USD unlock fee for ${institution.name}`,
          },
        },
      },
    ],
    metadata: {
      // Both casings supported by /api/webhook/stripe
      institution_id: institutionId,
      institutionId,
      user_id: userId,
      userId,
    },
  });

  if (!session.id) {
    return NextResponse.json({ error: "Stripe session missing id" }, { status: 500 });
  }

  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      institution_id: institutionId,
      stripe_session_id: session.id,
      status: "pending",
      amount: ADMISSION_FEE_USD,
    })
    .select("id,stripe_session_id")
    .single();

  if (payErr || !payment) {
    return NextResponse.json(
      { error: payErr?.message || "Could not create payment" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    mode: "stripe",
    paymentId: payment.id,
    unlockToken: payment.stripe_session_id,
    sessionId: session.id,
    url: session.url,
    amount: ADMISSION_FEE_USD,
    amountCents: ADMISSION_FEE_CENTS,
    currency: "usd",
  });
}
