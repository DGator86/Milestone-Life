"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bot, X, Sparkles } from "lucide-react";
import AgentChat from "./AgentChat";

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Don't double up on the dedicated /ai page.
  const hidden = pathname?.startsWith("/ai");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (hidden) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          className="fixed z-50 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-milestone-blue text-white shadow-card-xl active:scale-95 transition-transform touch-manipulation"
          style={{
            width: 56,
            height: 56,
            right: "max(1rem, env(safe-area-inset-right))",
            bottom: "max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))",
          }}
        >
          <Sparkles size={22} />
        </button>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed z-50 bottom-0 right-0 sm:bottom-5 sm:right-5 w-full sm:w-[400px] h-[85vh] sm:h-[640px] sm:max-h-[85vh] bg-milestone-bg dark:bg-[#07111F] sm:rounded-2xl shadow-card-xl border border-milestone-line dark:border-white/[0.08] flex flex-col overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-milestone-line dark:border-white/[0.08] bg-white dark:bg-[#0B1929] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-milestone-blue flex items-center justify-center">
                  <Bot size={15} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Assistant</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-lg text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 min-h-0 px-2">
              <AgentChat variant="drawer" />
            </div>
          </div>
        </>
      )}
    </>
  );
}
