"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, user_settings, groups, goals, milestones } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function completeOnboarding(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const name = (formData.get("name") as string)?.trim() || null;

  if (name) {
    await db.update(users).set({ name }).where(eq(users.id, userId));
  }

  // Upsert user_settings with onboarding timestamp
  await db
    .insert(user_settings)
    .values({
      user_id: userId,
      onboarding_completed_at: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: user_settings.user_id,
      set: { onboarding_completed_at: new Date().toISOString() },
    });

  // Seed the three goal categories if not yet created
  const existing = await db.query.groups.findMany({ where: eq(groups.user_id, userId) });
  const existingNames = new Set(existing.map((g) => g.name));

  const toCreate = [
    { name: "Work", color: "#1769FF", sort_order: 0 },
    { name: "Home", color: "#36A852", sort_order: 1 },
    { name: "Health", color: "#F8B400", sort_order: 2 },
  ].filter((g) => !existingNames.has(g.name));

  if (toCreate.length > 0) {
    await db.insert(groups).values(toCreate.map((g) => ({ ...g, user_id: userId })));
  }

  // Seed a sample goal in the Work group so the dashboard isn't empty
  const workGroup = await db.query.groups.findFirst({
    where: eq(groups.user_id, userId),
  });
  if (workGroup) {
    const existingGoals = await db.query.goals.findFirst({ where: eq(goals.user_id, userId) });
    if (!existingGoals) {
      const [goal] = await db
        .insert(goals)
        .values({
          user_id: userId,
          group_id: workGroup.id,
          title: "Hit my first milestone",
          goal_type: "concrete",
          importance: "high",
          status: "active",
        })
        .returning();

      if (goal) {
        await db.insert(milestones).values([
          { goal_id: goal.id, title: "Define my most important goal", position: 0, status: "in_progress" },
          { goal_id: goal.id, title: "Break it into 3 clear steps", position: 1, status: "upcoming" },
          { goal_id: goal.id, title: "Complete the first step", position: 2, status: "upcoming" },
        ]);
      }
    }
  }

  redirect("/dashboard");
}
