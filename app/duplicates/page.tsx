import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import AppShell from "@/components/layout/AppShell";
import DuplicatesView from "@/components/duplicates/DuplicatesView";
import { findDuplicateGroups } from "@/lib/crm/duplicates";
import { Copy } from "lucide-react";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DuplicatesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user: AppUser = { id: session.user.id, email: session.user.email };
  const groups = await findDuplicateGroups(await getDataOwnerId());

  return (
    <AppShell user={user}>
      <div className="ms-page max-w-3xl">
        <div className="mb-4">
          <h1 className="ms-page-title">
            <Copy size={18} className="text-milestone-blue" />
            Duplicates
          </h1>
          <p className="ms-page-subtitle">
            Review possible duplicate companies and contacts. Choose which record to keep, then merge or delete extras.
          </p>
          <Link href="/settings" className="text-xs text-milestone-blue hover:underline mt-1 inline-block">
            ← Back to settings
          </Link>
        </div>
        <DuplicatesView groups={groups} />
      </div>
    </AppShell>
  );
}
