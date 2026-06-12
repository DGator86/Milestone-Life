"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

const ICON = { success: CheckCircle, error: XCircle, info: Info };

const CHIP = {
  success: "bg-milestone-green",
  error: "bg-milestone-red",
  info: "bg-milestone-blue",
};

const RING = {
  success: "ring-milestone-green/20",
  error: "ring-milestone-red/20",
  info: "ring-milestone-blue/20",
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const Icon = ICON[toast.type];
  return (
    <div
      className={`flex items-center gap-3 bg-white dark:bg-[#0B1929] rounded-xl shadow-card-lg ring-1 ${RING[toast.type]} px-4 py-3 pointer-events-auto min-w-[260px] max-w-[380px] animate-fade-up border border-milestone-line dark:border-white/[0.08]`}
    >
      <div
        className={`w-7 h-7 rounded-lg ${CHIP[toast.type]} flex items-center justify-center shrink-0`}
      >
        <Icon size={14} className="text-white" />
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800 dark:text-white/90">{toast.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-gray-300 dark:text-white/30 hover:text-gray-500 dark:hover:text-white/60 transition-colors shrink-0 ml-1"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = String(++counter.current);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
