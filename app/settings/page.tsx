import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import { Settings, User, LogOut, CreditCard, Copy } from "lucide-react";
import { signOutAction } from "@/app/auth-actions";
import { getSettings } from "@/lib/settings";
import { getIsAdmin } from "@/lib/admin";
import { getDataOwnerId } from "@/lib/workspace";
import { isPro } from "@/lib/billing";
import WorkspaceSettingsForm from "@/components/settings/WorkspaceSettingsForm";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user: AppUser = { id: session.user.id, email: session.user.email };
  if (!(await getIsAdmin(user.id))) redirect("/dashboard");
  const settings = await getSettings(await getDataOwnerId());
  const dbUser = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  const pro = isPro(dbUser?.subscription_status);

  const username = user.email?.split("@")[0] ?? "User";
  const initial = username[0].toUpperCase();

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Settings size={20} className="text-milestone-blue" />
            Settings
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Customize your workspace, branding, and preferences</p>
        </div>

        <div className="space-y-4">
          <div className="ms-card">
            <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <User size={12} />
                Account
              </p>
            </div>
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-milestone-blue/30 flex items-center justify-center shrink-0 ring-1 ring-milestone-blue/20">
                <span className="text-milestone-blue text-lg font-bold">{initial}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{username}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
              <div className="ml-auto">
                <Link href="/settings/billing" className={`text-xs font-semibold px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity ${pro ? "bg-milestone-blue-dim text-milestone-blue" : "bg-gray-100 text-gray-500"}`}>
                  {pro ? "Pro Plan" : "Free Plan"}
                </Link>
              </div>
            </div>
          </div>

          <WorkspaceSettingsForm
            companyName={settings.companyName}
            brandColor={settings.brandColor}
            terms={settings.terms}
            preferences={settings.preferences}
            customerTypes={settings.customerTypes}
            customFields={settings.customFields}
          />

          <div className="ms-card">
            <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Copy size={12} />
                Data quality
              </p>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Find duplicates</p>
                <p className="text-xs text-gray-400">Merge or remove duplicate companies and contacts</p>
              </div>
              <Link href="/duplicates" className="text-milestone-blue text-sm font-semibold hover:underline">
                Review →
              </Link>
            </div>
          </div>

          <div className="ms-card">
            <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <CreditCard size={12} />
                Billing
              </p>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{pro ? "Pro Plan" : "Free Plan"}</p>
                <p className="text-xs text-gray-400">{pro ? "$9/month · manage or cancel anytime" : "Upgrade for AI, CRM & team features"}</p>
              </div>
              <Link
                href="/settings/billing"
                className="text-milestone-blue text-sm font-semibold hover:underline"
              >
                {pro ? "Manage" : "Upgrade →"}
              </Link>
            </div>
          </div>

          <div className="ms-card">
            <div className="px-5 py-3.5 border-b border-milestone-line bg-red-50/60">
              <p className="text-xs font-bold uppercase tracking-widest text-milestone-red/70 flex items-center gap-1.5">
                <LogOut size={12} />
                Session
              </p>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Sign out</p>
                <p className="text-xs text-gray-400">End your current session</p>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="bg-milestone-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 active:bg-red-700 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
