"use client";

import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import {
  CUSTOM_FIELD_TYPES,
  type CustomFieldDef,
  type CustomFieldDefs,
  type CustomFieldObject,
  type CustomFieldType,
} from "@/lib/customFields";

const INPUT = "ms-input";

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `f_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export default function CustomFieldsEditor({
  initial,
  objects,
}: {
  initial: CustomFieldDefs;
  objects: { key: CustomFieldObject; label: string }[];
}) {
  const [defs, setDefs] = useState<CustomFieldDefs>(initial);

  function update(objKey: CustomFieldObject, list: CustomFieldDef[]) {
    setDefs((d) => ({ ...d, [objKey]: list }));
  }

  function addField(objKey: CustomFieldObject) {
    update(objKey, [...defs[objKey], { id: newId(), label: "", type: "text" }]);
  }

  function removeField(objKey: CustomFieldObject, id: string) {
    update(objKey, defs[objKey].filter((f) => f.id !== id));
  }

  function patchField(objKey: CustomFieldObject, id: string, patch: Partial<CustomFieldDef>) {
    update(
      objKey,
      defs[objKey].map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  }

  return (
    <div className="ms-card">
      <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
          <Plus size={12} />
          Custom fields
        </p>
      </div>

      {/* Serialized full defs map (preserves objects not shown here) */}
      <input type="hidden" name="custom_fields" value={JSON.stringify(defs)} />

      <div className="divide-y divide-milestone-line">
        {objects.map(({ key, label }) => (
          <div key={key} className="p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">{label}</p>

            {defs[key].length === 0 ? (
              <p className="text-xs text-gray-400">No custom fields yet.</p>
            ) : (
              <div className="space-y-2">
                {defs[key].map((field) => (
                  <div key={field.id} className="space-y-2 rounded-lg border border-milestone-line p-3">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-gray-300 shrink-0" />
                      <input
                        value={field.label}
                        onChange={(e) => patchField(key, field.id, { label: e.target.value })}
                        placeholder="Field name"
                        maxLength={40}
                        className={INPUT}
                      />
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const type = e.target.value as CustomFieldType;
                          patchField(key, field.id, {
                            type,
                            options: type === "select" ? field.options ?? [] : undefined,
                          });
                        }}
                        className="shrink-0 px-2.5 py-2 text-sm border border-milestone-line rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-milestone-blue/20"
                      >
                        {CUSTOM_FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeField(key, field.id)}
                        aria-label="Remove field"
                        className="shrink-0 rounded-lg p-2 text-gray-400 hover:text-milestone-red hover:bg-red-50 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {field.type === "select" && (
                      <input
                        value={(field.options ?? []).join(", ")}
                        onChange={(e) =>
                          patchField(key, field.id, {
                            options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean),
                          })
                        }
                        placeholder="Options, comma separated (e.g. Low, Medium, High)"
                        className={`${INPUT} ml-6 w-[calc(100%-1.5rem)]`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => addField(key)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg border border-milestone-line text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Plus size={14} /> Add field
            </button>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-400 px-5 pb-4">
        Custom fields appear on the create and edit forms for each record. Removing a field hides it but keeps any
        previously saved values.
      </p>
    </div>
  );
}
