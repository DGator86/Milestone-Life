// Customizable terminology so the CRM can fit any company's vocabulary.
// Keys map to the singular/plural nouns used across the UI. Defaults below match
// the out-of-the-box product; a workspace can override any of them in Settings.

export const DEFAULT_TERMS = {
  customers: "Companies",
  customer: "Company",
  contacts: "Contacts",
  contact: "Contact",
  opportunities: "Opportunities",
  opportunity: "Opportunity",
  goals: "Goals",
  goal: "Goal",
  milestones: "Milestones",
  milestone: "Milestone",
  killList: "Kill List",
} as const;

export type TermKey = keyof typeof DEFAULT_TERMS;
export type Terms = Record<TermKey, string>;

// The subset a user can edit in Settings (each drives its singular partner too).
export const EDITABLE_TERMS: Array<{ key: TermKey; singularKey: TermKey; label: string; hint: string }> = [
  { key: "customers", singularKey: "customer", label: "Companies", hint: "Accounts, Clients, Organizations…" },
  { key: "contacts", singularKey: "contact", label: "Contacts", hint: "People, Leads, Members…" },
  { key: "opportunities", singularKey: "opportunity", label: "Opportunities", hint: "Deals, Projects, Pipeline…" },
  { key: "goals", singularKey: "goal", label: "Goals", hint: "Objectives, Initiatives…" },
];

/** Crude singularizer used to derive a singular term from a user-entered plural. */
export function singularize(word: string): string {
  const w = word.trim();
  if (/ies$/i.test(w)) return w.slice(0, -3) + "y";
  if (/(ses|xes|zes|ches|shes)$/i.test(w)) return w.slice(0, -2);
  if (/s$/i.test(w) && !/ss$/i.test(w)) return w.slice(0, -1);
  return w;
}
