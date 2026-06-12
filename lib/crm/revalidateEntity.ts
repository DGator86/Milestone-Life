import { revalidatePath } from "next/cache";

/** Revalidate CRM contact/company detail pages after mutations. */
export function revalidateCrmEntityPaths(opts: {
  contactId?: string | null;
  customerId?: string | null;
}) {
  if (opts.contactId) {
    revalidatePath(`/contacts/${opts.contactId}`);
    revalidatePath(`/follow-ups/${opts.contactId}`);
  }
  if (opts.customerId) {
    revalidatePath(`/customers/${opts.customerId}`);
  }
}

export function revalidateCrmEntityPathsFromForm(formData: FormData) {
  revalidateCrmEntityPaths({
    contactId: (formData.get("contact_id") as string) || null,
    customerId: (formData.get("customer_id") as string) || null,
  });
}
