import { getStripe } from "./stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSiteUrl } from "./site-url";

export function isPro(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (user?.stripe_customer_id) return user.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({ email, metadata: { userId } });
  await db.update(users).set({ stripe_customer_id: customer.id }).where(eq(users.id, userId));
  return customer.id;
}

export async function createCheckoutSession(userId: string, email: string): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(userId, email);
  const base = getSiteUrl();

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${base}/settings/billing?success=1`,
    cancel_url: `${base}/pricing`,
    metadata: { userId },
  });

  return session.url!;
}

export async function createBillingPortalSession(userId: string): Promise<string> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user?.stripe_customer_id) throw new Error("No Stripe customer on record");

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${getSiteUrl()}/settings/billing`,
  });

  return session.url;
}
