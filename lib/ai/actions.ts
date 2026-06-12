export interface AgentAction {
  label: string;
  href?: string;
}

/** Map a mutating tool result to an in-app deep link when possible. */
export function hrefForMutation(toolName: string, data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;

  switch (toolName) {
    case "create_task":
      return typeof d.task_id === "string" ? `/tasks/${d.task_id}` : undefined;
    case "create_goal":
    case "add_milestones":
    case "complete_next_milestone":
    case "update_goal_status":
    case "link_goal_to_crm":
    case "update_goal":
    case "update_milestone":
      return typeof d.goal_id === "string" ? `/goals/${d.goal_id}` : undefined;
    case "create_customer":
      return typeof d.customer_id === "string" ? `/customers/${d.customer_id}` : undefined;
    case "create_contact":
      return typeof d.contact_id === "string" ? `/contacts/${d.contact_id}` : undefined;
    case "create_opportunity":
      return typeof d.opportunity_id === "string" ? "/opportunities" : undefined;
    default:
      return undefined;
  }
}

export function actionFromToolResult(
  toolName: string,
  summary: string,
  data: unknown
): AgentAction {
  const href = hrefForMutation(toolName, data);
  return href ? { label: summary, href } : { label: summary };
}
