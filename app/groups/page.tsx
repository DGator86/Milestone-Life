import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import { Users } from "lucide-react";
import { GroupsClient } from "./GroupsClient";
import type { Group, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const groupsRaw = await db.query.groups.findMany({
    where: eq(groups.user_id, userId),
    orderBy: [asc(groups.sort_order)],
  });

  const safeGroups: Group[] = groupsRaw as Group[];

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users size={20} className="text-milestone-blue" />
            Groups
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Organize your goals by life area · {safeGroups.length} groups
          </p>
        </div>
        <GroupsClient groups={safeGroups} />
      </div>
    </AppShell>
  );
}
