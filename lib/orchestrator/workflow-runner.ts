// lib/orchestrator/workflow-runner.ts
//
// Walks a workflow's step graph, executes each skill, evaluates guardrails,
// and emits a stream of audit-log events + state updates via callbacks.
//
// The runner is intentionally pure — it does not own state. State lives in
// the reducer (lib/demo-state.ts), which the runner notifies via the
// dispatcher. This separation lets production swap the runner for a real
// queue-driven executor without touching React.

import type {
  WorkflowContext,
  IntentClassification,
  SkillExecutionResult,
  TriggerEvent,
  AuditLogEntry,
  LoanOffer,
} from "@/lib/types";
import type { Workflow } from "@/data/workflows";
import type { Member } from "@/data/members";

import { evaluateGuardrails } from "@/lib/guardrails/policy-engine";
import { executeMemberLookup } from "@/lib/skills/member-lookup";
import { executeIdentityVerification } from "@/lib/skills/identity-verification";
import { executeSoftCreditPull } from "@/lib/skills/soft-credit-pull";
import { executeLoanDecisioning } from "@/lib/skills/loan-decisioning";
import { executeESignDispatch } from "@/lib/skills/e-sign-dispatch";

// ────────────────────────────────────────────────────────────────────────────
// Public types
// ────────────────────────────────────────────────────────────────────────────

export type RunnerCallbacks = {
  onLog: (log: AuditLogEntry) => void;
  onSkillStart: (skillId: string) => void;
  onSkillComplete: (result: SkillExecutionResult) => void;
  /** Resolves when the user confirms; throws if user cancels. */
  awaitConfirm: (payload: {
    skillId: string;
    title: string;
    summary: string;
    offer: LoanOffer;
  }) => Promise<void>;
  onComplete: () => void;
};

export type RunnerInputs = {
  workflow: Workflow;
  trigger: TriggerEvent;
  member: Member;
  intent: IntentClassification;
  startedAt: number;
};

// ────────────────────────────────────────────────────────────────────────────
// Audit log helpers
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

// ────────────────────────────────────────────────────────────────────────────
// Runner entry point
// ────────────────────────────────────────────────────────────────────────────

export async function runWorkflow(
  inputs: RunnerInputs,
  callbacks: RunnerCallbacks,
): Promise<WorkflowContext> {
  const { workflow, trigger, member, intent, startedAt } = inputs;
  const context: WorkflowContext = {
    trigger,
    member,
    intent,
    skillResults: {},
  };

  callbacks.onLog(
    makeLog(
      startedAt,
      "INFO",
      "workflow.start",
      `workflow.start(id=${workflow.id}, name=${workflow.name}) — member=${member.id}, intent=${intent.intent}`,
      { workflowId: workflow.id, memberId: member.id },
    ),
  );

  for (const step of workflow.steps) {
    const guardrail = evaluateGuardrails(step, context);

    callbacks.onLog(
      makeLog(
        startedAt,
        guardrail.result === "block" ? "WARN" : "DEBUG",
        "guardrail.evaluate",
        `guardrail.evaluate(skill=${step.skillId}) → ${guardrail.result}; ${guardrail.rationale}`,
      ),
    );

    if (guardrail.result === "block") {
      callbacks.onLog(
        makeLog(
          startedAt,
          "ERROR",
          "workflow.halt",
          `workflow.halt() — guardrail blocked at skill=${step.skillId}`,
        ),
      );
      callbacks.onComplete();
      return context;
    }

    callbacks.onSkillStart(step.skillId);
    callbacks.onLog(
      makeLog(
        startedAt,
        "INFO",
        "skill.execute",
        `skill.execute(name=${step.skillId}) — starting`,
      ),
    );

    let result: SkillExecutionResult;

    try {
      result = await dispatchSkill(step.skillId, context);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result = {
        skillId: step.skillId,
        status: "failed",
        startedAt: new Date().toISOString(),
        inputs: {},
        error: msg,
      };
    }

    context.skillResults[step.skillId] = result;
    callbacks.onSkillComplete(result);

    // Capture loan offer for downstream guardrails + UI
    if (step.skillId === "skill-loan-decisioning" && result.outputs) {
      const decisioningOutputs = result.outputs as { offer: LoanOffer };
      context.loanOffer = decisioningOutputs.offer;
    }

    callbacks.onLog(
      makeLog(
        startedAt,
        result.status === "completed" ? "INFO" : "ERROR",
        "skill.complete",
        `skill.complete(name=${step.skillId}) — status=${result.status}, ${result.durationMs ?? 0}ms; ${result.rationale ?? result.error ?? ""}`,
        result.outputs as Record<string, unknown> | undefined,
      ),
    );

    if (result.status !== "completed") {
      callbacks.onLog(
        makeLog(
          startedAt,
          "ERROR",
          "workflow.halt",
          `workflow.halt() — skill ${step.skillId} did not complete cleanly`,
        ),
      );
      callbacks.onComplete();
      return context;
    }

    // After loan decisioning, check whether the workflow needs a human pause
    // before e-sign dispatch.
    if (step.skillId === "skill-loan-decisioning" && context.loanOffer?.approved) {
      const offer = context.loanOffer;
      callbacks.onLog(
        makeLog(
          startedAt,
          "INFO",
          "workflow.pause",
          `workflow.pause(reason=awaiting_human_confirm) — offer ready for officer review`,
        ),
      );

      try {
        await callbacks.awaitConfirm({
          skillId: "skill-e-sign-dispatch",
          title: "Send pre-qualified offer to member?",
          summary: `$${offer.amount.toLocaleString()} / ${offer.termMonths} mo / ${offer.apr.toFixed(2)}% APR / $${offer.monthlyPayment.toFixed(2)}/mo`,
          offer,
        });
      } catch {
        callbacks.onLog(
          makeLog(
            startedAt,
            "WARN",
            "workflow.abort",
            `workflow.abort() — officer modified or cancelled offer`,
          ),
        );
        callbacks.onComplete();
        return context;
      }

      callbacks.onLog(
        makeLog(
          startedAt,
          "INFO",
          "workflow.resume",
          `workflow.resume() — officer confirmed offer dispatch`,
        ),
      );
    }
  }

  callbacks.onLog(
    makeLog(
      startedAt,
      "INFO",
      "workflow.complete",
      `workflow.complete(id=${workflow.id}) — all ${workflow.steps.length} steps executed`,
    ),
  );
  callbacks.onComplete();
  return context;
}

// ────────────────────────────────────────────────────────────────────────────
// Skill dispatcher: matches skill ID to executor + inputs derived from context
// ────────────────────────────────────────────────────────────────────────────

async function dispatchSkill(
  skillId: string,
  context: WorkflowContext,
): Promise<SkillExecutionResult> {
  if (!context.member || !context.trigger) {
    return {
      skillId,
      status: "failed",
      startedAt: new Date().toISOString(),
      inputs: {},
      error: "Missing member or trigger in context",
    };
  }

  switch (skillId) {
    case "skill-member-lookup":
      return executeMemberLookup({ phone: context.trigger.fromPhone });

    case "skill-identity-verify":
      return executeIdentityVerification({
        member: context.member,
        channel: context.trigger.channel,
      });

    case "skill-soft-credit-pull":
      return executeSoftCreditPull({
        member: context.member,
        memberConsentConfirmed: true,
      });

    case "skill-loan-decisioning": {
      const creditResult = context.skillResults["skill-soft-credit-pull"];
      const fico =
        (creditResult?.outputs as { fico?: number } | undefined)?.fico ??
        context.member.fico;
      const amount = (context.intent?.entities.amount as number | undefined) ?? 25000;
      const productType =
        (context.intent?.entities.product as
          | "auto_loan"
          | "mortgage"
          | "heloc"
          | undefined) ?? "auto_loan";
      return executeLoanDecisioning({
        member: context.member,
        ficoFromBureau: fico,
        amount,
        termMonths: 60,
        productType,
      });
    }

    case "skill-e-sign-dispatch":
      if (!context.loanOffer) {
        return {
          skillId,
          status: "failed",
          startedAt: new Date().toISOString(),
          inputs: {},
          error: "No loan offer in context; cannot dispatch e-sign",
        };
      }
      return executeESignDispatch({
        member: context.member,
        offer: context.loanOffer,
        channel: "sms",
      });

    default:
      return {
        skillId,
        status: "failed",
        startedAt: new Date().toISOString(),
        inputs: {},
        error: `Unknown skill: ${skillId}`,
      };
  }
}
