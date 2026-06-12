"use server";

import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import {
  crm_contacts,
  crm_customers,
  crm_opportunities,
  crm_tasks,
  crm_flow_instances,
  goals,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ActionResult = { error?: string; success?: boolean };

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return getDataOwnerId();
}

export async function mergeCustomers(keepId: string, mergeId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { error: "Unauthorized" };

  const [keep, merge] = await Promise.all([
    db.query.crm_customers.findFirst({
      where: and(eq(crm_customers.id, keepId), eq(crm_customers.user_id, userId)),
    }),
    db.query.crm_customers.findFirst({
      where: and(eq(crm_customers.id, mergeId), eq(crm_customers.user_id, userId)),
    }),
  ]);
  if (!keep || !merge) return { error: "Company not found" };
  if (keepId === mergeId) return { error: "Choose two different records" };

  await db
    .update(crm_contacts)
    .set({ customer_id: keepId })
    .where(and(eq(crm_contacts.customer_id, mergeId), eq(crm_contacts.user_id, userId)));
  await db
    .update(crm_opportunities)
    .set({ customer_id: keepId })
    .where(and(eq(crm_opportunities.customer_id, mergeId), eq(crm_opportunities.user_id, userId)));
  await db
    .update(crm_tasks)
    .set({ customer_id: keepId })
    .where(and(eq(crm_tasks.customer_id, mergeId), eq(crm_tasks.user_id, userId)));
  await db
    .update(goals)
    .set({ customer_id: keepId })
    .where(and(eq(goals.customer_id, mergeId), eq(goals.user_id, userId)));
  await db
    .update(crm_flow_instances)
    .set({ customer_id: keepId })
    .where(and(eq(crm_flow_instances.customer_id, mergeId), eq(crm_flow_instances.user_id, userId)));

  await db
    .update(crm_customers)
    .set({
      industry: keep.industry ?? merge.industry,
      website: keep.website ?? merge.website,
      phone: keep.phone ?? merge.phone,
      email: keep.email ?? merge.email,
      notes: [keep.notes, merge.notes].filter(Boolean).join("\n\n") || null,
    })
    .where(eq(crm_customers.id, keepId));

  await db
    .delete(crm_customers)
    .where(and(eq(crm_customers.id, mergeId), eq(crm_customers.user_id, userId)));

  revalidatePath("/duplicates");
  revalidatePath("/customers");
  revalidatePath("/contacts");
  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function mergeContacts(keepId: string, mergeId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { error: "Unauthorized" };

  const [keep, merge] = await Promise.all([
    db.query.crm_contacts.findFirst({
      where: and(eq(crm_contacts.id, keepId), eq(crm_contacts.user_id, userId)),
    }),
    db.query.crm_contacts.findFirst({
      where: and(eq(crm_contacts.id, mergeId), eq(crm_contacts.user_id, userId)),
    }),
  ]);
  if (!keep || !merge) return { error: "Contact not found" };
  if (keepId === mergeId) return { error: "Choose two different records" };

  await db
    .update(crm_opportunities)
    .set({ contact_id: keepId })
    .where(and(eq(crm_opportunities.contact_id, mergeId), eq(crm_opportunities.user_id, userId)));
  await db
    .update(crm_tasks)
    .set({ contact_id: keepId })
    .where(and(eq(crm_tasks.contact_id, mergeId), eq(crm_tasks.user_id, userId)));

  await db
    .update(crm_contacts)
    .set({
      customer_id: keep.customer_id ?? merge.customer_id,
      email: keep.email ?? merge.email,
      phone: keep.phone ?? merge.phone,
      title: keep.title ?? merge.title,
      notes: [keep.notes, merge.notes].filter(Boolean).join("\n\n") || null,
    })
    .where(eq(crm_contacts.id, keepId));

  await db
    .delete(crm_contacts)
    .where(and(eq(crm_contacts.id, mergeId), eq(crm_contacts.user_id, userId)));

  revalidatePath("/duplicates");
  revalidatePath("/contacts");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteDuplicateRecord(
  entity: "customer" | "contact",
  id: string,
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { error: "Unauthorized" };

  if (entity === "customer") {
    await db
      .delete(crm_customers)
      .where(and(eq(crm_customers.id, id), eq(crm_customers.user_id, userId)));
  } else {
    await db
      .delete(crm_contacts)
      .where(and(eq(crm_contacts.id, id), eq(crm_contacts.user_id, userId)));
  }

  revalidatePath("/duplicates");
  revalidatePath("/customers");
  revalidatePath("/contacts");
  return { success: true };
}
