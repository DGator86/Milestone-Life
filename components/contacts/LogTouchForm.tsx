"use client";

import { useState } from "react";
import { Phone, Mail, Users, FileText, Plus } from "lucide-react";
import { logTouch } from "@/app/contacts/touch-actions";
import type { TouchType } from "@/lib/types";

const TOUCH_TYPES: { type: TouchType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { type: "call", label: "Call", icon: Phone },
  { type: "email", label: "Email", icon: Mail },
  { type: "meeting", label: "Meeting", icon: Users },
  { type: "note", label: "Note", icon: FileText },
];

export default function LogTouchForm({ contactId }: { contactId: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TouchType>("call");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-milestone-blue text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-200"
      >
        <Plus size={15} />
        Log Touch
      </button>
    );
  }

  return (
    <div className="ms-card p-4 animate-fade-up">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Log a touch</p>
      <form
        action={async (fd) => {
          fd.set("contact_id", contactId);
          fd.set("type", selected);
          const result = await logTouch(fd);
          if (!result?.error) setOpen(false);
        }}
        className="space-y-3"
      >
        <input type="hidden" name="contact_id" value={contactId} />
        <input type="hidden" name="type" value={selected} />

        {/* Type selector */}
        <div className="flex gap-2">
          {TOUCH_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelected(type)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                selected === type
                  ? "border-milestone-blue bg-milestone-blue-dim text-milestone-blue"
                  : "border-milestone-line text-gray-400 hover:border-gray-300 bg-white"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <textarea
          name="notes"
          rows={2}
          placeholder="Add notes (optional)"
          className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue resize-none transition-all"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-milestone-blue text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            Save Touch
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 bg-gray-100 text-gray-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
