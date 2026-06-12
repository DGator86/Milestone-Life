import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { goals, groups } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import { Target } from "lucide-react";
import { GoalsList } from "./GoalsList";
import type { GoalWithDetails, Group, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
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
      orderBy: [desc(goals.created_at)],
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
  const active = goalsList.filter((g) => g.status === "active").length;
  const completed = goalsList.filter((g) => g.status === "completed").length;

  return (
    <AppShell user={user}>
      <div className="ms-page max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="ms-page-title">
              <Target size={18} className="text-milestone-blue" />
              All goals
            </h1>
            <p className="ms-page-subtitle">
              {active} active · {completed} completed
            </p>
          </div>
        </div>
        <GoalsList goals={goalsList} groups={safeGroups} />
      </div>
    </AppShell>
  );
}
