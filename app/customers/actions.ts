"use server";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSettings } from "@/lib/settings";
import { collectCustomValues } from "@/lib/customFields";

const VALID_CUSTOMER_STATUSES = ["prospect", "active", "inactive"] as const;

// Accept the submitted customer_type only if it's one of the workspace's
// configured types (or empty), so the column stays in sync with Settings.
async function resolveCustomerType(formData: FormData, userId: string): Promise<string | null> {
  const raw = (formData.get("customer_type") as string)?.trim() || null;
  if (!raw) return null;
  const { customerTypes } = await getSettings(userId);
  return customerTypes.includes(raw) ? raw : null;
}

export async function createCustomer(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const rawStatus = (formData.get("status") as string) || "prospect";
  const status = (VALID_CUSTOMER_STATUSES as readonly string[]).includes(rawStatus)
    ? rawStatus
    : "prospect";

  const customerType = await resolveCustomerType(formData, userId);
  const { customFields } = await getSettings(userId);
  const custom = collectCustomValues(formData, customFields.customer);

  await db.insert(crm_customers).values({
    user_id: userId,
    name,
    customer_type: customerType,
    industry: (formData.get("industry") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    website: (formData.get("website") as string) || null,
    status,
    notes: (formData.get("notes") as string) || null,
    custom,
  });

  revalidatePath("/customers");
}

export async function updateCustomer(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const rawStatus = (formData.get("status") as string) || "prospect";
  const status = (VALID_CUSTOMER_STATUSES as readonly string[]).includes(rawStatus)
    ? rawStatus
    : "prospect";

  const customerType = await resolveCustomerType(formData, userId);
  const { customFields } = await getSettings(userId);
  const custom = collectCustomValues(formData, customFields.customer);

  await db.update(crm_customers)
    .set({
      name,
      customer_type: customerType,
      industry: (formData.get("industry") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      website: (formData.get("website") as string) || null,
      status,
      notes: (formData.get("notes") as string) || null,
      custom,
    })
    .where(and(eq(crm_customers.id, id), eq(crm_customers.user_id, userId)));

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  revalidatePath("/contacts");
}

export async function deleteCustomer(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  await db.delete(crm_customers)
    .where(and(eq(crm_customers.id, id), eq(crm_customers.user_id, userId)));

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  revalidatePath("/contacts");
}

export async function updateCustomerStatus(id: string, status: string) {
  if (!(VALID_CUSTOMER_STATUSES as readonly string[]).includes(status)) return;

  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  await db.update(crm_customers)
    .set({ status })
    .where(and(eq(crm_customers.id, id), eq(crm_customers.user_id, userId)));

  revalidatePath("/customers");
}
