"use server";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_tasks, goals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { revalidateCrmEntityPathsFromForm } from "@/lib/crm/revalidateEntity";
import type { TaskType, TaskPriority } from "@/lib/types";

const TASK_TYPES: TaskType[] = ["call", "email", "meeting", "task", "document"];
const TASK_PRIORITIES: TaskPriority[] = ["critical", "high", "medium", "low"];

export async function createTask(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const type = formData.get("type") as TaskType;
  const priority = formData.get("priority") as TaskPriority;

  await db.insert(crm_tasks).values({
    user_id: userId,
    title,
    type: TASK_TYPES.includes(type) ? type : "task",
    priority: TASK_PRIORITIES.includes(priority) ? priority : "medium",
    due_date: (formData.get("due_date") as string) || null,
    customer_id: (formData.get("customer_id") as string) || null,
    contact_id: (formData.get("contact_id") as string) || null,
    opportunity_id: (formData.get("opportunity_id") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidateCrmEntityPathsFromForm(formData);
}

export async function toggleTaskDone(id: string, done: boolean) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  await db.update(crm_tasks)
    .set({ done, completed_at: done ? new Date().toISOString() : null })
    .where(and(eq(crm_tasks.id, id), eq(crm_tasks.user_id, userId)));

  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/contacts");
  revalidatePath("/customers");
}

export async function deleteTask(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  await db.delete(crm_tasks)
    .where(and(eq(crm_tasks.id, id), eq(crm_tasks.user_id, userId)));

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/contacts");
  revalidatePath("/customers");
}

export async function toggleGoalPinned(id: string, pinned: boolean) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  await db.update(goals)
    .set({ pinned })
    .where(and(eq(goals.id, id), eq(goals.user_id, userId)));

  revalidatePath("/dashboard");
}
