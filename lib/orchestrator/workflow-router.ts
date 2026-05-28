// lib/orchestrator/workflow-router.ts
//
// Maps an intent to a workflow ID. Production reads from a configurable
// routing table (per-CU overrides allowed); mock reads from data/workflows.ts
// triggerIntents arrays.

import { workflows, type Workflow } from "@/data/workflows";
import type { IntentName } from "@/lib/types";

export const ROUTER_NAME = "workflow-router";

export type RouteResult =
  | { matched: true; workflow: Workflow }
  | { matched: false; intent: IntentName; reason: string };

export function routeWorkflow(intent: IntentName): RouteResult {
  const workflow = workflows.find((w) =>
    w.triggerIntents.includes(intent),
  );
  if (!workflow) {
    return {
      matched: false,
      intent,
      reason: `No workflow registered for intent "${intent}"`,
    };
  }
  return { matched: true, workflow };
}
