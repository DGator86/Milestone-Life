import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { goals, milestones } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import CompletedView from "@/components/CompletedView";
import { getSettings } from "@/lib/settings";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CompletedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const user: AppUser = { id: userId, email: session.user.email };

  const [goalRows, msRows] = await Promise.all([
    db
      .select({ id: goals.id, title: goals.title, updated_at: goals.updated_at })
      .from(goals)
      .where(and(eq(goals.user_id, userId), eq(goals.status, "completed")))
      .orderBy(desc(goals.updated_at)),
    db
      .select({
        id: milestones.id,
        title: milestones.title,
        completed_at: milestones.completed_at,
        goal_id: milestones.goal_id,
        goal_title: goals.title,
      })
      .from(milestones)
      .innerJoin(goals, eq(milestones.goal_id, goals.id))
      .where(and(eq(goals.user_id, userId), eq(milestones.status, "completed")))
      .orderBy(desc(milestones.completed_at)),
  ]);

  const { terms } = await getSettings(userId);

  return (
    <AppShell user={user}>
      <CompletedView
        goals={goalRows}
        milestones={msRows}
        goalLabelPlural={terms.goals}
        goalLabelSingular={terms.goal}
        milestoneLabelPlural={terms.milestones}
        milestoneLabelSingular={terms.milestone}
      />
    </AppShell>
  );
}
