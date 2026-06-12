"use client";

import { useState } from "react";
import { Loader, CheckCircle2 } from "lucide-react";
import { seedDemoData } from "@/app/settings/actions";

export default function SeedDemoButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleClick = async () => {
    if (state !== "idle") return;
    setState("loading");
    try {
      const result = await seedDemoData();
      if (result?.error) {
        setErrorMsg(result.error);
        setState("error");
      } else {
        setState("done");
      }
    } catch {
      setErrorMsg("Unexpected error");
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="flex items-center gap-1.5 text-milestone-green text-sm font-semibold shrink-0">
        <CheckCircle2 size={16} />
        Done!
      </div>
    );
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "loading"}
        className="flex items-center gap-1.5 bg-milestone-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 active:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {state === "loading" ? (
          <>
            <Loader size={14} className="animate-spin" />
            Loading…
          </>
        ) : (
          "Load demo data"
        )}
      </button>
      {state === "error" && (
        <p className="text-xs text-milestone-red mt-1">{errorMsg}</p>
      )}
    </div>
  );
}
