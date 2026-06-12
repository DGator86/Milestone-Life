import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { goals, groups } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import MilestoneCharts from "@/components/dashboard/MilestoneCharts";
import TaskHealth from "@/components/dashboard/TaskHealth";
import Momentum from "@/components/dashboard/Momentum";
import { BarChart3 } from "lucide-react";
import type { GoalWithDetails, Group, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const [groupsRaw, goalsRaw] = await Promise.all([
    db.query.groups.findMany({
      where: eq(groups.user_id, userId),
      orderBy: [asc(groups.sort_order)],
    }),
    db.query.goals.findMany({
      where: eq(goals.user_id, userId),
      with: { groups: true, milestones: true },
      orderBy: [asc(goals.created_at)],
    }),
  ]);

  const goalsList = goalsRaw.map((g) => ({
    ...g,
    groups: g.groups!,
    milestones: [...(g.milestones ?? [])].sort(
      (a, b) => a.position - b.position
    ),
  })) as unknown as GoalWithDetails[];

  const safeGroups: Group[] = groupsRaw as Group[];

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 size={20} className="text-milestone-blue" />
            Reports
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Progress, health, and momentum across your goals</p>
        </div>

        <MilestoneCharts goals={goalsList} groups={safeGroups} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaskHealth goals={goalsList} />
          <Momentum goals={goalsList} />
        </div>
      </div>
    </AppShell>
  );
}
