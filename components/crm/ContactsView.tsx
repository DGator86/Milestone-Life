"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserRound, Plus, Search, Trash2, X, Pencil, ChevronRight } from "lucide-react";
import type { CrmContact, CrmCustomer } from "@/lib/types";
import type { CustomFieldDef } from "@/lib/customFields";
import { createContact, deleteContact } from "@/app/contacts/actions";
import SlideOver from "./SlideOver";
import ContactEditForm from "./ContactEditForm";
import CustomFieldInput from "./CustomFieldInput";
import CompanySelect from "./CompanySelect";

const INPUT = "ms-input";
const LABEL = "ms-label";

interface Props {
  contacts: CrmContact[];
  customers: Pick<CrmCustomer, "id" | "name">[];
}

function ContactRowActions({
  contactId,
  onEdit,
  onDelete,
  labelSingular,
}: {
  contactId: string;
  onEdit: () => void;
  onDelete: (id: string) => void;
  labelSingular: string;
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-milestone-blue hover:bg-milestone-blue-dim transition-colors"
        title={`Edit ${labelSingular.toLowerCase()}`}
        aria-label={`Edit ${labelSingular.toLowerCase()}`}
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(contactId);
        }}
        className="p-1.5 rounded-lg text-gray-300 hover:text-milestone-red hover:bg-red-50 transition-colors"
        title={`Delete ${labelSingular.toLowerCase()}`}
        aria-label={`Delete ${labelSingular.toLowerCase()}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function ContactsView({
  contacts,
  customers,
  customFields = [],
  labelPlural = "Contacts",
  labelSingular = "Contact",
}: Props & { customFields?: CustomFieldDef[]; labelPlural?: string; labelSingular?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editing = contacts.find((c) => c.id === editId) ?? null;

  const filtered = useMemo(
    () =>
      contacts.filter((c) => {
        const full = `${c.first_name} ${c.last_name}`.toLowerCase();
        const q = search.toLowerCase();
        return (
          full.includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.title ?? "").toLowerCase().includes(q) ||
          (c.crm_customers?.name ?? "").toLowerCase().includes(q)
        );
      }),
    [contacts, search]
  );

  function openDetail(id: string) {
    router.push(`/contacts/${id}`);
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createContact(formData);
      setShowForm(false);
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm(`Delete this ${labelSingular.toLowerCase()}? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteContact(id);
      setEditId(null);
    });
  }

  return (
    <div className="ms-page" style={{ opacity: isPending ? 0.7 : 1 }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="ms-page-title">
            <UserRound size={18} className="text-milestone-blue" />
            {labelPlural}
          </h1>
          <p className="ms-page-subtitle">{contacts.length} total</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="ms-btn-primary"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : `Add ${labelSingular}`}
        </button>
      </div>

      {showForm && (
        <div className="ms-surface p-4 mb-4 animate-fade-up">
          <p className="text-sm font-semibold text-gray-900 mb-3">New contact</p>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>First Name *</label>
                <input name="first_name" required placeholder="Jane" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Last Name *</label>
                <input name="last_name" required placeholder="Smith" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Job Title</label>
                <input name="title" placeholder="VP of Sales" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input name="email" type="email" placeholder="jane@acme.com" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Phone</label>
                <input name="phone" placeholder="+1 555 000 0000" className={INPUT} />
              </div>
              <CompanySelect customers={customers} />
            </div>
            {customFields.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {customFields.map((f) => (
                  <CustomFieldInput key={f.id} field={f} />
                ))}
              </div>
            )}
            <div className="mt-4">
              <label className={LABEL}>Notes</label>
              <textarea name="notes" rows={2} placeholder="Any context…" className={INPUT} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="ms-btn-primary disabled:opacity-50"
              >
                Save Contact
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts…"
          className="ms-input pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="ms-empty">
          <UserRound size={28} className="mx-auto mb-2 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">
            {search ? "No contacts match your search." : "No contacts yet."}
          </p>
          {!search && (
            <p className="text-xs text-gray-300 mt-1">Click &quot;Add Contact&quot; to get started.</p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((contact) => {
              const initials = `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();
              return (
                <div
                  key={contact.id}
                  onClick={() => openDetail(contact.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDetail(contact.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  className="ms-surface p-3.5 hover:border-milestone-blue/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-milestone-blue flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 leading-tight">
                            {contact.first_name} {contact.last_name}
                          </p>
                          {contact.title && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{contact.title}</p>
                          )}
                        </div>
                        <ContactRowActions
                          contactId={contact.id}
                          onEdit={() => setEditId(contact.id)}
                          onDelete={handleDelete}
                          labelSingular={labelSingular}
                        />
                      </div>
                      {contact.crm_customers && (
                        <Link
                          href={`/customers/${contact.crm_customers.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex mt-2 text-xs font-medium text-milestone-blue bg-milestone-blue-dim px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
                        >
                          {contact.crm_customers.name}
                        </Link>
                      )}
                      {(contact.email || contact.phone) && (
                        <p className="text-xs text-gray-400 mt-2 truncate">
                          {contact.email ?? contact.phone}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0 mt-3" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block ms-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-milestone-line bg-gray-50/50 dark:bg-white/[0.02]">
                  <th className="ms-table-head">
                    Name
                  </th>
                  <th className="ms-table-head hidden lg:table-cell">
                    Title
                  </th>
                  <th className="ms-table-head hidden xl:table-cell">
                    Email
                  </th>
                  <th className="ms-table-head">
                    Company
                  </th>
                  <th className="px-4 py-2 w-24" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact) => {
                  const initials = `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();
                  return (
                    <tr
                      key={contact.id}
                      onClick={() => openDetail(contact.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDetail(contact.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      className="border-b border-milestone-line last:border-0 hover:bg-milestone-blue-dim/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-milestone-blue flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">{initials}</span>
                          </div>
                          <p className="font-semibold text-gray-900 group-hover:text-milestone-blue transition-colors">
                            {contact.first_name} {contact.last_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 hidden lg:table-cell">
                        {contact.title ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 hidden xl:table-cell">
                        {contact.email
                          ? (
                            <a
                              href={`mailto:${contact.email}`}
                              className="hover:text-milestone-blue transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {contact.email}
                            </a>
                          )
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {contact.crm_customers ? (
                          <Link
                            href={`/customers/${contact.crm_customers.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-medium text-milestone-blue bg-milestone-blue-dim px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
                          >
                            {contact.crm_customers.name}
                          </Link>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <ContactRowActions
                          contactId={contact.id}
                          onEdit={() => setEditId(contact.id)}
                          onDelete={handleDelete}
                          labelSingular={labelSingular}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <SlideOver
        open={!!editing}
        onClose={() => setEditId(null)}
        title={editing ? `${editing.first_name} ${editing.last_name}` : ""}
        subtitle={`Edit ${labelSingular.toLowerCase()}`}
      >
        {editing && (
          <ContactEditForm
            contact={editing}
            customers={customers}
            customFields={customFields}
            labelSingular={labelSingular}
            onSaved={() => setEditId(null)}
            onDeleted={() => setEditId(null)}
          />
        )}
      </SlideOver>
    </div>
  );
}
