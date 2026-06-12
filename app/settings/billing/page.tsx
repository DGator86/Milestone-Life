import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import { CreditCard, CheckCircle2, Zap } from "lucide-react";
import { isPro } from "@/lib/billing";
import { openBillingPortal, startCheckout } from "@/app/pricing/actions";
import Link from "next/link";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user: AppUser = { id: session.user.id, email: session.user.email };
  const params = await searchParams;

  const dbUser = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  const status = dbUser?.subscription_status ?? "free";
  const pro = isPro(status);
  const hasStripe = !!process.env.STRIPE_PRO_PRICE_ID;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CreditCard size={20} className="text-milestone-blue" />
            Billing
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage your subscription and payment method</p>
        </div>

        {params.success && (
          <div className="flex items-center gap-2.5 bg-milestone-green-dim border border-milestone-green/30 text-milestone-green rounded-xl px-4 py-3 mb-4 text-sm font-medium">
            <CheckCircle2 size={16} />
            You&apos;re now on Pro! Enjoy all the features.
          </div>
        )}

        <div className="space-y-4">
          {/* Current plan */}
          <div className="ms-card">
            <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Current plan</p>
            </div>
            <div className="p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pro ? "bg-[#EEF3FF]" : "bg-gray-100"}`}>
                <Zap size={18} className={pro ? "text-milestone-blue fill-milestone-blue" : "text-gray-400"} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{pro ? "Pro" : "Free"}</p>
                <p className="text-sm text-gray-400">
                  {pro ? "$9 / month · cancel anytime" : "Upgrade for AI, CRM & team features"}
                </p>
              </div>
              <div className="ml-auto">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pro ? "bg-milestone-blue-dim text-milestone-blue" : "bg-gray-100 text-gray-500"}`}>
                  {pro ? "Active" : "Free"}
                </span>
              </div>
            </div>

            {hasStripe && (
              <div className="px-5 pb-5">
                {pro ? (
                  <form action={openBillingPortal}>
                    <button
                      type="submit"
                      className="w-full border border-milestone-line text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      Manage subscription
                    </button>
                  </form>
                ) : (
                  <form action={startCheckout}>
                    <button
                      type="submit"
                      className="w-full bg-milestone-blue text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm shadow-sm shadow-blue-200"
                    >
                      Upgrade to Pro — $9/mo
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {!pro && (
            <div className="ms-card">
              <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">What&apos;s included in Pro</p>
              </div>
              <div className="p-5 grid grid-cols-2 gap-2 text-sm text-gray-600">
                {["AI assistant", "CRM suite", "Team workspace", "Priority support", "Advanced reporting", "Timeline view"].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-milestone-blue shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link
                  href="/pricing"
                  className="text-milestone-blue text-sm font-semibold hover:underline"
                >
                  View full pricing →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
