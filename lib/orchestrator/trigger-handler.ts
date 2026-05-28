// lib/orchestrator/trigger-handler.ts
//
// Top-level orchestrator entry point. Takes an inbound trigger event,
// resolves the member, classifies the intent, routes to a workflow, and
// hands off to the workflow runner.

import type {
  TriggerEvent,
  AuditLogEntry,
  IntentClassification,
  WorkflowContext,
} from "@/lib/types";
import type { Member } from "@/data/members";
import type { Workflow } from "@/data/workflows";

import { resolveMemberByPhone } from "@/lib/orchestrator/member-resolver";
import { classifyIntent } from "@/lib/orchestrator/intent-classifier";
import { routeWorkflow } from "@/lib/orchestrator/workflow-router";
import { runWorkflow, type RunnerCallbacks } from "@/lib/orchestrator/workflow-runner";

export type TriggerHandlerCallbacks = RunnerCallbacks & {
  onMemberResolved: (member: Member, log: AuditLogEntry) => void;
  onIntentClassified: (intent: IntentClassification, log: AuditLogEntry) => void;
  onWorkflowRouted: (workflow: Workflow, log: AuditLogEntry) => void;
  onTriggerReceived: (trigger: TriggerEvent, log: AuditLogEntry) => void;
  onUnresolved: (reason: string, log: AuditLogEntry) => void;
  onVoiceTranscribed?: (transcript: string, log: AuditLogEntry) => void;
};

export async function handleTrigger(
  trigger: TriggerEvent,
  callbacks: TriggerHandlerCallbacks,
  startedAt: number,
): Promise<WorkflowContext | null> {
  // ── 1. Trigger received
  callbacks.onTriggerReceived(
    trigger,
    makeLog(
      startedAt,
      "INFO",
      "trigger.receive",
      `trigger.receive() — channel=${trigger.channel}, from=${trigger.fromPhone}, body_len=${trigger.body.length}, ingest_id=${trigger.ingestId}`,
      { channel: trigger.channel, fromPhone: trigger.fromPhone },
    ),
  );

  // ── 2. (Voice path only) emit transcription log
  if (trigger.channel === "voice" && callbacks.onVoiceTranscribed) {
    await wait(420);
    callbacks.onVoiceTranscribed(
      trigger.body,
      makeLog(
        startedAt,
        "INFO",
        "voice.transcribe",
        `voice.transcribe(provider=BrowserWebSpeech, lang=en-US) → transcript: "${truncate(trigger.body, 80)}"`,
      ),
    );
  }

  // ── 3. Member resolution
  const resolution = await resolveMemberByPhone(trigger.fromPhone);
  if (!resolution.resolved) {
    callbacks.onUnresolved(
      resolution.reason,
      makeLog(startedAt, "WARN", "member.resolve", `member.resolve() — ${resolution.reason}`),
    );
    callbacks.onComplete();
    return null;
  }
  callbacks.onMemberResolved(
    resolution.member,
    makeLog(
      startedAt,
      "INFO",
      "member.resolve",
      `member.resolve(phone=${trigger.fromPhone}) → member_id=${resolution.member.id}, name="${resolution.member.fullName}", tier=${resolution.member.memberTier}, lookup_ms=${resolution.lookupMs}`,
      { adapter: resolution.adapter, memberId: resolution.member.id },
    ),
  );

  // ── 4. Intent classification
  const intent = await classifyIntent(trigger.body);
  callbacks.onIntentClassified(
    intent,
    makeLog(
      startedAt,
      "INFO",
      "intent.classify",
      `intent.classify() — intent=${intent.intent}, confidence=${intent.confidence.toFixed(2)}, entities=${JSON.stringify(intent.entities)}, classifier=${intent.classifier}`,
      { intent: intent.intent, entities: intent.entities },
    ),
  );

  // ── 5. Workflow routing
  const routed = routeWorkflow(intent.intent);
  if (!routed.matched) {
    callbacks.onUnresolved(
      routed.reason,
      makeLog(startedAt, "WARN", "workflow.route", `workflow.route() — ${routed.reason}`),
    );
    callbacks.onComplete();
    return null;
  }
  callbacks.onWorkflowRouted(
    routed.workflow,
    makeLog(
      startedAt,
      "INFO",
      "workflow.route",
      `workflow.route(intent=${intent.intent}) → workflow="${routed.workflow.name}" (${routed.workflow.id})`,
    ),
  );

  // ── 6. Workflow execution
  return runWorkflow(
    {
      workflow: routed.workflow,
      trigger,
      member: resolution.member,
      intent,
      startedAt,
    },
    callbacks,
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function makeLog(
  startedAt: number,
  level: AuditLogEntry["level"],
  component: string,
  message: string,
  payload?: Record<string, unknown>,
): AuditLogEntry {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    elapsedMs: Math.round(performance.now() - startedAt),
    level,
    component,
    message,
    payload,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
