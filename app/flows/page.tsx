import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_flows, crm_opportunities, crm_flow_instances, crm_customers } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import FlowsView from "@/components/crm/FlowsView";
import { getIsAdmin } from "@/lib/admin";
import type { CrmFlow, CrmFlowInstance, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FlowsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };
  // Admin gate uses the real session user (not the workspace owner, who is always admin).
  if (!(await getIsAdmin(user.id))) redirect("/dashboard");

  const [flowsRaw, oppCounts, instancesRaw, customersRaw] = await Promise.all([
    db.query.crm_flows.findMany({
      where: eq(crm_flows.user_id, userId),
      orderBy: [desc(crm_flows.created_at)],
    }),
    db.select({ flow_id: crm_opportunities.flow_id })
      .from(crm_opportunities)
      .where(eq(crm_opportunities.user_id, userId)),
    db.query.crm_flow_instances.findMany({
      where: eq(crm_flow_instances.user_id, userId),
      with: { crm_flows: true, crm_customers: true },
      orderBy: [desc(crm_flow_instances.created_at)],
    }),
    db.select({ id: crm_customers.id, name: crm_customers.name })
      .from(crm_customers)
      .where(eq(crm_customers.user_id, userId))
      .orderBy(asc(crm_customers.name)),
  ]);

  const flows: CrmFlow[] = flowsRaw as CrmFlow[];
  const countByFlow: Record<string, number> = {};
  for (const opp of oppCounts) {
    if (opp.flow_id) countByFlow[opp.flow_id] = (countByFlow[opp.flow_id] ?? 0) + 1;
  }

  return (
    <AppShell user={user}>
      <FlowsView
        flows={flows}
        oppCountByFlow={countByFlow}
        instances={instancesRaw as CrmFlowInstance[]}
        customers={customersRaw}
      />
    </AppShell>
  );
}
