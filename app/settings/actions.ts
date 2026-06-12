"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { contacts, goals, groups, milestones, user_settings } from "@/db/schema";
import { EDITABLE_TERMS, singularize } from "@/lib/terms";
import { sanitizeCustomFieldDefs } from "@/lib/customFields";

function parseCustomFieldDefs(raw: string | null) {
  if (!raw) return undefined;
  try {
    return sanitizeCustomFieldDefs(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

const HEX = /^#[0-9a-fA-F]{6}$/;

// Parse the JSON array of customer types submitted by the Settings form,
// trimming, de-duplicating (case-insensitively) and capping length/count.
function parseCustomerTypes(raw: string | null): string[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of parsed) {
    const value = String(item).trim().slice(0, 40);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= 30) break;
  }
  return out;
}

export async function updateWorkspaceSettings(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const userId = await getDataOwnerId();

  const companyName = ((formData.get("company_name") as string) ?? "").trim().slice(0, 80) || null;
  const brandRaw = ((formData.get("brand_color") as string) ?? "").trim();
  const brandColor = HEX.test(brandRaw) ? brandRaw : "#1769FF";

  const terminology: Record<string, string> = {};
  for (const t of EDITABLE_TERMS) {
    const value = ((formData.get(`term_${t.key}`) as string) ?? "").trim().slice(0, 40);
    if (value) {
      terminology[t.key] = value;
      terminology[t.singularKey] = singularize(value);
    }
  }

  const preferences: Record<string, boolean> = {
    email_notifications: formData.get("pref_email_notifications") === "on",
    weekly_digest: formData.get("pref_weekly_digest") === "on",
  };

  const customerTypes = parseCustomerTypes(formData.get("customer_types") as string | null);
  const customFields = parseCustomFieldDefs(formData.get("custom_fields") as string | null);

  // Only overwrite custom_fields when the form submitted a valid payload.
  const customFieldsPatch = customFields ? { custom_fields: customFields } : {};

  try {
    await db
      .insert(user_settings)
      .values({ user_id: userId, company_name: companyName, brand_color: brandColor, terminology, preferences, customer_types: customerTypes, ...customFieldsPatch })
      .onConflictDoUpdate({
        target: user_settings.user_id,
        set: { company_name: companyName, brand_color: brandColor, terminology, preferences, customer_types: customerTypes, ...customFieldsPatch, updated_at: new Date().toISOString() },
      });
  } catch {
    return { error: "Could not save — the settings table may not be migrated yet (run npm run db:push)." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function seedDemoData() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();

  const [workGroup, personalGroup] = await db
    .insert(groups)
    .values([
      { user_id: userId, name: "Work", color: "#1769FF", sort_order: 1 },
      { user_id: userId, name: "Personal", color: "#36A852", sort_order: 2 },
    ])
    .returning();

  if (!workGroup || !personalGroup) return { error: "Failed to create groups" };

  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();
  const lastMonth = new Date(Date.now() - 32 * 86400000).toISOString();

  await db.insert(contacts).values([
    {
      user_id: userId,
      name: "Sarah Chen",
      email: "sarah@example.com",
      company: "Acme Corp",
      role: "VP of Engineering",
      touch_frequency_days: 14,
      last_touched_at: lastWeek,
      status: "active",
    },
    {
      user_id: userId,
      name: "Mike Rodriguez",
      email: "mike@example.com",
      company: "Bright Systems",
      role: "Founder",
      touch_frequency_days: 7,
      last_touched_at: lastMonth,
      status: "active",
      notes: "Intro'd through LinkedIn. Interested in Q3 pilot.",
    },
    {
      user_id: userId,
      name: "Jennifer Kim",
      email: "jen@example.com",
      company: "NovaTech",
      role: "Head of Sales",
      touch_frequency_days: 30,
      last_touched_at: null,
      status: "active",
    },
  ]);

  const [demoGoal, pilotGoal, runGoal] = await db
    .insert(goals)
    .values([
      {
        user_id: userId,
        group_id: workGroup.id,
        title: "Launch Q3 product demo",
        goal_type: "deadline",
        importance: "critical",
        status: "active",
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      },
      {
        user_id: userId,
        group_id: workGroup.id,
        title: "Close enterprise pilot with Acme",
        goal_type: "concrete",
        importance: "important",
        status: "active",
        due_date: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0],
      },
      {
        user_id: userId,
        group_id: personalGroup.id,
        title: "Run a 5K",
        goal_type: "concrete",
        importance: "normal",
        status: "active",
        due_date: null,
      },
    ])
    .returning();

  if (!demoGoal || !pilotGoal || !runGoal) return { error: "Failed to create goals" };

  await db.insert(milestones).values([
    { goal_id: demoGoal.id, title: "Draft demo script", position: 0, status: "completed" },
    { goal_id: demoGoal.id, title: "Build slide deck", position: 1, status: "completed" },
    { goal_id: demoGoal.id, title: "Record walkthrough video", position: 2, status: "stuck" },
    { goal_id: demoGoal.id, title: "Share with 3 customers", position: 3, status: "upcoming" },
    { goal_id: pilotGoal.id, title: "Initial discovery call", position: 0, status: "completed" },
    { goal_id: pilotGoal.id, title: "Send proposal", position: 1, status: "in_progress" },
    { goal_id: pilotGoal.id, title: "Negotiate terms", position: 2, status: "upcoming" },
    { goal_id: pilotGoal.id, title: "Sign contract", position: 3, status: "upcoming" },
    { goal_id: runGoal.id, title: "Start Couch-to-5K plan", position: 0, status: "upcoming" },
    { goal_id: runGoal.id, title: "Run 2K without stopping", position: 1, status: "upcoming" },
    { goal_id: runGoal.id, title: "Complete week 6 workout", position: 2, status: "upcoming" },
    { goal_id: runGoal.id, title: "Race day", position: 3, status: "upcoming" },
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/follow-ups");
  revalidatePath("/goals");
  revalidatePath("/pipeline");

  return { success: true };
}
