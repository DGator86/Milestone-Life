import { db } from "@/db";
import { crm_contacts, crm_customers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export type DuplicateEntity = "customer" | "contact";

export interface DuplicateRecord {
  id: string;
  label: string;
  subtitle?: string;
  email?: string | null;
  updated_at?: string;
}

export interface DuplicateGroup {
  key: string;
  reason: string;
  entity: DuplicateEntity;
  records: DuplicateRecord[];
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function findDuplicateGroups(userId: string): Promise<DuplicateGroup[]> {
  const [customers, contacts] = await Promise.all([
    db.query.crm_customers.findMany({
      where: eq(crm_customers.user_id, userId),
      orderBy: [asc(crm_customers.name)],
    }),
    db.query.crm_contacts.findMany({
      where: eq(crm_contacts.user_id, userId),
      with: { crm_customers: true },
      orderBy: [asc(crm_contacts.last_name), asc(crm_contacts.first_name)],
    }),
  ]);

  const groups: DuplicateGroup[] = [];

  const byCompanyName = new Map<string, DuplicateRecord[]>();
  for (const c of customers) {
    const key = normalizeName(c.name);
    const list = byCompanyName.get(key) ?? [];
    list.push({
      id: c.id,
      label: c.name,
      subtitle: c.industry ?? c.status,
      email: c.email,
      updated_at: c.updated_at ?? undefined,
    });
    byCompanyName.set(key, list);
  }
  for (const [key, records] of byCompanyName) {
    if (records.length < 2) continue;
    groups.push({
      key: `company:${key}`,
      reason: "Same company name",
      entity: "customer",
      records,
    });
  }

  const byContactEmail = new Map<string, DuplicateRecord[]>();
  for (const c of contacts) {
    if (!c.email?.trim()) continue;
    const key = normalizeEmail(c.email);
    const list = byContactEmail.get(key) ?? [];
    list.push({
      id: c.id,
      label: `${c.first_name} ${c.last_name}`.trim(),
      subtitle: c.crm_customers?.name ?? c.title ?? undefined,
      email: c.email,
      updated_at: c.updated_at ?? undefined,
    });
    byContactEmail.set(key, list);
  }
  for (const [key, records] of byContactEmail) {
    if (records.length < 2) continue;
    groups.push({
      key: `email:${key}`,
      reason: "Same email address",
      entity: "contact",
      records,
    });
  }

  const byContactName = new Map<string, DuplicateRecord[]>();
  for (const c of contacts) {
    const key = normalizeName(`${c.first_name} ${c.last_name}`);
    if (!key || key.length < 3) continue;
    const list = byContactName.get(key) ?? [];
    list.push({
      id: c.id,
      label: `${c.first_name} ${c.last_name}`.trim(),
      subtitle: c.crm_customers?.name ?? c.email ?? undefined,
      email: c.email,
      updated_at: c.updated_at ?? undefined,
    });
    byContactName.set(key, list);
  }
  for (const [key, records] of byContactName) {
    if (records.length < 2) continue;
    if (groups.some((g) => g.entity === "contact" && g.key === `name:${key}`)) continue;
    groups.push({
      key: `name:${key}`,
      reason: "Same contact name",
      entity: "contact",
      records,
    });
  }

  return groups.sort((a, b) => b.records.length - a.records.length);
}
