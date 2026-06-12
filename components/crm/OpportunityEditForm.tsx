"use client";

import { useMemo, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { CrmOpportunity, CrmCustomer, CrmContact, CrmFlow } from "@/lib/types";
import type { CustomFieldDef } from "@/lib/customFields";
import { updateOpportunity, deleteOpportunity } from "@/app/opportunities/actions";
import CustomFieldInput from "./CustomFieldInput";
import CompanySelect from "./CompanySelect";

const DEFAULT_STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

const INPUT = "ms-input";
const LABEL = "ms-label";

export default function OpportunityEditForm({
  opportunity,
  customers,
  contacts,
  flows,
  customFields = [],
  labelSingular = "Opportunity",
  onSaved,
  onDeleted,
}: {
  opportunity: CrmOpportunity;
  customers: Pick<CrmCustomer, "id" | "name">[];
  contacts: Pick<CrmContact, "id" | "first_name" | "last_name" | "customer_id">[];
  flows: Pick<CrmFlow, "id" | "name" | "stages">[];
  customFields?: CustomFieldDef[];
  labelSingular?: string;
  onSaved?: () => void;
  onDeleted?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [customerId, setCustomerId] = useState(opportunity.customer_id ?? "");

  const formContacts = useMemo(
    () => (customerId ? contacts.filter((c) => c.customer_id === customerId) : contacts),
    [customerId, contacts]
  );

  const stages = useMemo(() => {
    const flowId = opportunity.flow_id;
    const flow = flowId ? flows.find((f) => f.id === flowId) : null;
    if (flow?.stages?.length) return flow.stages;
    return DEFAULT_STAGES;
  }, [opportunity.flow_id, flows]);

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateOpportunity(opportunity.id, formData);
      onSaved?.();
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete this ${labelSingular.toLowerCase()}? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteOpportunity(opportunity.id);
      onDeleted?.();
    });
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-4" style={{ opacity: isPending ? 0.7 : 1 }}>
      <div>
        <label className={LABEL}>Title *</label>
        <input name="title" required defaultValue={opportunity.title} className={INPUT} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Value ($)</label>
          <input
            name="value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={opportunity.value ?? ""}
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>Stage</label>
          <select name="stage" className={INPUT} defaultValue={opportunity.stage}>
            {stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            {!stages.includes(opportunity.stage) && (
              <option value={opportunity.stage}>{opportunity.stage}</option>
            )}
          </select>
        </div>
      </div>
      <CompanySelect
        customers={customers}
        defaultValue={opportunity.customer_id ?? ""}
        onValueChange={setCustomerId}
        label="Customer"
        noCompanyLabel="No customer"
      />
      <div>
        <label className={LABEL}>Contact</label>
        <select
          name="contact_id"
          className={INPUT}
          defaultValue={opportunity.contact_id ?? ""}
          key={customerId}
        >
          <option value="">No contact</option>
          {formContacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={LABEL}>Flow (pipeline)</label>
        <select name="flow_id" className={INPUT} defaultValue={opportunity.flow_id ?? ""}>
          <option value="">Default</option>
          {flows.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={LABEL}>Close Date</label>
        <input name="close_date" type="date" defaultValue={opportunity.close_date ?? ""} className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Notes</label>
        <textarea name="notes" rows={4} defaultValue={opportunity.notes ?? ""} className={INPUT} />
      </div>
      {customFields.length > 0 && (
        <div className="grid grid-cols-2 gap-3 border-t border-milestone-line dark:border-white/[0.08] pt-4">
          {customFields.map((f) => (
            <CustomFieldInput key={f.id} field={f} value={opportunity.custom?.[f.id]} />
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
