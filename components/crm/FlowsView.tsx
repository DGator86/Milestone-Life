"use client";

import { useState, useTransition } from "react";
import { Workflow, Plus, X, Trash2, GitBranch, Pencil, ChevronRight } from "lucide-react";
import type { CrmFlow, CrmFlowInstance, CrmCustomer } from "@/lib/types";
import {
  createFlow,
  updateFlow,
  deleteFlow,
  createFlowInstance,
  advanceFlowInstance,
  deleteFlowInstance,
} from "@/app/flows/actions";
import SlideOver from "./SlideOver";

const PRESET_COLORS = [
  { label: "Blue", value: "#1769FF" },
  { label: "Green", value: "#36A852" },
  { label: "Amber", value: "#F8B400" },
  { label: "Red", value: "#EA4335" },
  { label: "Purple", value: "#8B5CF6" },
  { label: "Teal", value: "#0D9488" },
  { label: "Orange", value: "#F97316" },
  { label: "Pink", value: "#EC4899" },
];

const DEFAULT_STAGES_TEXT = "Lead\nQualified\nProposal\nNegotiation\nWon\nLost";

const INPUT = "ms-input";

const LABEL = "ms-label";

interface Props {
  flows: CrmFlow[];
  oppCountByFlow: Record<string, number>;
  instances: CrmFlowInstance[];
  customers: Pick<CrmCustomer, "id" | "name">[];
}

// A flow definition: editable (rename/recolor/stages) and a launch point for
// new running instances.
function FlowCard({
  flow,
  oppCount,
  onEdit,
  onDelete,
  onStart,
}: {
  flow: CrmFlow;
  oppCount: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
}) {
  return (
    <div className="ms-card group">
      {/* Colored top bar */}
      <div className="h-1.5" style={{ backgroundColor: flow.color }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${flow.color}18` }}
            >
              <GitBranch size={17} style={{ color: flow.color }} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{flow.name}</p>
              {flow.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{flow.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
            <button
              onClick={() => onEdit(flow.id)}
              className="text-gray-300 hover:text-milestone-blue transition-colors"
              aria-label={`Edit ${flow.name}`}
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(flow.id)}
              className="text-gray-300 hover:text-milestone-red transition-colors"
              aria-label={`Delete ${flow.name}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Stages */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {flow.stages.map((stage, i) => (
            <span
              key={i}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${flow.color}18`,
                color: flow.color,
              }}
            >
              {stage}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3.5 border-t border-milestone-line flex items-center justify-between">
          <span className="text-xs text-gray-400">{flow.stages.length} stages</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500">
              {oppCount} {oppCount === 1 ? "opportunity" : "opportunities"}
            </span>
            <button
              onClick={() => onStart(flow.id)}
              className="flex items-center gap-1 text-[11px] font-semibold text-milestone-blue hover:bg-milestone-blue-dim px-2 py-1 rounded-lg transition-colors"
            >
              <Plus size={11} />
              Start
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// A single running instance of a flow, with stage badge and advance/remove.
function InstanceRow({
  instance,
  onAdvance,
  onDelete,
}: {
  instance: CrmFlowInstance;
  onAdvance: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const flow = instance.crm_flows;
  const stageName = flow ? (flow.stages[instance.current_stage_idx] ?? flow.stages[0]) : "—";
  const color = flow?.color ?? "#1769FF";

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/60 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {instance.crm_customers?.name ?? "Unassigned"}
        </p>
        {instance.run_count > 1 && (
          <p className="text-[11px] text-gray-400">Cycle #{instance.run_count}</p>
        )}
      </div>
      <span
        className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
        style={{ backgroundColor: `${color}18`, color }}
      >
        {stageName}
      </span>
      <button
        onClick={() => onAdvance(instance.id)}
        className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-milestone-blue transition-colors shrink-0"
      >
        <ChevronRight size={13} />
        Advance
      </button>
      <button
        onClick={() => onDelete(instance.id)}
        className="text-gray-200 hover:text-milestone-red transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        aria-label="Remove instance"
      >
        <X size={13} />
      </button>
    </div>
  );
}

function AssignForm({
  flowId,
  customers,
  onSubmit,
}: {
  flowId: string;
  customers: Pick<CrmCustomer, "id" | "name">[];
  onSubmit: (flowId: string, customerId: string | null) => void;
}) {
  const [customerId, setCustomerId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(flowId, customerId || null);
    setCustomerId("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-2 border-t border-milestone-line/50">
      <select
        aria-label="Assign customer"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
        className="flex-1 px-2.5 py-1.5 text-xs border border-milestone-line rounded-lg focus:outline-none focus:ring-1 focus:ring-milestone-blue focus:border-milestone-blue bg-white text-gray-700"
      >
        <option value="">Unassigned</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <button
        type="submit"
        className="px-3 py-1.5 bg-milestone-blue text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shrink-0"
      >
        Assign
      </button>
    </form>
  );
}

export default function FlowsView({ flows, oppCountByFlow, instances, customers }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editColor, setEditColor] = useState(PRESET_COLORS[0].value);
  const [isPending, startTransition] = useTransition();

  const selected = flows.find((f) => f.id === selectedId) ?? null;

  function openEdit(id: string) {
    const flow = flows.find((f) => f.id === id);
    if (!flow) return;
    setEditColor(flow.color);
    setSelectedId(id);
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("color", selectedColor);
    startTransition(async () => {
      await createFlow(formData);
      setShowForm(false);
      setSelectedColor(PRESET_COLORS[0].value);
    });
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const formData = new FormData(e.currentTarget);
    formData.set("color", editColor);
    const id = selected.id;
    startTransition(async () => {
      await updateFlow(id, formData);
      setSelectedId(null);
    });
  }

  function handleDelete(id: string) {
    const flow = flows.find((f) => f.id === id);
    const label = flow?.name ?? "this flow";
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    startTransition(() => deleteFlow(id));
  }

  function handleCreateInstance(flowId: string, customerId: string | null) {
    startTransition(() => createFlowInstance(flowId, customerId));
  }

  function handleAdvance(instanceId: string) {
    startTransition(() => advanceFlowInstance(instanceId));
  }

  function handleDeleteInstance(instanceId: string) {
    if (!window.confirm("Delete this flow instance?")) return;
    startTransition(() => deleteFlowInstance(instanceId));
  }

  const flowsWithInstances = flows.filter((f) => instances.some((i) => i.flow_id === f.id));

  return (
    <div className="p-6 max-w-6xl" style={{ opacity: isPending ? 0.7 : 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Workflow size={20} className="text-milestone-blue" />
            Flows
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {flows.length} {flows.length === 1 ? "pipeline" : "pipelines"} · Track active deals through each stage
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-milestone-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Create Flow"}
        </button>
      </div>

      {showForm && (
        <div className="ms-card p-5 mb-6 animate-fade-up">
          <p className="text-sm font-bold text-gray-900 mb-4">New Flow</p>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Flow Name *</label>
                <input name="name" required placeholder="Enterprise Sales" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Description</label>
                <input name="description" placeholder="For deals over $50k" className={INPUT} />
              </div>
            </div>

            <div className="mt-4">
              <label className={LABEL}>Color</label>
              <div className="flex gap-2 flex-wrap mt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    title={c.label}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110 ring-offset-2"
                    style={{
                      backgroundColor: c.value,
                      outline: selectedColor === c.value ? `2px solid ${c.value}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className={LABEL}>Stages (one per line)</label>
              <textarea
                name="stages"
                rows={5}
                defaultValue={DEFAULT_STAGES_TEXT}
                placeholder="Lead&#10;Qualified&#10;Proposal&#10;Negotiation&#10;Won&#10;Lost"
                className={INPUT}
              />
              <p className="text-[11px] text-gray-400 mt-1">Each line becomes a stage in the pipeline.</p>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-milestone-blue text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Save Flow
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

      {/* Active Flows — running instances grouped by flow */}
      {instances.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Active Flows</h2>
          <div className="space-y-3">
            {flowsWithInstances.map((flow) => {
              const flowInstances = instances.filter((i) => i.flow_id === flow.id);
              return (
                <div key={flow.id} className="ms-card">
                  <div className="h-1" style={{ backgroundColor: flow.color }} />
                  <div className="px-4 py-3 border-b border-milestone-line/60 flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: flow.color }}
                    />
                    <p className="text-sm font-bold text-gray-900">{flow.name}</p>
                    <span className="text-[11px] text-gray-400 ml-auto">{flow.stages.length} stages</span>
                  </div>
                  <div className="divide-y divide-milestone-line/60">
                    {flowInstances.map((instance) => (
                      <InstanceRow
                        key={instance.id}
                        instance={instance}
                        onAdvance={handleAdvance}
                        onDelete={handleDeleteInstance}
                      />
                    ))}
                  </div>
                  <AssignForm flowId={flow.id} customers={customers} onSubmit={handleCreateInstance} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flow definitions — editable, with a launch point for instances */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Flow Templates</h2>
      {flows.length === 0 ? (
        <div className="ms-card p-14 text-center">
          <Workflow size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">No flows yet.</p>
          <p className="text-xs text-gray-300 mt-1">
            Create a flow to define custom pipeline stages for your opportunities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {flows.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              oppCount={oppCountByFlow[flow.id] ?? 0}
              onEdit={openEdit}
              onDelete={handleDelete}
              onStart={(id) => handleCreateInstance(id, null)}
            />
          ))}

          {/* Add placeholder */}
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl border-2 border-dashed border-milestone-line p-8 flex flex-col items-center justify-center gap-3 text-gray-300 hover:border-milestone-blue hover:text-milestone-blue transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:bg-milestone-blue-dim">
              <Plus size={18} />
            </div>
            <p className="text-sm font-semibold">Create a flow</p>
          </button>
        </div>
      )}

      {/* Edit portal */}
      <SlideOver
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.name ?? ""}
        subtitle="Edit flow · rename, recolor, change stages"
      >
        {selected && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className={LABEL}>Flow Name *</label>
              <input name="name" required defaultValue={selected.name} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Description</label>
              <input name="description" defaultValue={selected.description ?? ""} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Color</label>
              <div className="flex gap-2 flex-wrap mt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setEditColor(c.value)}
                    title={c.label}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110 ring-offset-2"
                    style={{
                      backgroundColor: c.value,
                      outline: editColor === c.value ? `2px solid ${c.value}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Stages (one per line)</label>
              <textarea
                name="stages"
                rows={6}
                defaultValue={selected.stages.join("\n")}
                className={INPUT}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Reorder, rename, add or remove stages. Existing opportunities on a removed stage stay put and show a
                badge until moved.
              </p>
            </div>
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
                onClick={() => {
                  handleDelete(selected.id);
                  setSelectedId(null);
                }}
                className="text-sm text-gray-400 hover:text-milestone-red transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </form>
        )}
      </SlideOver>
    </div>
  );
}
