"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#0B1929] h-full shadow-card-lg overflow-y-auto animate-fade-up">
        <div className="sticky top-0 z-10 bg-white dark:bg-[#0B1929] border-b border-milestone-line dark:border-white/[0.06] px-4 py-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
