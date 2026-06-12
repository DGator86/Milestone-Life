"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { groups, goals } from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { CreateGroupSchema } from "@/lib/schemas";

export async function createGroup(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const userId = await getDataOwnerId();

  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    color: (formData.get("color") as string) || "#1769FF",
  };

  const parsed = CreateGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const { name, color } = parsed.data;

  const existing = await db.query.groups.findFirst({
    where: and(eq(groups.user_id, userId), ilike(groups.name, name)),
  });

  if (existing) return { error: "A group with that name already exists" };

  const allGroups = await db.query.groups.findMany({
    where: eq(groups.user_id, userId),
    orderBy: (g, { desc }) => [desc(g.sort_order)],
  });

  const maxSortOrder = allGroups[0]?.sort_order ?? 0;

  await db.insert(groups).values({
    user_id: userId,
    name,
    color,
    sort_order: maxSortOrder + 1,
  });

  revalidatePath("/groups");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteGroup(groupId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const userId = await getDataOwnerId();

  const activeGoals = await db.query.goals.findMany({
    where: and(eq(goals.group_id, groupId), eq(goals.status, "active")),
  });

  if (activeGoals.length > 0) {
    return { error: "Cannot delete a group that has active goals" };
  }

  await db.delete(groups)
    .where(and(eq(groups.id, groupId), eq(groups.user_id, userId)));

  revalidatePath("/groups");
  revalidatePath("/dashboard");
  return {};
}
