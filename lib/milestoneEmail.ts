import type { GoalWithDetails } from "@/lib/types";

const EMAIL_ACTION = /\b(email|e-mail|mail|send\s+(a\s+)?(note|message)|reach\s+out|follow[- ]?up)\b/i;
const EMAIL_IN_TEXT = /[\w.+-]+@[\w.-]+\.\w+/;

export function isEmailMilestone(title: string): boolean {
  return EMAIL_ACTION.test(title);
}

export function extractEmailFromText(text: string): string | null {
  const match = text.match(EMAIL_IN_TEXT);
  return match?.[0] ?? null;
}

/** Resolve a mailto link for an email-style milestone or task, if possible. */
export function buildMailtoLink(
  subject: string,
  options?: {
    goal?: GoalWithDetails;
    body?: string;
  },
): string | null {
  const fromTitle = extractEmailFromText(subject);
  const customer = options?.goal?.crm_customers as { email?: string | null } | undefined;
  const fromGoal = customer?.email ?? options?.goal?.contacts?.email ?? null;
  const to = fromTitle ?? fromGoal;
  if (!to) return null;

  const params = new URLSearchParams();
  if (subject.trim()) params.set("subject", subject.trim());
  if (options?.body?.trim()) params.set("body", options.body.trim());
  const qs = params.toString();
  return `mailto:${to}${qs ? `?${qs}` : ""}`;
}
