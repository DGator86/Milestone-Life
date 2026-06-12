import { db } from "@/db";
import { crm_customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/** Returns the submitted customer_id only if it belongs to the user. */
async function resolveOwnedCustomerId(
  formData: FormData,
  userId: string,
): Promise<string | null> {
  const customerId = (formData.get("customer_id") as string) || null;
  if (!customerId) return null;
  const owned = await db.query.crm_customers.findFirst({
    columns: { id: true },
    where: and(eq(crm_customers.id, customerId), eq(crm_customers.user_id, userId)),
  });
  return owned ? customerId : null;
}

/** Uses an existing owned company or creates one from `new_customer_name`. */
export async function resolveOrCreateCustomerId(
  formData: FormData,
  userId: string,
): Promise<string | null> {
  const newName = (formData.get("new_customer_name") as string)?.trim();
  if (newName) {
    const existing = await db.query.crm_customers.findFirst({
      columns: { id: true },
      where: and(eq(crm_customers.user_id, userId), eq(crm_customers.name, newName)),
    });
    if (existing) return existing.id;

    const [created] = await db
      .insert(crm_customers)
      .values({
        user_id: userId,
        name: newName,
        status: "prospect",
      })
      .returning({ id: crm_customers.id });
    return created?.id ?? null;
  }

  return resolveOwnedCustomerId(formData, userId);
}
