"use client";

import { useState } from "react";
import { Plus, User, ChevronDown } from "lucide-react";
import { createLegacyContact as createContact } from "@/app/contacts/touch-actions";
import type { Group } from "@/lib/types";

const CADENCE_OPTIONS = [
  { value: "", label: "No cadence" },
  { value: "7", label: "Weekly" },
  { value: "14", label: "Every 2 weeks" },
  { value: "30", label: "Monthly" },
  { value: "60", label: "Every 2 months" },
  { value: "90", label: "Quarterly" },
];

export default function AddContactForm({ lists }: { lists: Group[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 bg-white border-2 border-dashed border-milestone-line rounded-xl px-6 py-4 text-sm text-gray-400 hover:border-milestone-blue hover:text-milestone-blue hover:bg-milestone-blue-dim transition-all w-full group"
      >
        <div className="w-7 h-7 rounded-lg border-2 border-dashed border-current flex items-center justify-center group-hover:bg-milestone-blue group-hover:border-milestone-blue group-hover:text-white transition-all">
          <Plus size={15} />
        </div>
        <span className="font-medium">Add new contact</span>
      </button>
    );
  }

  return (
    <div className="ms-card animate-fade-up">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-milestone-line bg-gray-50/60">
        <div className="w-8 h-8 rounded-lg bg-milestone-blue-dim flex items-center justify-center">
          <User size={16} className="text-milestone-blue" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">New Contact</h3>
          <p className="text-xs text-gray-400">Add someone to your CRM</p>
        </div>
      </div>

      <form action={createContact} className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Name <span className="text-milestone-red">*</span>
            </label>
            <input
              name="name"
              required
              autoFocus
              className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Company
            </label>
            <input
              name="company"
              className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
              placeholder="Company name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              name="email"
              type="email"
              className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Phone
            </label>
            <input
              name="phone"
              type="tel"
              className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              List
            </label>
            <div className="relative">
              <select
                name="list_id"
                className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue bg-white appearance-none cursor-pointer transition-all"
              >
                <option value="">No list</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Touch Cadence
            </label>
            <div className="relative">
              <select
                name="touch_frequency_days"
                className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue bg-white appearance-none cursor-pointer transition-all"
              >
                {CADENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Get flagged when overdue</p>
          </div>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            type="submit"
            className="bg-milestone-blue text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
          >
            Add Contact
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
