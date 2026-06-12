import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { goals, groups, crm_tasks, crm_customers, users } from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { ensureDefaults } from "./actions";
import AppShell from "@/components/layout/AppShell";
import DashboardShell from "@/components/dashboard/DashboardShell";
import RealtimeDashboard from "@/components/dashboard/RealtimeDashboard";
import { ToastTrigger } from "@/components/ui/ToastTrigger";
import type { GoalWithDetails, Group, CrmTask, CrmCustomer, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // Verify the *session* user still exists (signs out stale JWTs); data is
  // scoped to the workspace owner.
  const dbUser = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  if (!dbUser) {
    redirect("/login?error=" + encodeURIComponent("Session expired — please sign in again"));
  }

  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  try {
    await ensureDefaults();
  } catch (err) {
    // Non-fatal: the dashboard still renders, but surface the failure so a
    // broken default-seed doesn't silently leave new users without bootstrap data.
    console.error("ensureDefaults failed during dashboard bootstrap", err);
  }

  const [goalsRaw, safeGroups, tasksRaw, customersRaw] = await Promise.all([
    db.query.goals.findMany({
      where: and(eq(goals.user_id, userId), eq(goals.status, "active")),
      with: { groups: true, milestones: true, crm_customers: true, contacts: true },
      orderBy: [desc(goals.pinned), asc(goals.created_at)],
    }),
    db.query.groups.findMany({
      where: eq(groups.user_id, userId),
      orderBy: [asc(groups.sort_order)],
    }),
    db.query.crm_tasks.findMany({
      where: and(eq(crm_tasks.user_id, userId), eq(crm_tasks.done, false)),
      with: { crm_customers: true },
    }),
    db.select({ id: crm_customers.id, name: crm_customers.name })
      .from(crm_customers)
      .where(eq(crm_customers.user_id, userId))
      .orderBy(asc(crm_customers.name)),
  ]);

  const goalsList = goalsRaw.map((g) => ({
    ...g,
    groups: g.groups!,
    milestones: [...(g.milestones ?? [])].sort(
      (a, b) => a.position - b.position
    ),
  })) as unknown as GoalWithDetails[];

  const tasks = tasksRaw as unknown as CrmTask[];
  const customers: Pick<CrmCustomer, "id" | "name">[] = customersRaw;

  return (
    <AppShell user={user}>
      <Suspense>
        <ToastTrigger />
      </Suspense>
      <RealtimeDashboard />
      <Suspense>
        <DashboardShell
          goals={goalsList}
          groups={safeGroups as Group[]}
          tasks={tasks}
          customers={customers}
        />
      </Suspense>
    </AppShell>
  );
}
