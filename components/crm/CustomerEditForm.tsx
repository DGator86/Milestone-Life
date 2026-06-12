"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { CrmCustomer } from "@/lib/types";
import type { CustomFieldDef } from "@/lib/customFields";
import { updateCustomer, deleteCustomer } from "@/app/customers/actions";
import CustomFieldInput from "./CustomFieldInput";

const INPUT = "ms-input";
const LABEL = "ms-label";

export default function CustomerEditForm({
  customer,
  customerTypes = [],
  customFields = [],
  labelSingular = "Company",
  onSaved,
  onDeleted,
}: {
  customer: CrmCustomer;
  customerTypes?: string[];
  customFields?: CustomFieldDef[];
  labelSingular?: string;
  onSaved?: () => void;
  onDeleted?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateCustomer(customer.id, formData);
      onSaved?.();
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete this ${labelSingular.toLowerCase()}? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteCustomer(customer.id);
      onDeleted?.();
    });
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-4" style={{ opacity: isPending ? 0.7 : 1 }}>
      <div>
        <label className={LABEL}>{labelSingular} Name *</label>
        <input name="name" required defaultValue={customer.name} className={INPUT} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Type</label>
          <select name="customer_type" className={INPUT} defaultValue={customer.customer_type ?? ""}>
            <option value="">—</option>
            {customerTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
            {customer.customer_type && !customerTypes.includes(customer.customer_type) && (
              <option value={customer.customer_type}>{customer.customer_type}</option>
            )}
          </select>
        </div>
        <div>
          <label className={LABEL}>Status</label>
          <select name="status" className={INPUT} defaultValue={customer.status}>
            <option value="prospect">Prospect</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div>
        <label className={LABEL}>Industry</label>
        <input name="industry" defaultValue={customer.industry ?? ""} className={INPUT} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Email</label>
          <input name="email" type="email" defaultValue={customer.email ?? ""} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Phone</label>
          <input name="phone" defaultValue={customer.phone ?? ""} className={INPUT} />
        </div>
      </div>
      <div>
        <label className={LABEL}>Website</label>
        <input name="website" defaultValue={customer.website ?? ""} className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Notes</label>
        <textarea name="notes" rows={3} defaultValue={customer.notes ?? ""} className={INPUT} />
      </div>
      {customFields.length > 0 && (
        <div className="grid grid-cols-2 gap-3 border-t border-milestone-line pt-4">
          {customFields.map((f) => (
            <CustomFieldInput key={f.id} field={f} value={customer.custom?.[f.id]} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-milestone-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Save changes
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="text-sm text-gray-400 hover:text-milestone-red transition-colors flex items-center gap-1"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </form>
  );
}
