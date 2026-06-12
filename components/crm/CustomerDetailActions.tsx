"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import type { CrmCustomer } from "@/lib/types";
import type { CustomFieldDef } from "@/lib/customFields";
import SlideOver from "./SlideOver";
import CustomerEditForm from "./CustomerEditForm";

export default function CustomerDetailActions({
  customer,
  customerTypes = [],
  customFields = [],
  labelSingular = "Company",
}: {
  customer: CrmCustomer;
  customerTypes?: string[];
  customFields?: CustomFieldDef[];
  labelSingular?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Pencil size={13} />
        Edit
      </button>
      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title={customer.name}
        subtitle={`Edit ${labelSingular.toLowerCase()}`}
      >
        <CustomerEditForm
          customer={customer}
          customerTypes={customerTypes}
          customFields={customFields}
          labelSingular={labelSingular}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
          onDeleted={() => {
            setOpen(false);
            router.push("/customers");
          }}
        />
      </SlideOver>
    </>
  );
}
