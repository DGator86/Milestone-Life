"use server";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_opportunities, crm_contacts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { OpportunityStatus } from "@/lib/types";
import { getSettings } from "@/lib/settings";
import { collectCustomValues } from "@/lib/customFields";
import { resolveOrCreateCustomerId } from "@/lib/crm/resolveCustomer";
import { revalidateCrmEntityPaths } from "@/lib/crm/revalidateEntity";

function stageToStatus(stage: string): OpportunityStatus {
  if (stage === "Won") return "won";
  if (stage === "Lost") return "lost";
  return "open";
}

export async function createOpportunity(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const valueStr = formData.get("value") as string;
  const value = valueStr ? parseFloat(valueStr) : null;
  const stage = (formData.get("stage") as string) || "Lead";

  // Validate relationships server-side: the customer must belong to the user,
  // and the contact must belong to the user and (when set) to that customer.
  // Client-side filtering in OpportunitiesView is convenience only and bypassable.
  const submittedContactId = (formData.get("contact_id") as string) || null;

  const customerId = await resolveOrCreateCustomerId(formData, userId);

  let contactId: string | null = null;
  if (submittedContactId) {
    const ownedContact = await db.query.crm_contacts.findFirst({
      columns: { id: true, customer_id: true },
      where: and(eq(crm_contacts.id, submittedContactId), eq(crm_contacts.user_id, userId)),
    });
    if (ownedContact && (!customerId || ownedContact.customer_id === customerId)) {
      contactId = submittedContactId;
    }
  }

  const { customFields } = await getSettings(userId);
  const custom = collectCustomValues(formData, customFields.opportunity);

  await db.insert(crm_opportunities).values({
    user_id: userId,
    title,
    customer_id: customerId,
    contact_id: contactId,
    flow_id: (formData.get("flow_id") as string) || null,
    value: value !== null && !isNaN(value) ? String(value) : null,
    stage,
    status: stageToStatus(stage),
    close_date: (formData.get("close_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
    custom,
  });

  revalidatePath("/opportunities");
  revalidateCrmEntityPaths({ contactId, customerId });
}

export async function deleteOpportunity(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  await db.delete(crm_opportunities)
    .where(and(eq(crm_opportunities.id, id), eq(crm_opportunities.user_id, userId)));

  revalidatePath("/opportunities");
  revalidatePath("/contacts");
  revalidatePath("/customers");
}

export async function updateOpportunity(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const valueStr = formData.get("value") as string;
  const value = valueStr ? parseFloat(valueStr) : null;
  const stage = (formData.get("stage") as string) || "Lead";

  const submittedContactId = (formData.get("contact_id") as string) || null;
  const customerId = await resolveOrCreateCustomerId(formData, userId);

  let contactId: string | null = null;
  if (submittedContactId) {
    const ownedContact = await db.query.crm_contacts.findFirst({
      columns: { id: true, customer_id: true },
      where: and(eq(crm_contacts.id, submittedContactId), eq(crm_contacts.user_id, userId)),
    });
    if (ownedContact && (!customerId || ownedContact.customer_id === customerId)) {
      contactId = submittedContactId;
    }
  }

  const { customFields } = await getSettings(userId);
  const custom = collectCustomValues(formData, customFields.opportunity);

  await db
    .update(crm_opportunities)
    .set({
      title,
      customer_id: customerId,
      contact_id: contactId,
      flow_id: (formData.get("flow_id") as string) || null,
      value: value !== null && !isNaN(value) ? String(value) : null,
      stage,
      status: stageToStatus(stage),
      close_date: (formData.get("close_date") as string) || null,
      notes: (formData.get("notes") as string) || null,
      custom,
    })
    .where(and(eq(crm_opportunities.id, id), eq(crm_opportunities.user_id, userId)));

  revalidatePath("/opportunities");
}

export async function moveOpportunity(id: string, stage: string) {
  const trimmed = stage.trim();
  if (!trimmed) return;

  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  await db.update(crm_opportunities)
    .set({ stage: trimmed, status: stageToStatus(trimmed) })
    .where(and(eq(crm_opportunities.id, id), eq(crm_opportunities.user_id, userId)));

  revalidatePath("/opportunities");
}
