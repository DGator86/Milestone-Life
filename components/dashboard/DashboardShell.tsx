"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CriticalPaths from "@/components/home/CriticalPaths";
import FocusToday from "@/components/home/FocusToday";
import AgendaView from "@/components/home/AgendaView";
import CalendarView from "@/components/home/CalendarView";
import KillList from "@/components/home/KillList";
import GoalWizard from "@/components/dashboard/GoalWizard";
import type { GoalWithDetails, Group, CrmTask, CrmCustomer } from "@/lib/types";

const WIZARD_KEY = "wizard_dismissed";

type ViewTab = "focus" | "agenda" | "calendar";
type GoalPrefill = { title?: string; goal_type?: string; milestones?: string[] };

function isGoalPrefill(v: unknown): v is GoalPrefill {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    (o.title === undefined || typeof o.title === "string") &&
    (o.goal_type === undefined || typeof o.goal_type === "string") &&
    (o.milestones === undefined ||
      (Array.isArray(o.milestones) && o.milestones.every((m) => typeof m === "string")))
  );
}

const TABS: { key: ViewTab; label: string }[] = [
  { key: "focus", label: "Today" },
  { key: "agenda", label: "Agenda" },
  { key: "calendar", label: "Calendar" },
];

function formatMobileDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function DashboardShell({
  goals,
  groups,
  tasks,
  customers,
}: {
  goals: GoalWithDetails[];
  groups: Group[];
  tasks: CrmTask[];
  customers: Pick<CrmCustomer, "id" | "name">[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [prefill, setPrefill] = useState<GoalPrefill | null>(null);

  const tabParam = searchParams.get("tab");
  const groupParam = searchParams.get("group") ?? "";
  const view: ViewTab =
    tabParam === "agenda" || tabParam === "calendar" || tabParam === "focus" ? tabParam : "focus";
  const selectedGroupId = groups.some((group) => group.id === groupParam) ? groupParam : "";
  const filteredGoals = selectedGroupId
    ? goals.filter((goal) => goal.group_id === selectedGroupId)
    : goals;
  const groupChips = [{ id: "", name: "All", color: "#1769FF" }, ...groups];
  const activeGroupName =
    groupChips.find((group) => group.id === selectedGroupId)?.name ?? "All";

  const mobileDate = useMemo(() => formatMobileDate(), []);

  const setView = useCallback(
    (next: ViewTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "focus") params.delete("tab");
      else params.set("tab", next);
      const qs = params.toString();
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
    },
    [router, searchParams],
  );

  const setGroup = useCallback(
    (groupId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (groupId) params.set("group", groupId);
      else params.delete("group");
      const qs = params.toString();
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("goal_prefill");
      if (raw) {
        const data: unknown = JSON.parse(raw);
        sessionStorage.removeItem("goal_prefill");
        if (isGoalPrefill(data)) {
          setPrefill(data);
          setWizardOpen(true);
        }
        return;
      }
    } catch {}
    if (goals.length === 0 && !localStorage.getItem(WIZARD_KEY)) {
      setWizardOpen(true);
    }
  }, [goals.length]);

  function openWizard() {
    setPrefill(null);
    setWizardOpen(true);
  }

  function closeWizard() {
    localStorage.setItem(WIZARD_KEY, "1");
    setWizardOpen(false);
  }

  return (
    <>
      <GoalWizard groups={groups} open={wizardOpen} onClose={closeWizard} prefill={prefill} />
      <div className="ms-mobile-page space-y-4">
        {/* Mobile app header */}
        <div className="md:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-white/35">
            {mobileDate}
          </p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mt-0.5">
            {view === "focus" ? "Today" : view === "agenda" ? "Agenda" : "Calendar"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
            {activeGroupName === "All" ? "Milestones across life" : `${activeGroupName} milestones`}
          </p>
        </div>

        {/* Sticky tab bar — app-style on mobile */}
        <div className="sticky top-14 z-30 -mx-4 px-4 py-2.5 bg-milestone-bg/95 dark:bg-[#07111F]/95 backdrop-blur-md border-b border-milestone-line/60 dark:border-white/[0.06] md:static md:mx-0 md:px-0 md:py-0 md:bg-transparent md:border-0 md:backdrop-blur-none">
          <div className="ms-segment-app md:ms-segment md:w-auto">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`ms-segment-app-btn md:ms-segment-btn md:flex-none md:min-h-0 ${
                  view === key
                    ? "ms-segment-app-btn-active md:ms-segment-btn-active"
                    : "ms-segment-app-btn-inactive md:ms-segment-btn-inactive"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar md:mx-0 md:px-0">
          <div className="flex gap-2 min-w-max pb-1">
            {groupChips.map((group) => {
              const active = selectedGroupId === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setGroup(group.id)}
                  className={`min-h-[40px] rounded-full px-4 text-sm font-semibold transition-all touch-manipulation ${
                    active
                      ? "text-white shadow-sm"
                      : "bg-white dark:bg-[#0B1929] text-gray-500 dark:text-white/55 border border-milestone-line dark:border-white/[0.08] active:bg-gray-50 dark:active:bg-white/[0.05]"
                  }`}
                  style={active ? { backgroundColor: group.color ?? "#1769FF" } : undefined}
                >
                  {group.name}
                </button>
              );
            })}
          </div>
        </div>

        {view === "focus" && (
          <div className="space-y-4 md:space-y-4">
            <FocusToday goals={filteredGoals} onNewGoal={openWizard} />
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-6">
              {/* Mobile: kill list before goal cards — actions first */}
              <div className="order-1 lg:order-2 lg:col-span-1">
                <KillList goals={filteredGoals} tasks={tasks} customers={customers} />
              </div>
              <div className="order-2 lg:order-1 lg:col-span-2">
                <CriticalPaths goals={filteredGoals} onNewGoal={openWizard} />
              </div>
            </div>
          </div>
        )}

        {view === "agenda" && <AgendaView goals={filteredGoals} tasks={tasks} />}

        {view === "calendar" && <CalendarView goals={filteredGoals} tasks={tasks} />}
      </div>
    </>
  );
}
