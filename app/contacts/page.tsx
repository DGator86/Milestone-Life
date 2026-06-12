import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_contacts, crm_customers } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import ContactsView from "@/components/crm/ContactsView";
import { getSettings } from "@/lib/settings";
import type { CrmContact, CrmCustomer, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const [contactsRaw, customersRaw] = await Promise.all([
    db.query.crm_contacts.findMany({
      where: eq(crm_contacts.user_id, userId),
      with: { crm_customers: true },
      orderBy: [desc(crm_contacts.created_at)],
    }),
    db.select({ id: crm_customers.id, name: crm_customers.name })
      .from(crm_customers)
      .where(eq(crm_customers.user_id, userId))
      .orderBy(asc(crm_customers.name)),
  ]);

  const contacts: CrmContact[] = contactsRaw as unknown as CrmContact[];
  const customers: Pick<CrmCustomer, "id" | "name">[] = customersRaw;
  const { terms, customFields } = await getSettings(userId);

  return (
    <AppShell user={user}>
      <ContactsView
        contacts={contacts}
        customers={customers}
        customFields={customFields.contact}
        labelPlural={terms.contacts}
        labelSingular={terms.contact}
      />
    </AppShell>
  );
}
