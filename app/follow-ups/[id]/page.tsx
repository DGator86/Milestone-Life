import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_contacts, crm_customers } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import ContactDetailActions from "@/components/crm/ContactDetailActions";
import { EntityChip, CrmRelatedSections } from "@/components/crm/CrmDetailSections";
import { getSettings } from "@/lib/settings";
import {
  getRelatedGoalsForContact,
  getOpenOpportunitiesForContact,
  getOpenTasksForContact,
} from "@/lib/crm/related";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  UserRound,
  StickyNote,
} from "lucide-react";
import type { CrmContact, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CrmContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const [contact, customersRaw, { terms, customFields }] = await Promise.all([
    db.query.crm_contacts.findFirst({
      where: and(eq(crm_contacts.id, id), eq(crm_contacts.user_id, userId)),
      with: { crm_customers: true },
    }),
    db
      .select({ id: crm_customers.id, name: crm_customers.name })
      .from(crm_customers)
      .where(eq(crm_customers.user_id, userId))
      .orderBy(asc(crm_customers.name)),
    getSettings(userId),
  ]);

  if (!contact) notFound();

  const [opportunities, tasks, { goals, killList }] = await Promise.all([
    getOpenOpportunitiesForContact(userId, id),
    getOpenTasksForContact(userId, id),
    getRelatedGoalsForContact(userId, id, contact.customer_id),
  ]);

  const fullName = `${contact.first_name} ${contact.last_name}`;
  const initials = `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();
  const contactTyped = contact as CrmContact;

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={14} />
          All {terms.contacts}
        </Link>

        <div className="ms-card p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-milestone-blue flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
                <span className="text-white text-lg font-bold">{initials}</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{fullName}</h1>
                {contact.title && (
                  <p className="text-sm text-gray-500 mt-0.5">{contact.title}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {contact.crm_customers && (
                    <EntityChip
                      href={`/customers/${contact.crm_customers.id}`}
                      label={contact.crm_customers.name}
                      icon={Building2}
                    />
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-milestone-blue transition-colors"
                    >
                      <Mail size={12} />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-milestone-blue transition-colors"
                    >
                      <Phone size={12} />
                      {contact.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
            <ContactDetailActions
              contact={contactTyped}
              customers={customersRaw}
              customFields={customFields.contact}
              labelSingular={terms.contact}
            />
          </div>

          {contact.notes && (
            <div className="mt-5 pt-5 border-t border-milestone-line">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                <StickyNote size={12} /> Notes
              </p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>

        <CrmRelatedSections
          killList={killList}
          goals={goals}
          opportunities={opportunities}
          tasks={tasks}
          context={{ contactId: id, customerId: contact.customer_id }}
          showCompany
        />

        {!contact.crm_customers && !goals.length && !opportunities.length && (
          <div className="text-center py-6">
            <UserRound size={28} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">
              Link this {terms.contact.toLowerCase()} to a {terms.customer.toLowerCase()} or opportunity to see connected goals.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
