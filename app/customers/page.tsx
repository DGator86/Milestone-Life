import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_customers, crm_contacts, crm_opportunities, goals } from "@/db/schema";
import { eq, desc, and, isNotNull, sql, asc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import CustomersView from "@/components/crm/CustomersView";
import { getSettings } from "@/lib/settings";
import type { CrmCustomer, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const [data, goalCountRows, contactRows, oppRows] = await Promise.all([
    db.query.crm_customers.findMany({
      where: eq(crm_customers.user_id, userId),
      orderBy: [desc(crm_customers.created_at)],
    }),
    db
      .select({ customer_id: goals.customer_id, count: sql<number>`count(*)::int` })
      .from(goals)
      .where(and(eq(goals.user_id, userId), isNotNull(goals.customer_id)))
      .groupBy(goals.customer_id),
    db
      .select({
        id: crm_contacts.id,
        first_name: crm_contacts.first_name,
        last_name: crm_contacts.last_name,
        title: crm_contacts.title,
        customer_id: crm_contacts.customer_id,
      })
      .from(crm_contacts)
      .where(and(eq(crm_contacts.user_id, userId), isNotNull(crm_contacts.customer_id)))
      .orderBy(asc(crm_contacts.first_name)),
    db
      .select({
        id: crm_opportunities.id,
        title: crm_opportunities.title,
        stage: crm_opportunities.stage,
        value: crm_opportunities.value,
        customer_id: crm_opportunities.customer_id,
      })
      .from(crm_opportunities)
      .where(and(eq(crm_opportunities.user_id, userId), isNotNull(crm_opportunities.customer_id)))
      .orderBy(desc(crm_opportunities.created_at)),
  ]);

  const customers: CrmCustomer[] = data as CrmCustomer[];

  const goalCounts: Record<string, number> = {};
  for (const row of goalCountRows) {
    if (row.customer_id) goalCounts[row.customer_id] = row.count;
  }

  const contactsByCustomer: Record<string, { id: string; first_name: string; last_name: string; title: string | null }[]> = {};
  for (const c of contactRows) {
    if (!c.customer_id) continue;
    (contactsByCustomer[c.customer_id] ??= []).push({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      title: c.title,
    });
  }

  const oppsByCustomer: Record<string, { id: string; title: string; stage: string; value: number | null }[]> = {};
  for (const o of oppRows) {
    if (!o.customer_id) continue;
    (oppsByCustomer[o.customer_id] ??= []).push({
      id: o.id,
      title: o.title,
      stage: o.stage,
      value: o.value != null ? parseFloat(o.value) : null,
    });
  }

  const { terms, customerTypes, customFields } = await getSettings(userId);

  return (
    <AppShell user={user}>
      <CustomersView
        customers={customers}
        goalCounts={goalCounts}
        contactsByCustomer={contactsByCustomer}
        oppsByCustomer={oppsByCustomer}
        customerTypes={customerTypes}
        customFields={customFields.customer}
        labelPlural={terms.customers}
        labelSingular={terms.customer}
        contactLabelPlural={terms.contacts}
        oppLabelPlural={terms.opportunities}
      />
    </AppShell>
  );
}
