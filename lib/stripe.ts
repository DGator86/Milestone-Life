import Stripe from "stripe";

// Lazy Stripe client — key is resolved at call time so the module can be
// imported during Next.js builds where env vars aren't present yet.
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}
