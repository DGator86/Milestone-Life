"use server";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_contacts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSettings } from "@/lib/settings";
import { collectCustomValues } from "@/lib/customFields";
import { resolveOrCreateCustomerId } from "@/lib/crm/resolveCustomer";

export async function createContact(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();
  if (!firstName || !lastName) return;

  const customerId = await resolveOrCreateCustomerId(formData, userId);
  const { customFields } = await getSettings(userId);
  const custom = collectCustomValues(formData, customFields.contact);

  await db.insert(crm_contacts).values({
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    title: (formData.get("title") as string) || null,
    customer_id: customerId,
    notes: (formData.get("notes") as string) || null,
    custom,
  });

  revalidatePath("/contacts");
  revalidatePath("/customers");
}

export async function updateContact(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();
  if (!firstName || !lastName) return;

  const customerId = await resolveOrCreateCustomerId(formData, userId);
  const { customFields } = await getSettings(userId);
  const custom = collectCustomValues(formData, customFields.contact);

  await db.update(crm_contacts)
    .set({
      first_name: firstName,
      last_name: lastName,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      title: (formData.get("title") as string) || null,
      customer_id: customerId,
      notes: (formData.get("notes") as string) || null,
      custom,
    })
    .where(and(eq(crm_contacts.id, id), eq(crm_contacts.user_id, userId)));

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  revalidatePath("/customers");
}

export async function deleteContact(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  await db.delete(crm_contacts)
    .where(and(eq(crm_contacts.id, id), eq(crm_contacts.user_id, userId)));

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  revalidatePath("/customers");
}
