import Stripe from "stripe";

export { ADMISSION_FEE_CENTS, ADMISSION_FEE_USD } from "@/src/lib/admission/constants";

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key, {
    typescript: true,
  });
}
