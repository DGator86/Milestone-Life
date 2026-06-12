"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createCheckoutSession } from "@/lib/billing";

export async function startCheckout() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?message=Sign+in+to+upgrade");

  const url = await createCheckoutSession(session.user.id, session.user.email ?? "");
  redirect(url);
}

export async function openBillingPortal() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { createBillingPortalSession } = await import("@/lib/billing");
  const url = await createBillingPortalSession(session.user.id);
  redirect(url);
}
