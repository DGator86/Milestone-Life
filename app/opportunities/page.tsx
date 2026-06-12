import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_opportunities, crm_customers, crm_contacts, crm_flows } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import OpportunitiesView from "@/components/crm/OpportunitiesView";
import { getSettings } from "@/lib/settings";
import type { CrmOpportunity, CrmCustomer, CrmContact, CrmFlow, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const { highlight } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const [oppsRaw, customersRaw, contactsRaw, flowsRaw] = await Promise.all([
    db.query.crm_opportunities.findMany({
      where: eq(crm_opportunities.user_id, userId),
      with: { crm_customers: true, crm_contacts: true, crm_flows: true },
      orderBy: [desc(crm_opportunities.created_at)],
    }),
    db.select({ id: crm_customers.id, name: crm_customers.name })
      .from(crm_customers)
      .where(eq(crm_customers.user_id, userId))
      .orderBy(asc(crm_customers.name)),
    db.select({ id: crm_contacts.id, first_name: crm_contacts.first_name, last_name: crm_contacts.last_name, customer_id: crm_contacts.customer_id })
      .from(crm_contacts)
      .where(eq(crm_contacts.user_id, userId))
      .orderBy(asc(crm_contacts.first_name)),
    db.select({ id: crm_flows.id, name: crm_flows.name, stages: crm_flows.stages })
      .from(crm_flows)
      .where(eq(crm_flows.user_id, userId))
      .orderBy(asc(crm_flows.name)),
  ]);

  const opportunities: CrmOpportunity[] = oppsRaw.map((o) => ({
    ...o,
    value: o.value != null ? parseFloat(o.value) : null,
  })) as unknown as CrmOpportunity[];

  const customers: Pick<CrmCustomer, "id" | "name">[] = customersRaw;
  const contacts: Pick<CrmContact, "id" | "first_name" | "last_name" | "customer_id">[] = contactsRaw;
  const flows: Pick<CrmFlow, "id" | "name" | "stages">[] = flowsRaw as unknown as Pick<CrmFlow, "id" | "name" | "stages">[];
  const { terms, customFields } = await getSettings(userId);

  return (
    <AppShell user={user}>
      <OpportunitiesView
        opportunities={opportunities}
        customers={customers}
        contacts={contacts}
        flows={flows}
        customFields={customFields.opportunity}
        labelPlural={terms.opportunities}
        labelSingular={terms.opportunity}
        highlightId={highlight}
      />
    </AppShell>
  );
}
