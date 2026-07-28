import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { previewMarkPaidBySession } from "@/src/lib/admission/preview-store";
import { getStripe, isStripeConfigured } from "@/src/lib/stripe";

export const runtime = "nodejs";

/**
 * Stripe webhook — verifies signature, marks payments.completed on
 * checkout.session.completed so the unified application form unlocks.
 */
export async function POST(request: Request) {
  const body = await request.text();

  // Preview / local mode when Stripe is not configured
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    try {
      const json = JSON.parse(body) as { sessionId?: string };
      if (json.sessionId) {
        const row = previewMarkPaidBySession(json.sessionId);
        return NextResponse.json({ received: true, preview: true, payment: row });
      }
    } catch {
      /* fall through */
    }
    return NextResponse.json({ received: true, preview: true }, { status: 200 });
  }

  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  // 1. التحقق من أمان وصحة الطلب القادم للتأكد أنه مرسل فعلاً من خوادم Stripe
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook Signature Verification Failed: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // 2. معالجة الحدث عند إتمام الدفع بنجاح (checkout.session.completed)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // استخراج المعطيات المخزنة مسبقاً في الـ Metadata (camelCase أو snake_case)
    const userId = session.metadata?.userId || session.metadata?.user_id;
    const institutionId =
      session.metadata?.institutionId || session.metadata?.institution_id;
    const stripeSessionId = session.id;

    try {
      const supabase = await createClient();

      if (userId && institutionId) {
        // تحديث حالة الدفع إلى "مكتمل" (completed) لفتح بوابة نموذج البيانات للطالب
        const { error } = await supabase
          .from("payments")
          .update({ status: "completed" })
          .eq("user_id", userId)
          .eq("institution_id", institutionId)
          .eq("stripe_session_id", stripeSessionId);

        if (error) {
          console.error("Failed to update payment status in Supabase:", error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
      } else {
        // Fallback: session id only (legacy checkout sessions)
        const { error } = await supabase
          .from("payments")
          .update({ status: "completed" })
          .eq("stripe_session_id", stripeSessionId);

        if (error) {
          console.error("Failed to update payment by session id:", error);
          return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Supabase unavailable";
      console.error(message);
      // Keep Stripe retries meaningful when DB credentials are missing in prod
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      const supabase = await createClient();
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("stripe_session_id", session.id);
    } catch (err) {
      console.error("Failed to mark expired checkout:", err);
    }
  }

  // إرسال رد إيجابي لـ Stripe لتأكيد استلام وتجهيز الـ Webhook بنجاح
  return NextResponse.json({ received: true }, { status: 200 });
}
