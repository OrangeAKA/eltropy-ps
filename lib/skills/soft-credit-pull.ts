// lib/skills/soft-credit-pull.ts
//
// Skill: Soft Credit Pull
// Pulls a soft credit inquiry via MeridianLink. Requires member consent
// confirmed upstream (guardrail check).
//
// Production replacement: real MeridianLink Consumer API call. Same outputs.

import { runSoftCreditPull, MERIDIANLINK_ADAPTER_NAME } from "@/lib/adapters/meridianlink-mock";
import type { Member } from "@/data/members";
import type { SkillExecutionResult } from "@/lib/types";

export const SKILL_ID = "skill-soft-credit-pull";

export type SoftCreditInputs = {
  member: Member;
  memberConsentConfirmed: boolean;
};

export type SoftCreditOutputs = {
  fico: number;
  utilization: number;
  openTradelines: number;
  recentInquiries: number;
  bureau: string;
  pulledAt: string;
};

export async function executeSoftCreditPull(
  inputs: SoftCreditInputs,
): Promise<SkillExecutionResult<SoftCreditOutputs>> {
  const startedAt = new Date().toISOString();
  const start = performance.now();

  if (!inputs.memberConsentConfirmed) {
    return {
      skillId: SKILL_ID,
      status: "blocked_by_guardrail",
      startedAt,
      inputs: { memberId: inputs.member.id },
      adapter: MERIDIANLINK_ADAPTER_NAME,
      error: "Member consent not confirmed; soft credit pull blocked per FCRA",
    };
  }

  const result = await runSoftCreditPull(inputs.member);
  const completedAt = new Date().toISOString();

  return {
    skillId: SKILL_ID,
    status: "completed",
    startedAt,
    completedAt,
    durationMs: Math.round(performance.now() - start),
    inputs: { memberId: inputs.member.id },
    adapter: MERIDIANLINK_ADAPTER_NAME,
    outputs: {
      fico: result.fico,
      utilization: result.utilization,
      openTradelines: result.openTradelines,
      recentInquiries: result.recentInquiries,
      bureau: result.bureau,
      pulledAt: result.pulledAt,
    },
    rationale: `Soft inquiry via ${result.bureau}: FICO ${result.fico}, utilization ${(result.utilization * 100).toFixed(0)}%, ${result.openTradelines} open tradelines`,
  };
}
