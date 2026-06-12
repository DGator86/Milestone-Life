"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  X,
  Target,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Pencil,
} from "lucide-react";
import type { CrmCustomer, CustomerStatus } from "@/lib/types";
import type { CustomFieldDef } from "@/lib/customFields";
import { createCustomer } from "@/app/customers/actions";
import SlideOver from "./SlideOver";
import CustomerEditForm from "./CustomerEditForm";
import CustomFieldInput from "./CustomFieldInput";

const STATUS_STYLES: Record<CustomerStatus, string> = {
  prospect: "bg-milestone-amber-dim text-milestone-amber",
  active: "bg-milestone-green-dim text-milestone-green",
  inactive: "bg-gray-100 text-gray-400",
};

const INPUT = "ms-input";
const LABEL = "ms-label";

type PortalContact = { id: string; first_name: string; last_name: string; title: string | null };
type PortalOpp = { id: string; title: string; stage: string; value: number | null };

type SortKey = "name" | "customer_type" | "status" | "created";

export default function CustomersView({
  customers,
  goalCounts = {},
  contactsByCustomer = {},
  oppsByCustomer = {},
  customerTypes = [],
  customFields = [],
  labelPlural = "Companies",
  labelSingular = "Company",
  contactLabelPlural = "Contacts",
  oppLabelPlural = "Opportunities",
}: {
  customers: CrmCustomer[];
  goalCounts?: Record<string, number>;
  contactsByCustomer?: Record<string, PortalContact[]>;
  oppsByCustomer?: Record<string, PortalOpp[]>;
  customerTypes?: string[];
  customFields?: CustomFieldDef[];
  labelPlural?: string;
  labelSingular?: string;
  contactLabelPlural?: string;
  oppLabelPlural?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isPending, startTransition] = useTransition();

  const editing = customers.find((c) => c.id === editId) ?? null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.customer_type ?? "").toLowerCase().includes(q) ||
        (c.industry ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    );
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "name") {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      } else if (sortKey === "customer_type") {
        av = (a.customer_type ?? "").toLowerCase();
        bv = (b.customer_type ?? "").toLowerCase();
      } else if (sortKey === "status") {
        av = a.status;
        bv = b.status;
      } else {
        av = a.created_at ?? "";
        bv = b.created_at ?? "";
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [customers, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "created" ? "desc" : "asc");
    }
  }

  function openDetail(id: string) {
    router.push(`/customers/${id}`);
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createCustomer(formData);
      setShowForm(false);
    });
  }

  function SortHeader({ label, k, className = "" }: { label: string; k: SortKey; className?: string }) {
    const active = sortKey === k;
    return (
      <th className={`ms-table-head ${className}`}>
        <button
          onClick={() => toggleSort(k)}
          className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
            active ? "text-milestone-blue" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {label}
          {active &&
            (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
        </button>
      </th>
    );
  }

  return (
    <div className="ms-page" style={{ opacity: isPending ? 0.7 : 1 }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="ms-page-title">
            <Building2 size={18} className="text-milestone-blue" />
            {labelPlural}
          </h1>
          <p className="ms-page-subtitle">
            {customers.length} total · {customers.filter((c) => c.status === "active").length} active
          </p>
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
          <p className="text-sm font-semibold text-gray-900 mb-3">New {labelSingular.toLowerCase()}</p>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>{labelSingular} Name *</label>
                <input name="name" required placeholder="Acme Corp" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Type</label>
                <select name="customer_type" className={INPUT} defaultValue="">
                  <option value="">—</option>
                  {customerTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Industry</label>
                <input name="industry" placeholder="SaaS, Retail…" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Status</label>
                <select name="status" className={INPUT} defaultValue="prospect">
                  <option value="prospect">Prospect</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input name="email" type="email" placeholder="hello@acme.com" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Phone</label>
                <input name="phone" placeholder="+1 555 000 0000" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Website</label>
                <input name="website" placeholder="https://acme.com" className={INPUT} />
              </div>
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
                Save {labelSingular}
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
          placeholder={`Search ${labelPlural.toLowerCase()}…`}
          className="ms-input pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="ms-empty">
          <Building2 size={28} className="mx-auto mb-2 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">
            {search ? `No ${labelPlural.toLowerCase()} match your search.` : `No ${labelPlural.toLowerCase()} yet.`}
          </p>
          {!search && (
            <p className="text-xs text-gray-300 mt-1">Click &quot;Add {labelSingular}&quot; to get started.</p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((customer) => (
              <div
                key={customer.id}
                onClick={() => openDetail(customer.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDetail(customer.id);
                  }
                }}
                tabIndex={0}
                role="button"
                className="ms-surface p-3.5 hover:border-milestone-blue/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-milestone-blue-dim flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-milestone-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 leading-tight">{customer.name}</p>
                          {goalCounts[customer.id] > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-milestone-blue-dim text-milestone-blue">
                              <Target size={10} />
                              {goalCounts[customer.id]}
                            </span>
                          )}
                        </div>
                        {customer.industry && (
                          <p className="text-xs text-gray-500 mt-0.5">{customer.industry}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditId(customer.id);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-milestone-blue hover:bg-milestone-blue-dim transition-colors"
                          aria-label={`Edit ${labelSingular.toLowerCase()}`}
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[customer.status]}`}
                      >
                        {customer.status[0].toUpperCase() + customer.status.slice(1)}
                      </span>
                      {customer.customer_type && (
                        <span className="text-[10px] font-medium text-milestone-blue bg-milestone-blue-dim px-2 py-0.5 rounded-full">
                          {customer.customer_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0 mt-3" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block ms-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-milestone-line bg-gray-50/50 dark:bg-white/[0.02]">
                  <SortHeader label={labelSingular} k="name" className="pl-4" />
                  <SortHeader label="Type" k="customer_type" className="hidden sm:table-cell" />
                  <th className="ms-table-head hidden lg:table-cell">
                    Email
                  </th>
                  <SortHeader label="Status" k="status" />
                  <th className="px-4 py-2 w-20" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => openDetail(customer.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openDetail(customer.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className="border-b border-milestone-line last:border-0 hover:bg-milestone-blue-dim/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-milestone-blue-dim flex items-center justify-center shrink-0">
                          <Building2 size={14} className="text-milestone-blue" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 group-hover:text-milestone-blue transition-colors">
                              {customer.name}
                            </p>
                            {goalCounts[customer.id] > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-milestone-blue-dim text-milestone-blue">
                                <Target size={10} />
                                {goalCounts[customer.id]}
                              </span>
                            )}
                          </div>
                          {customer.website && (
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">
                              {customer.website.replace(/^https?:\/\//, "")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      {customer.customer_type ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-milestone-blue-dim text-milestone-blue">
                          {customer.customer_type}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell">
                      {customer.email
                        ? (
                          <a
                            href={`mailto:${customer.email}`}
                            className="hover:text-milestone-blue transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {customer.email}
                          </a>
                        )
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[customer.status]}`}
                      >
                        {customer.status[0].toUpperCase() + customer.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditId(customer.id);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-milestone-blue hover:bg-milestone-blue-dim transition-colors"
                        aria-label={`Edit ${labelSingular.toLowerCase()}`}
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <SlideOver
        open={!!editing}
        onClose={() => setEditId(null)}
        title={editing?.name ?? ""}
        subtitle={`Edit ${labelSingular.toLowerCase()}`}
      >
        {editing && (
          <div className="space-y-6">
            <CustomerEditForm
              customer={editing}
              customerTypes={customerTypes}
              customFields={customFields}
              labelSingular={labelSingular}
              onSaved={() => setEditId(null)}
              onDeleted={() => setEditId(null)}
            />

            <div className="border-t border-milestone-line pt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {contactLabelPlural} ({(contactsByCustomer[editing.id] ?? []).length})
                </p>
                {(contactsByCustomer[editing.id] ?? []).length === 0 ? (
                  <p className="text-xs text-gray-300">No related {contactLabelPlural.toLowerCase()}.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(contactsByCustomer[editing.id] ?? []).map((ct) => (
                      <Link
                        key={ct.id}
                        href={`/contacts/${ct.id}`}
                        className="flex items-center justify-between rounded-lg border border-milestone-line px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-800">
                          {ct.first_name} {ct.last_name}
                        </span>
                        {ct.title && <span className="text-xs text-gray-400">{ct.title}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {oppLabelPlural} ({(oppsByCustomer[editing.id] ?? []).length})
                </p>
                {(oppsByCustomer[editing.id] ?? []).length === 0 ? (
                  <p className="text-xs text-gray-300">No related {oppLabelPlural.toLowerCase()}.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(oppsByCustomer[editing.id] ?? []).map((op) => (
                      <Link
                        key={op.id}
                        href={`/opportunities?highlight=${op.id}`}
                        className="flex items-center justify-between rounded-lg border border-milestone-line px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-800 truncate">{op.title}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {op.stage}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href={`/customers/${editing.id}`}
                className="block text-center text-xs font-semibold text-milestone-blue hover:underline pt-2"
              >
                View full profile →
              </Link>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
