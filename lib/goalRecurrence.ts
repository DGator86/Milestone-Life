import { db } from "@/db";
import { goals, milestones, activity_log } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { advanceDate, type RecurrenceUnit } from "@/lib/recurrence";
import { localDateKey } from "@/lib/dates";

export async function maybeAdvanceRecurringGoal(goalId: string): Promise<boolean> {
  const goal = await db.query.goals.findFirst({
    where: eq(goals.id, goalId),
    with: { milestones: { orderBy: [asc(milestones.position)] } },
  });

  if (!goal?.is_recurring) return false;

  const interval = goal.recurrence_interval ?? 1;
  const unit = (goal.recurrence_unit ?? "week") as RecurrenceUnit;
  const currentDue = goal.due_date ?? localDateKey();
  const nextDue = advanceDate(currentDue, interval, unit);

  if (goal.recurrence_end_date && nextDue > goal.recurrence_end_date) {
    await db.update(goals)
      .set({ status: "completed" })
      .where(eq(goals.id, goalId));
    return false;
  }

  await db.update(goals)
    .set({
      status: "active",
      due_date: nextDue,
    })
    .where(eq(goals.id, goalId));

  const milestoneRows = goal.milestones ?? [];
  for (let i = 0; i < milestoneRows.length; i++) {
    await db.update(milestones)
      .set({
        status: i === 0 ? "in_progress" : "upcoming",
        completed_at: null,
      })
      .where(eq(milestones.id, milestoneRows[i].id));
  }

  await db.insert(activity_log).values({
    goal_id: goalId,
    action: "goal_recurred",
    metadata: { next_due: nextDue, interval, unit },
  });

  return true;
}
