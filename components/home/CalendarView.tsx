"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import { buildMonthCalendar, type CalendarEntry } from "@/lib/calendarEntries";
import type { CrmTask, GoalWithDetails } from "@/lib/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type ViewMode = "month" | "agenda";

const KIND_LABEL: Record<CalendarEntry["kind"], string> = {
  goal: "Goal deadline",
  milestone: "Milestone",
  task: "CRM task",
  priority: "Priority",
};

function entryHref(entry: CalendarEntry): string {
  if (entry.kind === "task" && entry.taskId) return `/tasks/${entry.taskId}`;
  if (entry.goalId) return `/goals/${entry.goalId}`;
  return "/dashboard";
}

export default function CalendarView({
  goals,
  tasks,
}: {
  goals: GoalWithDetails[];
  tasks: CrmTask[];
}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [mode, setMode] = useState<ViewMode>("month");

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const { byDay, agenda } = useMemo(
    () => buildMonthCalendar(goals, tasks, year, month),
    [goals, tasks, year, month],
  );

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedItems = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-milestone-line dark:border-white/[0.08] overflow-hidden w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setMode("month")}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 py-2.5 sm:py-1.5 text-xs font-semibold transition-colors touch-manipulation ${
              mode === "month"
                ? "bg-milestone-blue text-white"
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            }`}
          >
            <CalendarDays size={13} />
            Month
          </button>
          <button
            type="button"
            onClick={() => setMode("agenda")}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 py-2.5 sm:py-1.5 text-xs font-semibold transition-colors touch-manipulation ${
              mode === "agenda"
                ? "bg-milestone-blue text-white"
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            }`}
          >
            <List size={13} />
            Detailed
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center sm:text-right px-1">{agenda.length} items this month</p>
      </div>

      {mode === "month" ? (
        <div className="ms-card-app overflow-hidden">
          <div className="flex items-center justify-between px-3 py-3 border-b border-milestone-line dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null); }}
              className="ms-touch-icon rounded-xl text-gray-400 active:bg-gray-50 dark:active:bg-white/[0.06]"
            >
              <ChevronLeft size={20} />
            </button>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {MONTHS[month]} {year}
            </p>
            <button
              type="button"
              onClick={() => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null); }}
              className="ms-touch-icon rounded-xl text-gray-400 active:bg-gray-50 dark:active:bg-white/[0.06]"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 px-1.5 pt-2 pb-0.5 sm:px-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-300 dark:text-white/20 pb-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 px-1.5 pb-3 gap-1 sm:px-2 sm:gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`b${i}`} className="aspect-square min-h-[44px]" />;
              const items = byDay.get(day) ?? [];
              const sel = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(sel ? null : day)}
                  className={`relative flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all min-h-[44px] touch-manipulation ${
                    sel
                      ? "bg-milestone-blue text-white shadow-sm"
                      : isToday(day)
                      ? "border-2 border-milestone-blue text-milestone-blue bg-milestone-blue/5"
                      : "text-gray-700 dark:text-white/70 active:bg-gray-50 dark:active:bg-white/[0.05]"
                  }`}
                >
                  <span>{day}</span>
                  {items.length > 0 && !sel && (
                    <span className="absolute bottom-1 flex gap-0.5">
                      {Array.from({ length: Math.min(items.length, 3) }).map((_, dot) => (
                        <span key={dot} className="w-1 h-1 rounded-full bg-milestone-blue" />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDay !== null && (
            <div className="border-t border-milestone-line dark:border-white/[0.08] animate-fade-up">
              <div className="px-4 py-2 border-b border-milestone-line/60 dark:border-white/[0.05]">
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {MONTHS[month]} {selectedDay}
                </p>
              </div>
              {selectedItems.length === 0 ? (
                <p className="px-4 py-4 text-xs text-gray-400">Nothing scheduled on this day.</p>
              ) : (
                <div className="divide-y divide-milestone-line/60 dark:divide-white/[0.05] max-h-56 overflow-y-auto">
                  {selectedItems.map((item, idx) => (
                    <Link
                      key={`${item.date}-${item.kind}-${item.goalId ?? item.taskId}-${idx}`}
                      href={entryHref(item)}
                      className="block px-4 py-3.5 active:bg-gray-50 dark:active:bg-white/[0.03]"
                    >
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                        {KIND_LABEL[item.kind]}
                        {item.kind !== "task" ? ` · ${item.goalTitle}` : ""}
                      </p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">{item.label}</p>
                      {item.kind === "task" && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.goalTitle}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="ms-card-app overflow-hidden">
          <div className="flex items-center justify-between px-3 py-3 border-b border-milestone-line dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="ms-touch-icon rounded-xl text-gray-400 active:bg-gray-50 dark:active:bg-white/[0.06]"
            >
              <ChevronLeft size={20} />
            </button>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {MONTHS[month]} {year}
            </p>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="ms-touch-icon rounded-xl text-gray-400 active:bg-gray-50 dark:active:bg-white/[0.06]"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          {agenda.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-400 text-center">No scheduled items this month.</p>
          ) : (
            <div className="max-h-[min(60vh,420px)] overflow-y-auto divide-y divide-milestone-line/60 dark:divide-white/[0.05]">
              {agenda.map((item, idx) => (
                <Link
                  key={`${item.date}-${item.kind}-${item.goalId ?? item.taskId}-${idx}`}
                  href={entryHref(item)}
                  className="flex items-start gap-3 px-4 py-4 active:bg-gray-50 dark:active:bg-white/[0.03]"
                >
                  <div className="shrink-0 w-12 text-center">
                    <p className="text-[10px] font-bold uppercase text-gray-400">
                      {new Date(item.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className="text-lg font-bold text-milestone-blue leading-none">
                      {item.day}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      {KIND_LABEL[item.kind]}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.label}</p>
                    <p className="text-xs text-gray-400 truncate">{item.goalTitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
