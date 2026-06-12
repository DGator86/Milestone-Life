"use client";

import { useEffect, useState } from "react";
import { Plus, Target, ChevronDown, Sparkles, Loader } from "lucide-react";
import { createGoal } from "@/app/dashboard/actions";
import RecurrenceFields from "@/components/goals/RecurrenceFields";
import type { Group } from "@/lib/types";

const IMPORTANCE_OPTIONS = [
  { value: "normal", label: "Normal", color: "bg-gray-400", textColor: "text-gray-600" },
  { value: "important", label: "Important", color: "bg-milestone-amber", textColor: "text-amber-700" },
  { value: "critical", label: "Critical", color: "bg-milestone-red", textColor: "text-red-700" },
] as const;

const GOAL_TYPES = [
  { value: "concrete", label: "Project", description: "Defined goal with a clear finish line" },
  { value: "touches", label: "Habit", description: "Regular activity to keep up over time" },
  { value: "deadline", label: "Deadline", description: "Must be done by a specific date" },
  { value: "maintenance", label: "Ongoing", description: "Continuous work, no end date" },
] as const;

const EMPTY_MILESTONES = Array<string>(6).fill("");

interface Prefill {
  title?: string;
  goal_type?: string;
  importance?: string;
  milestones?: string[];
}

export default function CreateGoalForm({ groups }: { groups: Group[] }) {
  const [open, setOpen] = useState(false);
  const [milestoneCount, setMilestoneCount] = useState(3);
  const [milestoneValues, setMilestoneValues] = useState<string[]>([...EMPTY_MILESTONES]);
  const [importance, setImportance] = useState<"normal" | "important" | "critical">("normal");
  const [goalType, setGoalType] = useState("concrete");
  const [titleValue, setTitleValue] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("goal_prefill");
    if (!raw) return;
    try {
      sessionStorage.removeItem("goal_prefill");
      const data = JSON.parse(raw) as Prefill;
      setOpen(true);
      if (data.title) setTitleValue(data.title);
      if (data.goal_type && GOAL_TYPES.some((type) => type.value === data.goal_type)) setGoalType(data.goal_type);
      if (data.importance === "normal" || data.importance === "important" || data.importance === "critical") {
        setImportance(data.importance);
      }
      if (Array.isArray(data.milestones) && data.milestones.length) {
        setMilestoneCount(Math.min(6, data.milestones.length));
        setMilestoneValues([...data.milestones, ...EMPTY_MILESTONES].slice(0, 6));
      }
    } catch {}
  }, []);

  function adjustCount(newCount: number) {
    setMilestoneCount(Math.max(1, Math.min(6, newCount)));
  }

  const typeDescription = GOAL_TYPES.find((type) => type.value === goalType)?.description ?? "";

  const setMilestone = (index: number, value: string) => {
    setMilestoneValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const suggestMilestones = async () => {
    if (!titleValue.trim() || aiLoading) return;
    setAiError("");
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleValue, goal_type: goalType }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAiError(json.error ?? "AI unavailable");
        return;
      }
      if (Array.isArray(json.milestones) && json.milestones.length) {
        const count = Math.min(6, json.milestones.length);
        setMilestoneCount(count);
        setMilestoneValues([...json.milestones, ...EMPTY_MILESTONES].slice(0, 6));
      }
    } catch {
      setAiError("Could not reach AI");
    } finally {
      setAiLoading(false);
    }
  };

  const resetForm = () => {
    setOpen(false);
    setTitleValue("");
    setGoalType("concrete");
    setImportance("normal");
    setMilestoneCount(3);
    setMilestoneValues([...EMPTY_MILESTONES]);
    setAiError("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 bg-white border-2 border-dashed border-milestone-line rounded-xl px-6 py-4 text-sm text-gray-400 hover:border-milestone-blue hover:text-milestone-blue hover:bg-milestone-blue-dim transition-all w-full group"
      >
        <div className="w-7 h-7 rounded-lg border-2 border-dashed border-current flex items-center justify-center group-hover:bg-milestone-blue group-hover:border-milestone-blue group-hover:text-white transition-all">
          <Plus size={15} />
        </div>
        <span className="font-medium">Add new goal</span>
      </button>
    );
  }

  return (
    <div
      className="ms-card animate-fade-up"
      id="create-goal"
    >
      <div className="flex items-center gap-3 px-6 py-4 border-b border-milestone-line bg-gray-50/60">
        <div className="w-8 h-8 rounded-lg bg-milestone-blue-dim flex items-center justify-center">
          <Target size={16} className="text-milestone-blue" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">New Goal</h3>
          <p className="text-xs text-gray-400">Define your goal and break it into milestones</p>
        </div>
      </div>

      <form action={createGoal} className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
            Goal Title <span className="text-milestone-red">*</span>
          </label>
          <input
            name="title"
            required
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
            placeholder="e.g. Close the Acme deal, Run a 5K, Finish the deck renovation"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Group <span className="text-milestone-red">*</span>
            </label>
            <div className="relative">
              <select
                name="group_id"
                required
                className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent bg-white appearance-none cursor-pointer transition-all"
              >
                <option value="">Select…</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Type
            </label>
            <div className="relative">
              <select
                name="goal_type"
                value={goalType}
                onChange={(e) => setGoalType(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent bg-white appearance-none cursor-pointer transition-all"
              >
                {GOAL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 leading-tight">{typeDescription}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Due Date
            </label>
            <input
              name="due_date"
              type="date"
              className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Importance
            </label>
            <input type="hidden" name="importance" value={importance} />
            <div className="flex gap-1 h-[42px]">
              {IMPORTANCE_OPTIONS.map(({ value, label, color, textColor }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setImportance(value)}
                  title={label}
                  className={`flex-1 flex items-center justify-center rounded-lg border transition-all text-xs font-semibold ${
                    importance === value
                      ? `border-transparent ${textColor} bg-gray-100 ring-2 ring-offset-1 ring-current`
                      : "border-milestone-line text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <RecurrenceFields />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
              Milestones <span className="text-milestone-red">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={suggestMilestones}
                disabled={!titleValue.trim() || aiLoading}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-milestone-blue-dim text-milestone-blue hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {aiLoading ? <Loader size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {aiLoading ? "Thinking…" : "Suggest with AI"}
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustCount(milestoneCount - 1)}
                  className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center text-base transition-colors"
                >
                  −
                </button>
                <span className="text-sm font-semibold text-gray-600 w-4 text-center tabular-nums">
                  {milestoneCount}
                </span>
                <button
                  type="button"
                  onClick={() => adjustCount(milestoneCount + 1)}
                  className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center text-base transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {aiError && <p className="text-xs text-milestone-red mb-2">{aiError}</p>}

          <div className="flex items-center gap-1.5 mb-2.5">
            {Array.from({ length: milestoneCount }, (_, index) => (
              <div key={index} className="flex items-center gap-1.5 flex-1">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    milestoneValues[index]?.trim() ? "border-milestone-blue bg-milestone-blue" : "border-milestone-blue bg-white"
                  }`}
                >
                  <span
                    className={`text-[9px] font-bold ${milestoneValues[index]?.trim() ? "text-white" : "text-milestone-blue"}`}
                  >
                    {index + 1}
                  </span>
                </div>
                {index < milestoneCount - 1 && (
                  <div
                    className={`flex-1 h-px transition-colors ${
                      milestoneValues[index]?.trim() ? "bg-milestone-blue/30" : "bg-milestone-line"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {Array.from({ length: milestoneCount }, (_, index) => (
              <input
                key={index}
                name={`milestone_${index + 1}`}
                required={index === 0}
                value={milestoneValues[index] ?? ""}
                onChange={(e) => setMilestone(index, e.target.value)}
                className="px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
                placeholder={`Step ${index + 1}${index === 0 ? " *" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            type="submit"
            className="bg-milestone-blue text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
          >
            Create Goal
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
