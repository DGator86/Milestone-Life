"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { contacts, touches } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { LogTouchSchema, CreateContactSchema } from "@/lib/schemas";

export async function logTouch(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();

  const raw = {
    contact_id: formData.get("contact_id") as string,
    type: formData.get("type") as string,
    notes: (formData.get("notes") as string)?.trim() || null,
    touched_at: (formData.get("touched_at") as string) || null,
  };

  const parsed = LogTouchSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid input" };

  const contactOwner = await db.query.contacts.findFirst({
    where: and(eq(contacts.id, parsed.data.contact_id), eq(contacts.user_id, userId)),
  });
  if (!contactOwner) return { error: "Contact not found" };

  await db.insert(touches).values({
    user_id: userId,
    contact_id: parsed.data.contact_id,
    type: parsed.data.type,
    notes: parsed.data.notes,
    touched_at: parsed.data.touched_at ?? new Date().toISOString(),
  });

  revalidatePath(`/follow-ups/${parsed.data.contact_id}`);
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
}

export async function createLegacyContact(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();

  const freqRaw = formData.get("touch_frequency_days");
  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    email: (formData.get("email") as string)?.trim() || null,
    phone: (formData.get("phone") as string)?.trim() || null,
    company: (formData.get("company") as string)?.trim() || null,
    role: (formData.get("role") as string)?.trim() || null,
    list_id: (formData.get("list_id") as string) || null,
    touch_frequency_days: freqRaw ? Number(freqRaw) : null,
    notes: (formData.get("notes") as string)?.trim() || null,
  };

  const parsed = CreateContactSchema.safeParse(raw);
  if (!parsed.success) return;

  const [contact] = await db.insert(contacts)
    .values({ user_id: userId, ...parsed.data })
    .returning();

  if (!contact) redirect("/follow-ups?error=Failed+to+create+contact");

  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
}
