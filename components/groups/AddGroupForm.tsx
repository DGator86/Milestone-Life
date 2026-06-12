"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createGroup } from "@/app/groups/actions";

export default function AddGroupForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border-2 border-dashed border-milestone-line p-5 flex items-center gap-4 text-gray-300 hover:border-milestone-blue hover:text-milestone-blue transition-colors cursor-pointer group w-full"
      >
        <div className="w-12 h-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center shrink-0 group-hover:bg-milestone-blue-dim transition-colors">
          <Plus size={20} />
        </div>
        <p className="font-semibold text-sm">Add group</p>
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        startTransition(async () => {
          await createGroup(null, fd);
          setOpen(false);
        });
      }}
      className="rounded-xl border-2 border-milestone-blue bg-milestone-blue-dim p-5"
    >
      <p className="text-xs font-bold text-milestone-blue uppercase tracking-wide mb-3">
        New Group
      </p>
      <input
        name="name"
        required
        autoFocus
        maxLength={32}
        placeholder="Group name…"
        className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-milestone-blue mb-3 placeholder:text-gray-300"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 text-sm font-semibold bg-milestone-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm font-semibold bg-white text-gray-600 rounded-lg hover:bg-gray-50 border border-milestone-line transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
