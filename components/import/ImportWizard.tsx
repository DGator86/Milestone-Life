"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Building2,
  Users,
  Handshake,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileText,
  Layers,
} from "lucide-react";
import {
  importCompanies,
  importContacts,
  importOpportunities,
  type ImportRow,
} from "@/app/import/actions";
import {
  makeImportFieldId,
  type CustomFieldDef,
  type CustomFieldDefs,
  type CustomFieldObject,
} from "@/lib/customFields";

type EntityType = "companies" | "contacts" | "opportunities";
type Step = "upload" | "map" | "preview";

interface FieldDef {
  key: string;
  label: string;
  required: boolean;
  hint?: string;
}

const ENTITY_TO_OBJECT: Record<EntityType, CustomFieldObject> = {
  companies: "customer",
  contacts: "contact",
  opportunities: "opportunity",
};

const FIELDS: Record<EntityType, FieldDef[]> = {
  companies: [
    { key: "name", label: "Company Name", required: true },
    { key: "industry", label: "Industry", required: false },
    { key: "website", label: "Website", required: false },
    { key: "email", label: "Email", required: false },
    { key: "phone", label: "Phone", required: false },
    { key: "status", label: "Status", required: false, hint: "prospect / active / inactive" },
    { key: "notes", label: "Notes", required: false },
  ],
  contacts: [
    { key: "first_name", label: "First Name", required: true },
    { key: "last_name", label: "Last Name", required: true },
    { key: "company_name", label: "Company", required: false, hint: "Linked by name match" },
    { key: "email", label: "Email", required: false },
    { key: "phone", label: "Phone", required: false },
    { key: "title", label: "Job Title", required: false },
    { key: "notes", label: "Notes", required: false },
  ],
  opportunities: [
    { key: "title", label: "Deal Title", required: true },
    { key: "company_name", label: "Company", required: false, hint: "Linked by name match" },
    { key: "value", label: "Value ($)", required: false },
    { key: "stage", label: "Stage", required: false, hint: "e.g. Lead, Proposal, Closed" },
    { key: "status", label: "Status", required: false, hint: "open / won / lost" },
    { key: "close_date", label: "Close Date", required: false, hint: "YYYY-MM-DD" },
    { key: "notes", label: "Notes", required: false },
  ],
};

const SYNONYMS: Record<string, string[]> = {
  name: ["name", "company name", "account name", "account", "organization"],
  industry: ["industry", "sector", "vertical"],
  website: ["website", "url", "web", "domain", "site"],
  email: ["email", "e-mail", "email address"],
  phone: ["phone", "tel", "telephone", "mobile", "cell", "phone number"],
  status: ["status", "state"],
  notes: ["notes", "note", "description", "comments"],
  first_name: ["first name", "firstname", "first", "given name"],
  last_name: ["last name", "lastname", "last", "surname", "family name"],
  company_name: ["company", "company name", "account", "account name", "organization", "employer"],
  title: ["title", "job title", "position", "role"],
  value: ["value", "amount", "deal value", "arr", "mrr", "price", "deal size", "revenue"],
  stage: ["stage", "pipeline stage", "deal stage", "pipeline"],
  close_date: ["close date", "closing date", "expected close", "target date", "close"],
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (line[i] === "," && !inQ) {
        result.push(cur);
        cur = "";
      } else {
        cur += line[i];
      }
    }
    result.push(cur);
    return result;
  }

  const headers = parseLine(nonEmpty[0]).map((h) => h.trim());
  const rows = nonEmpty.slice(1).map(parseLine);
  return { headers, rows };
}

const CUSTOM_BLOCK_PREFIX = "__new__:";

function fieldSynonyms(field: FieldDef): string[] {
  return SYNONYMS[field.key] ?? [field.key.replace(/_/g, " "), field.key];
}

function inferCustomType(fieldKey: string): CustomFieldDef["type"] {
  if (fieldKey === "value") return "number";
  if (fieldKey === "close_date") return "date";
  return "text";
}

function isCustomBlockMapping(value: string): boolean {
  return value.startsWith(CUSTOM_BLOCK_PREFIX);
}

function csvHeaderFromMapping(value: string): string | null {
  if (value === "__skip__") return null;
  if (isCustomBlockMapping(value)) return value.slice(CUSTOM_BLOCK_PREFIX.length);
  return value;
}

function autoMap(headers: string[], fields: FieldDef[]): Record<string, string> {
  const used = new Set<string>();
  const map: Record<string, string> = {};

  for (const field of fields) {
    const synonyms = fieldSynonyms(field);
    const match = headers.find(
      (h) => !used.has(h) && synonyms.some((s) => h.toLowerCase().trim() === s.toLowerCase())
    );
    if (match) {
      map[field.key] = match;
      used.add(match);
    } else {
      map[field.key] = "__skip__";
    }
  }

  // Optional fields with no standard match → save as custom data block when a close CSV column exists.
  for (const field of fields) {
    if (field.required || map[field.key] !== "__skip__") continue;
    const synonyms = fieldSynonyms(field);
    const fuzzy = headers.find((h) => {
      if (used.has(h)) return false;
      const lower = h.toLowerCase().trim();
      return synonyms.some((s) => {
        const needle = s.toLowerCase();
        return lower.includes(needle) || needle.includes(lower);
      });
    });
    if (fuzzy) {
      map[field.key] = `${CUSTOM_BLOCK_PREFIX}${fuzzy}`;
      used.add(fuzzy);
    }
  }

  return map;
}

function getUsedHeaders(columnMap: Record<string, string>): Set<string> {
  const used = new Set<string>();
  for (const value of Object.values(columnMap)) {
    const header = csvHeaderFromMapping(value);
    if (header) used.add(header);
  }
  return used;
}

function initExtraColumnMap(
  headers: string[],
  columnMap: Record<string, string>,
  existingCustom: CustomFieldDef[]
): Record<string, string> {
  const used = getUsedHeaders(columnMap);
  const map: Record<string, string> = {};
  for (const h of headers) {
    if (used.has(h)) continue;
    const match = existingCustom.find((f) => f.label.toLowerCase() === h.toLowerCase().trim());
    map[h] = match ? `cf:${match.id}` : "__new__";
  }
  return map;
}

const ENTITY_CONFIG = {
  companies: { label: "Companies", icon: Building2, color: "text-milestone-blue", bg: "bg-milestone-blue-dim" },
  contacts: { label: "Contacts", icon: Users, color: "text-milestone-green", bg: "bg-milestone-green-dim" },
  opportunities: { label: "Opportunities", icon: Handshake, color: "text-milestone-amber", bg: "bg-milestone-amber-dim" },
};

interface Props {
  customFields: CustomFieldDefs;
}

export default function ImportWizard({ customFields }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [entityType, setEntityType] = useState<EntityType>("companies");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [extraColumnMap, setExtraColumnMap] = useState<Record<string, string>>({});
  const [newFieldIds, setNewFieldIds] = useState<Record<string, string>>({}); // keys: csv:Header or base:fieldKey
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cfObject = ENTITY_TO_OBJECT[entityType];
  const existingCustomFields = customFields[cfObject];

  function loadFile(file: File) {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      alert("Please upload a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      const baseMap = autoMap(parsed.headers, FIELDS[entityType]);
      const extra = initExtraColumnMap(parsed.headers, baseMap, customFields[cfObject]);
      const ids: Record<string, string> = {};
      for (const field of FIELDS[entityType]) {
        const mapping = baseMap[field.key];
        if (isCustomBlockMapping(mapping)) {
          ids[`base:${field.key}`] = makeImportFieldId(field.label);
        }
      }
      for (const [header, target] of Object.entries(extra)) {
        if (target === "__new__") ids[`csv:${header}`] = makeImportFieldId(header);
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setColumnMap(baseMap);
      setExtraColumnMap(extra);
      setNewFieldIds(ids);
      setResult(null);
      setStep("map");
    };
    reader.readAsText(file);
  }

  function getUnmappedHeaders(): string[] {
    const used = getUsedHeaders(columnMap);
    return headers.filter((h) => !used.has(h));
  }

  function resolveCustomFieldId(csvHeader: string, target: string): string | null {
    if (target === "__skip__") return null;
    if (target === "__new__") return newFieldIds[`csv:${csvHeader}`] ?? null;
    if (target.startsWith("cf:")) return target.slice(3);
    return null;
  }

  function getCustomHeaderMap(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const h of getUnmappedHeaders()) {
      const target = extraColumnMap[h] ?? "__skip__";
      const fieldId = resolveCustomFieldId(h, target);
      if (fieldId) out[h] = fieldId;
    }
    return out;
  }

  function getNewFieldDefs(): CustomFieldDef[] {
    const defs: CustomFieldDef[] = [];
    const seenIds = new Set<string>();

    for (const field of FIELDS[entityType]) {
      const mapping = columnMap[field.key];
      if (!isCustomBlockMapping(mapping)) continue;
      const id = newFieldIds[`base:${field.key}`];
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      defs.push({
        id,
        label: field.label.slice(0, 40),
        type: inferCustomType(field.key),
      });
    }

    for (const h of getUnmappedHeaders()) {
      if (extraColumnMap[h] !== "__new__") continue;
      const id = newFieldIds[`csv:${h}`];
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      defs.push({
        id,
        label: h.trim().slice(0, 40),
        type: "text",
      });
    }
    return defs;
  }

  function getCustomFieldLabels(): Map<string, string> {
    const labels = new Map<string, string>();
    for (const f of existingCustomFields) labels.set(f.id, f.label);
    for (const def of getNewFieldDefs()) labels.set(def.id, def.label);
    return labels;
  }

  function getMappedRows(): ImportRow[] {
    const fields = FIELDS[entityType];
    const customHeaderMap = getCustomHeaderMap();

    const mapped = rows.map((row) => {
      const out = { custom: {} as Record<string, string> } as ImportRow;
      for (const field of fields) {
        const mapping = columnMap[field.key];
        if (!mapping || mapping === "__skip__") continue;

        if (isCustomBlockMapping(mapping)) {
          const csvHeader = mapping.slice(CUSTOM_BLOCK_PREFIX.length);
          const fieldId = newFieldIds[`base:${field.key}`];
          if (fieldId) {
            const idx = headers.indexOf(csvHeader);
            const val = idx >= 0 ? (row[idx] ?? "").trim() : "";
            if (val) out.custom![fieldId] = val;
          }
          continue;
        }

        const idx = headers.indexOf(mapping);
        out[field.key] = idx >= 0 ? (row[idx] ?? "").trim() : "";
      }
      for (const [csvHeader, fieldId] of Object.entries(customHeaderMap)) {
        const idx = headers.indexOf(csvHeader);
        const val = idx >= 0 ? (row[idx] ?? "").trim() : "";
        if (val) out.custom![fieldId] = val;
      }
      return out;
    });

    return mapped.filter((row) =>
      fields.filter((f) => f.required).every((f) => (row[f.key] ?? "").trim())
    );
  }

  async function handleImport() {
    setImporting(true);
    const mappedRows = getMappedRows();
    const newDefs = getNewFieldDefs();
    try {
      let res;
      if (entityType === "companies") res = await importCompanies(mappedRows, newDefs);
      else if (entityType === "contacts") res = await importContacts(mappedRows, newDefs);
      else res = await importOpportunities(mappedRows, newDefs);
      setResult(res);
    } catch {
      setResult({ created: 0, errors: ["Import failed. Please try again."] });
    }
    setImporting(false);
  }

  function reset() {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setColumnMap({});
    setExtraColumnMap({});
    setNewFieldIds({});
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function setBaseMapping(fieldKey: string, value: string) {
    if (isCustomBlockMapping(value)) {
      const field = FIELDS[entityType].find((f) => f.key === fieldKey);
      if (field && !newFieldIds[`base:${fieldKey}`]) {
        setNewFieldIds((prev) => ({ ...prev, [`base:${fieldKey}`]: makeImportFieldId(field.label) }));
      }
    }
    setColumnMap((m) => ({ ...m, [fieldKey]: value }));
  }

  function setExtraMapping(csvHeader: string, value: string) {
    if (value === "__new__" && !newFieldIds[`csv:${csvHeader}`]) {
      setNewFieldIds((prev) => ({ ...prev, [`csv:${csvHeader}`]: makeImportFieldId(csvHeader) }));
    }
    setExtraColumnMap((m) => ({ ...m, [csvHeader]: value }));
  }

  function availableHeadersForField(fieldKey: string): string[] {
    const used = getUsedHeaders(columnMap);
    const current = csvHeaderFromMapping(columnMap[fieldKey] ?? "__skip__");
    return headers.filter((h) => h === current || !used.has(h));
  }

  const validRows = step !== "upload" ? getMappedRows() : [];
  const unmappedHeaders = step !== "upload" ? getUnmappedHeaders() : [];
  const customFieldLabels = step !== "upload" ? getCustomFieldLabels() : new Map();
  const previewCustomFieldIds = step !== "upload" ? getNewFieldDefs().map((d) => d.id) : [];

  // ── Step: Upload ───────────────────────────────────────────────────────────
  if (step === "upload") {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#0B1929] rounded-xl border border-milestone-line dark:border-white/[0.08] p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-3">
            What are you importing?
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((type) => {
              const { label, icon: Icon, color, bg } = ENTITY_CONFIG[type];
              const active = entityType === type;
              return (
                <button
                  key={type}
                  onClick={() => setEntityType(type)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    active
                      ? "border-milestone-blue bg-milestone-blue-dim"
                      : "border-milestone-line dark:border-white/[0.08] hover:border-milestone-blue/40 dark:hover:border-white/20"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? bg : "bg-gray-100 dark:bg-white/[0.07]"}`}
                  >
                    <Icon size={18} className={active ? color : "text-gray-400 dark:text-white/40"} />
                  </div>
                  <span
                    className={`text-xs font-semibold ${active ? "text-milestone-blue" : "text-gray-500 dark:text-white/50"}`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`bg-white dark:bg-[#0B1929] rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
            dragOver
              ? "border-milestone-blue bg-milestone-blue-dim"
              : "border-milestone-line dark:border-white/[0.12] hover:border-milestone-blue/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) loadFile(file);
          }}
          onClick={() => fileRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3 py-14 px-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.07] flex items-center justify-center">
              <Upload size={22} className="text-gray-400 dark:text-white/30" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-white">
                Drop your CSV here, or click to browse
              </p>
              <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
                Works with HubSpot, Salesforce, Pipedrive, and any standard export
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadFile(f);
            }}
          />
        </div>

        <div className="bg-white dark:bg-[#0B1929] rounded-xl border border-milestone-line dark:border-white/[0.08] p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-3 flex items-center gap-1.5">
            <FileText size={11} />
            Base data blocks for {ENTITY_CONFIG[entityType].label}
          </p>
          <div className="flex flex-wrap gap-2">
            {FIELDS[entityType].map((f) => (
              <span
                key={f.key}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  f.required
                    ? "bg-milestone-blue-dim text-milestone-blue"
                    : "bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-white/40"
                }`}
              >
                {f.label}
                {f.required ? " *" : ""}
              </span>
            ))}
          </div>
          {existingCustomFields.length > 0 && (
            <div className="mt-3 pt-3 border-t border-milestone-line dark:border-white/[0.06]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-white/25 mb-2">
                Your custom data blocks
              </p>
              <div className="flex flex-wrap gap-2">
                {existingCustomFields.map((f) => (
                  <span
                    key={f.id}
                    className="text-xs px-2.5 py-1 rounded-full font-medium bg-milestone-green-dim text-milestone-green"
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-[11px] text-gray-300 dark:text-white/20 mt-3">
            * Required. Any field can be saved as a custom data block on your records during import.
          </p>
        </div>
      </div>
    );
  }

  // ── Step: Map ──────────────────────────────────────────────────────────────
  if (step === "map") {
    const fields = FIELDS[entityType];
    const baseCustomCount = fields.filter((f) => isCustomBlockMapping(columnMap[f.key] ?? "")).length;
    const extraNewCount = unmappedHeaders.filter((h) => extraColumnMap[h] === "__new__").length;
    const newBlockCount = baseCustomCount + extraNewCount;
    const skippedOptional = fields.filter(
      (f) => !f.required && (columnMap[f.key] ?? "__skip__") === "__skip__"
    );

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#0B1929] rounded-xl border border-milestone-line dark:border-white/[0.08] overflow-hidden">
          <div className="px-5 py-4 border-b border-milestone-line dark:border-white/[0.08]">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Map your data</p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
              {rows.length} rows found · Map to standard fields or save as custom data blocks on each{" "}
              {ENTITY_CONFIG[entityType].label.toLowerCase().replace(/s$/, "")}
            </p>
          </div>
          <div className="divide-y divide-milestone-line dark:divide-white/[0.06]">
            {fields.map((field) => {
              const available = availableHeadersForField(field.key);
              const mapping = columnMap[field.key] ?? "__skip__";
              const isCustom = isCustomBlockMapping(mapping);

              return (
                <div key={field.key} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-40 shrink-0">
                    <p className="text-xs font-semibold text-gray-700 dark:text-white">
                      {field.label}
                      {field.required && <span className="text-milestone-red ml-0.5">*</span>}
                    </p>
                    {field.hint && (
                      <p className="text-[10px] text-gray-300 dark:text-white/25 mt-0.5">{field.hint}</p>
                    )}
                    {isCustom && (
                      <p className="text-[10px] text-milestone-green mt-0.5">Custom data block</p>
                    )}
                  </div>
                  <select
                    value={mapping}
                    onChange={(e) => setBaseMapping(field.key, e.target.value)}
                    className={`flex-1 px-3 py-1.5 border rounded-lg text-xs bg-white dark:bg-[#0f2032] text-gray-800 dark:text-white focus:outline-none focus:ring-2 ${
                      isCustom
                        ? "border-milestone-green/40 focus:ring-milestone-green"
                        : "border-milestone-line dark:border-white/[0.12] focus:ring-milestone-blue"
                    }`}
                  >
                    <option value="__skip__">— skip —</option>
                    {available.length > 0 && (
                      <optgroup label="Standard field">
                        {available.map((h) => (
                          <option key={`std-${h}`} value={h}>
                            {h}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {!field.required && available.length > 0 && (
                      <optgroup label="Custom data block on record">
                        {available.map((h) => (
                          <option key={`new-${h}`} value={`${CUSTOM_BLOCK_PREFIX}${h}`}>
                            {h} → add &quot;{field.label}&quot; block
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {skippedOptional.length > 0 && (
          <div className="rounded-xl border border-milestone-line/80 dark:border-white/[0.08] bg-milestone-green-dim/30 dark:bg-milestone-green/5 px-5 py-3">
            <p className="text-xs text-gray-600 dark:text-white/60">
              <span className="font-semibold text-milestone-green">{skippedOptional.length} field{skippedOptional.length !== 1 ? "s" : ""} skipped.</span>{" "}
              Pick a CSV column above and choose <span className="font-medium">Custom data block on record</span> to
              start customizing your {ENTITY_CONFIG[entityType].label.toLowerCase()} with your own data.
            </p>
          </div>
        )}

        {unmappedHeaders.length > 0 && (
          <div className="bg-white dark:bg-[#0B1929] rounded-xl border border-milestone-line dark:border-white/[0.08] overflow-hidden">
            <div className="px-5 py-4 border-b border-milestone-line dark:border-white/[0.08]">
              <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers size={14} className="text-milestone-green" />
                Additional data blocks
              </p>
              <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                {unmappedHeaders.length} extra column{unmappedHeaders.length !== 1 ? "s" : ""} not mapped above
                {newBlockCount > 0 && (
                  <span className="text-milestone-green">
                    {" "}
                    · {newBlockCount} new data block{newBlockCount !== 1 ? "s" : ""} will be added
                  </span>
                )}
              </p>
            </div>
            <div className="divide-y divide-milestone-line dark:divide-white/[0.06]">
              {unmappedHeaders.map((csvHeader) => (
                <div key={csvHeader} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-40 shrink-0">
                    <p className="text-xs font-semibold text-gray-700 dark:text-white truncate" title={csvHeader}>
                      {csvHeader}
                    </p>
                    <p className="text-[10px] text-gray-300 dark:text-white/25 mt-0.5">From your CSV</p>
                  </div>
                  <select
                    value={extraColumnMap[csvHeader] ?? "__skip__"}
                    onChange={(e) => setExtraMapping(csvHeader, e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-milestone-line dark:border-white/[0.12] rounded-lg text-xs bg-white dark:bg-[#0f2032] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-milestone-green"
                  >
                    <option value="__skip__">— skip —</option>
                    <option value="__new__">Create new data block &quot;{csvHeader}&quot;</option>
                    {existingCustomFields.length > 0 && (
                      <optgroup label="Existing data blocks">
                        {existingCustomFields.map((f) => (
                          <option key={f.id} value={`cf:${f.id}`}>
                            {f.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <button
            onClick={() => setStep("preview")}
            className="flex items-center gap-2 px-4 py-2 bg-milestone-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            Preview import
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Preview ──────────────────────────────────────────────────────────
  const previewRows = validRows.slice(0, 5);
  const fields = FIELDS[entityType];
  const mappedFields = fields.filter((f) => {
    const m = columnMap[f.key];
    return m && m !== "__skip__" && !isCustomBlockMapping(m);
  });

  return (
    <div className="space-y-4">
      {result ? (
        <div
          className={`rounded-xl border p-5 ${
            result.errors.length === 0
              ? "bg-milestone-green-dim border-milestone-green/20"
              : "bg-milestone-amber-dim border-milestone-amber/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-milestone-green shrink-0" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {result.created} record{result.created !== 1 ? "s" : ""} imported
            </p>
          </div>
          {getNewFieldDefs().length > 0 && (
            <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
              {getNewFieldDefs().length} new data block{getNewFieldDefs().length !== 1 ? "s" : ""} added to your
              workspace
            </p>
          )}
          {result.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {result.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-xs text-milestone-amber flex items-start gap-1.5">
                  <AlertCircle size={11} className="mt-0.5 shrink-0" />
                  {e}
                </p>
              ))}
              {result.errors.length > 5 && (
                <p className="text-xs text-gray-400">…and {result.errors.length - 5} more</p>
              )}
            </div>
          )}
          <button onClick={reset} className="mt-4 text-xs font-semibold text-milestone-blue hover:underline">
            Import another file
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-[#0B1929] rounded-xl border border-milestone-line dark:border-white/[0.08] overflow-hidden">
            <div className="px-5 py-4 border-b border-milestone-line dark:border-white/[0.08]">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Preview — {validRows.length} valid row{validRows.length !== 1 ? "s" : ""} ready to import
              </p>
              {rows.length - validRows.length > 0 && (
                <p className="text-xs text-milestone-amber mt-0.5">
                  {rows.length - validRows.length} row{rows.length - validRows.length !== 1 ? "s" : ""} skipped
                  (missing required fields)
                </p>
              )}
              {previewCustomFieldIds.length > 0 && (
                <p className="text-xs text-milestone-green mt-0.5">
                  Including {previewCustomFieldIds.length} custom data block
                  {previewCustomFieldIds.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-milestone-line dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.03]">
                    {mappedFields.map((f) => (
                      <th
                        key={f.key}
                        className="px-4 py-2.5 text-left font-bold text-gray-400 dark:text-white/40 uppercase tracking-wide whitespace-nowrap"
                      >
                        {f.label}
                      </th>
                    ))}
                    {previewCustomFieldIds.map((id) => (
                      <th
                        key={id}
                        className="px-4 py-2.5 text-left font-bold text-milestone-green/70 uppercase tracking-wide whitespace-nowrap"
                      >
                        {customFieldLabels.get(id) ?? id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-milestone-line/60 dark:divide-white/[0.04]">
                  {previewRows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/40 dark:hover:bg-white/[0.02]">
                      {mappedFields.map((f) => (
                        <td
                          key={f.key}
                          className="px-4 py-2.5 text-gray-700 dark:text-white/80 max-w-[180px] truncate"
                        >
                          {(row[f.key] ?? "") || (
                            <span className="text-gray-300 dark:text-white/20">—</span>
                          )}
                        </td>
                      ))}
                      {previewCustomFieldIds.map((id) => (
                        <td
                          key={id}
                          className="px-4 py-2.5 text-gray-700 dark:text-white/80 max-w-[180px] truncate"
                        >
                          {row.custom?.[id] || <span className="text-gray-300 dark:text-white/20">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {validRows.length > 5 && (
                <p className="px-4 py-2.5 text-xs text-gray-400 dark:text-white/30 border-t border-milestone-line dark:border-white/[0.06]">
                  + {validRows.length - 5} more rows not shown
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("map")}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-milestone-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {importing ? "Importing…" : `Import ${validRows.length} record${validRows.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
