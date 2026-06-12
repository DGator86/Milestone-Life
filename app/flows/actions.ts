"use server";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_flows, crm_flow_instances, crm_customers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createFlow(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const stagesRaw = (formData.get("stages") as string) ?? "";
  const stages = stagesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await db.insert(crm_flows).values({
    user_id: userId,
    name,
    description: (formData.get("description") as string) || null,
    color: (formData.get("color") as string) || "#1769FF",
    stages: stages.length > 0 ? stages : ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"],
  });

  revalidatePath("/flows");
}

export async function updateFlow(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const stagesRaw = (formData.get("stages") as string) ?? "";
  const stages = stagesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await db.update(crm_flows)
    .set({
      name,
      description: (formData.get("description") as string) || null,
      color: (formData.get("color") as string) || "#1769FF",
      stages: stages.length > 0 ? stages : ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"],
    })
    .where(and(eq(crm_flows.id, id), eq(crm_flows.user_id, userId)));

  revalidatePath("/flows");
}

export async function deleteFlow(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  await db.delete(crm_flows)
    .where(and(eq(crm_flows.id, id), eq(crm_flows.user_id, userId)));

  revalidatePath("/flows");
}

export async function createFlowInstance(flowId: string, customerId: string | null) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  // Verify the flow (and customer, if supplied) belong to this workspace before
  // binding an instance to them — otherwise a guessed UUID could leak metadata.
  const flow = await db.query.crm_flows.findFirst({
    where: and(eq(crm_flows.id, flowId), eq(crm_flows.user_id, userId)),
    columns: { id: true },
  });
  if (!flow) return;

  if (customerId) {
    const customer = await db.query.crm_customers.findFirst({
      where: and(eq(crm_customers.id, customerId), eq(crm_customers.user_id, userId)),
      columns: { id: true },
    });
    if (!customer) return;
  }

  await db.insert(crm_flow_instances).values({
    user_id: userId,
    flow_id: flowId,
    customer_id: customerId ?? null,
    current_stage_idx: 0,
    run_count: 1,
    status: "active",
  });
  revalidatePath("/flows");
}

export async function advanceFlowInstance(instanceId: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const instance = await db.query.crm_flow_instances.findFirst({
    where: and(eq(crm_flow_instances.id, instanceId), eq(crm_flow_instances.user_id, userId)),
    with: { crm_flows: true },
  });
  if (!instance || !instance.crm_flows) return;

  const stageCount = instance.crm_flows.stages.length;

  // Advance atomically in-DB (CASE on the live columns) so concurrent advances
  // can't lose a stage step or a cycle increment.
  await db
    .update(crm_flow_instances)
    .set({
      current_stage_idx: sql`CASE WHEN ${crm_flow_instances.current_stage_idx} + 1 >= ${stageCount} THEN 0 ELSE ${crm_flow_instances.current_stage_idx} + 1 END`,
      run_count: sql`${crm_flow_instances.run_count} + CASE WHEN ${crm_flow_instances.current_stage_idx} + 1 >= ${stageCount} THEN 1 ELSE 0 END`,
      updated_at: new Date().toISOString(),
    })
    .where(and(eq(crm_flow_instances.id, instanceId), eq(crm_flow_instances.user_id, userId)));

  revalidatePath("/flows");
}

export async function deleteFlowInstance(instanceId: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();
  await db
    .delete(crm_flow_instances)
    .where(and(eq(crm_flow_instances.id, instanceId), eq(crm_flow_instances.user_id, userId)));
  revalidatePath("/flows");
}
