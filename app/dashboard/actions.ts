"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { goals, milestones, activity_log, groups } from "@/db/schema";
import { eq, and, ne, asc, max } from "drizzle-orm";
import { CreateGoalSchema } from "@/lib/schemas";
import { parseRecurrenceFromForm } from "@/lib/recurrence";
import { maybeAdvanceRecurringGoal } from "@/lib/goalRecurrence";

export async function createGoal(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();

  interface MilestoneData {
    title: string;
    due_date: string | null;
    touch_target: number | null;
    touch_period: string | null;
  }
  const milestoneData: MilestoneData[] = [];
  for (let i = 1; i <= 10; i++) {
    const t = (formData.get(`milestone_${i}`) as string)?.trim();
    if (!t) continue;
    const schedType = (formData.get(`milestone_${i}_schedule`) as string) || "none";
    const schedDate = schedType === "date" ? ((formData.get(`milestone_${i}_date`) as string) || null) : null;
    const touchTarget = schedType === "frequency" ? parseInt(formData.get(`milestone_${i}_target`) as string) || null : null;
    const touchPeriod = schedType === "frequency" ? ((formData.get(`milestone_${i}_period`) as string) || null) : null;
    milestoneData.push({ title: t, due_date: schedDate, touch_target: touchTarget, touch_period: touchPeriod });
  }

  const recurrence = parseRecurrenceFromForm(formData);
  const raw = {
    title: (formData.get("title") as string)?.trim() ?? "",
    group_id: (formData.get("group_id") as string) ?? "",
    goal_type: (formData.get("goal_type") as string) || "concrete",
    importance: (formData.get("importance") as string) || "normal",
    due_date: (formData.get("due_date") as string) || null,
    ...recurrence,
  };

  const parsed = CreateGoalSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Validation error";
    redirect(`/dashboard?error=${encodeURIComponent(msg)}`);
  }

  if (milestoneData.length === 0) {
    redirect("/dashboard?error=At+least+one+milestone+is+required");
  }

  const {
    title,
    group_id: groupId,
    goal_type: goalType,
    importance,
    due_date: dueDate,
    is_recurring: isRecurring,
    recurrence_interval: recurrenceInterval,
    recurrence_unit: recurrenceUnit,
    recurrence_end_date: recurrenceEndDate,
  } = parsed.data;

  const [goal] = await db.insert(goals).values({
    user_id: userId,
    group_id: groupId,
    title,
    goal_type: goalType,
    importance,
    status: "active",
    due_date: dueDate || null,
    is_recurring: isRecurring,
    recurrence_interval: recurrenceInterval,
    recurrence_unit: recurrenceUnit,
    recurrence_end_date: recurrenceEndDate,
  }).returning();

  if (!goal) redirect("/dashboard?error=Failed+to+create+goal");

  const milestoneRows = milestoneData.map((m, i) => ({
    goal_id: goal.id,
    title: m.title,
    position: i,
    status: i === 0 ? "in_progress" : "upcoming",
    due_date: m.due_date,
    touch_target: m.touch_target,
    touch_period: m.touch_period,
  }));

  await db.insert(milestones).values(milestoneRows);

  await db.insert(activity_log).values({
    goal_id: goal.id,
    action: "goal_created",
    metadata: { title: goal.title },
  });

  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
  redirect("/dashboard?created=1");
}

export async function completeMilestone(milestoneId: string, goalId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();

  // Authorize: the milestone must belong to a goal owned by this user before
  // any mutation — otherwise a guessed milestone id could be completed.
  const owned = await db
    .select({ id: milestones.id })
    .from(milestones)
    .innerJoin(goals, eq(goals.id, milestones.goal_id))
    .where(and(
      eq(milestones.id, milestoneId),
      eq(milestones.goal_id, goalId),
      eq(goals.user_id, userId),
    ))
    .limit(1);
  if (owned.length === 0) redirect("/dashboard?error=Not+authorized");

  await db.update(milestones)
    .set({ status: "completed", completed_at: new Date().toISOString() })
    .where(and(eq(milestones.id, milestoneId), eq(milestones.goal_id, goalId)));

  const remaining = await db.query.milestones.findMany({
    where: and(eq(milestones.goal_id, goalId), ne(milestones.status, "completed")),
    orderBy: [asc(milestones.position)],
  });

  if (remaining.length > 0) {
    await db.update(milestones)
      .set({ status: "in_progress" })
      .where(eq(milestones.id, remaining[0].id));
  } else {
    const advanced = await maybeAdvanceRecurringGoal(goalId);
    if (!advanced) {
      await db.update(goals)
        .set({ status: "completed" })
        .where(and(eq(goals.id, goalId), eq(goals.user_id, userId)));
    }
  }

  await db.insert(activity_log).values({
    goal_id: goalId,
    milestone_id: milestoneId,
    action: "milestone_completed",
    metadata: {},
  });

  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
  revalidatePath("/contacts");
  revalidatePath("/customers");
}

export async function ensureDefaults() {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const existing = await db.query.groups.findMany({ where: eq(groups.user_id, userId) });
  if (existing.length > 0) return;

  await db.insert(groups).values([
    { user_id: userId, name: "Business", color: "#1769FF", sort_order: 0 },
  ]);
}
