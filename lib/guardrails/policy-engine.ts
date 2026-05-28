// lib/guardrails/policy-engine.ts
//
// Guardrail policy evaluator. Each workflow step declares guardrails as data;
// this engine evaluates them against the runtime context and returns a
// decision: auto-execute, require human approval, or block outright.
//
// Production replaces the evaluator logic with a real rules engine + LLM
// policy classifier, but the interface stays.

import type { LoanOffer, WorkflowContext } from "@/lib/types";
import type { WorkflowStep } from "@/data/workflows";

export type GuardrailDecision =
  | { result: "auto_execute"; rationale: string }
  | { result: "require_human"; rationale: string }
  | { result: "block"; rationale: string };

export function evaluateGuardrails(
  step: WorkflowStep,
  context: WorkflowContext,
): GuardrailDecision {
  if (step.humanInTheLoop) {
    return {
      result: "require_human",
      rationale: `Step ${step.skillId} configured with humanInTheLoop=true`,
    };
  }

  // Loan-amount threshold: offers > $50K require human approval before send
  if (step.skillId === "skill-e-sign-dispatch" && context.loanOffer) {
    const offer: LoanOffer = context.loanOffer;
    if (offer.amount > 50000) {
      return {
        result: "require_human",
        rationale: `Offer amount $${offer.amount.toLocaleString()} exceeds $50,000 threshold; requires human approval`,
      };
    }
    if (!offer.approved) {
      return {
        result: "block",
        rationale: "Offer not approved; e-sign dispatch blocked",
      };
    }
  }

  if (step.guardrails.autoExecute) {
    return {
      result: "auto_execute",
      rationale: step.guardrails.condition
        ? `Guardrail satisfied: ${step.guardrails.condition}`
        : "Auto-execute permitted (no conditions)",
    };
  }

  return {
    result: "require_human",
    rationale: "autoExecute=false; defaulting to human review",
  };
}
