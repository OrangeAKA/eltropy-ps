// lib/skills/e-sign-dispatch.ts
//
// Skill: E-Sign Dispatch
// Generates loan documents from the approved offer and dispatches an e-sign
// link to the member via their preferred channel.
//
// Production replacement: real DocuSign / OneSpan integration. Same outputs.

import type { Member } from "@/data/members";
import type { SkillExecutionResult, LoanOffer } from "@/lib/types";

export const SKILL_ID = "skill-e-sign-dispatch";
export const ADAPTER_NAME = "EltropyESignMock";

export type ESignInputs = {
  member: Member;
  offer: LoanOffer;
  channel: "sms" | "email";
};

export type ESignOutputs = {
  dispatched: boolean;
  envelopeId: string;
  sentTo: string;
  channel: string;
  expiresAt: string;
};

export async function executeESignDispatch(
  inputs: ESignInputs,
): Promise<SkillExecutionResult<ESignOutputs>> {
  const startedAt = new Date().toISOString();
  const start = performance.now();

  await wait(380 + Math.random() * 220);

  if (!inputs.offer.approved) {
    return {
      skillId: SKILL_ID,
      status: "blocked_by_guardrail",
      startedAt,
      inputs: { memberId: inputs.member.id },
      adapter: ADAPTER_NAME,
      error: "Cannot dispatch e-sign for a non-approved offer",
    };
  }

  const envelopeId = `env_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const sentTo = inputs.channel === "sms" ? inputs.member.phone : inputs.member.email;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const completedAt = new Date().toISOString();

  return {
    skillId: SKILL_ID,
    status: "completed",
    startedAt,
    completedAt,
    durationMs: Math.round(performance.now() - start),
    inputs: { memberId: inputs.member.id, amount: inputs.offer.amount },
    adapter: ADAPTER_NAME,
    outputs: {
      dispatched: true,
      envelopeId,
      sentTo,
      channel: inputs.channel,
      expiresAt,
    },
    rationale: `E-sign envelope ${envelopeId} dispatched to ${sentTo} via ${inputs.channel}; expires in 7 days`,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
