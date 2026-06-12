import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import CustomerDetailActions from "@/components/crm/CustomerDetailActions";
import {
  DetailSection,
  CrmRelatedSections,
  ContactListItems,
} from "@/components/crm/CrmDetailSections";
import { getSettings } from "@/lib/settings";
import {
  getRelatedGoalsForCustomer,
  getOpenOpportunitiesForCustomer,
  getOpenTasksForCustomer,
} from "@/lib/crm/related";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  UserRound,
  StickyNote,
} from "lucide-react";
import type { CrmCustomer, CustomerStatus, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<CustomerStatus, string> = {
  prospect: "bg-milestone-amber-dim text-milestone-amber",
  active: "bg-milestone-green-dim text-milestone-green",
  inactive: "bg-gray-100 text-gray-400",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const [customer, { terms, customerTypes, customFields }] = await Promise.all([
    db.query.crm_customers.findFirst({
      where: and(eq(crm_customers.id, id), eq(crm_customers.user_id, userId)),
      with: {
        crm_contacts: {
          columns: { id: true, first_name: true, last_name: true, title: true },
        },
      },
    }),
    getSettings(userId),
  ]);

  if (!customer) notFound();

  const [opportunities, tasks, { goals, killList }] = await Promise.all([
    getOpenOpportunitiesForCustomer(userId, id),
    getOpenTasksForCustomer(userId, id),
    getRelatedGoalsForCustomer(userId, id),
  ]);

  const customerTyped = customer as CrmCustomer;
  const contacts = customer.crm_contacts ?? [];

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={14} />
          All {terms.customers}
        </Link>

        <div className="ms-card p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-milestone-blue-dim flex items-center justify-center shrink-0">
                <Building2 size={24} className="text-milestone-blue" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {customer.customer_type && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-milestone-blue-dim text-milestone-blue">
                      {customer.customer_type}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[customer.status as CustomerStatus]}`}
                  >
                    {customer.status[0].toUpperCase() + customer.status.slice(1)}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{customer.name}</h1>
                {customer.industry && (
                  <p className="text-sm text-gray-500 mt-0.5">{customer.industry}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-3">
                  {customer.email && (
                    <a
                      href={`mailto:${customer.email}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-milestone-blue transition-colors"
                    >
                      <Mail size={12} />
                      {customer.email}
                    </a>
                  )}
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-milestone-blue transition-colors"
                    >
                      <Phone size={12} />
                      {customer.phone}
                    </a>
                  )}
                  {customer.website && (
                    <a
                      href={customer.website.startsWith("http") ? customer.website : `https://${customer.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-milestone-blue transition-colors"
                    >
                      <Globe size={12} />
                      {customer.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>
            </div>
            <CustomerDetailActions
              customer={customerTyped}
              customerTypes={customerTypes}
              customFields={customFields.customer}
              labelSingular={terms.customer}
            />
          </div>

          {customer.notes && (
            <div className="mt-5 pt-5 border-t border-milestone-line">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                <StickyNote size={12} /> Notes
              </p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>

        <DetailSection title={terms.contacts} count={contacts.length} icon={UserRound}>
          <ContactListItems contacts={contacts} />
        </DetailSection>

        <CrmRelatedSections
          killList={killList}
          goals={goals}
          opportunities={opportunities}
          tasks={tasks}
          context={{ customerId: id }}
          showContact
        />
      </div>
    </AppShell>
  );
}
