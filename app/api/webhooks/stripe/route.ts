import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/src/lib/stripe";
import { previewMarkPaidBySession } from "@/src/lib/admission/preview-store";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!isStripeConfigured()) {
    // Preview webhook: accept JSON with session id
    try {
      const body = JSON.parse(payload) as { sessionId?: string };
      if (body.sessionId) {
        const row = previewMarkPaidBySession(body.sessionId);
        return NextResponse.json({ received: true, preview: true, payment: row });
      }
    } catch {
      /* fall through */
    }
    return NextResponse.json({ received: true, preview: true });
  }

  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (secret && signature) {
      event = stripe.webhooks.constructEvent(payload, signature, secret);
    } else {
      event = JSON.parse(payload);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      payment_intent?: string | null;
      metadata?: { payment_id?: string };
    };

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      previewMarkPaidBySession(session.id);
      return NextResponse.json({ received: true, mode: "preview" });
    }

    const paymentId = session.metadata?.payment_id;
    const update = {
      status: "paid" as const,
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    };

    if (paymentId) {
      await supabase.from("payments").update(update).eq("id", paymentId);
    } else {
      await supabase.from("payments").update(update).eq("stripe_session_id", session.id);
    }
  }

  return NextResponse.json({ received: true });
}
