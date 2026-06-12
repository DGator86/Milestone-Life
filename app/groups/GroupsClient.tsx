"use client";

import { useActionState, useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Briefcase, Home, Heart, Target } from "lucide-react";
import { createGroup, deleteGroup } from "./actions";
import { useToast } from "@/lib/toast-context";
import { confirmDestructive } from "@/lib/confirmDestructive";
import type { Group } from "@/lib/types";

const GROUP_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Work: Briefcase,
  Home: Home,
  Health: Heart,
};

const GROUP_GRADIENTS: Record<string, string> = {
  Work: "from-blue-50 to-indigo-50 border-blue-100",
  Home: "from-amber-50 to-orange-50 border-amber-100",
  Health: "from-green-50 to-emerald-50 border-green-100",
};

const GROUP_ICON_COLORS: Record<string, string> = {
  Work: "text-milestone-blue bg-milestone-blue-dim",
  Home: "text-milestone-amber bg-milestone-amber-dim",
  Health: "text-milestone-green bg-milestone-green-dim",
};

const PRESET_COLORS = [
  { color: "#1769FF", label: "Blue" },
  { color: "#36A852", label: "Green" },
  { color: "#F8B400", label: "Amber" },
  { color: "#EA4335", label: "Red" },
  { color: "#8B5CF6", label: "Purple" },
  { color: "#F97316", label: "Orange" },
  { color: "#06B6D4", label: "Cyan" },
  { color: "#EC4899", label: "Pink" },
];

function AddGroupForm({ onSuccess }: { onSuccess: () => void }) {
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].color);
  const [state, action, isPending] = useActionState(createGroup, null);
  const { show } = useToast();

  useEffect(() => {
    if (state?.success) {
      show("Group created!", "success");
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <form action={action} className="space-y-4 animate-fade-up">
      {state?.error && (
        <p className="text-xs text-milestone-red bg-milestone-red-dim px-3 py-2 rounded-lg">
          {state.error}
        </p>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
          Group Name <span className="text-milestone-red">*</span>
        </label>
        <input
          name="name"
          required
          autoFocus
          className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent"
          placeholder="e.g. Finance, Side Project, Travel…"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Color
        </label>
        <input type="hidden" name="color" value={selectedColor} />
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map(({ color, label }) => (
            <button
              key={color}
              type="button"
              title={label}
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-full transition-all ${
                selectedColor === color
                  ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-milestone-blue text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create group"}
        </button>
      </div>
    </form>
  );
}

function GroupCard({ group }: { group: Group }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { show } = useToast();
  const Icon = GROUP_ICONS[group.name] ?? Target;
  const gradient = GROUP_GRADIENTS[group.name] ?? "from-gray-50 to-gray-50 border-gray-100";
  const iconColor = GROUP_ICON_COLORS[group.name] ?? "text-gray-500 bg-gray-100";

  function handleDelete() {
    if (!confirmDestructive(`Delete group "${group.name}"? Goals in this group will need to be moved first.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteGroup(group.id);
      if (result.error) show(result.error, "error");
      else {
        show(`"${group.name}" deleted`, "info");
        router.refresh();
      }
    });
  }

  return (
    <div
      className={`bg-gradient-to-br ${gradient} rounded-xl border p-5 flex items-center gap-4 hover:shadow-card-lg transition-shadow ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900">{group.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: group.color ?? "#DFE6EF" }}
          />
          <p className="text-xs text-gray-400">Active group</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        title="Delete group"
        aria-label={`Delete group ${group.name}`}
        disabled={isPending}
        className="p-2 rounded-lg transition-colors shrink-0 text-gray-300 hover:text-milestone-red hover:bg-milestone-red-dim"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export function GroupsClient({ groups }: { groups: Group[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}

        {/* Add group card */}
        <button
          onClick={() => setShowForm((s) => !s)}
          className={`rounded-xl border-2 border-dashed p-5 flex items-center gap-4 transition-all group ${
            showForm
              ? "border-milestone-blue bg-milestone-blue-dim"
              : "border-milestone-line text-gray-300 hover:border-milestone-blue hover:text-milestone-blue"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center shrink-0 transition-colors ${
              showForm ? "bg-milestone-blue border-milestone-blue text-white" : ""
            }`}
          >
            <Plus size={20} />
          </div>
          <p className={`font-semibold text-sm ${showForm ? "text-milestone-blue" : ""}`}>
            {showForm ? "Cancel" : "Add group"}
          </p>
        </button>
      </div>

      {showForm && (
        <div className="ms-card p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">New Group</h3>
          <AddGroupForm onSuccess={() => setShowForm(false)} />
        </div>
      )}
    </div>
  );
}
