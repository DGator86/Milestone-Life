"use client";

import { useState } from "react";
import type { CrmCustomer } from "@/lib/types";

const INPUT = "ms-input";
const LABEL = "ms-label";

export const NEW_CUSTOMER_VALUE = "__new__";

export default function CompanySelect({
  customers,
  defaultValue = "",
  value,
  onValueChange,
  onNewModeChange,
  label = "Company",
  noCompanyLabel = "No company",
  addNewLabel = "+ Add new company…",
}: {
  customers: Pick<CrmCustomer, "id" | "name">[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (customerId: string) => void;
  onNewModeChange?: (isNew: boolean) => void;
  label?: string;
  noCompanyLabel?: string;
  addNewLabel?: string;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const isControlled = value !== undefined;

  function enterNewMode() {
    setMode("new");
    onNewModeChange?.(true);
    onValueChange?.("");
  }

  function exitNewMode() {
    setMode("existing");
    onNewModeChange?.(false);
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (next === NEW_CUSTOMER_VALUE) {
      enterNewMode();
      return;
    }
    onValueChange?.(next);
  }

  if (mode === "new") {
    return (
      <div>
        <label className={LABEL}>{label}</label>
        <input
          name="new_customer_name"
          required
          placeholder="Company name"
          className={INPUT}
          autoFocus
        />
        <button
          type="button"
          onClick={exitNewMode}
          className="mt-1 text-xs text-milestone-blue hover:underline"
        >
          Choose existing company
        </button>
      </div>
    );
  }

  return (
    <div>
      <label className={LABEL}>{label}</label>
      <select
        name="customer_id"
        className={INPUT}
        {...(isControlled ? { value } : { defaultValue })}
        onChange={handleSelectChange}
      >
        <option value="">{noCompanyLabel}</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={enterNewMode}
        className="mt-1.5 block text-xs font-medium text-milestone-blue hover:underline text-left"
      >
        {addNewLabel}
      </button>
    </div>
  );
}
